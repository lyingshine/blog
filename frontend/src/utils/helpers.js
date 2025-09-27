// 通用工具函数

// 防抖函数
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 生成唯一ID
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return prefix + timestamp + randomStr
}

// 生成UUID
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 检查是否为空值
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// 检查是否为有效的URL
export const isValidUrl = (string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// 检查是否为有效的邮箱
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 获取文件扩展名
export const getFileExtension = (filename) => {
  if (!filename) return ''
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// 获取文件名（不含扩展名）
export const getFileName = (filename) => {
  if (!filename) return ''
  return filename.replace(/\.[^/.]+$/, '')
}

// 转换为驼峰命名
export const toCamelCase = (str) => {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  )
}

// 转换为短横线命名
export const toKebabCase = (str) => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

// 转换为下划线命名
export const toSnakeCase = (str) => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase()
}

// 首字母大写
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 随机选择数组元素
export const randomChoice = (array) => {
  if (!Array.isArray(array) || array.length === 0) return null
  return array[Math.floor(Math.random() * array.length)]
}

// 打乱数组
export const shuffle = (array) => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// 数组去重
export const unique = (array, key) => {
  if (!Array.isArray(array)) return []
  
  if (key) {
    const seen = new Set()
    return array.filter(item => {
      const value = item[key]
      if (seen.has(value)) {
        return false
      }
      seen.add(value)
      return true
    })
  }
  
  return [...new Set(array)]
}

// 数组分组
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {}
  
  return array.reduce((groups, item) => {
    const group = typeof key === 'function' ? key(item) : item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

// 数组排序
export const sortBy = (array, key, order = 'asc') => {
  if (!Array.isArray(array)) return []
  
  return [...array].sort((a, b) => {
    const aValue = typeof key === 'function' ? key(a) : a[key]
    const bValue = typeof key === 'function' ? key(b) : b[key]
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}

// 对象合并
export const merge = (...objects) => {
  return objects.reduce((result, obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          result[key] = merge(result[key] || {}, obj[key])
        } else {
          result[key] = obj[key]
        }
      })
    }
    return result
  }, {})
}

// 获取嵌套对象属性
export const get = (obj, path, defaultValue = undefined) => {
  if (!obj || !path) return defaultValue
  
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result === null || result === undefined || !(key in result)) {
      return defaultValue
    }
    result = result[key]
  }
  
  return result
}

// 设置嵌套对象属性
export const set = (obj, path, value) => {
  if (!obj || !path) return obj
  
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return obj
}

// 删除嵌套对象属性
export const unset = (obj, path) => {
  if (!obj || !path) return obj
  
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      return obj
    }
    current = current[key]
  }
  
  delete current[keys[keys.length - 1]]
  return obj
}

// 等待指定时间
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重试函数
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  let lastError
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts) {
        throw lastError
      }
      await sleep(delay * attempt)
    }
  }
}

// 检查设备类型
export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return 'mobile'
  } else if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

// 检查浏览器类型
export const getBrowserType = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('chrome')) return 'chrome'
  if (userAgent.includes('firefox')) return 'firefox'
  if (userAgent.includes('safari')) return 'safari'
  if (userAgent.includes('edge')) return 'edge'
  if (userAgent.includes('opera')) return 'opera'
  return 'unknown'
}

// 复制到剪贴板
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      textArea.remove()
      return result
    }
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
    return false
  }
}

// 下载文件
export const downloadFile = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'download'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 获取查询参数
export const getQueryParams = (url = window.location.href) => {
  const params = new URLSearchParams(new URL(url).search)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// 设置查询参数
export const setQueryParams = (params, url = window.location.href) => {
  const urlObj = new URL(url)
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      urlObj.searchParams.set(key, params[key])
    } else {
      urlObj.searchParams.delete(key)
    }
  })
  return urlObj.toString()
}

// 滚动到元素
export const scrollToElement = (element, options = {}) => {
  if (typeof element === 'string') {
    element = document.querySelector(element)
  }
  
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
      ...options
    })
  }
}

// 滚动到顶部
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  })
}

// 获取滚动位置
export const getScrollPosition = () => {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  }
}

// 检查元素是否在视口中
export const isElementInViewport = (element) => {
  if (typeof element === 'string') {
    element = document.querySelector(element)
  }
  
  if (!element) return false
  
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}