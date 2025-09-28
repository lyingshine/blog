const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// 根据环境加载对应的.env文件
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
const envPath = path.resolve(__dirname, envFile);

console.log(`🔧 当前环境: ${env}`);
console.log(`📁 加载环境文件: ${envPath}`);

// 先加载通用.env文件，再加载环境特定文件
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: envPath });

console.log(`✅ 环境变量加载完成`);

const { testConnection } = require('./config/database');

// 路由导入
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const tagRoutes = require('./routes/tags');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const avatarFixRoutes = require('./routes/avatar-fix');
const inspirationRoutes = require('./routes/inspirations');
const inspirationCommentRoutes = require('./routes/inspiration-comments');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());
app.use(compression());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 增加到1000个请求，适合开发环境
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS配置
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://blog.lyingshine.top',
    process.env.CORS_ORIGIN || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/avatar-fix', avatarFixRoutes);
app.use('/api/inspirations', inspirationRoutes);
app.use('/api/inspiration-comments', inspirationCommentRoutes);

// 404处理
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.path
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: '文件大小超出限制'
    });
  }
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 无法连接到数据库，服务器启动失败');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📊 API文档: http://localhost:${PORT}/api/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});