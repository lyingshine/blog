import { ref, computed } from 'vue'
import { THEMES, STORAGE_KEYS, EVENTS } from '../constants'

// UI状态
const theme = ref(THEMES.LIGHT)
const sidebarOpen = ref(false)
const mobileMenuOpen = ref(false)
const loading = ref(false)
const notifications = ref([])

// 计算属性
const isDark = computed(() => theme.value === THEMES.DARK)
const isLight = computed(() => theme.value === THEMES.LIGHT)
const isAuto = computed(() => theme.value === THEMES.AUTO)

// 事件发射器
const emit = (eventName, data) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: data }))
}

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
  if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
    theme.value = savedTheme
  } else {
    // 检测系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? THEMES.DARK : THEMES.LIGHT
  }
  
  applyTheme()
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (theme.value === THEMES.AUTO) {
      applyTheme()
    }
  })
}

// 应用主题
const applyTheme = () => {
  const root = document.documentElement
  
  if (theme.value === THEMES.AUTO) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.className = prefersDark ? 'dark' : 'light'
  } else {
    root.className = theme.value
  }
  
  emit(EVENTS.THEME_CHANGED, theme.value)
}

// 切换主题
const toggleTheme = () => {
  theme.value = theme.value === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
  localStorage.setItem(STORAGE_KEYS.THEME, theme.value)
  applyTheme()
}

// 设置主题
const setTheme = (newTheme) => {
  if (Object.values(THEMES).includes(newTheme)) {
    theme.value = newTheme
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme)
    applyTheme()
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// 打开侧边栏
const openSidebar = () => {
  sidebarOpen.value = true
}

// 关闭侧边栏
const closeSidebar = () => {
  sidebarOpen.value = false
}

// 切换移动端菜单
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// 打开移动端菜单
const openMobileMenu = () => {
  mobileMenuOpen.value = true
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// 设置加载状态
const setLoading = (isLoading) => {
  loading.value = isLoading
}

// 添加通知
const addNotification = (notification) => {
  const id = Date.now() + Math.random()
  const newNotification = {
    id,
    type: 'info',
    duration: 3000,
    ...notification
  }
  
  notifications.value.push(newNotification)
  
  // 自动移除通知
  if (newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }
  
  return id
}

// 移除通知
const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 清除所有通知
const clearNotifications = () => {
  notifications.value = []
}

// 显示成功消息
const showSuccess = (message, options = {}) => {
  return addNotification({
    type: 'success',
    message,
    ...options
  })
}

// 显示错误消息
const showError = (message, options = {}) => {
  return addNotification({
    type: 'error',
    message,
    duration: 5000,
    ...options
  })
}

// 显示警告消息
const showWarning = (message, options = {}) => {
  return addNotification({
    type: 'warning',
    message,
    ...options
  })
}

// 显示信息消息
const showInfo = (message, options = {}) => {
  return addNotification({
    type: 'info',
    message,
    ...options
  })
}

// 关闭所有菜单
const closeAllMenus = () => {
  sidebarOpen.value = false
  mobileMenuOpen.value = false
}

// 初始化UI
const initUI = async () => {
  initTheme()
  // 可以在这里添加其他UI初始化逻辑
}

// 重置UI状态
const resetState = () => {
  theme.value = THEMES.LIGHT
  sidebarOpen.value = false
  mobileMenuOpen.value = false
  loading.value = false
  notifications.value = []
}

// 清除错误（UI store 没有错误状态，但为了接口一致性）
const clearError = () => {
  // UI store 没有错误状态，空实现
}

// 导出UI store
export const useUIStore = () => {
  return {
    // 状态
    theme,
    sidebarOpen,
    mobileMenuOpen,
    loading,
    notifications,
    
    // 计算属性
    isDark,
    isLight,
    isAuto,
    isDarkMode: isDark, // 别名，兼容旧代码
    
    // 方法
    initUI,
    initTheme,
    toggleTheme,
    setTheme,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleMobileMenu,
    openMobileMenu,
    closeMobileMenu,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAllMenus,
    resetState,
    clearError
  }
}