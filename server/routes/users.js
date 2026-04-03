const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { getUsers, findById, sanitizeUser, updateUserProfile, updateUserAvatar } = require('../data/users')
const { getDailyPlanner, saveDailyPlanner } = require('../data/dailyPlanner')
const { authMiddleware } = require('../middleware/auth')

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,/i

function resolveAvatarExt(mimeType = '') {
  const lowerMime = String(mimeType).toLowerCase()
  if (lowerMime.includes('png')) return 'png'
  if (lowerMime.includes('jpeg') || lowerMime.includes('jpg')) return 'jpg'
  if (lowerMime.includes('webp')) return 'webp'
  if (lowerMime.includes('gif')) return 'gif'
  return 'png'
}

// GET /api/users - 获取用户列表（分页）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const result = await getUsers(page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取用户列表失败' })
  }
})

// PUT /api/users/me/profile - 更新当前用户个人资料
router.put('/me/profile', authMiddleware, async (req, res) => {
  try {
    const user = await updateUserProfile(req.user.id, req.body || {})
    res.json({
      success: true,
      message: '个人资料已更新',
      data: sanitizeUser(user)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '更新个人资料失败' })
  }
})

// PUT /api/users/me/avatar - 上传当前用户头像
router.put('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const avatarData = typeof req.body?.avatarData === 'string' ? req.body.avatarData.trim() : ''
    if (!avatarData || !AVATAR_DATA_URL_PATTERN.test(avatarData)) {
      return res.status(400).json({ success: false, message: '头像格式不支持，仅支持 png/jpg/webp/gif' })
    }

    const [header, base64Data] = avatarData.split(',', 2)
    if (!base64Data) {
      return res.status(400).json({ success: false, message: '头像数据无效' })
    }

    const fileBuffer = Buffer.from(base64Data, 'base64')
    if (!fileBuffer.length) {
      return res.status(400).json({ success: false, message: '头像数据为空' })
    }
    if (fileBuffer.length > MAX_AVATAR_SIZE_BYTES) {
      return res.status(400).json({ success: false, message: '头像文件过大，请控制在 2MB 内' })
    }

    const mimeType = header.replace(/^data:/i, '').replace(/;base64$/i, '')
    const ext = resolveAvatarExt(mimeType)
    const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars')
    await fs.promises.mkdir(avatarDir, { recursive: true })

    const fileName = `${req.user.id}-${Date.now()}.${ext}`
    const outputPath = path.join(avatarDir, fileName)
    await fs.promises.writeFile(outputPath, fileBuffer)

    const previousUser = await findById(req.user.id)
    const avatarUrl = `/uploads/avatars/${fileName}`
    const user = await updateUserAvatar(req.user.id, avatarUrl)

    if (previousUser?.avatar && /^\/uploads\/avatars\//.test(previousUser.avatar)) {
      const relativePath = previousUser.avatar.replace(/^\//, '')
      const prevFile = path.join(__dirname, '..', relativePath)
      fs.promises.unlink(prevFile).catch(() => {})
    }

    res.json({
      success: true,
      message: '头像已更新',
      data: sanitizeUser(user)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '上传头像失败' })
  }
})

// GET /api/users/me/planner - 获取当前用户每日安排
router.get('/me/planner', authMiddleware, async (req, res) => {
  try {
    const planner = await getDailyPlanner(req.user.id)
    res.json({ success: true, data: planner })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取每日安排失败' })
  }
})

// PUT /api/users/me/planner - 保存当前用户每日安排
router.put('/me/planner', authMiddleware, async (req, res) => {
  try {
    const saved = await saveDailyPlanner(req.user.id, req.body || {})
    res.json({ success: true, message: '每日安排已保存', data: saved })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '保存每日安排失败' })
  }
})

// GET /api/users/:id - 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const user = await findById(parseInt(req.params.id, 10))
    if (!user) {
      return res.status(404).json({ success: false, message: '用户未找到' })
    }
    res.json({ success: true, data: sanitizeUser(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取用户失败' })
  }
})

module.exports = router
