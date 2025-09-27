// 应用配置管理
class ConfigManager {
  constructor() {
    this.config = this.loadConfig()
  }

  loadConfig() {
    return {
      // 应用信息
      app: {
        title: import.meta.env.VITE_APP_TITLE || 'Vue Blog',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        description: import.meta.env.VITE_APP_DESCRIPTION || '现代化博客平台'
      },

      // API 配置
      api: {
        baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api',
        timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
        retryTimes: 3,
        retryDelay: 1000
      },

      // 监控配置
      monitoring: {
        enabled: import.meta.env.VITE_ENABLE_MONITORING === 'true',
        sentryDsn: import.meta.env.VITE_SENTRY_DSN,
        apmEnabled: import.meta.env.VITE_ENABLE_APM === 'true',
        performanceEnabled: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
        sampleRate: parseFloat(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE) || 0.1
      },

      // 功能开关
      features: {
        pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
        offline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        mockApi: import.meta.env.VITE_MOCK_API === 'true',
        debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
      },

      // 第三方服务
      analytics: {
        googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
        baiduAnalyticsId: import.meta.env.VITE_BAIDU_ANALYTICS_ID
      },

      // 性能配置
      performance: {
        lazyLoadThreshold: 100,
        imageQuality: 0.8,
        cacheTimeout: 5 * 60 * 1000, // 5分钟
        maxCacheSize: 50 * 1024 * 1024 // 50MB
      },

      // 用户体验配置
      ux: {
        animationDuration: 300,
        toastDuration: 3000,
        loadingDelay: 200,
        debounceDelay: 300
      }
    }
  }

  // 获取配置值
  get(path, defaultValue = null) {
    const keys = path.split('.')
    let value = this.config

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return defaultValue
      }
    }

    return value
  }

  // 设置配置值
  set(path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    let target = this.config

    for (const key of keys) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {}
      }
      target = target[key]
    }

    target[lastKey] = value
  }

  // 检查功能是否启用
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false)
  }

  // 获取环境信息
  getEnvironment() {
    return {
      isDevelopment: import.meta.env.DEV,
      isProduction: import.meta.env.PROD,
      mode: import.meta.env.MODE,
      baseUrl: import.meta.env.BASE_URL
    }
  }

  // 验证配置
  validate() {
    const errors = []

    // 验证必需的配置
    if (!this.get('api.baseURL')) {
      errors.push('API base URL is required')
    }

    if (this.get('monitoring.enabled') && !this.get('monitoring.sentryDsn')) {
      errors.push('Sentry DSN is required when monitoring is enabled')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 导出配置
  export() {
    return JSON.stringify(this.config, null, 2)
  }

  // 导入配置
  import(configJson) {
    try {
      const importedConfig = JSON.parse(configJson)
      this.config = { ...this.config, ...importedConfig }
      return true
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }
}

// 创建全局配置实例
export const config = new ConfigManager()

// 导出常用配置
export const API_CONFIG = config.get('api')
export const MONITORING_CONFIG = config.get('monitoring')
export const FEATURES = config.get('features')
export const PERFORMANCE_CONFIG = config.get('performance')

// 环境检查工具
export const isDev = config.getEnvironment().isDevelopment
export const isProd = config.getEnvironment().isProduction

// 调试工具
export const debug = (...args) => {
  if (config.isFeatureEnabled('debugMode')) {
    // 调试输出已优化
  }
}

export const debugWarn = (...args) => {
  if (config.isFeatureEnabled('debugMode')) {
    console.warn('[DEBUG WARN]', ...args)
  }
}

export const debugError = (...args) => {
  if (config.isFeatureEnabled('debugMode')) {
    console.error('[DEBUG ERROR]', ...args)
  }
}