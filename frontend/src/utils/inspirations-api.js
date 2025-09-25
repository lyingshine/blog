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

export default inspirationsAPI