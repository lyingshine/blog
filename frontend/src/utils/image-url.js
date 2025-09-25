// 图片URL处理工具函数

/**
 * 获取完整的图片URL
 * @param {string} imagePath - 图片路径
 * @returns {string} 完整的图片URL
 */
export function getImageUrl(imagePath, forceRefresh = false) {
  if (!imagePath) {
    return '/default-avatar.png';
  }

  // 如果已经是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (forceRefresh) {
      const separator = imagePath.includes('?') ? '&' : '?';
      return `${imagePath}${separator}t=${Date.now()}`;
    }
    return imagePath;
  }

  // 如果是相对路径（以/uploads/开头）
  if (imagePath.startsWith('/uploads/')) {
    let finalUrl = imagePath;
    
    // 在开发环境下，直接返回相对路径（通过Vite代理）
    // 在生产环境下，也使用相对路径，让浏览器自动使用当前域名
    // 这样无论部署在哪个域名下都能正常工作
    
    // 如果需要强制刷新，添加时间戳
    if (forceRefresh) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}t=${Date.now()}`;
    }
    
    return finalUrl;
  }

  // 其他情况直接返回
  return imagePath;
}

/**
 * 获取头像URL
 * @param {string} avatarPath - 头像路径
 * @param {string} username - 用户名（用于生成默认头像）
 * @returns {string} 完整的头像URL
 */
export function getAvatarUrl(avatarPath, username = 'User', forceRefresh = false) {
  if (!avatarPath) {
    return generateDefaultAvatar(username);
  }
  
  return getImageUrl(avatarPath, forceRefresh);
}

/**
 * 生成默认头像
 * @param {string} username - 用户名
 * @param {string} style - 头像风格
 * @returns {string} 默认头像URL
 */
export function generateDefaultAvatar(username = 'User', style = 'initials') {
  const seed = encodeURIComponent(username);
  
  switch (style) {
    case 'avataaars':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    case 'personas':
      return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`;
    case 'bottts':
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    case 'identicon':
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
    case 'initials':
    default:
      return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
  }
}

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件
 * @param {string} username - 用户名
 * @param {string} fallbackStyle - 备用头像风格
 */
export function handleImageError(event, username = 'User', fallbackStyle = 'initials') {
  const img = event.target;
  
  // 如果已经是默认头像还出错，就不再处理了
  if (img.src.includes('dicebear.com')) {
    console.warn('默认头像也加载失败');
    return;
  }
  
  // 使用默认头像
  img.src = generateDefaultAvatar(username, fallbackStyle);
  console.warn(`图片加载失败，已使用默认头像: ${img.src}`);
}

export default {
  getImageUrl,
  getAvatarUrl,
  generateDefaultAvatar,
  handleImageError
};