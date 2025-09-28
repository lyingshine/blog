g<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-background">
        <div class="hero-gradient"></div>
        <div class="hero-pattern"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <div class="badge-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span class="badge-text">心里裹着光的人</span>
          </div>
          <h1 class="hero-title">
            <span class="title-main">世界</span>
            <span class="title-highlight">很宽</span>
            <div class="title-decoration"></div>
          </h1>
          <p class="hero-subtitle">
            <span class="subtitle-text">出发就走得到，来时的路不会被剪断</span>
          </p>
          <div class="hero-actions">
            <router-link to="/articles" class="btn btn-primary hero-btn">
              <span class="btn-content">
                <span>浏览文章</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="17" x2="17" y2="7"/>
                  <polyline points="7,7 17,7 17,17"/>
                </svg>
              </span>
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- 向下滑动引导 -->
      <div class="scroll-indicator" @click="scrollToContent">
        <div class="scroll-text">向下探索</div>
        <div class="scroll-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 13l3 3 3-3"/>
            <path d="M7 6l3 3 3-3"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="container">
        <div class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Loading状态: {{ loading }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content Section - 最新动态 -->
    <section v-if="!loading" class="content-section" id="content-section">
      <div class="container">
        <div class="main-content">
          <!-- Recent Articles & Inspirations -->
          <div class="content-card">
            <div class="content-card-header">
              <div class="section-header-content">
                <div class="section-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div class="section-text">
                  <h2 class="section-title">最新动态</h2>
                  <p class="section-description">探索最新的文章和灵感</p>
                </div>
              </div>
              <div class="nav-pills">
                <button 
                  @click="activeTab = 'articles'" 
                  :class="{ active: activeTab === 'articles' }"
                  class="nav-pill"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <span>文章</span>
                </button>
                <button 
                  @click="activeTab = 'inspirations'" 
                  :class="{ active: activeTab === 'inspirations' }"
                  class="nav-pill"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <span>灵感</span>
                </button>
              </div>
            </div>

            <!-- Recent Articles Tab -->
            <div v-if="activeTab === 'articles'" class="tab-content">
              <div v-if="recentArticles.length > 0" class="content-grid">
                <article 
                  v-for="article in recentArticles.slice(0, 6)" 
                  :key="article.id"
                  class="card article-card"
                  @click="goToArticle(article.id)"
                >
                  <div class="card-decoration"></div>
                  <div class="card-content">
                    <div class="article-meta">
                      <span class="category-badge">{{ article.category }}</span>
                      <span class="article-date">{{ formatDate(article.created_at) }}</span>
                    </div>
                    <h3 class="article-title">{{ article.title }}</h3>
                    <p class="article-excerpt">{{ article.excerpt }}</p>
                    <div class="article-footer">
                      <span class="read-more-text">阅读全文</span>
                      <div class="read-more-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="7" y1="17" x2="17" y2="7"/>
                          <polyline points="7,7 17,7 17,17"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="empty-state-inline">
                <div class="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <p class="empty-text">暂无文章</p>
              </div>
            </div>

            <!-- Inspirations Tab -->
            <div v-if="activeTab === 'inspirations'" class="tab-content">
              <div v-if="recentInspirations.length > 0" class="inspirations-grid">
                <div 
                  v-for="inspiration in recentInspirations.slice(0, 6)" 
                  :key="inspiration.id"
                  class="card inspiration-card"
                  @click="goToInspiration(inspiration.id)"
                >
                  <div class="inspiration-content">
                    <div class="inspiration-quote">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                      </svg>
                    </div>
                    <p class="inspiration-text">{{ inspiration.content }}</p>
                    <div class="inspiration-meta">
                      <span class="inspiration-date">{{ formatDate(inspiration.created_at) }}</span>
                      <div class="inspiration-actions">
                        <button class="like-btn" :class="{ liked: inspiration.liked }">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          <span class="like-count">{{ inspiration.likes || 0 }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state-inline">
                <div class="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <p class="empty-text">暂无灵感</p>
              </div>
            </div>
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
    const activeTab = ref('articles')
    
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
      activeTab,
      fetchArticles: articleStore.fetchArticles,
      forceUpdate,
      currentSection: 0, // 0: 英雄区域, 1: 内容区域
      isScrolling: false, // 防止滚动冲突
      touchStartY: null // 触摸起始位置
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
    },
    recentInspirations() {
      // 模拟灵感数据，实际应该从store获取
      return [
        {
          id: 1,
          content: '今天看到一句话：世界很宽，出发就走得到。突然觉得很有道理，人生就是要勇敢地迈出第一步。',
          created_at: new Date().toISOString(),
          likes: 12
        },
        {
          id: 2,
          content: '代码如诗，每一行都承载着思考的重量。',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          likes: 8
        },
        {
          id: 3,
          content: '学会在忙碌中找到内心的平静，这是一种能力。',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          likes: 15
        }
      ]
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
  
  mounted() {
    // 添加滚动事件监听
    window.addEventListener('scroll', this.handleScroll)
    // 添加滚轮事件监听实现翻页
    window.addEventListener('wheel', this.handleWheel, { passive: false })
    // 添加键盘事件监听
    window.addEventListener('keydown', this.handleKeydown)
    // 添加触摸事件监听
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true })
    
    // 初始化滑动引导组件状态
    this.updateScrollIndicator()
  },
  
  beforeUnmount() {
    // 移除所有事件监听
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('touchstart', this.handleTouchStart)
    window.removeEventListener('touchend', this.handleTouchEnd)
  },
  methods: {
    goToArticle(id) {
      if (!this.isAuthenticated) {
        this.$router.push('/login')
        return
      }
      this.$router.push(`/article/${id}`)
    },
    
    goToInspiration(id) {
      this.$router.push(`/inspirations`)
    },
    
    formatDate(date) {
      return dayjs(date).format('MM月DD日')
    },
    
    scrollToContent() {
      this.currentSection = 1
      this.updatePagePosition()
    },
    
    handleScroll() {
      // 防抖处理
      if (this.isScrolling) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      
      // 判断当前在哪个区域
      if (scrollTop < windowHeight / 2) {
        if (this.currentSection !== 0) {
          this.currentSection = 0
          this.updateScrollIndicator()
        }
      } else {
        if (this.currentSection !== 1) {
          this.currentSection = 1
          this.updateScrollIndicator()
        }
      }
    },
    
    handleWheel(event) {
      event.preventDefault()
      
      if (this.isScrolling) return
      
      const delta = event.deltaY
      
      if (delta > 0 && this.currentSection === 0) {
        // 向下滚动，从英雄区域到内容区域
        this.currentSection = 1
        this.updatePagePosition()
      } else if (delta < 0 && this.currentSection === 1) {
        // 向上滚动，从内容区域到英雄区域
        this.currentSection = 0
        this.updatePagePosition()
      }
    },
    
    updatePagePosition() {
      this.isScrolling = true
      const targetY = this.currentSection === 0 ? 0 : window.innerHeight
      
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      })
      
      this.updateScrollIndicator()
      
      // 滚动完成后重置标志
      setTimeout(() => {
        this.isScrolling = false
      }, 800)
    },
    
    updateScrollIndicator() {
      const scrollIndicator = document.querySelector('.scroll-indicator')
      if (scrollIndicator) {
        if (this.currentSection === 0) {
          scrollIndicator.style.opacity = '0.6'
          scrollIndicator.style.pointerEvents = 'auto'
        } else {
          scrollIndicator.style.opacity = '0'
          scrollIndicator.style.pointerEvents = 'none'
        }
      }
    },
    
    handleKeydown(event) {
      if (this.isScrolling) return
      
      if (event.key === 'ArrowDown' && this.currentSection === 0) {
        event.preventDefault()
        this.currentSection = 1
        this.updatePagePosition()
      } else if (event.key === 'ArrowUp' && this.currentSection === 1) {
        event.preventDefault()
        this.currentSection = 0
        this.updatePagePosition()
      }
    },
    
    handleTouchStart(event) {
      this.touchStartY = event.touches[0].clientY
    },
    
    handleTouchEnd(event) {
      if (this.isScrolling || !this.touchStartY) return
      
      const touchEndY = event.changedTouches[0].clientY
      const deltaY = this.touchStartY - touchEndY
      const threshold = 50 // 最小滑动距离
      
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && this.currentSection === 0) {
          // 向上滑动（手指向上移动），从英雄区域到内容区域
          this.currentSection = 1
          this.updatePagePosition()
        } else if (deltaY < 0 && this.currentSection === 1) {
          // 向下滑动（手指向下移动），从内容区域到英雄区域
          this.currentSection = 0
          this.updatePagePosition()
        }
      }
      
      this.touchStartY = null
    }
  }
}
</script>

<style scoped>
.home {
  width: 100%;
  min-height: 100vh;
}

/* Hero Section - 现代化设计 */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(
      ellipse 120% 80% at 50% -30%,
      color-mix(in srgb, var(--color-accent) 20%, transparent) 0%,
      color-mix(in srgb, var(--color-accent) 8%, transparent) 40%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 80% 60% at 20% 100%,
      color-mix(in srgb, var(--color-primary) 15%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 100% 70% at 80% 20%,
      color-mix(in srgb, var(--color-accent) 12%, transparent) 0%,
      transparent 50%
    );
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--color-accent) 10%, transparent) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 45%),
    radial-gradient(circle at 60% 10%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 35%),
    radial-gradient(circle at 30% 80%, color-mix(in srgb, var(--color-primary) 5%, transparent) 0%, transparent 30%);
  animation: float var(--duration-slow) ease-in-out infinite;
}

.hero-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(
      135deg,
      transparent 0%,
      color-mix(in srgb, var(--bg-primary) 95%, var(--color-accent)) 50%,
      transparent 100%
    );
  opacity: 0.3;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-8);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--bg-elevated);
  backdrop-filter: blur(12px);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-16);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.hero-badge:hover {
  background: var(--bg-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  border-radius: var(--radius-full);
  color: var(--text-inverse);
}

.badge-text {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.hero-title {
  position: relative;
  font-size: clamp(var(--text-5xl), 8vw, 6rem);
  font-weight: var(--font-weight-extrabold);
  margin-bottom: var(--space-8);
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.title-main {
  display: block;
  color: var(--text-secondary);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
}

.title-highlight {
  display: block;
  background: linear-gradient(
    135deg, 
    var(--color-accent) 0%, 
    color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 50%,
    var(--color-primary) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: var(--color-accent);
  position: relative;
}

.title-decoration {
  position: absolute;
  bottom: -var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
  border-radius: var(--radius-full);
  opacity: 0.6;
}

.hero-subtitle {
  margin-bottom: var(--space-16);
}

.subtitle-text {
  font-size: var(--text-xl);
  color: var(--text-secondary);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
  margin: 0 auto;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn {
  position: relative;
  overflow: hidden;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  z-index: 2;
}

/* 按钮样式 - 遵循设计系统 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-2xl);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, color-mix(in srgb, white 20%, transparent) 50%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--color-accent) 90%, black);
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

/* 向下滑动引导 - 极简设计，位于首屏底部 */
.scroll-indicator {
  position: fixed;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 1000;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

/* 只在首屏显示滑动引导 */
@media (min-height: 100vh) {
  .scroll-indicator {
    display: block;
  }
}

.scroll-indicator:hover {
  opacity: 1;
}

.scroll-text {
  display: none;
}

.scroll-arrow {
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
  animation: gentleBounce 2s ease-in-out infinite;
}

.scroll-arrow svg {
  width: 100%;
  height: 100%;
}

/* 极简弹跳动画 */
@keyframes gentleBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
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

/* Content Section - 现代化布局 */
.content-section {
  background: 
    linear-gradient(
      180deg,
      var(--bg-primary) 0%,
      color-mix(in srgb, var(--bg-primary) 98%, var(--color-accent)) 50%,
      var(--bg-secondary) 100%
    );
  position: relative;
  padding: var(--space-20) var(--space-6);
}

.content-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: 
    radial-gradient(
      ellipse 100% 50% at 50% 0%,
      color-mix(in srgb, var(--color-accent) 8%, transparent) 0%,
      transparent 100%
    );
  pointer-events: none;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.content-card {
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  box-shadow: 
    var(--shadow-lg),
    0 0 0 1px color-mix(in srgb, var(--border-color) 50%, transparent);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
  padding: var(--space-12);
}

.content-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(
      circle at 20% 20%,
      color-mix(in srgb, var(--color-accent) 3%, transparent) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 80%,
      color-mix(in srgb, var(--color-primary) 2%, transparent) 0%,
      transparent 50%
    );
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.content-card:hover::after {
  opacity: 1;
}

.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.content-card:hover::before {
  opacity: 1;
}

.content-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-10);
  gap: var(--space-6);
}

.section-header-content {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  border-radius: var(--radius-xl);
  color: var(--text-inverse);
  flex-shrink: 0;
}

.section-text {
  flex: 1;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: -0.02em;
}

.section-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  font-weight: var(--font-weight-normal);
}

/* 导航胶囊 - 遵循设计系统 */
.nav-pills {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  padding: var(--space-1);
  flex-shrink: 0;
}

.nav-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-xl);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.nav-pill:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-pill.active {
  color: var(--text-primary);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
}

.tab-content {
  animation: fadeInUp var(--duration-300) var(--ease-out);
}

.content-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.inspirations-grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.empty-state-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl);
  border: 2px dashed var(--border-color);
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-2xl);
  color: var(--text-tertiary);
  margin-bottom: var(--space-4);
}

.empty-text {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--space-6) 0;
  font-weight: var(--font-weight-medium);
}

/* 卡片组件 - 遵循设计系统 */
.card {
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  padding: var(--space-8);
  box-shadow: 
    var(--shadow-sm),
    0 0 0 1px color-mix(in srgb, var(--border-color) 30%, transparent);
  border: 1px solid var(--border-color);
  transition: all var(--transition-base);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      color-mix(in srgb, var(--color-accent) 8%, transparent) 0%,
      transparent 50%
    );
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    var(--shadow-xl),
    0 20px 40px color-mix(in srgb, var(--color-accent) 15%, transparent),
    0 0 0 1px color-mix(in srgb, var(--border-color) 60%, transparent);
  border-color: color-mix(in srgb, var(--border-hover) 80%, var(--color-accent));
}

.card:hover::before {
  opacity: 1;
}

.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg, 
    var(--color-accent) 0%, 
    color-mix(in srgb, var(--color-accent) 70%, var(--color-primary)) 50%,
    var(--color-primary) 100%
  );
  opacity: 0;
  transition: all var(--transition-base);
  transform: scaleX(0);
  transform-origin: left;
}

.card:hover .card-decoration {
  opacity: 1;
  transform: scaleX(1);
}

.card-content {
  position: relative;
  z-index: 2;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  position: relative;
}

.category-badge {
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  color: var(--text-inverse);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 
    var(--shadow-sm),
    0 0 20px color-mix(in srgb, var(--color-accent) 25%, transparent);
  position: relative;
  overflow: hidden;
}

.category-badge::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, color-mix(in srgb, white 20%, transparent) 50%, transparent 100%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.card:hover .category-badge::before {
  opacity: 1;
}

.article-date {
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.article-date::before {
  content: '';
  width: 4px;
  height: 4px;
  background: var(--color-accent);
  border-radius: 50%;
  opacity: 0.6;
}

.article-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-4);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
  transition: color var(--transition-fast);
}

.card:hover .article-title {
  color: color-mix(in srgb, var(--text-primary) 90%, var(--color-accent));
}

.article-excerpt {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-6);
  font-size: var(--text-base);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
}

.article-excerpt::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30px;
  height: 1.5em;
  background: linear-gradient(90deg, transparent 0%, var(--bg-elevated) 100%);
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-accent);
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-sm);
  padding-top: var(--space-4);
  border-top: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
  margin-top: auto;
}

.read-more-text {
  transition: all var(--transition-fast);
  position: relative;
}

.read-more-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
  transition: width var(--transition-base);
}

.read-more-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.read-more-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.read-more-icon svg {
  position: relative;
  z-index: 2;
  transition: transform var(--transition-fast);
}

.card:hover .read-more-text {
  transform: translateX(6px);
}

.card:hover .read-more-text::after {
  width: 100%;
}

.card:hover .read-more-icon {
  transform: translateX(6px) scale(1.1);
  border-color: var(--color-accent);
  box-shadow: 
    var(--shadow-md),
    0 0 20px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.card:hover .read-more-icon::before {
  opacity: 1;
}

.card:hover .read-more-icon svg {
  color: var(--text-inverse);
  transform: rotate(45deg);
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

/* 灵感卡片 */
.inspiration-card {
  position: relative;
  background: linear-gradient(
    135deg,
    var(--bg-elevated) 0%,
    color-mix(in srgb, var(--bg-elevated) 98%, var(--color-accent)) 100%
  );
}

.inspiration-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(
    180deg,
    var(--color-accent) 0%,
    color-mix(in srgb, var(--color-accent) 60%, var(--color-primary)) 50%,
    var(--color-primary) 100%
  );
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.inspiration-card:hover::before {
  opacity: 1;
}

.inspiration-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  height: 100%;
  position: relative;
}

.inspiration-quote {
  position: absolute;
  top: var(--space-2);
  right: var(--space-4);
  color: var(--color-accent);
  opacity: 0.2;
  transition: all var(--transition-fast);
  transform: scale(1);
}

.inspiration-card:hover .inspiration-quote {
  opacity: 0.4;
  transform: scale(1.1);
}

.inspiration-text {
  color: var(--text-primary);
  font-size: var(--text-lg);
  line-height: var(--line-height-relaxed);
  margin: 0;
  font-style: italic;
  flex: 1;
  padding-right: var(--space-8);
  padding-top: var(--space-4);
  position: relative;
  font-weight: var(--font-weight-medium);
}

.inspiration-text::before {
  content: '"';
  position: absolute;
  top: -var(--space-2);
  left: -var(--space-2);
  font-size: var(--text-4xl);
  color: var(--color-accent);
  opacity: 0.3;
  font-family: serif;
  line-height: 1;
}

.inspiration-text::after {
  content: '"';
  position: absolute;
  bottom: -var(--space-4);
  right: var(--space-6);
  font-size: var(--text-4xl);
  color: var(--color-accent);
  opacity: 0.3;
  font-family: serif;
  line-height: 1;
}

.inspiration-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: var(--space-6);
  border-top: 1px solid color-mix(in srgb, var(--border-color) 40%, transparent);
  position: relative;
}

.inspiration-meta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
  transition: width var(--transition-base);
}

.inspiration-card:hover .inspiration-meta::before {
  width: 60px;
}

.inspiration-date {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
}

.inspiration-actions {
  display: flex;
  align-items: center;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.like-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-error), color-mix(in srgb, var(--color-error) 80%, var(--color-accent)));
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.like-btn svg {
  position: relative;
  z-index: 2;
  transition: all var(--transition-fast);
}

.like-count {
  font-weight: var(--font-weight-semibold);
  position: relative;
  z-index: 2;
  transition: color var(--transition-fast);
}

.like-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-color: var(--border-hover);
  transform: scale(1.05);
}

.like-btn:hover svg {
  transform: scale(1.1);
}

.like-btn.liked {
  color: var(--text-inverse);
  border-color: var(--color-error);
}

.like-btn.liked::before {
  opacity: 1;
}

.like-btn.liked svg {
  fill: currentColor;
  animation: heartBeat var(--duration-300) ease-out;
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
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

/* 响应式设计 - 遵循设计系统 */
@media (max-width: 639px) {
  .hero {
    min-height: 100vh;
    padding: var(--space-6) 0;
  }
  
  .hero-content {
    padding: var(--space-6);
  }
  
  .hero-badge {
    margin-bottom: var(--space-12);
  }
  
  .badge-text {
    display: none;
  }
  
  .hero-title {
    font-size: clamp(var(--text-4xl), 12vw, var(--text-5xl));
    margin-bottom: var(--space-6);
  }
  
  .subtitle-text {
    font-size: var(--text-lg);
  }
  
  .hero-actions {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .hero-btn {
    width: 100%;
    max-width: 320px;
  }
  
  .scroll-indicator {
    bottom: var(--space-6);
  }
  
  .scroll-arrow {
    width: 20px;
    height: 20px;
  }
  

  

  

  
  .content-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
  }
  
  .section-header-content {
    width: 100%;
  }
  
  .nav-pills {
    width: 100%;
    justify-content: center;
  }
  
  .content-grid,
  .inspirations-grid {
    grid-template-columns: 1fr;
  }
  
  .card {
    padding: var(--space-6);
  }
  
  .article-title {
    font-size: var(--text-lg);
  }
  
  .empty-state-inline {
    padding: var(--space-12) var(--space-6);
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .hero-content {
    padding: var(--space-8);
  }
  

  

  
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .inspirations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .inspirations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .inspirations-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 动画系统 - 遵循设计系统 */
.hero-content {
  animation: fadeInUp var(--duration-700) var(--ease-out);
}

.content-card {
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.2s both;
}

.card {
  animation: fadeInScale var(--duration-300) var(--ease-out) both;
}

.card:nth-child(1) { animation-delay: 0.1s; }
.card:nth-child(2) { animation-delay: 0.2s; }
.card:nth-child(3) { animation-delay: 0.3s; }
.card:nth-child(4) { animation-delay: 0.4s; }
.card:nth-child(5) { animation-delay: 0.5s; }
.card:nth-child(6) { animation-delay: 0.6s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(1deg);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 减少动画偏好支持 - 遵循无障碍标准 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .hero-pattern {
    animation: none;
  }
  
  .scroll-arrow {
    animation: none;
  }
  
  .card:hover {
    transform: none;
  }
  
  .btn:hover {
    transform: none;
  }
  
  .scroll-indicator:hover {
    transform: translateX(-50%);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .card,
  .btn,
  .nav-pill {
    border-width: 2px;
  }
  
  .card:hover,
  .btn:hover {
    border-color: currentColor;
  }
}
</style>