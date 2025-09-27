import { STORAGE_KEYS } from '../constants'

// 存储工具类
class StorageManager {
  constructor(storage = localStorage) {
    this.storage = storage
  }

  // 设置存储项
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value)
      this.storage.setItem(key, serializedValue)
      return true
    } catch (error) {
      console.error('存储设置失败:', error)
      return false
    }
  }

  // 获取存储项
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item)
    } catch (error) {
      console.error('存储获取失败:', error)
      return defaultValue
    }
  }

  // 移除存储项
  remove(key) {
    try {
      this.storage.removeItem(key)
      return true
    } catch (error) {
      console.error('存储移除失败:', error)
      return false
    }
  }

  // 清空所有存储
  clear() {
    try {
      this.storage.clear()
      return true
    } catch (error) {
      console.error('存储清空失败:', error)
      return false
    }
  }

  // 检查存储项是否存在
  has(key) {
    return this.storage.getItem(key) !== null
  }

  // 获取所有键
  keys() {
    return Object.keys(this.storage)
  }

  // 获取存储大小
  size() {
    return this.storage.length
  }

  // 获取存储使用情况（仅适用于localStorage）
  getUsage() {
    if (this.storage !== localStorage) return null
    
    let total = 0
    for (let key in this.storage) {
      if (this.storage.hasOwnProperty(key)) {
        total += this.storage[key].length + key.length
      }
    }
    
    return {
      used: total,
      remaining: 5 * 1024 * 1024 - total, // 假设5MB限制
      percentage: (total / (5 * 1024 * 1024)) * 100
    }
  }
}

// 创建存储管理器实例
export const localStorage = new StorageManager(window.localStorage)
export const sessionStorage = new StorageManager(window.sessionStorage)

// 特定业务的存储工具
export const authStorage = {
  // 设置用户token
  setToken(token) {
    return localStorage.set(STORAGE_KEYS.TOKEN, token)
  },

  // 获取用户token
  getToken() {
    return localStorage.get(STORAGE_KEYS.TOKEN)
  },

  // 移除用户token
  removeToken() {
    return localStorage.remove(STORAGE_KEYS.TOKEN)
  },

  // 设置用户信息
  setUser(user) {
    return localStorage.set(STORAGE_KEYS.USER, user)
  },

  // 获取用户信息
  getUser() {
    return localStorage.get(STORAGE_KEYS.USER)
  },

  // 移除用户信息
  removeUser() {
    return localStorage.remove(STORAGE_KEYS.USER)
  },

  // 清除所有认证信息
  clearAuth() {
    this.removeToken()
    this.removeUser()
  },

  // 检查是否已认证
  isAuthenticated() {
    return !!this.getToken()
  }
}

export const themeStorage = {
  // 设置主题
  setTheme(theme) {
    return localStorage.set(STORAGE_KEYS.THEME, theme)
  },

  // 获取主题
  getTheme() {
    return localStorage.get(STORAGE_KEYS.THEME)
  },

  // 移除主题设置
  removeTheme() {
    return localStorage.remove(STORAGE_KEYS.THEME)
  }
}

export const articleStorage = {
  // 设置文章缓存
  setArticles(articles) {
    return localStorage.set(STORAGE_KEYS.ARTICLES, articles)
  },

  // 获取文章缓存
  getArticles() {
    return localStorage.get(STORAGE_KEYS.ARTICLES, [])
  },

  // 添加文章到缓存
  addArticle(article) {
    const articles = this.getArticles()
    articles.unshift(article)
    return this.setArticles(articles)
  },

  // 更新缓存中的文章
  updateArticle(id, updatedArticle) {
    const articles = this.getArticles()
    const index = articles.findIndex(article => article.id === id)
    if (index !== -1) {
      articles[index] = updatedArticle
      return this.setArticles(articles)
    }
    return false
  },

  // 从缓存中移除文章
  removeArticle(id) {
    const articles = this.getArticles()
    const filteredArticles = articles.filter(article => article.id !== id)
    return this.setArticles(filteredArticles)
  },

  // 清空文章缓存
  clearArticles() {
    return localStorage.remove(STORAGE_KEYS.ARTICLES)
  }
}

// 缓存管理器
export class CacheManager {
  constructor(prefix = 'cache_', ttl = 3600000) { // 默认1小时过期
    this.prefix = prefix
    this.ttl = ttl
  }

  // 生成缓存键
  generateKey(key) {
    return this.prefix + key
  }

  // 设置缓存
  set(key, value, ttl = this.ttl) {
    const cacheKey = this.generateKey(key)
    const cacheValue = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl
    }
    return localStorage.set(cacheKey, cacheValue)
  }

  // 获取缓存
  get(key, defaultValue = null) {
    const cacheKey = this.generateKey(key)
    const cacheValue = localStorage.get(cacheKey)
    
    if (!cacheValue) return defaultValue
    
    const { data, timestamp, ttl } = cacheValue
    const now = Date.now()
    
    // 检查是否过期
    if (now - timestamp > ttl) {
      this.remove(key)
      return defaultValue
    }
    
    return data
  }

  // 移除缓存
  remove(key) {
    const cacheKey = this.generateKey(key)
    return localStorage.remove(cacheKey)
  }

  // 清空所有缓存
  clear() {
    const keys = localStorage.keys()
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.remove(key)
      }
    })
  }

  // 检查缓存是否存在且未过期
  has(key) {
    return this.get(key) !== null
  }

  // 刷新缓存过期时间
  refresh(key, ttl = this.ttl) {
    const data = this.get(key)
    if (data !== null) {
      return this.set(key, data, ttl)
    }
    return false
  }
}

// 创建默认缓存管理器
export const cache = new CacheManager()

// 创建API缓存管理器
export const apiCache = new CacheManager('api_cache_', 300000) // 5分钟过期

// 存储事件监听器
export const storageEvents = {
  // 监听存储变化
  listen(callback) {
    const handler = (event) => {
      if (event.storageArea === window.localStorage) {
        callback({
          key: event.key,
          oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
          newValue: event.newValue ? JSON.parse(event.newValue) : null,
          url: event.url
        })
      }
    }
    
    window.addEventListener('storage', handler)
    
    // 返回取消监听的函数
    return () => {
      window.removeEventListener('storage', handler)
    }
  },

  // 监听特定键的变化
  listenKey(key, callback) {
    return this.listen((event) => {
      if (event.key === key) {
        callback(event)
      }
    })
  }
}

// 存储配额管理
export const storageQuota = {
  // 检查存储配额
  async checkQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          percentage: (estimate.usage / estimate.quota) * 100
        }
      } catch (error) {
        console.error('检查存储配额失败:', error)
        return null
      }
    }
    return null
  },

  // 请求持久化存储
  async requestPersistent() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        return await navigator.storage.persist()
      } catch (error) {
        console.error('请求持久化存储失败:', error)
        return false
      }
    }
    return false
  },

  // 检查是否为持久化存储
  async isPersistent() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted()
      } catch (error) {
        console.error('检查持久化存储状态失败:', error)
        return false
      }
    }
    return false
  }
}