const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取文章列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      featured,
      status = 'published',
      search,
      author,
      includeDeleted = false
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['a.status = ?'];
    let queryParams = [status];

    // 默认不包含已删除的文章
    if (!includeDeleted || includeDeleted === 'false') {
      whereConditions.push('a.deleted_at IS NULL');
    }

    // 构建查询条件
    if (category && category !== '全部') {
      whereConditions.push('a.category = ?');
      queryParams.push(category);
    }

    if (featured === 'true') {
      whereConditions.push('a.featured = 1');
    }

    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (author) {
      whereConditions.push('u.username = ?');
      queryParams.push(author);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取文章列表
    const articlesQuery = `
      SELECT 
        a.id, a.title, a.excerpt, a.category, a.image, a.featured,
        a.likes, a.views, a.reading_time, a.created_at, a.updated_at,
        u.username as author_name, u.avatar as author_avatar,
        GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const [articles] = await pool.execute(articlesQuery, queryParams);

    // 获取总数
    const countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    // 处理文章数据
    const processedArticles = articles.map(article => ({
      ...article,
      tags: article.tags ? article.tags.split(',') : [],
      author: {
        name: article.author_name,
        avatar: article.author_avatar
      }
    }));

    res.json({
      articles: processedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ error: '获取文章列表失败' });
  }
});

// 获取单篇文章
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const articleId = req.params.id;

    // 获取文章详情
    const [articles] = await pool.execute(`
      SELECT 
        a.*,
        u.username as author_name, u.avatar as author_avatar, u.email as author_email,
        GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.id = ? AND a.deleted_at IS NULL
      GROUP BY a.id
    `, [articleId]);

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    const article = articles[0];

    // 检查用户是否点赞
    let isLiked = false;
    if (req.user) {
      const [likes] = await pool.execute(
        'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
        [articleId, req.user.id]
      );
      isLiked = likes.length > 0;
    }

    // 增加浏览量（简单实现）
    await pool.execute(
      'UPDATE articles SET views = views + 1 WHERE id = ?',
      [articleId]
    );

    // 处理文章数据
    const processedArticle = {
      ...article,
      tags: article.tags ? article.tags.split(',') : [],
      author: {
        name: article.author_name,
        avatar: article.author_avatar,
        email: article.author_email
      },
      isLiked
    };

    res.json({ article: processedArticle });
  } catch (error) {
    console.error('获取文章失败:', error);
    res.status(500).json({ error: '获取文章失败' });
  }
});

// 创建文章
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      title, excerpt, content, category, image, tags = [], featured = false, status = 'draft'
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    // 计算阅读时间
    const readingTime = Math.ceil(content.split(/\s+/).length / 200);

    // 创建文章
    const [articleResult] = await connection.execute(`
      INSERT INTO articles (title, excerpt, content, category, image, featured, status, reading_time, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, excerpt, content, category, image, featured, status, readingTime, req.user.id]);

    const articleId = articleResult.insertId;

    // 处理标签
    if (tags.length > 0) {
      for (const tagName of tags) {
        if (tagName.trim()) {
          // 插入或获取标签
          const [tagResult] = await connection.execute(
            'INSERT IGNORE INTO tags (name) VALUES (?)',
            [tagName.trim()]
          );

          let tagId;
          if (tagResult.insertId) {
            tagId = tagResult.insertId;
          } else {
            const [existingTag] = await connection.execute(
              'SELECT id FROM tags WHERE name = ?',
              [tagName.trim()]
            );
            tagId = existingTag[0].id;
          }

          // 关联文章和标签
          await connection.execute(
            'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
            [articleId, tagId]
          );
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      message: '文章创建成功',
      articleId
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建文章失败:', error);
    res.status(500).json({ error: '创建文章失败' });
  } finally {
    connection.release();
  }
});

// 更新文章
router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const articleId = req.params.id;
    const {
      title, excerpt, content, category, image, tags = [], featured = false, status
    } = req.body;

    // 检查文章是否存在且属于当前用户
    const [articles] = await connection.execute(
      'SELECT author_id FROM articles WHERE id = ?',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (articles[0].author_id !== req.user.id) {
      return res.status(403).json({ error: '无权限编辑此文章' });
    }

    // 计算阅读时间
    const readingTime = content ? Math.ceil(content.split(/\s+/).length / 200) : null;

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (excerpt !== undefined) {
      updateFields.push('excerpt = ?');
      updateValues.push(excerpt);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
      if (readingTime) {
        updateFields.push('reading_time = ?');
        updateValues.push(readingTime);
      }
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image);
    }
    if (featured !== undefined) {
      updateFields.push('featured = ?');
      updateValues.push(featured);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length > 0) {
      updateValues.push(articleId);
      await connection.execute(
        `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // 更新标签
    if (tags !== undefined) {
      // 删除现有标签关联
      await connection.execute(
        'DELETE FROM article_tags WHERE article_id = ?',
        [articleId]
      );

      // 添加新标签
      for (const tagName of tags) {
        if (tagName.trim()) {
          const [tagResult] = await connection.execute(
            'INSERT IGNORE INTO tags (name) VALUES (?)',
            [tagName.trim()]
          );

          let tagId;
          if (tagResult.insertId) {
            tagId = tagResult.insertId;
          } else {
            const [existingTag] = await connection.execute(
              'SELECT id FROM tags WHERE name = ?',
              [tagName.trim()]
            );
            tagId = existingTag[0].id;
          }

          await connection.execute(
            'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
            [articleId, tagId]
          );
        }
      }
    }

    await connection.commit();

    res.json({ message: '文章更新成功' });
  } catch (error) {
    await connection.rollback();
    console.error('更新文章失败:', error);
    res.status(500).json({ error: '更新文章失败' });
  } finally {
    connection.release();
  }
});

// 软删除文章（移到回收站）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const articleId = req.params.id;

    // 检查文章是否存在且属于当前用户
    const [articles] = await pool.execute(
      'SELECT author_id, deleted_at FROM articles WHERE id = ?',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (articles[0].author_id !== req.user.id) {
      return res.status(403).json({ error: '无权限删除此文章' });
    }

    if (articles[0].deleted_at) {
      return res.status(400).json({ error: '文章已在回收站中' });
    }

    // 软删除文章（移到回收站）
    await pool.execute(
      'UPDATE articles SET deleted_at = NOW() WHERE id = ?',
      [articleId]
    );

    res.json({ message: '文章已移到回收站' });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ error: '删除文章失败' });
  }
});

// 获取回收站文章列表
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['a.deleted_at IS NOT NULL', 'a.author_id = ?'];
    let queryParams = [req.user.id];

    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.excerpt LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // 获取回收站文章列表
    const articlesQuery = `
      SELECT 
        a.id, a.title, a.excerpt, a.category, a.image, a.featured,
        a.likes, a.views, a.reading_time, a.status, a.created_at, a.deleted_at,
        u.username as author_name, u.avatar as author_avatar,
        GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.deleted_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const [articles] = await pool.execute(articlesQuery, queryParams);

    // 获取总数
    const countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      ${whereClause}
    `;

    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    // 处理文章数据
    const processedArticles = articles.map(article => ({
      ...article,
      tags: article.tags ? article.tags.split(',') : [],
      author: {
        name: article.author_name,
        avatar: article.author_avatar
      }
    }));

    res.json({
      articles: processedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取回收站文章失败:', error);
    res.status(500).json({ error: '获取回收站文章失败' });
  }
});

// 从回收站恢复文章
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const articleId = req.params.id;

    // 检查文章是否存在且属于当前用户
    const [articles] = await pool.execute(
      'SELECT author_id, deleted_at FROM articles WHERE id = ?',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (articles[0].author_id !== req.user.id) {
      return res.status(403).json({ error: '无权限恢复此文章' });
    }

    if (!articles[0].deleted_at) {
      return res.status(400).json({ error: '文章不在回收站中' });
    }

    // 恢复文章
    await pool.execute(
      'UPDATE articles SET deleted_at = NULL WHERE id = ?',
      [articleId]
    );

    res.json({ message: '文章恢复成功' });
  } catch (error) {
    console.error('恢复文章失败:', error);
    res.status(500).json({ error: '恢复文章失败' });
  }
});

// 永久删除文章
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const articleId = req.params.id;

    // 检查文章是否存在且属于当前用户
    const [articles] = await pool.execute(
      'SELECT author_id, deleted_at FROM articles WHERE id = ?',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (articles[0].author_id !== req.user.id) {
      return res.status(403).json({ error: '无权限删除此文章' });
    }

    if (!articles[0].deleted_at) {
      return res.status(400).json({ error: '只能永久删除回收站中的文章' });
    }

    // 永久删除文章（级联删除相关数据）
    await pool.execute('DELETE FROM articles WHERE id = ?', [articleId]);

    res.json({ message: '文章永久删除成功' });
  } catch (error) {
    console.error('永久删除文章失败:', error);
    res.status(500).json({ error: '永久删除文章失败' });
  }
});

// 清空回收站
router.delete('/trash/clear', authenticateToken, async (req, res) => {
  try {
    // 永久删除当前用户回收站中的所有文章
    await pool.execute(
      'DELETE FROM articles WHERE author_id = ? AND deleted_at IS NOT NULL',
      [req.user.id]
    );

    res.json({ message: '回收站清空成功' });
  } catch (error) {
    console.error('清空回收站失败:', error);
    res.status(500).json({ error: '清空回收站失败' });
  }
});

// 切换文章点赞状态
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;

    // 检查是否已点赞
    const [existingLike] = await pool.execute(
      'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
      [articleId, userId]
    );

    let isLiked;
    if (existingLike.length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM article_likes WHERE article_id = ? AND user_id = ?',
        [articleId, userId]
      );
      await pool.execute(
        'UPDATE articles SET likes = GREATEST(0, likes - 1) WHERE id = ?',
        [articleId]
      );
      isLiked = false;
    } else {
      // 添加点赞
      await pool.execute(
        'INSERT INTO article_likes (article_id, user_id) VALUES (?, ?)',
        [articleId, userId]
      );
      await pool.execute(
        'UPDATE articles SET likes = likes + 1 WHERE id = ?',
        [articleId]
      );
      isLiked = true;
    }

    // 获取最新点赞数
    const [articleResult] = await pool.execute(
      'SELECT likes FROM articles WHERE id = ?',
      [articleId]
    );

    res.json({
      isLiked,
      totalLikes: articleResult[0].likes
    });
  } catch (error) {
    console.error('切换点赞状态失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 获取用户的文章
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let statusCondition = "a.status = 'published'";
    
    // 如果是查看自己的文章，可以看到草稿
    if (req.user && req.user.username === username && status) {
      statusCondition = `a.status = '${status}'`;
    }

    const [articles] = await pool.execute(`
      SELECT 
        a.id, a.title, a.excerpt, a.category, a.image, a.featured,
        a.likes, a.views, a.reading_time, a.status, a.created_at,
        GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE u.username = ? AND ${statusCondition}
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [username, parseInt(limit), parseInt(offset)]);

    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(a.id) as total
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE u.username = ? AND ${statusCondition}
    `, [username]);

    const total = countResult[0].total;

    const processedArticles = articles.map(article => ({
      ...article,
      tags: article.tags ? article.tags.split(',') : []
    }));

    res.json({
      articles: processedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户文章失败:', error);
    res.status(500).json({ error: '获取用户文章失败' });
  }
});

module.exports = router;