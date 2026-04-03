import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const refreshToken = ref(localStorage.getItem('refreshToken') || null)

  let refreshPromise = null

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setUser = (newUser) => {
    user.value = newUser
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser))
    else localStorage.removeItem('user')
  }

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) localStorage.setItem('token', newToken)
    else localStorage.removeItem('token')
  }

  const setRefreshToken = (newToken) => {
    refreshToken.value = newToken
    if (newToken) localStorage.setItem('refreshToken', newToken)
    else localStorage.removeItem('refreshToken')
  }

  const saveTokens = (payload = {}) => {
    setToken(payload.accessToken || payload.token || null)
    if (payload.refreshToken) setRefreshToken(payload.refreshToken)
  }

  const login = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '登录失败')

    saveTokens(data.data)
    setUser(data.data.user)
    return data
  }

  const register = async (username, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '注册失败')

    saveTokens(data.data)
    setUser(data.data.user)
    return data
  }

  const refreshAccessToken = async () => {
    if (!refreshToken.value) throw new Error('missing refresh token')
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken.value })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'refresh failed')
      saveTokens(data.data)
      if (data.data?.user) setUser(data.data.user)
      return data
    })()

    try {
      return await refreshPromise
    } finally {
      refreshPromise = null
    }
  }

  const logout = () => {
    setToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  const fetchUser = async () => {
    if (!token.value) return

    const doFetch = async () =>
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })

    try {
      let response = await doFetch()
      if (response.status === 401 && refreshToken.value) {
        await refreshAccessToken()
        response = await doFetch()
      }
      if (!response.ok) throw new Error('获取用户信息失败')

      const data = await response.json()
      setUser(data.data.user)
    } catch (error) {
      console.error('Fetch user error:', error)
      logout()
    }
  }

  const initAuth = async () => {
    if (token.value) await fetchUser()
    else if (refreshToken.value) {
      try {
        await refreshAccessToken()
        await fetchUser()
      } catch (e) {
        logout()
      }
    }
  }

  return {
    user,
    token,
    refreshToken,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
    refreshAccessToken,
    initAuth,
    setUser,
    setToken,
    setRefreshToken
  }
})
