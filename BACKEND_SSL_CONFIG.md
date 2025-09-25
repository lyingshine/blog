# 后端3000端口SSL配置指南

## 🎯 问题说明

当前配置中，前端使用HTTPS访问，但后端3000端口使用HTTP，这会导致混合内容错误。有两种解决方案：

## 方案一：为后端3000端口配置SSL（推荐）

### 1. 使用Nginx为3000端口配置SSL代理

创建新的Nginx配置文件：`/etc/nginx/sites-available/blog-api`

```nginx
server {
    listen 3000 ssl http2;
    server_name blog.lyingshine.top;
    
    # 使用与主站相同的SSL证书
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 代理到本地后端服务
    location / {
        proxy_pass http://127.0.0.1:3001;  # 后端改为监听3001端口
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
    
    # 日志
    access_log /www/wwwroot/blog.lyingshine.top/logs/api-access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/api-error.log;
}
```

### 2. 修改后端监听端口

编辑 `backend/.env`：
```env
PORT=3001
HOST=127.0.0.1
```

### 3. 启用配置
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载Nginx
nginx -s reload

# 重启后端服务
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
```

## 方案二：前端改为HTTP访问

### 1. 修改前端API地址
编辑 `frontend/.env.production`：
```env
VITE_API_BASE_URL=http://blog.lyingshine.top:3000/api
```

### 2. 修改Nginx配置，支持HTTP访问
```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 注释掉或删除HTTPS配置
```

### 3. 在宝塔面板中关闭强制HTTPS

## 方案三：使用自签名证书（开发测试）

### 1. 生成自签名证书
```bash
# 创建证书目录
mkdir -p /www/server/panel/vhost/cert/blog-api

# 生成私钥
openssl genrsa -out /www/server/panel/vhost/cert/blog-api/privkey.pem 2048

# 生成证书
openssl req -new -x509 -key /www/server/panel/vhost/cert/blog-api/privkey.pem \
    -out /www/server/panel/vhost/cert/blog-api/fullchain.pem -days 365 \
    -subj "/C=CN/ST=State/L=City/O=Organization/CN=blog.lyingshine.top"
```

### 2. 配置后端使用HTTPS
修改 `backend/app.js`：
```javascript
const https = require('https');
const fs = require('fs');

// SSL证书配置
const options = {
  key: fs.readFileSync('/www/server/panel/vhost/cert/blog-api/privkey.pem'),
  cert: fs.readFileSync('/www/server/panel/vhost/cert/blog-api/fullchain.pem')
};

// 创建HTTPS服务器
const server = https.createServer(options, app);

server.listen(3000, '0.0.0.0', () => {
  console.log('HTTPS Server running on https://0.0.0.0:3000');
});
```

## 🚀 推荐实施方案

### 对于生产环境：方案一（Nginx SSL代理）
- 安全性高
- 性能好
- 证书管理统一

### 对于开发测试：方案二（HTTP访问）
- 配置简单
- 快速部署
- 适合内网环境

## 📋 实施步骤（方案一）

```bash
# 1. 创建API SSL配置
sudo nano /etc/nginx/sites-available/blog-api
# 粘贴上面的Nginx配置

# 2. 启用配置
sudo ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo nginx -s reload

# 3. 修改后端端口
cd /www/wwwroot/blog.lyingshine.top/backend
# 编辑.env文件，设置PORT=3001

# 4. 重启后端
pm2 restart blog-backend

# 5. 测试
curl -k https://blog.lyingshine.top:3000/api/health
```

选择最适合你环境的方案进行配置！