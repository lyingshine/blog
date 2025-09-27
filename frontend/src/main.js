import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './utils/console-optimizer' // 优化控制台输出
import logger from './utils/logger'
import './style.css'

// 简化的应用启动
const startApp = async () => {
  try {
    logger.debug('开始启动应用...')
    
    const app = createApp(App)
    
    // 配置全局错误处理
    app.config.errorHandler = (error, instance, info) => {
      logger.error('Vue应用错误', { error: error.message, info })
    }
    
    // 使用路由
    app.use(router)
    logger.debug('路由系统已加载')
    
    // 确保认证状态初始化
    const { useAuthStore } = await import('./stores/auth.store')
    const authStore = useAuthStore()
    if (!authStore.initialized.value) {
      logger.debug('初始化认证状态...')
      await authStore.initAuth()
    }
    
    // 清空预置文章数据
    localStorage.removeItem('blog_articles')
    localStorage.setItem('blog_articles', JSON.stringify([]))
    logger.debug('本地存储已初始化')
    
    // 挂载应用
    app.mount('#app')
    
    logger.success('应用启动成功')
    
  } catch (error) {
    logger.error('应用启动失败', error.message)
    
    // 显示简化的错误页面
    const appElement = document.getElementById('app')
    if (appElement) {
      appElement.innerHTML = `
        <div style="
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8f9fa;
        ">
          <div style="text-align: center; max-width: 400px; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">😵</div>
            <h2 style="color: #dc3545; margin-bottom: 1rem; font-weight: 600;">启动失败</h2>
            <p style="color: #6c757d; margin-bottom: 2rem; line-height: 1.5;">${error.message}</p>
            <button 
              onclick="location.reload()" 
              style="
                background: #007bff; 
                color: white; 
                border: none; 
                padding: 0.75rem 1.5rem; 
                border-radius: 0.5rem; 
                cursor: pointer;
                font-size: 1rem;
                font-weight: 500;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.background='#0056b3'"
              onmouseout="this.style.background='#007bff'"
            >
              重新加载
            </button>
          </div>
        </div>
      `
    }
  }
}

// 启动应用
startApp()