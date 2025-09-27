# Vue Blog Frontend

现代化的 Vue.js 博客前端应用，采用最新的技术栈和最佳实践。

## ✨ 特性

- 🚀 **Vue 3 + Composition API** - 使用最新的 Vue.js 特性
- 📦 **Vite** - 极速的构建工具和开发服务器
- 🎨 **现代化 UI** - 响应式设计，支持深色模式
- 🔐 **JWT 认证** - 安全的用户认证系统
- 📝 **富文本编辑** - 支持 Markdown 编辑和预览
- 🔍 **全文搜索** - 强大的文章搜索功能
- 📊 **性能监控** - 集成 Sentry 和自定义 APM
- 🧪 **完整测试** - 单元测试、集成测试、E2E 测试
- 📚 **完善文档** - 详细的开发和部署文档

## 🏗️ 技术栈

- **框架**: Vue.js 3.3+
- **构建工具**: Vite 4.4+
- **路由**: Vue Router 4.2+
- **状态管理**: Pinia 2.1+
- **HTTP 客户端**: Axios 1.5+
- **CSS 预处理器**: 原生 CSS + CSS Variables
- **测试框架**: Vitest + Playwright
- **代码规范**: ESLint + Prettier
- **监控**: Sentry + 自定义 APM

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
vim .env
```

### 开发服务器

```bash
# 启动开发服务器
npm run dev

# 应用将在 http://localhost:5173 启动
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── adapters/          # 适配器层
│   ├── components/        # 可复用组件
│   ├── composables/       # 组合式函数
│   ├── constants/         # 常量定义
│   ├── core/             # 核心模块
│   ├── router/           # 路由配置
│   ├── services/         # 服务层
│   ├── stores/           # 状态管理
│   ├── types/            # 类型定义
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   └── style.css         # 全局样式
├── tests/                # 测试文件
├── docs/                 # 项目文档
├── .env.example          # 环境配置示例
├── package.json          # 项目配置
├── vite.config.js        # Vite 配置
├── vitest.config.js      # 测试配置
└── playwright.config.js  # E2E 测试配置
```

## 🧪 测试

### 单元测试

```bash
# 运行单元测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 测试 UI 界面
npm run test:ui
```

### E2E 测试

```bash
# 安装 Playwright 浏览器
npx playwright install

# 运行 E2E 测试
npm run test:e2e
```

## 📊 性能分析

```bash
# 构建并分析包大小
npm run analyze

# 查看性能报告
npm run build && npm run preview
```

## 📚 文档

```bash
# 启动文档开发服务器
npm run docs:dev

# 构建文档
npm run docs:build
```

## 🔧 开发指南

### 代码规范

项目使用 ESLint 进行代码检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix
```

### 组件开发

1. **组件命名**: 使用 PascalCase
2. **文件结构**: 单文件组件 (.vue)
3. **Props 定义**: 使用 TypeScript 类型或 PropTypes
4. **事件命名**: 使用 kebab-case

### 状态管理

使用 Pinia 进行状态管理：

```javascript
// stores/example.store.js
import { ref, computed } from 'vue'

export const useExampleStore = () => {
  const state = ref(initialState)
  
  const getters = computed(() => {
    // computed values
  })
  
  const actions = {
    // actions
  }
  
  return {
    state,
    getters,
    ...actions
  }
}
```

### API 调用

使用服务层进行 API 调用：

```javascript
// services/example.service.js
import { BaseService } from './base.service'

class ExampleService extends BaseService {
  constructor() {
    super('/examples')
  }
  
  async getList(params) {
    return this.get('/', { params })
  }
}

export const exampleService = new ExampleService()
```

## 🚀 部署

### 构建优化

项目已配置了多种构建优化：

- **代码分割**: 按路由和功能分割
- **Tree Shaking**: 移除未使用的代码
- **压缩**: Terser 压缩 JavaScript
- **缓存**: 文件名哈希用于缓存

### 部署到 Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/vue-blog/dist;
    index index.html;
    
    # 处理 Vue Router 的 history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### 环境变量

生产环境需要配置以下环境变量：

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_ENABLE_MONITORING=true
```

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本是否符合要求
   - 清除 node_modules 并重新安装依赖

2. **开发服务器启动失败**
   - 检查端口是否被占用
   - 检查环境配置是否正确

3. **API 请求失败**
   - 检查后端服务是否启动
   - 检查 API 基础 URL 配置

### 调试工具

开发环境下可以使用内置的调试工具：

```javascript
// 在浏览器控制台中
window.__APP_DEBUG__.performance.getPerformanceReport()
window.__APP_DEBUG__.monitoring.captureEvent('test_event')
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您有任何问题或建议，请：

- 创建 [Issue](https://github.com/your-username/vue-blog/issues)
- 发送邮件到 support@yourdomain.com
- 查看 [文档](https://docs.yourdomain.com)