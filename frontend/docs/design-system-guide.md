# Vue Blog 设计系统指南

> 一套现代化、高级简约的博客设计系统

## 📖 目录

- [设计理念](#设计理念)
- [色彩系统](#色彩系统)
- [字体系统](#字体系统)
- [间距系统](#间距系统)
- [圆角系统](#圆角系统)
- [阴影系统](#阴影系统)
- [动画系统](#动画系统)
- [组件规范](#组件规范)
- [响应式设计](#响应式设计)
- [无障碍设计](#无障碍设计)
- [使用指南](#使用指南)

---

## 🎨 设计理念

### 核心价值
- **简约至上** - 去除冗余，专注内容
- **现代感** - 采用最新的设计趋势和技术
- **一致性** - 统一的视觉语言和交互模式
- **可访问性** - 确保所有用户都能良好使用

### 设计原则
1. **层次清晰** - 通过颜色、大小、间距建立信息层次
2. **交互友好** - 提供清晰的视觉反馈和状态变化
3. **内容为王** - 设计服务于内容，不喧宾夺主
4. **性能优先** - 优雅的设计不应牺牲性能

---

## 🎨 色彩系统

### 主色调 (Primary Colors)
```css
--color-primary: #2563eb;        /* 主蓝色 */
--color-primary-hover: #1d4ed8;  /* 主蓝色悬停 */
--color-primary-light: #dbeafe;  /* 主蓝色浅色 */
```

### 强调色 (Accent Colors)
```css
--color-accent: #f59e0b;         /* 琥珀色 */
--color-accent-hover: #d97706;   /* 琥珀色悬停 */
--color-accent-light: #fef3c7;  /* 琥珀色浅色 */
```

### 中性色调 (Neutral Colors)
```css
--color-white: #ffffff;
--color-gray-50: #f8fafc;
--color-gray-100: #f1f5f9;
--color-gray-200: #e2e8f0;
--color-gray-300: #cbd5e1;
--color-gray-400: #94a3b8;
--color-gray-500: #64748b;
--color-gray-600: #475569;
--color-gray-700: #334155;
--color-gray-800: #1e293b;
--color-gray-900: #0f172a;
```

### 语义化颜色 (Semantic Colors)
```css
--color-success: #10b981;        /* 成功绿 */
--color-warning: #f59e0b;        /* 警告橙 */
--color-error: #ef4444;          /* 错误红 */
--color-info: #3b82f6;           /* 信息蓝 */
```

### 文本颜色 (Text Colors)
```css
--text-primary: var(--color-gray-900);    /* 主要文本 */
--text-secondary: var(--color-gray-600);  /* 次要文本 */
--text-tertiary: var(--color-gray-400);   /* 辅助文本 */
--text-inverse: #ffffff;                  /* 反色文本 */
```

### 背景颜色 (Background Colors)
```css
--bg-primary: #ffffff;           /* 主背景 */
--bg-secondary: #f8fafc;         /* 次背景 */
--bg-tertiary: #f1f5f9;          /* 三级背景 */
--bg-elevated: #ffffff;          /* 浮起背景 */
```

### 边框颜色 (Border Colors)
```css
--border-color: #e2e8f0;         /* 默认边框 */
--border-hover: #cbd5e1;         /* 悬停边框 */
--border-focus: var(--color-primary); /* 聚焦边框 */
```

---

## ✍️ 字体系统

### 字体族 (Font Families)
```css
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

### 字体大小 (Font Sizes)
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

### 字体粗细 (Font Weights)
```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### 行高 (Line Heights)
```css
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

---

## 📏 间距系统

### 间距标准 (Spacing Scale)
```css
--space-0: 0;
--space-0_5: 0.125rem;   /* 2px */
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
--space-24: 6rem;        /* 96px */
```

### 使用指南
- **微间距** (0-4px): 紧密相关元素
- **小间距** (8-16px): 组件内部元素
- **中间距** (24-32px): 组件之间
- **大间距** (48-80px): 页面区块之间
- **超大间距** (96px+): 页面主要区域

---

## 🔘 圆角系统

### 圆角标准 (Border Radius)
```css
--radius-none: 0;
--radius-sm: 0.25rem;     /* 4px */
--radius-base: 0.375rem;  /* 6px */
--radius-md: 0.5rem;      /* 8px */
--radius-lg: 0.75rem;     /* 12px */
--radius-xl: 1rem;        /* 16px */
--radius-2xl: 1.5rem;     /* 24px */
--radius-3xl: 2rem;       /* 32px */
--radius-full: 9999px;    /* 完全圆形 */
```

### 使用场景
- **小圆角** (4-8px): 按钮、输入框、标签
- **中圆角** (12-16px): 卡片、模态框
- **大圆角** (24-32px): 大型容器、特殊组件
- **完全圆形**: 头像、图标按钮

---

## 🌟 阴影系统

### 阴影层级 (Shadow Levels)
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### 使用指南
- **微阴影** (sm): 输入框、小按钮
- **基础阴影** (base): 卡片默认状态
- **中等阴影** (md): 卡片悬停、下拉菜单
- **大阴影** (lg): 模态框、重要组件
- **超大阴影** (xl): 浮动面板、特殊效果

---

## ⚡ 动画系统

### 动画时长 (Duration)
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
--duration-slow: 8000ms;    /* 装饰动画 */
--duration-normal: 1000ms;  /* 加载动画 */
```

### 缓动函数 (Easing)
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 过渡效果 (Transitions)
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

### 动画原则
1. **微妙为主** - 动画应该增强体验而不是干扰
2. **性能优先** - 使用 transform 和 opacity 属性
3. **一致性** - 相同类型的动画使用相同的时长和缓动
4. **可控制** - 支持用户的减少动画偏好设置

---

## 🧩 组件规范

### 按钮 (Buttons)

#### 主要按钮
```css
.btn-primary {
  background: var(--color-accent);
  color: var(--text-inverse);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

#### 次要按钮
```css
.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}
```

### 卡片 (Cards)

#### 基础卡片
```css
.card {
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
  backdrop-filter: blur(8px);
}

.card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-hover);
}
```

#### 带顶部装饰的卡片
```css
.card-decorated::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.card-decorated:hover::before {
  opacity: 1;
}
```

### 输入框 (Inputs)

#### 基础输入框
```css
.input {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}
```

### 导航 (Navigation)

#### 胶囊式导航
```css
.nav-pills {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  padding: var(--space-1);
}

.nav-pill {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.nav-pill:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-pill.active {
  color: var(--text-primary);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
}
```

---

## 📱 响应式设计

### 断点系统 (Breakpoints)
```css
/* 移动设备 */
@media (max-width: 479px) { /* 超小屏 */ }
@media (max-width: 639px) { /* 小屏 */ }

/* 平板设备 */
@media (max-width: 767px) { /* 中屏 */ }
@media (max-width: 1023px) { /* 大屏 */ }

/* 桌面设备 */
@media (max-width: 1279px) { /* 超大屏 */ }
@media (min-width: 1280px) { /* 2K屏 */ }
```

### 容器宽度 (Container Widths)
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

### 响应式原则
1. **移动优先** - 从小屏开始设计，逐步增强
2. **内容优先** - 确保内容在所有设备上都可读
3. **触摸友好** - 移动端交互元素至少 44px
4. **性能考虑** - 避免在小屏设备上加载大图

---

## ♿ 无障碍设计

### 颜色对比度
- **正常文本**: 至少 4.5:1 的对比度
- **大文本**: 至少 3:1 的对比度
- **交互元素**: 至少 3:1 的对比度

### 键盘导航
```css
/* 聚焦状态 */
.focusable:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* 跳过链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: var(--text-inverse);
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}
```

### 动画偏好
```css
/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 高对比度模式
```css
@media (prefers-contrast: high) {
  .card,
  .button,
  .input {
    border-width: 2px;
  }
  
  .card:hover,
  .button:hover {
    border-color: currentColor;
  }
}
```

---

## 📋 使用指南

### 1. 引入设计系统
```html
<!-- 在 HTML 中引入 -->
<link rel="stylesheet" href="./src/style.css">
```

```css
/* 在 CSS 中使用变量 */
.my-component {
  background: var(--bg-elevated);
  color: var(--text-primary);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

### 2. 组件开发规范

#### Vue 组件结构
```vue
<template>
  <div class="component-name">
    <!-- 组件内容 -->
  </div>
</template>

<script>
export default {
  name: 'ComponentName'
}
</script>

<style scoped>
.component-name {
  /* 使用设计系统变量 */
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}
</style>
```

#### 命名规范
- **组件类名**: 使用 kebab-case (如: `.user-card`)
- **修饰符**: 使用双连字符 (如: `.user-card--featured`)
- **元素**: 使用双下划线 (如: `.user-card__title`)

### 3. 颜色使用指南

#### 主色调使用
- **主要操作**: 使用 `--color-primary`
- **强调内容**: 使用 `--color-accent`
- **成功状态**: 使用 `--color-success`
- **警告状态**: 使用 `--color-warning`
- **错误状态**: 使用 `--color-error`

#### 文本颜色层次
```css
/* 标题和重要内容 */
.title { color: var(--text-primary); }

/* 正文内容 */
.content { color: var(--text-secondary); }

/* 辅助信息 */
.meta { color: var(--text-tertiary); }
```

### 4. 间距使用指南

#### 组件内间距
```css
.component {
  padding: var(--space-6);        /* 组件内边距 */
}

.component-title {
  margin-bottom: var(--space-4);  /* 标题下间距 */
}

.component-content {
  margin-bottom: var(--space-6);  /* 内容区间距 */
}
```

#### 布局间距
```css
.section {
  margin-bottom: var(--space-16); /* 区块间距 */
}

.grid {
  gap: var(--space-8);            /* 网格间距 */
}
```

### 5. 动画使用指南

#### 悬停效果
```css
.interactive-element {
  transition: all var(--transition-fast);
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

#### 加载动画
```css
.loading-spinner {
  animation: spin var(--duration-normal) linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 6. 响应式开发

#### 移动优先
```css
/* 默认样式 (移动端) */
.component {
  padding: var(--space-4);
  font-size: var(--text-sm);
}

/* 平板端 */
@media (min-width: 768px) {
  .component {
    padding: var(--space-6);
    font-size: var(--text-base);
  }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .component {
    padding: var(--space-8);
    font-size: var(--text-lg);
  }
}
```

---

## 🔧 开发工具

### VS Code 扩展推荐
- **CSS Var Complete** - CSS 变量自动补全
- **Color Highlight** - 颜色值高亮显示
- **Prettier** - 代码格式化
- **Vetur** - Vue 开发支持

### 浏览器开发工具
- **Chrome DevTools** - 调试和性能分析
- **Firefox Developer Tools** - 无障碍性检查
- **Lighthouse** - 性能和最佳实践审计

---

## 📚 参考资源

### 设计灵感
- [Dribbble](https://dribbble.com) - 设计灵感
- [Behance](https://behance.net) - 创意作品
- [UI Movement](https://uimovement.com) - UI 动画

### 技术文档
- [MDN Web Docs](https://developer.mozilla.org) - Web 技术文档
- [CSS-Tricks](https://css-tricks.com) - CSS 技巧和教程
- [Vue.js 官方文档](https://vuejs.org) - Vue.js 框架文档

### 无障碍资源
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - 无障碍指南
- [A11y Project](https://www.a11yproject.com) - 无障碍最佳实践

---

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✨ 初始版本发布
- 🎨 完整的设计系统建立
- 📱 响应式设计支持
- ♿ 无障碍功能集成
- 📚 完整的文档编写

---

## 🤝 贡献指南

### 如何贡献
1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 设计原则
- 保持一致性
- 优先考虑用户体验
- 遵循无障碍标准
- 注重性能优化

---

## 📄 许可证

本设计系统采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

---

**Vue Blog Design System** - 让每个界面都优雅而现代 ✨