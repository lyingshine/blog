<template>
  <div class="category-page">
    <div class="container">
      <!-- Category Header -->
      <header class="category-header">
        <h1 class="category-title">{{ categoryName }}</h1>
        <p class="category-description">{{ getCategoryDescription(categoryName) }}</p>
        <div class="category-stats">
          <span class="stat">{{ articles.length }} 篇文章</span>
        </div>
      </header>

      <!-- Filter and Sort -->
      <div class="category-controls">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="搜索文章..." 
            v-model="searchQuery"
            class="search-input"
          >
        </div>
        
        <div class="sort-options">
          <select v-model="sortBy" class="sort-select">
            <option value="date">按日期排序</option>
            <option value="title">按标题排序</option>
            <option value="likes">按热度排序</option>
          </select>
        </div>
      </div>

      <!-- Articles List -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredArticles.length > 0" class="articles-grid">
        <article 
          v-for="article in paginatedArticles" 
          :key="article.id"
          class="card article-card"
          @click="goToArticle(article.id)"
        >
          <div v-if="article.image" class="article-image">
            <img :src="article.image" :alt="article.title" />
          </div>
          
          <div class="article-content">
            <div class="article-meta">
              <span class="date">{{ formatDate(article.date) }}</span>
              <span class="reading-time">{{ article.readingTime }}分钟阅读</span>
            </div>
            
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-excerpt">{{ article.excerpt }}</p>
            
            <div class="article-tags">
              <span 
                v-for="tag in article.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
            
            <div class="article-stats">
              <span class="likes">❤️ {{ article.likes }}</span>
              <span class="views">👁️ {{ article.views }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="no-articles">
        <h3>暂无文章</h3>
        <p>该分类下还没有文章，或者没有匹配的搜索结果。</p>
        <router-link to="/" class="btn">返回首页</router-link>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          上一页
        </button>
        
        <span class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'

export default {
  name: 'Category',
  props: {
    name: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      articles: [],
      searchQuery: '',
      sortBy: 'date',
      currentPage: 1,
      articlesPerPage: 6
    }
  },
  computed: {
    categoryName() {
      return decodeURIComponent(this.name)
    },
    
    filteredArticles() {
      let filtered = this.articles
      
      // 搜索过滤
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(article => 
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      // 排序
      return filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'date':
            return new Date(b.date) - new Date(a.date)
          case 'title':
            return a.title.localeCompare(b.title)
          case 'likes':
            return b.likes - a.likes
          default:
            return 0
        }
      })
    },
    
    totalPages() {
      return Math.ceil(this.filteredArticles.length / this.articlesPerPage)
    },
    
    paginatedArticles() {
      const start = (this.currentPage - 1) * this.articlesPerPage
      const end = start + this.articlesPerPage
      return this.filteredArticles.slice(start, end)
    }
  },
  watch: {
    name: {
      handler() {
        this.fetchArticles()
      },
      immediate: true
    },
    
    searchQuery() {
      this.currentPage = 1
    },
    
    sortBy() {
      this.currentPage = 1
    }
  },
  methods: {
    async fetchArticles() {
      this.loading = true
      try {
        // 构建查询参数
        const params = {
          page: 1,
          limit: 100,
          status: 'published'
        }
        
        // 如果不是"全部"分类，添加分类过滤
        if (this.categoryName !== '全部') {
          params.category = this.categoryName
        }
        
        // 从API获取文章数据
        const { articlesAPI } = await import('../utils/api.js')
        const response = await articlesAPI.getArticles(params)
        
        // 检查响应格式
        if (response && response.articles) {
          // 转换数据格式
          this.articles = response.articles.map(article => ({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            image: article.image,
            date: article.created_at,
            likes: article.likes || 0,
            views: article.views || 0,
            readingTime: article.reading_time || 5,
            tags: article.tags || [],
            author: article.author_name || '匿名'
          }))
        } else {
          this.articles = []
        }
        
      } catch (error) {
        console.error('获取文章失败:', error)
        this.articles = []
      } finally {
        this.loading = false
      }
    },
    
    getCategoryDescription(category) {
      const descriptions = {
        '技术': '分享前端开发、编程技巧和技术见解',
        '生活': '记录生活点滴、个人感悟和成长经历'
      }
      return descriptions[category] || '探索更多精彩内容'
    },
    
    formatDate(date) {
      return dayjs(date).format('YYYY年MM月DD日')
    },
    
    goToArticle(id) {
      this.$router.push(`/article/${id}`)
    }
  }
}
</script>

<style scoped>
.category-page {
  padding: var(--space-8) 0;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.category-header {
  text-align: center;
  margin-bottom: var(--space-16);
  padding: var(--space-16) var(--space-8);
  background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}

.category-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%);
}

.category-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.category-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
}

.category-stats {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--bg-tertiary);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-semibold);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.category-stats::before {
  content: '📊';
  font-size: var(--text-base);
}

.category-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-12);
  gap: var(--space-6);
  padding: var(--space-6);
  background: var(--bg-elevated);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.search-box {
  flex: 1;
  max-width: 420px;
  position: relative;
}

.search-box::before {
  content: '🔍';
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: var(--space-4) var(--space-5) var(--space-4) var(--space-12);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.search-input::placeholder {
  color: var(--text-tertiary);
  font-weight: var(--font-weight-normal);
}

.sort-select {
  padding: var(--space-4) var(--space-6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 140px;
}

.sort-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.sort-select:hover {
  border-color: var(--border-hover);
  background: var(--bg-tertiary);
}

.loading {
  text-align: center;
  padding: var(--space-20) 0;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--bg-tertiary);
  border-top: 3px solid var(--color-accent);
  border-radius: 50%;
  animation: spin var(--duration-normal) linear infinite;
  margin: 0 auto var(--space-4);
}

.loading p {
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.article-card {
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-fast);
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
}

.article-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.article-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-hover);
}

.article-card:hover::before {
  opacity: 1;
}

.article-image {
  height: 220px;
  overflow: hidden;
  margin: -1px -1px var(--space-6) -1px;
  border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
  position: relative;
}

.article-image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, var(--bg-elevated) 0%, transparent 100%);
  pointer-events: none;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-fast);
}

.article-card:hover .article-image img {
  transform: scale(1.08);
}

.article-content {
  padding: 0 var(--space-6) var(--space-6) var(--space-6);
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-semibold);
}

.article-meta .date {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.article-meta .date::before {
  content: '📅';
  font-size: var(--text-sm);
}

.article-meta .reading-time {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.article-meta .reading-time::before {
  content: '⏱️';
  font-size: var(--text-sm);
}

.article-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-3);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-excerpt {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

.tag {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.tag:hover {
  background: var(--color-accent);
  color: var(--text-inverse);
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.article-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-semibold);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-color);
}

.article-stats .likes,
.article-stats .views {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.article-stats .likes:hover,
.article-stats .views:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
}

.no-articles {
  text-align: center;
  padding: var(--space-20) var(--space-8);
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.no-articles::before {
  content: '📝';
  font-size: 4rem;
  display: block;
  margin-bottom: var(--space-6);
  opacity: 0.6;
}

.no-articles h3 {
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
}

.no-articles p {
  color: var(--text-secondary);
  margin-bottom: var(--space-8);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-8);
  background: var(--color-accent);
  color: var(--text-inverse);
  text-decoration: none;
  border-radius: var(--radius-2xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn::before {
  content: '🏠';
  font-size: var(--text-base);
}

.btn:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-6);
  margin-top: var(--space-16);
  padding: var(--space-8);
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  min-width: 100px;
  justify-content: center;
}

.pagination-btn::before {
  font-size: var(--text-base);
}

.pagination-btn:first-child::before {
  content: '⬅️';
}

.pagination-btn:last-child::before {
  content: '➡️';
  order: 2;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--text-inverse);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.pagination-btn:disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--border-color);
  background: var(--bg-tertiary);
}

.pagination-info {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-3) var(--space-6);
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  white-space: nowrap;
}

/* 现代响应式设计 */
@media (max-width: 1279px) {
  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-6);
  }
}

@media (max-width: 1023px) {
  .category-header {
    padding: var(--space-12) var(--space-6);
    margin-bottom: var(--space-12);
  }
  
  .category-title {
    font-size: var(--text-3xl);
  }
  
  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
  }
}

@media (max-width: 767px) {
  .category-page {
    padding: var(--space-6) 0;
  }
  
  .category-header {
    padding: var(--space-10) var(--space-4);
    margin-bottom: var(--space-10);
  }
  
  .category-title {
    font-size: var(--text-2xl);
  }
  
  .category-description {
    font-size: var(--text-base);
  }
  
  .category-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
    padding: var(--space-4);
  }
  
  .search-box {
    max-width: none;
  }
  
  .sort-select {
    min-width: auto;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-12);
  }
  
  .pagination {
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-6);
  }
  
  .pagination-btn {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 639px) {
  .category-header {
    padding: var(--space-8) var(--space-3);
  }
  
  .category-controls {
    padding: var(--space-3);
  }
  
  .article-image {
    height: 180px;
  }
  
  .no-articles {
    padding: var(--space-16) var(--space-4);
  }
  
  .no-articles::before {
    font-size: 3rem;
  }
}

@media (max-width: 479px) {
  .category-title {
    font-size: var(--text-xl);
  }
  
  .category-description {
    font-size: var(--text-sm);
  }
  
  .article-content {
    padding: 0 var(--space-4) var(--space-4) var(--space-4);
  }
  
  .article-title {
    font-size: var(--text-lg);
  }
  
  .article-excerpt {
    font-size: var(--text-xs);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
  
  .article-card,
  .pagination-btn,
  .btn,
  .tag {
    transition: none;
  }
  
  .article-card:hover,
  .pagination-btn:hover,
  .btn:hover,
  .tag:hover {
    transform: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .category-header,
  .category-controls,
  .article-card,
  .no-articles,
  .pagination {
    border-width: 2px;
  }
  
  .article-card:hover,
  .pagination-btn:hover,
  .btn:hover {
    border-color: currentColor;
  }
}
</style>