import { ref, reactive } from 'vue'

// 全局用户状态
const user = ref(null)
const isAuthenticated = ref(false)

// 初始化用户状态
const initAuth = () => {
  const savedUser = localStorage.getItem('blog_user')
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
    } catch (error) {
      console.error('解析用户信息失败:', error)
      localStorage.removeItem('blog_user')
    }
  }
}

// 登录
const login = (userInfo) => {
  user.value = userInfo
  isAuthenticated.value = true
  localStorage.setItem('blog_user', JSON.stringify(userInfo))
}

// 登出
const logout = () => {
  user.value = null
  isAuthenticated.value = false
  localStorage.removeItem('blog_user')
}

// 更新用户信息
const updateUser = (userInfo) => {
  user.value = { ...user.value, ...userInfo }
  localStorage.setItem('blog_user', JSON.stringify(user.value))
}

export function useAuth() {
  return {
    user,
    isAuthenticated,
    initAuth,
    login,
    logout,
    updateUser
  }
}