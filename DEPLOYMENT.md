# 博客系统部署指南

本指南将帮助你将博客系统部署到服务器上，域名为 `blog.lyingshine.top`，通过反向代理到本地8080端口。

## 🚀 部署架构

```
Internet → Nginx (443/80) → Docker Containers
                          ├── Frontend (8080)
                          ├── Backend (3000)
                          └── MySQL (3306)
```

## 📋 部署前准备

### 1. 服务器要求
- Ubuntu 20.04+ 或 CentOS 8+
- 至少 2GB RAM
- 至少 20GB 存储空间
- Docker 和 Docker Compose

### 2. 域名配置
- 确保域名 `blog.lyingshine.top` 已解析到你的服务器IP
- 申请SSL证书（推荐使用Let's Encrypt）

### 3. 安装依赖

#### 安装Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 安装Nginx
```bash
# Ubuntu
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install nginx
```

## 🔧 部署步骤

### 1. 克隆项目
```bash
cd /var/www
sudo git clone https://github.com/lyingshine/blog.git
cd blog
sudo chown -R $USER:$USER .
```

### 2. 配置环境变量
```bash
# 复制并编辑生产环境配置
cp .env.production .env
nano .env
```

编辑 `.env` 文件，设置以下变量：
```env
# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USER=blog_user
DB_PASSWORD=your_secure_password_here
DB_NAME=blog_db

# MySQL Root密码
MYSQL_ROOT_PASSWORD=your_root_password_here

# JWT密钥（生成一个强密钥）
JWT_SECRET=your_jwt_secret_key_here

# 服务器配置
PORT=3000
FRONTEND_URL=https://blog.lyingshine.top
BACKEND_URL=https://blog.lyingshine.top/api
```

### 3. 配置前端环境变量
```bash
# 创建前端环境变量文件
cat > frontend/.env.production << EOF
VITE_API_BASE_URL=https://blog.lyingshine.top/api
EOF
```

### 4. 配置Nginx反向代理

#### 申请SSL证书（使用Let's Encrypt）
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d blog.lyingshine.top
```

#### 配置Nginx站点
```bash
sudo cp nginx-server.conf /etc/nginx/sites-available/blog.lyingshine.top
sudo ln -s /etc/nginx/sites-available/blog.lyingshine.top /etc/nginx/sites-enabled/
```

编辑配置文件，更新SSL证书路径：
```bash
sudo nano /etc/nginx/sites-available/blog.lyingshine.top
```

更新证书路径：
```nginx
ssl_certificate /etc/letsencrypt/live/blog.lyingshine.top/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/blog.lyingshine.top/privkey.pem;
```

#### 测试并重启Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. 部署应用
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 6. 初始化数据库
```bash
# 进入后端容器
docker exec -it blog-backend bash

# 运行数据库初始化（如果需要）
node -e "
const { fixDatabase, createSampleData } = require('./scripts/fix-database');
(async () => {
  await fixDatabase();
  await createSampleData();
  console.log('数据库初始化完成');
  process.exit(0);
})();
"

exit
```

## 🔍 验证部署

### 1. 检查服务状态
```bash
# 检查Docker容器
docker-compose ps

# 检查Nginx状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep -E ':(80|443|3000|8080)'
```

### 2. 测试访问
```bash
# 测试前端
curl -I https://blog.lyingshine.top

# 测试后端API
curl https://blog.lyingshine.top/api/health

# 测试数据库连接
curl https://blog.lyingshine.top/api/articles
```

### 3. 查看日志
```bash
# 查看容器日志
docker-compose logs -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/blog.lyingshine.top.access.log
sudo tail -f /var/log/nginx/blog.lyingshine.top.error.log
```

## 🔄 更新部署

### 1. 更新代码
```bash
cd /var/www/blog
git pull origin master
```

### 2. 重新部署
```bash
./deploy.sh
```

## 🛠️ 维护命令

### 备份数据库
```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec blog-mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD blog_db > backup_$DATE.sql
echo "数据库备份完成: backup_$DATE.sql"
EOF

chmod +x backup.sh
./backup.sh
```

### 查看资源使用
```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
du -sh /var/www/blog
```

### 清理Docker资源
```bash
# 清理未使用的镜像和容器
docker system prune -f

# 清理未使用的卷
docker volume prune -f
```

## 🚨 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   docker-compose logs [service_name]
   ```

2. **数据库连接失败**
   - 检查环境变量配置
   - 确认MySQL容器正常运行
   - 检查网络连接

3. **SSL证书问题**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /var/www/blog
   ```

5. **端口被占用**
   ```bash
   sudo lsof -i :8080
   sudo lsof -i :3000
   ```

## 📊 监控和日志

### 设置日志轮转
```bash
sudo nano /etc/logrotate.d/blog
```

添加内容：
```
/var/log/nginx/blog.lyingshine.top.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

### 设置监控脚本
```bash
cat > monitor.sh << 'EOF'
#!/bin/bash
# 检查服务状态
if ! curl -f https://blog.lyingshine.top/api/health > /dev/null 2>&1; then
    echo "$(date): 博客服务异常" >> /var/log/blog-monitor.log
    # 可以添加重启逻辑或发送告警
fi
EOF

chmod +x monitor.sh

# 添加到crontab（每5分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/blog/monitor.sh") | crontab -
```

## 🎉 部署完成

部署完成后，你的博客系统将在以下地址可用：
- 🌐 前端: https://blog.lyingshine.top
- 🔌 API: https://blog.lyingshine.top/api
- 💓 健康检查: https://blog.lyingshine.top/api/health

记得定期备份数据库和更新SSL证书！