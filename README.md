# 博客系统

一个基于 Vue.js + Node.js + MySQL 的全栈博客系统。

## 项目结构

```
blog/
├── frontend/          # 前端项目 (Vue.js)
│   ├── src/          # 源代码
│   ├── index.html    # 入口HTML文件
│   ├── package.json  # 前端依赖配置
│   └── vite.config.js # Vite配置
├── backend/          # 后端项目 (Node.js + Express)
│   ├── config/       # 配置文件
│   ├── database/     # 数据库脚本
│   ├── middleware/   # 中间件
│   ├── routes/       # 路由文件
│   ├── scripts/      # 脚本文件
│   ├── uploads/      # 上传文件存储
│   ├── package.json  # 后端依赖配置
│   └── server.js     # 服务器入口文件
├── .env.example      # 环境变量示例
└── README.md         # 项目说明
```

## 功能特性

### 前端功能
- 🎨 现代化响应式UI设计
- 🌙 深色/浅色主题切换
- 📱 移动端适配
- 🔐 用户注册/登录
- ✍️ 文章创建和编辑
- 💬 评论系统
- 👍 点赞功能
- 🏷️ 标签和分类
- 👤 用户个人资料
- 🖼️ 头像上传
- 🗑️ 回收站功能

### 后端功能
- 🔒 JWT身份验证
- 📊 RESTful API设计
- 🗄️ MySQL数据库
- 📁 文件上传处理
- 🛡️ 权限管理
- 📈 管理员后台
- 🔍 搜索功能
- 📊 统计数据

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/lyingshine/blog.git
cd blog
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量，配置数据库连接等信息
```

3. **安装后端依赖**
```bash
cd backend
npm install
```

4. **安装前端依赖**
```bash
cd ../frontend
npm install
```

5. **配置数据库**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 运行数据库迁移脚本
mysql -u root -p blog_db < backend/database/migration.sql
```

6. **启动项目**

启动后端服务：
```bash
cd backend
npm run dev
```

启动前端服务：
```bash
cd frontend
npm run dev
```

## 开发指南

### 前端开发
- 使用 Vue 3 + Composition API
- 使用 Vite 作为构建工具
- 使用 Vue Router 进行路由管理
- 使用 Axios 进行HTTP请求
- 支持热重载开发

### 后端开发
- 使用 Express.js 框架
- 使用 MySQL2 连接数据库
- 使用 JWT 进行身份验证
- 使用 Multer 处理文件上传
- 使用 Nodemon 支持热重载

### API文档
后端API接口文档：
- 用户认证：`/api/auth/*`
- 文章管理：`/api/articles/*`
- 评论系统：`/api/comments/*`
- 用户管理：`/api/users/*`
- 文件上传：`/api/upload/*`
- 管理员功能：`/api/admin/*`

## 部署

### 生产环境部署

1. **构建前端**
```bash
cd frontend
npm run build
```

2. **配置生产环境变量**
```bash
# 在backend目录下创建.env文件
NODE_ENV=production
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
```

3. **启动后端服务**
```bash
cd backend
npm start
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License