<template>
  <div class="trash-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-left">
            <div class="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <div class="header-text">
              <h1>回收站</h1>
              <p>已删除的文章将在这里保存30天</p>
            </div>
          </div>
          <div class="header-actions">
            <button 
              v-if="trashArticles.length > 0" 
              @click="showClearConfirm = true"
              class="clear-btn"
              :disabled="loading"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
              </svg>
              清空回收站
            </button>
          </div>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="search-section" v-if="trashArticles.length > 0">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="搜索回收站中的文章..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && trashArticles.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && trashArticles.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
          </svg>
        </div>
        <h3>回收站为空</h3>
        <p>删除的文章会出现在这里，你可以选择恢复或永久删除它们。</p>
        <router-link to="/" class="back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          返回首页
        </router-link>
      </div>

      <!-- 文章列表 -->
      <div v-else class="articles-grid">
        <div
          v-for="article in trashArticles"
          :key="article.id"
          class="article-card"
        >
          <!-- 文章图片 -->
          <div class="article-image">
            <img
              v-if="article.image"
              :src="article.image"
              :alt="article.title"
              @error="handleImageError"
            />
            <div v-else class="placeholder-image">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            <div class="article-overlay">
              <span class="deleted-badge">已删除</span>
            </div>
          </div>

          <!-- 文章内容 -->
          <div class="article-content">
            <div class="article-meta">
              <span class="category">{{ article.category || '未分类' }}</span>
              <span class="deleted-time">
                删除于 {{ formatDate(article.deleted_at) }}
              </span>
            </div>

            <h3 class="article-title">{{ article.title }}</h3>
            
            <p class="article-excerpt">
              {{ article.excerpt || '暂无摘要' }}
            </p>

            <div class="article-tags" v-if="article.tags && article.tags.length > 0">
              <span
                v-for="tag in article.tags.slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
              <span v-if="article.tags.length > 3" class="tag-more">
                +{{ article.tags.length - 3 }}
              </span>
            </div>

            <div class="article-stats">
              <div class="stats-left">
                <span class="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ article.views }}
                </span>
                <span class="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {{ article.likes }}
                </span>
                <span class="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  {{ article.reading_time }}分钟
                </span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="article-actions">
              <button
                @click="handleRestore(article.id)"
                class="action-btn restore-btn"
                :disabled="loading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="1,4 1,10 7,10"/>
                  <path d="M3.51,15a9,9,0,0,0,2.13,3.09,9,9,0,0,0,13.72,0,9,9,0,0,0,0-12.72,9,9,0,0,0-13.72,0A8.5,8.5,0,0,0,1,10"/>
                </svg>
                恢复
              </button>
              <button
                @click="handlePermanentDelete(article)"
                class="action-btn delete-btn"
                :disabled="loading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                永久删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination && pagination.pages > 1" class="pagination">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page <= 1 || loading"
          class="page-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          上一页
        </button>
        
        <div class="page-numbers">
          <span class="page-info">
            第 {{ pagination.page }} 页，共 {{ pagination.pages }} 页
          </span>
        </div>
        
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.pages || loading"
          class="page-btn"
        >
          下一页
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 确认对话框 -->
    <div v-if="showClearConfirm" class="modal-overlay" @click="showClearConfirm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>确认清空回收站</h3>
          <button @click="showClearConfirm = false" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>此操作将永久删除回收站中的所有文章，无法恢复。确定要继续吗？</p>
        </div>
        <div class="modal-footer">
          <button @click="showClearConfirm = false" class="btn-secondary">取消</button>
          <button @click="handleClearTrash" class="btn-danger" :disabled="loading">
            {{ loading ? '清空中...' : '确认清空' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 永久删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>确认永久删除</h3>
          <button @click="showDeleteConfirm = false" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>确定要永久删除文章 <strong>"{{ deleteTarget?.title }}"</strong> 吗？</p>
          <p class="warning-text">此操作无法撤销！</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteConfirm = false" class="btn-secondary">取消</button>
          <button @click="confirmPermanentDelete" class="btn-danger" :disabled="loading">
            {{ loading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      <svg v-if="messageType === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {{ message }}
    </div>
  </div>
</template>

<script>
import { useArticles } from '../composables/useArticles'

export default {
  name: 'Trash',
  data() {
    return {
      searchQuery: '',
      searchTimeout: null,
      currentPage: 1,
      showClearConfirm: false,
      showDeleteConfirm: false,
      deleteTarget: null,
      message: '',
      messageType: 'success',
      pagination: null
    }
  },
  setup() {
    const {
      trashArticles,
      loading,
      error,
      fetchTrashArticles,
      restoreArticle,
      permanentDeleteArticle,
      clearTrash,
      initTrashFeature
    } = useArticles()

    return {
      trashArticles,
      loading,
      error,
      fetchTrashArticles,
      restoreArticle,
      permanentDeleteArticle,
      clearTrash,
      initTrashFeature
    }
  },
  async created() {
    await this.loadTrashArticles()
  },
  methods: {
    async loadTrashArticles() {
      try {
        const result = await this.fetchTrashArticles({
          page: this.currentPage,
          search: this.searchQuery
        })
        if (result.success) {
          this.pagination = result.pagination
        } else {
          // 如果获取失败，可能是数据库字段不存在，尝试初始化
          if (result.message.includes('deleted_at')) {
            await this.initTrashFeature()
            // 重新尝试获取
            const retryResult = await this.fetchTrashArticles({
              page: this.currentPage,
              search: this.searchQuery
            })
            if (retryResult.success) {
              this.pagination = retryResult.pagination
            }
          }
        }
      } catch (error) {
        console.error('加载回收站文章失败:', error)
      }
    },

    handleSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.loadTrashArticles()
      }, 500)
    },

    clearSearch() {
      this.searchQuery = ''
      this.currentPage = 1
      this.loadTrashArticles()
    },

    async changePage(page) {
      this.currentPage = page
      await this.loadTrashArticles()
    },

    async handleRestore(articleId) {
      try {
        const result = await this.restoreArticle(articleId)
        if (result.success) {
          this.showMessage('文章恢复成功', 'success')
          await this.loadTrashArticles()
        } else {
          this.showMessage(result.message, 'error')
        }
      } catch (error) {
        this.showMessage('恢复失败，请稍后重试', 'error')
      }
    },

    handlePermanentDelete(article) {
      this.deleteTarget = article
      this.showDeleteConfirm = true
    },

    async confirmPermanentDelete() {
      if (!this.deleteTarget) return

      try {
        const result = await this.permanentDeleteArticle(this.deleteTarget.id)
        if (result.success) {
          this.showMessage('文章永久删除成功', 'success')
          this.showDeleteConfirm = false
          this.deleteTarget = null
          await this.loadTrashArticles()
        } else {
          this.showMessage(result.message, 'error')
        }
      } catch (error) {
        this.showMessage('删除失败，请稍后重试', 'error')
      }
    },

    async handleClearTrash() {
      try {
        const result = await this.clearTrash()
        if (result.success) {
          this.showMessage('回收站清空成功', 'success')
          this.showClearConfirm = false
          await this.loadTrashArticles()
        } else {
          this.showMessage(result.message, 'error')
        }
      } catch (error) {
        this.showMessage('清空失败，请稍后重试', 'error')
      }
    },

    showMessage(text, type = 'success') {
      this.message = text
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 3000)
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60))
          return `${minutes}分钟前`
        }
        return `${hours}小时前`
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    },

    handleImageError(event) {
      event.target.style.display = 'none'
      event.target.nextElementSibling.style.display = 'flex'
    }
  }
}
</script>

<style scoped>
.trash-page {
  min-height: 100vh;
  background: var(--color-gray-50);
  padding: var(--space-xl) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

/* 页面头部 */
.page-header {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
}

.header-text h1 {
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin: 0 0 var(--space-xs) 0;
}

.header-text p {
  color: var(--color-gray-600);
  margin: 0;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-error);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.clear-btn:hover:not(:disabled) {
  background: var(--color-error-hover);
  transform: translateY(-1px);
}

.clear-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 搜索栏 */
.search-section {
  margin-bottom: var(--space-xl);
}

.search-box {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
}

.search-box svg {
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-input {
  width: 100%;
  padding: var(--space-md) var(--space-md) var(--space-md) 48px;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  background: var(--color-white);
  transition: var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.clear-search {
  position: absolute;
  right: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.clear-search:hover {
  color: var(--color-gray-600);
  background: var(--color-gray-100);
}

/* 加载和空状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: var(--space-4xl);
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-lg);
}

.empty-icon {
  color: var(--color-gray-300);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: var(--space-md);
}

.empty-state p {
  color: var(--color-gray-600);
  margin-bottom: var(--space-xl);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: var(--transition-fast);
}

.back-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* 文章网格 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.article-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: var(--transition-normal);
  border: 1px solid var(--color-gray-200);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.article-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  background: var(--color-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-400);
}

.article-overlay {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
}

.deleted-badge {
  background: var(--color-error);
  color: var(--color-white);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
}

.article-content {
  padding: var(--space-xl);
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
  font-size: 0.875rem;
}

.category {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-weight: 600;
}

.deleted-time {
  color: var(--color-gray-500);
}

.article-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: var(--space-md);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-excerpt {
  color: var(--color-gray-600);
  line-height: 1.6;
  margin-bottom: var(--space-md);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.tag {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-more {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
}

.article-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-gray-100);
}

.stats-left {
  display: flex;
  gap: var(--space-md);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.article-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.restore-btn {
  background: var(--color-success);
  color: var(--color-white);
}

.restore-btn:hover:not(:disabled) {
  background: var(--color-success-hover);
}

.delete-btn {
  background: var(--color-error);
  color: var(--color-white);
}

.delete-btn:hover:not(:disabled) {
  background: var(--color-error-hover);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.page-btn:disabled {
  background: var(--color-gray-300);
  cursor: not-allowed;
}

.page-info {
  color: var(--color-gray-600);
  font-weight: 500;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
}

.modal {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xl);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.modal-close:hover {
  color: var(--color-gray-600);
  background: var(--color-gray-100);
}

.modal-body {
  padding: var(--space-xl);
}

.modal-body p {
  color: var(--color-gray-700);
  line-height: 1.6;
  margin: 0 0 var(--space-md) 0;
}

.warning-text {
  color: var(--color-error);
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-xl);
  border-top: 1px solid var(--color-gray-200);
}

.btn-secondary {
  flex: 1;
  padding: var(--space-md);
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--color-gray-200);
}

.btn-danger {
  flex: 1;
  padding: var(--space-md);
  background: var(--color-error);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-error-hover);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 消息提示 */
.message {
  position: fixed;
  top: var(--space-xl);
  right: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

.message.success {
  background: var(--color-success);
  color: var(--color-white);
}

.message.error {
  background: var(--color-error);
  color: var(--color-white);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-md);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .pagination {
    flex-direction: column;
    gap: var(--space-md);
  }

  .modal-overlay {
    padding: var(--space-md);
  }

  .message {
    right: var(--space-md);
    left: var(--space-md);
  }
}
</style>