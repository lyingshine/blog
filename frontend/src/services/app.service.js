// 应用级服务管理器
import { authService } from './auth.service'
import { articleService } from './article.service'
import { userService } from './user.service'
import { commentService } from './comment.service'
import { tagService } from './tag.service'

class AppService {
  constructor() {
    this.services = {
      auth: authService,
      article: articleService,
      user: userService,
      comment: commentService,
      tag: tagService
    }
    
    this.initialized = false
    this.initPromise = null
  }

  // 初始化所有服务
  async init() {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this._doInit()
    return this.initPromise
  }

  async _doInit() {
    try {

      
      // 初始化各个服务
      const initPromises = Object.entries(this.services).map(async ([name, service]) => {
        if (service.init && typeof service.init === 'function') {
          await service.init()

        }
      })

      await Promise.all(initPromises)
      
      this.initialized = true

      
    } catch (error) {
      console.error('❌ 服务层初始化失败:', error)
      throw error
    }
  }

  // 获取服务实例
  getService(name) {
    const service = this.services[name]
    if (!service) {
      throw new Error(`服务 "${name}" 不存在`)
    }
    return service
  }

  // 检查服务健康状态
  async healthCheck() {
    const results = {}
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        if (service.healthCheck && typeof service.healthCheck === 'function') {
          results[name] = await service.healthCheck()
        } else {
          results[name] = { status: 'ok', message: '服务正常' }
        }
      } catch (error) {
        results[name] = { 
          status: 'error', 
          message: error.message,
          error: error
        }
      }
    }
    
    return results
  }

  // 重置所有服务
  async reset() {

    
    const resetPromises = Object.entries(this.services).map(async ([name, service]) => {
      try {
        if (service.reset && typeof service.reset === 'function') {
          await service.reset()

        }
      } catch (error) {
        console.error(`❌ ${name} 服务重置失败:`, error)
      }
    })

    await Promise.all(resetPromises)
    
    this.initialized = false
    this.initPromise = null
    

  }

  // 获取所有服务状态
  getServicesStatus() {
    const status = {}
    
    for (const [name, service] of Object.entries(this.services)) {
      status[name] = {
        initialized: service.initialized || false,
        hasError: service.error || false,
        lastActivity: service.lastActivity || null
      }
    }
    
    return {
      appInitialized: this.initialized,
      services: status
    }
  }
}

// 创建单例实例
export const appService = new AppService()

// 导出服务类
export default AppService