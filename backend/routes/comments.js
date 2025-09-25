const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取文章的评论列表
router.get('/article/:articleId', optionalAuth, async (req, res) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    // 构建排序条件
    let orderBy = 'c.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'c.created_at ASC';
    } else if (sort === 'likes') {
      orderBy = 'c.likes DESC, c.created_at DESC';
    }

    // 获取评论列表（只获取顶级评论）
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.likes, c.created_at, c.updated_at,
        u.username as author_name, u.avatar as author_avatar,
        COUNT(replies.id) as reply_count
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comments replies ON c.id = replies.parent_id AND replies.status = 'approved'
      WHERE c.article_id = ? AND c.parent_id IS NULL AND c.status = 'approved'
      GROUP BY c.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [comments] = await pool.execute(commentsQuery, [articleId, parseInt(limit), parseInt(offset)]);

    // 获取用户对评论的点赞状态
    const processedComments = [];
    for (const comment of comments) {
      let isLiked = false;
      if (req.user) {
        const [likes] = await pool.execute(
          'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
          [comment.id, req.user.id]
        );
        isLiked = likes.length > 0;
      }

      processedComments.push({
        ...comment,
        isLiked,
        author: {
          name: comment.author_name,
          avatar: comment.author_avatar || '/default-avatar.png'
        }
      });
    }

    // 获取总评论数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE article_id = ? AND parent_id IS NULL AND status = ?',
      [articleId, 'approved']
    );

    res.json({
      comments: processedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
});

// 获取评论的回复列表
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取回复列表
    const repliesQuery = `
      SELECT 
        c.id, c.content, c.likes, c.created_at, c.updated_at,
        u.username as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ? AND c.status = 'approved'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const [replies] = await pool.execute(repliesQuery, [commentId, parseInt(limit), parseInt(offset)]);

    // 获取用户对回复的点赞状态
    const processedReplies = [];
    for (const reply of replies) {
      let isLiked = false;
      if (req.user) {
        const [likes] = await pool.execute(
          'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
          [reply.id, req.user.id]
        );
        isLiked = likes.length > 0;
      }

      processedReplies.push({
        ...reply,
        isLiked,
        author: {
          name: reply.author_name,
          avatar: reply.author_avatar || '/default-avatar.png'
        }
      });
    }

    // 获取总回复数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE parent_id = ? AND status = ?',
      [commentId, 'approved']
    );

    res.json({
      replies: processedReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取回复失败:', error);
    res.status(500).json({ error: '获取回复失败' });
  }
});

// 创建评论
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { articleId, content, parentId = null } = req.body;

    if (!articleId || !content) {
      return res.status(400).json({ error: '文章ID和评论内容不能为空' });
    }

    if (content.trim().length < 1) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: '评论内容不能超过1000字符' });
    }

    // 检查文章是否存在
    const [articles] = await pool.execute(
      'SELECT id FROM articles WHERE id = ? AND status = ? AND deleted_at IS NULL',
      [articleId, 'published']
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: '文章不存在或不可评论' });
    }

    // 如果是回复，检查父评论是否存在
    if (parentId) {
      const [parentComments] = await pool.execute(
        'SELECT id FROM comments WHERE id = ? AND article_id = ? AND status = ?',
        [parentId, articleId, 'approved']
      );

      if (parentComments.length === 0) {
        return res.status(404).json({ error: '父评论不存在' });
      }
    }

    // 创建评论（默认状态为待审核）
    const [result] = await pool.execute(`
      INSERT INTO comments (article_id, user_id, parent_id, content, status)
      VALUES (?, ?, ?, ?, 'approved')
    `, [articleId, req.user.id, parentId, content.trim()]);

    // 获取创建的评论详情
    const [newComment] = await pool.execute(`
      SELECT 
        c.id, c.content, c.likes, c.created_at,
        u.username as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    const comment = newComment[0];

    res.status(201).json({
      message: '评论发布成功',
      comment: {
        ...comment,
        isLiked: false,
        author: {
          name: comment.author_name,
          avatar: comment.author_avatar || '/default-avatar.png'
        }
      }
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({ error: '创建评论失败' });
  }
});

// 切换评论点赞状态
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // 检查评论是否存在
    const [comments] = await pool.execute(
      'SELECT id FROM comments WHERE id = ? AND status = ?',
      [commentId, 'approved']
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 检查是否已点赞
    const [existingLike] = await pool.execute(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    let isLiked;
    if (existingLike.length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );
      await pool.execute(
        'UPDATE comments SET likes = GREATEST(0, likes - 1) WHERE id = ?',
        [commentId]
      );
      isLiked = false;
    } else {
      // 添加点赞
      await pool.execute(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [commentId, userId]
      );
      await pool.execute(
        'UPDATE comments SET likes = likes + 1 WHERE id = ?',
        [commentId]
      );
      isLiked = true;
    }

    // 获取最新点赞数
    const [commentResult] = await pool.execute(
      'SELECT likes FROM comments WHERE id = ?',
      [commentId]
    );

    res.json({
      isLiked,
      totalLikes: commentResult[0].likes
    });
  } catch (error) {
    console.error('切换评论点赞状态失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// 删除评论（软删除）
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // 检查评论是否存在且属于当前用户
    const [comments] = await pool.execute(
      'SELECT user_id FROM comments WHERE id = ? AND status != ?',
      [commentId, 'rejected']
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (comments[0].user_id !== req.user.id) {
      return res.status(403).json({ error: '无权限删除此评论' });
    }

    // 软删除评论（将状态设为rejected）
    await pool.execute(
      'UPDATE comments SET status = ? WHERE id = ?',
      ['rejected', commentId]
    );

    res.json({ message: '评论删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
});

// 更新评论
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: '评论内容不能超过1000字符' });
    }

    // 检查评论是否存在且属于当前用户
    const [comments] = await pool.execute(
      'SELECT user_id, created_at FROM comments WHERE id = ? AND status = ?',
      [commentId, 'approved']
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (comments[0].user_id !== req.user.id) {
      return res.status(403).json({ error: '无权限编辑此评论' });
    }

    // 检查是否在允许编辑的时间内（15分钟内）
    const createdAt = new Date(comments[0].created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 15) {
      return res.status(403).json({ error: '评论发布超过15分钟后不能编辑' });
    }

    // 更新评论
    await pool.execute(
      'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content.trim(), commentId]
    );

    res.json({ message: '评论更新成功' });
  } catch (error) {
    console.error('更新评论失败:', error);
    res.status(500).json({ error: '更新评论失败' });
  }
});

// 获取用户的评论列表
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 获取用户评论列表
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.likes, c.created_at,
        a.id as article_id, a.title as article_title,
        u.username as author_name, u.avatar as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE u.username = ? AND c.status = 'approved' AND a.status = 'published' AND a.deleted_at IS NULL
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [comments] = await pool.execute(commentsQuery, [username, parseInt(limit), parseInt(offset)]);

    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE u.username = ? AND c.status = 'approved' AND a.status = 'published' AND a.deleted_at IS NULL
    `, [username]);

    const processedComments = comments.map(comment => ({
      ...comment,
      author: {
        name: comment.author_name,
        avatar: comment.author_avatar || '/default-avatar.png'
      },
      article: {
        id: comment.article_id,
        title: comment.article_title
      }
    }));

    res.json({
      comments: processedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户评论失败:', error);
    res.status(500).json({ error: '获取用户评论失败' });
  }
});

module.exports = router;