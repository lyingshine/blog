// 服务层统一导出
export { authService } from './auth.service'
export { articleService } from './article.service'
export { userService } from './user.service'
export { commentService } from './comment.service'
export { tagService } from './tag.service'
export { BaseService, apiClient } from './base'

// 服务类导出（用于扩展）
export { default as AuthService } from './auth.service'
export { default as ArticleService } from './article.service'
export { default as UserService } from './user.service'
export { default as CommentService } from './comment.service'
export { default as TagService } from './tag.service'