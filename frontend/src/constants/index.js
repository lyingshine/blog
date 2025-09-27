// API相关常量
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  // 开发环境直接连接后端
  DIRECT_URL: import.meta.env.DEV ? 'http://127.0.0.1:3000/api' : '/api'
}

// 存储键名常量
export const STORAGE_KEYS = {
  TOKEN: 'blog_token',
  USER: 'blog_user',
  ARTICLES: 'blog_articles',
  THEME: 'blog_theme',
  LANGUAGE: 'blog_language'
}

// 路由常量
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  CREATE_POST: '/create',
  MY_POSTS: '/my-posts',
  TRASH: '/trash',
  ADMIN: '/admin',
  ABOUT: '/about',
  ARTICLE: (id) => `/article/${id}`,
  CATEGORY: (name) => `/category/${name}`,
  EDIT_POST: (id) => `/edit/${id}`
}

// 消息类型常量
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// 文章状态常量
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
}

// 用户角色常量
export const USER_ROLES = {
  ADMIN: 'admin',
  AUTHOR: 'author',
  READER: 'reader'
}

// 主题常量
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

// 分页常量
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
}

// 文件上传常量
export const UPLOAD_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  AVATAR_SIZE: 200
}

// 验证规则常量
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50000
  }
}

// 错误代码常量
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
}

// 事件名称常量
export const EVENTS = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATE: 'user:update',
  AVATAR_UPDATED: 'avatar-updated',
  ARTICLE_CREATED: 'article:created',
  ARTICLE_UPDATED: 'article:updated',
  ARTICLE_DELETED: 'article:deleted',
  THEME_CHANGED: 'theme:changed'
}