// 性能监控工具
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
    this.init()
  }

  init() {
    // 监控 Core Web Vitals
    this.monitorWebVitals()
    
    // 监控资源加载
    this.monitorResourceLoading()
    
    // 监控路由切换性能
    this.monitorRoutePerformance()
    
    // 监控内存使用
    this.monitorMemoryUsage()
  }

  // 监控 Web Vitals 指标
  monitorWebVitals() {
    getCLS(this.onMetric.bind(this, 'CLS'))
    getFID(this.onMetric.bind(this, 'FID'))
    getFCP(this.onMetric.bind(this, 'FCP'))
    getLCP(this.onMetric.bind(this, 'LCP'))
    getTTFB(this.onMetric.bind(this, 'TTFB'))
  }

  // 处理指标数据
  onMetric(name, metric) {
    this.metrics[name] = {
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now()
    }

    console.log(`📊 ${name}:`, metric.value, `(${metric.rating})`)

    // 发送到监控服务
    this.sendMetric(name, metric)
  }

  // 监控资源加载性能
  monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.analyzeResourcePerformance(entry)
          }
        })
      })

      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    }
  }

  // 分析资源性能
  analyzeResourcePerformance(entry) {
    const duration = entry.responseEnd - entry.startTime
    const size = entry.transferSize || 0

    // 检查慢资源
    if (duration > 1000) {
      console.warn(`🐌 慢资源加载: ${entry.name} (${duration.toFixed(2)}ms)`)
    }

    // 检查大文件
    if (size > 500 * 1024) {
      console.warn(`📦 大文件: ${entry.name} (${(size / 1024).toFixed(2)}KB)`)
    }

    // 记录资源性能
    this.metrics.resources = this.metrics.resources || []
    this.metrics.resources.push({
      name: entry.name,
      duration,
      size,
      type: entry.initiatorType
    })
  }

  // 监控路由切换性能
  monitorRoutePerformance() {
    let routeStartTime = performance.now()

    // 监听路由变化
    window.addEventListener('beforeunload', () => {
      routeStartTime = performance.now()
    })

    // 监听页面加载完成
    window.addEventListener('load', () => {
      const routeDuration = performance.now() - routeStartTime
      console.log(`🚀 路由加载时间: ${routeDuration.toFixed(2)}ms`)
      
      this.metrics.routePerformance = {
        duration: routeDuration,
        timestamp: Date.now()
      }
    })
  }

  // 监控内存使用
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        const memoryInfo = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        }

        // 检查内存使用率
        const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100
        if (usagePercent > 80) {
          console.warn(`🧠 内存使用率过高: ${usagePercent.toFixed(1)}%`)
        }

        this.metrics.memory = memoryInfo
      }, 30000) // 每30秒检查一次
    }
  }

  // 发送指标到监控服务
  sendMetric(name, metric) {
    // 这里可以集成 Sentry、DataDog 等监控服务
    if (window.__MONITORING_ENABLED__) {
      // 示例：发送到自定义监控端点
      fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(err => {
        console.warn('监控数据发送失败:', err)
      })
    }
  }

  // 获取性能报告
  getPerformanceReport() {
    return {
      webVitals: {
        CLS: this.metrics.CLS,
        FID: this.metrics.FID,
        FCP: this.metrics.FCP,
        LCP: this.metrics.LCP,
        TTFB: this.metrics.TTFB
      },
      resources: this.metrics.resources || [],
      memory: this.metrics.memory,
      route: this.metrics.routePerformance,
      timestamp: Date.now()
    }
  }

  // 清理观察者
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 懒加载工具
export class LazyLoader {
  static components = new Map()

  // 预加载组件
  static preloadComponent(importFn, priority = 'low') {
    return new Promise((resolve, reject) => {
      if (priority === 'high') {
        // 高优先级立即加载
        importFn().then(resolve).catch(reject)
      } else {
        // 低优先级在空闲时加载
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            importFn().then(resolve).catch(reject)
          })
        } else {
          setTimeout(() => {
            importFn().then(resolve).catch(reject)
          }, 100)
        }
      }
    })
  }

  // 预加载路由组件
  static preloadRouteComponents(routes) {
    routes.forEach(route => {
      if (typeof route.component === 'function') {
        this.preloadComponent(route.component, route.meta?.priority || 'low')
      }
    })
  }

  // 图片懒加载
  static setupImageLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// 导出工具函数
export const measurePerformance = (name, fn) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
  
  return result
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}