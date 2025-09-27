import { ref, computed } from 'vue'
import { EVENTS } from '../constants'
import logger from '../utils/logger'

// 全局认证状态
const user = ref(null)
const isAuthenticated = ref(false)
const loading = ref(false)
const initialized = ref(false)
const error = ref(null)

// 计算属性
const isAdmin = computed(() => user.value?.isAdmin || false)
const isAuthor = computed(() => user.value?.isAuthor || false)
const displayName = computed(() => user.value?.displayName || '')

// 事件发射器
const emit = (eventName, data) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: data }))
}

// 获取 authService 实例
const getAuthService = async () => {
  const { authService } = await import('../services')
  return authService
}

// 初始化认证状态
const initAuth = async () => {
  if (initialized.value) return
  
  try {
    loading.value = true
    error.value = null
    
    logger.debug('开始初始化认证状态...')
    
    const authService = await getAuthService()
    
    // 首先检查本地存储
    const localAuth = authService.checkLocalAuth()
    logger.debug('本地认证检查结果', localAuth.success ? '有效' : '无效')
    
    if (localAuth.success) {
      user.value = localAuth.user
      isAuthenticated.value = true
      logger.debug('设置认证状态为已登录', localAuth.user.username)
      
      // 尝试刷新用户信息
      try {
        const result = await authService.getCurrentUser()
        if (result.success) {
          user.value = result.user
          emit(EVENTS.USER_UPDATE, result.user)
          logger.debug('用户信息刷新成功')
        }
      } catch (refreshError) {
        logger.warn('刷新用户信息失败', refreshError.message)
        // 如果刷新失败，清除认证状态
        user.value = null
        isAuthenticated.value = false
        authService.logout()
        logger.debug('已清除无效的认证状态')
      }
    } else {
      logger.debug('未发现有效的本地认证信息')
      user.value = null
      isAuthenticated.value = false
    }
  } catch (err) {
    logger.error('初始化认证状态失败', err.message)
    error.value = err.message
    user.value = null
    isAuthenticated.value = false
  } finally {
    loading.value = false
    initialized.value = true
    logger.debug('认证状态初始化完成', {
      isAuthenticated: isAuthenticated.value,
      user: user.value?.username || 'null'
    })
  }
}

// 登录
const login = async (credentials) => {
  try {
    loading.value = true
    error.value = null
    
    const authService = await getAuthService()
    const result = await authService.login(credentials)
    
    if (result.success) {
      user.value = result.user
      isAuthenticated.value = true
      emit(EVENTS.USER_LOGIN, result.user)
      
      return {
        success: true,
        user: result.user,
        message: result.message
      }
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '登录失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 注册
const register = async (userData) => {
  try {
    loading.value = true
    error.value = null
    
    const authService = await getAuthService()
    const result = await authService.register(userData)
    
    if (result.success) {
      user.value = result.user
      isAuthenticated.value = true
      emit(EVENTS.USER_REGISTER, result.user)
      
      return {
        success: true,
        user: result.user,
        message: result.message
      }
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '注册失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 登出
const logout = async () => {
  try {
    loading.value = true
    
    const authService = await getAuthService()
    await authService.logout()
    
    user.value = null
    isAuthenticated.value = false
    error.value = null
    
    emit(EVENTS.USER_LOGOUT)
    
    return {
      success: true,
      message: '已成功登出'
    }
  } catch (err) {
    logger.warn('登出失败', err.message)
    // 即使服务器登出失败，也要清除本地状态
    user.value = null
    isAuthenticated.value = false
    emit(EVENTS.USER_LOGOUT)
    
    return {
      success: true,
      message: '已成功登出'
    }
  } finally {
    loading.value = false
  }
}

// 更新用户信息
const updateUser = async (userData) => {
  try {
    loading.value = true
    error.value = null
    
    const authService = await getAuthService()
    const result = await authService.updateProfile(userData)
    
    if (result.success) {
      user.value = result.user
      emit(EVENTS.USER_UPDATE, result.user)
      
      return {
        success: true,
        user: result.user,
        message: result.message
      }
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '更新用户信息失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 刷新用户信息
const refreshUser = async () => {
  try {
    const authService = await getAuthService()
    const result = await authService.getCurrentUser()
    
    if (result.success) {
      user.value = result.user
      emit(EVENTS.USER_UPDATE, result.user)
      return result
    }
    
    return result
  } catch (err) {
    logger.warn('刷新用户信息失败', err.message)
    return {
      success: false,
      message: err.message || '刷新用户信息失败'
    }
  }
}

// 修改密码
const changePassword = async (passwordData) => {
  try {
    loading.value = true
    error.value = null
    
    const authService = await getAuthService()
    const result = await authService.changePassword(passwordData)
    
    if (result.success) {
      emit(EVENTS.PASSWORD_CHANGED)
      return {
        success: true,
        message: result.message
      }
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '修改密码失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 更新头像
const updateAvatar = async (avatarData) => {
  try {
    loading.value = true
    error.value = null
    
    const authService = await getAuthService()
    const result = await authService.updateAvatar(avatarData)
    
    if (result.success) {
      if (user.value) {
        user.value.avatar = result.avatar
      }
      emit(EVENTS.AVATAR_UPDATED, result.avatar)
      
      return {
        success: true,
        avatar: result.avatar,
        message: result.message
      }
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '更新头像失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 清除错误
const clearError = () => {
  error.value = null
}

// 导出认证store
export const useAuthStore = () => {
  return {
    // 状态
    user,
    isAuthenticated,
    loading,
    initialized,
    error,
    
    // 计算属性
    isAdmin,
    isAuthor,
    displayName,
    
    // 方法
    initAuth,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    changePassword,
    updateAvatar,
    clearError
  }
}