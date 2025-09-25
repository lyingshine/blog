# 博客系统 - 后端

基于 Node.js + Express + MySQL 的博客后端API服务。

## 技术栈

- **Node.js** - JavaScript运行时环境
- **Express.js** - Web应用框架
- **MySQL** - 关系型数据库
- **JWT** - 身份验证
- **Multer** - 文件上传处理
- **bcryptjs** - 密码加密

## 功能特性

- 🔒 JWT身份验证
- 📊 RESTful API设计
- 🗄️ MySQL数据库
- 📁 文件上传处理
- 🛡️ 权限管理
- 📈 管理员后台
- 🔍 搜索功能
- 📊 统计数据

## 开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 启动生产服务器
```bash
npm start
```

## 项目结构

```
backend/
├── config/          # 配置文件
│   └── database.js  # 数据库配置
├── database/        # 数据库脚本
├── middleware/      # 中间件
│   └── auth.js      # 身份验证中间件
├── routes/          # 路由文件
│   ├── admin.js     # 管理员路由
│   ├── articles.js  # 文章路由
│   ├── auth.js      # 认证路由
│   ├── comments.js  # 评论路由
│   ├── tags.js      # 标签路由
│   ├── upload.js    # 上传路由
│   └── users.js     # 用户路由
├── scripts/         # 脚本文件
│   └── fix-database.js # 数据库修复脚本
├── uploads/         # 上传文件存储
└── server.js        # 服务器入口文件
```

## 环境配置

创建 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blog_db
JWT_SECRET=your_jwt_secret_key
```

## API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 文章相关
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取文章详情
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

### 评论相关
- `GET /api/comments/:articleId` - 获取文章评论
- `POST /api/comments` - 创建评论
- `DELETE /api/comments/:id` - 删除评论

### 用户相关
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `POST /api/upload/avatar` - 上传头像

### 管理员相关
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/articles` - 管理员文章列表
- `GET /api/admin/users` - 管理员用户列表

## 数据库

### 初始化数据库
```bash
mysql -u root -p
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql -u root -p blog_db < database/migration.sql
```

### 数据库表结构
- `users` - 用户表
- `articles` - 文章表
- `comments` - 评论表
- `categories` - 分类表
- `tags` - 标签表
- `article_tags` - 文章标签关联表
- `article_likes` - 文章点赞表
- `article_views` - 文章浏览记录表