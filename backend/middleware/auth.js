const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production';
    const decoded = jwt.verify(token, secret);
    
    // 验证用户是否存在
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期，请重新登录' });
    }
    return res.status(403).json({ error: '访问令牌无效' });
  }
};

// 可选认证中间件（用户可能未登录）
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production';
    const decoded = jwt.verify(token, secret);
    
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    req.user = users.length > 0 ? users[0] : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};