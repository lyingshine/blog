const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取用户列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereCondition = '';
    let queryParams = [];

    if (search) {
      whereCondition = 'WHERE username LIKE ? OR email LIKE ?';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // 获取用户列表（不包含密码）
    const usersQuery = `
      SELECT 
        u.id, u.username, u.email, u.avatar, u.created_at,
        COUNT(a.id) as article_count
      FROM users u
      LEFT JOIN articles a ON u.id = a.author_id AND a.status = 'published'
      ${whereCondition}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const [users] = await pool.execute(usersQuery, queryParams);

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereCondition}`;
    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取用户详情
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.email, u.avatar, u.created_at,
        COUNT(a.id) as article_count,
        SUM(a.likes) as total_likes,
        SUM(a.views) as total_views
      FROM users u
      LEFT JOIN articles a ON u.id = a.author_id AND a.status = 'published'
      WHERE u.username = ?
      GROUP BY u.id
    `, [username]);

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = users[0];

    // 获取用户最近的文章
    const [recentArticles] = await pool.execute(`
      SELECT id, title, excerpt, category, created_at, likes, views
      FROM articles
      WHERE author_id = ? AND status = 'published'
      ORDER BY created_at DESC
      LIMIT 5
    `, [user.id]);

    res.json({
      user: {
        ...user,
        total_likes: user.total_likes || 0,
        total_views: user.total_views || 0,
        recent_articles: recentArticles
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// 获取用户统计信息
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;

    // 获取用户ID
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const userId = users[0].id;

    // 获取统计数据
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        SUM(CASE WHEN status = 'published' THEN likes ELSE 0 END) as total_likes,
        SUM(CASE WHEN status = 'published' THEN views ELSE 0 END) as total_views,
        AVG(CASE WHEN status = 'published' THEN reading_time ELSE NULL END) as avg_reading_time
      FROM articles
      WHERE author_id = ?
    `, [userId]);

    // 获取分类统计
    const [categoryStats] = await pool.execute(`
      SELECT category, COUNT(*) as count
      FROM articles
      WHERE author_id = ? AND status = 'published' AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `, [userId]);

    // 获取月度发布统计（最近12个月）
    const [monthlyStats] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM articles
      WHERE author_id = ? AND status = 'published'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `, [userId]);

    res.json({
      overview: {
        published_count: stats[0].published_count || 0,
        draft_count: stats[0].draft_count || 0,
        total_likes: stats[0].total_likes || 0,
        total_views: stats[0].total_views || 0,
        avg_reading_time: Math.round(stats[0].avg_reading_time || 0)
      },
      categories: categoryStats,
      monthly: monthlyStats
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取用户统计失败' });
  }
});

module.exports = router;