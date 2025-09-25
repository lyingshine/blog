# 宝塔面板反向代理设置指南

## 🎯 目标配置

- 前端：`https://blog.lyingshine.top` → 静态文件服务
- API：`https://blog.lyingshine.top/api` → 反向代理到后端3000端口
- 统一HTTPS访问，解决混合内容问题

## 📋 详细操作步骤

### 第一步：SSL证书配置

#### 1. 申请SSL证书
1. 登录宝塔面板
2. 网站 → 找到 `blog.lyingshine.top`
3. 设置 → SSL
4. 选择 "Let's Encrypt" 免费证书
5. 填写邮箱，点击申请
6. 等待证书申请成功

#### 2. 开启强制HTTPS
1. 在SSL页面，开启 "强制HTTPS"
2. 这样HTTP请求会自动跳转到HTTPS

### 第二步：配置反向代理

#### 方法一：使用宝塔面板反向代理功能

1. **添加反向代理**
   - 网站设置 → 反向代理
   - 点击 "添加反向代理"
   - 配置如下：
     ```
     代理名称: API代理
     目标URL: http://127.0.0.1:3000
     代理目录: /api
     ```

2. **高级设置**
   ```
   发送域名: $host
   缓存: 关闭
   ```

#### 方法二：直接修改Nginx配置（推荐）

1. **编辑配置文件**
   - 网站设置 → 配置文件
   - 将配置替换为以下内容：

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
    
    # 网站根目录
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # API反向代理 - 关键配置！
    location /api {
        proxy_pass http://127.0.0.1:3000;
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
```

2. **保存配置**
   - 点击保存
   - 系统会自动检查配置语法

### 第三步：部署应用

#### 1. 上传代码
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

#### 3. 启动后端
```bash
cd ../backend
npm install
pm2 start ecosystem.config.js
```

### 第四步：防火墙设置

#### 1. 开放必要端口
在宝塔面板 → 安全 → 防火墙：
- 开放 80 端口（HTTP）
- 开放 443 端口（HTTPS）
- **关闭 3000 端口**（安全考虑，只允许内部访问）

#### 2. 服务器防火墙
如果使用云服务器，还需要在云服务商控制台开放80和443端口。

### 第五步：测试验证

#### 1. 基础连通性测试
```bash
# 测试HTTPS访问
curl -I https://blog.lyingshine.top

# 测试API代理
curl https://blog.lyingshine.top/api/health
```

#### 2. 浏览器测试
1. 访问 `https://blog.lyingshine.top`
2. 打开开发者工具 → Network
3. 尝试登录，观察：
   - API请求URL应该是 `https://blog.lyingshine.top/api/...`
   - 不应该有混合内容错误
   - 请求应该成功返回

#### 3. 检查日志
在宝塔面板 → 网站 → 日志，查看访问日志和错误日志。

## 🔧 常见问题解决

### 1. 502 Bad Gateway
**原因**：后端服务未启动或端口不通

**解决**：
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 status
pm2 restart blog-backend
```

### 2. SSL证书错误
**原因**：证书配置问题

**解决**：
1. 重新申请SSL证书
2. 检查域名解析是否正确
3. 确保域名已备案（如果在中国大陆）

### 3. API请求404
**原因**：反向代理配置错误

**解决**：
1. 检查Nginx配置中的 `location /api` 块
2. 确保 `proxy_pass` 指向正确的后端地址
3. 重载Nginx配置

### 4. 静态文件404
**原因**：前端构建文件不存在

**解决**：
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
npm run build
# 确保dist目录存在且有文件
ls -la dist/
```

## 📊 配置验证清单

- [ ] SSL证书申请成功
- [ ] 强制HTTPS已开启
- [ ] Nginx配置包含API反向代理
- [ ] 前端已构建到dist目录
- [ ] 后端服务在3000端口运行
- [ ] 防火墙开放80、443端口
- [ ] 防火墙关闭3000端口
- [ ] 浏览器访问无混合内容错误
- [ ] API请求正常响应

## 🎉 完成后的访问方式

- **前端页面**：`https://blog.lyingshine.top`
- **API接口**：`https://blog.lyingshine.top/api/...`
- **管理后台**：`https://blog.lyingshine.top/admin`

所有请求都通过HTTPS，安全且无混合内容问题！

## 📝 维护建议

1. **定期备份**：使用宝塔面板的计划任务功能定期备份网站和数据库
2. **监控日志**：定期查看访问日志和错误日志
3. **更新依赖**：定期更新前后端依赖包
4. **SSL续期**：Let's Encrypt证书会自动续期，但要关注续期状态

按照这个指南操作，你的博客系统就能完美运行了！