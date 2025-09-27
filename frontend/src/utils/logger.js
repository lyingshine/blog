/**
 * 统一日志管理系统
 * 根据环境和配置控制日志输出
 */

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

// 当前环境的日志级别
const getCurrentLogLevel = () => {
  if (import.meta.env.PROD) {
    return LOG_LEVELS.ERROR // 生产环境只显示错误
  }
  
  // 开发环境根据配置决定
  const debugMode = localStorage.getItem('blog_debug_mode') === 'true'
  return debugMode ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN
}

// 日志样式
const LOG_STYLES = {
  error: 'color: #dc3545; font-weight: bold;',
  warn: 'color: #ffc107; font-weight: bold;',
  info: 'color: #17a2b8;',
  debug: 'color: #6c757d;',
  success: 'color: #28a745; font-weight: bold;'
}

class Logger {
  constructor() {
    this.level = getCurrentLogLevel()
    this.prefix = '[Blog]'
  }

  // 错误日志 - 总是显示
  error(message, ...args) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`%c${this.prefix} ❌ ${message}`, LOG_STYLES.error, ...args)
    }
  }

  // 警告日志 - 开发环境显示
  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`%c${this.prefix} ⚠️ ${message}`, LOG_STYLES.warn, ...args)
    }
  }

  // 信息日志 - 调试模式显示
  info(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.log(`%c${this.prefix} ℹ️ ${message}`, LOG_STYLES.info, ...args)
    }
  }

  // 调试日志 - 仅调试模式显示
  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`%c${this.prefix} 🔍 ${message}`, LOG_STYLES.debug, ...args)
    }
  }

  // 成功日志 - 重要操作成功时显示
  success(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.log(`%c${this.prefix} ✅ ${message}`, LOG_STYLES.success, ...args)
    }
  }

  // 组件生命周期日志 - 仅调试模式
  lifecycle(component, event, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`%c${this.prefix} 🔄 [${component}] ${event}`, LOG_STYLES.debug, ...args)
    }
  }

  // API请求日志 - 仅调试模式
  api(method, url, status, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const statusColor = status >= 400 ? LOG_STYLES.error : LOG_STYLES.success
      console.log(`%c${this.prefix} 🌐 ${method} ${url} (${status})`, statusColor, ...args)
    }
  }

  // 路由日志 - 仅调试模式
  route(from, to, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`%c${this.prefix} 🧭 ${from} → ${to}`, LOG_STYLES.debug, ...args)
    }
  }

  // 设置日志级别
  setLevel(level) {
    this.level = level
  }

  // 启用调试模式
  enableDebug() {
    localStorage.setItem('blog_debug_mode', 'true')
    this.level = LOG_LEVELS.DEBUG
    this.info('调试模式已启用')
  }

  // 禁用调试模式
  disableDebug() {
    localStorage.removeItem('blog_debug_mode')
    this.level = getCurrentLogLevel()
    console.log(`%c${this.prefix} 调试模式已禁用`, LOG_STYLES.info)
  }
}

// 创建全局日志实例
const logger = new Logger()

// 在开发环境下提供全局访问
if (import.meta.env.DEV) {
  window.blogLogger = logger
  window.enableDebug = () => logger.enableDebug()
  window.disableDebug = () => logger.disableDebug()
}

export default logger