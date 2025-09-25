# Vue Blog - 现代化博客平台

<div align="center">

![Vue Blog Logo](https://img.shields.io/badge/Vue-Blog-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)

一个基于 Vue.js 3 和 Express.js 构建的现代化博客平台，支持暗黑模式、评论系统、文章管理等功能。

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

</div>

## ✨ 特性

### 🎨 用户界面
- **现代化设计** - 简洁美观的用户界面
- **暗黑模式** - 支持亮色/暗色主题切换
- **响应式布局** - 完美适配桌面端和移动端
- **流畅动画** - 丰富的交互动效

### 📝 内容管理
- **文章编写** - 支持 Markdown 格式
- **分类管理** - 技术、生活等多种分类
- **标签系统** - 灵活的标签管理
- **回收站** - 已删除文章的恢复功能

### 👥 用户系统
- **用户注册/登录** - 安全的身份验证
- **个人资料** - 头像上传、个人信息管理
- **权限管理** - 基于角色的访问控制

### 💬 社交功能
- **评论系统** - 支持文章评论和回复
- **点赞功能** - 文章和评论点赞
- **用户互动** - 关注作者、查看个人主页

### 🛠 管理功能
- **后台管理** - 完整的管理面板
- **数据统计** - 文章、用户、评论统计
- **内容审核** - 文章和评论管理

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **MySQL** >= 8.0
- **npm** 或 **yarn**

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd vue-blog
```

2. **安装前端依赖**
```bash
npm install
```

3. **安装后端依赖**
```bash
cd server
npm install
cd ..
```

4. **配置数据库**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE vue_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置数据库连接信息
```

6. **初始化数据库**
```bash
# 运行数据库迁移脚本
mysql -u root -p vue_blog < database/migration.sql
mysql -u root -p vue_blog < database/create_comments_tables.sql
mysql -u root -p vue_blog < database/add_comment_likes.sql
mysql -u root -p vue_blog < database/add_trash_feature.sql
```

7. **启动服务**
```bash
# 启动后端服务器
cd server
npm start

# 新开终端，启动前端开发服务器
cd ..
npm run dev
```

8. **访问应用**
- 前端地址: http://localhost:5173
- 后端API: http://localhost:3000

## 📁 项目结构

```
vue-blog/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   │   ├── Header.vue     # 头部导航
│   │   ├── Footer.vue     # 页脚
│   │   ├── CommentSection.vue  # 评论组件
│   │   └── ...
│   ├── views/             # 页面组件
│   │   ├── Home.vue       # 首页
│   │   ├── Login.vue      # 登录页
│   │   ├── Article.vue    # 文章详情
│   │   └── ...
│   ├── composables/       # 组合式函数
│   │   ├── useAuth.js     # 认证逻辑
│   │   ├── useDarkMode.js # 主题切换
│   │   └── ...
│   ├── router/            # 路由配置
│   ├── utils/             # 工具函数
│   └── style.css          # 全局样式
├── server/                # 后端源码
│   ├── routes/            # API 路由
│   │   ├── auth.js        # 认证相关
│   │   ├── articles.js    # 文章管理
│   │   ├── comments.js    # 评论系统
│   │   └── ...
│   ├── middleware/        # 中间件
│   ├── config/            # 配置文件
│   ├── uploads/           # 文件上传目录
│   └── server.js          # 服务器入口
├── database/              # 数据库脚本
│   ├── migration.sql      # 主要表结构
│   ├── create_comments_tables.sql  # 评论表
│   └── ...
└── package.json           # 项目配置
```

## 🔧 配置说明

### 环境变量 (.env)

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vue_blog

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# 服务器配置
PORT=3000
NODE_ENV=development

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

### 数据库表结构

主要数据表：
- `users` - 用户信息
- `articles` - 文章内容
- `comments` - 评论数据
- `comment_likes` - 评论点赞
- `tags` - 标签管理
- `article_tags` - 文章标签关联

## 🎯 功能模块

### 用户认证
- JWT Token 认证
- 密码加密存储
- 登录状态持久化
- 路由守卫保护

### 文章系统
- Markdown 编辑器
- 文章分类和标签
- 文章搜索功能
- 草稿保存

### 评论系统
- 嵌套评论回复
- 评论点赞功能
- 评论管理和审核
- 实时评论更新

### 主题系统
- CSS 变量实现主题切换
- 系统主题自动检测
- 主题偏好本地存储
- 平滑过渡动画

## 🛠 开发指南

### 添加新页面

1. 在 `src/views/` 创建 Vue 组件
2. 在 `src/router/index.js` 添加路由配置
3. 更新导航菜单（如需要）

### 添加新 API

1. 在 `server/routes/` 创建路由文件
2. 在 `server/server.js` 注册路由
3. 在前端 `src/utils/api.js` 添加 API 调用

### 样式开发

- 使用 CSS 变量实现主题适配
- 遵循现有的设计系统
- 确保响应式兼容性

## 📦 构建部署

### 生产构建

```bash
# 构建前端
npm run build

# 启动生产服务器
cd server
NODE_ENV=production npm start
```

### Docker 部署

```dockerfile
# Dockerfile 示例
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Express.js](https://expressjs.com/) - 快速、开放、极简的 Web 框架
- [MySQL](https://mysql.com/) - 世界上最流行的开源数据库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/vue-blog/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/vue-blog/discussions)

---

<div align="center">

**[⬆ 回到顶部](#vue-blog---现代化博客平台)**

Made with ❤️ by [Your Name](https://github.com/your-username)

</div>