import BaseService from './base'

class CommentService extends BaseService {
  constructor() {
    super()
  }

  // 获取文章的评论列表
  async getComments(articleId, searchParams = {}) {
    try {
      const response = await this.get(`/comments/article/${articleId}`, searchParams)
      if (response.success) {
        return {
          success: true,
          comments: response.data.comments || [],
          pagination: response.data.pagination || {},
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comments: [],
        pagination: {},
        message: error.error || '获取评论失败'
      }
    }
  }

  // 获取评论的回复列表
  async getReplies(commentId, searchParams = {}) {
    try {
      const response = await this.get(`/comments/${commentId}/replies`, searchParams)
      if (response.success) {
        return {
          success: true,
          replies: response.data.replies || [],
          pagination: response.data.pagination || {},
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        replies: [],
        pagination: {},
        message: error.error || '获取回复失败'
      }
    }
  }

  // 创建评论
  async createComment(commentData) {
    try {
      const response = await this.post('/comments', commentData)
      if (response.success) {
        return {
          success: true,
          comment: response.data.comment,
          message: response.message || '评论发表成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comment: null,
        message: error.error || '发表评论失败'
      }
    }
  }

  // 更新评论
  async updateComment(commentId, commentData) {
    try {
      const response = await this.put(`/comments/${commentId}`, commentData)
      if (response.success) {
        return {
          success: true,
          comment: response.data.comment,
          message: response.message || '评论更新成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comment: null,
        message: error.error || '更新评论失败'
      }
    }
  }

  // 删除评论
  async deleteComment(commentId) {
    try {
      const response = await this.delete(`/comments/${commentId}`)
      if (response.success) {
        return {
          success: true,
          message: response.message || '评论删除成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '删除评论失败'
      }
    }
  }

  // 点赞评论
  async likeComment(commentId) {
    try {
      const response = await this.post(`/comments/${commentId}/like`)
      if (response.success) {
        return {
          success: true,
          likes: response.data.likes,
          message: response.message || '点赞成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '点赞失败'
      }
    }
  }

  // 获取用户的评论列表
  async getUserComments(username, searchParams = {}) {
    try {
      const response = await this.get(`/comments/user/${username}`, searchParams)
      if (response.success) {
        return {
          success: true,
          comments: response.data.comments || [],
          pagination: response.data.pagination || {},
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comments: [],
        pagination: {},
        message: error.error || '获取用户评论失败'
      }
    }
  }
}

// 导出单例实例
export const commentService = new CommentService()
export default CommentService