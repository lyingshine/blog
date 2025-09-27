// API适配器 - 用于数据转换和适配
import { User, Article, Comment, Pagination } from '../types'

// 用户数据适配器
export const userAdapter = {
  // 从API响应转换为User实例
  fromApi(apiData) {
    if (!apiData) return null
    
    return new User({
      id: apiData.id,
      username: apiData.username,
      email: apiData.email,
      avatar: apiData.avatar,
      role: apiData.role,
      createdAt: apiData.created_at || apiData.createdAt,
      updatedAt: apiData.updated_at || apiData.updatedAt
    })
  },

  // 从User实例转换为API请求格式
  toApi(user) {
    if (!user) return null
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    }
  },

  // 批量转换
  fromApiList(apiList) {
    if (!Array.isArray(apiList)) return []
    return apiList.map(item => this.fromApi(item)).filter(Boolean)
  }
}

// 文章数据适配器
export const articleAdapter = {
  // 从API响应转换为Article实例
  fromApi(apiData) {
    if (!apiData) return null
    
    return new Article({
      id: apiData.id,
      title: apiData.title,
      content: apiData.content,
      excerpt: apiData.excerpt,
      category: apiData.category,
      tags: this.parseTags(apiData.tags),
      status: apiData.status,
      featured: apiData.featured,
      likes: apiData.likes || 0,
      views: apiData.views || 0,
      isLiked: apiData.isLiked || apiData.is_liked || false,
      authorId: apiData.author_id || apiData.authorId,
      authorName: apiData.author_name || apiData.authorName,
      createdAt: apiData.created_at || apiData.createdAt,
      updatedAt: apiData.updated_at || apiData.updatedAt,
      deletedAt: apiData.deleted_at || apiData.deletedAt
    })
  },

  // 从Article实例转换为API请求格式
  toApi(article) {
    if (!article) return null
    
    return {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      tags: this.stringifyTags(article.tags),
      status: article.status,
      featured: article.featured
    }
  },

  // 批量转换
  fromApiList(apiList) {
    if (!Array.isArray(apiList)) return []
    return apiList.map(item => this.fromApi(item)).filter(Boolean)
  },

  // 解析标签
  parseTags(tags) {
    if (!tags) return []
    
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
    if (Array.isArray(tags)) {
      return tags.map(tag => tag.toString().trim()).filter(tag => tag.length > 0)
    }
    
    return []
  },

  // 标签转字符串
  stringifyTags(tags) {
    if (!Array.isArray(tags)) return ''
    return tags.join(',')
  }
}

// 评论数据适配器
export const commentAdapter = {
  // 从API响应转换为Comment实例
  fromApi(apiData) {
    if (!apiData) return null
    
    return new Comment({
      id: apiData.id,
      content: apiData.content,
      articleId: apiData.article_id || apiData.articleId,
      parentId: apiData.parent_id || apiData.parentId,
      authorId: apiData.author_id || apiData.authorId,
      authorName: apiData.author_name || apiData.authorName,
      authorAvatar: apiData.author_avatar || apiData.authorAvatar,
      likes: apiData.likes || 0,
      isLiked: apiData.isLiked || apiData.is_liked || false,
      replies: this.fromApiList(apiData.replies || []),
      createdAt: apiData.created_at || apiData.createdAt,
      updatedAt: apiData.updated_at || apiData.updatedAt
    })
  },

  // 从Comment实例转换为API请求格式
  toApi(comment) {
    if (!comment) return null
    
    return {
      content: comment.content,
      article_id: comment.articleId,
      parent_id: comment.parentId
    }
  },

  // 批量转换
  fromApiList(apiList) {
    if (!Array.isArray(apiList)) return []
    return apiList.map(item => this.fromApi(item)).filter(Boolean)
  }
}

// 分页数据适配器
export const paginationAdapter = {
  // 从API响应转换为Pagination实例
  fromApi(apiData) {
    if (!apiData) return new Pagination()
    
    return new Pagination({
      page: apiData.page || apiData.current_page || 1,
      limit: apiData.limit || apiData.per_page || 10,
      total: apiData.total || apiData.total_count || 0,
      pages: apiData.pages || apiData.total_pages || 0,
      hasNext: apiData.hasNext || apiData.has_next || false,
      hasPrev: apiData.hasPrev || apiData.has_prev || false
    })
  },

  // 从Pagination实例转换为API请求格式
  toApi(pagination) {
    if (!pagination) return {}
    
    return {
      page: pagination.page,
      limit: pagination.limit
    }
  }
}

// 搜索参数适配器
export const searchAdapter = {
  // 从查询参数转换为搜索对象
  fromQuery(queryParams) {
    return {
      query: queryParams.q || queryParams.query || '',
      category: queryParams.category || '',
      tags: queryParams.tags ? queryParams.tags.split(',') : [],
      author: queryParams.author || '',
      status: queryParams.status || '',
      sortBy: queryParams.sort || queryParams.sortBy || 'created_at',
      sortOrder: queryParams.order || queryParams.sortOrder || 'desc',
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 10
    }
  },

  // 从搜索对象转换为查询参数
  toQuery(searchParams) {
    const params = {}
    
    if (searchParams.query) params.q = searchParams.query
    if (searchParams.category) params.category = searchParams.category
    if (searchParams.tags && searchParams.tags.length) params.tags = searchParams.tags.join(',')
    if (searchParams.author) params.author = searchParams.author
    if (searchParams.status) params.status = searchParams.status
    if (searchParams.sortBy) params.sort = searchParams.sortBy
    if (searchParams.sortOrder) params.order = searchParams.sortOrder
    if (searchParams.page > 1) params.page = searchParams.page
    if (searchParams.limit !== 10) params.limit = searchParams.limit
    
    return params
  }
}

// 表单数据适配器
export const formAdapter = {
  // 登录表单适配器
  loginForm: {
    toApi(formData) {
      return {
        username: formData.username?.trim(),
        password: formData.password
      }
    }
  },

  // 注册表单适配器
  registerForm: {
    toApi(formData) {
      return {
        username: formData.username?.trim(),
        email: formData.email?.trim(),
        password: formData.password
      }
    }
  },

  // 文章表单适配器
  articleForm: {
    toApi(formData) {
      return {
        title: formData.title?.trim(),
        content: formData.content?.trim(),
        excerpt: formData.excerpt?.trim() || this.generateExcerpt(formData.content),
        category: formData.category?.trim(),
        tags: formData.tags || [],
        status: formData.status || 'draft',
        featured: formData.featured || false
      }
    },

    generateExcerpt(content, maxLength = 200) {
      if (!content) return ''
      
      // 移除HTML标签
      const plainText = content.replace(/<[^>]*>/g, '')
      
      if (plainText.length <= maxLength) {
        return plainText
      }
      
      return plainText.substring(0, maxLength) + '...'
    }
  },

  // 用户资料表单适配器
  profileForm: {
    toApi(formData) {
      return {
        username: formData.username?.trim(),
        email: formData.email?.trim(),
        avatar: formData.avatar
      }
    }
  }
}

// 错误适配器
export const errorAdapter = {
  // 从API错误转换为标准错误格式
  fromApi(apiError) {
    if (!apiError) return null
    
    return {
      message: apiError.message || apiError.error || '未知错误',
      code: apiError.code || apiError.status || 'UNKNOWN_ERROR',
      details: apiError.details || apiError.data || null,
      timestamp: new Date().toISOString()
    }
  },

  // 从网络错误转换为标准错误格式
  fromNetwork(networkError) {
    return {
      message: '网络连接失败，请检查网络设置',
      code: 'NETWORK_ERROR',
      details: networkError,
      timestamp: new Date().toISOString()
    }
  },

  // 从验证错误转换为标准错误格式
  fromValidation(validationErrors) {
    return {
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      details: validationErrors,
      timestamp: new Date().toISOString()
    }
  }
}

// 统一适配器导出
export const adapters = {
  user: userAdapter,
  article: articleAdapter,
  comment: commentAdapter,
  pagination: paginationAdapter,
  search: searchAdapter,
  form: formAdapter,
  error: errorAdapter
}