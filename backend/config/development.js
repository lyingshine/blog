// 开发环境配置
module.exports = {
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blog_dev',
    charset: 'utf8mb4',
    connectionLimit: 10
  },

  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret',
    expiresIn: '7d'
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },

  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    uploadDir: 'uploads'
  },

  // 日志配置
  logging: {
    level: 'debug',
    console: true,
    file: false
  },

  // 安全配置
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 1000 // 开发环境放宽限制
    }
  }
};