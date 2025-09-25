# 混合内容错误解决方案

## 🚨 错误分析

从浏览器控制台可以看到：
```
Mixed Content: The page at 'https://blog.lyingshine.top/login' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://blog.lyingshine.top:3000/api/auth/login'. 
This request has been blocked; the content must be served over HTTPS.
```

**问题原因：**
- 前端页面使用 HTTPS (`https://blog.lyingshine.top`)
- API请求使用 HTTP (`http://blog.lyingshine.top:3000/api`)
- 浏览器阻止了从HTTPS页面发起的HTTP请求

## ✅ 解决方案

### 方案一：前端改为HTTP访问（推荐，简单快速）

#### 1. 修改Nginx配置，移除HTTPS重定向
```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    
    # 前端静态文件
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}

# 如果有HTTPS配置，暂时注释掉或删除
# server {
#     listen 443 ssl;
#     ...
# }
```

#### 2. 在宝塔面板中操作
1. 网站设置 → SSL → 关闭强制HTTPS
2. 或者删除SSL证书配置
3. 重载Nginx配置

#### 3. 访问测试
- 使用 `http://blog.lyingshine.top` 访问（不是https）
- API请求将正常工作

### 方案二：为后端3000端口配置HTTPS

#### 1. 使用Nginx为3000端口配置SSL代理
```nginx
# 添加一个新的server块，为3000端口提供HTTPS
server {
    listen 3001 ssl;
    server_name blog.lyingshine.top;
    
    # SSL证书配置（使用与主站相同的证书）
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;
    
    # 代理到后端3000端口
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2. 修改前端API地址
编辑 `frontend/.env.production`：
```env
VITE_API_BASE_URL=https://blog.lyingshine.top:3001/api
```

#### 3. 开放3001端口
在宝塔面板防火墙中开放3001端口。

### 方案三：使用反向代理（回到原始方案）

#### 1. 修改前端API地址
编辑 `frontend/.env.production`：
```env
VITE_API_BASE_URL=https://blog.lyingshine.top/api
```

#### 2. 配置Nginx反向代理
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name blog.lyingshine.top;
    
    # SSL配置...
    
    # 前端静态文件
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚀 推荐实施步骤（方案一）

### 1. 在宝塔面板中关闭HTTPS
```bash
# 在宝塔面板中操作：
# 网站设置 → SSL → 关闭强制HTTPS
# 或者暂时删除SSL证书
```

### 2. 确保Nginx配置正确
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
```

### 3. 重载Nginx
```bash
nginx -t
nginx -s reload
```

### 4. 确保后端运行在3000端口
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 status
# 如果没有运行，启动服务
pm2 start ecosystem.config.js
```

### 5. 测试访问
- 访问：`http://blog.lyingshine.top`（注意是http，不是https）
- 测试登录功能

## 🔍 验证步骤

### 1. 检查前端访问
```bash
curl -I http://blog.lyingshine.top
# 应该返回200状态码
```

### 2. 检查后端API
```bash
curl http://blog.lyingshine.top:3000/api/health
# 应该返回健康检查信息
```

### 3. 浏览器测试
- 打开 `http://blog.lyingshine.top`
- 打开开发者工具 → Network
- 尝试登录，查看API请求是否成功

## ⚠️ 注意事项

### 安全考虑
- HTTP传输不加密，在生产环境中存在安全风险
- 如果需要安全传输，建议使用方案二或方案三
- 考虑在内网环境或测试环境中使用HTTP

### 后续优化
- 可以后续再配置HTTPS，但需要同时为API配置HTTPS
- 或者使用反向代理统一处理HTTPS

## 🛠️ 快速修复命令

```bash
# 1. 在宝塔面板中关闭强制HTTPS

# 2. 重载Nginx
nginx -s reload

# 3. 确保后端运行
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend

# 4. 测试
curl http://blog.lyingshine.top
curl http://blog.lyingshine.top:3000/api/health
```

选择方案一是最快的解决方法，可以立即解决混合内容问题！