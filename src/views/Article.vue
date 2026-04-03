<template>
  <div class="article-page">
    <!-- Reading Progress -->
    <ReadingProgress v-if="article" target=".article-body" />

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchArticle(route.params.id)" class="retry-button">重试</button>
    </div>

    <div v-else-if="article" class="article-layout" :class="{ 'focus-mode': isFocusMode }">
      <!-- Table of Contents - Desktop -->
      <aside class="toc-sidebar" v-if="!isFocusMode && toc.length > 0">
        <nav class="toc-nav">
          <h3 class="toc-title">目录</h3>
          <ul class="toc-list">
            <li
              v-for="item in toc"
              :key="item.id"
              class="toc-item"
              :class="{ active: activeTocId === item.id, [`level-${item.level}`]: true }"
            >
              <a :href="`#${item.id}`" @click.prevent="scrollToSection(item.id)">
                {{ item.text }}
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="article-container">
        <header class="article-header">
          <div class="article-meta">
            <span class="article-category">{{ article.category }}</span>
            <span class="meta-divider">·</span>
            <span class="article-date">{{ formatDate(article.date) }}</span>
            <span class="meta-divider">·</span>
            <span class="article-read-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ article.readTime }} 分钟阅读
            </span>
            <button type="button" class="focus-toggle" @click="toggleFocusMode">{{ isFocusMode ? '退出专注' : '专注模式' }}</button>
          </div>

          <h1 class="article-title">{{ article.title }}</h1>
          <p class="article-description">{{ article.description }}</p>
        </header>

        <div v-if="!isFocusMode" class="article-hero" :style="{ background: article.gradient }">
          <div class="hero-overlay"></div>
        </div>

        <article class="article-body" ref="articleBody" v-html="article.content"></article>

        <!-- Article Footer -->
        <footer class="article-footer">
          <div class="footer-divider"></div>

          <div class="footer-actions">
            <router-link to="/" class="back-button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              返回文章列表
            </router-link>
          </div>

          <!-- Related Articles -->
          <div class="related-articles" v-if="!isFocusMode && relatedArticles.length > 0">
            <h3 class="related-title">相关文章</h3>
            <div class="related-grid">
              <router-link
                v-for="related in relatedArticles"
                :key="related.id"
                :to="`/article/${related.id}`"
                class="related-card"
              >
                <div class="related-image" :style="{ background: related.gradient }"></div>
                <div class="related-content">
                  <span class="related-category">{{ related.category }}</span>
                  <h4 class="related-name">{{ related.title }}</h4>
                </div>
              </router-link>
            </div>
          </div>
        </footer>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="not-found">
      <div class="not-found-content">
        <div class="not-found-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <h2>文章未找到</h2>
        <p>抱歉，您要查看的文章不存在或已被移除。</p>
        <router-link to="/" class="home-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import ReadingProgress from '../components/ReadingProgress.vue'
import apiService from '../api'

const route = useRoute()
const articleBody = ref(null)
const activeTocId = ref('')
const toc = ref([])
const article = ref(null)
const relatedArticles = ref([])
const isFocusMode = ref(false)
const loading = ref(true)
const error = ref(null)
const focusStorageKey = 'article-focus-mode'

const toggleFocusMode = () => {
  isFocusMode.value = !isFocusMode.value
  localStorage.setItem(focusStorageKey, isFocusMode.value ? '1' : '0')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchArticle = async (id) => {
  loading.value = true
  error.value = null

  try {
    const response = await apiService.getArticle(id)
    const rawArticle = response.data.article || {}
    article.value = {
      ...rawArticle,
      date: rawArticle.date ?? rawArticle.created_at ?? null,
      readTime: rawArticle.readTime ?? rawArticle.read_time ?? 0,
      description: rawArticle.description ?? rawArticle.excerpt ?? ''
    }

    relatedArticles.value = (response.data.related || []).map((item) => ({
      ...item,
      date: item.date ?? item.created_at ?? null,
      readTime: item.readTime ?? item.read_time ?? 0
    }))

    // 等待 DOM 更新后构建目录
    await nextTick()
    buildToc()
  } catch (err) {
    error.value = '获取文章失败'
    article.value = null
    console.error(err)
  } finally {
    loading.value = false
  }
}

const buildToc = () => {
  if (!articleBody.value) return

  const headings = articleBody.value.querySelectorAll('h2, h3')
  toc.value = Array.from(headings).map((heading, index) => {
    const id = heading.id || `heading-${index}`
    heading.id = id
    return {
      id,
      text: heading.textContent,
      level: parseInt(heading.tagName.charAt(1))
    }
  })
}

const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (el) {
    const offset = 80
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({
      top,
      behavior: 'smooth'
    })
  }
}

const updateActiveToc = () => {
  const headings = articleBody.value?.querySelectorAll('h2, h3')
  if (!headings) return

  let current = ''
  headings.forEach(heading => {
    const rect = heading.getBoundingClientRect()
    if (rect.top < 120) {
      current = heading.id
    }
  })
  activeTocId.value = current
}

onMounted(() => {
  isFocusMode.value = localStorage.getItem(focusStorageKey) === '1'
  fetchArticle(route.params.id)
  window.addEventListener('scroll', updateActiveToc, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveToc)
})

// 监听路由变化，重新获取文章
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchArticle(newId)
  }
})
</script>

<style scoped>
.article-page {
  min-height: 100vh;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
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
  min-height: 60vh;
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
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: var(--color-accent-hover);
}

/* Layout */
.article-layout {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 22px 64px;
  gap: 42px;
}

/* Table of Contents */
.toc-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  display: none;
}

@media (min-width: 1200px) {
  .toc-sidebar {
    display: block;
  }
}

.toc-nav {
  padding: 20px 0;
}

.toc-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.toc-list {
  border-left: 1px solid var(--color-border-light);
}

.toc-item {
  position: relative;
}

.toc-item a {
  display: block;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
  margin-left: -1px;
}

.toc-item a:hover {
  color: var(--color-text-primary);
}

.toc-item.active a {
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.toc-item.level-3 a {
  padding-left: 28px;
  font-size: 12px;
}

/* Article Container */
.article-container {
  flex: 1;
  max-width: 720px;
  margin: 0 auto;
}

.article-layout.focus-mode {
  max-width: 980px;
}

.article-layout.focus-mode .article-container {
  max-width: 760px;
}

/* Article Header */
.article-header {
  padding: 36px 0 24px;
}

.article-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.focus-toggle {
  margin-left: auto;
  border: 1px solid var(--color-border-light);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1;
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.focus-toggle:hover {
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.article-category {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 12px;
  font-weight: 500;
}

.meta-divider {
  color: var(--color-border);
}

.article-date,
.article-read-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.article-title {
  font-size: clamp(30px, 4.4vw, 40px);
  font-weight: 650;
  letter-spacing: -0.018em;
  line-height: 1.2;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.article-description {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Article Hero */
.article-hero {
  height: 84px;
  border-radius: 12px;
  margin-bottom: 26px;
  position: relative;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
}

/* Article Body */
.article-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.article-body :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  margin: 36px 0 16px;
  letter-spacing: -0.015em;
  color: var(--color-text-primary);
  scroll-margin-top: 80px;
}

.article-body :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  margin: 28px 0 12px;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
  scroll-margin-top: 80px;
}

.article-body :deep(p) {
  margin-bottom: 18px;
  color: var(--color-text-secondary);
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin: 24px 0;
  padding-left: 24px;
}

.article-body :deep(li) {
  margin-bottom: 12px;
  color: var(--color-text-secondary);
}

.article-body :deep(code) {
  background: var(--color-accent-subtle);
  padding: 3px 8px;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.9em;
  color: var(--color-text-primary);
}

.article-body :deep(pre) {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  padding: 24px;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 24px 0;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid var(--color-border-light);
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

/* Article Footer */
.article-footer {
  margin-top: 42px;
}

.article-layout.focus-mode .article-footer {
  margin-top: 24px;
}

.footer-divider {
  height: 1px;
  background: var(--color-border-light);
  margin-bottom: 24px;
}

.footer-actions {
  display: flex;
  justify-content: flex-start;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  transition: border-color var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast);
  text-decoration: none;
}

.back-button:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

/* Related Articles */
.related-articles {
  margin-top: 34px;
}

.related-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.related-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color var(--transition-fast);
}

.related-card:hover {
  border-color: var(--color-border);
  transform: none;
  box-shadow: none;
}

.related-image {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.related-content {
  flex: 1;
  min-width: 0;
}

.related-category {
  display: block;
  font-size: 11px;
  color: var(--color-accent);
  font-weight: 500;
  margin-bottom: 4px;
}

.related-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Not Found */
.not-found {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.not-found-content {
  text-align: center;
}

.not-found-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--color-accent-subtle);
  border-radius: 50%;
  color: var(--color-accent);
  margin-bottom: 24px;
}

.not-found h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.not-found p {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.home-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-accent);
  color: white;
  border-radius: 980px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;
}

.home-link:hover {
  background: var(--color-accent-hover);
}

/* Responsive */
@media (max-width: 768px) {
  .article-layout {
    padding: 0 16px 60px;
  }

  .article-header {
    padding: 40px 0 30px;
  }

  .article-title {
    font-size: 32px;
  }

  .article-description {
    font-size: 17px;
  }

  .article-hero {
    height: 200px;
    margin-bottom: 32px;
    border-radius: var(--radius-lg);
  }

  .article-body {
    font-size: 16px;
  }

  .article-body :deep(h2) {
    font-size: 24px;
    margin: 36px 0 16px;
  }

  .article-body :deep(h3) {
    font-size: 20px;
    margin: 28px 0 12px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>



