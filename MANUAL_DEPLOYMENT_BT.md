# 博客系统 - 宝塔面板手动部署指南

本指南将详细介绍如何在宝塔面板中手动部署博客系统，域名为 `blog.lyingshine.top`。

## 🎯 部署架构

```
Internet → 宝塔Nginx → Node.js后端 (3000端口)
                    → 前端静态文件 (dist目录)
                    → MySQL数据库
```

## 📋 部署前准备

### 1. 宝塔面板软件要求
确保已安装以下软件：
- **Nginx** 1.20+
- **MySQL** 8.0
- **Node.js** 18+
- **PM2管理器**

### 2. 服务器要求
- Ubuntu 18.04+ 或 CentOS 7+
- 至少 2GB RAM
- 至少 20GB 存储空间

## 🚀 详细部署步骤

### 步骤1：创建网站

1. 登录宝塔面板
2. 点击左侧菜单 **"网站"**
3. 点击 **"添加站点"**
4. 填写信息：
   - **域名**：`blog.lyingshine.top`
   - **根目录**：`/www/wwwroot/blog.lyingshine.top`
   - **FTP**：不创建
   - **数据库**：MySQL，数据库名 `blog_db`
   - **PHP版本**：纯静态
5. 点击 **"提交"**

### 步骤2：创建数据库用户

1. 点击左侧菜单 **"数据库"**
2. 找到刚创建的 `blog_db` 数据库
3. 记录数据库信息：
   - 数据库名：`blog_db`
   - 用户名：`blog_db`
   - 密码：（宝塔自动生成的密码）

### 步骤3：上传项目代码

#### 方法一：使用Git（推荐）
1. 点击左侧菜单 **"文件"**
2. 进入目录：`/www/wwwroot/blog.lyingshine.top`
3. 点击 **"终端"**
4. 执行命令：
```bash
# 删除默认文件
rm -rf *

# 克隆项目
git clone https://github.com/lyingshine/blog.git .

# 查看文件
ls -la
```

#### 方法二：手动上传
1. 下载项目压缩包到本地
2. 在宝塔文件管理器中上传压缩包
3. 解压到网站根目录

### 步骤4：配置后端环境变量

1. 在文件管理器中进入 `backend` 目录
2. 复制 `.env.example` 文件并重命名为 `.env`
3. 编辑 `.env` 文件，填入以下内容：

```env
NODE_ENV=production
PORT=3000

# 数据库配置（使用步骤2中记录的信息）
DB_HOST=localhost
DB_PORT=3306
DB_USER=blog_db
DB_PASSWORD=你的数据库密码
DB_NAME=blog_db

# JWT密钥（请生成一个强密钥）
JWT_SECRET=your_jwt_secret_key_here_please_change_this

# CORS配置
CORS_ORIGIN=https://blog.lyingshine.top
```

### 步骤5：安装后端依赖

1. 在终端中进入后端目录：
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
```

2. 安装依赖：
```bash
npm install --production
```

3. 等待安装完成（可能需要几分钟）

### 步骤6：配置前端环境变量

1. 进入 `frontend` 目录
2. 创建 `.env.production` 文件：
```env
VITE_API_BASE_URL=https://blog.lyingshine.top/api
```

### 步骤7：安装前端依赖并构建

1. 在终端中进入前端目录：
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
```

2. 安装依赖：
```bash
npm install
```

3. 构建生产版本：
```bash
npm run build
```

4. 验证构建结果：
```bash
ls -la dist/
```

### 步骤8：导入数据库结构

#### 方法一：通过宝塔面板
1. 点击左侧菜单 **"数据库"**
2. 找到 `blog_db`，点击 **"管理"**
3. 进入phpMyAdmin
4. 点击 **"导入"**
5. 选择文件：`backend/database/migration.sql`
6. 点击 **"执行"**

#### 方法二：通过命令行
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
mysql -u blog_db -p blog_db < database/migration.sql
# 输入数据库密码
```

### 步骤9：配置PM2启动后端

1. 在网站根目录创建PM2配置文件：
```bash
cd /www/wwwroot/blog.lyingshine.top
```

2. 创建 `ecosystem.config.js` 文件（已存在，无需创建）

3. 启动应用：
```bash
pm2 start ecosystem.config.js
```

4. 保存PM2配置：
```bash
pm2 save
```

5. 设置开机自启：
```bash
pm2 startup
```

6. 查看应用状态：
```bash
pm2 status
```

### 步骤10：配置Nginx反向代理

1. 点击网站设置（点击域名右侧的设置按钮）
2. 点击 **"配置文件"**
3. 清空现有内容，复制以下配置：

```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.lyingshine.top;
    
    # SSL配置（稍后配置证书后会自动生成）
    ssl_certificate /www/server/panel/vhost/cert/blog.lyingshine.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.lyingshine.top/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 日志
    access_log /www/wwwlogs/blog.lyingshine.top.log;
    error_log /www/wwwlogs/blog.lyingshine.top.error.log;
    
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
    
    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
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
    }
    
    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 文件缓存
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # 前端静态文件
    location / {
        root /www/wwwroot/blog.lyingshine.top/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
        
        # HTML文件不缓存
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
    }
    
    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(sql|log|env)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 文件上传大小限制
    client_max_body_size 10M;
    client_body_buffer_size 128k;
}
```

4. 点击 **"保存"**

### 步骤11：申请SSL证书

1. 在网站设置中点击 **"SSL"**
2. 选择 **"Let's Encrypt"**
3. 填写邮箱地址
4. 点击 **"申请"**
5. 等待证书申请完成
6. 开启 **"强制HTTPS"**

### 步骤12：设置文件权限

在终端中执行：
```bash
cd /www/wwwroot/blog.lyingshine.top
chown -R www:www .
chmod -R 755 .
mkdir -p backend/uploads/avatars
chown -R www:www backend/uploads
```

### 步骤13：初始化数据库数据（可选）

如果需要创建示例数据：
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
node -e "
const { fixDatabase, createSampleData } = require('./scripts/fix-database');
(async () => {
  try {
    await fixDatabase();
    await createSampleData();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
  }
  process.exit(0);
})();
"
```

## 🔍 验证部署

### 1. 检查服务状态

```bash
# 检查PM2应用状态
pm2 status

# 查看应用日志
pm2 logs blog-backend

# 检查端口监听
netstat -tlnp | grep :3000
```

### 2. 测试访问

1. **测试前端**：访问 https://blog.lyingshine.top
2. **测试API**：访问 https://blog.lyingshine.top/api/health
3. **测试数据库连接**：查看API返回的健康检查信息

### 3. 查看日志

```bash
# 查看应用日志
pm2 logs blog-backend

# 查看Nginx访问日志
tail -f /www/wwwlogs/blog.lyingshine.top.log

# 查看Nginx错误日志
tail -f /www/wwwlogs/blog.lyingshine.top.error.log
```

## 🔄 日常维护

### 更新代码
```bash
cd /www/wwwroot/blog.lyingshine.top
git pull origin master

# 重新构建前端
cd frontend
npm run build

# 重启后端
pm2 restart blog-backend
```

### 备份数据
```bash
# 备份数据库
mysqldump -u blog_db -p blog_db > backup_$(date +%Y%m%d).sql

# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

### 查看资源使用
```bash
# 查看PM2应用资源使用
pm2 monit

# 查看系统资源
htop
```

## 🚨 常见问题排查

### 1. 后端启动失败
- 检查环境变量配置：`cat backend/.env`
- 查看PM2日志：`pm2 logs blog-backend`
- 检查端口占用：`lsof -i :3000`

### 2. 前端页面无法访问
- 检查构建是否成功：`ls -la frontend/dist/`
- 检查Nginx配置：`nginx -t`
- 查看Nginx错误日志

### 3. 数据库连接失败
- 检查数据库服务：宝塔面板 → 数据库
- 验证数据库配置：测试连接
- 检查防火墙设置

### 4. SSL证书问题
- 重新申请证书：网站设置 → SSL
- 检查域名解析：`nslookup blog.lyingshine.top`
- 查看证书状态：浏览器开发者工具

## 🎉 部署完成

部署完成后，你的博客系统将在以下地址可用：
- 🌐 **前端**: https://blog.lyingshine.top
- 🔌 **API**: https://blog.lyingshine.top/api
- 💓 **健康检查**: https://blog.lyingshine.top/api/health

## 📊 宝塔面板管理

通过宝塔面板，你可以：
- 📈 **监控** - 查看服务器资源使用情况
- 🗄️ **数据库管理** - 图形化管理MySQL数据库
- 📁 **文件管理** - 在线编辑配置文件
- 🔒 **安全管理** - 防火墙、SSH安全等
- ⏰ **计划任务** - 设置自动备份等定时任务
- 📊 **日志管理** - 查看各种系统和应用日志

恭喜！你的博客系统已经成功部署到宝塔面板上了！