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
    const processedInspirations = inspirations.map(inspiration => {
      let listImages = [];
      let listTags = [];
      
      // 安全解析 images JSON
      if (inspiration.images) {
        try {
          listImages = typeof inspiration.images === 'string' ? JSON.parse(inspiration.images) : inspiration.images;
        } catch (e) {
          console.warn('解析 images JSON 失败:', e.message);
          listImages = [];
        }
      }
      
      // 安全解析 tags JSON
      if (inspiration.tags) {
        try {
          listTags = typeof inspiration.tags === 'string' ? JSON.parse(inspiration.tags) : inspiration.tags;
        } catch (e) {
          console.warn('解析 tags JSON 失败:', e.message);
          listTags = [];
        }
      }
      
      return {
        ...inspiration,
        images: listImages,
        tags: listTags,
        isLiked: inspiration.isLiked > 0,
        author: {
          id: inspiration.user_id,
          username: inspiration.username,
          avatar: inspiration.avatar,
          bio: inspiration.bio
        }
      };
    });

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
    let processedTags = [];
    if (tags) {
      try {
        processedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        processedTags = [];
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
      JSON.stringify(processedTags),
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

    // 安全解析 JSON 字段
    let parsedImages = [];
    let parsedTags = [];
    
    if (inspiration.images) {
      try {
        parsedImages = typeof inspiration.images === 'string' ? JSON.parse(inspiration.images) : inspiration.images;
      } catch (e) {
        console.warn('解析 images JSON 失败:', e.message);
        parsedImages = [];
      }
    }
    
    if (inspiration.tags) {
      try {
        parsedTags = typeof inspiration.tags === 'string' ? JSON.parse(inspiration.tags) : inspiration.tags;
      } catch (e) {
        console.warn('解析 tags JSON 失败:', e.message);
        parsedTags = [];
      }
    }

    const responseData = {
      ...inspiration,
      images: parsedImages,
      tags: parsedTags,
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
        message: '灵感不存在',
        error: 'INSPIRATION_NOT_FOUND'
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

    // 安全解析 JSON 字段
    let detailImages = [];
    let detailTags = [];
    
    if (inspiration.images) {
      try {
        detailImages = typeof inspiration.images === 'string' ? JSON.parse(inspiration.images) : inspiration.images;
      } catch (e) {
        console.warn('解析 images JSON 失败:', e.message);
        detailImages = [];
      }
    }
    
    if (inspiration.tags) {
      try {
        detailTags = typeof inspiration.tags === 'string' ? JSON.parse(inspiration.tags) : inspiration.tags;
      } catch (e) {
        console.warn('解析 tags JSON 失败:', e.message);
        detailTags = [];
      }
    }

    const responseData = {
      ...inspiration,
      images: detailImages,
      tags: detailTags,
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
    const inspirationId = req.params.id;
    const userId = req.user.id;

    // 使用单个查询检查灵感存在性和当前点赞状态
    const [result] = await pool.execute(`
      SELECT 
        i.id, 
        i.likes_count,
        (SELECT COUNT(*) FROM inspiration_likes il WHERE il.user_id = ? AND il.inspiration_id = i.id) as isLiked
      FROM inspirations i 
      WHERE i.id = ?
    `, [userId, inspirationId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    const inspiration = result[0];
    const currentlyLiked = inspiration.isLiked > 0;

    if (currentlyLiked) {
      // 取消点赞 - 使用单个原子操作
      await pool.execute(`
        DELETE il FROM inspiration_likes il
        WHERE il.user_id = ? AND il.inspiration_id = ?
      `, [userId, inspirationId]);
      
      await pool.execute(`
        UPDATE inspirations 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = ?
      `, [inspirationId]);
      
      res.json({
        success: true,
        message: '取消点赞成功',
        data: { 
          isLiked: false, 
          likes_count: Math.max(inspiration.likes_count - 1, 0)
        }
      });
    } else {
      // 点赞 - 使用 INSERT IGNORE 避免重复
      const [insertResult] = await pool.execute(`
        INSERT IGNORE INTO inspiration_likes (user_id, inspiration_id, created_at) 
        VALUES (?, ?, NOW())
      `, [userId, inspirationId]);
      
      // 只有真正插入了新记录才更新计数
      if (insertResult.affectedRows > 0) {
        await pool.execute(`
          UPDATE inspirations 
          SET likes_count = likes_count + 1 
          WHERE id = ?
        `, [inspirationId]);
        
        res.json({
          success: true,
          message: '点赞成功',
          data: { 
            isLiked: true, 
            likes_count: inspiration.likes_count + 1
          }
        });
      } else {
        // 重复点赞，返回当前状态
        res.json({
          success: true,
          message: '已点赞',
          data: { 
            isLiked: true, 
            likes_count: inspiration.likes_count
          }
        });
      }
    }
    
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞操作失败'
    });
  }
});

// 转发灵感
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { share_content = '' } = req.body;
    const originalInspirationId = req.params.id;

    // 检查原灵感是否存在
    const [originalResult] = await pool.execute(
      'SELECT id, user_id, content, images, tags, location, is_public FROM inspirations WHERE id = ?',
      [originalInspirationId]
    );

    if (originalResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '原灵感不存在'
      });
    }

    const originalInspiration = originalResult[0];

    // 检查是否为公开灵感
    if (!originalInspiration.is_public) {
      return res.status(403).json({
        success: false,
        message: '无法转发私密灵感'
      });
    }

    // 检查转发内容长度
    if (share_content.length > 500) {
      return res.status(400).json({
        success: false,
        message: '转发评论不能超过500字符'
      });
    }

    // 创建转发记录
    const [shareResult] = await pool.execute(`
      INSERT INTO inspiration_shares (user_id, inspiration_id, original_inspiration_id, share_content, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [req.user.id, originalInspirationId, originalInspirationId, share_content.trim() || null]);

    // 更新原灵感的转发数
    await pool.execute(
      'UPDATE inspirations SET shares_count = shares_count + 1 WHERE id = ?',
      [originalInspirationId]
    );

    // 创建新的灵感记录（转发类型）
    const shareInspirationContent = share_content.trim() || `转发了 @${originalInspiration.username || 'unknown'} 的灵感`;
    
    const [newInspirationResult] = await pool.execute(`
      INSERT INTO inspirations (
        user_id, content, images, tags, location, is_public, 
        share_type, original_inspiration_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'share', ?, NOW(), NOW())
    `, [
      req.user.id,
      shareInspirationContent,
      originalInspiration.images,
      originalInspiration.tags,
      originalInspiration.location,
      1, // 转发默认为公开
      originalInspirationId
    ]);

    // 获取完整的转发灵感信息
    const [newInspirationData] = await pool.execute(`
      SELECT 
        i.*,
        u.username, u.avatar, u.bio,
        oi.content as original_content,
        oi.images as original_images,
        oi.tags as original_tags,
        oi.location as original_location,
        oi.likes_count as original_likes_count,
        oi.comments_count as original_comments_count,
        oi.shares_count as original_shares_count,
        oi.created_at as original_created_at,
        ou.username as original_username,
        ou.avatar as original_avatar,
        ou.bio as original_bio
      FROM inspirations i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN inspirations oi ON i.original_inspiration_id = oi.id
      LEFT JOIN users ou ON oi.user_id = ou.id
      WHERE i.id = ?
    `, [newInspirationResult.insertId]);

    const shareData = newInspirationData[0];

    // 处理 JSON 字段
    let shareImages = [];
    let shareTags = [];
    let originalImages = [];
    let originalTags = [];

    try {
      shareImages = shareData.images ? (typeof shareData.images === 'string' ? JSON.parse(shareData.images) : shareData.images) : [];
      shareTags = shareData.tags ? (typeof shareData.tags === 'string' ? JSON.parse(shareData.tags) : shareData.tags) : [];
      originalImages = shareData.original_images ? (typeof shareData.original_images === 'string' ? JSON.parse(shareData.original_images) : shareData.original_images) : [];
      originalTags = shareData.original_tags ? (typeof shareData.original_tags === 'string' ? JSON.parse(shareData.original_tags) : shareData.original_tags) : [];
    } catch (e) {
      console.warn('解析 JSON 字段失败:', e.message);
    }

    const responseData = {
      id: shareData.id,
      content: shareData.content,
      images: shareImages,
      tags: shareTags,
      location: shareData.location,
      is_public: shareData.is_public,
      likes_count: shareData.likes_count,
      comments_count: shareData.comments_count,
      shares_count: shareData.shares_count,
      share_type: shareData.share_type,
      created_at: shareData.created_at,
      updated_at: shareData.updated_at,
      isLiked: false,
      author: {
        id: shareData.user_id,
        username: shareData.username,
        avatar: shareData.avatar,
        bio: shareData.bio
      },
      original_inspiration: {
        id: originalInspirationId,
        content: shareData.original_content,
        images: originalImages,
        tags: originalTags,
        location: shareData.original_location,
        likes_count: shareData.original_likes_count,
        comments_count: shareData.original_comments_count,
        shares_count: shareData.original_shares_count,
        created_at: shareData.original_created_at,
        author: {
          username: shareData.original_username,
          avatar: shareData.original_avatar,
          bio: shareData.original_bio
        }
      }
    };

    res.status(201).json({
      success: true,
      message: '转发成功',
      data: responseData
    });
  } catch (error) {
    console.error('转发灵感失败:', error);
    res.status(500).json({
      success: false,
      message: '转发灵感失败'
    });
  }
});

// 获取灵感的转发列表
router.get('/:id/shares', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const inspirationId = req.params.id;

    // 检查灵感是否存在
    const [inspirationResult] = await pool.execute(
      'SELECT id FROM inspirations WHERE id = ?',
      [inspirationId]
    );

    if (inspirationResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    // 获取转发列表
    const sharesQuery = `
      SELECT 
        s.id, s.share_content, s.created_at,
        u.id as user_id, u.username, u.avatar, u.bio
      FROM inspiration_shares s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.original_inspiration_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [shares] = await pool.execute(sharesQuery, [inspirationId, parseInt(limit), parseInt(offset)]);

    // 获取总转发数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM inspiration_shares WHERE original_inspiration_id = ?',
      [inspirationId]
    );

    const processedShares = shares.map(share => ({
      id: share.id,
      share_content: share.share_content,
      created_at: share.created_at,
      author: {
        id: share.user_id,
        username: share.username,
        avatar: share.avatar,
        bio: share.bio
      }
    }));

    res.json({
      success: true,
      data: {
        shares: processedShares,
        total: countResult[0].total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取转发列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取转发列表失败'
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
        message: '无权删除此灵感',
        error: 'PERMISSION_DENIED'
      });
    }

    // 删除相关的图片文件
    if (inspiration.images) {
      try {
        const images = typeof inspiration.images === 'string' ? JSON.parse(inspiration.images) : inspiration.images;
        if (Array.isArray(images)) {
          images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (e) {
        console.warn('解析图片数据失败:', e.message);
      }
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