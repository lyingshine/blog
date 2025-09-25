import axios from 'axios'

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('blog_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API请求错误:', error)
    
    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('blog_token')
      localStorage.removeItem('blog_user')
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    
    // 处理网络错误
    if (!error.response) {
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    }
    
    // 返回服务器错误信息
    const message = error.response.data?.error || error.response.data?.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// 认证相关API
export const authAPI = {
  // 用户注册
  register: (userData) => api.post('/auth/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/me'),
  
  // 更新用户资料
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  
  // 修改密码
  changePassword: (passwordData) => api.put('/auth/password', passwordData)
}

// 文章相关API
export const articlesAPI = {
  // 获取文章列表
  getArticles: (params = {}) => api.get('/articles', { params }),
  
  // 获取单篇文章
  getArticle: (id) => api.get(`/articles/${id}`),
  
  // 创建文章
  createArticle: (articleData) => api.post('/articles', articleData),
  
  // 更新文章
  updateArticle: (id, articleData) => api.put(`/articles/${id}`, articleData),
  
  // 删除文章（移到回收站）
  deleteArticle: (id) => api.delete(`/articles/${id}`),
  
  // 获取回收站文章列表
  getTrashArticles: (params = {}) => api.get('/articles/trash', { params }),
  
  // 从回收站恢复文章
  restoreArticle: (id) => api.post(`/articles/${id}/restore`),
  
  // 永久删除文章
  permanentDeleteArticle: (id) => api.delete(`/articles/${id}/permanent`),
  
  // 清空回收站
  clearTrash: () => api.delete('/articles/trash/clear'),
  
  // 切换文章点赞
  toggleLike: (id) => api.post(`/articles/${id}/like`),
  
  // 获取用户的文章
  getUserArticles: (username, params = {}) => api.get(`/articles/user/${username}`, { params })
}

// 用户相关API
export const usersAPI = {
  // 获取用户列表
  getUsers: (params = {}) => api.get('/users', { params }),
  
  // 获取用户详情
  getUser: (username) => api.get(`/users/${username}`),
  
  // 获取用户统计
  getUserStats: (username) => api.get(`/users/${username}/stats`)
}

// 标签相关API
export const tagsAPI = {
  // 获取所有标签
  getTags: (params = {}) => api.get('/tags', { params }),
  
  // 根据标签获取文章
  getTagArticles: (tagName, params = {}) => api.get(`/tags/${tagName}/articles`, { params }),
  
  // 搜索标签
  searchTags: (query, params = {}) => api.get(`/tags/search/${query}`, { params }),
  
  // 获取标签云数据
  getTagCloud: (params = {}) => api.get('/tags/cloud/data', { params })
}

// 评论相关API
export const commentsAPI = {
  // 获取文章的评论列表
  getComments: (articleId, params = {}) => api.get(`/comments/article/${articleId}`, { params }),
  
  // 获取评论的回复列表
  getReplies: (commentId, params = {}) => api.get(`/comments/${commentId}/replies`, { params }),
  
  // 创建评论
  createComment: (commentData) => api.post('/comments', commentData),
  
  // 切换评论点赞
  toggleLike: (commentId) => api.post(`/comments/${commentId}/like`),
  
  // 删除评论
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  
  // 更新评论
  updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),
  
  // 获取用户的评论列表
  getUserComments: (username, params = {}) => api.get(`/comments/user/${username}`, { params })
}

// 设置相关API
export const setupAPI = {
  // 添加回收站功能
  addTrashFeature: () => api.post('/setup/add-trash-feature')
}

// 通用API工具函数
export const apiUtils = {
  // 上传文件
  uploadFile: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },
  
  // 健康检查
  healthCheck: () => api.get('/health')
}

export default api