// 核心模块统一导出
export { componentManager, useComponentManager } from './component-manager'
export { default as ComponentManager } from './component-manager'

// 应用核心初始化
import { componentManager } from './component-manager'
import { appService } from '../services/app.service'
import { getAppStore } from '../stores/app.store'
import { healthCheckService } from '../services/health-check.service'

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
    // 使用新的健康检查服务
    const healthResults = await healthCheckService.runAllChecks()
    
    const results = {
      timestamp: new Date().toISOString(),
      services: await appService.healthCheck(),
      components: componentManager.getStats(),
      stores: getAppStore().getState(),
      health: healthResults
    }
    
    // 综合评估健康状态
    const servicesHealthy = Object.values(results.services).every(
      service => service.status === 'ok'
    )
    
    const systemHealthy = healthResults.overall === 'healthy'
    
    results.overall = servicesHealthy && systemHealthy ? 'healthy' : 
                     healthResults.overall === 'critical' ? 'critical' : 'degraded'
    
    console.log(`${results.overall === 'healthy' ? '✅' : results.overall === 'critical' ? '🚨' : '⚠️'} 应用健康检查完成:`, results.overall)
    
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