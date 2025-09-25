# 前后端分离部署指南

## 🎯 部署架构

- **前端**：静态资源部署到Nginx，通过80/443端口访问
- **后端**：独立服务器进程，监听3000端口
- **通信**：前端直接请求后端的3000端口
- **优势**：完全分离，各自独立，便于维护和扩展

## 📋 部署步骤

### 第一步：前端静态资源部署

#### 1. 配置SSL证书
1. 宝塔面板 → 网站 → `blog.lyingshine.top`
2. 设置 → SSL → 申请Let's Encrypt证书
3. 开启强制HTTPS

#### 2. 配置Nginx（仅服务静态文件）
网站设置 → 配置文件，使用以下配置：

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
    
    # 网站根目录
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Vue Router history模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存和压缩
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        
        # 启用gzip压缩
        gzip_static on;
    }
    
    # 禁止访问敏感文件
    location ~ /\.(ht|git) {
        deny all;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
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
    
    # 日志
    access_log /www/wwwroot/blog.lyingshine.top/logs/access.log;
    error_log /www/wwwroot/blog.lyingshine.top/logs/error.log;
}
```

#### 3. 构建和部署前端
```bash
cd /www/wwwroot/blog.lyingshine.top
git pull origin master

cd frontend
npm install
npm run build

# 确认构建成功
ls -la dist/
```

### 第二步：后端服务部署

#### 1. 配置后端环境变量
编辑 `backend/.env`：

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 前端域名（用于CORS配置）
FRONTEND_URL=https://blog.lyingshine.top

# 数据库配置
DB_HOST=localhost
DB_USER=blog_user
DB_PASSWORD=your_secure_password_here
DB_NAME=blog_db

# JWT密钥
JWT_SECRET=your_very_secure_jwt_secret_key_here

# 其他配置...
```

#### 2. 更新CORS配置
确保 `backend/app.js` 中的CORS配置正确：

```javascript
app.use(cors({
  origin: [
    'https://blog.lyingshine.top',  // 生产环境前端域名
    'http://localhost:5173',       // 开发环境
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

#### 3. 启动后端服务
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
npm install
pm2 start ecosystem.config.js
pm2 save
```

### 第三步：防火墙和安全配置

#### 1. 开放必要端口
在宝塔面板 → 安全 → 防火墙：
- ✅ 开放 80 端口（HTTP重定向）
- ✅ 开放 443 端口（HTTPS前端）
- ✅ 开放 3000 端口（后端API）

#### 2. 云服务器安全组
如果使用云服务器，在控制台安全组中开放：
- 80/tcp
- 443/tcp  
- 3000/tcp

#### 3. 后端安全配置
在 `backend/app.js` 中添加安全中间件：

```javascript
// 安全中间件
app.use((req, res, next) => {
  // 设置安全头部
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 限制请求大小
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

## 🔍 验证部署

### 1. 前端验证
```bash
# 测试前端访问
curl -I https://blog.lyingshine.top
# 应该返回200状态码

# 测试静态资源
curl -I https://blog.lyingshine.top/assets/index.js
```

### 2. 后端验证
```bash
# 测试后端健康检查
curl https://blog.lyingshine.top:3000/api/health
# 应该返回JSON响应

# 检查后端进程
pm2 status
pm2 logs blog-backend
```

### 3. 浏览器测试
1. 访问 `https://blog.lyingshine.top`
2. 打开开发者工具 → Network
3. 测试登录功能，观察：
   - 前端页面正常加载
   - API请求到 `https://blog.lyingshine.top:3000/api/...`
   - 请求成功返回数据

## 📊 架构优势

### ✅ 优点
- **完全分离**：前后端独立部署，互不影响
- **性能优化**：Nginx专门处理静态文件，性能最佳
- **扩展性强**：可以独立扩展前端或后端
- **维护简单**：各自独立更新部署
- **CDN友好**：前端静态资源可以轻松接入CDN

### ⚠️ 注意事项
- **CORS配置**：确保后端正确配置跨域
- **HTTPS混合内容**：前端HTTPS访问后端HTTPS（3000端口需要配置SSL）
- **防火墙**：确保3000端口对外开放
- **监控**：需要分别监控前后端服务状态

## 🛠️ 故障排除

### 1. 前端404错误
- 检查Nginx配置中的root路径
- 确认前端构建文件存在：`ls -la frontend/dist/`

### 2. API请求失败
- 检查3000端口是否开放：`netstat -tlnp | grep 3000`
- 检查后端服务状态：`pm2 status`
- 查看后端日志：`pm2 logs blog-backend`

### 3. CORS错误
- 确认后端CORS配置包含前端域名
- 检查请求头是否正确

### 4. SSL证书问题
- 前端SSL：通过宝塔面板管理
- 后端SSL：如果需要，可以配置Nginx代理或使用Let's Encrypt

## 📋 部署清单

- [ ] 前端SSL证书配置完成
- [ ] Nginx配置仅处理静态文件
- [ ] 前端构建成功并部署到dist目录
- [ ] 后端环境变量配置正确
- [ ] 后端CORS配置包含前端域名
- [ ] 后端服务通过PM2启动
- [ ] 防火墙开放80、443、3000端口
- [ ] 前端页面可以正常访问
- [ ] API接口可以正常调用
- [ ] 登录等功能测试通过

这种部署方式是最标准的前后端分离架构！