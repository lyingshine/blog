# 生产环境部署指南

## 🚀 生产环境切换步骤

### 1. 配置后端环境变量

编辑 `backend/.env` 文件，设置生产环境配置：

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://blog.lyingshine.top

# 数据库配置 - 请修改为实际值
DB_HOST=localhost
DB_PORT=3306
DB_USER=blog_user
DB_PASSWORD=你的数据库密码
DB_NAME=blog_db

# JWT配置 - 请设置强密钥
JWT_SECRET=你的强JWT密钥

# CORS配置
CORS_ORIGIN=https://blog.lyingshine.top

DEBUG=false
LOG_LEVEL=error
```

### 2. 数据库准备

```bash
# 创建生产数据库
mysql -u root -p
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog_user'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON blog_db.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;

# 导入数据库结构
mysql -u blog_user -p blog_db < backend/database/migration.sql
```

### 3. 安装生产依赖

```bash
# 后端
cd backend
npm install --production

# 前端
cd ../frontend
npm install
```

### 4. 构建前端

```bash
cd frontend
npm run build
```

### 5. 启动生产服务

#### 方式一：直接启动
```bash
cd backend
npm start
```

#### 方式二：使用PM2（推荐）
```bash
cd backend
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. 配置Web服务器

#### Nginx配置示例
```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    
    # 前端静态文件
    location / {
        root /path/to/blog/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 验证部署

### 检查服务状态
```bash
# 检查后端服务
curl http://localhost:3000/api/health

# 检查PM2状态
pm2 status

# 查看日志
pm2 logs blog-backend
```

### 访问测试
- 前端: https://blog.lyingshine.top
- API: https://blog.lyingshine.top/api/health

## 🛠️ 生产环境维护

### 更新部署
```bash
# 拉取最新代码
git pull origin master

# 重新构建前端
cd frontend && npm run build

# 重启后端服务
pm2 restart blog-backend
```

### 备份数据库
```bash
mysqldump -u blog_user -p blog_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 监控日志
```bash
# 查看实时日志
pm2 logs blog-backend --lines 100

# 查看错误日志
pm2 logs blog-backend --err
```

## 🔒 安全检查清单

- [ ] 数据库密码已设置为强密码
- [ ] JWT密钥已设置为强密钥
- [ ] CORS已限制为生产域名
- [ ] 调试模式已关闭
- [ ] SSL证书已配置
- [ ] 防火墙已配置
- [ ] 定期备份已设置

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证用户名密码是否正确
   - 确认数据库名称是否存在

2. **前端页面404**
   - 检查Nginx配置是否正确
   - 确认前端文件是否构建成功
   - 验证文件路径是否正确

3. **API接口500错误**
   - 查看PM2日志：`pm2 logs blog-backend`
   - 检查环境变量配置
   - 验证数据库表结构

4. **跨域问题**
   - 检查CORS_ORIGIN配置
   - 确认前端API地址配置
   - 验证Nginx代理配置