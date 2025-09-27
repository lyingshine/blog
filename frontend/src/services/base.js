import axios from 'axios'
import { API_CONFIG, STORAGE_KEYS, ERROR_CODES } from '../constants'


// 创建axios实例
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    },
    // 开发环境允许跨域
    withCredentials: false
  })

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Success'
      }
    },
    (error) => {
      console.error('API请求错误:', error)
      
      let errorCode = ERROR_CODES.SERVER_ERROR
      let errorMessage = '请求失败'

      if (!error.response) {
        errorCode = ERROR_CODES.NETWORK_ERROR
        errorMessage = '网络连接失败，请检查网络设置'
      } else {
        const { status, data } = error.response
        
        switch (status) {
          case 401:
            errorCode = ERROR_CODES.UNAUTHORIZED
            errorMessage = '登录已过期，请重新登录'
            // 清除认证信息
            localStorage.removeItem(STORAGE_KEYS.TOKEN)
            localStorage.removeItem(STORAGE_KEYS.USER)
            // 重定向到登录页面
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            break
          case 403:
            errorCode = ERROR_CODES.FORBIDDEN
            errorMessage = '没有权限执行此操作'
            break
          case 404:
            errorCode = ERROR_CODES.NOT_FOUND
            errorMessage = '请求的资源不存在'
            break
          case 422:
            errorCode = ERROR_CODES.VALIDATION_ERROR
            errorMessage = data?.message || '数据验证失败'
            break
          default:
            errorMessage = data?.error || data?.message || '服务器错误'
        }
      }

      return Promise.reject({
        success: false,
        error: errorMessage,
        code: errorCode
      })
    }
  )

  return client
}

// 基础服务类
export class BaseService {
  constructor() {
    this.client = createApiClient()
  }

  // 通用GET请求
  async get(url, params = {}) {
    try {
      const response = await this.client.get(url, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  // 通用POST请求
  async post(url, data = {}) {
    try {
      const response = await this.client.post(url, data)
      return response
    } catch (error) {
      throw error
    }
  }

  // 通用PUT请求
  async put(url, data = {}) {
    try {
      const response = await this.client.put(url, data)
      return response
    } catch (error) {
      throw error
    }
  }

  // 通用DELETE请求
  async delete(url) {
    try {
      const response = await this.client.delete(url)
      return response
    } catch (error) {
      throw error
    }
  }

  // 文件上传请求
  async upload(url, file, onProgress) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      })
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 健康检查
  async healthCheck() {
    try {
      const response = await this.get('/health')
      return response
    } catch (error) {
      throw error
    }
  }
}

// 导出单例实例
export const apiClient = createApiClient()
export default BaseService