import BaseService from './base'
import { SearchParams, Pagination } from '../types'

class TagService extends BaseService {
  constructor() {
    super()
  }

  // 获取所有标签
  async getTags(searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get('/tags', params)
      if (response.isSuccess) {
        const tags = response.data.tags || []
        const pagination = new Pagination(response.data.pagination || {})
        
        return {
          success: true,
          tags,
          pagination,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        tags: [],
        pagination: new Pagination(),
        message: error.error || '获取标签失败'
      }
    }
  }

  // 根据标签获取文章
  async getTagArticles(tagName, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get(`/tags/${tagName}/articles`, params)
      if (response.isSuccess) {
        const articles = response.data.articles || []
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
        message: error.error || '获取标签文章失败'
      }
    }
  }

  // 搜索标签
  async searchTags(query, searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get(`/tags/search/${query}`, params)
      if (response.isSuccess) {
        const tags = response.data.tags || []
        
        return {
          success: true,
          tags,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        tags: [],
        message: error.error || '搜索标签失败'
      }
    }
  }

  // 获取标签云数据
  async getTagCloud(searchParams = new SearchParams()) {
    try {
      const params = searchParams instanceof SearchParams 
        ? searchParams.toQueryParams() 
        : searchParams
        
      const response = await this.get('/tags/cloud/data', params)
      if (response.isSuccess) {
        const tagCloud = response.data.tagCloud || []
        
        return {
          success: true,
          tagCloud,
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        tagCloud: [],
        message: error.error || '获取标签云失败'
      }
    }
  }
}

// 导出单例实例
export const tagService = new TagService()
export default TagService