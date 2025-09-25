#!/bin/bash

# 博客部署脚本
echo "🚀 开始部署博客系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env.production ]; then
    echo "❌ 未找到.env.production文件，请先配置环境变量"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker system prune -f

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose --env-file .env.production up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 检查前端服务
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ 前端服务启动成功"
else
    echo "❌ 前端服务启动失败"
fi

# 检查后端服务
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
fi

echo "🎉 部署完成！"
echo "📝 请确保："
echo "   1. 已配置Nginx反向代理"
echo "   2. 已申请SSL证书"
echo "   3. 域名DNS已正确解析"
echo "   4. 防火墙已开放相应端口"