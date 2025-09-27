import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth.store'

describe('Auth Store', () => {
  let authStore

  beforeEach(() => {
    // 重置 store 状态
    authStore = useAuthStore()
    authStore.logout()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(authStore.isAuthenticated.value).toBe(false)
      expect(authStore.user.value).toBeNull()
      expect(authStore.token.value).toBeNull()
      expect(authStore.loading.value).toBe(false)
      expect(authStore.error.value).toBeNull()
    })
  })

  describe('登录功能', () => {
    it('应该能够成功登录', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      }
      const mockToken = 'mock-jwt-token'

      // Mock API 响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: mockUser,
            token: mockToken
          }
        })
      })

      const result = await authStore.login('testuser', 'password')

      expect(result.success).toBe(true)
      expect(authStore.isAuthenticated.value).toBe(true)
      expect(authStore.user.value).toEqual(mockUser)
      expect(authStore.token.value).toBe(mockToken)
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken)
    })

    it('应该处理登录失败', async () => {
      // Mock API 错误响应
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: '用户名或密码错误'
        })
      })

      const result = await authStore.login('wronguser', 'wrongpass')

      expect(result.success).toBe(false)
      expect(authStore.isAuthenticated.value).toBe(false)
      expect(authStore.error.value).toBe('用户名或密码错误')
    })

    it('应该处理网络错误', async () => {
      // Mock 网络错误
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await authStore.login('testuser', 'password')

      expect(result.success).toBe(false)
      expect(authStore.error.value).toBe('Network error')
    })
  })

  describe('登出功能', () => {
    it('应该能够成功登出', () => {
      // 先设置登录状态
      authStore.user.value = { id: 1, username: 'testuser' }
      authStore.token.value = 'mock-token'
      authStore.isAuthenticated.value = true

      authStore.logout()

      expect(authStore.isAuthenticated.value).toBe(false)
      expect(authStore.user.value).toBeNull()
      expect(authStore.token.value).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('令牌验证', () => {
    it('应该能够验证有效令牌', async () => {
      const mockToken = 'valid-token'
      localStorage.getItem.mockReturnValue(mockToken)

      // Mock API 响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: { id: 1, username: 'testuser' }
          }
        })
      })

      const result = await authStore.validateToken()

      expect(result).toBe(true)
      expect(authStore.isAuthenticated.value).toBe(true)
    })

    it('应该处理无效令牌', async () => {
      const mockToken = 'invalid-token'
      localStorage.getItem.mockReturnValue(mockToken)

      // Mock API 错误响应
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: '令牌无效'
        })
      })

      const result = await authStore.validateToken()

      expect(result).toBe(false)
      expect(authStore.isAuthenticated.value).toBe(false)
    })
  })

  describe('用户信息更新', () => {
    it('应该能够更新用户信息', async () => {
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com'
      }

      // Mock API 响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: updatedUser }
        })
      })

      const result = await authStore.updateProfile(updatedUser)

      expect(result.success).toBe(true)
      expect(authStore.user.value).toEqual(updatedUser)
    })
  })
})