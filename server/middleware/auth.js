const jwt = require('jsonwebtoken')
const { findById, sanitizeUser } = require('../data/users')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-blog-2024'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '12h'
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

// backward compatible alias
const generateToken = (userId) => generateAccessToken(userId)

const generateAuthTokens = (userId) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId)
})

const verifyToken = (token) => jwt.verify(token, JWT_SECRET)
const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET)

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    const user = await findById(decoded.id)

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    req.user = sanitizeUser(user)
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '令牌已过期，请刷新登录' })
    }
    return res.status(401).json({ success: false, message: '无效的认证令牌' })
  }
}

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)
      const user = await findById(decoded.id)
      if (user) req.user = sanitizeUser(user)
    }

    next()
  } catch (error) {
    next()
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' })
  }
  next()
}

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  generateAuthTokens,
  verifyToken,
  verifyRefreshToken,
  authMiddleware,
  optionalAuthMiddleware,
  requireAdmin,
  JWT_SECRET,
  JWT_REFRESH_SECRET
}
