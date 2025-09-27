import BaseService from './base'

class TagService extends BaseService {
  constructor() {
    super()
  }

  // 获取所有标签
  async getTags(searchParams = {}) {
    try {
      const response = await this.get('/tags', searchParams)
      if (response.success) {
        return {
          success: true,
          tags: response.data.tags || [],
          pagination: response.data.pagination || {},
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        tags: [],
        pagination: {},
        message: error.error || '获取标签失败'
      }
    }
  }

  // 根据标签获取文章
  async getTagArticles(tagName, searchParams = {}) {
    try {
      const response = await this.get(`/tags/${tagName}/articles`, searchParams)
      if (response.success) {
        return {
          success: true,
          articles: response.data.articles || [],
          pagination: response.data.pagination || {},
          message: response.message
        }
      }
      throw response
    } catch (error) {
      return {
        success: false,
        articles: [],
        pagination: {},
        message: error.error || '获取标签文章失败'
      }
    }
  }

  // 搜索标签
  async searchTags(query, searchParams = {}) {
    try {
      const response = await this.get(`/tags/search/${query}`, searchParams)
      if (response.success) {
        return {
          success: true,
          tags: response.data.tags || [],
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
  async getTagCloud(searchParams = {}) {
    try {
      const response = await this.get('/tags/cloud/data', searchParams)
      if (response.success) {
        return {
          success: true,
          tagCloud: response.data.tagCloud || [],
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