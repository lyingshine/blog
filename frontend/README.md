# 博客系统 - 前端

基于 Vue.js 3 + Vite 的现代化博客前端应用。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 🛠️ 技术栈

- **Vue.js 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器
- **Axios** - HTTP客户端
- **Element Plus** - Vue 3组件库
- **Sass** - CSS预处理器

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/     # 公共组件
│   ├── views/         # 页面组件
│   ├── router/        # 路由配置
│   ├── utils/         # 工具函数
│   ├── composables/   # 组合式函数
│   └── assets/        # 静态资源
├── public/            # 公共资源
├── .env.development   # 开发环境配置
├── .env.production    # 生产环境配置
└── vite.config.js     # Vite配置
```

## ⚙️ 环境配置

### 开发环境
- API地址: `http://localhost:3000/api`
- 调试模式: 开启

### 生产环境
- API地址: `https://blog.lyingshine.top/api`
- 调试模式: 关闭

## 🔧 自定义配置

编辑 `.env.development` 或 `.env.production` 文件来修改配置：

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=我的博客
VITE_DEBUG=true
```

## 📦 构建部署

```bash
# 构建生产版本
npm run build

# 构建的文件将输出到 dist/ 目录
# 将 dist/ 目录内容部署到Web服务器即可