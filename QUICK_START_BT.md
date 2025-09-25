# 宝塔面板快速部署指南

## 🚀 5分钟快速部署

### 1. 准备工作
- 确保已安装宝塔面板
- 安装 Nginx、MySQL 8.0、Node.js 18+、PM2管理器

### 2. 创建网站
1. 宝塔面板 → 网站 → 添加站点
2. 域名：`blog.lyingshine.top`
3. 创建数据库：`blog_db`

### 3. 上传代码
```bash
cd /www/wwwroot/blog.lyingshine.top
git clone https://github.com/lyingshine/blog.git .
```

### 4. 配置环境
```bash
cd backend
cp ../.env.example .env
# 编辑 .env 文件，配置数据库信息
```

### 5. 安装依赖
```bash
# 后端
cd backend && npm install --production

# 前端
cd ../frontend && npm install && npm run build
```

### 6. 导入数据库
```bash
mysql -u blog_db -p blog_db < backend/database/migration.sql
```

### 7. 启动应用
```bash
cd /www/wwwroot/blog.lyingshine.top
pm2 start ecosystem.config.js
pm2 save
```

### 8. 配置Nginx
复制 `nginx-bt.conf` 内容到网站配置文件

### 9. 申请SSL证书
宝塔面板 → 网站设置 → SSL → Let's Encrypt

## ✅ 完成！
访问 https://blog.lyingshine.top 查看你的博客