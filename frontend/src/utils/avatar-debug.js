// 头像调试工具

/**
 * 检查头像URL是否可访问
 * @param {string} avatarUrl - 头像URL
 * @returns {Promise<boolean>} 是否可访问
 */
export async function checkAvatarUrl(avatarUrl) {
  try {
    const response = await fetch(avatarUrl, { method: 'HEAD' })
    console.log(`头像URL检查: ${avatarUrl} - 状态: ${response.status}`)
    return response.ok
  } catch (error) {
    console.error(`头像URL检查失败: ${avatarUrl}`, error)
    return false
  }
}

/**
 * 调试头像加载问题
 * @param {string} avatarPath - 头像路径
 * @param {string} username - 用户名
 */
export async function debugAvatar(avatarPath, username) {
  console.group(`🔍 头像调试: ${username}`)
  
  console.log('原始头像路径:', avatarPath)
  
  // 检查不同的URL构建方式
  const urls = [
    avatarPath,
    `/uploads/avatars/${avatarPath.split('/').pop()}`,
    `http://localhost:3000${avatarPath}`,
    `http://localhost:5173${avatarPath}`
  ]
  
  for (const url of urls) {
    const isAccessible = await checkAvatarUrl(url)
    console.log(`${isAccessible ? '✅' : '❌'} ${url}`)
  }
  
  console.groupEnd()
}

/**
 * 监控头像加载事件
 */
export function monitorAvatarLoading() {
  // 监控所有图片加载事件
  document.addEventListener('error', (event) => {
    if (event.target.tagName === 'IMG' && event.target.src.includes('avatar')) {
      console.error('头像加载失败:', event.target.src)
      debugAvatar(event.target.src, event.target.alt || 'Unknown')
    }
  }, true)
  
  console.log('🔍 头像加载监控已启动')
}