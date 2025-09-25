# SSL证书路径修正指南

## 🚨 问题分析

错误信息显示：
```
cannot load certificate "/www/server/panel/vhost/cert/api.blog.lyingshine.top/fullchain.pem": 
BIO_new_file() failed (SSL: error:02001002:system library:fopen:No such file or directory
```

**问题原因**：配置中使用了不存在的证书路径 `api.blog.lyingshine.top`，应该使用主域名 `blog.lyingshine.top` 的证书。

## ✅ 正确的SSL证书配置

### 1. 确认证书路径

首先检查现有证书：
```bash
ls -la /www/server/panel/vhost/cert/
```

应该看到 `blog.lyingshine.top` 目录，而不是 `api.blog.lyingshine.top`。

### 2. 正确的配置内容

在宝塔面板中，网站 → `blog.lyingshine.top` → 设置 → 配置文件，在末尾添加：

```nginx
server {
    listen 3000 ssl http2;
    server_name blog.lyingshine.top;
    
    # 使用主域名的SSL证书（正确路径）
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 代理到后端
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
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

## 🔍 证书路径检查命令

### 1. 检查证书目录
```bash
ls -la /www/server/panel/vhost/cert/
```

### 2. 检查具体证书文件
```bash
ls -la /www/server/panel/vhost/cert/blog.lyingshine.top/
```

应该看到：
- `fullchain.pem`
- `privkey.pem`

### 3. 验证证书有效性
```bash
openssl x509 -in /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem -text -noout | grep "Subject:"
```

## 🚀 完整操作步骤

### 1. 检查证书路径
```bash
# 确认证书存在
ls -la /www/server/panel/vhost/cert/blog.lyingshine.top/
```

### 2. 在宝塔面板中正确配置
1. 网站 → `blog.lyingshine.top` → 设置 → 配置文件
2. 在现有配置**末尾**添加上面的正确配置
3. **注意**：确保使用 `blog.lyingshine.top` 而不是 `api.blog.lyingshine.top`

### 3. 创建日志目录
```bash
mkdir -p /www/wwwroot/blog.lyingshine.top/logs
chown -R www:www /www/wwwroot/blog.lyingshine.top/logs
```

### 4. 测试配置
保存配置后，宝塔面板会自动测试Nginx配置。

### 5. 重启后端服务
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
```

### 6. 验证SSL访问
```bash
curl -k https://blog.lyingshine.top:3000/api/health
```

## 📋 完整的网站配置文件示例

假设你的完整网站配置文件应该是这样的：

```nginx
# 主站HTTP重定向
server {
    listen 80;
    server_name blog.lyingshine.top;
    return 301 https://$server_name$request_uri;
}

# 主站HTTPS配置
server {
    listen 443 ssl http2;
    server_name blog.lyingshine.top;
    
    # SSL证书
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 网站根目录
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# API SSL代理配置（新增）
server {
    listen 3000 ssl http2;
    server_name blog.lyingshine.top;
    
    # 使用相同的SSL证书
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 代理到后端
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
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

## 🛠️ 故障排除

### 1. 如果证书文件不存在
重新申请SSL证书：
1. 宝塔面板 → 网站 → `blog.lyingshine.top` → 设置 → SSL
2. Let's Encrypt → 申请证书

### 2. 如果证书路径不同
检查实际路径：
```bash
find /www/server/panel/vhost/cert/ -name "*.pem" | grep blog
```

### 3. 如果配置保存失败
检查语法：
```bash
nginx -t
```

关键是使用正确的证书路径：`blog.lyingshine.top` 而不是 `api.blog.lyingshine.top`！