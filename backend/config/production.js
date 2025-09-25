// 生产环境配置
module.exports = {
  // 数据库配置
  database: {
    host: process.env.DB_HOST || '66.42.96.196',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'blog',
    password: process.env.DB_PASSWORD || '132014',
    database: process.env.DB_NAME || 'blog',
    charset: 'utf8mb4',
    connectionLimit: 20
  },

  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  },

  // CORS配置
  cors: {
    origin: [
      'https://blog.lyingshine.top',
      'http://localhost:4173',
      'http://localhost:5173'
    ],
    credentials: true
  },

  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    uploadDir: 'uploads'
  },

  // 日志配置
  logging: {
    level: 'error',
    console: false,
    file: true,
    filename: 'logs/app.log'
  },

  // 安全配置
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100 // 生产环境严格限制
    }
  }
};