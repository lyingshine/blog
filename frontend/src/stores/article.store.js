import { ref, computed } from 'vue'
import { articleService } from '../services'
import { EVENTS } from '../constants'

// 全局文章状态
const articles = ref([])
const trashArticles = ref([])
const currentArticle = ref(null)
const loading = ref(false)
const error = ref(null)
const pagination = ref({})
const trashPagination = ref({})

// 计算属性
const featuredArticles = computed(() => 
  articles.value.filter(article => article.featured)
)

const publishedArticles = computed(() => 
  articles.value.filter(article => article.isPublished)
)

const draftArticles = computed(() => 
  articles.value.filter(article => article.isDraft)
)

const recentArticles = computed(() => 
  [...articles.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
)

// 事件发射器
const emit = (eventName, data) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: data }))
}

// 获取文章列表
const fetchArticles = async (searchParams = {}) => {
  try {
    loading.value = true
    error.value = null
    
    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    
    const result = await articleService.getArticles(searchParams, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (result.success) {
      articles.value = result.articles
      pagination.value = result.pagination
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      error.value = '请求超时，请检查网络连接'
    } else {
      error.value = err.message || '获取文章列表失败'
    }
    
    // 超时或错误时返回空数据，避免无限加载
    articles.value = []
    pagination.value = {}
    
    return {
      success: false,
      message: error.value,
      articles: [],
      pagination: {}
    }
  } finally {
    loading.value = false
  }
}

// 获取单篇文章
const fetchArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.getArticle(id)
    if (result.success) {
      currentArticle.value = result.article
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '获取文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 创建文章
const createArticle = async (articleData) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.createArticle(articleData)
    if (result.success) {
      articles.value.unshift(result.article)
      emit(EVENTS.ARTICLE_CREATED, result.article)
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '创建文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 更新文章
const updateArticle = async (id, articleData) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.updateArticle(id, articleData)
    if (result.success) {
      // 更新本地状态
      const index = articles.value.findIndex(article => article.id === id)
      if (index !== -1) {
        articles.value[index] = result.article
      }
      
      if (currentArticle.value && currentArticle.value.id === id) {
        currentArticle.value = result.article
      }
      
      emit(EVENTS.ARTICLE_UPDATED, result.article)
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '更新文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 删除文章
const deleteArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.deleteArticle(id)
    if (result.success) {
      // 从本地状态中移除
      articles.value = articles.value.filter(article => article.id !== id)
      
      if (currentArticle.value && currentArticle.value.id === id) {
        currentArticle.value = null
      }
      
      emit(EVENTS.ARTICLE_DELETED, { id })
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '删除文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 点赞文章
const likeArticle = async (id) => {
  try {
    const result = await articleService.toggleLike(id)
    if (result.success) {
      // 更新本地状态
      const index = articles.value.findIndex(article => article.id === id)
      if (index !== -1) {
        articles.value[index].likes = result.totalLikes
        articles.value[index].isLiked = result.isLiked
      }
      
      if (currentArticle.value && currentArticle.value.id === id) {
        currentArticle.value.likes = result.totalLikes
        currentArticle.value.isLiked = result.isLiked
      }
      
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '点赞操作失败'
    return {
      success: false,
      message: error.value
    }
  }
}

// 搜索文章
const searchArticles = async (query, searchParams = {}) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.searchArticles(query, searchParams)
    if (result.success) {
      articles.value = result.articles
      pagination.value = result.pagination
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '搜索文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 获取回收站文章列表
const fetchTrashArticles = async (searchParams = {}) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.getTrashArticles(searchParams)
    if (result.success) {
      trashArticles.value = result.articles
      trashPagination.value = result.pagination
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '获取回收站文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 从回收站恢复文章
const restoreArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.restoreArticle(id)
    if (result.success) {
      // 从回收站列表中移除
      trashArticles.value = trashArticles.value.filter(article => article.id !== id)
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '恢复文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 永久删除文章
const permanentDeleteArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.permanentDeleteArticle(id)
    if (result.success) {
      // 从回收站列表中移除
      trashArticles.value = trashArticles.value.filter(article => article.id !== id)
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '永久删除文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 清空回收站
const clearTrash = async () => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.clearTrash()
    if (result.success) {
      trashArticles.value = []
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '清空回收站失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 获取用户文章
const fetchUserArticles = async (username, searchParams = {}) => {
  try {
    loading.value = true
    error.value = null
    
    const result = await articleService.getUserArticles(username, searchParams)
    if (result.success) {
      articles.value = result.articles
      pagination.value = result.pagination
      return result
    } else {
      error.value = result.message
      return result
    }
  } catch (err) {
    error.value = err.message || '获取用户文章失败'
    return {
      success: false,
      message: error.value
    }
  } finally {
    loading.value = false
  }
}

// 清除错误
const clearError = () => {
  error.value = null
}

// 重置状态
const resetState = () => {
  articles.value = []
  trashArticles.value = []
  currentArticle.value = null
  error.value = null
  pagination.value = {}
  trashPagination.value = {}
}

// 导出文章store
export const useArticleStore = () => {
  return {
    // 状态
    articles,
    trashArticles,
    currentArticle,
    loading,
    error,
    pagination,
    trashPagination,
    
    // 计算属性
    featuredArticles,
    publishedArticles,
    draftArticles,
    recentArticles,
    
    // 方法
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    likeArticle,
    searchArticles,
    fetchTrashArticles,
    restoreArticle,
    permanentDeleteArticle,
    clearTrash,
    fetchUserArticles,
    clearError,
    resetState
  }
}