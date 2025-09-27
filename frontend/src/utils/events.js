import { EVENTS } from '../constants'

// 事件管理器
class EventManager {
  constructor() {
    this.listeners = new Map()
  }

  // 添加事件监听器
  on(eventName, callback, options = {}) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    
    const listener = { callback, options }
    this.listeners.get(eventName).add(listener)
    
    // 返回取消监听的函数
    return () => this.off(eventName, callback)
  }

  // 移除事件监听器
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return false
    
    const listeners = this.listeners.get(eventName)
    for (const listener of listeners) {
      if (listener.callback === callback) {
        listeners.delete(listener)
        return true
      }
    }
    
    return false
  }

  // 触发事件
  emit(eventName, data = null) {
    if (!this.listeners.has(eventName)) return false
    
    const listeners = this.listeners.get(eventName)
    const listenersToRemove = []
    
    for (const listener of listeners) {
      try {
        listener.callback(data)
        
        // 如果是一次性监听器，标记为待移除
        if (listener.options.once) {
          listenersToRemove.push(listener)
        }
      } catch (error) {
        console.error(`事件处理器执行失败 (${eventName}):`, error)
      }
    }
    
    // 移除一次性监听器
    listenersToRemove.forEach(listener => {
      listeners.delete(listener)
    })
    
    return true
  }

  // 一次性事件监听
  once(eventName, callback) {
    return this.on(eventName, callback, { once: true })
  }

  // 移除所有监听器
  removeAllListeners(eventName) {
    if (eventName) {
      this.listeners.delete(eventName)
    } else {
      this.listeners.clear()
    }
  }

  // 获取监听器数量
  listenerCount(eventName) {
    if (!this.listeners.has(eventName)) return 0
    return this.listeners.get(eventName).size
  }

  // 获取所有事件名
  eventNames() {
    return Array.from(this.listeners.keys())
  }
}

// 创建全局事件管理器
export const eventBus = new EventManager()

// DOM事件工具
export const domEvents = {
  // 添加事件监听器
  on(element, eventName, callback, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (!element) return null
    
    element.addEventListener(eventName, callback, options)
    
    // 返回取消监听的函数
    return () => {
      element.removeEventListener(eventName, callback, options)
    }
  },

  // 移除事件监听器
  off(element, eventName, callback, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (!element) return false
    
    element.removeEventListener(eventName, callback, options)
    return true
  },

  // 触发自定义事件
  emit(element, eventName, detail = null) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (!element) return false
    
    const event = new CustomEvent(eventName, { detail })
    element.dispatchEvent(event)
    return true
  },

  // 事件委托
  delegate(container, selector, eventName, callback) {
    if (typeof container === 'string') {
      container = document.querySelector(container)
    }
    
    if (!container) return null
    
    const handler = (event) => {
      const target = event.target.closest(selector)
      if (target && container.contains(target)) {
        callback.call(target, event)
      }
    }
    
    container.addEventListener(eventName, handler)
    
    // 返回取消监听的函数
    return () => {
      container.removeEventListener(eventName, handler)
    }
  }
}

// 窗口事件工具
export const windowEvents = {
  // 监听窗口大小变化
  onResize(callback, debounceMs = 100) {
    let timeoutId
    const handler = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        callback({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }, debounceMs)
    }
    
    window.addEventListener('resize', handler)
    
    // 立即执行一次
    handler()
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handler)
    }
  },

  // 监听滚动事件
  onScroll(callback, throttleMs = 16) {
    let ticking = false
    const handler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback({
            x: window.pageXOffset,
            y: window.pageYOffset,
            direction: {
              x: window.pageXOffset > (handler.lastX || 0) ? 'right' : 'left',
              y: window.pageYOffset > (handler.lastY || 0) ? 'down' : 'up'
            }
          })
          handler.lastX = window.pageXOffset
          handler.lastY = window.pageYOffset
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handler, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handler)
    }
  },

  // 监听页面可见性变化
  onVisibilityChange(callback) {
    const handler = () => {
      callback({
        hidden: document.hidden,
        visibilityState: document.visibilityState
      })
    }
    
    document.addEventListener('visibilitychange', handler)
    
    return () => {
      document.removeEventListener('visibilitychange', handler)
    }
  },

  // 监听网络状态变化
  onNetworkChange(callback) {
    const handler = () => {
      callback({
        online: navigator.onLine,
        connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
      })
    }
    
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    
    // 立即执行一次
    handler()
    
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }
}

// 业务事件工具
export const businessEvents = {
  // 用户登录事件
  onUserLogin(callback) {
    return eventBus.on(EVENTS.USER_LOGIN, callback)
  },

  // 用户登出事件
  onUserLogout(callback) {
    return eventBus.on(EVENTS.USER_LOGOUT, callback)
  },

  // 用户信息更新事件
  onUserUpdate(callback) {
    return eventBus.on(EVENTS.USER_UPDATE, callback)
  },

  // 头像更新事件
  onAvatarUpdated(callback) {
    return eventBus.on(EVENTS.AVATAR_UPDATED, callback)
  },

  // 文章创建事件
  onArticleCreated(callback) {
    return eventBus.on(EVENTS.ARTICLE_CREATED, callback)
  },

  // 文章更新事件
  onArticleUpdated(callback) {
    return eventBus.on(EVENTS.ARTICLE_UPDATED, callback)
  },

  // 文章删除事件
  onArticleDeleted(callback) {
    return eventBus.on(EVENTS.ARTICLE_DELETED, callback)
  },

  // 主题变化事件
  onThemeChanged(callback) {
    return eventBus.on(EVENTS.THEME_CHANGED, callback)
  },

  // 触发用户登录事件
  emitUserLogin(user) {
    return eventBus.emit(EVENTS.USER_LOGIN, user)
  },

  // 触发用户登出事件
  emitUserLogout() {
    return eventBus.emit(EVENTS.USER_LOGOUT)
  },

  // 触发用户信息更新事件
  emitUserUpdate(user) {
    return eventBus.emit(EVENTS.USER_UPDATE, user)
  },

  // 触发头像更新事件
  emitAvatarUpdated(avatar) {
    return eventBus.emit(EVENTS.AVATAR_UPDATED, avatar)
  },

  // 触发文章创建事件
  emitArticleCreated(article) {
    return eventBus.emit(EVENTS.ARTICLE_CREATED, article)
  },

  // 触发文章更新事件
  emitArticleUpdated(article) {
    return eventBus.emit(EVENTS.ARTICLE_UPDATED, article)
  },

  // 触发文章删除事件
  emitArticleDeleted(articleId) {
    return eventBus.emit(EVENTS.ARTICLE_DELETED, { id: articleId })
  },

  // 触发主题变化事件
  emitThemeChanged(theme) {
    return eventBus.emit(EVENTS.THEME_CHANGED, theme)
  }
}

// 键盘事件工具
export const keyboardEvents = {
  // 监听键盘快捷键
  onShortcut(keys, callback, options = {}) {
    const keysArray = Array.isArray(keys) ? keys : [keys]
    const pressedKeys = new Set()
    
    const keydownHandler = (event) => {
      pressedKeys.add(event.key.toLowerCase())
      
      // 检查是否匹配快捷键
      const matches = keysArray.every(key => {
        if (key.includes('+')) {
          const parts = key.split('+').map(k => k.trim().toLowerCase())
          return parts.every(part => {
            if (part === 'ctrl') return event.ctrlKey
            if (part === 'alt') return event.altKey
            if (part === 'shift') return event.shiftKey
            if (part === 'meta') return event.metaKey
            return pressedKeys.has(part)
          })
        } else {
          return pressedKeys.has(key.toLowerCase())
        }
      })
      
      if (matches) {
        if (options.preventDefault !== false) {
          event.preventDefault()
        }
        callback(event)
      }
    }
    
    const keyupHandler = (event) => {
      pressedKeys.delete(event.key.toLowerCase())
    }
    
    document.addEventListener('keydown', keydownHandler)
    document.addEventListener('keyup', keyupHandler)
    
    return () => {
      document.removeEventListener('keydown', keydownHandler)
      document.removeEventListener('keyup', keyupHandler)
    }
  },

  // 监听ESC键
  onEscape(callback) {
    return this.onShortcut('escape', callback)
  },

  // 监听回车键
  onEnter(callback) {
    return this.onShortcut('enter', callback)
  }
}

// 触摸事件工具
export const touchEvents = {
  // 监听滑动手势
  onSwipe(element, callback, options = {}) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (!element) return null
    
    let startX = 0
    let startY = 0
    let endX = 0
    let endY = 0
    
    const minDistance = options.minDistance || 50
    const maxTime = options.maxTime || 300
    let startTime = 0
    
    const touchStartHandler = (event) => {
      const touch = event.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
    }
    
    const touchEndHandler = (event) => {
      const touch = event.changedTouches[0]
      endX = touch.clientX
      endY = touch.clientY
      
      const deltaX = endX - startX
      const deltaY = endY - startY
      const deltaTime = Date.now() - startTime
      
      if (deltaTime > maxTime) return
      
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      if (Math.max(absX, absY) < minDistance) return
      
      let direction
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }
      
      callback({
        direction,
        distance: Math.max(absX, absY),
        deltaX,
        deltaY,
        deltaTime
      })
    }
    
    element.addEventListener('touchstart', touchStartHandler, { passive: true })
    element.addEventListener('touchend', touchEndHandler, { passive: true })
    
    return () => {
      element.removeEventListener('touchstart', touchStartHandler)
      element.removeEventListener('touchend', touchEndHandler)
    }
  }
}