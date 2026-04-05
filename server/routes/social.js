const express = require('express')
const router = express.Router()
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth')
const { generateDiscoveryRecommendations } = require('../utils/recommendation')
const {
  normalizeTargetType,
  normalizeTargetId,
  ensureTargetExists,
  getTargetAuthorId,
  setReaction,
  getEngagementByTarget,
  getEngagementBatch,
  getComments,
  createComment,
  createShare,
  createReport,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowStats,
  getFollowingList,
  getFollowersList,
  getFollowStateBatch,
  sendPrivateMessage,
  getPrivateMessages,
  markMessagesAsRead,
  getConversations
} = require('../data/social')
const { createNotification, getUnreadCountByUserId } = require('../data/notifications')
const notificationHub = require('../utils/notificationHub')
const pushService = require('../utils/pushService')

async function publishSocialNotification(userId, notificationPayload, pushPayload) {
  const notification = await createNotification({
    userId,
    actorId: notificationPayload.actorId || null,
    type: notificationPayload.type || 'system',
    title: notificationPayload.title || '',
    content: notificationPayload.content || '',
    link: notificationPayload.link || '/messages'
  })

  const unreadCount = await getUnreadCountByUserId(userId)
  notificationHub.publish(userId, notification)
  notificationHub.publishCount(userId, unreadCount)

  await pushService.sendPushToUser(userId, {
    id: notification.id,
    title: pushPayload?.title || notification.title || '新消息',
    content: pushPayload?.content || notification.content || '',
    link: pushPayload?.link || notification.link || '/messages'
  })
}

router.get('/recommendations', optionalAuthMiddleware, async (req, res) => {
  try {
    const articleLimit = Math.min(Math.max(Number(req.query.articleLimit || req.query.limit || 100), 10), 200)
    const statusLimit = Math.min(Math.max(Number(req.query.statusLimit || req.query.limit || 100), 10), 200)
    const userId = Number(req.user?.id || 0)

    const data = await generateDiscoveryRecommendations({
      userId,
      articleLimit,
      statusLimit
    })

    res.json({ success: true, data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取推荐内容失败' })
  }
})

router.get('/engagement', async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.query.targetType)
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => normalizeTargetId(id))
      .filter(Boolean)

    if (!targetType || !ids.length) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    let userId = 0
    const authHeader = req.headers.authorization || ''
    if (authHeader.startsWith('Bearer ')) {
      // Anonymous fallback supported; auth is optional for myReaction.
      // If auth middleware is required here, this endpoint can be split in future.
      const raw = authHeader.slice('Bearer '.length).trim()
      try {
        // eslint-disable-next-line global-require
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(raw, process.env.JWT_SECRET)
        userId = Number(decoded?.id || 0)
      } catch (_e) {
        userId = 0
      }
    }

    const map = await getEngagementBatch(targetType, ids, userId)
    res.json({ success: true, data: map })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取互动信息失败' })
  }
})

router.post('/reactions', authMiddleware, async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.body?.targetType)
    const targetId = normalizeTargetId(req.body?.targetId)
    const reaction = String(req.body?.reaction || '').toLowerCase() === 'dislike' ? -1 : 1

    if (!targetType || !targetId) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const exists = await ensureTargetExists(targetType, targetId)
    if (!exists) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    const data = await setReaction({
      userId: req.user.id,
      targetType,
      targetId,
      reaction
    })

    const authorId = await getTargetAuthorId(targetType, targetId)
    if (authorId && authorId !== Number(req.user.id) && reaction === 1) {
      await publishSocialNotification(
        authorId,
        {
          actorId: req.user.id,
          type: `${targetType}_like`,
          title: '收到新的点赞',
          content: `${req.user.username || '有用户'} 点赞了你的${targetType === 'status' ? '动态' : '文章'}`,
          link: targetType === 'status' ? '/moments' : `/article/${targetId}`
        },
        {
          title: '收到新的点赞',
          content: `${req.user.username || '有用户'} 点赞了你的${targetType === 'status' ? '动态' : '文章'}`,
          link: targetType === 'status' ? '/moments' : `/article/${targetId}`
        }
      )
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

router.get('/comments', async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.query.targetType)
    const targetId = normalizeTargetId(req.query.targetId)
    const limit = req.query.limit

    if (!targetType || !targetId) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const list = await getComments(targetType, targetId, limit)
    res.json({ success: true, data: list })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取评论失败' })
  }
})

router.post('/comments', authMiddleware, async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.body?.targetType)
    const targetId = normalizeTargetId(req.body?.targetId)
    const content = String(req.body?.content || '').trim()
    const parentId = req.body?.parentId || null

    if (!targetType || !targetId || !content) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const exists = await ensureTargetExists(targetType, targetId)
    if (!exists) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    const comment = await createComment({
      userId: req.user.id,
      targetType,
      targetId,
      content,
      parentId
    })

    const authorId = await getTargetAuthorId(targetType, targetId)
    if (authorId && authorId !== Number(req.user.id)) {
      await publishSocialNotification(
        authorId,
        {
          actorId: req.user.id,
          type: `${targetType}_comment`,
          title: '收到新的评论',
          content: `${req.user.username || '有用户'} 评论了你的${targetType === 'status' ? '动态' : '文章'}`,
          link: targetType === 'status' ? '/moments' : `/article/${targetId}`
        },
        {
          title: '收到新的评论',
          content: `${req.user.username || '有用户'} 评论了你的${targetType === 'status' ? '动态' : '文章'}`,
          link: targetType === 'status' ? '/moments' : `/article/${targetId}`
        }
      )
    }

    res.status(201).json({ success: true, data: comment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '发表评论失败' })
  }
})

router.post('/shares', authMiddleware, async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.body?.targetType)
    const targetId = normalizeTargetId(req.body?.targetId)
    const comment = String(req.body?.comment || '').trim()

    if (!targetType || !targetId) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const exists = await ensureTargetExists(targetType, targetId)
    if (!exists) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    const share = await createShare({ userId: req.user.id, targetType, targetId, comment })
    const engagement = await getEngagementByTarget(targetType, targetId, req.user.id)

    res.status(201).json({ success: true, data: { share, engagement } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '转发失败' })
  }
})

router.post('/reports', authMiddleware, async (req, res) => {
  try {
    const targetType = normalizeTargetType(req.body?.targetType)
    const targetId = normalizeTargetId(req.body?.targetId)
    const reason = String(req.body?.reason || '').trim()
    const details = String(req.body?.details || '').trim()

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }

    const exists = await ensureTargetExists(targetType, targetId)
    if (!exists) {
      return res.status(404).json({ success: false, message: '内容不存在' })
    }

    const report = await createReport({ userId: req.user.id, targetType, targetId, reason, details })
    res.status(201).json({ success: true, message: '举报已提交', data: report })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '举报失败' })
  }
})

router.post('/follows/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = normalizeTargetId(req.params.userId)
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }
    if (targetUserId === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: '不能关注自己' })
    }

    await followUser(req.user.id, targetUserId)
    const stats = await getFollowStats(targetUserId, req.user.id)

    await publishSocialNotification(
      targetUserId,
      {
        actorId: req.user.id,
        type: 'user_follow',
        title: '收到新的关注',
        content: `${req.user.username || '有用户'} 关注了你`,
        link: '/messages'
      },
      {
        title: '收到新的关注',
        content: `${req.user.username || '有用户'} 关注了你`,
        link: '/messages'
      }
    )

    res.json({ success: true, data: stats })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '关注失败' })
  }
})

router.delete('/follows/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = normalizeTargetId(req.params.userId)
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }
    if (targetUserId === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: '不能取关自己' })
    }

    await unfollowUser(req.user.id, targetUserId)
    const stats = await getFollowStats(targetUserId, req.user.id)
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '取关失败' })
  }
})

router.get('/follows/:userId/state', authMiddleware, async (req, res) => {
  try {
    const targetUserId = normalizeTargetId(req.params.userId)
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }

    const following = await isFollowing(req.user.id, targetUserId)
    const stats = await getFollowStats(targetUserId, req.user.id)
    res.json({ success: true, data: { ...stats, isFollowing: following } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取关注状态失败' })
  }
})

router.get('/follows/:userId/followers', async (req, res) => {
  try {
    const userId = normalizeTargetId(req.params.userId)
    if (!userId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }

    const list = await getFollowersList(userId, req.query.limit)
    res.json({ success: true, data: list })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取粉丝失败' })
  }
})

router.get('/follows/:userId/following', async (req, res) => {
  try {
    const userId = normalizeTargetId(req.params.userId)
    if (!userId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }

    const list = await getFollowingList(userId, req.query.limit)
    res.json({ success: true, data: list })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取关注列表失败' })
  }
})

router.get('/follows/me/states', authMiddleware, async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => normalizeTargetId(id))
      .filter(Boolean)
    const map = await getFollowStateBatch(req.user.id, ids)
    res.json({ success: true, data: map })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取关注状态失败' })
  }
})

router.get('/messages/conversations', authMiddleware, async (req, res) => {
  try {
    const list = await getConversations(req.user.id, req.query.limit)
    res.json({ success: true, data: list })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取会话失败' })
  }
})

router.get('/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const peerUserId = normalizeTargetId(req.params.userId)
    if (!peerUserId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }

    const list = await getPrivateMessages(req.user.id, peerUserId, req.query.limit)
    res.json({ success: true, data: list })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取私信失败' })
  }
})

router.put('/messages/:userId/read', authMiddleware, async (req, res) => {
  try {
    const peerUserId = normalizeTargetId(req.params.userId)
    if (!peerUserId) {
      return res.status(400).json({ success: false, message: '用户 ID 无效' })
    }

    await markMessagesAsRead(req.user.id, peerUserId)
    res.json({ success: true, message: '已标记为已读' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '标记已读失败' })
  }
})

router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const receiverId = normalizeTargetId(req.body?.receiverId)
    const content = String(req.body?.content || '').trim()

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: '参数不完整' })
    }
    if (receiverId === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: '不能给自己发私信' })
    }

    const message = await sendPrivateMessage({
      senderId: req.user.id,
      receiverId,
      content
    })

    await publishSocialNotification(
      receiverId,
      {
        actorId: req.user.id,
        type: 'private_message',
        title: '收到一条私信',
        content: `${req.user.username || '有用户'}：${content.slice(0, 36)}`,
        link: '/messages'
      },
      {
        title: '收到一条私信',
        content: `${req.user.username || '有用户'}：${content.slice(0, 36)}`,
        link: '/messages'
      }
    )

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '发送私信失败' })
  }
})

module.exports = router
