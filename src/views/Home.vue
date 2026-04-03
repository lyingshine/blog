<template>
  <div class="home" ref="homeRef">
    <!-- Hero Section -->
    <header class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-line">{{ heroTitle }}</span>
          <span class="title-line title-accent">{{ heroHeadline }}</span>
        </h1>
        <p class="hero-subtitle">{{ heroSubtitle }}</p>
        <div class="hero-stats">
          <span class="stat">{{ articles.length }} 篇文章</span>
          <span class="stat-divider">·</span>
          <span class="stat">{{ statuses.length }} 条动态</span>
          <span class="stat-divider">·</span>
          <span class="stat">{{ totalReadTime }} 分钟阅读</span>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="decoration-circle"></div>
        <div class="decoration-circle"></div>
        <div class="decoration-circle"></div>
      </div>
    </header>

    <!-- Articles Section -->
    <section class="articles-section">
      <div class="section-header">
        <h2 class="section-title">我的文章</h2>
        <div class="section-line"></div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-button">重试</button>
      </div>

      <!-- Articles Grid -->
      <div v-else-if="articles.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <h3 class="empty-title">还没有文章</h3>
        <p class="empty-text">从第一篇文章开始沉淀你的思考。</p>
        <router-link v-if="!authStore.isLoggedIn" to="/login" class="empty-btn">去登录</router-link>
        <router-link v-else to="/write" class="empty-btn">写文章</router-link>
      </div>

      <div v-else class="articles-grid">
        <article
          v-for="(article, index) in articles"
          :key="article.id"
          class="article-card"
          :style="{ '--delay': `${index * 0.1}s` }"
          @mouseenter="handleCardHover(article.id)"
          @mouseleave="handleCardLeave"
        >
          <router-link :to="`/article/${article.id}`" class="article-link">
            <div class="article-image">
              <div class="image-overlay"></div>
              <span class="article-number">{{ String(index + 1).padStart(2, '0') }}</span>
            </div>

            <div class="article-body">
              <div class="article-meta-top">
                <span class="article-category">{{ article.category }}</span>
                <span class="article-read-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ article.readTime }} 分钟
                </span>
              </div>

              <h2 class="article-title">{{ article.title }}</h2>
              <p class="article-excerpt">{{ article.excerpt }}</p>

              <div class="article-footer">
                <span class="article-date">{{ formatDate(article.date) }}</span>
                <span class="read-action">
                  <span class="action-text">阅读全文</span>
                  <span class="action-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </span>
              </div>
            </div>
          </router-link>
        </article>
      </div>
    </section>

    <!-- Statuses Section -->
    <section class="statuses-section" v-if="authStore.isLoggedIn">
      <div class="section-header">
        <h2 class="section-title">我的动态</h2>
        <div class="section-line"></div>
      </div>

      <div v-if="statuses.length === 0" class="empty-state small">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3 class="empty-title">还没有动态</h3>
        <p class="empty-text">开始发布第一条动态吧。</p>
        <router-link to="/moments" class="empty-btn">发动态</router-link>
      </div>

      <div v-else class="statuses-list">
        <div v-for="status in statuses" :key="status.id" class="status-card">
          <p class="status-content">{{ status.content }}</p>
          <span class="status-date">{{ formatDate(status.date) }}</span>
        </div>
      </div>
    </section>

    <!-- Back to Top -->
    <Transition name="fade">
      <button
        v-if="showBackToTop"
        class="back-to-top"
        @click="scrollToTop"
        aria-label="回到顶部"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import apiService from '../api'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const homeRef = ref(null)
const showBackToTop = ref(false)
const hoveredCard = ref(null)
const loading = ref(true)
const error = ref(null)

const articles = ref([])
const statuses = ref([])

const heroTitle = computed(() => {
  if (authStore.isLoggedIn) {
    return ''
  }
  return '欢迎来到 MySelf'
})

const heroHeadline = computed(() => {
  if (authStore.isLoggedIn) {
    return authStore.user?.headline || '记录生活，沉淀思考'
  }
  return '把日常，写成作品'
})

const heroSubtitle = computed(() => {
  if (authStore.isLoggedIn) {
    return '这里收纳你的文章、动态与长期想法'
  }
  return '一个面向所有兴趣与主题的个人记录空间'
})

const totalReadTime = computed(() => {
  return articles.value.reduce((sum, article) => sum + (article.readTime || 0), 0)
})

const fetchData = async () => {
  loading.value = true
  error.value = null

  try {
    if (authStore.isLoggedIn) {
      const userId = authStore.user?.id
      const [articlesRes, statusesRes] = await Promise.all([
        apiService.getArticles(),
        apiService.getStatuses()
      ])
      articles.value = (articlesRes.data.articles || [])
        .map((a) => ({
          ...a,
          authorId: a.authorId ?? a.author_id,
          readTime: a.readTime ?? a.read_time ?? 0,
          date: a.date ?? a.created_at
        }))
        .filter((a) => Number(a.authorId) === Number(userId))

      statuses.value = (statusesRes.data || [])
        .map((s) => ({
          ...s,
          authorId: s.authorId ?? s.author_id,
          date: s.date ?? s.created_at
        }))
        .filter((s) => Number(s.authorId) === Number(userId))
    } else {
      articles.value = []
      statuses.value = []
    }
  } catch (err) {
    error.value = '获取数据失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleCardHover = (id) => {
  hoveredCard.value = id
}

const handleCardLeave = () => {
  hoveredCard.value = null
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
}

/* Hero Section */
.hero {
  position: relative;
  padding: 56px 22px 44px;
  max-width: 980px;
  margin: 0 auto;
  overflow: visible;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-title {
  font-size: clamp(32px, 4.4vw, 44px);
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 14px;
}

.title-line {
  display: block;
  color: var(--color-text-primary);
}

.title-accent {
  background: none;
  -webkit-text-fill-color: currentColor;
  color: var(--color-text-primary);
}

.hero-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  font-weight: 400;
  margin-bottom: 16px;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.stat-divider {
  opacity: 0.5;
}

.hero-decoration {
  display: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 0.03;
}

.decoration-circle:nth-child(1) {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.decoration-circle:nth-child(2) {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.decoration-circle:nth-child(3) {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Articles Section */
.articles-section {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px 72px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: var(--color-border-light);
}

/* Article Cards */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.article-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: none;
  border: 1px solid var(--color-border-light);
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  animation: none;
  opacity: 1;
  box-shadow: var(--ux-shadow-soft);
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
}

.articles-grid .article-card:nth-child(1) { animation-delay: 30ms; }
.articles-grid .article-card:nth-child(2) { animation-delay: 60ms; }
.articles-grid .article-card:nth-child(3) { animation-delay: 90ms; }
.articles-grid .article-card:nth-child(4) { animation-delay: 120ms; }
.articles-grid .article-card:nth-child(5) { animation-delay: 150ms; }
.articles-grid .article-card:nth-child(6) { animation-delay: 180ms; }

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

.article-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--ux-shadow-card);
  border-color: color-mix(in srgb, var(--color-accent) 22%, var(--color-border));
}

.article-link {
  display: block;
  text-decoration: none;
  color: inherit;
  min-height: 100%;
}

.article-image {
  height: 62px;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-surface-elevated) 96%, transparent),
      color-mix(in srgb, var(--color-surface) 96%, transparent)
    );
  border-bottom: 1px solid var(--color-border-light);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 7%, transparent), transparent);
  transition: none;
}

.article-card:hover .image-overlay {
  opacity: 1;
}

.article-number {
  position: absolute;
  right: 12px;
  top: 10px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  font-weight: 700;
  opacity: 0.65;
}

.article-card:hover .article-number {
  color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.article-body {
  padding: 14px 15px 15px;
}

.article-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.article-category {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 12px;
  font-weight: 500;
}

.article-read-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.article-title {
  font-size: 17px;
  font-weight: 650;
  color: var(--color-text-primary);
  line-height: 1.35;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
  transition: none;
}

.article-card:hover .article-title {
  color: var(--color-text-primary);
}

.article-excerpt {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-light);
}

.article-date {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.read-action {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.action-arrow {
  display: flex;
  align-items: center;
  transition: transform 0.18s var(--ux-ease);
}

.article-card:hover .action-arrow {
  transform: translateX(2px);
}

/* Back to Top */
.back-to-top {
  position: fixed;
  bottom: calc(28px + var(--safe-bottom));
  right: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-text-primary);
  box-shadow: none;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 100;
}

.back-to-top:hover {
  background: color-mix(in srgb, var(--color-accent-subtle) 58%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--color-text-tertiary);
  text-align: center;
}

.empty-state svg {
  margin-bottom: 20px;
  opacity: 0.4;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}

.empty-text {
  font-size: 15px;
  margin: 0 0 24px;
}

.empty-btn {
  padding: 10px 24px;
  background: var(--color-accent);
  color: white;
  border-radius: 980px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease, transform 0.18s var(--ux-ease), box-shadow 0.2s var(--ux-ease);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--color-accent) 28%, transparent);
}

.empty-btn:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--color-text-secondary);
}

.retry-button {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 980px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.18s var(--ux-ease);
}

.retry-button:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Statuses Section */
.statuses-section {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px 100px;
}

.statuses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all var(--transition-fast);
  box-shadow: var(--ux-shadow-soft);
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
}

.statuses-list .status-card:nth-child(1) { animation-delay: 40ms; }
.statuses-list .status-card:nth-child(2) { animation-delay: 80ms; }
.statuses-list .status-card:nth-child(3) { animation-delay: 120ms; }
.statuses-list .status-card:nth-child(4) { animation-delay: 160ms; }

.status-card:hover {
  border-color: color-mix(in srgb, var(--color-accent) 24%, var(--color-border-light));
  transform: translateY(-1px);
}

.status-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 12px;
}

.status-date {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.empty-state.small {
  padding: 48px 0;
}

.empty-state.small svg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}

.empty-state.small .empty-title {
  font-size: 16px;
}

.empty-state.small .empty-text {
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 56px 16px 40px;
  }

  .hero-title {
    font-size: 34px;
  }

  .hero-subtitle {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .hero-stats {
    gap: 8px;
    font-size: 13px;
  }

  .stat-divider {
    display: none;
  }

  .articles-section {
    padding: 0 16px 68px;
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .article-image {
    height: 56px;
  }

  .article-body {
    padding: 14px;
  }

  .back-to-top {
    bottom: calc(16px + var(--safe-bottom));
    right: 20px;
    width: 44px;
    height: 44px;
  }

  .statuses-section {
    padding: 0 16px calc(84px + var(--safe-bottom));
  }
}

@media (max-width: 420px) {
  .hero-title {
    font-size: 30px;
  }

  .article-title {
    font-size: 17px;
  }
}
</style>


