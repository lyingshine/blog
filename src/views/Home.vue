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
        <div class="hero-visual">
          <div class="floating-cards">
            <div class="floating-card card-1">
              <div class="card-icon">📝</div>
              <div class="card-text">写作</div>
            </div>
            <div class="floating-card card-2">
              <div class="card-icon">💡</div>
              <div class="card-text">创意</div>
            </div>
            <div class="floating-card card-3">
              <div class="card-icon">🚀</div>
              <div class="card-text">分享</div>
            </div>
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
            <div v-if="article.image" class="article-image">
              <img :src="article.image" :alt="article.title" />
              <div class="image-overlay">
                <div class="featured-badge">精选</div>
              </div>
            </div>
            <div class="article-content">
              <div class="article-meta">
                <span class="category">{{ article.category }}</span>
                <span class="date">{{ formatDate(article.date) }}</span>
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
                <span class="date">{{ formatDate(article.date) }}</span>
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
            <div class="empty-particles">
              <div class="particle"></div>
              <div class="particle"></div>
              <div class="particle"></div>
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
import dayjs from 'dayjs'
import { useAuth } from '../composables/useAuth'

export default {
  name: 'Home',
  data() {
    return {
      loading: true,
      featuredArticles: [],
      recentArticles: []
    }
  },
  setup() {
    const { isAuthenticated } = useAuth()
    return {
      isAuthenticated
    }
  },
  async created() {
    await this.fetchArticles()
  },
  methods: {
    async fetchArticles() {
      this.loading = true
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]')
        
        if (articles.length === 0) {
          this.featuredArticles = []
          this.recentArticles = []
          return
        }
        
        this.featuredArticles = articles
          .filter(article => article.featured)
          .slice(0, 2)
        
        this.recentArticles = articles
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6)
          
      } catch (error) {
        console.error('获取文章失败:', error)
      } finally {
        this.loading = false
      }
    },
    
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
  min-height: 100vh;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--color-white);
  padding: var(--space-3xl) 0;
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
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: var(--space-sm) var(--space-lg);
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: var(--space-xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: var(--space-lg);
  line-height: 1.1;
}

.title-line {
  display: block;
}

.title-highlight {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: var(--space-2xl);
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--color-white);
  color: var(--color-primary);
  font-weight: 600;
}

.btn-primary:hover {
  background: var(--color-gray-100);
  transform: translateY(-2px);
}

.hero-visual {
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  z-index: 1;
}

.floating-cards {
  position: relative;
  width: 200px;
  height: 200px;
}

.floating-card {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: float 6s ease-in-out infinite;
}

.card-1 {
  top: 0;
  left: 0;
  animation-delay: 0s;
}

.card-2 {
  top: 0;
  right: 0;
  animation-delay: 2s;
}

.card-3 {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 4s;
}

.card-icon {
  font-size: 1.5rem;
}

.card-text {
  font-size: 0.75rem;
  font-weight: 500;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Loading */
.loading-section {
  padding: var(--space-3xl) 0;
}

.loading {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-lg);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Sections */
.featured,
.recent {
  padding: var(--space-3xl) 0;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin-bottom: var(--space-md);
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--color-gray-600);
  margin: 0;
}

.articles-grid {
  display: grid;
  gap: var(--space-xl);
}

.articles-grid {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.recent-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Article Cards */
.article-card {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-200);
  transition: var(--transition-normal);
  cursor: pointer;
  position: relative;
}

.article-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
}

.featured-card {
  position: relative;
}

.article-image {
  height: 240px;
  overflow: hidden;
  position: relative;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-slow);
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: var(--space-lg);
}

.featured-badge {
  background: var(--color-accent);
  color: var(--color-white);
  padding: var(--space-xs) var(--space-md);
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
}

.article-content {
  padding: var(--space-xl);
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  font-size: 0.875rem;
}

.category {
  background: var(--color-primary);
  color: var(--color-white);
  padding: var(--space-xs) var(--space-md);
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.75rem;
}

.date {
  color: var(--color-gray-500);
  font-weight: 500;
}

.article-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--space-md);
  color: var(--color-gray-900);
  line-height: 1.3;
}

.recent-card .article-title {
  font-size: 1.25rem;
}

.article-excerpt {
  color: var(--color-gray-600);
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}

.article-tags {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
}

.tag {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.read-more {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.section-footer {
  text-align: center;
  margin-top: var(--space-3xl);
}

/* Empty State */
.empty-state {
  padding: var(--space-3xl) 0;
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.empty-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.empty-visual {
  position: relative;
  margin-bottom: var(--space-2xl);
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto var(--space-lg);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  position: relative;
  z-index: 2;
}

.empty-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  opacity: 0.3;
  animation: particle 4s ease-in-out infinite;
}

.particle:nth-child(1) {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.particle:nth-child(2) {
  top: 20%;
  right: 20%;
  animation-delay: 1.3s;
}

.particle:nth-child(3) {
  bottom: 20%;
  left: 50%;
  animation-delay: 2.6s;
}

@keyframes particle {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
}

.empty-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin-bottom: var(--space-lg);
}

.empty-description {
  font-size: 1.125rem;
  color: var(--color-gray-600);
  line-height: 1.6;
  margin-bottom: var(--space-2xl);
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-visual {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .articles-grid,
  .recent-grid {
    grid-template-columns: 1fr;
  }
  
  .empty-title {
    font-size: 1.5rem;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>