# 宝塔面板正确的SSL配置方法

## ❌ 错误操作说明

刚才的错误是因为将 `server` 配置块添加到了错误的位置。`server` 指令必须在 `http` 块内，不能直接放在主配置文件的顶层。

## ✅ 正确操作方法

### 方法一：在网站配置文件中添加（推荐）

#### 1. 找到正确的配置文件位置
在宝塔面板中：
1. 网站 → `blog.lyingshine.top` → 设置 → 配置文件
2. **注意**：这里编辑的是网站专用的配置文件，不是主配置文件

#### 2. 在网站配置文件末尾添加
在现有的 `server` 块**之后**添加新的 `server` 块：

```nginx
# 现有的主站配置保持不变
server {
    listen 80;
    server_name blog.lyingshine.top;
    # ... 现有配置 ...
}

server {
    listen 443 ssl http2;
    server_name blog.lyingshine.top;
    # ... 现有配置 ...
}

# 在这里添加新的API SSL配置
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

### 方法二：创建独立配置文件

#### 1. 创建独立的配置文件
```bash
# 在宝塔面板的vhost目录创建配置文件
nano /www/server/panel/vhost/nginx/blog_api_3000.conf
```

#### 2. 添加配置内容
```nginx
server {
    listen 3000 ssl http2;
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
    }
    
    access_log /www/wwwroot/blog.lyingshine.top/logs/api-access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/api-error.log;
}
```

#### 3. 在主配置中包含此文件
编辑 `/www/server/nginx/conf/nginx.conf`，在 `http` 块中添加：
```nginx
http {
    # ... 其他配置 ...
    
    # 包含自定义配置
    include /www/server/panel/vhost/nginx/blog_api_3000.conf;
    
    # ... 其他配置 ...
}
```

### 方法三：使用宝塔面板的反向代理功能

#### 1. 添加反向代理
1. 网站 → `blog.lyingshine.top` → 设置 → 反向代理
2. 添加反向代理：
   ```
   代理名称: API-SSL
   目标URL: http://127.0.0.1:3001
   代理目录: /
   发送域名: $host
   ```

#### 2. 修改端口
由于宝塔面板的反向代理默认使用80/443端口，需要手动修改配置文件添加3000端口监听。

## 🚀 推荐执行步骤（方法一）

### 1. 恢复主配置文件
如果你刚才修改了主配置文件，先恢复它：
1. 宝塔面板 → 软件商店 → Nginx → 设置 → 配置修改
2. 删除刚才添加的错误配置
3. 保存并重载

### 2. 正确添加配置
1. 网站 → `blog.lyingshine.top` → 设置 → 配置文件
2. 在文件**末尾**添加上面的3000端口server块
3. 保存配置

### 3. 创建必要目录
```bash
mkdir -p /www/wwwroot/blog.lyingshine.top/logs
chown -R www:www /www/wwwroot/blog.lyingshine.top/logs
```

### 4. 重启服务
```bash
# 重载Nginx
nginx -s reload

# 重启后端
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
```

### 5. 测试配置
```bash
# 测试API访问
curl -k https://blog.lyingshine.top:3000/api/health
```

## 🔍 配置文件位置说明

### 宝塔面板的Nginx配置结构：
```
/www/server/nginx/conf/nginx.conf          # 主配置文件
/www/server/panel/vhost/nginx/             # 网站配置目录
├── blog.lyingshine.top.conf               # 你的网站配置文件
└── 其他网站配置文件...
```

### 正确的操作位置：
- ✅ 在网站配置文件中添加：`/www/server/panel/vhost/nginx/blog.lyingshine.top.conf`
- ❌ 不要在主配置文件中直接添加：`/www/server/nginx/conf/nginx.conf`

## 📋 完整示例配置

假设你的网站配置文件当前内容是：
```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.lyingshine.top;
    
    # SSL配置
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    # ... 其他SSL配置 ...
    
    # 网站根目录
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # ... 其他配置 ...
}
```

在这个配置的**最后**添加新的server块：
```nginx
# 在上面配置的最后添加
server {
    listen 3000 ssl http2;
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
    }
    
    access_log /www/wwwroot/blog.lyingshine.top/logs/api-access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/api-error.log;
}
```

这样就正确了！记住：**在网站配置文件中添加，不是在主配置文件中**。