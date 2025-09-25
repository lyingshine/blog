# Nginx 反向代理配置指南

## 🎯 配置目标

- 前端：`https://blog.lyingshine.top` → 静态文件
- API：`https://blog.lyingshine.top/api` → 反向代理到 `http://127.0.0.1:3000`
- 统一使用HTTPS，解决混合内容问题

## 📝 完整Nginx配置

### 1. 主配置文件
在宝塔面板中，网站设置 → 配置文件，替换为以下内容：

```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    
    # HTTP自动跳转到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.lyingshine.top;
    
    # SSL证书配置（宝塔面板会自动配置这部分）
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 网站根目录
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html index.htm;
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # API反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
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
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 64k;
        proxy_buffers 8 64k;
    }
    
    # 前端路由支持（Vue Router history模式）
    location / {
        try_files $uri $uri/ /index.html;
        
        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
    
    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ /\.ht {
        deny all;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 访问日志
    access_log /www/wwwroot/blog.lyingshine.top/logs/access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/error.log;
}
```

## 🚀 宝塔面板配置步骤

### 1. 配置SSL证书
1. 进入网站设置 → SSL
2. 申请Let's Encrypt免费证书
3. 或者上传自己的SSL证书
4. 开启强制HTTPS

### 2. 修改网站配置
1. 网站设置 → 配置文件
2. 将上面的Nginx配置复制粘贴替换原有配置
3. 保存配置

### 3. 创建日志目录
```bash
mkdir -p /www/wwwroot/blog.lyingshine.top/logs
```

### 4. 测试配置
```bash
nginx -t
```

### 5. 重载Nginx
```bash
nginx -s reload
```

## 🔧 后端配置调整

### 1. 更新后端CORS配置
编辑 `backend/app.js` 或相关文件，确保CORS配置正确：

```javascript
// CORS配置
app.use(cors({
  origin: [
    'https://blog.lyingshine.top',
    'http://localhost:5173', // 开发环境
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 2. 确保后端运行在3000端口
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
pm2 status
```

## 📋 部署步骤

### 1. 拉取最新代码
```bash
cd /www/wwwroot/blog.lyingshine.top
git pull origin master
```

### 2. 重新构建前端
```bash
cd frontend
npm run build
```

### 3. 重启后端服务
```bash
cd ../backend
pm2 restart blog-backend
```

### 4. 应用Nginx配置
在宝塔面板中应用上面的Nginx配置

### 5. 测试访问
- 访问：`https://blog.lyingshine.top`
- 测试登录功能
- 检查API请求是否正常

## 🔍 验证步骤

### 1. 检查SSL证书
```bash
curl -I https://blog.lyingshine.top
# 应该返回200状态码，且使用HTTPS
```

### 2. 检查API代理
```bash
curl https://blog.lyingshine.top/api/health
# 应该返回后端健康检查信息
```

### 3. 浏览器测试
1. 打开 `https://blog.lyingshine.top`
2. 打开开发者工具 → Network
3. 尝试登录，查看API请求：
   - 请求URL应该是 `https://blog.lyingshine.top/api/auth/login`
   - 状态码应该是200或相应的业务状态码
   - 不应该有混合内容错误

### 4. 检查日志
```bash
# 查看访问日志
tail -f /www/wwwroot/blog.lyingshine.top/logs/access.log

# 查看错误日志
tail -f /www/wwwroot/blog.lyingshine.top/logs/error.log
```

## ⚠️ 注意事项

### 1. SSL证书
- 确保SSL证书有效且未过期
- Let's Encrypt证书会自动续期

### 2. 防火墙设置
- 确保80和443端口开放
- 3000端口可以关闭（只允许本地访问）

### 3. 后端安全
- 后端只监听127.0.0.1:3000，不对外开放
- 所有外部访问都通过Nginx代理

### 4. 缓存策略
- 静态资源设置了长期缓存
- API请求不缓存

## 🛠️ 故障排除

### 1. 502 Bad Gateway
- 检查后端服务是否运行：`pm2 status`
- 检查3000端口是否监听：`netstat -tlnp | grep 3000`

### 2. SSL错误
- 检查证书配置路径是否正确
- 重新申请SSL证书

### 3. API请求失败
- 检查CORS配置
- 查看后端错误日志：`pm2 logs blog-backend`

### 4. 静态文件404
- 检查前端构建是否成功
- 确认dist目录存在且有文件

这个配置将完美解决混合内容问题，同时提供安全的HTTPS访问！