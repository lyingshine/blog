import { ref, computed } from 'vue'
import { authAPI } from '../utils/api'

// 全局用户状态
const user = ref(null)
const token = ref(localStorage.getItem('blog_token'))
const loading = ref(false)
const error = ref(null)

// 计算属性
const isAuthenticated = computed(() => !!user.value && !!token.value)

// 初始化认证状态
const initAuth = async () => {
  const savedToken = localStorage.getItem('blog_token')
  const savedUser = localStorage.getItem('blog_user')
  
  if (savedToken && savedUser) {
    try {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      
      // 验证token是否有效
      await authAPI.getCurrentUser()
    } catch (error) {
      console.error('Token验证失败:', error)
      logout()
    }
  }
}

// 登录
const login = async (credentials) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await authAPI.login(credentials)
    
    // 保存认证信息
    token.value = response.token
    user.value = response.user
    
    localStorage.setItem('blog_token', response.token)
    localStorage.setItem('blog_user', JSON.stringify(response.user))
    
    return response
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}

// 注册
const register = async (userData) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await authAPI.register(userData)
    
    // 自动登录
    token.value = response.token
    user.value = response.user
    
    localStorage.setItem('blog_token', response.token)
    localStorage.setItem('blog_user', JSON.stringify(response.user))
    
    return response
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}

// 登出
const logout = () => {
  user.value = null
  token.value = null
  
  localStorage.removeItem('blog_token')
  localStorage.removeItem('blog_user')
  
  // 清理旧的localStorage数据
  localStorage.removeItem('blog_articles')
  localStorage.removeItem('blog_users')
}

// 更新用户信息
const updateProfile = async (profileData) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await authAPI.updateProfile(profileData)
    
    // 更新本地用户信息
    user.value = response.user
    localStorage.setItem('blog_user', JSON.stringify(response.user))
    
    return response
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}

// 修改密码
const changePassword = async (passwordData) => {
  loading.value = true
  error.value = null
  
  try {
    const response = await authAPI.changePassword(passwordData)
    return response
  } catch (err) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}

// 获取当前用户信息
const getCurrentUser = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await authAPI.getCurrentUser()
    user.value = response.user
    localStorage.setItem('blog_user', JSON.stringify(response.user))
    return response.user
  } catch (err) {
    error.value = err.message
    logout() // 如果获取用户信息失败，则登出
    throw err
  } finally {
    loading.value = false
  }
}

// 清除错误
const clearError = () => {
  error.value = null
}

export function useAuthApi() {
  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    getCurrentUser,
    clearError
  }
}