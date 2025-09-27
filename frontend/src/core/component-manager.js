// 组件管理器 - 统一管理组件间通信和状态
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { useArticleStore } from '../stores/article.store'
import { useUIStore } from '../stores/ui.store'

class ComponentManager {
  constructor() {
    this.components = new Map()
    this.eventBus = reactive({})
    this.globalState = reactive({
      loading: false,
      error: null,
      notifications: []
    })
    
    this.stores = {
      auth: null,
      article: null,
      ui: null
    }
    
    this.initialized = false
  }

  // 初始化组件管理器
  async init() {
    if (this.initialized) return
    
    console.log('🎯 初始化组件管理器...')
    
    // 初始化stores
    this.stores.auth = useAuthStore()
    this.stores.article = useArticleStore()
    this.stores.ui = useUIStore()
    
    // 设置全局错误处理
    this.setupGlobalErrorHandling()
    
    // 设置全局加载状态管理
    this.setupGlobalLoadingState()
    
    // 设置通知系统
    this.setupNotificationSystem()
    
    this.initialized = true
    console.log('✅ 组件管理器初始化完成')
  }

  // 注册组件
  registerComponent(name, component) {
    if (this.components.has(name)) {
      console.warn(`⚠️ 组件 "${name}" 已存在，将被覆盖`)
    }
    
    this.components.set(name, {
      instance: component,
      registeredAt: new Date(),
      active: true
    })
    
    console.log(`📦 注册组件: ${name}`)
  }

  // 注销组件
  unregisterComponent(name) {
    if (this.components.has(name)) {
      this.components.delete(name)
      console.log(`🗑️ 注销组件: ${name}`)
    }
  }

  // 获取组件实例
  getComponent(name) {
    const component = this.components.get(name)
    return component ? component.instance : null
  }

  // 组件间通信 - 发送事件
  emit(event, data = null) {
    console.log(`📡 发送事件: ${event}`, data)
    
    if (!this.eventBus[event]) {
      this.eventBus[event] = []
    }
    
    // 触发所有监听器
    this.eventBus[event].forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`❌ 事件监听器执行失败 (${event}):`, error)
      }
    })
  }

  // 组件间通信 - 监听事件
  on(event, callback) {
    if (!this.eventBus[event]) {
      this.eventBus[event] = []
    }
    
    this.eventBus[event].push(callback)
    
    // 返回取消监听的函数
    return () => {
      const index = this.eventBus[event].indexOf(callback)
      if (index > -1) {
        this.eventBus[event].splice(index, 1)
      }
    }
  }

  // 一次性事件监听
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data)
      unsubscribe()
    })
    
    return unsubscribe
  }

  // 设置全局错误处理
  setupGlobalErrorHandling() {
    // 监听各个store的错误
    watch(() => this.stores.auth?.error, (error) => {
      if (error) {
        this.handleGlobalError('认证错误', error)
      }
    })
    
    watch(() => this.stores.article?.error, (error) => {
      if (error) {
        this.handleGlobalError('文章操作错误', error)
      }
    })
    
    // 监听未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError('未处理的Promise错误', event.reason)
      event.preventDefault()
    })
    
    // 监听JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleGlobalError('JavaScript错误', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
  }

  // 处理全局错误
  handleGlobalError(type, error) {
    console.error(`🚨 ${type}:`, error)
    
    this.globalState.error = {
      type,
      error,
      timestamp: new Date().toISOString()
    }
    
    // 发送错误事件
    this.emit('global:error', this.globalState.error)
    
    // 显示错误通知
    this.showNotification({
      type: 'error',
      title: type,
      message: typeof error === 'string' ? error : error.message || '发生未知错误',
      duration: 5000
    })
  }

  // 设置全局加载状态管理
  setupGlobalLoadingState() {
    // 监听各个store的加载状态
    watch(() => this.stores.auth?.loading, (loading) => {
      this.updateGlobalLoading('auth', loading)
    })
    
    watch(() => this.stores.article?.loading, (loading) => {
      this.updateGlobalLoading('article', loading)
    })
  }

  // 更新全局加载状态
  updateGlobalLoading(source, loading) {
    if (!this.globalState.loadingSources) {
      this.globalState.loadingSources = new Set()
    }
    
    if (loading) {
      this.globalState.loadingSources.add(source)
    } else {
      this.globalState.loadingSources.delete(source)
    }
    
    this.globalState.loading = this.globalState.loadingSources.size > 0
    
    // 发送加载状态变化事件
    this.emit('global:loading', {
      loading: this.globalState.loading,
      sources: Array.from(this.globalState.loadingSources)
    })
  }

  // 设置通知系统
  setupNotificationSystem() {
    // 监听各种事件并显示通知
    this.on('auth:login', () => {
      this.showNotification({
        type: 'success',
        title: '登录成功',
        message: '欢迎回来！'
      })
    })
    
    this.on('auth:logout', () => {
      this.showNotification({
        type: 'info',
        title: '已退出登录',
        message: '感谢您的使用'
      })
    })
    
    this.on('article:created', (article) => {
      this.showNotification({
        type: 'success',
        title: '文章发布成功',
        message: `《${article.title}》已成功发布`
      })
    })
  }

  // 显示通知
  showNotification(notification) {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const notificationObj = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 3000,
      timestamp: new Date().toISOString(),
      ...notification
    }
    
    this.globalState.notifications.push(notificationObj)
    
    // 自动移除通知
    if (notificationObj.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id)
      }, notificationObj.duration)
    }
    
    // 发送通知事件
    this.emit('notification:show', notificationObj)
    
    return id
  }

  // 移除通知
  removeNotification(id) {
    const index = this.globalState.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      const notification = this.globalState.notifications.splice(index, 1)[0]
      this.emit('notification:remove', notification)
    }
  }

  // 清空所有通知
  clearNotifications() {
    this.globalState.notifications.splice(0)
    this.emit('notification:clear')
  }

  // 获取全局状态
  getGlobalState() {
    return {
      loading: computed(() => this.globalState.loading),
      error: computed(() => this.globalState.error),
      notifications: computed(() => this.globalState.notifications),
      stores: this.stores
    }
  }

  // 获取组件统计信息
  getStats() {
    return {
      totalComponents: this.components.size,
      activeComponents: Array.from(this.components.values()).filter(c => c.active).length,
      totalEvents: Object.keys(this.eventBus).length,
      totalNotifications: this.globalState.notifications.length,
      initialized: this.initialized
    }
  }

  // 重置组件管理器
  reset() {
    console.log('🔄 重置组件管理器...')
    
    this.components.clear()
    Object.keys(this.eventBus).forEach(key => {
      delete this.eventBus[key]
    })
    
    this.globalState.loading = false
    this.globalState.error = null
    this.globalState.notifications.splice(0)
    
    this.initialized = false
    
    console.log('✅ 组件管理器重置完成')
  }
}

// 创建单例实例
export const componentManager = new ComponentManager()

// 导出组合式函数
export function useComponentManager() {
  return {
    ...componentManager.getGlobalState(),
    emit: componentManager.emit.bind(componentManager),
    on: componentManager.on.bind(componentManager),
    once: componentManager.once.bind(componentManager),
    showNotification: componentManager.showNotification.bind(componentManager),
    removeNotification: componentManager.removeNotification.bind(componentManager),
    clearNotifications: componentManager.clearNotifications.bind(componentManager)
  }
}

export default ComponentManager