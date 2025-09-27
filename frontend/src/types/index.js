// 用户相关类型定义
export class User {
  constructor(data = {}) {
    this.id = data.id || null
    this.username = data.username || ''
    this.email = data.email || ''
    this.avatar = data.avatar || null
    this.role = data.role || 'reader'
    this.createdAt = data.created_at || data.createdAt || null
    this.updatedAt = data.updated_at || data.updatedAt || null
  }

  get displayName() {
    return this.username || this.email
  }

  get isAdmin() {
    return this.role === 'admin'
  }

  get isAuthor() {
    return this.role === 'author' || this.role === 'admin'
  }
}

// 文章相关类型定义
export class Article {
  constructor(data = {}) {
    this.id = data.id || null
    this.title = data.title || ''
    this.content = data.content || ''
    this.excerpt = data.excerpt || ''
    this.category = data.category || ''
    this.tags = data.tags || []
    this.status = data.status || 'draft'
    this.featured = data.featured || false
    this.likes = data.likes || 0
    this.views = data.views || 0
    this.isLiked = data.isLiked || false
    this.authorId = data.author_id || data.authorId || null
    this.authorName = data.author_name || data.authorName || ''
    this.createdAt = data.created_at || data.createdAt || null
    this.updatedAt = data.updated_at || data.updatedAt || null
    this.deletedAt = data.deleted_at || data.deletedAt || null
  }

  get isPublished() {
    return this.status === 'published'
  }

  get isDraft() {
    return this.status === 'draft'
  }

  get isDeleted() {
    return !!this.deletedAt
  }

  get formattedTags() {
    return Array.isArray(this.tags) ? this.tags : []
  }
}

// 评论相关类型定义
export class Comment {
  constructor(data = {}) {
    this.id = data.id || null
    this.content = data.content || ''
    this.articleId = data.article_id || data.articleId || null
    this.parentId = data.parent_id || data.parentId || null
    this.authorId = data.author_id || data.authorId || null
    this.authorName = data.author_name || data.authorName || ''
    this.authorAvatar = data.author_avatar || data.authorAvatar || null
    this.likes = data.likes || 0
    this.isLiked = data.isLiked || false
    this.replies = data.replies || []
    this.createdAt = data.created_at || data.createdAt || null
    this.updatedAt = data.updated_at || data.updatedAt || null
  }

  get hasReplies() {
    return this.replies.length > 0
  }

  get isReply() {
    return !!this.parentId
  }
}

// 分页相关类型定义
export class Pagination {
  constructor(data = {}) {
    this.page = data.page || 1
    this.limit = data.limit || 10
    this.total = data.total || 0
    this.pages = data.pages || 0
    this.hasNext = data.hasNext || false
    this.hasPrev = data.hasPrev || false
  }

  get offset() {
    return (this.page - 1) * this.limit
  }

  get isFirstPage() {
    return this.page === 1
  }

  get isLastPage() {
    return this.page === this.pages
  }
}

// API响应类型定义
export class ApiResponse {
  constructor(data = {}) {
    this.success = data.success || false
    this.data = data.data || null
    this.message = data.message || ''
    this.error = data.error || null
    this.code = data.code || null
  }

  get isSuccess() {
    return this.success
  }

  get hasError() {
    return !!this.error
  }
}

// 表单验证结果类型定义
export class ValidationResult {
  constructor(isValid = true, errors = {}) {
    this.isValid = isValid
    this.errors = errors
  }

  get hasErrors() {
    return Object.keys(this.errors).length > 0
  }

  getError(field) {
    return this.errors[field] || null
  }

  addError(field, message) {
    this.errors[field] = message
    this.isValid = false
  }
}

// 搜索参数类型定义
export class SearchParams {
  constructor(data = {}) {
    this.query = data.query || ''
    this.category = data.category || ''
    this.tags = data.tags || []
    this.author = data.author || ''
    this.status = data.status || ''
    this.sortBy = data.sortBy || 'created_at'
    this.sortOrder = data.sortOrder || 'desc'
    this.page = data.page || 1
    this.limit = data.limit || 10
  }

  toQueryParams() {
    const params = {}
    if (this.query) params.q = this.query
    if (this.category) params.category = this.category
    if (this.tags.length) params.tags = this.tags.join(',')
    if (this.author) params.author = this.author
    if (this.status) params.status = this.status
    if (this.sortBy) params.sort = this.sortBy
    if (this.sortOrder) params.order = this.sortOrder
    if (this.page > 1) params.page = this.page
    if (this.limit !== 10) params.limit = this.limit
    return params
  }
}