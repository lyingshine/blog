# HTTP2重复指令错误修正

## 🚨 问题分析

错误信息：
```
nginx: [emerg] "http2" directive is duplicate in /www/server/panel/vhost/nginx/html_blog.lyingshine.top.conf:74
```

**问题原因**：在同一个配置文件中，多个 `server` 块都使用了 `http2` 指令，导致重复冲突。

## ✅ 解决方案

### 方案一：移除3000端口的http2指令（推荐）

修改3000端口的配置，去掉 `http2`：

```nginx
server {
    listen 3000 ssl;  # 移除 http2
    server_name blog.lyingshine.top;
    
    # SSL证书配置
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

### 方案二：简化SSL配置

使用更简化的SSL配置：

```nginx
server {
    listen 3000 ssl;
    server_name blog.lyingshine.top;
    
    # 基本SSL配置
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    
    # 代理到后端
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 方案三：使用不同的端口

如果仍有问题，可以使用其他端口：

```nginx
server {
    listen 3001 ssl;  # 使用3001端口对外
    server_name blog.lyingshine.top;
    
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3002;  # 后端使用3002端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚀 推荐操作步骤

### 1. 使用方案一（推荐）

在宝塔面板中：
1. 网站 → `blog.lyingshine.top` → 设置 → 配置文件
2. 在现有配置末尾添加**不带http2**的配置：

```nginx
server {
    listen 3000 ssl;
    server_name blog.lyingshine.top;
    
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    access_log /www/wwwroot/blog.lyingshine.top/logs/api-access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/api-error.log;
}
```

### 2. 创建日志目录
```bash
mkdir -p /www/wwwroot/blog.lyingshine.top/logs
chown -R www:www /www/wwwroot/blog.lyingshine.top/logs
```

### 3. 重启后端服务
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
```

### 4. 测试配置
```bash
curl -k https://blog.lyingshine.top:3000/api/health
```

## 🔍 HTTP2指令说明

### 为什么会重复？
- Nginx的 `http2` 指令在同一个配置文件中只能使用一次
- 如果443端口已经使用了 `http2`，其他端口就不能再使用
- 这是Nginx的限制，不是配置错误

### HTTP2的影响
- 移除 `http2` 不会影响SSL功能
- 只是不使用HTTP/2协议，仍然是安全的HTTPS连接
- 对API请求的影响很小

## 🛠️ 故障排除

### 1. 如果仍有SSL错误
检查证书文件：
```bash
ls -la /www/server/panel/vhost/cert/blog.lyingshine.top/
```

### 2. 如果端口冲突
检查端口占用：
```bash
netstat -tlnp | grep 3000
netstat -tlnp | grep 3001
```

### 3. 如果代理失败
检查后端服务：
```bash
pm2 status
pm2 logs blog-backend
```

### 4. 测试不同的配置
如果方案一不行，尝试方案二的简化配置。

## 📋 完整的最小配置

如果你想要最简单的配置，使用这个：

```nginx
server {
    listen 3000 ssl;
    server_name blog.lyingshine.top;
    
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

这个配置最简单，出错概率最小！

## 🎯 关键要点

1. **移除http2指令**：`listen 3000 ssl;` 而不是 `listen 3000 ssl http2;`
2. **使用正确的证书路径**：`blog.lyingshine.top` 而不是 `api.blog.lyingshine.top`
3. **在网站配置文件中添加**：不是主配置文件
4. **确保后端运行在3001端口**

按照方案一操作，应该能成功解决问题！