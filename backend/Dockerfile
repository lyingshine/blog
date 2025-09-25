FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads/avatars

# 设置权限
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]