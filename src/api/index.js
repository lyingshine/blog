const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  '/api'

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/i, '')

export const resolveAssetUrl = (url) => {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`
  return `${API_ORIGIN}/${trimmed}`
}

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

  async getStatuses(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/statuses${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
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
    return this.reactToContent('status', id, 'like')
  }

  async getEngagement(targetType, ids = []) {
    const safeIds = [...new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
    const query = new URLSearchParams({
      targetType,
      ids: safeIds.join(',')
    }).toString()
    return this.request(`/social/engagement?${query}`)
  }

  async reactToContent(targetType, targetId, reaction = 'like') {
    return this.request('/social/reactions', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, reaction })
    })
  }

  async getComments(targetType, targetId, limit = 50) {
    const query = new URLSearchParams({
      targetType,
      targetId: String(targetId),
      limit: String(limit)
    }).toString()
    return this.request(`/social/comments?${query}`)
  }

  async createComment(payload = {}) {
    return this.request('/social/comments', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async shareContent(payload = {}) {
    return this.request('/social/shares', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async reportContent(payload = {}) {
    return this.request('/social/reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  async followUser(userId) {
    return this.request(`/social/follows/${userId}`, {
      method: 'POST'
    })
  }

  async unfollowUser(userId) {
    return this.request(`/social/follows/${userId}`, {
      method: 'DELETE'
    })
  }

  async getFollowState(userId) {
    return this.request(`/social/follows/${userId}/state`)
  }

  async getFollowStates(ids = []) {
    const safeIds = [...new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
    const query = new URLSearchParams({ ids: safeIds.join(',') }).toString()
    return this.request(`/social/follows/me/states?${query}`)
  }

  async getFollowers(userId, limit = 50) {
    return this.request(`/social/follows/${userId}/followers?limit=${limit}`)
  }

  async getFollowing(userId, limit = 50) {
    return this.request(`/social/follows/${userId}/following?limit=${limit}`)
  }

  async getPrivateConversations(limit = 50) {
    return this.request(`/social/messages/conversations?limit=${limit}`)
  }

  async getPrivateMessages(userId, limit = 100) {
    return this.request(`/social/messages/${userId}?limit=${limit}`)
  }

  async markPrivateMessagesRead(userId) {
    return this.request(`/social/messages/${userId}/read`, {
      method: 'PUT'
    })
  }

  async sendPrivateMessage(receiverId, content) {
    return this.request('/social/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content })
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

  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count')
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    })
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    })
  }

  getNotificationStreamUrl() {
    const token = this.getAccessToken()
    if (!token) return ''
    const origin = API_ORIGIN || window.location.origin
    const streamUrl = new URL('/api/notifications/stream', origin)
    streamUrl.searchParams.set('token', token)
    return streamUrl.toString()
  }

  async getPushPublicKey() {
    return this.request('/notifications/push/public-key')
  }

  async subscribePush(subscription) {
    return this.request('/notifications/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription })
    })
  }

  async unsubscribePush(endpoint) {
    return this.request('/notifications/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint })
    })
  }

  async testPush() {
    return this.request('/notifications/push/test', {
      method: 'POST'
    })
  }

  async getAdminReports(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/admin/reports${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async updateAdminReport(id, status) {
    return this.request(`/admin/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  }
}

export const apiService = new ApiService()
export default apiService
