// 性能优化工具
class PerformanceOptimizer {
  constructor() {
    this.optimizations = new Map()
    this.init()
  }

  init() {
    // 预连接到重要域名
    this.preconnectToDomains([
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ])

    // 预加载关键资源
    this.preloadCriticalResources()

    // 优化图片加载
    this.optimizeImageLoading()

    // 优化字体加载
    this.optimizeFontLoading()

    // 减少主线程阻塞
    this.reduceMainThreadBlocking()
  }

  // 预连接到重要域名
  preconnectToDomains(domains) {
    domains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = `https://${domain}`
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/api/auth/me', as: 'fetch', type: 'application/json' },
      { href: '/api/articles?limit=5', as: 'fetch', type: 'application/json' }
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource.href
      link.as = resource.as
      if (resource.type) link.type = resource.type
      if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin
      document.head.appendChild(link)
    })
  }

  // 优化图片加载
  optimizeImageLoading() {
    // 使用 Intersection Observer 实现图片懒加载
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            
            // 加载高质量图片
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
            }

            // 加载 srcset
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset
              img.removeAttribute('data-srcset')
            }

            img.classList.remove('lazy-loading')
            img.classList.add('lazy-loaded')
            imageObserver.unobserve(img)
          }
        })
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      })

      // 观察所有懒加载图片
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })

      this.optimizations.set('imageObserver', imageObserver)
    }
  }

  // 优化字体加载
  optimizeFontLoading() {
    // 使用 font-display: swap 优化字体加载
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'system-ui';
        font-display: swap;
      }
      
      * {
        font-display: swap;
      }
    `
    document.head.appendChild(style)

    // 预加载关键字体
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        console.log('📝 字体加载完成')
      })
    }
  }

  // 减少主线程阻塞
  reduceMainThreadBlocking() {
    // 使用 requestIdleCallback 执行非关键任务
    const scheduleWork = (callback) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1000 })
      } else {
        setTimeout(callback, 0)
      }
    }

    // 延迟执行非关键初始化
    scheduleWork(() => {
      this.initNonCriticalFeatures()
    })
  }

  // 初始化非关键功能
  initNonCriticalFeatures() {
    // 初始化分析工具
    this.initAnalytics()
    
    // 初始化第三方插件
    this.initThirdPartyPlugins()
    
    // 预加载下一页内容
    this.preloadNextPageContent()
  }

  // 初始化分析工具
  initAnalytics() {
    if (window.gtag) {
      console.log('📊 Google Analytics 已初始化')
    }
  }

  // 初始化第三方插件
  initThirdPartyPlugins() {
    // 延迟加载非关键的第三方脚本
    const thirdPartyScripts = [
      // 可以在这里添加第三方脚本
    ]

    thirdPartyScripts.forEach(script => {
      const scriptElement = document.createElement('script')
      scriptElement.src = script.src
      scriptElement.async = true
      scriptElement.defer = true
      document.body.appendChild(scriptElement)
    })
  }

  // 预加载下一页内容
  preloadNextPageContent() {
    // 预测用户可能访问的页面并预加载
    const currentPath = window.location.pathname
    
    if (currentPath === '/') {
      // 在首页预加载文章详情页组件
      import('../views/Article.vue').catch(() => {})
    } else if (currentPath.startsWith('/article/')) {
      // 在文章页预加载相关文章
      this.preloadRelatedArticles()
    }
  }

  // 预加载相关文章
  async preloadRelatedArticles() {
    try {
      const response = await fetch('/api/articles/related?limit=3')
      if (response.ok) {
        const relatedArticles = await response.json()
        console.log('🔗 相关文章预加载完成:', relatedArticles.data?.length || 0)
      }
    } catch (error) {
      console.warn('相关文章预加载失败:', error)
    }
  }

  // 优化 CSS 加载
  optimizeCSSLoading() {
    // 内联关键 CSS
    const criticalCSS = `
      /* 关键路径 CSS */
      body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
      .header { position: sticky; top: 0; z-index: 100; }
    `

    const style = document.createElement('style')
    style.textContent = criticalCSS
    document.head.insertBefore(style, document.head.firstChild)

    // 异步加载非关键 CSS
    const nonCriticalCSS = [
      '/assets/non-critical.css'
    ]

    nonCriticalCSS.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.media = 'print'
      link.onload = () => { link.media = 'all' }
      document.head.appendChild(link)
    })
  }

  // 优化 JavaScript 执行
  optimizeJavaScriptExecution() {
    // 分批执行大量 DOM 操作
    const batchDOMUpdates = (updates) => {
      const batchSize = 10
      let index = 0

      const processBatch = () => {
        const endIndex = Math.min(index + batchSize, updates.length)
        
        for (let i = index; i < endIndex; i++) {
          updates[i]()
        }

        index = endIndex

        if (index < updates.length) {
          requestAnimationFrame(processBatch)
        }
      }

      requestAnimationFrame(processBatch)
    }

    return { batchDOMUpdates }
  }

  // 内存优化
  optimizeMemoryUsage() {
    // 清理未使用的事件监听器
    const cleanupEventListeners = () => {
      // 移除已分离的 DOM 元素的事件监听器
      const elements = document.querySelectorAll('[data-cleanup]')
      elements.forEach(element => {
        if (!element.isConnected) {
          // 清理事件监听器
          element.removeEventListener('click', null)
          element.removeEventListener('scroll', null)
        }
      })
    }

    // 定期清理
    setInterval(cleanupEventListeners, 60000) // 每分钟清理一次

    // 监控内存使用
    if ('memory' in performance) {
      const checkMemoryUsage = () => {
        const memory = performance.memory
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

        if (usagePercent > 80) {
          console.warn(`🧠 内存使用率过高: ${usagePercent.toFixed(1)}%`)
          // 触发垃圾回收建议
          if (window.gc) {
            window.gc()
          }
        }
      }

      setInterval(checkMemoryUsage, 30000) // 每30秒检查一次
    }
  }

  // 网络优化
  optimizeNetworkRequests() {
    // 请求去重
    const requestCache = new Map()
    
    const deduplicateRequests = (url, options = {}) => {
      const key = `${url}-${JSON.stringify(options)}`
      
      if (requestCache.has(key)) {
        return requestCache.get(key)
      }

      const promise = fetch(url, options)
      requestCache.set(key, promise)

      // 请求完成后清理缓存
      promise.finally(() => {
        setTimeout(() => {
          requestCache.delete(key)
        }, 5000) // 5秒后清理
      })

      return promise
    }

    return { deduplicateRequests }
  }

  // 获取性能报告
  getPerformanceReport() {
    const navigation = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint')

    return {
      navigation: {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        firstByte: navigation?.responseStart - navigation?.requestStart
      },
      paint: {
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
      },
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      } : null,
      optimizations: Array.from(this.optimizations.keys())
    }
  }

  // 清理资源
  cleanup() {
    this.optimizations.forEach((optimization, key) => {
      if (optimization && typeof optimization.disconnect === 'function') {
        optimization.disconnect()
      }
    })
    this.optimizations.clear()
  }
}

// 创建全局实例
export const performanceOptimizer = new PerformanceOptimizer()

// 导出优化工具
export const {
  batchDOMUpdates
} = performanceOptimizer.optimizeJavaScriptExecution()

export const {
  deduplicateRequests
} = performanceOptimizer.optimizeNetworkRequests()

// 性能测量工具
export const measureAsync = async (name, asyncFn) => {
  const start = performance.now()
  try {
    const result = await asyncFn()
    const end = performance.now()
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  } catch (error) {
    const end = performance.now()
    console.error(`❌ ${name} 失败 (${(end - start).toFixed(2)}ms):`, error)
    throw error
  }
}