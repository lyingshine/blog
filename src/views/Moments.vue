<template>
  <div class="moments-page">
    <section class="moments-hero">
      <p class="hero-kicker">Moments</p>
      <h1 class="hero-title">把一瞬间，写成可回看的轨迹</h1>
      <p class="hero-subtitle">记录短想法、进展和感受。每条都很轻，但合起来会定义你的长期方向。</p>
      <div class="hero-meta">
        <span>{{ statuses.length }} 条记录</span>
        <span class="dot">·</span>
        <span>{{ authStore.isLoggedIn ? '仅自己可管理' : '登录后开始记录' }}</span>
      </div>
    </section>

    <section v-if="authStore.isLoggedIn" class="composer">
      <div class="composer-header">
        <h2>写下此刻</h2>
        <span class="composer-count" :class="{ warn: newStatus.length > 450 }">{{ newStatus.length }}/500</span>
      </div>
      <textarea
        v-model="newStatus"
        class="composer-input"
        placeholder="今天最值得记录的一件事是什么？"
        rows="4"
      ></textarea>
      <div class="composer-footer">
        <div class="composer-hints">
          <button type="button" class="hint-btn" @click="applyHint('今天学到的一件事：')">今天学到</button>
          <button type="button" class="hint-btn" @click="applyHint('本周想推进的目标：')">本周目标</button>
          <button type="button" class="hint-btn" @click="applyHint('当前在思考的问题：')">正在思考</button>
        </div>
        <button class="publish-btn" :disabled="submitting || !newStatus.trim()" @click="handlePost">
          {{ submitting ? '发布中...' : '发布记录' }}
        </button>
      </div>
    </section>

    <section class="moments-stream">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载记录中...</p>
      </div>

      <div v-else-if="statuses.length === 0" class="empty-state">
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3>还没有记录</h3>
        <p>{{ authStore.isLoggedIn ? '从第一条开始，给未来留下线索。' : '登录后开始写下你的第一条记录。' }}</p>
      </div>

      <div v-else class="timeline">
        <article v-for="status in statuses" :key="status.id" class="timeline-item">
          <div class="item-line">
            <span class="item-dot"></span>
          </div>
          <div class="item-card">
            <p class="item-content">{{ status.content }}</p>
            <div class="item-footer">
              <span class="item-date">{{ formatDate(status.date) }}</span>
              <div class="item-actions">
                <button class="icon-btn like-btn" :class="{ liked: status.liked }" @click="handleLike(status.id)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{{ status.likes }}</span>
                </button>
                <button
                  v-if="authStore.user?.id === status.authorId"
                  class="icon-btn delete-btn"
                  @click="handleDelete(status.id)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiService from '../api'

const authStore = useAuthStore()

const statuses = ref([])
const newStatus = ref('')
const loading = ref(true)
const submitting = ref(false)

const applyHint = (text) => {
  if (!newStatus.value.trim()) {
    newStatus.value = text
    return
  }
  if (!newStatus.value.includes(text)) {
    newStatus.value = `${newStatus.value}\n${text}`
  }
}

const formatDate = (dateStr) => {
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchStatuses = async () => {
  loading.value = true
  try {
    const response = await apiService.getStatuses()
    if (authStore.isLoggedIn) {
      const userId = authStore.user?.id
      statuses.value = (response.data || [])
        .map((s) => ({
          ...s,
          authorId: s.authorId ?? s.author_id,
          date: s.date ?? s.created_at,
          liked: false
        }))
        .filter((s) => Number(s.authorId) === Number(userId))
    } else {
      statuses.value = []
    }
  } catch (error) {
    console.error('获取动态失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePost = async () => {
  if (!newStatus.value.trim() || newStatus.value.length > 500) return

  submitting.value = true
  try {
    const response = await apiService.createStatus(newStatus.value)
    statuses.value.unshift({
      ...response.data,
      authorId: response.data.authorId ?? response.data.author_id,
      date: response.data.date ?? response.data.created_at,
      liked: false
    })
    newStatus.value = ''
  } catch (error) {
    console.error('发布动态失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) return

  try {
    await apiService.deleteStatus(id)
    statuses.value = statuses.value.filter((s) => s.id !== id)
  } catch (error) {
    console.error('删除动态失败:', error)
  }
}

const handleLike = async (id) => {
  const status = statuses.value.find((s) => s.id === id)
  if (!status) return

  try {
    const response = await apiService.likeStatus(id)
    status.likes = response.data.likes
    status.liked = true
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

onMounted(() => {
  fetchStatuses()
})
</script>

<style>
.moments-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 22px 72px;
}

.moments-page .moments-hero {
  text-align: center;
  padding: 14px 0 16px;
}

.moments-page .hero-kicker {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

.moments-page .hero-title {
  font-size: clamp(26px, 4.6vw, 36px);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 8px;
}

.moments-page .hero-subtitle {
  max-width: 620px;
  margin: 0 auto;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.moments-page .hero-meta {
  margin-top: 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.moments-page .dot {
  margin: 0 8px;
}

.moments-page .composer {
  margin: 12px auto 22px;
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: none;
  padding: 14px;
}

.moments-page .composer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.moments-page .composer-header h2 {
  font-size: 20px;
  letter-spacing: -0.02em;
}

.moments-page .composer-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.moments-page .composer-count.warn {
  color: #c44536;
}

.moments-page .composer-input {
  width: 100%;
  border: none;
  resize: vertical;
  min-height: 110px;
  padding: 4px 0;
  background: transparent;
  color: var(--color-text-primary);
  line-height: 1.7;
  font-size: 15px;
  font-family: inherit;
}

.moments-page .composer-input:focus {
  outline: none;
}

.moments-page .composer-footer {
  border-top: 1px solid var(--color-border-light);
  margin-top: 12px;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.moments-page .composer-hints {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.moments-page .hint-btn {
  border: 1px solid var(--color-border-light);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-surface-elevated);
  transition: all var(--transition-fast);
}

.moments-page .hint-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent-subtle);
  background: var(--color-accent-subtle);
}

.moments-page .publish-btn {
  border: none;
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
  transition: background-color var(--transition-fast);
}

.moments-page .publish-btn:hover:enabled {
  background: var(--color-accent-hover);
}

.moments-page .publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.moments-page .moments-stream {
  margin-top: 8px;
}

.moments-page .timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.moments-page .timeline-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 14px;
}

.moments-page .item-line {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.moments-page .item-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border);
  box-shadow: none;
}

.moments-page .item-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  box-shadow: none;
  padding: 14px;
  transition: border-color var(--transition-fast);
}

.moments-page .item-card:hover {
  border-color: var(--color-border);
}

.moments-page .item-content {
  margin: 0;
  color: var(--color-text-primary);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.moments-page .item-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.moments-page .item-date {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.moments-page .item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.moments-page .icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-tertiary);
  padding: 5px 8px;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.moments-page .like-btn:hover,
.moments-page .delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.moments-page .like-btn.liked {
  color: #ef4444;
}

.moments-page .like-btn.liked svg {
  fill: #ef4444;
}

.moments-page .loading-state,
.moments-page .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-text-secondary);
  padding: 68px 0;
}

.moments-page .loading-spinner {
  width: 38px;
  height: 38px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 14px;
}

.moments-page .empty-state svg {
  margin-bottom: 14px;
  opacity: 0.5;
}

.moments-page .empty-state h3 {
  font-size: 20px;
  margin-bottom: 6px;
}

.moments-page .empty-state p {
  color: var(--color-text-tertiary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .moments-page {
    padding: 22px 16px 70px;
  }

  .moments-page .hero-title {
    font-size: 34px;
  }

  .moments-page .hero-subtitle {
    font-size: 15px;
  }

  .moments-page .composer {
    padding: 14px;
  }

  .moments-page .composer-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .moments-page .publish-btn {
    width: 100%;
  }

  .moments-page .timeline-item {
    grid-template-columns: 14px minmax(0, 1fr);
    gap: 10px;
  }
}
</style>
