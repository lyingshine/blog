<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>现代博客平台</span>
          </div>
          <h1 class="hero-title">
            <span class="title-line">分享你的</span>
            <span class="title-highlight">精彩故事</span>
          </h1>
          <p class="hero-subtitle">在这里记录想法，分享见解，连接世界</p>
          <div class="hero-actions">
            <router-link v-if="!isAuthenticated" to="/login" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              开始创作
            </router-link>
            <router-link v-else to="/create" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              写新文章
            </router-link>
            <router-link to="/about" class="btn btn-outline">
              了解更多
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="container">
        <div class="loading">
          <div class="spinner"></div>
          <p>加载精彩内容中...</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Loading状态: {{ loading }}
          </p>
        </div>
      </div>
    </div>

    <!-- Featured Articles -->
    <section v-else-if="featuredArticles.length > 0" class="featured">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">精选文章</h2>
          <p class="section-subtitle">发现最受欢迎的内容</p>
        </div>
        <div class="articles-grid">
          <article 
            v-for="article in featuredArticles" 
            :key="article.id"
            class="article-card featured-card"
            @click="goToArticle(article.id)"
          >
            <div class="article-content">
              <div class="article-meta">
                <span class="category">{{ article.category }}</span>
                <span class="date">{{ formatDate(article.created_at) }}</span>
              </div>
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-excerpt">{{ article.excerpt }}</p>
              <div v-if="article.tags" class="article-tags">
                <span 
                  v-for="tag in article.tags" 
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Recent Articles -->
    <section v-if="!loading && recentArticles.length > 0" class="recent">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">最新文章</h2>
          <p class="section-subtitle">探索最新发布的内容</p>
        </div>
        <div class="articles-grid recent-grid">
          <article 
            v-for="article in recentArticles" 
            :key="article.id"
            class="article-card recent-card"
            @click="goToArticle(article.id)"
          >
            <div class="article-content">
              <div class="article-meta">
                <span class="category">{{ article.category }}</span>
                <span class="date">{{ formatDate(article.created_at) }}</span>
              </div>
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-excerpt">{{ article.excerpt }}</p>
              <div class="article-footer">
                <span class="read-more">阅读全文</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="17" x2="17" y2="7"/>
                  <polyline points="7,7 17,7 17,17"/>
                </svg>
              </div>
            </div>
          </article>
        </div>
        
        <div class="section-footer">
          <router-link to="/category/全部" class="btn btn-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M3 12h18"/>
              <path d="M3 18h18"/>
            </svg>
            查看所有文章
          </router-link>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <section v-if="!loading && featuredArticles.length === 0 && recentArticles.length === 0" class="empty-state">
      <div class="container">
        <div class="empty-content">
          <div class="empty-visual">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
          </div>
          <h3 class="empty-title">开启你的创作之旅</h3>
          <p v-if="!isAuthenticated" class="empty-description">
            这里还没有任何文章。<br>
            加入我们，成为第一个分享故事的作者！
          </p>
          <p v-else class="empty-description">
            还没有发布任何文章。<br>
            现在就开始创作你的第一篇博客吧！
          </p>
          <div class="empty-actions">
            <router-link v-if="!isAuthenticated" to="/login" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              立即加入
            </router-link>
            <router-link v-else to="/create" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              开始写作
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { useAuthStore } from '../stores/auth.store'
import { useArticleStore } from '../stores/article.store'
import logger from '../utils/logger'

export default {
  name: 'Home',
  setup() {
    const { isAuthenticated } = useAuthStore()
    const articleStore = useArticleStore()
    
    // 创建本地loading状态
    const localLoading = ref(true)
    
    // 强制更新函数
    const forceUpdate = () => {
      logger.debug('强制更新组件')
      localLoading.value = false
    }
    
    // 2秒后强制停止loading
    setTimeout(forceUpdate, 2000)
    
    return {
      isAuthenticated,
      articles: articleStore.articles,
      loading: localLoading,
      fetchArticles: articleStore.fetchArticles,
      forceUpdate
    }
  },
  computed: {
    featuredArticles() {
      return (this.articles || []).filter(article => article.featured).slice(0, 2)
    },
    recentArticles() {
      return (this.articles || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6)
    }
  },
  async created() {
    logger.lifecycle('Home', '组件开始加载')
    
    // 设置3秒强制超时
    const forceStopLoading = setTimeout(() => {
      logger.warn('强制停止loading状态')
      this.loading = false
    }, 3000)

    try {
      logger.debug('开始获取文章数据')
      await this.fetchArticles()
      logger.debug('文章数据获取完成')
    } catch (error) {
      logger.warn('获取文章失败', error.message)
    } finally {
      clearTimeout(forceStopLoading)
      this.loading = false
      logger.lifecycle('Home', '组件加载完成', { loading: this.loading })
      
      // 强制触发Vue更新
      this.$nextTick(() => {
        logger.debug('Vue nextTick 完成', { loading: this.loading })
        this.$forceUpdate()
      })
    }
  },
  methods: {
    goToArticle(id) {
      if (!this.isAuthenticated) {
        this.$router.push('/login')
        return
      }
      this.$router.push(`/article/${id}`)
    },
    
    formatDate(date) {
      return dayjs(date).format('MM月DD日')
    }
  }
}
</script>

<style scoped>
.home {
  width: 100%;
}

/* Hero Section - 高级简约设计 */
.hero {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--space-32) 0 var(--space-20);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--color-accent) 5%, transparent) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, color-mix(in srgb, var(--color-accent) 3%, transparent) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  margin: 0 auto;
  max-width: 800px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-secondary);
  backdrop-filter: blur(8px);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-12);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.hero-badge:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
}

.hero-title {
  font-size: var(--text-7xl);
  font-weight: var(--font-weight-extrabold);
  margin-bottom: var(--space-8);
  line-height: var(--leading-none);
  letter-spacing: -0.05em;
  color: var(--text-primary);
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
  margin-bottom: var(--space-16);
  font-weight: var(--font-weight-normal);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-inverse);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--color-accent);
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-outline:hover {
  background: var(--bg-secondary);
  border-color: var(--text-primary);
}

/* Loading - 简约化 */
.loading-section {
  padding: var(--space-20) 0;
}

.loading {
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-16);
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
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

/* Sections - 现代化布局 */
.featured,
.recent {
  padding: var(--space-20) 0;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-16);
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: var(--text-5xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: -0.03em;
  line-height: var(--leading-tight);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-relaxed);
  font-weight: var(--font-weight-normal);
}

.articles-grid {
  display: grid;
  gap: var(--space-8);
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.recent-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
}

/* Article Cards - 高级简约设计 */
.article-card {
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
  cursor: pointer;
  position: relative;
  group: hover;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-hover);
}

.article-content {
  padding: var(--space-8);
}

.featured-card .article-content {
  padding: var(--space-10);
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
}

.category {
  background: var(--color-accent);
  color: var(--text-inverse);
  padding: var(--space-1_5) var(--space-3);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-xs);
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.date {
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
}

.article-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
}

.featured-card .article-title {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-6);
}

.recent-card .article-title {
  font-size: var(--text-xl);
}

.article-excerpt {
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-6);
  font-size: var(--text-base);
}

.article-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.tag {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  padding: var(--space-1) var(--space-2_5);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.tag:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
}

.read-more {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-fast);
}

.article-card:hover .read-more {
  transform: translateX(2px);
}

.section-footer {
  text-align: center;
  margin-top: var(--space-16);
  padding: 0 var(--space-4);
}

/* Empty State - 现代化设计 */
.empty-state {
  padding: var(--space-20) 0;
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.empty-content {
  text-align: center;
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-8);
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  border: 1px solid var(--border-color);
}

.empty-visual {
  position: relative;
  margin-bottom: var(--space-12);
}

.empty-icon {
  width: 96px;
  height: 96px;
  margin: 0 auto var(--space-8);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--radius-3xl);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  position: relative;
  z-index: 2;
  border: 1px solid var(--border-color);
}

.empty-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: -0.02em;
}

.empty-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-12);
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

/* 现代响应式设计 */
@media (max-width: 639px) {
  .hero {
    padding: var(--space-20) 0 var(--space-16);
  }
  
  .hero-title {
    font-size: var(--text-5xl);
    margin-bottom: var(--space-6);
  }
  
  .hero-subtitle {
    font-size: var(--text-lg);
    margin-bottom: var(--space-12);
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }
  
  .hero-actions .btn {
    width: 100%;
    max-width: 280px;
  }
  
  .section-title {
    font-size: var(--text-3xl);
  }
  
  .section-subtitle {
    font-size: var(--text-base);
  }
  
  .articles-grid,
  .recent-grid {
    grid-template-columns: 1fr;
    padding: 0 var(--space-4);
  }
  
  .article-content {
    padding: var(--space-6);
  }
  
  .featured-card .article-content {
    padding: var(--space-8);
  }
  
  .article-title {
    font-size: var(--text-xl);
  }
  
  .featured-card .article-title {
    font-size: var(--text-2xl);
  }
  
  .empty-content {
    padding: var(--space-12) var(--space-6);
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    margin-bottom: var(--space-6);
  }
  
  .empty-title {
    font-size: var(--text-2xl);
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
    font-size: var(--text-6xl);
  }
  
  .section-title {
    font-size: var(--text-4xl);
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .recent-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .hero {
    padding: var(--space-32) 0 var(--space-24);
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

.section-header {
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.1s both;
}

.articles-grid {
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
  .section-header,
  .articles-grid {
    animation: none;
  }
  
  .article-card,
  .hero-badge,
  .tag,
  .read-more {
    transition: none;
  }
  
  .article-card:hover {
    transform: none;
  }
  
  .article-card:hover .read-more {
    transform: none;
  }
}
</style>