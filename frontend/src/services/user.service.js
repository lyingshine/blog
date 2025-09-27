import BaseService from './base'
import { User, Pagination, SearchParams } from '../types'

class UserService extends BaseService {
  constructor() {
    super()
  }

  // 获取用户列表
  async getUsers(searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get('/users', params)
      if (response.isSuccess) {
        const users = (response.data.users || []).map(user => new User(user))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          users,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        users: [],
        pagination: new Pagination(),
        message: error.error || '获取用户列表失败'
      }
    }
  }

  // 获取用户详情
  async getUser(username) {
    try {
      const response = await this.get(`/users/${username}`)
      if (response.isSuccess) {
        const user = new User(response.data.user)
        
        return {
          success: true,
          user,
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

  // 获取用户统计
  async getUserStats(username) {
    try {
      const response = await this.get(`/users/${username}/stats`)
      if (response.isSuccess) {
        return {
          success: true,
          stats: response.data,
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
      if (response.isSuccess) {
        return {
          success: true,
          avatarUrl: response.data.avatarUrl,
          message: response.message || '头像上传成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        avatarUrl: null,
        message: error.error || '头像上传失败'
      }
    }
  }
}

// 导出单例实例
export const userService = new UserService()
export default UserService