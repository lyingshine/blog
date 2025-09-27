// 核心模块统一导出
export { componentManager, useComponentManager } from './component-manager'
export { default as ComponentManager } from './component-manager'

// 应用核心初始化
import { componentManager } from './component-manager'
import { appService } from '../services/app.service'
import { getAppStore } from '../stores/app.store'

export async function initializeApp() {
  console.log('🚀 开始初始化应用核心...')
  
  try {
    // 1. 初始化服务层
    await appService.init()
    
    // 2. 初始化全局状态管理
    const appStore = getAppStore()
    await appStore.init()
    
    // 3. 初始化组件管理器
    await componentManager.init()
    
    console.log('✅ 应用核心初始化完成')
    
    return {
      success: true,
      services: appService.getServicesStatus(),
      components: componentManager.getStats(),
      stores: appStore.getState()
    }
    
  } catch (error) {
    console.error('❌ 应用核心初始化失败:', error)
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

// 应用健康检查
export async function healthCheck() {
  console.log('🔍 执行应用健康检查...')
  
  try {
    const results = {
      timestamp: new Date().toISOString(),
      services: await appService.healthCheck(),
      components: componentManager.getStats(),
      stores: getAppStore().getState()
    }
    
    const allHealthy = Object.values(results.services).every(
      service => service.status === 'ok'
    )
    
    results.overall = allHealthy ? 'healthy' : 'unhealthy'
    
    console.log(`${allHealthy ? '✅' : '❌'} 应用健康检查完成:`, results.overall)
    
    return results
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error)
    
    return {
      timestamp: new Date().toISOString(),
      overall: 'error',
      error: error.message
    }
  }
}

// 应用重置
export async function resetApp() {
  console.log('🔄 重置应用...')
  
  try {
    // 重置组件管理器
    componentManager.reset()
    
    // 重置服务层
    await appService.reset()
    
    // 重置状态管理
    getAppStore().reset()
    
    console.log('✅ 应用重置完成')
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ 应用重置失败:', error)
    
    return {
      success: false,
      error: error.message
    }
  }
}