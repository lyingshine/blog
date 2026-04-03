const express = require('express')
const router = express.Router()
const { getStatuses, createStatus, deleteStatus, likeStatus } = require('../data/statuses')
const { authMiddleware } = require('../middleware/auth')
const { createNotification, getUnreadCountByUserId } = require('../data/notifications')
const notificationHub = require('../utils/notificationHub')
const pushService = require('../utils/pushService')

// GET /api/statuses - 获取动态列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, cursor } = req.query
    const result = await getStatuses(page, limit, cursor)
    res.json({ success: true, data: result.statuses, hasMore: result.hasMore, nextCursor: result.nextCursor })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取动态失败' })
  }
})

// POST /api/statuses - 发布动态
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '内容不能为空' })
    }
    const newStatus = await createStatus({ content: content.trim(), authorId: req.user.id })
    res.status(201).json({ success: true, data: newStatus })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '发布动态失败' })
  }
})

// DELETE /api/statuses/:id - 删除动态
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const deleted = await deleteStatus(id, req.user.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: '动态未找到或无权限' })
    }
    res.json({ success: true, message: '动态已删除' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '删除动态失败' })
  }
})

// POST /api/statuses/:id/like - 点赞动态
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const updated = await likeStatus(id)
    if (!updated) {
      return res.status(404).json({ success: false, message: '动态未找到' })
    }

    if (updated.author_id && Number(updated.author_id) !== Number(req.user.id)) {
      const notification = await createNotification({
        userId: updated.author_id,
        actorId: req.user.id,
        type: 'status_like',
        title: '收到新的点赞',
        content: `${req.user.username || '有用户'} 点赞了你的动态`,
        link: '/moments'
      })
      const unreadCount = await getUnreadCountByUserId(updated.author_id)
      notificationHub.publish(updated.author_id, notification)
      notificationHub.publishCount(updated.author_id, unreadCount)
      await pushService.sendPushToUser(updated.author_id, {
        id: notification.id,
        title: notification.title || '新消息',
        content: notification.content || '',
        link: notification.link || '/messages'
      })
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '点赞失败' })
  }
})

module.exports = router
