const express = require('express')
const router = express.Router()
const { authMiddleware, verifyToken } = require('../middleware/auth')
const { findById, sanitizeUser } = require('../data/users')
const {
  getNotificationsByUserId,
  getUnreadCountByUserId,
  markNotificationRead,
  markAllNotificationsRead
} = require('../data/notifications')
const { upsertPushSubscription, removePushSubscription } = require('../data/pushSubscriptions')
const notificationHub = require('../utils/notificationHub')
const feishuBot = require('../utils/feishuBot')
const pushService = require('../utils/pushService')

router.get('/push/public-key', (req, res) => {
  const enabled = pushService.isEnabled()
  res.json({
    success: true,
    data: {
      enabled,
      publicKey: enabled ? pushService.getPublicKey() : ''
    }
  })
})

router.post('/push/subscribe', authMiddleware, async (req, res) => {
  try {
    if (!pushService.isEnabled()) {
      return res.status(503).json({ success: false, message: '系统推送未配置，请联系管理员' })
    }

    const subscription = req.body?.subscription || {}
    const endpoint = typeof subscription.endpoint === 'string' ? subscription.endpoint.trim() : ''
    const p256dh = typeof subscription?.keys?.p256dh === 'string' ? subscription.keys.p256dh.trim() : ''
    const auth = typeof subscription?.keys?.auth === 'string' ? subscription.keys.auth.trim() : ''

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ success: false, message: '订阅参数不完整' })
    }

    await upsertPushSubscription({
      userId: req.user.id,
      endpoint,
      p256dh,
      auth,
      userAgent: req.headers['user-agent'] || ''
    })

    res.json({ success: true, message: '订阅成功' })
  } catch (error) {
    console.error('push subscribe failed:', error)
    res.status(500).json({ success: false, message: '订阅失败' })
  }
})

router.delete('/push/subscribe', authMiddleware, async (req, res) => {
  try {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : ''
    if (!endpoint) {
      return res.status(400).json({ success: false, message: '缺少 endpoint' })
    }
    await removePushSubscription({ userId: req.user.id, endpoint })
    res.json({ success: true, message: '取消订阅成功' })
  } catch (error) {
    console.error('push unsubscribe failed:', error)
    res.status(500).json({ success: false, message: '取消订阅失败' })
  }
})

router.post('/push/test', authMiddleware, async (req, res) => {
  try {
    if (!pushService.isEnabled()) {
      return res.status(503).json({ success: false, message: '系统推送未配置，请联系管理员' })
    }
    await pushService.sendPushToUser(req.user.id, {
      title: '测试推送',
      content: '你已成功接入离线消息推送。',
      link: '/messages'
    })
    res.json({ success: true, message: '测试推送已发送' })
  } catch (error) {
    console.error('push test failed:', error)
    res.status(500).json({ success: false, message: '测试推送失败' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 30, cursor } = req.query
    const result = await getNotificationsByUserId(req.user.id, { limit, cursor })
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('get notifications failed:', error)
    res.status(500).json({ success: false, message: '获取消息通知失败' })
  }
})

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const unreadCount = await getUnreadCountByUserId(req.user.id)
    res.json({ success: true, data: { unreadCount } })
  } catch (error) {
    console.error('get unread count failed:', error)
    res.status(500).json({ success: false, message: '获取未读数量失败' })
  }
})

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10)
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: '通知 ID 无效' })
    }

    await markNotificationRead(id, req.user.id)
    const unreadCount = await getUnreadCountByUserId(req.user.id)
    notificationHub.publishCount(req.user.id, unreadCount)

    res.json({ success: true, data: { unreadCount } })
  } catch (error) {
    console.error('mark read failed:', error)
    res.status(500).json({ success: false, message: '标记已读失败' })
  }
})

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await markAllNotificationsRead(req.user.id)
    notificationHub.publishCount(req.user.id, 0)
    res.json({ success: true, data: { unreadCount: 0 } })
  } catch (error) {
    console.error('mark all read failed:', error)
    res.status(500).json({ success: false, message: '全部标记已读失败' })
  }
})

router.get('/stream', async (req, res) => {
  try {
    const token = typeof req.query?.token === 'string' ? req.query.token.trim() : ''
    if (!token) {
      return res.status(401).json({ success: false, message: '缺少认证令牌' })
    }

    const decoded = verifyToken(token)
    const user = await findById(decoded.id)
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    const safeUser = sanitizeUser(user)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    notificationHub.subscribe(safeUser.id, res)
    const unreadCount = await getUnreadCountByUserId(safeUser.id)
    res.write(`event: unread_count\ndata: ${JSON.stringify({ unreadCount })}\n\n`)

    const heartbeat = setInterval(() => {
      res.write('event: ping\ndata: {}\n\n')
    }, 25000)

    req.on('close', () => {
      clearInterval(heartbeat)
      notificationHub.unsubscribe(safeUser.id, res)
      res.end()
    })
  } catch (error) {
    console.error('notification stream auth failed:', error)
    return res.status(401).json({ success: false, message: '认证失败，请重新登录' })
  }
})

router.post('/feishu', authMiddleware, async (req, res) => {
  try {
    const { title, content, deadline, estimateMinutes, webhook } = req.body || {}

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, message: '提醒内容不能为空' })
    }

    if (!feishuBot.isWebhookConfigured(webhook)) {
      return res.status(400).json({ success: false, message: '未配置可用的飞书 Webhook' })
    }

    if (webhook && !feishuBot.isValidFeishuWebhook(webhook)) {
      return res.status(400).json({ success: false, message: '飞书 Webhook 格式不正确' })
    }

    const safeTitle = (title || '每日安排提醒').toString().trim()
    const safeContent = content.toString().trim()
    const safeDeadline = (deadline || '--:--').toString()
    const safeEstimate = Number.isFinite(Number(estimateMinutes)) ? Number(estimateMinutes) : 0

    const text = [
      `【${safeTitle}】`,
      `事项：${safeContent}`,
      `截止：${safeDeadline}`,
      `预计时长：${safeEstimate} 分钟`,
      `发送时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`
    ].join('\n')

    await feishuBot.sendTextMessage(text, webhook)
    return res.json({ success: true, message: '飞书提醒已发送' })
  } catch (error) {
    console.error('send feishu notification failed:', error)
    return res.status(500).json({ success: false, message: error.message || '发送失败' })
  }
})

module.exports = router
