// 增强的基础服务类
import { cache, cached } from '../utils/cache'
import { errorHandler, handleErrors } from '../utils/error-handler'
import { apiClient } from './base'

export class EnhancedBaseService {
  constructor(name, options = {}) {
    this.name = name
    this.options = {
      enableCache: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableOffline: false,
      ...options
    }
    
    this.initialized = false
    this.error = null
    this.lastActivity = null
    this.metrics = {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
  }

  // 初始化服务
  async init() {
    if (this.initialized) return
    
    try {
      console.log(`🔧 初始化 ${this.name} 服务...`)
      
      // 子类可以重写此方法
      await this.onInit()
      
      this.initialized = true
      this.error = null
      console.log(`✅ ${this.name} 服务初始化完成`)
      
    } catch (error) {
      this.error = error
      console.error(`❌ ${this.name} 服务初始化失败:`, error)
      throw error
    }
  }

  // 子类重写的初始化方法
  async onInit() {
    // 默认空实现
  }

  // 重置服务
  async reset() {
    console.log(`🔄 重置 ${this.name} 服务...`)
    
    // 清除相关缓存
    this.clearCache()
    
    // 重置状态
    this.initialized = false
    this.error = null
    this.lastActivity = null
    this.metrics = {
      requests: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
    
    // 子类可以重写此方法
    await this.onReset()
    
    console.log(`✅ ${this.name} 服务重置完成`)
  }

  // 子类重写的重置方法
  async onReset() {
    // 默认空实现
  }

  // 健康检查
  async healthCheck() {
    try {
      // 子类可以重写此方法
      const result = await this.onHealthCheck()
      
      return {
        status: 'ok',
        service: this.name,
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        metrics: this.metrics,
        ...result
      }
    } catch (error) {
      return {
        status: 'error',
        service: this.name,
        error: error.message,
        initialized: this.initialized
      }
    }
  }

  // 子类重写的健康检查方法
  async onHealthCheck() {
    return {}
  }

  // 发送HTTP请求（带缓存和错误处理）
  @handleErrors()
  async request(config, options = {}) {
    const {
      useCache = this.options.enableCache,
      cacheTTL = 5 * 60 * 1000,
      retries = this.options.enableRetry ? this.options.maxRetries : 0,
      retryDelay = this.options.retryDelay
    } = options

    this.metrics.requests++
    this.lastActivity = new Date().toISOString()

    // 生成缓存键
    const cacheKey = this.generateCacheKey(config)
    
    // 尝试从缓存获取（仅对GET请求）
    if (useCache && config.method?.toLowerCase() === 'get') {
      const cached = cache.get(cacheKey)
      if (cached) {
        this.metrics.cacheHits++
        console.log(`🎯 ${this.name} 缓存命中:`, config.url)
        return cached
      }
      this.metrics.cacheMisses++
    }

    // 发送请求（带重试）
    let lastError
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiClient(config)
        
        // 缓存成功响应（仅对GET请求）
        if (useCache && config.method?.toLowerCase() === 'get' && response.success) {
          cache.set(cacheKey, response, cacheTTL)
        }
        
        return response
        
      } catch (error) {
        lastError = error
        this.metrics.errors++
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < retries) {
          console.warn(`⚠️ ${this.name} 请求失败，${retryDelay}ms后重试 (${attempt + 1}/${retries}):`, error.message)
          await this.delay(retryDelay * (attempt + 1)) // 指数退避
        }
      }
    }

    // 所有重试都失败，抛出最后的错误
    throw lastError
  }

  // GET请求
  async get(url, params = {}, options = {}) {
    return this.request({
      method: 'GET',
      url,
      params
    }, options)
  }

  // POST请求
  async post(url, data = {}, options = {}) {
    return this.request({
      method: 'POST',
      url,
      data
    }, { useCache: false, ...options })
  }

  // PUT请求
  async put(url, data = {}, options = {}) {
    return this.request({
      method: 'PUT',
      url,
      data
    }, { useCache: false, ...options })
  }

  // DELETE请求
  async delete(url, options = {}) {
    return this.request({
      method: 'DELETE',
      url
    }, { useCache: false, ...options })
  }

  // 生成缓存键
  generateCacheKey(config) {
    const { method, url, params, data } = config
    const key = `${this.name}.${method}.${url}`
    
    if (params && Object.keys(params).length > 0) {
      return `${key}.${JSON.stringify(params)}`
    }
    
    if (data && Object.keys(data).length > 0) {
      return `${key}.${JSON.stringify(data)}`
    }
    
    return key
  }

  // 清除服务相关的缓存
  clearCache(pattern) {
    const prefix = pattern || this.name
    
    // 这里需要实现缓存清除逻辑
    // cache.clearByPattern(prefix)
    console.log(`🗑️ 清除 ${this.name} 服务缓存`)
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 获取服务指标
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.requests > 0 
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  // 批量请求
  async batch(requests, options = {}) {
    const {
      concurrent = 5,
      failFast = false
    } = options

    const results = []
    const errors = []

    // 分批处理请求
    for (let i = 0; i < requests.length; i += concurrent) {
      const batch = requests.slice(i, i + concurrent)
      
      const promises = batch.map(async (request, index) => {
        try {
          const result = await this.request(request.config, request.options)
          return { index: i + index, result, success: true }
        } catch (error) {
          const errorInfo = { index: i + index, error, success: false }
          
          if (failFast) {
            throw errorInfo
          }
          
          return errorInfo
        }
      })

      const batchResults = await Promise.all(promises)
      
      batchResults.forEach(item => {
        if (item.success) {
          results[item.index] = item.result
        } else {
          errors[item.index] = item.error
        }
      })
    }

    return {
      results,
      errors,
      success: errors.length === 0,
      total: requests.length,
      successful: results.filter(r => r !== undefined).length,
      failed: errors.filter(e => e !== undefined).length
    }
  }
}

export default EnhancedBaseService