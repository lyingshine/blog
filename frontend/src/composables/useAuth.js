import { ref } from 'vue'
import { authAPI } from '../utils/api'

// 全局用户状态
const user = ref(null)
const isAuthenticated = ref(false)
const loading = ref(false)
const initialized = ref(false)

// 初始化用户状态
const initAuth = async () => {
  if (initialized.value) return
  
  const token = localStorage.getItem('blog_token')
  if (token) {
    try {
      loading.value = true
      const response = await authAPI.getCurrentUser()
      user.value = response.user
      isAuthenticated.value = true
    } catch (error) {
      console.error('获取用户信息失败:', error)
      localStorage.removeItem('blog_token')
      localStorage.removeItem('blog_user')
      isAuthenticated.value = false
      user.value = null
    } finally {
      loading.value = false
    }
  }
  initialized.value = true
}

// 检查本地存储中的认证状态
const checkLocalAuth = () => {
  const token = localStorage.getItem('blog_token')
  const userData = localStorage.getItem('blog_user')
  
  if (token && userData) {
    try {
      user.value = JSON.parse(userData)
      isAuthenticated.value = true
      return true
    } catch (error) {
      console.error('解析用户数据失败:', error)
      localStorage.removeItem('blog_token')
      localStorage.removeItem('blog_user')
    }
  }
  return false
}

// 登录
const login = async (credentials) => {
  try {
    loading.value = true
    console.log('发送登录请求:', credentials)
    const response = await authAPI.login(credentials)
    console.log('登录响应:', response)
    
    const { user: userInfo, token } = response
    
    user.value = userInfo
    isAuthenticated.value = true
    localStorage.setItem('blog_token', token)
    localStorage.setItem('blog_user', JSON.stringify(userInfo))
    
    return { success: true, user: userInfo }
  } catch (error) {
    console.error('登录失败:', error)
    return { 
      success: false, 
      message: error.message || '登录失败，请检查用户名和密码' 
    }
  } finally {
    loading.value = false
  }
}

// 注册
const register = async (userData) => {
  try {
    loading.value = true
    console.log('发送注册请求:', userData)
    const response = await authAPI.register(userData)
    console.log('注册响应:', response)
    
    const { user: userInfo, token } = response
    
    user.value = userInfo
    isAuthenticated.value = true
    localStorage.setItem('blog_token', token)
    localStorage.setItem('blog_user', JSON.stringify(userInfo))
    
    return { success: true, user: userInfo }
  } catch (error) {
    console.error('注册失败:', error)
    return { 
      success: false, 
      message: error.message || '注册失败，请稍后重试' 
    }
  } finally {
    loading.value = false
  }
}

// 登出
const logout = () => {
  user.value = null
  isAuthenticated.value = false
  localStorage.removeItem('blog_token')
  localStorage.removeItem('blog_user')
}

// 更新用户信息
const updateUser = async (userInfo) => {
  try {
    loading.value = true
    const response = await authAPI.updateProfile(userInfo)
    user.value = response.user
    localStorage.setItem('blog_user', JSON.stringify(user.value))
    return { success: true, user: user.value }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return { 
      success: false, 
      message: error.message || '更新失败，请稍后重试' 
    }
  } finally {
    loading.value = false
  }
}

// 刷新用户信息
const refreshUser = async () => {
  const token = localStorage.getItem('blog_token')
  if (!token) return false
  
  try {
    const response = await authAPI.getCurrentUser()
    user.value = response.user
    localStorage.setItem('blog_user', JSON.stringify(user.value))
    return true
  } catch (error) {
    console.error('刷新用户信息失败:', error)
    return false
  }
}

// 更新用户头像（专门用于头像更新）
const updateAvatar = (newAvatar) => {
  if (user.value) {
    user.value.avatar = newAvatar
    localStorage.setItem('blog_user', JSON.stringify(user.value))
  }
}

export function useAuth() {
  return {
    user,
    isAuthenticated,
    loading,
    initialized,
    initAuth,
    checkLocalAuth,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    updateAvatar
  }
}