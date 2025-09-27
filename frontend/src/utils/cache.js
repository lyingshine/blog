// 缓存管理工具
class CacheManager {
  constructor() {
    this.cache = new Map()
    this.ttlMap = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5分钟默认过期时间
  }

  // 设置缓存
  set(key, value, ttl = this.defaultTTL) {
    const now = Date.now()
    this.cache.set(key, {
      value,
      timestamp: now,
      accessed: now
    })
    
    if (ttl > 0) {
      this.ttlMap.set(key, now + ttl)
    }
    
    // 清理过期缓存
    this.cleanup()
  }

  // 获取缓存
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    const expiry = this.ttlMap.get(key)
    
    // 检查是否过期
    if (expiry && now > expiry) {
      this.delete(key)
      return null
    }

    // 更新访问时间
    item.accessed = now
    return item.value
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key)
    this.ttlMap.delete(key)
  }

  // 清空所有缓存
  clear() {
    this.cache.clear()
    this.ttlMap.clear()
  }

  // 检查缓存是否存在且未过期
  has(key) {
    return this.get(key) !== null
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now()
    
    for (const [key, expiry] of this.ttlMap.entries()) {
      if (now > expiry) {
        this.delete(key)
      }
    }
  }

  // 获取缓存统计信息
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const [key, expiry] of this.ttlMap.entries()) {
      if (now > expiry) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      memory: this.getMemoryUsage()
    }
  }

  // 估算内存使用量
  getMemoryUsage() {
    let size = 0
    for (const [key, item] of this.cache.entries()) {
      size += JSON.stringify({ key, ...item }).length
    }
    return size
  }

  // 设置缓存策略
  setStrategy(key, strategy) {
    const strategies = {
      'no-cache': () => this.delete(key),
      'refresh': () => {
        const item = this.cache.get(key)
        if (item) {
          item.timestamp = Date.now()
        }
      },
      'extend': (ttl = this.defaultTTL) => {
        const now = Date.now()
        this.ttlMap.set(key, now + ttl)
      }
    }

    const strategyFn = strategies[strategy]
    if (strategyFn) {
      strategyFn()
    }
  }
}

// 创建全局缓存实例
export const cache = new CacheManager()

// 缓存装饰器
export function cached(ttl = 5 * 60 * 1000) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args) {
      const cacheKey = `${target.constructor.name}.${propertyKey}.${JSON.stringify(args)}`
      
      // 尝试从缓存获取
      const cached = cache.get(cacheKey)
      if (cached !== null) {
        console.log(`🎯 缓存命中: ${cacheKey}`)
        return cached
      }

      // 执行原方法
      console.log(`🔄 缓存未命中，执行方法: ${cacheKey}`)
      const result = await originalMethod.apply(this, args)
      
      // 存储到缓存
      cache.set(cacheKey, result, ttl)
      
      return result
    }

    return descriptor
  }
}

export default CacheManager