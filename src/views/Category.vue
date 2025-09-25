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
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 从localStorage获取文章数据
        const allArticles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
        
        // 根据分类过滤文章
        if (this.categoryName === '全部') {
          this.articles = allArticles
        } else {
          this.articles = allArticles.filter(article => article.category === this.categoryName)
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
  padding: 2rem 0;
}

.category-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 1rem;
}

.category-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;
}

.category-description {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.category-stats {
  font-size: 0.875rem;
  color: #9ca3af;
}

.category-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.sort-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.article-card {
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.article-image {
  height: 200px;
  overflow: hidden;
  margin: -1.5rem -1.5rem 1rem -1.5rem;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.article-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1f2937;
  line-height: 1.4;
}

.article-excerpt {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.article-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.article-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

.no-articles {
  text-align: center;
  padding: 4rem 0;
}

.no-articles h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.no-articles p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .category-title {
    font-size: 2rem;
  }
  
  .category-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>