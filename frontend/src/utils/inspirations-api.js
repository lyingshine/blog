import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
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
    console.error('API请求失败:', error)
    
    if (error.response?.status === 401) {
      // token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('blog_token')
      localStorage.removeItem('blog_user')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export const inspirationsAPI = {
  // 获取灵感列表
  getInspirations(params = {}) {
    return api.get('/inspirations', { params })
  },

  // 获取单个灵感详情
  getInspiration(id) {
    return api.get(`/inspirations/${id}`)
  },

  // 发布灵感
  createInspiration(formData) {
    return api.post('/inspirations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 点赞/取消点赞
  toggleLike(id) {
    return api.post(`/inspirations/${id}/like`)
  },

  // 转发灵感
  shareInspiration(id, shareContent = '') {
    return api.post(`/inspirations/${id}/share`, {
      share_content: shareContent
    })
  },

  // 获取转发列表
  getShares(id, params = {}) {
    return api.get(`/inspirations/${id}/shares`, { params })
  },

  // 删除灵感
  deleteInspiration(id) {
    return api.delete(`/inspirations/${id}`)
  },

  // 获取用户的灵感
  getUserInspirations(userId, params = {}) {
    return api.get('/inspirations', { 
      params: { 
        user_id: userId, 
        ...params 
      } 
    })
  }
}

// 评论相关API
export const commentsAPI = {
  // 获取灵感评论列表
  getComments(inspirationId, params = {}) {
    return api.get(`/inspiration-comments/${inspirationId}`, { params })
  },

  // 获取评论回复列表
  getReplies(commentId, params = {}) {
    return api.get(`/inspiration-comments/${commentId}/replies`, { params })
  },

  // 发布评论
  createComment(data) {
    return api.post('/inspiration-comments', data)
  },

  // 点赞/取消点赞评论
  toggleCommentLike(commentId) {
    return api.post(`/inspiration-comments/${commentId}/like`)
  },

  // 删除评论
  deleteComment(commentId) {
    return api.delete(`/inspiration-comments/${commentId}`)
  },

  // 更新评论
  updateComment(commentId, content) {
    return api.put(`/inspiration-comments/${commentId}`, { content })
  }
}

export default inspirationsAPI