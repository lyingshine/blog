# 直接端口访问配置指南

## 🎯 配置说明

现在前端在生产环境中直接访问后端的3000端口，而不通过Nginx反向代理。

## 📋 当前配置

### 前端配置
- **开发环境**: `http://localhost:3000/api`
- **生产环境**: `http://blog.lyingshine.top:3000/api`

### 后端配置
- **监听端口**: `3000`
- **CORS配置**: 允许来自 `https://blog.lyingshine.top` 的请求

## 🔧 服务器配置要求

### 1. 防火墙设置
确保服务器防火墙开放3000端口：

#### 宝塔面板设置
1. 安全 → 防火墙 → 添加端口规则
2. 端口：`3000`
3. 协议：`TCP`
4. 备注：`博客后端API`

#### 命令行设置
```bash
# Ubuntu/Debian
ufw allow 3000

# CentOS/RHEL
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 2. 后端CORS配置
确保后端允许跨域访问，编辑 `backend/.env`：
```env
# CORS配置 - 允许前端域名访问
CORS_ORIGIN=https://blog.lyingshine.top
```

### 3. Nginx配置（简化版）
现在Nginx只需要服务前端静态文件，不需要API代理：

```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    
    # 前端静态文件
    root /www/wwwroot/blog.lyingshine.top/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
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

## 🚀 部署步骤

### 1. 更新前端配置
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend

# 重新构建前端（使用新的API地址）
npm run build
```

### 2. 启动后端服务
```bash
cd /www/wwwroot/blog.lyingshine.top/backend

# 确保后端在3000端口运行
pm2 start ecosystem.config.js
pm2 status
```

### 3. 开放防火墙端口
在宝塔面板中开放3000端口，或使用命令：
```bash
ufw allow 3000
```

### 4. 更新Nginx配置
移除API代理配置，只保留静态文件服务。

## 🔍 验证配置

### 1. 检查后端服务
```bash
# 检查3000端口是否监听
netstat -tlnp | grep :3000

# 测试API接口
curl http://blog.lyingshine.top:3000/api/health
```

### 2. 检查防火墙
```bash
# 检查3000端口是否开放
nmap -p 3000 blog.lyingshine.top

# 或者从外部测试
telnet blog.lyingshine.top 3000
```

### 3. 测试前端访问
- 访问：`https://blog.lyingshine.top`
- 检查浏览器开发者工具，确认API请求指向 `http://blog.lyingshine.top:3000/api`

## ⚠️ 注意事项

### 1. 混合内容问题
如果前端使用HTTPS，而API使用HTTP，可能会遇到混合内容问题。解决方案：

#### 方案A：前端也使用HTTP
```nginx
server {
    listen 80;
    server_name blog.lyingshine.top;
    # 不配置SSL，直接使用HTTP
}
```

#### 方案B：后端也使用HTTPS
为后端配置SSL证书，让API也支持HTTPS访问。

### 2. 安全考虑
直接暴露后端端口可能存在安全风险，建议：
- 使用强密码和JWT密钥
- 定期更新依赖包
- 监控异常访问
- 考虑使用防火墙限制访问来源

## 🔄 访问流程

### 当前架构
```
用户浏览器
    ↓
https://blog.lyingshine.top (前端静态文件)
    ↓
http://blog.lyingshine.top:3000/api (后端API)
```

### 端口使用
- **80端口**: Nginx服务前端静态文件
- **3000端口**: Node.js后端API服务
- **443端口**: 如果配置了SSL，用于HTTPS访问

## 🛠️ 故障排除

### 1. API无法访问
```bash
# 检查后端是否运行
pm2 status

# 检查端口是否监听
netstat -tlnp | grep :3000

# 检查防火墙
ufw status
```

### 2. 跨域问题
检查后端CORS配置：
```javascript
// 在server.js中确认CORS设置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://blog.lyingshine.top',
  credentials: true
}));
```

### 3. 混合内容错误
如果浏览器阻止HTTP API请求，考虑：
- 将前端也改为HTTP访问
- 或为后端配置HTTPS

按照以上配置，前端将直接访问后端的3000端口！