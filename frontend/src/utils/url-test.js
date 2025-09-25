// URL测试工具 - 用于验证头像URL生成

import { getImageUrl, getAvatarUrl } from './image-url.js'

/**
 * 测试头像URL生成
 */
export function testAvatarUrls() {
  console.group('🧪 头像URL测试')
  
  const testPaths = [
    '/uploads/avatars/5_1758792537155.jpg',
    '/uploads/avatars/user_123.png',
    'https://api.dicebear.com/7.x/initials/svg?seed=test'
  ]
  
  testPaths.forEach(path => {
    console.log(`原始路径: ${path}`)
    console.log(`普通URL: ${getImageUrl(path)}`)
    console.log(`强制刷新: ${getImageUrl(path, true)}`)
    console.log(`头像URL: ${getAvatarUrl(path, 'TestUser')}`)
    console.log('---')
  })
  
  console.log(`当前环境: ${import.meta.env.MODE}`)
  console.log(`开发模式: ${import.meta.env.DEV}`)
  console.log(`API基础URL: ${import.meta.env.VITE_API_BASE_URL}`)
  console.log(`当前域名: ${window.location.origin}`)
  
  console.groupEnd()
}

// 在控制台中暴露测试函数
if (typeof window !== 'undefined') {
  window.testAvatarUrls = testAvatarUrls
}