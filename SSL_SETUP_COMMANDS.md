# 3000端口SSL配置执行命令

## 🎯 配置目标

为后端3000端口配置HTTPS访问，解决混合内容问题：
- 前端：`https://blog.lyingshine.top` (443端口)
- 后端：`https://blog.lyingshine.top:3000` (SSL代理到内部3001端口)

## 📋 执行步骤

### 第一步：创建Nginx SSL代理配置

#### 1. 创建配置文件
```bash
# 创建API SSL配置文件
sudo nano /etc/nginx/sites-available/blog-api
```

#### 2. 粘贴配置内容
将以下内容粘贴到文件中：

```nginx
server {
    listen 3000 ssl http2;
    server_name blog.lyingshine.top;
    
    # SSL证书配置（使用与主站相同的证书）
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 代理到本地后端服务
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

#### 3. 启用配置
```bash
# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 如果测试通过，重载Nginx
sudo nginx -s reload
```

### 第二步：更新后端配置

后端配置已更新为监听3001端口（内部端口），通过Nginx代理提供3000端口的HTTPS访问。

#### 1. 确认后端配置
检查 `backend/.env` 文件：
```env
PORT=3001
HOST=127.0.0.1
```

#### 2. 重启后端服务
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend
pm2 status
```

### 第三步：创建日志目录

```bash
# 创建日志目录
mkdir -p /www/wwwroot/blog.lyingshine.top/logs

# 设置权限
chown -R www-data:www-data /www/wwwroot/blog.lyingshine.top/logs
chmod 755 /www/wwwroot/blog.lyingshine.top/logs
```

### 第四步：防火墙配置

#### 1. 宝塔面板防火墙
在宝塔面板 → 安全 → 防火墙中确保开放：
- 80/tcp (HTTP)
- 443/tcp (HTTPS)
- 3000/tcp (API HTTPS)

#### 2. 系统防火墙（如果启用）
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 🔍 验证配置

### 1. 检查Nginx配置
```bash
# 测试配置语法
sudo nginx -t

# 查看监听端口
sudo netstat -tlnp | grep nginx
```

### 2. 检查后端服务
```bash
# 检查后端进程
pm2 status

# 查看后端日志
pm2 logs blog-backend

# 测试内部3001端口
curl http://127.0.0.1:3001/api/health
```

### 3. 测试SSL代理
```bash
# 测试3000端口HTTPS访问
curl -k https://blog.lyingshine.top:3000/api/health

# 检查SSL证书
openssl s_client -connect blog.lyingshine.top:3000 -servername blog.lyingshine.top
```

### 4. 浏览器测试
1. 访问 `https://blog.lyingshine.top`
2. 打开开发者工具 → Network
3. 尝试登录，观察API请求：
   - URL应该是：`https://blog.lyingshine.top:3000/api/...`
   - 应该没有混合内容错误
   - 请求应该成功返回

## 🛠️ 故障排除

### 1. Nginx配置错误
```bash
# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查配置文件语法
sudo nginx -t
```

### 2. SSL证书问题
```bash
# 检查证书文件是否存在
ls -la /www/server/panel/vhost/cert/blog.lyingshine.top/

# 检查证书有效期
openssl x509 -in /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem -text -noout
```

### 3. 端口冲突
```bash
# 检查3000端口占用
sudo netstat -tlnp | grep 3000

# 检查3001端口占用
sudo netstat -tlnp | grep 3001
```

### 4. 后端连接问题
```bash
# 测试后端健康检查
curl http://127.0.0.1:3001/api/health

# 查看后端详细日志
pm2 logs blog-backend --lines 50
```

## 📊 配置验证清单

- [ ] Nginx SSL代理配置文件已创建
- [ ] 配置文件已启用（软链接创建）
- [ ] Nginx配置测试通过
- [ ] Nginx已重载
- [ ] 后端端口已改为3001
- [ ] 后端服务已重启
- [ ] 日志目录已创建
- [ ] 防火墙已开放3000端口
- [ ] 可以通过HTTPS访问3000端口
- [ ] API请求正常响应
- [ ] 前端登录功能正常

## 🎉 完成后的访问方式

- **前端页面**：`https://blog.lyingshine.top` (Nginx直接服务)
- **后端API**：`https://blog.lyingshine.top:3000/api/...` (Nginx SSL代理)
- **内部后端**：`http://127.0.0.1:3001` (仅内部访问)

这样配置后，前端和后端都使用HTTPS，完全解决混合内容问题！

## 📝 一键执行脚本

如果你想要一键执行所有配置，可以创建并运行以下脚本：

```bash
#!/bin/bash
# 3000端口SSL配置一键脚本

echo "开始配置3000端口SSL代理..."

# 1. 创建Nginx配置
cat > /etc/nginx/sites-available/blog-api << 'EOF'
server {
    listen 3000 ssl http2;
    server_name blog.lyingshine.top;
    
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
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
EOF

# 2. 启用配置
ln -sf /etc/nginx/sites-available/blog-api /etc/nginx/sites-enabled/

# 3. 创建日志目录
mkdir -p /www/wwwroot/blog.lyingshine.top/logs
chown -R www-data:www-data /www/wwwroot/blog.lyingshine.top/logs

# 4. 测试并重载Nginx
nginx -t && nginx -s reload

# 5. 重启后端服务
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 restart blog-backend

echo "SSL配置完成！"
echo "测试命令：curl -k https://blog.lyingshine.top:3000/api/health"
```

保存为 `setup-ssl.sh`，然后执行：
```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh