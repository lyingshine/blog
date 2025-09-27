<template>
  <div class="inspirations-page">
    <div class="container">
      <!-- Hero Section -->
      <section class="inspirations-hero">
        <div class="hero-content">
          <div class="hero-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>创意分享平台</span>
          </div>
          <h1 class="hero-title">
            <span class="title-line">分享你的</span>
            <span class="title-highlight">灵感时刻</span>
          </h1>
          <p class="hero-subtitle">记录生活的美好瞬间，分享创意想法，连接志同道合的人</p>
          <div class="hero-actions">
            <button 
              v-if="isLoggedIn" 
              @click="showCreateModal = true"
              class="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              发布灵感
            </button>
            <router-link v-else to="/login" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              登录分享
            </router-link>
            <router-link to="/about" class="btn btn-outline">
              了解更多
            </router-link>
          </div>
        </div>
      </section>

      <!-- Filter Section -->
      <section class="filter-section">
        <div class="section-header">
          <h2 class="section-title">浏览灵感</h2>
          <p class="section-subtitle">发现精彩的创意和想法</p>
        </div>
        
        <div class="filter-tabs">
          <button 
            :class="{ active: currentFilter === 'all' }"
            @click="setFilter('all')"
            class="filter-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M3 12h18"/>
              <path d="M3 18h18"/>
            </svg>
            全部
          </button>
          <button 
            v-if="isLoggedIn"
            :class="{ active: currentFilter === 'mine' }"
            @click="setFilter('mine')"
            class="filter-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            我的灵感
          </button>
          <button 
            :class="{ active: currentFilter === 'following' }"
            @click="setFilter('following')"
            class="filter-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            关注的人
          </button>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading && inspirations.length === 0" class="loading-section">
        <div class="loading">
          <div class="spinner"></div>
          <p>加载精彩内容中...</p>
        </div>
      </div>

      <!-- Inspirations Section -->
      <section v-else-if="inspirations.length > 0" class="inspirations-section">
        <div class="inspirations-list">
          <InspirationCard
            v-for="inspiration in inspirations"
            :key="inspiration.id"
            :inspiration="inspiration"
            @like="handleLike"
            @delete="handleDelete"
          />
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="section-footer">
          <button 
            @click="loadMore" 
            :disabled="loading"
            class="btn btn-outline"
          >
            <svg v-if="loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 13l3 3 7-7"/>
            </svg>
            {{ loading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </section>

      <!-- Empty State -->
      <section v-else class="empty-state">
        <div class="empty-content">
          <div class="empty-visual">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <h3>还没有灵感</h3>
          <p>成为第一个分享灵感的人吧！在这里记录你的想法和创意。</p>
          <div class="empty-actions">
            <button 
              v-if="isLoggedIn" 
              @click="showCreateModal = true"
              class="btn btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              发布灵感
            </button>
            <router-link v-else to="/login" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              登录分享
            </router-link>
            <router-link to="/" class="btn btn-outline">
              返回首页
            </router-link>
          </div>
        </div>
      </section>
    </div>

    <!-- 发布灵感弹窗 -->
    <CreateInspirationModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleInspirationCreated"
    />
  </div>
</template>

<script>
import { inspirationsAPI } from '../utils/inspirations-api'
import InspirationCard from '../components/InspirationCard.vue'
import CreateInspirationModal from '../components/CreateInspirationModal.vue'

export default {
  name: 'Inspirations',
  components: {
    InspirationCard,
    CreateInspirationModal
  },
  data() {
    return {
      inspirations: [],
      loading: false,
      currentFilter: 'all',
      currentPage: 1,
      hasMore: true,
      showCreateModal: false
    }
  },
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('blog_token')
    },
    currentUser() {
      const userStr = localStorage.getItem('blog_user')
      return userStr ? JSON.parse(userStr) : null
    }
  },
  async created() {
    await this.loadInspirations()
  },
  methods: {
    async loadInspirations(reset = true) {
      if (this.loading) return

      this.loading = true
      
      try {
        if (reset) {
          this.currentPage = 1
          this.inspirations = []
        }

        const params = {
          page: this.currentPage,
          limit: 20
        }

        if (this.currentFilter === 'mine' && this.currentUser) {
          params.user_id = this.currentUser.id
        }

        const response = await inspirationsAPI.getInspirations(params)
        
        if (reset) {
          this.inspirations = response.data.inspirations
        } else {
          this.inspirations.push(...response.data.inspirations)
        }

        this.hasMore = this.currentPage < response.data.totalPages
        
      } catch (error) {
        console.error('加载灵感失败:', error)
        this.$message?.error('加载灵感失败')
      } finally {
        this.loading = false
      }
    },

    async loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.currentPage++
      await this.loadInspirations(false)
    },

    async setFilter(filter) {
      if (filter === 'following') {
        this.$message?.info('关注功能即将上线')
        return
      }
      
      this.currentFilter = filter
      await this.loadInspirations()
    },

    handleLike() {
      if (!this.isLoggedIn) {
        this.$message?.warning('请先登录')
        return
      }
      
      // 父组件不需要处理点赞逻辑，完全由子组件处理
      // 这个方法保留是为了兼容，但实际不执行任何操作
    },

    async handleDelete(inspirationId) {
      if (!confirm('确定要删除这条灵感吗？')) return

      try {
        await inspirationsAPI.deleteInspiration(inspirationId)
        
        // 从列表中移除
        this.inspirations = this.inspirations.filter(i => i.id !== inspirationId)
        this.$message?.success('删除成功')
        
      } catch (error) {
        console.error('删除失败:', error)
        this.$message?.error('删除失败')
      }
    },

    handleInspirationCreated(newInspiration) {
      // 将新灵感添加到列表顶部
      this.inspirations.unshift(newInspiration)
      this.showCreateModal = false
      this.$message?.success('发布成功')
    }
  }
}
</script>

<style scoped>
.inspirations-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Hero Section - 简约现代化 */
.inspirations-hero {
  padding: var(--space-5xl) 0 var(--space-4xl);
  text-align: center;
  background: var(--bg-primary);
  position: relative;
}

.hero-content {
  max-width: 680px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-8);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.hero-badge:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
}

.hero-title {
  font-size: var(--text-6xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  line-height: var(--leading-none);
  letter-spacing: -0.05em;
}

.title-line {
  display: block;
  color: var(--text-secondary);
  font-weight: var(--font-weight-bold);
}

.title-highlight {
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: var(--color-accent); /* 回退颜色 */
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-12);
  line-height: var(--leading-relaxed);
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  font-weight: var(--font-weight-normal);
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

/* Filter Section - 简约化 */
.filter-section {
  margin-bottom: var(--space-16);
  padding: 0 var(--space-4);
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  font-weight: var(--font-weight-normal);
}

.filter-tabs {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
  background: var(--bg-secondary);
  padding: var(--space-1);
  border-radius: var(--radius-2xl);
  max-width: fit-content;
  margin: 0 auto;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: transparent;
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  position: relative;
  white-space: nowrap;
}

.filter-btn:hover:not(.active) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.filter-btn.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.filter-btn svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.filter-btn:hover svg,
.filter-btn.active svg {
  opacity: 1;
}

/* Loading Section - 简约化 */
.loading-section {
  margin-bottom: var(--space-16);
  padding: 0 var(--space-4);
}

.loading {
  text-align: center;
  padding: var(--space-20);
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
  max-width: 480px;
  margin: 0 auto;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--color-accent);
  border-radius: 50%;
  animation: spin var(--duration-1000) linear infinite;
  margin: 0 auto var(--space-6);
}

.loading p {
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

/* Inspirations Section - 优化布局 */
.inspirations-section {
  margin-bottom: var(--space-16);
  padding: 0 var(--space-4);
}

.inspirations-list {
  display: grid;
  gap: var(--space-8);
  max-width: 720px;
  margin: 0 auto var(--space-16);
}

.section-footer {
  text-align: center;
}

/* Empty State - 现代化设计 */
.empty-state {
  margin-bottom: var(--space-16);
  padding: 0 var(--space-4);
}

.empty-content {
  text-align: center;
  padding: var(--space-20) var(--space-8);
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
  max-width: 560px;
  margin: 0 auto;
}

.empty-visual {
  margin-bottom: var(--space-12);
}

.empty-icon {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-3xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-8);
  color: var(--text-tertiary);
  border: 1px solid var(--border-color);
}

.empty-content h3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: -0.02em;
}

.empty-content p {
  color: var(--text-secondary);
  font-size: var(--text-base);
  margin-bottom: var(--space-12);
  line-height: var(--leading-relaxed);
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}

.empty-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

/* 现代响应式设计 */
@media (max-width: 639px) {
  .inspirations-hero {
    padding: var(--space-20) 0 var(--space-16);
  }
  
  .hero-title {
    font-size: var(--text-4xl);
    margin-bottom: var(--space-4);
  }
  
  .hero-subtitle {
    font-size: var(--text-lg);
    margin-bottom: var(--space-8);
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }
  
  .hero-actions .btn {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
  
  .section-title {
    font-size: var(--text-3xl);
  }
  
  .section-subtitle {
    font-size: var(--text-base);
  }
  
  .filter-tabs {
    gap: var(--space-1);
    padding: var(--space-1);
  }
  
  .filter-btn {
    padding: var(--space-2_5) var(--space-4);
    font-size: var(--text-xs);
  }
  
  .inspirations-list {
    gap: var(--space-6);
  }
  
  .loading {
    padding: var(--space-16);
  }
  
  .empty-content {
    padding: var(--space-16) var(--space-6);
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin-bottom: var(--space-6);
  }
  
  .empty-content h3 {
    font-size: var(--text-xl);
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }
  
  .empty-actions .btn {
    width: 100%;
    max-width: 240px;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .hero-title {
    font-size: var(--text-5xl);
  }
  
  .section-title {
    font-size: var(--text-3xl);
  }
  
  .filter-tabs {
    gap: var(--space-1_5);
  }
}

@media (min-width: 1024px) {
  .inspirations-hero {
    padding: var(--space-32) 0 var(--space-20);
  }
  
  .hero-title {
    font-size: var(--text-7xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-xl);
  }
  
  .section-title {
    font-size: var(--text-5xl);
  }
  
  .section-subtitle {
    font-size: var(--text-xl);
  }
}

/* 动画增强 */
.hero-content {
  animation: fadeInUp var(--duration-500) var(--ease-out);
}

.filter-tabs {
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.1s both;
}

.inspirations-list {
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {
  .hero-content,
  .filter-tabs,
  .inspirations-list {
    animation: none;
  }
  
  .filter-btn,
  .hero-badge {
    transition: none;
  }
}
</style>