# 前端404错误排查和解决指南

## 🚨 问题分析

主页访问出现404错误，可能的原因：
1. 前端静态文件未正确构建或部署
2. Nginx配置中的root路径错误
3. 前端构建文件不存在
4. 权限问题

## 🔍 诊断步骤

### 1. 检查前端构建文件
```bash
# 检查前端构建目录是否存在
ls -la /www/wwwroot/blog.lyingshine.top/frontend/

# 检查dist目录和文件
ls -la /www/wwwroot/blog.lyingshine.top/frontend/dist/

# 检查index.html是否存在
ls -la /www/wwwroot/blog.lyingshine.top/frontend/dist/index.html
```

### 2. 检查Nginx配置
```bash
# 查看当前网站配置
cat /www/server/panel/vhost/nginx/blog.lyingshine.top.conf

# 或者在宝塔面板中查看：网站 → blog.lyingshine.top → 设置 → 配置文件
```

### 3. 检查文件权限
```bash
# 检查目录权限
ls -la /www/wwwroot/blog.lyingshine.top/

# 检查前端文件权限
ls -la /www/wwwroot/blog.lyingshine.top/frontend/dist/
```

## ✅ 解决方案

### 方案一：重新构建前端

#### 1. 拉取最新代码
```bash
cd /www/wwwroot/blog.lyingshine.top
git pull origin master
```

#### 2. 构建前端
```bash
cd frontend
npm install
npm run build
```

#### 3. 检查构建结果
```bash
ls -la dist/
# 应该看到 index.html 和 assets/ 目录
```

### 方案二：修正Nginx配置

#### 1. 检查当前配置
在宝塔面板中：网站 → blog.lyingshine.top → 设置 → 配置文件

#### 2. 确保主站配置正确
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
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 网站根目录 - 关键配置！
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html index.htm;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 日志
    access_log /www/wwwroot/blog.lyingshine.top/logs/access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/error.log;
}

# API SSL代理配置
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
    
    access_log /www/wwwroot/blog.lyingshine.top/logs/api-access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/api-error.log;
}
```

### 方案三：修正文件权限

```bash
# 设置正确的文件权限
chown -R www:www /www/wwwroot/blog.lyingshine.top/
chmod -R 755 /www/wwwroot/blog.lyingshine.top/
chmod -R 644 /www/wwwroot/blog.lyingshine.top/frontend/dist/*
```

## 🚀 完整解决步骤

### 1. 诊断问题
```bash
# 检查前端文件
cd /www/wwwroot/blog.lyingshine.top
ls -la frontend/dist/

# 如果dist目录不存在或为空，需要重新构建
```

### 2. 重新构建前端
```bash
cd /www/wwwroot/blog.lyingshine.top
git pull origin master
cd frontend
npm install
npm run build
```

### 3. 检查构建结果
```bash
ls -la dist/
# 应该看到：
# index.html
# assets/
# 其他静态文件
```

### 4. 设置权限
```bash
chown -R www:www /www/wwwroot/blog.lyingshine.top/frontend/dist/
chmod -R 755 /www/wwwroot/blog.lyingshine.top/frontend/dist/
```

### 5. 检查Nginx配置
确保网站配置中的 `root` 路径正确：
```nginx
root /www/wwwroot/blog.lyingshine.top/frontend/dist;
```

### 6. 重载Nginx
```bash
nginx -s reload
```

### 7. 测试访问
```bash
# 测试主页
curl -I https://blog.lyingshine.top

# 测试API
curl -k https://blog.lyingshine.top:3000/api/health
```

## 🔍 常见问题和解决方法

### 1. dist目录不存在
**原因**：前端未构建
**解决**：执行 `npm run build`

### 2. index.html不存在
**原因**：构建失败或路径错误
**解决**：检查构建日志，重新构建

### 3. 权限被拒绝
**原因**：文件权限不正确
**解决**：设置正确的www用户权限

### 4. Nginx配置错误
**原因**：root路径配置错误
**解决**：确保指向正确的dist目录

## 📋 验证清单

- [ ] 前端代码已拉取最新版本
- [ ] 前端已成功构建（dist目录存在）
- [ ] index.html文件存在
- [ ] 文件权限设置正确（www:www）
- [ ] Nginx配置中root路径正确
- [ ] Nginx配置已重载
- [ ] 主页可以正常访问
- [ ] API接口可以正常访问

## 🛠️ 调试命令

### 查看Nginx错误日志
```bash
tail -f /www/wwwroot/blog.lyingshine.top/logs/error.log
```

### 查看访问日志
```bash
tail -f /www/wwwroot/blog.lyingshine.top/logs/access.log
```

### 测试文件访问
```bash
# 直接访问index.html
curl https://blog.lyingshine.top/index.html

# 检查文件是否可读
cat /www/wwwroot/blog.lyingshine.top/frontend/dist/index.html
```

## 🎯 最可能的原因

根据经验，404错误最常见的原因是：
1. **前端未构建**：dist目录不存在或为空
2. **路径配置错误**：Nginx的root路径不正确
3. **权限问题**：www用户无法读取文件

按照上面的步骤逐一排查，应该能解决问题！