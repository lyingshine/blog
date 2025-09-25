# 博客系统

一个完全分离的前后端博客系统，基于 Vue.js + Node.js + MySQL 构建。

## 📁 项目结构

```
blog/
├── frontend/          # 前端项目 (Vue.js + Vite)
│   ├── src/          # 源代码
│   ├── public/       # 静态资源
│   ├── package.json  # 前端依赖
│   └── README.md     # 前端说明
└── backend/          # 后端项目 (Node.js + Express)
    ├── config/       # 配置文件
    ├── routes/       # API路由
    ├── database/     # 数据库脚本
    ├── package.json  # 后端依赖
    └── README.md     # 后端说明
```

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/lyingshine/blog.git
cd blog
```

### 2. 启动后端
```bash
cd backend
npm install
cp .env.development .env
# 编辑 .env 文件配置数据库
npm run dev
```

### 3. 启动前端
```bash
cd frontend
npm install
npm run dev
```

### 4. 访问应用
- 前端: http://localhost:5173
- 后端API: http://localhost:3000/api

## 🛠️ 技术栈

### 前端
- Vue.js 3
- Vite
- Vue Router
- Axios
- Element Plus

### 后端
- Node.js
- Express
- MySQL
- JWT
- Multer

## 📖 详细文档

- [前端文档](./frontend/README.md)
- [后端文档](./backend/README.md)

## 🌐 部署

### 前端部署
```bash
cd frontend
npm run build
# 将 dist/ 目录部署到Web服务器
```

### 后端部署
```bash
cd backend
npm install --production
npm start
```

## 📝 开发指南

1. 前后端完全分离，可独立开发和部署
2. 前端通过API与后端通信
3. 支持开发和生产环境配置
4. 遵循RESTful API设计规范

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License