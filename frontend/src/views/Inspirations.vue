<template>
  <div class="inspirations-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">灵感</h1>
            <p class="page-description">记录生活中的美好瞬间，分享你的创意想法和思考感悟</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="container">
        <div class="filter-content">
          <!-- 发布区域 -->
          <div class="publish-filter">
            <div class="filter-label">发布灵感</div>
            <div class="publish-form">
              <textarea
                v-model="newInspiration"
                placeholder="分享你的灵感时刻..."
                class="inspiration-input"
                rows="2"
                maxlength="500"
                :disabled="!isLoggedIn"
              ></textarea>
              <div class="form-row">
                <select v-model="inspirationCategory" class="category-select" :disabled="!isLoggedIn">
                  <option value="">选择分类</option>
                  <option value="技术">技术</option>
                  <option value="生活">生活</option>
                  <option value="随笔">随笔</option>
                  <option value="教程">教程</option>
                </select>
                <div class="char-count" :class="{ warning: newInspiration.length > 450 }">
                  {{ newInspiration.length }}/500
                </div>
              </div>
              <div class="publish-actions">
                <button 
                  v-if="!isLoggedIn"
                  @click="$router.push('/login')"
                  class="btn btn-primary"
                >
                  登录发布
                </button>
                <button 
                  v-else
                  @click="publishInspiration"
                  :disabled="!newInspiration.trim() || !inspirationCategory || publishing"
                  class="btn btn-primary"
                >
                  <svg v-if="publishing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                  </svg>
                  {{ publishing ? '发布中...' : '发布灵感' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 分类筛选 -->
          <div class="category-filter-section">
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

          <!-- 筛选选项 -->
          <div class="sort-filter">
            <div class="filter-label">筛选方式</div>
            <select v-model="currentFilter" class="sort-select">
              <option value="all">全部灵感</option>
              <option v-if="isLoggedIn" value="mine">我的灵感</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 灵感列表 -->
    <div class="inspirations-section">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading && inspirations.length === 0" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="inspirations.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3>{{ getEmptyStateTitle() }}</h3>
          <p>{{ getEmptyStateDescription() }}</p>
        </div>

        <!-- 灵感网格 -->
        <div v-else class="inspirations-grid">
          <InspirationCard
            v-for="inspiration in paginatedInspirations"
            :key="inspiration.id"
            :inspiration="inspiration"
            @like="handleLike"
            @delete="handleDelete"
            @delete-error="handleDeleteError"
          />
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
import { inspirationsAPI } from '../utils/inspirations-api'
import { getAvatarUrl } from '../utils/image-url'
import InspirationCard from '../components/InspirationCard.vue'
import message from '../utils/message'

export default {
  name: 'Inspirations',
  components: {
    InspirationCard
  },
  data() {
    return {
      newInspiration: '',
      inspirationCategory: '',
      publishing: false,
      inspirations: [],
      loading: false,
      selectedCategory: null,
      currentFilter: 'all',
      currentPage: 1,
      inspirationsPerPage: 12
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('blog_token')
    },
    currentUser() {
      const userStr = localStorage.getItem('blog_user')
      return userStr ? JSON.parse(userStr) : null
    },

    // 获取所有可用分类
    availableCategories() {
      const categories = new Set()
      this.inspirations.forEach(inspiration => {
        if (inspiration.category) {
          categories.add(inspiration.category)
        }
      })
      return Array.from(categories).sort()
    },

    // 筛选后的灵感
    filteredInspirations() {
      let filtered = [...this.inspirations]

      // 按分类筛选
      if (this.selectedCategory) {
        filtered = filtered.filter(inspiration => 
          inspiration.category === this.selectedCategory
        )
      }

      // 按筛选条件筛选
      if (this.currentFilter === 'mine' && this.currentUser) {
        filtered = filtered.filter(inspiration => 
          inspiration.user_id === this.currentUser.id
        )
      }

      // 按时间排序（最新在前）
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return filtered
    },

    // 分页后的灵感
    paginatedInspirations() {
      const start = (this.currentPage - 1) * this.inspirationsPerPage
      const end = start + this.inspirationsPerPage
      return this.filteredInspirations.slice(start, end)
    },

    // 总页数
    totalPages() {
      return Math.ceil(this.filteredInspirations.length / this.inspirationsPerPage)
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
    
    currentFilter() {
      this.currentPage = 1
    }
  },

  async created() {
    await this.loadInspirations()
  },

  methods: {
    getAvatarUrl(avatarPath, username) {
      return getAvatarUrl(avatarPath, username)
    },

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

    async publishInspiration() {
      if (!this.newInspiration.trim() || !this.inspirationCategory || this.publishing) return

      this.publishing = true
      try {
        const response = await inspirationsAPI.createInspiration({
          content: this.newInspiration.trim(),
          category: this.inspirationCategory
        })

        // 将新灵感添加到列表顶部
        this.inspirations.unshift(response.data.inspiration)
        this.newInspiration = ''
        this.inspirationCategory = ''
        
        message.success('灵感发布成功！')
      } catch (error) {
        console.error('发布灵感失败:', error)
        message.error(error.response?.data?.error || '发布失败，请重试')
      } finally {
        this.publishing = false
      }
    },

    async loadInspirations() {
      if (this.loading) return

      this.loading = true
      
      try {
        const params = {
          page: 1,
          limit: 100 // 加载更多数据用于前端分页
        }

        const response = await inspirationsAPI.getInspirations(params)
        this.inspirations = response.data.inspirations
        
      } catch (error) {
        console.error('加载灵感失败:', error)
        message.error('加载灵感失败')
      } finally {
        this.loading = false
      }
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },

    handleLike() {
      if (!this.isLoggedIn) {
        message.warning('请先登录')
        return
      }
    },

    handleDelete(inspirationId) {
      this.inspirations = this.inspirations.filter(i => i.id !== inspirationId)
      message.success('删除成功')
    },

    handleDeleteError({ inspirationId, error }) {
      console.error('删除失败:', error)
      
      if (error.response?.status === 404) {
        message.warning('该灵感已不存在，将从列表中移除')
        this.inspirations = this.inspirations.filter(i => i.id !== inspirationId)
      } else if (error.response?.status === 403) {
        message.error('无权删除此灵感')
      } else if (error.response?.status === 401) {
        message.error('请先登录')
      } else {
        message.error('删除失败')
      }
    },

    getEmptyStateTitle() {
      if (this.selectedCategory && this.currentFilter === 'mine') {
        return `在"${this.selectedCategory}"分类中还没有发布灵感`
      } else if (this.selectedCategory) {
        return `"${this.selectedCategory}"分类暂无灵感`
      } else if (this.currentFilter === 'mine') {
        return '还没有发布灵感'
      } else {
        return '暂无灵感'
      }
    },

    getEmptyStateDescription() {
      if (this.selectedCategory && this.currentFilter === 'mine') {
        return '在上方编辑框中分享你在这个分类的第一个灵感吧！'
      } else if (this.selectedCategory) {
        return '成为第一个在这个分类分享灵感的人'
      } else if (this.currentFilter === 'mine') {
        return '在上方编辑框中分享你的第一个灵感吧！'
      } else {
        return '成为第一个分享灵感的人'
      }
    }
  }
}
</script>

<style scoped>
.inspirations-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* 页面头部 - 完全复制文章页面样式 */
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

/* 筛选区域 - 完全复制文章页面样式 */
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
  align-items: flex-start;
  gap: var(--space-12);
  flex-wrap: wrap;
}

.filter-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.publish-filter {
  flex: 1;
  min-width: 300px;
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.inspiration-input {
  width: 100%;
  min-height: 60px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  resize: vertical;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.inspiration-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
  background: var(--bg-primary);
}

.inspiration-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.inspiration-input::placeholder {
  color: var(--text-tertiary);
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.category-select {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.category-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.publish-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-3);
}

.char-count {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.char-count.warning {
  color: var(--color-warning);
}

.category-filter-section {
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

/* 灵感区域 - 完全复制文章页面样式 */
.inspirations-section {
  padding: var(--space-12) 0;
}

/* 加载状态 - 完全复制文章页面样式 */
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

/* 空状态 - 完全复制文章页面样式 */
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

/* 灵感网格 - 完全复制文章页面样式 */
.inspirations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-8);
}

/* 分页 - 完全复制文章页面样式 */
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

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: translateY(-1px);
}

/* 响应式设计 - 完全复制文章页面样式 */
@media (max-width: 1023px) {
  .inspirations-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
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
  
  .category-filter-section {
    min-width: auto;
  }
  
  .publish-filter {
    min-width: auto;
  }
  
  .inspirations-grid {
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

  .form-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }

  .publish-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }

  .char-count {
    text-align: center;
  }
}

@media (max-width: 639px) {
  .publish-form {
    gap: var(--space-2);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .pagination-btn,
  .pagination-number,
  .inspiration-input,
  .btn {
    transition: none;
  }
  
  .pagination-btn:hover,
  .pagination-number:hover,
  .btn:hover {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .pagination-btn,
  .pagination-number,
  .inspiration-input,
  .btn {
    border-width: 2px;
  }
  
  .pagination-btn:hover,
  .pagination-number:hover {
    border-color: currentColor;
  }
}

/* 容器样式 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (max-width: 639px) {
  .container {
    padding: 0 var(--space-3);
  }
}
</style>