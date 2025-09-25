# 宝塔面板部署故障排除指南

## 🚨 常见问题及解决方案

### 1. Node.js应用启动失败

#### 问题现象
- PM2显示应用状态为 `errored` 或 `stopped`
- 访问API返回502错误

#### 排查步骤
```bash
# 1. 查看PM2状态
pm2 status

# 2. 查看详细日志
pm2 logs blog-backend --lines 50

# 3. 检查端口占用
netstat -tlnp | grep :3000
lsof -i :3000

# 4. 手动启动测试
cd /www/wwwroot/blog.lyingshine.top/backend
node server.js
```

#### 常见原因及解决方案

**原因1：环境变量配置错误**
```bash
# 检查环境变量文件
cat backend/.env

# 确保包含必要配置
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=blog_db
DB_PASSWORD=正确的数据库密码
DB_NAME=blog_db
JWT_SECRET=强密钥
```

**原因2：数据库连接失败**
```bash
# 测试数据库连接
mysql -u blog_db -p blog_db
# 输入密码后应该能正常连接

# 检查数据库服务状态
systemctl status mysql
```

**原因3：依赖包缺失**
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
npm install --production
```

**原因4：权限问题**
```bash
chown -R www:www /www/wwwroot/blog.lyingshine.top
chmod -R 755 /www/wwwroot/blog.lyingshine.top
```

### 2. 前端页面无法访问

#### 问题现象
- 访问域名显示404或默认页面
- 静态资源加载失败

#### 排查步骤
```bash
# 1. 检查构建文件是否存在
ls -la /www/wwwroot/blog.lyingshine.top/frontend/dist/

# 2. 检查Nginx配置
nginx -t

# 3. 查看Nginx错误日志
tail -f /www/wwwlogs/blog.lyingshine.top.error.log

# 4. 检查文件权限
ls -la /www/wwwroot/blog.lyingshine.top/frontend/dist/
```

#### 解决方案

**问题1：前端未构建或构建失败**
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
npm install
npm run build

# 检查构建结果
ls -la dist/
```

**问题2：Nginx配置错误**
- 检查网站根目录配置是否指向 `frontend/dist`
- 确认反向代理配置正确
- 重新加载Nginx配置：`nginx -s reload`

**问题3：文件权限问题**
```bash
chown -R www:www /www/wwwroot/blog.lyingshine.top/frontend/dist
chmod -R 755 /www/wwwroot/blog.lyingshine.top/frontend/dist
```

### 3. 数据库相关问题

#### 问题现象
- API返回数据库连接错误
- 数据查询失败

#### 排查步骤
```bash
# 1. 检查MySQL服务状态
systemctl status mysql

# 2. 测试数据库连接
mysql -u blog_db -p blog_db

# 3. 检查数据库表是否存在
mysql -u blog_db -p blog_db -e "SHOW TABLES;"

# 4. 查看数据库错误日志
tail -f /var/log/mysql/error.log
```

#### 解决方案

**问题1：数据库服务未启动**
```bash
systemctl start mysql
systemctl enable mysql
```

**问题2：数据库用户权限不足**
```sql
-- 登录MySQL root用户
mysql -u root -p

-- 授权用户权限
GRANT ALL PRIVILEGES ON blog_db.* TO 'blog_db'@'localhost';
FLUSH PRIVILEGES;
```

**问题3：数据库表不存在**
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
mysql -u blog_db -p blog_db < database/migration.sql
```

### 4. SSL证书问题

#### 问题现象
- HTTPS访问显示不安全
- 证书过期警告

#### 排查步骤
```bash
# 1. 检查证书文件
ls -la /www/server/panel/vhost/cert/blog.lyingshine.top/

# 2. 检查证书有效期
openssl x509 -in /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem -text -noout | grep "Not After"

# 3. 测试SSL配置
openssl s_client -connect blog.lyingshine.top:443 -servername blog.lyingshine.top
```

#### 解决方案

**问题1：证书未正确配置**
- 在宝塔面板重新申请Let's Encrypt证书
- 检查域名DNS解析是否正确

**问题2：证书过期**
- 宝塔面板 → 网站设置 → SSL → 续签证书
- 设置自动续签

### 5. API接口404错误

#### 问题现象
- 前端可以访问，但API调用返回404
- 后端服务正常运行

#### 排查步骤
```bash
# 1. 直接测试后端API
curl http://localhost:3000/api/health

# 2. 检查Nginx反向代理配置
cat /www/server/panel/vhost/nginx/blog.lyingshine.top.conf

# 3. 查看Nginx访问日志
tail -f /www/wwwlogs/blog.lyingshine.top.log
```

#### 解决方案

**问题1：Nginx反向代理配置错误**
确保Nginx配置中包含：
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    # ... 其他配置
}
```

**问题2：后端路由配置问题**
检查后端server.js中的路由配置

### 6. 文件上传失败

#### 问题现象
- 头像上传失败
- 文件上传接口报错

#### 排查步骤
```bash
# 1. 检查上传目录权限
ls -la /www/wwwroot/blog.lyingshine.top/backend/uploads/

# 2. 检查磁盘空间
df -h

# 3. 查看上传相关日志
pm2 logs blog-backend | grep upload
```

#### 解决方案

**问题1：上传目录权限不足**
```bash
mkdir -p /www/wwwroot/blog.lyingshine.top/backend/uploads/avatars
chown -R www:www /www/wwwroot/blog.lyingshine.top/backend/uploads
chmod -R 755 /www/wwwroot/blog.lyingshine.top/backend/uploads
```

**问题2：文件大小限制**
检查Nginx配置中的 `client_max_body_size` 设置

### 7. 性能问题

#### 问题现象
- 网站访问速度慢
- 服务器资源使用率高

#### 排查步骤
```bash
# 1. 查看系统资源使用
htop
free -h
df -h

# 2. 查看PM2应用资源使用
pm2 monit

# 3. 分析Nginx访问日志
tail -f /www/wwwlogs/blog.lyingshine.top.log
```

#### 解决方案

**问题1：内存不足**
- 增加服务器内存
- 优化PM2配置，限制内存使用

**问题2：数据库查询慢**
- 添加数据库索引
- 优化SQL查询

**问题3：静态资源未缓存**
确保Nginx配置中包含缓存设置

## 🔧 调试工具和命令

### 系统监控
```bash
# 查看系统资源
htop
iostat -x 1
sar -u 1

# 查看网络连接
netstat -tlnp
ss -tlnp

# 查看磁盘使用
df -h
du -sh /www/wwwroot/blog.lyingshine.top/
```

### 应用调试
```bash
# PM2相关
pm2 status
pm2 logs blog-backend
pm2 monit
pm2 restart blog-backend
pm2 reload blog-backend

# Node.js调试
node --inspect backend/server.js
```

### 网络调试
```bash
# 测试API连接
curl -I https://blog.lyingshine.top/api/health
curl -X GET https://blog.lyingshine.top/api/articles

# 测试数据库连接
telnet localhost 3306
```

### 日志分析
```bash
# 实时查看日志
tail -f /www/wwwlogs/blog.lyingshine.top.log
tail -f /www/wwwlogs/blog.lyingshine.top.error.log
tail -f /var/log/mysql/error.log

# 分析访问日志
awk '{print $1}' /www/wwwlogs/blog.lyingshine.top.log | sort | uniq -c | sort -nr
```

## 📞 获取帮助

如果以上方法都无法解决问题，可以：

1. **查看完整日志**：收集所有相关日志信息
2. **检查配置文件**：确认所有配置文件内容正确
3. **重现问题**：记录详细的问题重现步骤
4. **环境信息**：收集服务器环境、软件版本等信息

## 🔄 重新部署

如果问题严重，可以考虑重新部署：

```bash
# 1. 备份数据
mysqldump -u blog_db -p blog_db > backup.sql
cp -r /www/wwwroot/blog.lyingshine.top/backend/uploads /tmp/

# 2. 停止服务
pm2 stop blog-backend
pm2 delete blog-backend

# 3. 清理文件
rm -rf /www/wwwroot/blog.lyingshine.top/*

# 4. 重新部署
# 按照MANUAL_DEPLOYMENT_BT.md重新部署

# 5. 恢复数据
mysql -u blog_db -p blog_db < backup.sql
cp -r /tmp/uploads /www/wwwroot/blog.lyingshine.top/backend/
```

记住：在进行任何重大操作前，一定要先备份数据！