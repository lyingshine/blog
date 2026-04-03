const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const feishuBot = require('../utils/feishuBot')

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
