# 博客系统 - 宝塔面板部署指南

本指南将帮助你使用宝塔面板将博客系统部署到服务器上，域名为 `blog.lyingshine.top`。

## 🎯 部署架构

```
Internet → 宝塔Nginx → Node.js应用 (后端:3000)
                    → 静态文件服务 (前端:8080)
                    → MySQL数据库
```

## 📋 部署前准备

### 1. 服务器要求
- Ubuntu 18.04+ 或 CentOS 7+
- 至少 2GB RAM
- 至少 20GB 存储空间
- 已安装宝塔面板

### 2. 安装宝塔面板
```bash
# Ubuntu/Debian
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
```

### 3. 宝塔面板基础配置
1. 登录宝塔面板
2. 安装软件：
   - Nginx 1.20+
   - MySQL 8.0
   - Node.js 18+
   - PM2管理器
   - SSL证书管理

## 🚀 部署步骤

### 1. 创建网站

#### 在宝塔面板中：
1. 点击 "网站" → "添加站点"
2. 域名：`blog.lyingshine.top`
3. 根目录：`/www/wwwroot/blog.lyingshine.top`
4. 选择 "纯静态"
5. 创建数据库：`blog_db`

### 2. 上传项目文件

#### 方法一：通过Git（推荐）
```bash
cd /www/wwwroot/blog.lyingshine.top
git clone https://github.com/lyingshine/blog.git .
```

#### 方法二：通过宝塔文件管理器
1. 下载项目压缩包
2. 通过宝塔面板上传并解压

### 3. 配置环境变量

创建后端环境变量文件：
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
cp ../.env.example .env
```

编辑 `.env` 文件：
```env
NODE_ENV=production
PORT=3000

# 数据库配置（使用宝塔创建的数据库信息）
DB_HOST=localhost
DB_PORT=3306
DB_USER=blog_db
DB_PASSWORD=你的数据库密码
DB_NAME=blog_db

# JWT密钥（生成一个强密钥）
JWT_SECRET=your_jwt_secret_key_here

# CORS配置
CORS_ORIGIN=https://blog.lyingshine.top
```

### 4. 安装依赖

#### 安装后端依赖
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
npm install --production
```

#### 安装前端依赖并构建
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
npm install
npm run build
```

### 5. 配置数据库

#### 导入数据库结构
1. 在宝塔面板 → 数据库 → 管理 → 导入
2. 上传 `backend/database/migration.sql`

#### 或者通过命令行
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
mysql -u blog_db -p blog_db < database/migration.sql
```

### 6. 配置PM2启动后端

创建PM2配置文件：
```bash
cd /www/wwwroot/blog.lyingshine.top
```

创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'blog-backend',
    script: './backend/server.js',
    cwd: '/www/wwwroot/blog.lyingshine.top',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

#### 启动应用
```bash
# 创建日志目录
mkdir -p /www/wwwroot/blog.lyingshine.top/logs

# 启动应用
cd /www/wwwroot/blog.lyingshine.top
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. 配置Nginx

#### 在宝塔面板中配置网站：

1. 点击网站设置
2. 配置SSL证书（Let's Encrypt）
3. 修改网站配置文件：

```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.lyingshine.top;
    
    # SSL配置（宝塔自动生成）
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 日志
    access_log /www/wwwlogs/blog.lyingshine.top.log;
    error_log /www/wwwlogs/blog.lyingshine.top.error.log;
    
    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 前端静态文件
    location / {
        root /www/wwwroot/blog.lyingshine.top/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 文件上传大小限制
    client_max_body_size 10M;
}
```

### 8. 设置防火墙

在宝塔面板 → 安全 中：
1. 开放端口：80, 443, 3000
2. 配置SSH安全
3. 启用防火墙

## 🔧 宝塔面板管理

### 1. 监控应用状态

#### 通过PM2管理器：
1. 宝塔面板 → 软件商店 → PM2管理器
2. 查看应用状态、日志、重启等

#### 通过命令行：
```bash
pm2 status
pm2 logs blog-backend
pm2 restart blog-backend
```

### 2. 数据库管理

1. 宝塔面板 → 数据库
2. 可以进行备份、导入导出等操作

### 3. 文件管理

1. 宝塔面板 → 文件
2. 可以直接编辑配置文件、查看日志等

### 4. SSL证书管理

1. 网站设置 → SSL
2. 可以申请Let's Encrypt免费证书
3. 自动续期

## 🔄 更新部署

### 1. 更新代码
```bash
cd /www/wwwroot/blog.lyingshine.top
git pull origin master
```

### 2. 更新前端
```bash
cd frontend
npm run build
```

### 3. 重启后端
```bash
pm2 restart blog-backend
```

## 📊 监控和维护

### 1. 设置监控

在宝塔面板中：
1. 系统监控 → 查看服务器资源使用
2. 网站监控 → 设置网站可用性监控

### 2. 定时任务

设置定时任务进行：
- 数据库备份
- 日志清理
- SSL证书续期检查

### 3. 备份策略

1. 宝塔面板 → 计划任务
2. 设置网站文件备份
3. 设置数据库备份

## 🚨 故障排除

### 常见问题

1. **Node.js应用启动失败**
   - 检查PM2日志：`pm2 logs blog-backend`
   - 检查环境变量配置
   - 检查端口是否被占用

2. **数据库连接失败**
   - 检查数据库用户权限
   - 检查防火墙设置
   - 验证数据库配置

3. **前端页面无法访问**
   - 检查Nginx配置
   - 确认前端构建是否成功
   - 检查文件权限

4. **API接口404**
   - 检查Nginx反向代理配置
   - 确认后端服务运行状态
   - 检查路由配置

### 日志查看

```bash
# PM2应用日志
pm2 logs blog-backend

# Nginx访问日志
tail -f /www/wwwlogs/blog.lyingshine.top.log

# Nginx错误日志
tail -f /www/wwwlogs/blog.lyingshine.top.error.log

# 系统日志
tail -f /var/log/messages
```

## 🎉 部署完成

部署完成后，你的博客系统将在以下地址可用：
- 🌐 前端: https://blog.lyingshine.top
- 🔌 API: https://blog.lyingshine.top/api
- 💓 健康检查: https://blog.lyingshine.top/api/health

通过宝塔面板，你可以方便地管理网站、监控状态、备份数据等操作！