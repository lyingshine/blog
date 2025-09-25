# 宝塔面板3000端口SSL配置指南

## 🎯 宝塔面板Nginx配置说明

宝塔面板使用自己的Nginx配置结构，不使用标准的 `sites-available/sites-enabled` 目录。需要直接在宝塔面板中配置或手动添加配置文件。

## 📋 方法一：宝塔面板直接配置（推荐）

### 1. 在宝塔面板中添加新网站

1. 登录宝塔面板
2. 网站 → 添加站点
3. 配置如下：
   ```
   域名: api.blog.lyingshine.top
   根目录: /www/wwwroot/blog.lyingshine.top/backend
   PHP版本: 纯静态
   ```

### 2. 配置SSL证书

1. 进入新建网站的设置
2. SSL → Let's Encrypt
3. 申请证书（域名填写 `api.blog.lyingshine.top`）

### 3. 修改网站配置

1. 网站设置 → 配置文件
2. 替换为以下配置：

```nginx
server {
    listen 80;
    server_name api.blog.lyingshine.top;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.blog.lyingshine.top;
    
    # SSL配置
    ssl_certificate /www/server/panel/vhost/cert/api.blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/api.blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 代理到后端服务
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
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

## 📋 方法二：手动添加配置文件（适用于当前域名）

### 1. 创建独立配置文件

```bash
# 创建API配置文件
sudo nano /www/server/panel/vhost/nginx/blog-api-3000.conf
```

### 2. 添加配置内容

```nginx
server {
    listen 3000 ssl http2;
    server_name blog.lyingshine.top;
    
    # 使用主站的SSL证书
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 代理到后端服务
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 64k;
        proxy_buffers 8 64k;
    }
    
    # 日志配置
    access_log /www/wwwroot/blog.lyingshine.top/logs/api-access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/api-error.log;
}
```

### 3. 包含配置文件

编辑主Nginx配置文件：
```bash
sudo nano /www/server/nginx/conf/nginx.conf
```

在 `http` 块中添加：
```nginx
http {
    # ... 其他配置 ...
    
    # 包含API配置
    include /www/server/panel/vhost/nginx/blog-api-3000.conf;
    
    # ... 其他配置 ...
}
```

### 4. 测试并重载配置

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

## 📋 方法三：修改主站配置（最简单）

### 1. 编辑主站配置

在宝塔面板中：
1. 网站 → blog.lyingshine.top → 设置 → 配置文件
2. 在现有配置后面添加新的server块：

```nginx
# 在现有配置后面添加
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
    }
}
```

## 🚀 推荐执行步骤（方法三）

### 1. 创建日志目录
```bash
mkdir -p /www/wwwroot/blog.lyingshine.top/logs
chown -R www:www /www/wwwroot/blog.lyingshine.top/logs
```

### 2. 在宝塔面板中修改配置
1. 网站 → blog.lyingshine.top → 设置 → 配置文件
2. 在现有配置的最后添加上面的server块
3. 保存配置

### 3. 重启后端服务
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
pm2 status
```

### 4. 测试配置
```bash
# 测试HTTPS API访问
curl -k https://blog.lyingshine.top:3000/api/health

# 检查端口监听
netstat -tlnp | grep 3000
```

## 🔍 验证步骤

### 1. 检查Nginx配置
在宝塔面板中查看配置是否保存成功

### 2. 检查SSL证书
```bash
openssl s_client -connect blog.lyingshine.top:3000 -servername blog.lyingshine.top
```

### 3. 测试API访问
```bash
curl -k https://blog.lyingshine.top:3000/api/health
```

### 4. 浏览器测试
访问 `https://blog.lyingshine.top`，测试登录功能

## 🛠️ 故障排除

### 1. 配置保存失败
- 检查Nginx配置语法
- 确保SSL证书文件存在

### 2. 端口访问失败
- 检查防火墙是否开放3000端口
- 确认后端服务运行在3001端口

### 3. SSL证书错误
- 确认证书文件路径正确
- 检查证书是否过期

推荐使用方法三，直接在宝塔面板中修改主站配置，最简单有效！