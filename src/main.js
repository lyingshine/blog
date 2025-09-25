import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuth } from './composables/useAuth'

const app = createApp(App)

// 初始化认证状态
const { initAuth } = useAuth()
initAuth()

// 清空所有预置文章，确保从空白状态开始
localStorage.removeItem('blog_articles')
localStorage.setItem('blog_articles', JSON.stringify([]))

app.use(router)
app.mount('#app')