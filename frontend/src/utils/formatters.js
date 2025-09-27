import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 格式化日期
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

// 格式化相对时间
export const formatRelativeTime = (date) => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

// 格式化详细时间
export const formatDateTime = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化友好时间
export const formatFriendlyTime = (date) => {
  if (!date) return ''
  
  const now = dayjs()
  const target = dayjs(date)
  const diffInHours = now.diff(target, 'hour')
  
  if (diffInHours < 1) {
    return '刚刚'
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}天前`
  } else {
    return target.format('MM-DD')
  }
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化数字
export const formatNumber = (num) => {
  if (!num || num === 0) return '0'
  
  if (num < 1000) {
    return num.toString()
  } else if (num < 10000) {
    return (num / 1000).toFixed(1) + 'K'
  } else if (num < 100000000) {
    return (num / 10000).toFixed(1) + '万'
  } else {
    return (num / 100000000).toFixed(1) + '亿'
  }
}

// 格式化货币
export const formatCurrency = (amount, currency = '¥') => {
  if (!amount && amount !== 0) return ''
  
  return currency + parseFloat(amount).toFixed(2)
}

// 格式化百分比
export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return ''
  
  return (value * 100).toFixed(decimals) + '%'
}

// 截断文本
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return ''
  
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength) + suffix
}

// 格式化标签
export const formatTags = (tags) => {
  if (!tags) return []
  
  if (typeof tags === 'string') {
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
  }
  
  if (Array.isArray(tags)) {
    return tags.map(tag => tag.toString().trim()).filter(tag => tag.length > 0)
  }
  
  return []
}

// 格式化URL
export const formatUrl = (url) => {
  if (!url) return ''
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url
  }
  
  return url
}

// 格式化手机号
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  
  return phone
}

// 格式化身份证号
export const formatIdCard = (idCard) => {
  if (!idCard) return ''
  
  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1-$2-$3')
  }
  
  return idCard
}

// 格式化银行卡号
export const formatBankCard = (cardNumber) => {
  if (!cardNumber) return ''
  
  return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// 高亮搜索关键词
export const highlightKeywords = (text, keywords, className = 'highlight') => {
  if (!text || !keywords) return text
  
  const keywordArray = Array.isArray(keywords) ? keywords : [keywords]
  let result = text
  
  keywordArray.forEach(keyword => {
    if (keyword.trim()) {
      const regex = new RegExp(`(${keyword.trim()})`, 'gi')
      result = result.replace(regex, `<span class="${className}">$1</span>`)
    }
  })
  
  return result
}

// 格式化阅读时间
export const formatReadingTime = (content) => {
  if (!content) return '0分钟'
  
  const wordsPerMinute = 200 // 平均阅读速度
  const wordCount = content.length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  
  return `${minutes}分钟`
}

// 格式化文章摘要
export const formatExcerpt = (content, maxLength = 200) => {
  if (!content) return ''
  
  // 移除HTML标签
  const plainText = content.replace(/<[^>]*>/g, '')
  
  return truncateText(plainText, maxLength)
}

// 格式化SEO友好的URL slug
export const formatSlug = (text) => {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
}

// 格式化颜色值
export const formatColor = (color) => {
  if (!color) return ''
  
  // 如果是hex颜色值，确保以#开头
  if (/^[0-9A-F]{6}$/i.test(color)) {
    return '#' + color
  }
  
  return color
}