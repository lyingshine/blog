import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuth } from './composables/useAuth'
import { useDarkMode } from './composables/useDarkMode'
import { monitorAvatarLoading } from './utils/avatar-debug'
import { testAvatarUrls } from './utils/url-test'

const app = createApp(App)

// 初始化认证状态
const { initAuth } = useAuth()
initAuth()

// 初始化暗黑模式
const { initDarkMode } = useDarkMode()
initDarkMode()

// 启用头像调试监控（仅在开发环境）
if (import.meta.env.DEV) {
  monitorAvatarLoading()
  // 暴露测试函数到全局
  window.testAvatarUrls = testAvatarUrls
}

// 清空所有预置文章，确保从空白状态开始
localStorage.removeItem('blog_articles')
localStorage.setItem('blog_articles', JSON.stringify([]))

app.use(router)
app.mount('#app')