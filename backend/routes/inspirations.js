const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { pool } = require('../config/database');

// 配置图片上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/inspirations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 9 // 最多9张图片
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 获取灵感列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, user_id, tag } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE i.is_public = 1';
    let queryParams = [];

    if (user_id) {
      if (req.user && req.user.id == user_id) {
        // 查看自己的灵感，可以看到私密的
        whereClause = 'WHERE i.user_id = ?';
      } else {
        whereClause = 'WHERE i.user_id = ? AND i.is_public = 1';
      }
      queryParams.push(user_id);
    }

    if (tag) {
      whereClause += queryParams.length > 0 ? ' AND' : ' WHERE';
      whereClause += ' JSON_CONTAINS(i.tags, ?)';
      queryParams.push(`"${tag}"`);
    }

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM inspirations i 
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取灵感列表
    const query = `
      SELECT 
        i.*,
        u.username,
        u.avatar,
        u.bio,
        ${req.user ? `(SELECT COUNT(*) FROM inspiration_likes il WHERE il.inspiration_id = i.id AND il.user_id = ?) as isLiked` : '0 as isLiked'}
      FROM inspirations i
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = req.user ? [req.user.id, ...queryParams, parseInt(limit), parseInt(offset)] : [...queryParams, parseInt(limit), parseInt(offset)];
    const [inspirations] = await pool.execute(query, finalParams);

    // 处理 JSON 字段
    const processedInspirations = inspirations.map(inspiration => ({
      ...inspiration,
      images: inspiration.images ? JSON.parse(inspiration.images) : [],
      tags: inspiration.tags ? JSON.parse(inspiration.tags) : [],
      isLiked: inspiration.isLiked > 0,
      author: {
        id: inspiration.user_id,
        username: inspiration.username,
        avatar: inspiration.avatar,
        bio: inspiration.bio
      }
    }));

    res.json({
      success: true,
      data: {
        inspirations: processedInspirations,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取灵感列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取灵感列表失败'
    });
  }
});

// 发布灵感
router.post('/', authenticateToken, upload.array('images', 9), async (req, res) => {
  try {
    const { content, tags, location, is_public = true } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '内容不能为空'
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: '内容不能超过2000字符'
      });
    }

    // 处理上传的图片
    const images = req.files ? req.files.map(file => `/uploads/inspirations/${file.filename}`) : [];

    // 处理标签
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [];
      }
    }

    const query = `
      INSERT INTO inspirations (user_id, content, images, tags, location, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(query, [
      req.user.id,
      content.trim(),
      JSON.stringify(images),
      JSON.stringify(parsedTags),
      location || null,
      is_public === 'true' || is_public === true ? 1 : 0
    ]);

    // 获取完整的灵感信息
    const getQuery = `
      SELECT 
        i.*,
        u.username,
        u.avatar,
        u.bio
      FROM inspirations i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `;

    const [inspirationResult] = await pool.execute(getQuery, [result.insertId]);
    const inspiration = inspirationResult[0];

    const responseData = {
      ...inspiration,
      images: inspiration.images ? JSON.parse(inspiration.images) : [],
      tags: inspiration.tags ? JSON.parse(inspiration.tags) : [],
      isLiked: false,
      author: {
        id: inspiration.user_id,
        username: inspiration.username,
        nickname: inspiration.nickname,
        avatar: inspiration.avatar
      }
    };

    res.status(201).json({
      success: true,
      message: '灵感发布成功',
      data: responseData
    });
  } catch (error) {
    console.error('发布灵感失败:', error);
    res.status(500).json({
      success: false,
      message: '发布灵感失败'
    });
  }
});

// 获取单个灵感详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        u.username,
        u.avatar,
        u.bio,
        ${req.user ? `(SELECT COUNT(*) FROM inspiration_likes il WHERE il.inspiration_id = i.id AND il.user_id = ?) as isLiked` : '0 as isLiked'}
      FROM inspirations i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `;

    const params = req.user ? [req.user.id, req.params.id] : [req.params.id];
    const [result] = await pool.execute(query, params);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    const inspiration = result[0];

    // 检查权限
    if (!inspiration.is_public && (!req.user || req.user.id !== inspiration.user_id)) {
      return res.status(403).json({
        success: false,
        message: '无权访问此灵感'
      });
    }

    const responseData = {
      ...inspiration,
      images: inspiration.images ? JSON.parse(inspiration.images) : [],
      tags: inspiration.tags ? JSON.parse(inspiration.tags) : [],
      isLiked: inspiration.isLiked > 0,
      author: {
        id: inspiration.user_id,
        username: inspiration.username,
        nickname: inspiration.nickname,
        avatar: inspiration.avatar
      }
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('获取灵感详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取灵感详情失败'
    });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    // 检查灵感是否存在
    const [inspirationResult] = await pool.execute(
      'SELECT id, likes_count FROM inspirations WHERE id = ?',
      [req.params.id]
    );

    if (inspirationResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    const inspiration = inspirationResult[0];

    // 检查是否已点赞
    const [likeResult] = await pool.execute(
      'SELECT id FROM inspiration_likes WHERE user_id = ? AND inspiration_id = ?',
      [req.user.id, inspiration.id]
    );

    if (likeResult.length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM inspiration_likes WHERE user_id = ? AND inspiration_id = ?',
        [req.user.id, inspiration.id]
      );
      
      await pool.execute(
        'UPDATE inspirations SET likes_count = likes_count - 1 WHERE id = ?',
        [inspiration.id]
      );
      
      res.json({
        success: true,
        message: '取消点赞成功',
        data: { 
          isLiked: false, 
          likes_count: inspiration.likes_count - 1 
        }
      });
    } else {
      // 点赞
      await pool.execute(
        'INSERT INTO inspiration_likes (user_id, inspiration_id, created_at) VALUES (?, ?, NOW())',
        [req.user.id, inspiration.id]
      );
      
      await pool.execute(
        'UPDATE inspirations SET likes_count = likes_count + 1 WHERE id = ?',
        [inspiration.id]
      );
      
      res.json({
        success: true,
        message: '点赞成功',
        data: { 
          isLiked: true, 
          likes_count: inspiration.likes_count + 1 
        }
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞操作失败'
    });
  }
});

// 删除灵感
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'SELECT user_id, images FROM inspirations WHERE id = ?',
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    const inspiration = result[0];

    // 检查权限
    if (inspiration.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此灵感'
      });
    }

    // 删除相关的图片文件
    if (inspiration.images) {
      const images = JSON.parse(inspiration.images);
      images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // 删除灵感（级联删除会自动删除相关的点赞和评论）
    await pool.execute('DELETE FROM inspirations WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除灵感失败:', error);
    res.status(500).json({
      success: false,
      message: '删除灵感失败'
    });
  }
});

module.exports = router;