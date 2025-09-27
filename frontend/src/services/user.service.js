import BaseService from './base'

class UserService extends BaseService {
  constructor() {
    super()
  }

  // 获取用户列表
  async getUsers(searchParams = {}) {
    try {
      const response = await this.get('/users', searchParams)
      if (response.success) {
        return {
          success: true,
          users: response.data.users || [],
          pagination: response.data.pagination || {},
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        users: [],
        pagination: {},
        message: error.error || '获取用户列表失败'
      }
    }
  }

  // 根据用户名获取用户信息
  async getUserByUsername(username) {
    try {
      const response = await this.get(`/users/${username}`)
      if (response.success) {
        return {
          success: true,
          user: response.data.user,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        user: null,
        message: error.error || '获取用户信息失败'
      }
    }
  }

  // 获取用户统计信息
  async getUserStats(username) {
    try {
      const response = await this.get(`/users/${username}/stats`)
      if (response.success) {
        return {
          success: true,
          stats: response.data.stats,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        stats: null,
        message: error.error || '获取用户统计失败'
      }
    }
  }

  // 上传头像
  async uploadAvatar(file, onProgress) {
    try {
      const response = await this.upload('/users/avatar', file, onProgress)
      if (response.success) {
        return {
          success: true,
          avatar: response.data.avatar,
          message: response.message || '头像上传成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        avatar: null,
        message: error.error || '头像上传失败'
      }
    }
  }
}

// 导出单例实例
export const userService = new UserService()
export default UserService