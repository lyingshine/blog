# 完全代理模式后端配置

## 🎯 配置目标

当宝塔面板反向代理设置为根目录 `/` 时，所有请求都会转发到后端。这种情况下，后端需要同时处理：
1. API请求（/api路径）
2. 前端静态文件服务
3. Vue Router的history模式支持

## 📝 后端配置修改

### 1. 更新 app.js 文件

在 `backend/app.js` 中添加静态文件服务配置：

```javascript
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS配置
app.use(cors({
  origin: [
    'https://blog.lyingshine.top',
    'http://localhost:5173', // 开发环境
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// API路由（在静态文件服务之前）
app.use('/api', require('./routes/api'));

// 服务前端静态文件
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vue Router history模式支持
// 所有非API请求都返回index.html
app.get('*', (req, res) => {
  // 确保API请求不会被这个路由捕获
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // 返回前端应用的入口文件
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
```

### 2. 更新前端环境变量

编辑 `frontend/.env.production`：

```env
# 前端生产环境配置
# 使用相对路径，因为所有请求都通过同一端口
VITE_API_BASE_URL=/api
VITE_APP_TITLE=博客系统
VITE_APP_DEBUG=false
```

### 3. 确保前端构建文件存在

```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
npm run build
```

构建完成后，确保 `dist` 目录包含以下文件：
- `index.html`
- `assets/` 目录（包含JS、CSS文件）

## 🚀 部署步骤

### 1. 在宝塔面板中设置完全代理

1. 网站设置 → 反向代理
2. 添加反向代理：
   ```
   代理名称: 完全代理
   目标URL: http://127.0.0.1:3000
   代理目录: /
   ```

### 2. 更新代码并重新部署

```bash
# 拉取最新代码
cd /www/wwwroot/blog.lyingshine.top
git pull origin master

# 重新构建前端
cd frontend
npm run build

# 重启后端服务
cd ../backend
pm2 restart blog-backend
```

### 3. 验证配置

#### 检查后端服务
```bash
pm2 status
pm2 logs blog-backend
```

#### 测试访问
```bash
# 测试主页
curl -I https://blog.lyingshine.top

# 测试API
curl https://blog.lyingshine.top/api/health

# 测试静态资源
curl -I https://blog.lyingshine.top/assets/index.js
```

## 🔍 优缺点分析

### ✅ 优点
- 配置简单，只需要一个反向代理规则
- 所有请求都通过同一端口，避免跨域问题
- 后端完全控制路由逻辑

### ❌ 缺点
- 后端负载增加（需要处理静态文件）
- 静态文件缓存策略需要在后端实现
- Nginx的静态文件服务性能更好

## 🛠️ 故障排除

### 1. 静态文件404
**检查**：
- 前端是否正确构建：`ls -la frontend/dist/`
- 后端静态文件路径是否正确

### 2. API请求404
**检查**：
- API路由是否在静态文件服务之前定义
- 路由路径是否正确

### 3. Vue Router刷新404
**检查**：
- 通配符路由 `app.get('*', ...)` 是否正确配置
- 是否排除了API路径

## 📋 配置验证清单

- [ ] 后端app.js包含静态文件服务配置
- [ ] 前端.env.production使用相对路径API地址
- [ ] 前端已构建到dist目录
- [ ] 宝塔面板反向代理设置为根目录 `/`
- [ ] 后端服务正常运行
- [ ] 主页可以正常访问
- [ ] API接口正常响应
- [ ] Vue Router路由正常工作

这种配置方式让后端完全接管所有请求的处理！