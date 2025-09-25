# 端口冲突解决方案

## 🚨 错误信息
```
Error: listen EADDRINUSE: address already in use :::3000
```

## 🔍 问题原因
端口3000已经被其他进程占用，常见原因：
1. 之前启动的Node.js进程没有正确关闭
2. 其他应用程序占用了3000端口
3. PM2中有重复的进程

## ✅ 解决方案

### 方案一：查找并关闭占用端口的进程

#### Linux/宝塔面板服务器
```bash
# 查找占用3000端口的进程
netstat -tlnp | grep :3000
# 或者使用
lsof -i :3000

# 假设进程ID是1234，杀死进程
kill -9 1234

# 或者杀死所有node进程
pkill -f node
```

#### Windows系统
```bash
# 查找占用3000端口的进程
netstat -ano | findstr :3000

# 假设进程ID是1234，杀死进程
taskkill /PID 1234 /F

# 或者杀死所有node进程
taskkill /IM node.exe /F
```

### 方案二：使用PM2管理进程

```bash
# 查看PM2进程列表
pm2 list

# 停止所有PM2进程
pm2 stop all

# 删除所有PM2进程
pm2 delete all

# 重新启动
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 start ecosystem.config.js
```

### 方案三：更改端口号

如果3000端口确实被其他重要服务占用，可以更改博客系统的端口：

#### 1. 修改后端端口
编辑 `backend/.env` 文件：
```env
# 将端口改为其他可用端口
PORT=3001
# 或者
PORT=8080
```

#### 2. 修改PM2配置
编辑 `backend/ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'blog-backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001  // 修改为新端口
    }
  }]
}
```

#### 3. 更新Nginx配置
修改网站配置文件中的代理地址：
```nginx
# API反向代理
location /api {
    proxy_pass http://127.0.0.1:3001;  # 修改为新端口
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 4. 重载Nginx
```bash
nginx -t
nginx -s reload
```

## 🔧 快速修复命令

### 一键清理并重启
```bash
# 停止所有相关进程
pm2 stop all
pm2 delete all
pkill -f node

# 等待几秒钟
sleep 3

# 重新启动
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 start ecosystem.config.js

# 检查状态
pm2 status
```

### 检查端口占用
```bash
# 检查3000端口是否被占用
netstat -tlnp | grep :3000

# 如果没有输出，说明端口已释放
# 如果有输出，记录进程ID并杀死进程
```

## 🛠️ 宝塔面板操作

### 1. 通过宝塔面板PM2管理器
1. 打开宝塔面板 → PM2管理器
2. 停止或删除所有相关的Node.js项目
3. 重新添加项目

### 2. 通过宝塔面板进程管理
1. 打开宝塔面板 → 系统监控 → 进程管理
2. 搜索 "node" 进程
3. 结束所有相关进程

### 3. 通过宝塔面板终端
```bash
# 在宝塔面板终端中执行
pm2 list
pm2 stop all
pm2 delete all

# 重新启动
cd /www/wwwroot/blog.lyingshine.top/backend
pm2 start ecosystem.config.js
```

## 🔍 调试步骤

### 1. 确认进程状态
```bash
# 查看所有Node.js进程
ps aux | grep node

# 查看PM2进程
pm2 list

# 查看端口占用
netstat -tlnp | grep :3000
```

### 2. 测试端口可用性
```bash
# 测试端口是否可用
telnet localhost 3000

# 或者使用nc命令
nc -zv localhost 3000
```

### 3. 查看系统日志
```bash
# 查看系统日志
journalctl -u nginx
journalctl -f

# 查看PM2日志
pm2 logs
```

## 🚀 重新部署步骤

清理端口冲突后，按以下步骤重新部署：

```bash
# 1. 确保端口已释放
netstat -tlnp | grep :3000

# 2. 进入后端目录
cd /www/wwwroot/blog.lyingshine.top/backend

# 3. 检查环境配置
cat .env

# 4. 启动服务
pm2 start ecosystem.config.js

# 5. 检查状态
pm2 status

# 6. 测试API
curl http://localhost:3000/api/health
```

## 📋 预防措施

1. **正确关闭服务** - 使用 `pm2 stop` 而不是直接杀进程
2. **监控端口使用** - 定期检查端口占用情况
3. **使用唯一端口** - 为不同服务分配不同端口
4. **设置进程限制** - 在PM2配置中设置实例数量限制

## 🔄 常用端口管理命令

```bash
# 查看所有监听端口
netstat -tlnp

# 查看特定端口
lsof -i :3000

# 查看进程树
pstree -p

# 优雅关闭PM2进程
pm2 gracefulReload all

# 重启特定应用
pm2 restart blog-backend
```

按照以上步骤，应该能够解决端口冲突问题并成功启动博客后端服务！