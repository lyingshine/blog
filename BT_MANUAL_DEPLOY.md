# 宝塔面板手动部署指南

## 🎯 部署概述

本指南将详细说明如何在宝塔面板中手动部署博客系统，包括前后端的完整部署流程。

## 📋 部署前准备

### 1. 宝塔面板环境要求
- **Nginx** 1.20+
- **MySQL** 8.0
- **Node.js** 18+
- **PM2管理器**

### 2. 域名准备
- 域名：`blog.lyingshine.top`
- 确保域名已解析到服务器IP

## 🗄️ 第一步：数据库配置

### 1. 创建数据库
在宝塔面板 → 数据库 → 添加数据库：
- **数据库名**：`blog_db`
- **用户名**：`blog_user`
- **密码**：设置一个强密码（记住这个密码）

### 2. 导入数据库结构
```bash
# 通过SSH连接服务器，或使用宝塔面板终端
cd /www/wwwroot/blog.lyingshine.top
mysql -u blog_user -p blog_db < backend/database/migration.sql
```

## 🌐 第二步：创建网站

### 1. 在宝塔面板创建网站
- 网站 → 添加站点
- **域名**：`blog.lyingshine.top`
- **根目录**：`/www/wwwroot/blog.lyingshine.top`
- **PHP版本**：纯静态（不需要PHP）

### 2. 上传代码
```bash
# 方式一：通过Git克隆（推荐）
cd /www/wwwroot/blog.lyingshine.top
git clone https://github.com/lyingshine/blog.git .

# 方式二：通过宝塔面板文件管理器上传压缩包
```

## 🔧 第三步：后端部署

### 1. 配置环境变量
编辑 `backend/.env` 文件：
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://blog.lyingshine.top

# 数据库配置（使用刚才创建的数据库信息）
DB_HOST=localhost
DB_PORT=3306
DB_USER=blog_user
DB_PASSWORD=你刚才设置的数据库密码
DB_NAME=blog_db

# JWT配置（设置一个强密钥）
JWT_SECRET=你的强JWT密钥_至少32位字符

# CORS配置
CORS_ORIGIN=https://blog.lyingshine.top

DEBUG=false
LOG_LEVEL=error
```

### 2. 安装后端依赖
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
npm install --production
```

### 3. 使用PM2启动后端服务

#### 方式一：通过宝塔面板PM2管理器
1. 软件商店 → 安装 "PM2管理器"
2. PM2管理器 → 添加项目：
   - **项目名称**：`blog-backend`
   - **启动文件**：`/www/wwwroot/blog.lyingshine.top/backend/server.js`
   - **项目目录**：`/www/wwwroot/blog.lyingshine.top/backend`
   - **启动模式**：`production`

#### 方式二：通过命令行
```bash
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 验证后端服务
```bash
# 检查PM2状态
pm2 status

# 测试API接口
curl http://localhost:3000/api/health
```

## 🎨 第四步：前端部署

### 1. 安装前端依赖
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
npm install
```

### 2. 构建前端生产版本
```bash
npm run build
```

### 3. 配置网站根目录
在宝塔面板 → 网站 → 设置 → 网站目录：
- 将网站目录修改为：`/www/wwwroot/blog.lyingshine.top/frontend/dist`

## 🔄 第五步：配置Nginx反向代理

### 1. 编辑网站配置
宝塔面板 → 网站 → 设置 → 配置文件，替换为以下配置：

```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    
    # 网站根目录
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 处理跨域
        proxy_set_header Access-Control-Allow-Origin *;
        proxy_set_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        proxy_set_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 2. 重载Nginx配置
```bash
nginx -t  # 检查配置语法
nginx -s reload  # 重载配置
```

## 🔒 第六步：配置SSL证书

### 1. 申请SSL证书
宝塔面板 → 网站 → 设置 → SSL：
- 选择 "Let's Encrypt" 免费证书
- 点击申请证书
- 开启 "强制HTTPS"

### 2. 更新配置文件
证书申请成功后，Nginx配置会自动更新为HTTPS。

## ✅ 第七步：验证部署

### 1. 检查服务状态
```bash
# 检查PM2状态
pm2 status

# 检查Nginx状态
systemctl status nginx

# 检查MySQL状态
systemctl status mysql
```

### 2. 访问测试
- **前端首页**：https://blog.lyingshine.top
- **API健康检查**：https://blog.lyingshine.top/api/health
- **后端直接访问**：http://服务器IP:3000/api/health

### 3. 功能测试
- 用户注册/登录
- 文章发布/编辑
- 评论功能
- 文件上传

## 🛠️ 维护和管理

### 1. 日常维护命令
```bash
# 查看后端日志
pm2 logs blog-backend

# 重启后端服务
pm2 restart blog-backend

# 更新代码
cd /www/wwwroot/blog.lyingshine.top
git pull origin master
cd frontend && npm run build
pm2 restart blog-backend
```

### 2. 宝塔面板监控
- 系统监控 → 查看服务器资源使用情况
- PM2管理器 → 监控Node.js应用状态
- 网站日志 → 查看访问日志和错误日志

### 3. 数据库备份
宝塔面板 → 数据库 → 备份：
- 设置定时备份
- 建议每天备份一次

## 🚨 故障排除

### 1. 后端服务无法启动
```bash
# 查看详细错误信息
pm2 logs blog-backend --lines 50

# 检查端口占用
netstat -tlnp | grep :3000

# 检查环境变量
cd /www/wwwroot/blog.lyingshine.top/backend
cat .env
```

### 2. 前端页面404
- 检查网站根目录是否正确指向 `frontend/dist`
- 确认前端构建是否成功
- 检查Nginx配置中的 `try_files` 设置

### 3. API接口500错误
- 检查数据库连接是否正常
- 查看PM2日志排查具体错误
- 确认环境变量配置是否正确

### 4. 跨域问题
- 检查后端 `CORS_ORIGIN` 配置
- 确认Nginx反向代理配置正确
- 验证前端API地址配置

## 📊 性能优化建议

### 1. 服务器配置
- 至少2GB内存
- 建议使用SSD硬盘
- 配置CDN加速静态资源

### 2. 数据库优化
- 定期优化数据库表
- 配置适当的索引
- 监控慢查询

### 3. 缓存配置
- 启用Nginx静态文件缓存
- 考虑使用Redis缓存热点数据
- 配置浏览器缓存策略

## 🔐 安全建议

1. **定期更新** - 保持系统和软件包最新
2. **防火墙配置** - 只开放必要端口（80, 443, 22）
3. **强密码策略** - 数据库和JWT使用强密码
4. **SSL证书** - 确保HTTPS正常工作
5. **备份策略** - 定期备份数据库和代码
6. **监控告警** - 配置服务异常告警

按照以上步骤，你就可以在宝塔面板中成功部署博客系统了！