const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`

class ApiService {
  refreshPromise = null

  getAccessToken() {
    return localStorage.getItem('token')
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken')
  }

  setTokens(payload = {}) {
    const accessToken = payload.accessToken || payload.token
    if (accessToken) localStorage.setItem('token', accessToken)
    if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
    if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user))
  }

  clearAuth() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('missing refresh token')
    }

    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'refresh failed')
      }

      this.setTokens(data.data || {})
      return data
    })()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  async requestWithAuthRetry(url, config, allowRetry = true) {
    const response = await fetch(url, config)
    if (response.status !== 401 || !allowRetry) {
      return response
    }

    if (!this.getRefreshToken()) {
      return response
    }

    try {
      await this.refreshAccessToken()
    } catch (error) {
      this.clearAuth()
      return response
    }

    const retriedConfig = {
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${this.getAccessToken()}`
      }
    }

    return fetch(url, retriedConfig)
  }

  async request(endpoint, options = {}) {
    const token = this.getAccessToken()
    const url = `${API_BASE_URL}${endpoint}`

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      ...options
    }

    try {
      const response = await this.requestWithAuthRetry(url, config, true)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth()
        }
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  async getArticles(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/articles${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async getArticle(id) {
    return this.request(`/articles/${id}`)
  }

  async getCategories() {
    return this.request('/articles/meta/categories')
  }

  async createArticle(articleData) {
    return this.request('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData)
    })
  }

  async updateArticle(id, articleData) {
    return this.request(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData)
    })
  }

  async deleteArticle(id) {
    return this.request(`/articles/${id}`, {
      method: 'DELETE'
    })
  }

  async getStatuses() {
    return this.request('/statuses')
  }

  async createStatus(content) {
    return this.request('/statuses', {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }

  async deleteStatus(id) {
    return this.request(`/statuses/${id}`, {
      method: 'DELETE'
    })
  }

  async likeStatus(id) {
    return this.request(`/statuses/${id}/like`, {
      method: 'POST'
    })
  }

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async getUser(id) {
    return this.request(`/users/${id}`)
  }

  async updateMyProfile(profileData) {
    return this.request('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }

  async uploadMyAvatar(avatarData) {
    return this.request('/users/me/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatarData })
    })
  }

  async getMyDailyPlanner() {
    return this.request('/users/me/planner')
  }

  async saveMyDailyPlanner(payload) {
    return this.request('/users/me/planner', {
      method: 'PUT',
      body: JSON.stringify(payload || {})
    })
  }

  async healthCheck() {
    return this.request('/health')
  }

  async sendFeishuPlannerReminder(payload) {
    return this.request('/notifications/feishu', {
      method: 'POST',
      body: JSON.stringify(payload || {})
    })
  }
}

export const apiService = new ApiService()
export default apiService
