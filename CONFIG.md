# 项目配置说明

## 📁 配置文件结构

```
blog/
├── frontend/
│   ├── .env.development     # 前端开发环境配置
│   └── .env.production      # 前端生产环境配置
├── backend/
│   ├── .env.development     # 后端开发环境配置
│   ├── .env.production      # 后端生产环境配置
│   └── config/
│       ├── development.js   # 开发环境详细配置
│       ├── production.js    # 生产环境详细配置
│       └── database.js      # 数据库配置（自动加载环境）
└── .env.example            # 环境变量模板
```

## 🔧 配置文件说明

### 前端配置
- **`frontend/.env.development`** - 开发环境API地址等前端配置
- **`frontend/.env.production`** - 生产环境API地址等前端配置

### 后端配置
- **`backend/.env.development`** - 开发环境数据库、JWT等后端配置
- **`backend/.env.production`** - 生产环境数据库、JWT等后端配置

## 🚀 使用方法

### 开发环境
```bash
# 安装所有依赖
npm run install:all

# 启动开发环境（前后端同时启动）
npm run dev

# 分别启动
npm run dev:backend   # 启动后端开发服务器
npm run dev:frontend  # 启动前端开发服务器
```

### 生产环境
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## ⚙️ 环境变量说明

### 后端环境变量
- `NODE_ENV` - 运行环境 (development/production)
- `PORT` - 服务器端口
- `DB_HOST` - 数据库主机
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码
- `DB_NAME` - 数据库名称
- `JWT_SECRET` - JWT密钥
- `CORS_ORIGIN` - 允许的跨域来源

### 前端环境变量
- `VITE_API_BASE_URL` - API接口基础地址
- `VITE_APP_TITLE` - 应用标题
- `VITE_DEBUG` - 调试模式开关

## 🔒 安全注意事项

1. **生产环境密钥** - 确保生产环境使用强密钥
2. **数据库密码** - 使用复杂的数据库密码
3. **环境文件** - 不要将包含敏感信息的 `.env` 文件提交到Git
4. **CORS设置** - 生产环境严格限制跨域来源

## 📝 自定义配置

1. 复制 `.env.example` 到对应目录
2. 重命名为 `.env.development` 或 `.env.production`
3. 根据实际情况修改配置值
4. 重启服务使配置生效

## 🔄 配置加载机制

- 后端服务启动时会根据 `NODE_ENV` 自动加载对应的 `.env` 文件
- 前端构建时会根据构建命令自动选择对应的环境配置
- 数据库配置会自动读取环境变量并应用到连接池