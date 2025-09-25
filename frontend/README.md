# 博客系统 - 前端

基于 Vue.js 3 + Vite 的现代化博客前端应用。

## 技术栈

- **Vue.js 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器
- **Axios** - HTTP客户端
- **CSS3** - 现代化样式设计

## 功能特性

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

## 开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 项目结构

```
src/
├── components/       # 可复用组件
├── composables/      # 组合式函数
├── router/          # 路由配置
├── utils/           # 工具函数
├── views/           # 页面组件
├── App.vue          # 根组件
├── main.js          # 入口文件
└── style.css        # 全局样式
```

## 环境配置

在项目根目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000/api