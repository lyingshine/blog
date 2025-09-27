const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { fixDatabase, createSampleData } = require('../scripts/fix-database');

const router = express.Router();

// 管理员权限检查中间件
const requireAdmin = async (req, res, next) => {
  try {
    // 检查用户是否存在（暂时允许所有登录用户访问管理功能）
    const [users] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(403).json({ error: '用户不存在' });
    }

    // 可以在这里添加更复杂的权限检查逻辑
    // 比如检查用户角色字段等
    
    next();
  } catch (error) {
    console.error('权限检查失败:', error);
    res.status(500).json({ error: '权限检查失败' });
  }
};

// 获取统计数据
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 获取文章统计
    const [articleStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_articles,
        SUM(views) as total_views,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_articles
      FROM articles
    `);

    // 获取用户统计
    const [userStats] = await pool.execute(`
      SELECT COUNT(*) as total_users FROM users
    `);

    // 获取评论统计
    const [commentStats] = await pool.execute(`
      SELECT COUNT(*) as total_comments FROM comments
    `);

    // 获取灵感统计
    const [inspirationStats] = await pool.execute(`
      SELECT COUNT(*) as total_inspirations FROM inspirations
    `);

    // 获取今日新增统计
    const [todayStats] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_articles,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_users
      FROM (
        SELECT created_at FROM articles
        UNION ALL
        SELECT created_at FROM users
      ) as combined
    `);

    const stats = {
      articles: articleStats[0].total_articles || 0,
      users: userStats[0].total_users || 0,
      comments: commentStats[0].total_comments || 0,
      inspirations: inspirationStats[0].total_inspirations || 0,
      views: articleStats[0].total_views || 0,
      published: articleStats[0].published_articles || 0,
      drafts: articleStats[0].draft_articles || 0,
      todayArticles: todayStats[0].today_articles || 0,
      todayUsers: todayStats[0].today_users || 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取所有文章（管理员视图）
router.get('/articles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (status && status !== 'all') {
      whereClause += ' WHERE a.status = ?';
      queryParams.push(status);
    }

    if (search) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ' (a.title LIKE ? OR a.content LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [articles] = await pool.execute(`
      SELECT 
        a.id, a.title, a.excerpt, a.status, a.featured, a.views, a.likes,
        a.created_at, a.updated_at,
        u.username as author_name, u.avatar as author_avatar
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `, queryParams);

    const formattedArticles = articles.map(article => ({
      ...article,
      author: {
        name: article.author_name,
        avatar: article.author_avatar
      }
    }));

    res.json({
      articles: formattedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ error: '获取文章列表失败' });
  }
});

// 更新文章状态
router.put('/articles/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    await pool.execute(
      'UPDATE articles SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    res.json({ message: '文章状态更新成功' });
  } catch (error) {
    console.error('更新文章状态失败:', error);
    res.status(500).json({ error: '更新文章状态失败' });
  }
});

// 删除文章
router.delete('/articles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查文章是否存在
    const [articles] = await pool.execute(
      'SELECT id FROM articles WHERE id = ?',
      [id]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 删除相关数据
    await pool.execute('DELETE FROM article_tags WHERE article_id = ?', [id]);
    await pool.execute('DELETE FROM article_likes WHERE article_id = ?', [id]);
    await pool.execute('DELETE FROM article_views WHERE article_id = ?', [id]);
    await pool.execute('DELETE FROM comments WHERE article_id = ?', [id]);
    await pool.execute('DELETE FROM articles WHERE id = ?', [id]);

    res.json({ message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ error: '删除文章失败' });
  }
});

// 获取所有用户（管理员视图）
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = ' WHERE u.username LIKE ? OR u.email LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.email, u.avatar, u.bio, u.created_at,
        COUNT(a.id) as article_count
      FROM users u
      LEFT JOIN articles a ON u.id = a.author_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM users u ${whereClause}
    `, queryParams);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取用户详情
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.email, u.avatar, u.bio, u.created_at,
        COUNT(DISTINCT a.id) as article_count,
        COUNT(DISTINCT c.id) as comment_count,
        SUM(a.views) as total_views,
        SUM(a.likes) as total_likes
      FROM users u
      LEFT JOIN articles a ON u.id = a.author_id
      LEFT JOIN comments c ON u.id = c.author_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户最近的文章
    const [recentArticles] = await pool.execute(`
      SELECT id, title, status, views, likes, created_at
      FROM articles
      WHERE author_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    const userDetail = {
      ...users[0],
      recentArticles
    };

    res.json({ user: userDetail });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// 初始化数据库
router.post('/init-database', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await fixDatabase();
    res.json({ message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    res.status(500).json({ error: '数据库初始化失败' });
  }
});

// 创建示例数据
router.post('/sample-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await createSampleData();
    res.json({ message: '示例数据创建成功' });
  } catch (error) {
    console.error('创建示例数据失败:', error);
    res.status(500).json({ error: '创建示例数据失败' });
  }
});

// 获取系统信息
router.get('/system-info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 数据库连接状态
    let dbStatus = 'connected';
    try {
      await pool.execute('SELECT 1');
    } catch (error) {
      dbStatus = 'disconnected';
    }

    // 获取数据库大小信息
    const [dbSize] = await pool.execute(`
      SELECT 
        table_schema as 'database_name',
        SUM(data_length + index_length) / 1024 / 1024 as 'size_mb'
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      GROUP BY table_schema
    `);

    // 获取表信息
    const [tables] = await pool.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'size_mb'
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
    `);

    const systemInfo = {
      server: {
        status: 'online',
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      },
      database: {
        status: dbStatus,
        size: dbSize[0]?.size_mb || 0,
        tables: tables
      }
    };

    res.json({ systemInfo });
  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({ error: '获取系统信息失败' });
  }
});

// 清理系统缓存
router.post('/clear-cache', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 这里可以添加清理缓存的逻辑
    // 比如清理文件缓存、Redis缓存等
    
    res.json({ message: '缓存清理成功' });
  } catch (error) {
    console.error('清理缓存失败:', error);
    res.status(500).json({ error: '清理缓存失败' });
  }
});

// 获取操作日志
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const offset = (page - 1) * limit;

    // 这里可以从日志表或文件中获取操作日志
    // 暂时返回模拟数据
    const logs = [
      {
        id: 1,
        type: 'article',
        action: 'create',
        user: 'admin',
        description: '创建了新文章',
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: logs.length,
        pages: Math.ceil(logs.length / limit)
      }
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ error: '获取操作日志失败' });
  }
});

module.exports = router;