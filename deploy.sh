#!/bin/bash

# 博客项目生产环境部署脚本

echo "🚀 开始部署博客项目到生产环境..."

# 检查是否在正确的目录
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 1. 构建前端
echo "📦 构建前端项目..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi
cd ..

# 2. 安装后端依赖（如果需要）
echo "📦 检查后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install --production
fi

# 3. 创建必要的目录
mkdir -p logs
mkdir -p uploads/avatars

# 4. 设置权限
chmod +x ../deploy.sh

echo "✅ 部署准备完成！"
echo ""
echo "📋 部署说明："
echo "1. 将 frontend/dist 目录上传到你的 Web 服务器"
echo "2. 将 backend 目录上传到你的服务器"
echo "3. 在服务器上运行: NODE_ENV=production npm start"
echo "4. 或使用 PM2: pm2 start ecosystem.config.js --env production"
echo ""
echo "🌐 访问地址："
echo "- 前端: https://blog.lyingshine.top"
echo "- 后端API: https://blog.lyingshine.top/api"
echo ""
echo "🔧 服务器配置建议："
echo "- 使用 Nginx 作为反向代理"
echo "- 配置 SSL 证书"
echo "- 设置静态文件缓存"

cd ..