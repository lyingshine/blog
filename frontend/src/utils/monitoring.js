// 监控和错误追踪集成
import * as Sentry from '@sentry/vue'

class MonitoringService {
  constructor() {
    this.isInitialized = false
    this.config = {
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.VITE_APP_VERSION || '1.0.0'
    }
  }

  // 初始化监控服务
  init(app, router) {
    if (this.isInitialized || !this.config.dsn) {
      return
    }

    try {
      Sentry.init({
        app,
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        
        // 集成配置
        integrations: [
          new Sentry.BrowserTracing({
            router,
            routingInstrumentation: Sentry.vueRouterInstrumentation(router)
          })
        ],
        
        // 性能监控
        tracesSampleRate: this.config.environment === 'production' ? 0.1 : 1.0,
        
        // 错误过滤
        beforeSend(event, hint) {
          // 过滤掉开发环境的某些错误
          if (this.config.environment === 'development') {
            const error = hint.originalException
            if (error && error.message && error.message.includes('ResizeObserver')) {
              return null
            }
          }
          return event
        },
        
        // 用户上下文
        initialScope: {
          tags: {
            component: 'vue-blog-frontend'
          }
        }
      })

      this.isInitialized = true
      console.log('📊 监控服务初始化完成')
      
    } catch (error) {
      console.error('❌ 监控服务初始化失败:', error)
    }
  }

  // 设置用户信息
  setUser(user) {
    if (!this.isInitialized) return

    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email
    })
  }

  // 清除用户信息
  clearUser() {
    if (!this.isInitialized) return
    Sentry.setUser(null)
  }

  // 记录自定义事件
  captureEvent(eventName, data = {}) {
    if (!this.isInitialized) return

    Sentry.addBreadcrumb({
      message: eventName,
      category: 'custom',
      data,
      level: 'info'
    })
  }

  // 记录错误
  captureError(error, context = {}) {
    if (!this.isInitialized) {
      console.error('Error:', error, context)
      return
    }

    Sentry.withScope((scope) => {
      // 添加上下文信息
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key])
      })
      
      // 捕获错误
      Sentry.captureException(error)
    })
  }

  // 记录性能指标
  capturePerformance(name, value, unit = 'ms') {
    if (!this.isInitialized) return

    Sentry.addBreadcrumb({
      message: `Performance: ${name}`,
      category: 'performance',
      data: {
        value,
        unit
      },
      level: 'info'
    })
  }

  // 开始性能事务
  startTransaction(name, operation = 'navigation') {
    if (!this.isInitialized) return null
    
    return Sentry.startTransaction({
      name,
      op: operation
    })
  }

  // 添加标签
  setTag(key, value) {
    if (!this.isInitialized) return
    Sentry.setTag(key, value)
  }

  // 添加上下文
  setContext(key, context) {
    if (!this.isInitialized) return
    Sentry.setContext(key, context)
  }
}

// APM (Application Performance Monitoring) 服务
class APMService {
  constructor() {
    this.metrics = new Map()
    this.observers = []
    this.isEnabled = process.env.NODE_ENV === 'production'
  }

  // 初始化 APM
  init() {
    if (!this.isEnabled) return

    this.setupPerformanceObserver()
    this.setupResourceObserver()
    this.setupNavigationObserver()
    this.setupMemoryMonitoring()
  }

  // 设置性能观察器
  setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.processPerformanceEntry(entry)
      })
    })

    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
    this.observers.push(observer)
  }

  // 设置资源观察器
  setupResourceObserver() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.processResourceEntry(entry)
      })
    })

    observer.observe({ entryTypes: ['resource'] })
    this.observers.push(observer)
  }

  // 设置导航观察器
  setupNavigationObserver() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.processNavigationEntry(entry)
      })
    })

    observer.observe({ entryTypes: ['navigation'] })
    this.observers.push(observer)
  }

  // 处理性能条目
  processPerformanceEntry(entry) {
    const metric = {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now()
    }

    this.metrics.set(`${entry.entryType}-${entry.name}`, metric)
    this.sendMetric('performance', metric)
  }

  // 处理资源条目
  processResourceEntry(entry) {
    const metric = {
      name: entry.name,
      type: 'resource',
      duration: entry.responseEnd - entry.startTime,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      timestamp: Date.now()
    }

    // 检查慢资源
    if (metric.duration > 2000) {
      monitoringService.captureEvent('slow_resource', {
        url: entry.name,
        duration: metric.duration,
        size: metric.size
      })
    }

    this.sendMetric('resource', metric)
  }

  // 处理导航条目
  processNavigationEntry(entry) {
    const metric = {
      type: 'navigation',
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      firstPaint: entry.responseEnd - entry.requestStart,
      timestamp: Date.now()
    }

    this.sendMetric('navigation', metric)
  }

  // 内存监控
  setupMemoryMonitoring() {
    if (!('memory' in performance)) return

    setInterval(() => {
      const memory = performance.memory
      const memoryMetric = {
        type: 'memory',
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      }

      // 检查内存使用率
      const usagePercent = (memoryMetric.used / memoryMetric.limit) * 100
      if (usagePercent > 85) {
        monitoringService.captureEvent('high_memory_usage', {
          usagePercent,
          used: memoryMetric.used,
          limit: memoryMetric.limit
        })
      }

      this.sendMetric('memory', memoryMetric)
    }, 60000) // 每分钟检查一次
  }

  // 发送指标
  sendMetric(type, metric) {
    // 这里可以发送到自定义的 APM 服务
    if (window.__APM_ENDPOINT__) {
      fetch(window.__APM_ENDPOINT__, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          metric,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        })
      }).catch(err => {
        console.warn('APM 指标发送失败:', err)
      })
    }
  }

  // 自定义指标
  recordCustomMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    }

    this.sendMetric('custom', metric)
  }

  // 清理
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}

// 创建服务实例
export const monitoringService = new MonitoringService()
export const apmService = new APMService()

// 错误边界处理
export const errorHandler = (error, instance, info) => {
  console.error('Vue Error:', error, info)
  
  monitoringService.captureError(error, {
    vue: {
      componentName: instance?.$options?.name || 'Unknown',
      propsData: instance?.$props,
      info
    }
  })
}

// 未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
  
  monitoringService.captureError(event.reason, {
    type: 'unhandledrejection',
    promise: event.promise
  })
})

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error)
  
  monitoringService.captureError(event.error, {
    type: 'global',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})