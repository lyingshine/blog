// 缓存清理工具

/**
 * 为URL添加缓存清理参数
 * @param {string} url - 原始URL
 * @returns {string} 带缓存清理参数的URL
 */
export function addCacheBuster(url) {
  if (!url) return url
  
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${Date.now()}`
}

/**
 * 清理浏览器中特定URL的缓存
 * @param {string} url - 要清理缓存的URL
 */
export async function clearUrlCache(url) {
  try {
    // 尝试使用 fetch 重新请求资源
    await fetch(url, { 
      cache: 'reload',
      mode: 'no-cors'
    })
    console.log('缓存已清理:', url)
  } catch (error) {
    console.warn('清理缓存失败:', url, error)
  }
}

/**
 * 强制刷新所有头像图片
 */
export function refreshAllAvatars() {
  const avatarImages = document.querySelectorAll('img[src*="avatar"], img[src*="/uploads/"]')
  
  avatarImages.forEach(img => {
    const originalSrc = img.src
    // 移除现有的缓存清理参数
    const cleanSrc = originalSrc.split('?')[0].split('&')[0]
    // 添加新的时间戳
    img.src = addCacheBuster(cleanSrc)
    console.log('刷新头像:', cleanSrc, '->', img.src)
  })
  
  console.log(`已刷新 ${avatarImages.length} 个头像图片`)
}