const express = require('express')
const router = express.Router()
const { findByUsername, findByEmail, findById, createUser, verifyPassword, sanitizeUser } = require('../data/users')
const { generateAuthTokens, verifyRefreshToken, authMiddleware } = require('../middleware/auth')

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: '用户名长度为 3-20 个字符' })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少 6 个字符' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' })
    }

    if (await findByUsername(username)) {
      return res.status(400).json({ success: false, message: '用户名已被使用' })
    }

    if (await findByEmail(email)) {
      return res.status(400).json({ success: false, message: '邮箱已被注册' })
    }

    const newUser = await createUser({ username, email, password })
    const tokens = generateAuthTokens(newUser.id)

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: sanitizeUser(newUser),
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' })
    }

    let user = await findByUsername(username)
    if (!user) user = await findByEmail(username)

    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }

    const tokens = generateAuthTokens(user.id)

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: sanitizeUser(user),
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {}
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: '缺少 refresh token' })
    }

    const decoded = verifyRefreshToken(refreshToken)
    const user = await findById(decoded.id)
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    const tokens = generateAuthTokens(user.id)
    res.json({
      success: true,
      message: '刷新成功',
      data: {
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: sanitizeUser(user)
      }
    })
  } catch (error) {
    return res.status(401).json({ success: false, message: 'refresh token 无效或已过期' })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { user: req.user } })
})

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '登出成功' })
})

module.exports = router
