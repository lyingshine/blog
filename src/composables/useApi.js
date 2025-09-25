import { ref, reactive } from 'vue'
import { authAPI, articlesAPI, usersAPI, tagsAPI } from '../utils/api'

// 通用API状态管理
export function useApiState() {
  const loading = ref(false)
  const error = ref(null)
  
  const setLoading = (state) => {
    loading.value = state
  }
  
  const setError = (err) => {
    error.value = err
  }
  
  const clearError = () => {
    error.value = null
  }
  
  return {
    loading,
    error,
    setLoading,
    setError,
    clearError
  }
}

// 文章API组合式函数
export function useArticles() {
  const { loading, error, setLoading, setError, clearError } = useApiState()
  const articles = ref([])
  const article = ref(null)
  const pagination = reactive({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // 获取文章列表
  const fetchArticles = async (params = {}) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await articlesAPI.getArticles(params)
      articles.value = response.articles
      Object.assign(pagination, response.pagination)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 获取单篇文章
  const fetchArticle = async (id) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await articlesAPI.getArticle(id)
      article.value = response.article
      return response.article
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 创建文章
  const createArticle = async (articleData) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await articlesAPI.createArticle(articleData)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 更新文章
  const updateArticle = async (id, articleData) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await articlesAPI.updateArticle(id, articleData)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 删除文章
  const deleteArticle = async (id) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await articlesAPI.deleteArticle(id)
      // 从列表中移除已删除的文章
      articles.value = articles.value.filter(a => a.id !== parseInt(id))
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 切换点赞
  const toggleLike = async (id) => {
    try {
      const response = await articlesAPI.toggleLike(id)
      
      // 更新文章列表中的点赞状态
      const articleIndex = articles.value.findIndex(a => a.id === parseInt(id))
      if (articleIndex !== -1) {
        articles.value[articleIndex].likes = response.totalLikes
        articles.value[articleIndex].isLiked = response.isLiked
      }
      
      // 更新当前文章的点赞状态
      if (article.value && article.value.id === parseInt(id)) {
        article.value.likes = response.totalLikes
        article.value.isLiked = response.isLiked
      }
      
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }
  
  return {
    loading,
    error,
    articles,
    article,
    pagination,
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleLike,
    clearError
  }
}

// 用户API组合式函数
export function useUsers() {
  const { loading, error, setLoading, setError, clearError } = useApiState()
  const users = ref([])
  const user = ref(null)
  const userStats = ref(null)
  
  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await usersAPI.getUsers(params)
      users.value = response.users
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 获取用户详情
  const fetchUser = async (username) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await usersAPI.getUser(username)
      user.value = response.user
      return response.user
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 获取用户统计
  const fetchUserStats = async (username) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await usersAPI.getUserStats(username)
      userStats.value = response
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  return {
    loading,
    error,
    users,
    user,
    userStats,
    fetchUsers,
    fetchUser,
    fetchUserStats,
    clearError
  }
}

// 标签API组合式函数
export function useTags() {
  const { loading, error, setLoading, setError, clearError } = useApiState()
  const tags = ref([])
  const tagCloud = ref([])
  
  // 获取标签列表
  const fetchTags = async (params = {}) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await tagsAPI.getTags(params)
      tags.value = response.tags
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 获取标签云数据
  const fetchTagCloud = async (params = {}) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await tagsAPI.getTagCloud(params)
      tagCloud.value = response.tagCloud
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 搜索标签
  const searchTags = async (query, params = {}) => {
    setLoading(true)
    clearError()
    
    try {
      const response = await tagsAPI.searchTags(query, params)
      return response.tags
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  return {
    loading,
    error,
    tags,
    tagCloud,
    fetchTags,
    fetchTagCloud,
    searchTags,
    clearError
  }
}