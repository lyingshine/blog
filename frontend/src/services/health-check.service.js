// 健康检查服务
class HealthCheckService {
  constructor() {
    this.checks = new Map()
    this.lastResults = new Map()
  }

  // 注册健康检查
  register(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      interval: options.interval || 30000
    })
  }

  // 执行单个检查
  async runCheck(name) {
    const check = this.checks.get(name)
    if (!check) {
      return {
        status: 'error',
        message: `检查项 ${name} 不存在`
      }
    }

    try {
      const result = await Promise.race([
        check.fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('检查超时')), check.timeout)
        )
      ])

      const healthResult = {
        status: 'ok',
        name,
        timestamp: Date.now(),
        ...result
      }

      this.lastResults.set(name, healthResult)
      return healthResult

    } catch (error) {
      const errorResult = {
        status: 'error',
        name,
        message: error.message,
        timestamp: Date.now(),
        critical: check.critical
      }

      this.lastResults.set(name, errorResult)
      return errorResult
    }
  }

  // 执行所有检查
  async runAllChecks() {
    const results = {}
    const promises = Array.from(this.checks.keys()).map(async (name) => {
      const result = await this.runCheck(name)
      results[name] = result
      return result
    })

    await Promise.allSettled(promises)

    // 计算整体健康状态
    const allResults = Object.values(results)
    const hasErrors = allResults.some(r => r.status === 'error')
    const hasCriticalErrors = allResults.some(r => r.status === 'error' && r.critical)

    return {
      overall: hasCriticalErrors ? 'critical' : hasErrors ? 'degraded' : 'healthy',
      checks: results,
      timestamp: Date.now(),
      summary: {
        total: allResults.length,
        healthy: allResults.filter(r => r.status === 'ok').length,
        errors: allResults.filter(r => r.status === 'error').length,
        critical: allResults.filter(r => r.status === 'error' && r.critical).length
      }
    }
  }

  // 获取最后的检查结果
  getLastResults() {
    return Object.fromEntries(this.lastResults)
  }

  // 启动定期检查
  startPeriodicChecks() {
    this.checks.forEach((check, name) => {
      if (check.interval > 0) {
        setInterval(() => {
          this.runCheck(name).catch(error => {
            console.error(`定期健康检查失败 [${name}]:`, error)
          })
        }, check.interval)
      }
    })
  }

  // 停止所有检查
  stop() {
    // 清理定时器等资源
    this.checks.clear()
    this.lastResults.clear()
  }
}

// 创建全局实例
export const healthCheckService = new HealthCheckService()

// 注册默认的健康检查项
healthCheckService.register('api', async () => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      timeout: 3000
    })
    
    if (response.ok) {
      return {
        status: 'ok',
        message: 'API 服务正常',
        responseTime: performance.now()
      }
    } else {
      throw new Error(`API 响应错误: ${response.status}`)
    }
  } catch (error) {
    return {
      status: 'error',
      message: `API 连接失败: ${error.message}`
    }
  }
}, { critical: true, timeout: 3000 })

healthCheckService.register('localStorage', async () => {
  try {
    const testKey = '__health_check_test__'
    const testValue = Date.now().toString()
    
    localStorage.setItem(testKey, testValue)
    const retrieved = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    
    if (retrieved === testValue) {
      return {
        status: 'ok',
        message: 'localStorage 正常'
      }
    } else {
      throw new Error('localStorage 读写测试失败')
    }
  } catch (error) {
    return {
      status: 'error',
      message: `localStorage 不可用: ${error.message}`
    }
  }
}, { critical: false })

healthCheckService.register('memory', async () => {
  if ('memory' in performance) {
    const memory = performance.memory
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    
    return {
      status: usagePercent > 90 ? 'error' : usagePercent > 70 ? 'warning' : 'ok',
      message: `内存使用率: ${usagePercent.toFixed(1)}%`,
      details: {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      }
    }
  } else {
    return {
      status: 'ok',
      message: '内存信息不可用'
    }
  }
}, { critical: false })

healthCheckService.register('performance', async () => {
  const navigation = performance.getEntriesByType('navigation')[0]
  const paint = performance.getEntriesByType('paint')
  
  const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime
  const loadTime = navigation?.loadEventEnd - navigation?.navigationStart
  
  let status = 'ok'
  let message = '性能正常'
  
  if (fcp > 2500 || loadTime > 5000) {
    status = 'warning'
    message = '性能需要优化'
  }
  
  if (fcp > 4000 || loadTime > 8000) {
    status = 'error'
    message = '性能严重问题'
  }
  
  return {
    status,
    message,
    details: {
      firstContentfulPaint: fcp,
      loadTime,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart
    }
  }
}, { critical: false })

export default healthCheckService