const express = require('express')
const router = express.Router()
const { getUsers, findById, sanitizeUser, updateUserProfile } = require('../data/users')
const { getDailyPlanner, saveDailyPlanner } = require('../data/dailyPlanner')
const { authMiddleware } = require('../middleware/auth')

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
