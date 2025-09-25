import { ref, computed } from 'vue'
import { articlesAPI, setupAPI } from '../utils/api'

// 全局文章状态
const articles = ref([])
const trashArticles = ref([])
const currentArticle = ref(null)
const loading = ref(false)
const error = ref(null)

// 计算属性
const featuredArticles = computed(() => 
  articles.value.filter(article => article.featured)
)

const publishedArticles = computed(() => 
  articles.value.filter(article => article.status === 'published')
)

// 获取文章列表
const fetchArticles = async (params = {}) => {
  try {
    loading.value = true
    error.value = null
    console.log('获取文章列表，参数:', params)
    const response = await articlesAPI.getArticles(params)
    console.log('文章列表响应:', response)
    articles.value = response.articles || []
    return { success: true, articles: articles.value }
  } catch (err) {
    error.value = err.message || '获取文章失败'
    console.error('获取文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 获取单篇文章
const fetchArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    const response = await articlesAPI.getArticle(id)
    currentArticle.value = response.article
    return { success: true, article: currentArticle.value }
  } catch (err) {
    error.value = err.message || '获取文章失败'
    console.error('获取文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 创建文章
const createArticle = async (articleData) => {
  try {
    loading.value = true
    error.value = null
    console.log('创建文章，数据:', articleData)
    const response = await articlesAPI.createArticle(articleData)
    console.log('创建文章响应:', response)
    const newArticle = response.article
    articles.value.unshift(newArticle)
    return { success: true, article: newArticle }
  } catch (err) {
    error.value = err.message || '创建文章失败'
    console.error('创建文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 更新文章
const updateArticle = async (id, articleData) => {
  try {
    loading.value = true
    error.value = null
    const response = await articlesAPI.updateArticle(id, articleData)
    const updatedArticle = response.article
    
    // 更新本地状态
    const index = articles.value.findIndex(article => article.id === id)
    if (index !== -1) {
      articles.value[index] = updatedArticle
    }
    
    if (currentArticle.value && currentArticle.value.id === id) {
      currentArticle.value = updatedArticle
    }
    
    return { success: true, article: updatedArticle }
  } catch (err) {
    error.value = err.message || '更新文章失败'
    console.error('更新文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 删除文章
const deleteArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    await articlesAPI.deleteArticle(id)
    
    // 从本地状态中移除
    articles.value = articles.value.filter(article => article.id !== id)
    
    if (currentArticle.value && currentArticle.value.id === id) {
      currentArticle.value = null
    }
    
    return { success: true }
  } catch (err) {
    error.value = err.message || '删除文章失败'
    console.error('删除文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 点赞文章
const likeArticle = async (id) => {
  try {
    const response = await articlesAPI.toggleLike(id)
    const updatedArticle = response.article
    
    // 更新本地状态
    const index = articles.value.findIndex(article => article.id === id)
    if (index !== -1) {
      articles.value[index] = updatedArticle
    }
    
    if (currentArticle.value && currentArticle.value.id === id) {
      currentArticle.value = updatedArticle
    }
    
    return { success: true, article: updatedArticle }
  } catch (err) {
    console.error('点赞失败:', err)
    return { success: false, message: '点赞失败' }
  }
}

// 搜索文章
const searchArticles = async (query) => {
  try {
    loading.value = true
    error.value = null
    const response = await articlesAPI.getArticles({ search: query })
    return { success: true, articles: response.articles || [] }
  } catch (err) {
    error.value = err.message || '搜索失败'
    console.error('搜索失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 获取回收站文章列表
const fetchTrashArticles = async (params = {}) => {
  try {
    loading.value = true
    error.value = null
    console.log('获取回收站文章列表，参数:', params)
    const response = await articlesAPI.getTrashArticles(params)
    console.log('回收站文章列表响应:', response)
    trashArticles.value = response.articles || []
    return { success: true, articles: trashArticles.value, pagination: response.pagination }
  } catch (err) {
    error.value = err.message || '获取回收站文章失败'
    console.error('获取回收站文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 从回收站恢复文章
const restoreArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    console.log('恢复文章:', id)
    const response = await articlesAPI.restoreArticle(id)
    console.log('恢复文章响应:', response)
    
    // 从回收站列表中移除
    trashArticles.value = trashArticles.value.filter(article => article.id !== id)
    
    return { success: true, message: response.message || '文章恢复成功' }
  } catch (err) {
    error.value = err.message || '恢复文章失败'
    console.error('恢复文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 永久删除文章
const permanentDeleteArticle = async (id) => {
  try {
    loading.value = true
    error.value = null
    console.log('永久删除文章:', id)
    const response = await articlesAPI.permanentDeleteArticle(id)
    console.log('永久删除文章响应:', response)
    
    // 从回收站列表中移除
    trashArticles.value = trashArticles.value.filter(article => article.id !== id)
    
    return { success: true, message: response.message || '文章永久删除成功' }
  } catch (err) {
    error.value = err.message || '永久删除文章失败'
    console.error('永久删除文章失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 清空回收站
const clearTrash = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('清空回收站')
    const response = await articlesAPI.clearTrash()
    console.log('清空回收站响应:', response)
    
    // 清空回收站列表
    trashArticles.value = []
    
    return { success: true, message: response.message || '回收站清空成功' }
  } catch (err) {
    error.value = err.message || '清空回收站失败'
    console.error('清空回收站失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

// 初始化回收站功能（添加数据库字段）
const initTrashFeature = async () => {
  try {
    loading.value = true
    error.value = null
    console.log('初始化回收站功能')
    const response = await setupAPI.addTrashFeature()
    console.log('初始化回收站功能响应:', response)
    
    return { success: true, message: response.message || '回收站功能初始化成功' }
  } catch (err) {
    error.value = err.message || '初始化回收站功能失败'
    console.error('初始化回收站功能失败:', err)
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}

export function useArticles() {
  return {
    // 状态
    articles,
    trashArticles,
    currentArticle,
    loading,
    error,
    
    // 计算属性
    featuredArticles,
    publishedArticles,
    
    // 方法
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    likeArticle,
    searchArticles,
    
    // 回收站相关方法
    fetchTrashArticles,
    restoreArticle,
    permanentDeleteArticle,
    clearTrash,
    initTrashFeature
  }
}