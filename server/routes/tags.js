const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// 获取所有标签
router.get('/', async (req, res) => {
  try {
    const { limit = 50, popular = false } = req.query;

    let query = `
      SELECT 
        t.id, t.name, t.created_at,
        COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      LEFT JOIN articles a ON at.article_id = a.id AND a.status = 'published'
      GROUP BY t.id, t.name, t.created_at
    `;

    if (popular === 'true') {
      query += ' HAVING article_count > 0 ORDER BY article_count DESC';
    } else {
      query += ' ORDER BY t.name ASC';
    }

    query += ` LIMIT ?`;

    const [tags] = await pool.execute(query, [parseInt(limit)]);

    res.json({ tags });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ error: '获取标签失败' });
  }
});

// 根据标签获取文章
router.get('/:tagName/articles', async (req, res) => {
  try {
    const { tagName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取标签下的文章
    const [articles] = await pool.execute(`
      SELECT 
        a.id, a.title, a.excerpt, a.category, a.image, a.featured,
        a.likes, a.views, a.reading_time, a.created_at,
        u.username as author_name, u.avatar as author_avatar,
        GROUP_CONCAT(DISTINCT t2.name) as tags
      FROM articles a
      INNER JOIN article_tags at ON a.id = at.article_id
      INNER JOIN tags t ON at.tag_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN article_tags at2 ON a.id = at2.article_id
      LEFT JOIN tags t2 ON at2.tag_id = t2.id
      WHERE t.name = ? AND a.status = 'published'
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [tagName, parseInt(limit), parseInt(offset)]);

    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      INNER JOIN article_tags at ON a.id = at.article_id
      INNER JOIN tags t ON at.tag_id = t.id
      WHERE t.name = ? AND a.status = 'published'
    `, [tagName]);

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
      tag: tagName,
      articles: processedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取标签文章失败:', error);
    res.status(500).json({ error: '获取标签文章失败' });
  }
});

// 搜索标签
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const [tags] = await pool.execute(`
      SELECT 
        t.id, t.name,
        COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      LEFT JOIN articles a ON at.article_id = a.id AND a.status = 'published'
      WHERE t.name LIKE ?
      GROUP BY t.id, t.name
      ORDER BY article_count DESC, t.name ASC
      LIMIT ?
    `, [`%${query}%`, parseInt(limit)]);

    res.json({ tags });
  } catch (error) {
    console.error('搜索标签失败:', error);
    res.status(500).json({ error: '搜索标签失败' });
  }
});

// 获取标签云数据
router.get('/cloud/data', async (req, res) => {
  try {
    const { limit = 30 } = req.query;

    const [tags] = await pool.execute(`
      SELECT 
        t.name,
        COUNT(at.article_id) as count,
        MAX(a.created_at) as latest_article
      FROM tags t
      INNER JOIN article_tags at ON t.id = at.tag_id
      INNER JOIN articles a ON at.article_id = a.id AND a.status = 'published'
      GROUP BY t.id, t.name
      HAVING count > 0
      ORDER BY count DESC, latest_article DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // 计算权重（用于标签云显示）
    const maxCount = tags.length > 0 ? tags[0].count : 1;
    const tagCloud = tags.map(tag => ({
      name: tag.name,
      count: tag.count,
      weight: Math.ceil((tag.count / maxCount) * 5) // 1-5的权重
    }));

    res.json({ tagCloud });
  } catch (error) {
    console.error('获取标签云数据失败:', error);
    res.status(500).json({ error: '获取标签云数据失败' });
  }
});

module.exports = router;