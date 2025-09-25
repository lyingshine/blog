const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { pool } = require('../config/database');

// 获取灵感的评论列表
router.get('/:inspirationId', optionalAuth, async (req, res) => {
  try {
    const { inspirationId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

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

    // 构建排序条件
    let orderBy = 'ic.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'ic.created_at ASC';
    } else if (sort === 'likes') {
      orderBy = 'ic.likes_count DESC, ic.created_at DESC';
    }

    // 获取评论列表（只获取顶级评论）
    const commentsQuery = `
      SELECT 
        ic.id, ic.content, ic.likes_count, ic.created_at, ic.updated_at,
        u.id as user_id, u.username, u.avatar, u.bio,
        COUNT(replies.id) as reply_count,
        ${req.user ? `(SELECT COUNT(*) FROM inspiration_comment_likes icl WHERE icl.comment_id = ic.id AND icl.user_id = ?) as isLiked` : '0 as isLiked'}
      FROM inspiration_comments ic
      LEFT JOIN users u ON ic.user_id = u.id
      LEFT JOIN inspiration_comments replies ON ic.id = replies.parent_id
      WHERE ic.inspiration_id = ? AND ic.parent_id IS NULL
      GROUP BY ic.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams = req.user 
      ? [req.user.id, inspirationId, parseInt(limit), parseInt(offset)]
      : [inspirationId, parseInt(limit), parseInt(offset)];

    const [comments] = await pool.execute(commentsQuery, queryParams);

    // 处理评论数据
    const processedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      likes_count: comment.likes_count,
      reply_count: comment.reply_count,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      isLiked: comment.isLiked > 0,
      author: {
        id: comment.user_id,
        username: comment.username,
        avatar: comment.avatar,
        bio: comment.bio
      }
    }));

    // 获取总评论数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM inspiration_comments WHERE inspiration_id = ? AND parent_id IS NULL',
      [inspirationId]
    );

    res.json({
      success: true,
      data: {
        comments: processedComments,
        total: countResult[0].total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评论失败'
    });
  }
});

// 获取评论的回复列表
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 检查父评论是否存在
    const [parentResult] = await pool.execute(
      'SELECT id FROM inspiration_comments WHERE id = ?',
      [commentId]
    );

    if (parentResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 获取回复列表
    const repliesQuery = `
      SELECT 
        ic.id, ic.content, ic.likes_count, ic.created_at, ic.updated_at,
        u.id as user_id, u.username, u.avatar, u.bio,
        ${req.user ? `(SELECT COUNT(*) FROM inspiration_comment_likes icl WHERE icl.comment_id = ic.id AND icl.user_id = ?) as isLiked` : '0 as isLiked'}
      FROM inspiration_comments ic
      LEFT JOIN users u ON ic.user_id = u.id
      WHERE ic.parent_id = ?
      ORDER BY ic.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const queryParams = req.user 
      ? [req.user.id, commentId, parseInt(limit), parseInt(offset)]
      : [commentId, parseInt(limit), parseInt(offset)];

    const [replies] = await pool.execute(repliesQuery, queryParams);

    // 处理回复数据
    const processedReplies = replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      likes_count: reply.likes_count,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
      isLiked: reply.isLiked > 0,
      author: {
        id: reply.user_id,
        username: reply.username,
        avatar: reply.avatar,
        bio: reply.bio
      }
    }));

    // 获取总回复数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM inspiration_comments WHERE parent_id = ?',
      [commentId]
    );

    res.json({
      success: true,
      data: {
        replies: processedReplies,
        total: countResult[0].total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('获取回复失败:', error);
    res.status(500).json({
      success: false,
      message: '获取回复失败'
    });
  }
});

// 创建评论
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { inspiration_id, content, parent_id = null } = req.body;

    if (!inspiration_id || !content) {
      return res.status(400).json({
        success: false,
        message: '灵感ID和评论内容不能为空'
      });
    }

    if (content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过500字符'
      });
    }

    // 检查灵感是否存在
    const [inspirationResult] = await pool.execute(
      'SELECT id FROM inspirations WHERE id = ?',
      [inspiration_id]
    );

    if (inspirationResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '灵感不存在'
      });
    }

    // 如果是回复，检查父评论是否存在
    if (parent_id) {
      const [parentResult] = await pool.execute(
        'SELECT id FROM inspiration_comments WHERE id = ? AND inspiration_id = ?',
        [parent_id, inspiration_id]
      );

      if (parentResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: '父评论不存在'
        });
      }
    }

    // 创建评论
    const [result] = await pool.execute(`
      INSERT INTO inspiration_comments (inspiration_id, user_id, parent_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [inspiration_id, req.user.id, parent_id, content.trim()]);

    // 更新灵感的评论数
    await pool.execute(
      'UPDATE inspirations SET comments_count = comments_count + 1 WHERE id = ?',
      [inspiration_id]
    );

    // 获取创建的评论详情
    const [newCommentResult] = await pool.execute(`
      SELECT 
        ic.id, ic.content, ic.likes_count, ic.created_at, ic.updated_at,
        u.id as user_id, u.username, u.avatar, u.bio
      FROM inspiration_comments ic
      LEFT JOIN users u ON ic.user_id = u.id
      WHERE ic.id = ?
    `, [result.insertId]);

    const comment = newCommentResult[0];

    const responseData = {
      id: comment.id,
      content: comment.content,
      likes_count: comment.likes_count,
      reply_count: 0,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      isLiked: false,
      author: {
        id: comment.user_id,
        username: comment.username,
        avatar: comment.avatar,
        bio: comment.bio
      }
    };

    res.status(201).json({
      success: true,
      message: '评论发布成功',
      data: responseData
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({
      success: false,
      message: '创建评论失败'
    });
  }
});

// 点赞/取消点赞评论
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // 检查评论是否存在
    const [commentResult] = await pool.execute(
      'SELECT id, likes_count FROM inspiration_comments WHERE id = ?',
      [commentId]
    );

    if (commentResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const comment = commentResult[0];

    // 检查是否已点赞
    const [likeResult] = await pool.execute(
      'SELECT id FROM inspiration_comment_likes WHERE user_id = ? AND comment_id = ?',
      [req.user.id, commentId]
    );

    if (likeResult.length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM inspiration_comment_likes WHERE user_id = ? AND comment_id = ?',
        [req.user.id, commentId]
      );
      
      await pool.execute(
        'UPDATE inspiration_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
        [commentId]
      );
      
      res.json({
        success: true,
        message: '取消点赞成功',
        data: { 
          isLiked: false, 
          likes_count: Math.max(0, comment.likes_count - 1)
        }
      });
    } else {
      // 点赞
      await pool.execute(
        'INSERT INTO inspiration_comment_likes (user_id, comment_id, created_at) VALUES (?, ?, NOW())',
        [req.user.id, commentId]
      );
      
      await pool.execute(
        'UPDATE inspiration_comments SET likes_count = likes_count + 1 WHERE id = ?',
        [commentId]
      );
      
      res.json({
        success: true,
        message: '点赞成功',
        data: { 
          isLiked: true, 
          likes_count: comment.likes_count + 1 
        }
      });
    }
  } catch (error) {
    console.error('评论点赞操作失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞操作失败'
    });
  }
});

// 删除评论
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // 检查评论是否存在且属于当前用户
    const [commentResult] = await pool.execute(
      'SELECT user_id, inspiration_id FROM inspiration_comments WHERE id = ?',
      [commentId]
    );

    if (commentResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const comment = commentResult[0];

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }

    // 删除评论（级联删除会自动删除回复和点赞）
    await pool.execute('DELETE FROM inspiration_comments WHERE id = ?', [commentId]);

    // 更新灵感的评论数
    await pool.execute(
      'UPDATE inspirations SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?',
      [comment.inspiration_id]
    );

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败'
    });
  }
});

// 更新评论
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过500字符'
      });
    }

    // 检查评论是否存在且属于当前用户
    const [commentResult] = await pool.execute(
      'SELECT user_id, created_at FROM inspiration_comments WHERE id = ?',
      [commentId]
    );

    if (commentResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const comment = commentResult[0];

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权编辑此评论'
      });
    }

    // 检查是否在允许编辑的时间内（15分钟内）
    const createdAt = new Date(comment.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 15) {
      return res.status(403).json({
        success: false,
        message: '评论发布超过15分钟后不能编辑'
      });
    }

    // 更新评论
    await pool.execute(
      'UPDATE inspiration_comments SET content = ?, updated_at = NOW() WHERE id = ?',
      [content.trim(), commentId]
    );

    res.json({
      success: true,
      message: '评论更新成功'
    });
  } catch (error) {
    console.error('更新评论失败:', error);
    res.status(500).json({
      success: false,
      message: '更新评论失败'
    });
  }
});

module.exports = router;