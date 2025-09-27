import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'
import { useArticleStore } from './article.store'
import { useUIStore } from './ui.store'

// 全局应用状态管理器
let appStoreInstance = null

export const useAppStore = () => {
  if (appStoreInstance) {
    return appStoreInstance
  }

  // 获取各个子store
  const authStore = useAuthStore()
  const articleStore = useArticleStore()
  const uiStore = useUIStore()

  // 全局加载状态
  const globalLoading = computed(() => 
    (authStore.loading?.value || false) || 
    (articleStore.loading?.value || false) || 
    (uiStore.loading?.value || false)
  )

  // 全局错误状态
  const globalError = computed(() => 
    authStore.error?.value || 
    articleStore.error?.value || 
    uiStore.error?.value || 
    null
  )

  // 应用初始化状态
  const initialized = ref(false)
  const initError = ref(null)

  // 初始化应用
  const initApp = async () => {
    if (initialized.value) return

    try {
      console.log('🚀 开始初始化应用...')
      
      // 1. 初始化认证状态
      await authStore.initAuth()
      console.log('✅ 认证状态初始化完成')
      
      // 2. 初始化UI状态
      await uiStore.initUI()
      console.log('✅ UI状态初始化完成')
      
      // 3. 如果用户已登录，预加载一些数据
      if (authStore.isAuthenticated?.value) {
        console.log('👤 用户已登录，预加载数据...')
        // 可以在这里预加载用户相关数据
      }

      initialized.value = true
      console.log('✅ 应用初始化完成')
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error)
      initError.value = error.message
      throw error
    }
  }

  // 重置应用状态
  const resetApp = () => {
    authStore.logout()
    articleStore.resetState()
    uiStore.resetState()
    initialized.value = false
    initError.value = null
  }

  // 清除所有错误
  const clearAllErrors = () => {
    authStore.clearError()
    articleStore.clearError()
    uiStore.clearError()
    initError.value = null
  }

  // 获取应用统计信息
  const getAppStats = computed(() => ({
    isAuthenticated: authStore.isAuthenticated?.value || false,
    user: authStore.user?.value || null,
    articlesCount: articleStore.articles?.value?.length || 0,
    isDarkMode: uiStore.isDarkMode?.value || false,
    initialized: initialized.value,
    hasErrors: !!(globalError.value)
  }))

  // 获取应用状态
  const getState = () => ({
    initialized: initialized.value,
    initError: initError.value,
    globalLoading: globalLoading.value,
    globalError: globalError.value,
    stats: getAppStats.value
  })

  appStoreInstance = {
    // 子stores
    auth: authStore,
    article: articleStore,
    ui: uiStore,

    // 全局状态
    globalLoading,
    globalError,
    initialized,
    initError,

    // 方法
    init: initApp,  // 添加 init 别名
    initApp,
    reset: resetApp,  // 添加 reset 别名
    resetApp,
    clearAllErrors,
    getState,

    // 计算属性
    getAppStats
  }

  return appStoreInstance
}

// 导出单例实例获取器
export const getAppStore = () => {
  if (!appStoreInstance) {
    return useAppStore()
  }
  return appStoreInstance
}