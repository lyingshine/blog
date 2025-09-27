import BaseService from './base'
import { Article, Pagination, SearchParams } from '../types'
import { EnhancedBaseService } from './enhanced-base.service'
import { cached, cache } from '../utils/cache'
import { handleErrors } from '../utils/error-handler'

class ArticleService extends EnhancedBaseService {
  constructor() {
    super('ArticleService', {
      enableCache: true,
      enableRetry: true,
      maxRetries: 2
    })
  }

  // 初始化文章服务
  async onInit() {
    console.log('📝 初始化文章服务...')
    // 预加载热门文章等
  }

  // 健康检查
  async onHealthCheck() {
    try {
      // 简单的健康检查：获取文章数量
      const response = await this.get('/articles', { page: 1, limit: 1 })
      return {
        articlesAccessible: response.success,
        lastCheck: new Date().toISOString()
      }
    } catch (error) {
      return {
        articlesAccessible: false,
        error: error.message
      }
    }
  }

  // 获取文章列表
  @cached(3 * 60 * 1000) // 缓存3分钟
  @handleErrors({ success: false, articles: [], pagination: new Pagination(), message: '获取文章列表失败' })
  async getArticles(searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get('/articles', params)
      if (response.isSuccess) {
        const articles = (response.data.articles || []).map(article => new Article(article))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          articles,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        articles: [],
        pagination: new Pagination(),
        message: error.error || '获取文章列表失败'
      }
    }
  }

  // 获取单篇文章
  @cached(5 * 60 * 1000) // 缓存5分钟
  @handleErrors({ success: false, article: null, message: '获取文章失败' })
  async getArticle(id) {
    try {
      const response = await this.get(`/articles/${id}`)
      if (response.isSuccess) {
        const article = new Article(response.data.article)
        
        return {
          success: true,
          article,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        article: null,
        message: error.error || '获取文章失败'
      }
    }
  }

  // 创建文章
  @handleErrors({ success: false, article: null, message: '创建文章失败' })
  async createArticle(articleData) {
    try {
      const response = await this.post('/articles', articleData)
      if (response.isSuccess) {
        const article = new Article(response.data.article)
        
        return {
          success: true,
          article,
          message: response.message || '文章创建成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        article: null,
        message: error.error || '创建文章失败'
      }
    }
  }

  // 更新文章
  async updateArticle(id, articleData) {
    try {
      const response = await this.put(`/articles/${id}`, articleData)
      if (response.isSuccess) {
        const article = new Article(response.data.article)
        
        return {
          success: true,
          article,
          message: response.message || '文章更新成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        article: null,
        message: error.error || '更新文章失败'
      }
    }
  }

  // 删除文章（移到回收站）
  async deleteArticle(id) {
    try {
      const response = await this.delete(`/articles/${id}`)
      if (response.isSuccess) {
        return {
          success: true,
          message: response.message || '文章已移到回收站'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '删除文章失败'
      }
    }
  }

  // 获取回收站文章列表
  async getTrashArticles(searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get('/articles/trash', params)
      if (response.isSuccess) {
        const articles = (response.data.articles || []).map(article => new Article(article))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          articles,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        articles: [],
        pagination: new Pagination(),
        message: error.error || '获取回收站文章失败'
      }
    }
  }

  // 从回收站恢复文章
  async restoreArticle(id) {
    try {
      const response = await this.post(`/articles/${id}/restore`)
      if (response.isSuccess) {
        return {
          success: true,
          message: response.message || '文章恢复成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '恢复文章失败'
      }
    }
  }

  // 永久删除文章
  async permanentDeleteArticle(id) {
    try {
      const response = await this.delete(`/articles/${id}/permanent`)
      if (response.isSuccess) {
        return {
          success: true,
          message: response.message || '文章永久删除成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '永久删除文章失败'
      }
    }
  }

  // 清空回收站
  async clearTrash() {
    try {
      const response = await this.delete('/articles/trash/clear')
      if (response.isSuccess) {
        return {
          success: true,
          message: response.message || '回收站清空成功'
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        message: error.error || '清空回收站失败'
      }
    }
  }

  // 切换文章点赞
  async toggleLike(id) {
    try {
      const response = await this.post(`/articles/${id}/like`)
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

  // 获取用户的文章
  async getUserArticles(username, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get(`/articles/user/${username}`, params)
      if (response.isSuccess) {
        const articles = (response.data.articles || []).map(article => new Article(article))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          articles,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        articles: [],
        pagination: new Pagination(),
        message: error.error || '获取用户文章失败'
      }
    }
  }

  // 搜索文章
  async searchArticles(query, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
      
      params.q = query
      
      const response = await this.get('/articles', params)
      if (response.isSuccess) {
        const articles = (response.data.articles || []).map(article => new Article(article))
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          articles,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        articles: [],
        pagination: new Pagination(),
        message: error.error || '搜索文章失败'
      }
    }
  }
}

// 导出单例实例
export const articleService = new ArticleService()
export default ArticleService