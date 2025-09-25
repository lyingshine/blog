# 前端构建问题修复指南

## 🚨 Terser依赖问题

### 问题描述
在运行 `npm run build` 时出现以下错误：
```
[vite:terser] terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.
```

### 解决方案

#### 方案1：安装terser依赖（推荐用于生产环境）
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
npm install --save-dev terser
npm run build
```

#### 方案2：使用esbuild代替terser（更快，已在配置中更新）
前端项目已更新为使用esbuild进行代码压缩，无需安装额外依赖：
```bash
cd /www/wwwroot/blog.lyingshine.top/frontend
git pull origin master  # 获取最新配置
npm install
npm run build
```

### 构建优化配置

更新后的vite.config.js包含以下优化：
- 使用esbuild进行代码压缩（更快）
- 代码分割配置
- 静态资源优化
- 开发环境代理配置

### 验证构建结果

构建成功后检查：
```bash
# 检查构建文件
ls -la dist/

# 检查文件大小
du -sh dist/

# 验证主要文件存在
ls -la dist/index.html
ls -la dist/assets/
```

### 常见构建问题

#### 1. 内存不足
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 2. 权限问题
```bash
# 设置正确权限
chown -R www:www /www/wwwroot/blog.lyingshine.top/frontend
chmod -R 755 /www/wwwroot/blog.lyingshine.top/frontend
```

#### 3. 依赖版本冲突
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 生产环境构建命令

```bash
# 完整的生产环境构建流程
cd /www/wwwroot/blog.lyingshine.top/frontend

# 1. 更新代码
git pull origin master

# 2. 清理旧的构建文件
rm -rf dist/

# 3. 安装依赖
npm ci --production=false

# 4. 构建
npm run build

# 5. 验证构建结果
ls -la dist/

# 6. 设置权限
chown -R www:www dist/
chmod -R 755 dist/
```

### 构建性能优化

1. **使用npm ci代替npm install**（生产环境）
2. **启用构建缓存**
3. **使用esbuild进行快速压缩**
4. **合理配置代码分割**

### 故障排除

如果构建仍然失败：

1. **检查Node.js版本**
```bash
node --version  # 应该是18+
npm --version
```

2. **检查磁盘空间**
```bash
df -h
```

3. **查看详细错误信息**
```bash
npm run build --verbose
```

4. **使用开发模式测试**
```bash
npm run dev
```

构建成功后，前端文件将生成在 `dist/` 目录中，Nginx会自动服务这些静态文件。