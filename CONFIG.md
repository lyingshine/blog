# 项目配置说明

## 📁 配置文件结构

```
blog/
├── .env.development          # 开发环境变量
├── .env.production          # 生产环境变量
├── .env.example            # 环境变量模板
├── frontend/
│   ├── .env.development    # 前端开发环境变量
│   └── .env.production     # 前端生产环境变量
└── backend/
    └── config/
        ├── database.js     # 数据库配置（自动加载环境配置）
        ├── development.js  # 开发环境配置
        └── production.js   # 生产环境配置
```

## 🔧 环境配置

### 开发环境

#### 后端配置 (.env.development)
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blog_dev

# JWT配置
JWT_SECRET=dev_jwt_secret_key_change_in_production

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 调试配置
DEBUG=true
LOG_LEVEL=debug
```

#### 前端配置 (frontend/.env.development)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=博客系统 - 开发环境
VITE_APP_DEBUG=true
```

### 生产环境

#### 后端配置 (.env.production)
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://blog.lyingshine.top

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=blog_user
DB_PASSWORD=your_secure_password_here
DB_NAME=blog_db

# JWT配置
JWT_SECRET=your_strong_jwt_secret_key_here

# CORS配置
CORS_ORIGIN=https://blog.lyingshine.top

# 调试配置
DEBUG=false
LOG_LEVEL=error
```

#### 前端配置 (frontend/.env.production)
```env
VITE_API_BASE_URL=https://blog.lyingshine.top/api
VITE_APP_TITLE=博客系统
VITE_APP_DEBUG=false
```

## 🚀 使用方法

### 开发环境启动

1. **配置环境变量**
```bash
# 复制并编辑开发环境配置
cp .env.example .env.development
# 编辑 .env.development 文件
```

2. **启动后端**
```bash
cd backend
NODE_ENV=development npm run dev
```

3. **启动前端**
```bash
cd frontend
npm run dev
```

### 生产环境部署

1. **配置环境变量**
```bash
# 复制并编辑生产环境配置
cp .env.example .env.production
# 编辑 .env.production 文件，设置安全的密码和密钥
```

2. **构建前端**
```bash
cd frontend
npm run build
```

3. **启动后端**
```bash
cd backend
NODE_ENV=production npm start
```

## ⚙️ 配置说明

### 数据库配置
- **开发环境**: 使用本地MySQL，数据库名 `blog_dev`
- **生产环境**: 使用生产MySQL，数据库名 `blog_db`

### JWT配置
- **开发环境**: 使用简单密钥，便于调试
- **生产环境**: 必须使用强密钥，确保安全

### CORS配置
- **开发环境**: 允许本地前端访问
- **生产环境**: 只允许生产域名访问

### 日志配置
- **开发环境**: 详细日志，输出到控制台
- **生产环境**: 错误日志，输出到文件

### 安全配置
- **开发环境**: 宽松的速率限制
- **生产环境**: 严格的速率限制

## 🔒 安全注意事项

1. **永远不要提交包含敏感信息的环境变量文件到Git**
2. **生产环境必须使用强密码和密钥**
3. **定期更换JWT密钥**
4. **使用HTTPS在生产环境中传输数据**
5. **限制数据库用户权限**

## 🛠️ 自定义配置

如需添加新的配置项：

1. **在环境变量文件中添加变量**
2. **在对应的配置文件中引用**
3. **在应用代码中使用配置**

示例：
```javascript
// backend/config/development.js
module.exports = {
  // ... 其他配置
  customFeature: {
    enabled: process.env.CUSTOM_FEATURE_ENABLED === 'true',
    apiKey: process.env.CUSTOM_API_KEY
  }
};
```

## 📝 环境变量优先级

1. 系统环境变量（最高优先级）
2. .env.{environment} 文件
3. 配置文件中的默认值（最低优先级）

这样的设计确保了配置的灵活性和安全性。