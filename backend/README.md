# 博客系统 - 后端

基于 Node.js + Express + MySQL 的博客后端API服务。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
# 复制并编辑环境配置文件
cp .env.development .env
# 编辑 .env 文件，设置数据库连接信息
```

### 初始化数据库
```bash
# 创建数据库表
mysql -u root -p < database/migration.sql
```

### 启动服务

#### 开发环境
```bash
npm run dev
```

#### 生产环境
```bash
npm start
```

## 🛠️ 技术栈

- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **MySQL** - 关系型数据库
- **JWT** - 身份验证
- **Multer** - 文件上传
- **Bcrypt** - 密码加密
- **CORS** - 跨域资源共享

## 📁 项目结构

```
backend/
├── config/            # 配置文件
│   ├── database.js    # 数据库配置
│   ├── development.js # 开发环境配置
│   └── production.js  # 生产环境配置
├── routes/            # API路由
├── middleware/        # 中间件
├── scripts/           # 脚本文件
├── uploads/           # 文件上传目录
├── database/          # 数据库脚本
├── .env.development   # 开发环境变量
├── .env.production    # 生产环境变量
└── server.js          # 服务器入口
```

## 🔌 API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 文章相关
- `GET /api/posts` - 获取文章列表
- `GET /api/posts/:id` - 获取文章详情
- `POST /api/posts` - 创建文章
- `PUT /api/posts/:id` - 更新文章
- `DELETE /api/posts/:id` - 删除文章

### 用户相关
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息
- `POST /api/users/avatar` - 上传头像

## ⚙️ 环境配置

### 开发环境 (.env.development)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blog_dev
JWT_SECRET=dev_secret
```

### 生产环境 (.env.production)
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=blog_user
DB_PASSWORD=secure_password
DB_NAME=blog_db
JWT_SECRET=strong_secret
```

## 🔒 安全配置

- JWT身份验证
- 密码加密存储
- CORS跨域限制
- 请求频率限制
- 文件上传安全检查

## 📊 监控和日志

### PM2进程管理
```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs blog-backend

# 重启应用
pm2 restart blog-backend
```

### 健康检查
- `GET /api/health` - 服务健康状态检查

## 🗄️ 数据库

### 表结构
- `users` - 用户表
- `posts` - 文章表
- `comments` - 评论表
- `categories` - 分类表
- `tags` - 标签表

### 数据库迁移
```bash
# 运行迁移脚本
npm run migrate