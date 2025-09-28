/**
 * 控制台输出优化工具
 * 批量替换项目中的console.log为logger调用
 */

import logger from './logger'

// 在生产环境下禁用所有console输出
if (import.meta.env.PROD) {
  const noop = () => {}
  
  // 保留error和warn，但使用我们的logger
  console.log = noop
  console.info = noop
  console.debug = noop
  
  // 重定向error和warn到我们的logger
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = (...args) => {
    // 防止无限递归 - 直接使用原始console.error
    originalError(...args)
  }
  
  console.warn = (...args) => {
    // 防止无限递归 - 直接使用原始console.warn
    originalWarn(...args)
  }
}

// 开发环境下的控制台美化
if (import.meta.env.DEV) {
  // 添加项目标识
  console.log(
    '%c🚀 Blog System %c开发模式已启用',
    'background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    'color: #666; font-weight: normal;'
  )
  
  // 提供调试工具提示
  console.log(
    '%c💡 调试提示',
    'color: #f39c12; font-weight: bold;',
    '\n• 输入 enableDebug() 启用详细日志',
    '\n• 输入 disableDebug() 禁用详细日志',
    '\n• 输入 blogLogger 访问日志工具'
  )
}

export default logger