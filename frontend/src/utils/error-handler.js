// 统一错误处理工具
import { ERROR_CODES } from '../constants'

class ErrorHandler {
  constructor() {
    this.errorListeners = []
    this.errorHistory = []
    this.maxHistorySize = 100
  }

  // 添加错误监听器
  addListener(listener) {
    this.errorListeners.push(listener)
  }

  // 移除错误监听器
  removeListener(listener) {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  // 处理错误
  handle(error, context = {}) {
    const errorInfo = this.normalizeError(error, context)
    
    // 添加到历史记录
    this.addToHistory(errorInfo)
    
    // 通知所有监听器
    this.notifyListeners(errorInfo)
    
    // 根据错误类型执行相应处理
    this.processError(errorInfo)
    
    return errorInfo
  }

  // 标准化错误对象
  normalizeError(error, context) {
    const timestamp = new Date().toISOString()
    const id = this.generateErrorId()

    let errorInfo = {
      id,
      timestamp,
      context,
      stack: error.stack,
      handled: false
    }

    if (error.response) {
      // HTTP错误
      const { status, data, config } = error.response
      errorInfo = {
        ...errorInfo,
        type: 'HTTP_ERROR',
        status,
        message: data?.message || error.message,
        code: data?.code || this.getErrorCodeByStatus(status),
        url: config?.url,
        method: config?.method?.toUpperCase(),
        data: data
      }
    } else if (error.request) {
      // 网络错误
      errorInfo = {
        ...errorInfo,
        type: 'NETWORK_ERROR',
        message: '网络连接失败',
        code: ERROR_CODES.NETWORK_ERROR
      }
    } else if (error.name === 'ValidationError') {
      // 验证错误
      errorInfo = {
        ...errorInfo,
        type: 'VALIDATION_ERROR',
        message: error.message,
        code: ERROR_CODES.VALIDATION_ERROR,
        fields: error.fields || {}
      }
    } else {
      // 其他错误
      errorInfo = {
        ...errorInfo,
        type: 'UNKNOWN_ERROR',
        message: error.message || '未知错误',
        code: ERROR_CODES.UNKNOWN_ERROR,
        name: error.name
      }
    }

    return errorInfo
  }

  // 根据HTTP状态码获取错误代码
  getErrorCodeByStatus(status) {
    const statusMap = {
      400: ERROR_CODES.BAD_REQUEST,
      401: ERROR_CODES.UNAUTHORIZED,
      403: ERROR_CODES.FORBIDDEN,
      404: ERROR_CODES.NOT_FOUND,
      422: ERROR_CODES.VALIDATION_ERROR,
      429: ERROR_CODES.RATE_LIMIT,
      500: ERROR_CODES.SERVER_ERROR,
      502: ERROR_CODES.BAD_GATEWAY,
      503: ERROR_CODES.SERVICE_UNAVAILABLE
    }
    
    return statusMap[status] || ERROR_CODES.UNKNOWN_ERROR
  }

  // 处理特定类型的错误
  processError(errorInfo) {
    switch (errorInfo.code) {
      case ERROR_CODES.UNAUTHORIZED:
        this.handleUnauthorized(errorInfo)
        break
      case ERROR_CODES.FORBIDDEN:
        this.handleForbidden(errorInfo)
        break
      case ERROR_CODES.NOT_FOUND:
        this.handleNotFound(errorInfo)
        break
      case ERROR_CODES.VALIDATION_ERROR:
        this.handleValidationError(errorInfo)
        break
      case ERROR_CODES.NETWORK_ERROR:
        this.handleNetworkError(errorInfo)
        break
      case ERROR_CODES.RATE_LIMIT:
        this.handleRateLimit(errorInfo)
        break
      default:
        this.handleGenericError(errorInfo)
    }
  }

  // 处理未授权错误
  handleUnauthorized(errorInfo) {
    console.warn('🔐 未授权访问:', errorInfo.message)
    // 可以在这里触发登出逻辑
    this.emit('auth:unauthorized', errorInfo)
  }

  // 处理禁止访问错误
  handleForbidden(errorInfo) {
    console.warn('🚫 访问被禁止:', errorInfo.message)
    this.emit('auth:forbidden', errorInfo)
  }

  // 处理资源未找到错误
  handleNotFound(errorInfo) {
    console.warn('🔍 资源未找到:', errorInfo.message)
    this.emit('resource:not-found', errorInfo)
  }

  // 处理验证错误
  handleValidationError(errorInfo) {
    console.warn('📝 数据验证失败:', errorInfo.message)
    this.emit('validation:error', errorInfo)
  }

  // 处理网络错误
  handleNetworkError(errorInfo) {
    console.error('🌐 网络连接失败:', errorInfo.message)
    this.emit('network:error', errorInfo)
  }

  // 处理限流错误
  handleRateLimit(errorInfo) {
    console.warn('⏱️ 请求频率过高:', errorInfo.message)
    this.emit('rate:limit', errorInfo)
  }

  // 处理通用错误
  handleGenericError(errorInfo) {
    console.error('❌ 发生错误:', errorInfo.message)
    this.emit('error:generic', errorInfo)
  }

  // 触发事件
  emit(event, data) {
    // 这里可以集成事件系统
    console.log(`📡 错误事件: ${event}`, data)
  }

  // 通知监听器
  notifyListeners(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo)
      } catch (err) {
        console.error('错误监听器执行失败:', err)
      }
    })
  }

  // 添加到历史记录
  addToHistory(errorInfo) {
    this.errorHistory.unshift(errorInfo)
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }

  // 生成错误ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取错误历史
  getHistory(limit = 10) {
    return this.errorHistory.slice(0, limit)
  }

  // 清空错误历史
  clearHistory() {
    this.errorHistory = []
  }

  // 获取错误统计
  getStats() {
    const stats = {
      total: this.errorHistory.length,
      byType: {},
      byCode: {},
      recent: this.errorHistory.slice(0, 5)
    }

    this.errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1
    })

    return stats
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler()

// 错误处理装饰器
export function handleErrors(fallbackValue = null) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        const errorInfo = errorHandler.handle(error, {
          method: `${target.constructor.name}.${propertyKey}`,
          args
        })
        
        // 返回fallback值或重新抛出错误
        if (fallbackValue !== null) {
          return fallbackValue
        }
        
        throw errorInfo
      }
    }

    return descriptor
  }
}

export default ErrorHandler