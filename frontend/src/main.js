import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

// 导入核心模块
import { initializeApp, healthCheck } from './core'
import { monitorAvatarLoading } from './utils/avatar-debug'
import { testAvatarUrls } from './utils/url-test'

console.log('🚀 开始启动应用...')

const app = createApp(App)

// 使用路由
app.use(router)

// 应用初始化
const startApp = async () => {
  try {
    // 初始化应用核心
    const initResult = await initializeApp()
    
    if (!initResult.success) {
      throw new Error(`应用核心初始化失败: ${initResult.error}`)
    }
    
    console.log('📊 初始化结果:', initResult)
    
    // 执行健康检查
    const healthResult = await healthCheck()
    console.log('🔍 健康检查结果:', healthResult)
    
    // 清空所有预置文章，确保从空白状态开始
    localStorage.removeItem('blog_articles')
    localStorage.setItem('blog_articles', JSON.stringify([]))
    
    // 挂载应用
    app.mount('#app')
    console.log('✅ 应用启动完成')
    
    // 开发环境下的调试工具
    if (import.meta.env.DEV) {
      // 启用头像调试监控
      monitorAvatarLoading()
      
      // 暴露调试工具到全局
      window.__APP_DEBUG__ = {
        healthCheck,
        initResult,
        healthResult,
        testAvatarUrls
      }
      console.log('🛠️ 调试工具已挂载到 window.__APP_DEBUG__')
    }
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error)
    
    // 显示错误页面或降级处理
    const appElement = document.getElementById('app')
    if (appElement) {
      appElement.innerHTML = `
        <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto;">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">🚨 应用启动失败</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #666; margin: 0;">${error.message}</p>
            </div>
            <button 
              onclick="location.reload()" 
              style="
                background: #3498db; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 16px;
              "
            >
              🔄 重新加载
            </button>
          </div>
        </div>
      `
    }
  }
}

// 启动应用
startApp()