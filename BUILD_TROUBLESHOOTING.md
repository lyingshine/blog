# 前端构建问题解决方案

## 🚨 问题描述

在运行 `npm run build` 时出现错误：
```
'vite' 不是内部或外部命令，也不是可运行的程序或批处理文件。
```

## 🔍 问题原因

1. **依赖未安装** - `node_modules` 目录不存在
2. **vite未安装** - 构建工具vite没有正确安装
3. **npm缓存问题** - npm缓存可能损坏

## ✅ 解决方案

### 方案一：重新安装依赖（推荐）

```bash
# 进入前端目录
cd frontend

# 删除可能存在的node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 清理npm缓存
npm cache clean --force

# 重新安装依赖
npm install

# 构建项目
npm run build
```

### 方案二：使用yarn替代npm

```bash
# 安装yarn（如果没有安装）
npm install -g yarn

# 进入前端目录
cd frontend

# 使用yarn安装依赖
yarn install

# 构建项目
yarn build
```

### 方案三：手动安装关键依赖

```bash
cd frontend

# 先安装vite
npm install vite@^4.4.9 --save-dev

# 安装Vue相关依赖
npm install vue@^3.3.4 vue-router@^4.2.4

# 安装其他依赖
npm install axios@^1.5.0 dayjs@^1.11.9

# 安装构建工具
npm install @vitejs/plugin-vue@^4.3.4 terser@^5.19.2

# 构建项目
npm run build
```

## 🔧 Windows系统特殊处理

### PowerShell执行策略问题
```powershell
# 检查执行策略
Get-ExecutionPolicy

# 如果是Restricted，需要修改
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 使用管理员权限
```bash
# 以管理员身份运行PowerShell或CMD
# 然后执行安装命令
```

## 🛠️ 替代构建方案

### 使用npx直接运行vite
```bash
cd frontend

# 使用npx运行vite构建
npx vite build

# 如果npx也不工作，尝试全局安装vite
npm install -g vite
vite build
```

### 手动构建配置
如果vite仍然有问题，可以创建简单的构建脚本：

```javascript
// build.js
const { build } = require('vite');

async function buildApp() {
  try {
    await build({
      root: process.cwd(),
      build: {
        outDir: 'dist',
        minify: 'esbuild' // 使用esbuild代替terser
      }
    });
    console.log('构建完成！');
  } catch (error) {
    console.error('构建失败：', error);
  }
}

buildApp();
```

然后运行：
```bash
node build.js
```

## 📦 服务器部署解决方案

### 在服务器上构建
如果本地构建有问题，可以直接在服务器上构建：

```bash
# 在服务器上
cd /www/wwwroot/blog.lyingshine.top/frontend

# 安装依赖
npm install --registry=https://registry.npmmirror.com

# 构建
npm run build
```

### 使用Docker构建
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
```

### 预构建版本
如果构建持续有问题，可以：

1. 在其他正常的环境中构建
2. 将构建好的 `dist` 目录打包
3. 直接上传到服务器

## 🔍 调试步骤

### 1. 检查Node.js版本
```bash
node --version  # 应该是 16+ 版本
npm --version   # 应该是 8+ 版本
```

### 2. 检查package.json
确认依赖版本是否正确：
```json
{
  "devDependencies": {
    "vite": "^4.4.9",
    "@vitejs/plugin-vue": "^4.3.4",
    "terser": "^5.19.2"
  }
}
```

### 3. 检查网络连接
```bash
# 测试npm源连接
npm config get registry

# 如果网络有问题，使用国内源
npm config set registry https://registry.npmmirror.com
```

### 4. 查看详细错误信息
```bash
# 使用详细模式安装
npm install --verbose

# 查看npm日志
npm config get cache
# 查看缓存目录下的日志文件
```

## 🚀 快速修复命令

```bash
# 一键修复脚本
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm config set registry https://registry.npmmirror.com
npm install
npm run build
```

## 📝 预防措施

1. **使用稳定的Node.js版本** - 推荐使用LTS版本
2. **定期清理缓存** - `npm cache clean --force`
3. **使用package-lock.json** - 锁定依赖版本
4. **配置镜像源** - 使用稳定的npm镜像
5. **备份构建产物** - 保存成功构建的dist目录

按照以上方案，应该能够解决前端构建问题！