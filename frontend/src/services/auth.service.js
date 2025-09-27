import BaseService from './base'
import { User } from '../types'
import { STORAGE_KEYS } from '../constants'
import { EnhancedBaseService } from './enhanced-base.service'
import { cached, cache } from '../utils/cache'
import { handleErrors } from '../utils/error-handler'

class AuthService extends EnhancedBaseService {
  constructor() {
    super('AuthService', {
      enableCache: false, // 认证信息不缓存
      enableRetry: true,
      maxRetries: 2
    })
  }

  // 初始化认证服务
  async onInit() {
    console.log('🔐 初始化认证服务...')
    
    // 检查本地认证状态
    const localAuth = this.checkLocalAuth()
    if (localAuth.success) {
      console.log('✅ 发现本地认证信息')
      
      // 验证token有效性
      try {
        await this.getCurrentUser()
        console.log('✅ 本地认证有效')
      } catch (error) {
        console.warn('⚠️ 本地认证已过期，清除认证信息')
        this.logout()
      }
    }
  }

  // 健康检查
  async onHealthCheck() {
    const isAuth = this.isAuthenticated()
    const user = this.getStoredUser()
    
    return {
      authenticated: isAuth,
      user: user ? { id: user.id, username: user.username } : null,
      tokenExists: !!this.getStoredToken()
    }
  }

  // 用户注册
  async register(userData) {
    try {
      const response = await this.post('/auth/register', userData)
      if (response.isSuccess) {
        const user = new User(response.data.user)
        const token = response.data.token
        
        // 存储认证信息
        this.storeAuthData(user, token)
        
        return {
          success: true,
          user,
          token,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '注册失败，请稍后重试'
      }
    }
  }

  // 用户登录
  async login(credentials) {
    try {
      const response = await this.post('/auth/login', credentials)
      if (response.isSuccess) {
        const user = new User(response.data.user)
        const token = response.data.token
        
        // 存储认证信息
        this.storeAuthData(user, token)
        
        return {
          success: true,
          user,
          token,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '登录失败，请检查用户名和密码'
      }
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      const response = await this.get('/auth/me')
      if (response.isSuccess) {
        const user = new User(response.data.user)
        
        // 更新本地存储的用户信息
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
        
        return {
          success: true,
          user,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '获取用户信息失败'
      }
    }
  }

  // 更新用户资料
  async updateProfile(profileData) {
    try {
      const response = await this.put('/auth/profile', profileData)
      if (response.isSuccess) {
        const user = new User(response.data.user)
        
        // 更新本地存储的用户信息
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
        
        return {
          success: true,
          user,
          message: response.message || '资料更新成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '更新失败，请稍后重试'
      }
    }
  }

  // 修改密码
  async changePassword(passwordData) {
    try {
      const response = await this.put('/auth/password', passwordData)
      if (response.isSuccess) {
        return {
          success: true,
          message: response.message || '密码修改成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '密码修改失败'
      }
    }
  }

  // 登出
  logout() {
    // 清除本地存储的认证信息
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    
    return {
      success: true,
      message: '已成功登出'
    }
  }

  // 检查本地认证状态
  checkLocalAuth() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const userData = localStorage.getItem(STORAGE_KEYS.USER)
    
    if (token && userData) {
      try {
        const user = new User(JSON.parse(userData))
        return {
          success: true,
          user,
          token
        }
      } catch (error) {
        console.error('解析用户数据失败:', error)
        this.logout()
      }
    }
    
    return {
      success: false,
      user: null,
      token: null
    }
  }

  // 存储认证数据
  storeAuthData(user, token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  // 获取存储的用户信息
  getStoredUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER)
    if (userData) {
      try {
        return new User(JSON.parse(userData))
      } catch (error) {
        console.error('解析用户数据失败:', error)
        return null
      }
    }
    return null
  }

  // 获取存储的token
  getStoredToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  }

  // 检查是否已认证
  isAuthenticated() {
    return !!this.getStoredToken()
  }
}

// 导出单例实例
export const authService = new AuthService()
export default AuthService