# 宝塔面板部署快速命令

## 🚀 一键部署命令集合

### 1. 初始化项目
```bash
# 进入网站目录
cd /www/wwwroot/blog.lyingshine.top

# 克隆项目
git clone https://github.com/lyingshine/blog.git .

# 设置权限
chown -R www:www /www/wwwroot/blog.lyingshine.top
chmod -R 755 /www/wwwroot/blog.lyingshine.top
```

### 2. 后端部署
```bash
# 进入后端目录
cd /www/wwwroot/blog.lyingshine.top/backend

# 安装依赖
npm install --production

# 启动服务（使用PM2）
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. 前端部署
```bash
# 进入前端目录
cd /www/wwwroot/blog.lyingshine.top/frontend

# 清理并重新安装依赖（解决vite找不到的问题）
rm -rf node_modules package-lock.json
npm cache clean --force
npm config set registry https://registry.npmmirror.com
npm install

# 构建生产版本
npm run build

# 如果构建失败，尝试使用npx
# npx vite build
```

### 4. 数据库初始化
```bash
# 导入数据库结构
cd /www/wwwroot/blog.lyingshine.top
mysql -u blog_user -p blog_db < backend/database/migration.sql
```

## 🔧 常用维护命令

### PM2管理
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs blog-backend

# 重启服务
pm2 restart blog-backend

# 停止服务
pm2 stop blog-backend

# 删除服务
pm2 delete blog-backend
```

### 更新部署
```bash
# 拉取最新代码
cd /www/wwwroot/blog.lyingshine.top
git pull origin master

# 重新构建前端
cd frontend
npm run build

# 重启后端服务
pm2 restart blog-backend
```

### 日志查看
```bash
# 查看PM2日志
pm2 logs blog-backend --lines 100

# 查看Nginx访问日志
tail -f /www/wwwlogs/blog.lyingshine.top.log

# 查看Nginx错误日志
tail -f /www/wwwlogs/blog.lyingshine.top.error.log
```

## 🔍 故障排查命令

### 检查服务状态
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查进程
ps aux | grep node

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 测试连接
```bash
# 测试后端API
curl http://localhost:3000/api/health

# 测试数据库连接
mysql -u blog_user -p blog_db -e "SELECT 1"

# 测试Nginx配置
nginx -t
```

## 📊 监控命令

### 系统监控
```bash
# 实时查看系统资源
htop

# 查看系统负载
uptime

# 查看磁盘IO
iostat -x 1

# 查看网络连接
ss -tuln
```

### 应用监控
```bash
# PM2监控面板
pm2 monit

# 查看Node.js内存使用
pm2 show blog-backend

# 查看详细日志
pm2 logs blog-backend --timestamp
```

## 🔒 安全检查命令

### 权限检查
```bash
# 检查文件权限
ls -la /www/wwwroot/blog.lyingshine.top/

# 检查上传目录权限
ls -la /www/wwwroot/blog.lyingshine.top/backend/uploads/

# 修复权限
chown -R www:www /www/wwwroot/blog.lyingshine.top/
chmod -R 755 /www/wwwroot/blog.lyingshine.top/
chmod -R 777 /www/wwwroot/blog.lyingshine.top/backend/uploads/
```

### 防火墙检查
```bash
# 查看防火墙状态
ufw status

# 查看开放端口
netstat -tlnp
```

## 📦 备份命令

### 数据库备份
```bash
# 备份数据库
mysqldump -u blog_user -p blog_db > /www/backup/blog_db_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u blog_user -p blog_db < /www/backup/blog_db_20240101_120000.sql
```

### 文件备份
```bash
# 备份整个项目
tar -czf /www/backup/blog_$(date +%Y%m%d_%H%M%S).tar.gz /www/wwwroot/blog.lyingshine.top/

# 只备份上传文件
tar -czf /www/backup/uploads_$(date +%Y%m%d_%H%M%S).tar.gz /www/wwwroot/blog.lyingshine.top/backend/uploads/
```

## 🔄 自动化脚本

### 创建更新脚本
```bash
# 创建更新脚本
cat > /www/wwwroot/blog.lyingshine.top/update.sh << 'EOF'
#!/bin/bash
echo "开始更新博客系统..."

# 进入项目目录
cd /www/wwwroot/blog.lyingshine.top

# 拉取最新代码
git pull origin master

# 安装后端依赖（如果有新依赖）
cd backend
npm install --production

# 构建前端
cd ../frontend
npm run build

# 重启后端服务
pm2 restart blog-backend

echo "更新完成！"
EOF

# 设置执行权限
chmod +x /www/wwwroot/blog.lyingshine.top/update.sh
```

### 创建备份脚本
```bash
# 创建备份脚本
cat > /www/backup/backup_blog.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
mysqldump -u blog_user -p你的数据库密码 blog_db > /www/backup/blog_db_$DATE.sql

# 备份上传文件
tar -czf /www/backup/uploads_$DATE.tar.gz /www/wwwroot/blog.lyingshine.top/backend/uploads/

# 删除7天前的备份
find /www/backup -name "blog_db_*.sql" -mtime +7 -delete
find /www/backup -name "uploads_*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
EOF

# 设置执行权限
chmod +x /www/backup/backup_blog.sh

# 添加到定时任务（每天凌晨2点备份）
echo "0 2 * * * /www/backup/backup_blog.sh" | crontab -
```

使用这些命令可以快速完成部署和日常维护！