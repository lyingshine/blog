#!/bin/bash

# 宝塔面板博客部署脚本
echo "🚀 开始部署博客系统到宝塔面板..."

# 设置变量
SITE_PATH="/www/wwwroot/blog.lyingshine.top"
BACKUP_PATH="/www/backup/blog_$(date +%Y%m%d_%H%M%S)"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 创建备份
if [ -d "$SITE_PATH" ]; then
    echo "📦 创建备份..."
    mkdir -p $(dirname $BACKUP_PATH)
    cp -r $SITE_PATH $BACKUP_PATH
    echo "✅ 备份创建完成: $BACKUP_PATH"
fi

# 停止PM2应用
echo "🛑 停止现有应用..."
pm2 stop blog-backend 2>/dev/null || echo "应用未运行"

# 更新代码
echo "📥 更新代码..."
git pull origin master

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install --production

# 构建前端
echo "🔨 构建前端..."
cd ../frontend
npm install
npm run build

# 返回根目录
cd ..

# 设置权限
echo "🔐 设置文件权限..."
chown -R www:www $SITE_PATH
chmod -R 755 $SITE_PATH

# 创建必要的目录
mkdir -p logs
mkdir -p backend/uploads/avatars
chown -R www:www logs backend/uploads

# 启动PM2应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js
pm2 save

# 重载Nginx
echo "🔄 重载Nginx..."
nginx -t && nginx -s reload

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
pm2 status

# 健康检查
echo "🏥 进行健康检查..."
if curl -f https://blog.lyingshine.top/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常，请检查日志"
    pm2 logs blog-backend --lines 20
fi

if curl -f https://blog.lyingshine.top > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常，请检查Nginx配置"
fi

echo "🎉 部署完成！"
echo "📝 访问地址："
echo "   前端: https://blog.lyingshine.top"
echo "   API: https://blog.lyingshine.top/api"
echo "   健康检查: https://blog.lyingshine.top/api/health"
echo ""
echo "📊 管理命令："
echo "   查看应用状态: pm2 status"
echo "   查看日志: pm2 logs blog-backend"
echo "   重启应用: pm2 restart blog-backend"