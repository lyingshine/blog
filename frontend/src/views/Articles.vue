<template>
  <div class="articles-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">文章</h1>
            <p class="page-description">探索技术与生活的思考</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="container">
        <div class="filter-content">
          <!-- 分类筛选 -->
          <div class="category-filter">
            <div class="filter-label">分类筛选</div>
            <div class="category-list">
              <button 
                @click="selectCategory(null)"
                :class="['category-btn', { active: selectedCategory === null }]"
              >
                全部
              </button>
              <button 
                v-for="category in availableCategories"
                :key="category"
                @click="selectCategory(category)"
                :class="['category-btn', { active: selectedCategory === category }]"
              >
                {{ category }}
              </button>
            </div>
          </div>

          <!-- 排序选项 -->
          <div class="sort-filter">
            <div class="filter-label">排序方式</div>
            <select v-model="sortBy" class="sort-select">
              <option value="created_at">最新发布</option>
              <option value="updated_at">最近更新</option>
              <option value="title">标题排序</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="articles-section">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredArticles.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="12" y1="9" x2="8" y2="9"/>
            </svg>
          </div>
          <h3>{{ selectedCategory ? `没有找到分类为"${selectedCategory}"的文章` : '暂无文章' }}</h3>
          <p>{{ selectedCategory ? '试试其他分类或查看全部文章' : '开始写作，分享你的想法吧' }}</p>
          <router-link v-if="isAuthenticated && !selectedCategory" to="/create" class="create-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            写第一篇文章
          </router-link>
        </div>

        <!-- 文章网格 -->
        <div v-else class="articles-grid">
          <article 
            v-for="article in paginatedArticles"
            :key="article.id"
            class="article-card"
            @click="goToArticle(article.id)"
          >
            <!-- 文章封面 -->
            <div v-if="article.coverImage" class="article-cover">
              <img :src="article.coverImage" :alt="article.title" />
              <div class="cover-overlay"></div>
            </div>

            <!-- 文章内容 -->
            <div class="article-content">
              <!-- 分类 -->
              <div v-if="article.category" class="article-categories">
                <span 
                  class="article-category"
                  @click.stop="selectCategory(article.category)"
                >
                  {{ article.category }}
                </span>
              </div>

              <!-- 标题和摘要 -->
              <h2 class="article-title">{{ article.title }}</h2>
              <p v-if="article.summary" class="article-summary">{{ article.summary }}</p>

              <!-- 文章元信息 -->
              <div class="article-meta">
                <div class="meta-left">
                  <time class="article-date">{{ formatDate(article.created_at) }}</time>
                  <span v-if="article.reading_time" class="read-time">{{ article.reading_time }}分钟阅读</span>
                </div>
                <div class="meta-right">
                  <span class="view-count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {{ article.views || 0 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 悬停效果 -->
            <div class="article-hover-effect"></div>
          </article>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            上一页
          </button>

          <div class="pagination-numbers">
            <button 
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="['pagination-number', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
          </div>

          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            下一页
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,6 15,12 9,18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useArticleStore } from '../stores/article.store'
import { useAuthStore } from '../stores/auth.store'
// 使用原生JavaScript替代date-fns，避免依赖问题
// import { formatDistanceToNow } from 'date-fns'
// import { zhCN } from 'date-fns/locale'

export default {
  name: 'Articles',
  
  setup() {
    const articleStore = useArticleStore()
    const authStore = useAuthStore()
    
    return {
      articles: articleStore.articles,
      loading: articleStore.loading,
      fetchArticles: articleStore.fetchArticles,
      isAuthenticated: authStore.isAuthenticated
    }
  },

  data() {
    return {
      selectedCategory: null,
      sortBy: 'created_at',
      currentPage: 1,
      articlesPerPage: 12
    }
  },

  computed: {
    // 获取所有可用分类
    availableCategories() {
      const categories = new Set()
      this.articles.forEach(article => {
        if (article.category) {
          categories.add(article.category)
        }
      })
      return Array.from(categories).sort()
    },

    // 筛选后的文章
    filteredArticles() {
      let filtered = [...this.articles]

      // 按分类筛选
      if (this.selectedCategory) {
        filtered = filtered.filter(article => 
          article.category === this.selectedCategory
        )
      }

      // 排序
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'created_at':
            return new Date(b.created_at) - new Date(a.created_at)
          case 'updated_at':
            return new Date(b.updated_at) - new Date(a.updated_at)
          case 'title':
            return a.title.localeCompare(b.title, 'zh-CN')
          default:
            return 0
        }
      })

      return filtered
    },

    // 分页后的文章
    paginatedArticles() {
      const start = (this.currentPage - 1) * this.articlesPerPage
      const end = start + this.articlesPerPage
      return this.filteredArticles.slice(start, end)
    },

    // 总文章数
    totalArticles() {
      return this.articles.length
    },

    // 总页数
    totalPages() {
      return Math.ceil(this.filteredArticles.length / this.articlesPerPage)
    },

    // 可见页码
    visiblePages() {
      const pages = []
      const total = this.totalPages
      const current = this.currentPage
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        } else if (current >= total - 3) {
          pages.push(1)
          pages.push('...')
          for (let i = total - 4; i <= total; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        }
      }
      
      return pages
    }
  },

  watch: {
    selectedCategory() {
      this.currentPage = 1
    },
    
    sortBy() {
      this.currentPage = 1
    }
  },

  async created() {
    await this.fetchArticles()
    
    // 检查URL参数中是否有分类筛选
    const category = this.$route.query.category
    if (category && this.availableCategories.includes(category)) {
      this.selectedCategory = category
    }
  },

  methods: {
    selectCategory(category) {
      this.selectedCategory = category
      this.currentPage = 1
      
      // 更新URL参数
      const query = { ...this.$route.query }
      if (category) {
        query.category = category
      } else {
        delete query.category
      }
      
      this.$router.replace({ query })
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },

    goToArticle(articleId) {
      this.$router.push(`/article/${articleId}`)
    },

    formatDate(date) {
      const now = new Date()
      const articleDate = new Date(date)
      const diffInSeconds = Math.floor((now - articleDate) / 1000)
      
      if (diffInSeconds < 60) {
        return '刚刚'
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes}分钟前`
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours}小时前`
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days}天前`
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000)
        return `${months}个月前`
      } else {
        const years = Math.floor(diffInSeconds / 31536000)
        return `${years}年前`
      }
    }
  }
}
</script>

<style scoped>
.articles-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-16) 0 var(--space-12);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  line-height: 1.2;
}

.page-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.header-stats {
  display: flex;
  gap: var(--space-8);
}

.stat-item {
  text-align: center;
  padding: var(--space-4) var(--space-6);
  background: var(--bg-elevated);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.stat-number {
  display: block;
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent);
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  margin-top: var(--space-1);
}

/* 筛选区域 */
.filter-section {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-8) 0;
  position: sticky;
  top: 60px;
  z-index: 10;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.filter-content {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  flex-wrap: wrap;
}

.filter-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.category-filter {
  flex: 1;
  min-width: 300px;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.category-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.category-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.category-btn.active {
  background: var(--color-accent);
  color: var(--text-inverse);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.sort-filter {
  min-width: 160px;
}

.sort-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sort-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

/* 文章区域 */
.articles-section {
  padding: var(--space-12) 0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) 0;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-4);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: var(--space-20) 0;
  color: var(--text-secondary);
}

.empty-icon {
  margin-bottom: var(--space-6);
  opacity: 0.6;
}

.empty-state h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.empty-state p {
  font-size: var(--text-base);
  margin-bottom: var(--space-8);
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--text-inverse);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.create-btn:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 文章网格 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-8);
}

/* 文章卡片 */
.article-card {
  position: relative;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-3xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-hover);
}

.article-cover {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.article-card:hover .article-cover img {
  transform: scale(1.05);
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--color-overlay) 20%, transparent) 100%);
}

.article-content {
  padding: var(--space-6);
}

.article-categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.article-category {
  padding: var(--space-1) var(--space-3);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.article-category:hover {
  background: var(--color-accent);
  color: var(--text-inverse);
  transform: translateY(-1px);
}

.article-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-summary {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-4);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.meta-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.meta-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.view-count {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.article-hover-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 5%, transparent) 0%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.article-card:hover .article-hover-effect {
  opacity: 1;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-16);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  gap: var(--space-1);
}

.pagination-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border-radius: var(--radius-xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-number:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.pagination-number.active {
  background: var(--color-accent);
  color: var(--text-inverse);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

/* 响应式设计 */
@media (max-width: 1023px) {
  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
  }
  
  .header-stats {
    align-self: stretch;
    justify-content: space-around;
  }
}

@media (max-width: 767px) {
  .page-header {
    padding: var(--space-12) 0 var(--space-8);
  }
  
  .page-title {
    font-size: var(--text-3xl);
  }
  
  .filter-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-6);
  }
  
  .category-filter {
    min-width: auto;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .filter-section {
    top: 64px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .pagination-numbers {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: var(--space-4);
  }
}

@media (max-width: 639px) {
  .article-content {
    padding: var(--space-4);
  }
  
  .stat-item {
    padding: var(--space-3) var(--space-4);
  }
  
  .stat-number {
    font-size: var(--text-xl);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .article-card,
  .tag-btn,
  .pagination-btn,
  .pagination-number,
  .article-cover img {
    transition: none;
  }
  
  .article-card:hover,
  .tag-btn:hover,
  .pagination-btn:hover,
  .pagination-number:hover {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .article-card,
  .tag-btn,
  .pagination-btn,
  .pagination-number {
    border-width: 2px;
  }
  
  .article-card:hover,
  .tag-btn:hover,
  .pagination-btn:hover,
  .pagination-number:hover {
    border-color: currentColor;
  }
}
</style>