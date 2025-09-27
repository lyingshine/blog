import BaseService from './base'
import { Comment, Pagination, SearchParams } from '../types'

class CommentService extends BaseService {
  constructor() {
    super()
  }

  // 获取文章的评论列表
  async getComments(articleId, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get(`/comments/article/${articleId}`, params)
      if (response.isSuccess) {
        const comments = (response.data.comments || []).map(comment => new Comment(comment))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          comments,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comments: [],
        pagination: new Pagination(),
        message: error.error || '获取评论失败'
      }
    }
  }

  // 获取评论的回复列表
  async getReplies(commentId, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get(`/comments/${commentId}/replies`, params)
      if (response.isSuccess) {
        const replies = (response.data.replies || []).map(reply => new Comment(reply))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          replies,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        replies: [],
        pagination: new Pagination(),
        message: error.error || '获取回复失败'
      }
    }
  }

  // 创建评论
  async createComment(commentData) {
    try {
      const response = await this.post('/comments', commentData)
      if (response.isSuccess) {
        const comment = new Comment(response.data.comment)
        
        return {
          success: true,
          comment,
          message: response.message || '评论发布成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comment: null,
        message: error.error || '发布评论失败'
      }
    }
  }

  // 更新评论
  async updateComment(commentId, commentData) {
    try {
      const response = await this.put(`/comments/${commentId}`, commentData)
      if (response.isSuccess) {
        const comment = new Comment(response.data.comment)
        
        return {
          success: true,
          comment,
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
      if (response.isSuccess) {
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

  // 切换评论点赞
  async toggleLike(commentId) {
    try {
      const response = await this.post(`/comments/${commentId}/like`)
      if (response.isSuccess) {
        return {
          success: true,
          totalLikes: response.data.totalLikes,
          isLiked: response.data.isLiked,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '点赞操作失败'
      }
    }
  }

  // 获取用户的评论列表
  async getUserComments(username, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get(`/comments/user/${username}`, params)
      if (response.isSuccess) {
        const comments = (response.data.comments || []).map(comment => new Comment(comment))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          comments,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        comments: [],
        pagination: new Pagination(),
        message: error.error || '获取用户评论失败'
      }
    }
  }
}

// 导出单例实例
export const commentService = new CommentService()
export default CommentService