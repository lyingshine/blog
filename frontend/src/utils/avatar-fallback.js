// 头像加载失败处理工具

/**
 * 生成默认头像URL
 * @param {string} username - 用户名
 * @param {string} style - 头像风格 (initials, avataaars, personas, bottts, identicon)
 * @returns {string} 默认头像URL
 */
export function generateDefaultAvatar(username, style = 'initials') {
  const seed = encodeURIComponent(username || 'default');
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

/**
 * 处理头像加载错误
 * @param {Event} event - 图片加载错误事件
 * @param {string} username - 用户名
 * @param {string} fallbackStyle - 备用头像风格
 */
export function handleAvatarError(event, username, fallbackStyle = 'initials') {
  const img = event.target;
  
  // 避免无限循环
  if (img.src.includes('dicebear.com')) {
    return;
  }
  
  // 设置默认头像
  img.src = generateDefaultAvatar(username, fallbackStyle);
  
  // 添加错误标记，便于调试
  img.setAttribute('data-avatar-fallback', 'true');
  
  console.warn(`头像加载失败，已使用默认头像: ${username}`);
}

/**
 * Vue组件中使用的头像处理指令
 */
export const avatarDirective = {
  mounted(el, binding) {
    const { username, fallbackStyle } = binding.value || {};
    
    el.addEventListener('error', (event) => {
      handleAvatarError(event, username, fallbackStyle);
    });
  }
};

/**
 * 检查头像URL是否有效
 * @param {string} avatarUrl - 头像URL
 * @returns {Promise<boolean>} 是否有效
 */
export async function checkAvatarUrl(avatarUrl) {
  if (!avatarUrl) return false;
  
  try {
    const response = await fetch(avatarUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('头像URL检查失败:', avatarUrl, error);
    return false;
  }
}

/**
 * 获取安全的头像URL
 * @param {string} avatarUrl - 原始头像URL
 * @param {string} username - 用户名
 * @param {string} fallbackStyle - 备用风格
 * @returns {string} 安全的头像URL
 */
export function getSafeAvatarUrl(avatarUrl, username, fallbackStyle = 'initials') {
  // 如果没有头像或者是本地路径但可能失效，返回默认头像
  if (!avatarUrl || (avatarUrl.startsWith('/uploads/') && !avatarUrl.startsWith('http'))) {
    return generateDefaultAvatar(username, fallbackStyle);
  }
  
  return avatarUrl;
}