<template>
  <div class="discovery-page"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
  >
    <div class="pull-refresh-container" :style="pullStyle">
      <div class="pull-indicator" v-show="pullDistance > 0">
        <svg class="pull-icon" :class="{ spinning: refreshing, rotating: !refreshing && pullDistance >= pullThreshold }" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        <span class="pull-text">{{ pullText }}</span>
      </div>
    </div>

    <header class="discovery-header">
      <h1 class="discovery-title">发现</h1>
      <p class="discovery-subtitle">聚焦内容本身，快速找到你要读的东西。</p>

      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="activeTab === 'articles'" class="articles-feed">
      <div class="articles-grid">
        <article v-for="article in paginatedArticles" :key="article.id" class="article-card">
          <router-link :to="`/article/${article.id}`" class="article-link">

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
                <span class="article-author" v-if="article.author_username">
                  {{ article.author_username }}
                </span>
              </div>
            </div>
          </router-link>
        </article>
      </div>

      <div v-if="articlesPage < totalPages" class="load-more">
        <button class="load-more-btn" @click="loadMoreArticles" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <div v-else-if="activeTab === 'statuses'" class="statuses-feed">
      <div class="statuses-list">
        <div v-for="status in paginatedStatuses" :key="status.id" class="status-card">
            <div class="status-header">
              <div class="status-avatar">{{ status.author_avatar || 'U' }}</div>
              <div class="status-user-info">
                <span class="status-username">{{ status.author_username || '未知用户' }}</span>
                <span class="status-date">{{ formatStatusDate(status.created_at || status.date) }}</span>
              </div>
            </div>
          <div class="status-content">
            <p>{{ status.content }}</p>
          </div>
          <div class="status-footer">
            <button class="like-btn" :class="{ liked: status.liked }" @click="handleLike(status.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{{ status.likes }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="statusesPage < totalStatusPages" class="load-more">
        <button class="load-more-btn" @click="loadMoreStatuses" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <div v-else class="mixed-feed">
      <div class="feed-list">
        <template v-for="item in paginatedFeed" :key="`${item.type}-${item.id}`">
          <div v-if="item.type === 'article'" class="feed-article-card">
            <router-link :to="`/article/${item.id}`" class="feed-article-link">
              <div class="feed-article-info">
                <span class="feed-article-category">{{ item.category }}</span>
                <h3 class="feed-article-title">{{ item.title }}</h3>
                <p class="feed-article-excerpt">{{ item.excerpt }}</p>
                <div class="feed-article-meta">
                  <span class="feed-article-date">{{ formatDate(item.created_at || item.date) }}</span>
                  <span class="feed-article-author" v-if="item.author_username">
                    {{ item.author_username }}
                  </span>
                </div>
              </div>
            </router-link>
          </div>

          <div v-else class="feed-status-card">
            <div class="feed-status-header">
              <div class="feed-status-avatar">{{ item.author_avatar || 'U' }}</div>
              <div class="feed-status-user-info">
                <span class="feed-status-username">{{ item.author_username || '未知用户' }}</span>
                <span class="feed-status-date">{{ formatStatusDate(item.created_at || item.date) }}</span>
              </div>
            </div>
            <p class="feed-status-content">{{ item.content }}</p>
            <div class="feed-status-footer">
              <button class="like-btn" :class="{ liked: item.liked }" @click="handleLike(item.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>{{ item.likes }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div v-if="feedPage < totalFeedPages" class="load-more">
        <button class="load-more-btn" @click="loadMoreFeed" :disabled="loadingMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiService from '../api'

const tabs = [
  { key: 'mixed', label: '推荐' },
  { key: 'articles', label: '文章' },
  { key: 'statuses', label: '动态' }
]

const activeTab = ref('mixed')
const loading = ref(true)
const loadingMore = ref(false)
const refreshing = ref(false)

const articles = ref([])
const statuses = ref([])

const articlesPage = ref(1)
const statusesPage = ref(1)
const feedPage = ref(1)
const perPage = 20

const pullDistance = ref(0)
const pullThreshold = 80
const maxPullDistance = 150

const pullStyle = computed(() => ({
  height: `${pullDistance.value}px`
}))

const pullText = computed(() => {
  if (refreshing.value) return '刷新中...'
  if (pullDistance.value >= pullThreshold) return '松开刷新'
  return '下拉刷新'
})

const totalPages = computed(() => Math.ceil(articles.value.length / perPage))
const totalStatusPages = computed(() => Math.ceil(statuses.value.length / perPage))

const paginatedArticles = computed(() => {
  return articles.value.slice(0, articlesPage.value * perPage)
})

const paginatedStatuses = computed(() => {
  return statuses.value.slice(0, statusesPage.value * perPage)
})

const mixedFeed = computed(() => {
  const allItems = [
    ...articles.value.map(a => ({ ...a, type: 'article' })),
    ...statuses.value.map(s => ({ ...s, type: 'status' }))
  ]

  allItems.sort((a, b) => new Date(b.date) - new Date(a.date))
  return allItems
})

const paginatedFeed = computed(() => {
  return mixedFeed.value.slice(0, feedPage.value * perPage)
})

const totalFeedPages = computed(() => Math.ceil(mixedFeed.value.length / perPage))

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatStatusDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const loadMoreArticles = async () => {
  loadingMore.value = true
  setTimeout(() => {
    articlesPage.value++
    loadingMore.value = false
  }, 300)
}

const loadMoreStatuses = async () => {
  loadingMore.value = true
  setTimeout(() => {
    statusesPage.value++
    loadingMore.value = false
  }, 300)
}

const loadMoreFeed = async () => {
  loadingMore.value = true
  setTimeout(() => {
    feedPage.value++
    loadingMore.value = false
  }, 300)
}

const handleLike = async (id) => {
  const status = statuses.value.find(s => s.id === id)
  if (!status) return

  try {
    const response = await apiService.likeStatus(id)
    status.likes = response.data.likes
    status.liked = true
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

async function fetchData() {
  const [articlesRes, statusesRes] = await Promise.all([
    apiService.getArticles({ limit: 50 }),
    apiService.getStatuses()
  ])
  articles.value = articlesRes.data.articles.map(a => ({
    ...a,
    date: a.created_at || a.date,
    authorId: a.author_id || a.authorId
  }))
  statuses.value = statusesRes.data.map(s => ({
    ...s,
    date: s.created_at || s.date,
    authorId: s.author_id || s.authorId,
    liked: false
  }))
}

async function switchTab(key) {
  activeTab.value = key
  articlesPage.value = 1
  statusesPage.value = 1
  feedPage.value = 1
  loading.value = true
  try {
    await fetchData()
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  refreshing.value = true
  pullDistance.value = 60
  try {
    await fetchData()
    articlesPage.value = 1
    statusesPage.value = 1
    feedPage.value = 1
  } catch (error) {
    console.error('刷新失败:', error)
  } finally {
    setTimeout(() => {
      refreshing.value = false
      pullDistance.value = 0
    }, 400)
  }
}

let startY = 0
let isDragging = false

function onDragStart(clientY, clientX) {
  if (window.scrollY === 0 && !refreshing.value) {
    startY = clientY
    isDragging = true
  }
}

function onDragMove(clientY, clientX) {
  if (!isDragging || refreshing.value) return
  const deltaY = clientY - startY
  const deltaX = Math.abs(clientX - (startX || clientX))
  if (deltaY > 0 && deltaY > deltaX) {
    pullDistance.value = Math.min(deltaY * 0.5, maxPullDistance)
  }
}

function onDragEnd(clientY, clientX) {
  if (!isDragging) return
  isDragging = false

  if (pullDistance.value >= pullThreshold) {
    refreshData()
  } else {
    pullDistance.value = 0
  }
}

let startX = 0

function onTouchStart(e) {
  startY = e.touches[0].clientY
  startX = e.touches[0].clientX
  isDragging = window.scrollY === 0 && !refreshing.value
}

function onTouchMove(e) {
  if (!isDragging || refreshing.value) return
  const deltaY = e.touches[0].clientY - startY
  const deltaX = Math.abs(e.touches[0].clientX - startX)
  if (deltaY > 0 && deltaY > deltaX) {
    e.preventDefault()
    pullDistance.value = Math.min(deltaY * 0.5, maxPullDistance)
  }
}

function onTouchEnd(e) {
  if (!isDragging) return
  isDragging = false

  if (pullDistance.value >= pullThreshold) {
    refreshData()
  } else {
    pullDistance.value = 0
  }
}

function onMouseDown(e) {
  if (window.scrollY === 0 && e.button === 0 && !refreshing.value) {
    startY = e.clientY
    startX = e.clientX
    isDragging = true
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }
}

function onMouseMove(e) {
  if (!isDragging || refreshing.value) return
  const deltaY = e.clientY - startY
  const deltaX = Math.abs(e.clientX - startX)
  if (deltaY > 0 && deltaY > deltaX) {
    pullDistance.value = Math.min(deltaY * 0.5, maxPullDistance)
  }
}

function onMouseUp(e) {
  if (!isDragging) return
  isDragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  if (pullDistance.value >= pullThreshold) {
    refreshData()
  } else {
    pullDistance.value = 0
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await fetchData()
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pull-refresh-container {
  overflow: hidden;
  transition: none;
}

.pull-indicator {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.pull-icon {
  transition: transform 0.3s ease;
}

.pull-icon.rotating {
  transform: rotate(180deg);
}

.pull-icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.discovery-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px 60px;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.discovery-page * {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

.discovery-header {
  padding: 24px 0 18px;
  text-align: center;
}

.discovery-title {
  font-size: 30px;
  font-weight: 650;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}

.discovery-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 14px;
}

.tab-bar {
  display: inline-flex;
  gap: 4px;
  background: var(--color-surface);
  padding: 4px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.tab-btn {
  padding: 8px 20px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-accent-subtle);
  color: var(--color-text-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
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

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.article-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: none;
  border: 1px solid var(--color-border-light);
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.article-card:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--color-border);
}

.article-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.article-body {
  padding: 14px;
}

.article-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.article-category {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: 3px 10px;
  border-radius: 980px;
  font-size: 11px;
  font-weight: 500;
}

.article-read-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.article-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  margin: 0 0 10px;
}

.article-excerpt {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.article-date {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.article-author {
  font-size: 12px;
  color: var(--color-accent);
  font-weight: 500;
}

.statuses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 14px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.status-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.status-user-info {
  display: flex;
  flex-direction: column;
}

.status-username {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.status-date {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.status-content p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.status-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-md);
}

.like-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.like-btn.liked {
  color: #ef4444;
}

.like-btn.liked svg {
  fill: #ef4444;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feed-article-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.feed-article-card:hover {
  border-color: var(--color-border);
  box-shadow: none;
}

.feed-article-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.feed-article-info {
  padding: 14px;
  flex: 1;
  min-width: 0;
}

.feed-article-category {
  font-size: 11px;
  color: var(--color-accent);
  font-weight: 500;
  background: var(--color-accent-subtle);
  padding: 3px 10px;
  border-radius: 980px;
  display: inline-block;
  margin-bottom: 8px;
}

.feed-article-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  margin: 0 0 8px;
}

.feed-article-excerpt {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feed-article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feed-article-date {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.feed-article-author {
  font-size: 12px;
  color: var(--color-accent);
  font-weight: 500;
}

.feed-status-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 14px;
}

.feed-status-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.feed-status-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.feed-status-user-info {
  display: flex;
  flex-direction: column;
}

.feed-status-username {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.feed-status-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.feed-status-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 12px;
}

.feed-status-footer {
  padding-top: 10px;
  border-top: 1px solid var(--color-border-light);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.load-more-btn {
  padding: 10px 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.load-more-btn:hover:not(:disabled) {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-color: var(--color-accent-subtle);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .discovery-page {
    padding: 0 16px 60px;
  }

  .discovery-title {
    font-size: 28px;
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feed-article-link {
    flex-direction: initial;
  }
}
</style>

