<template>
  <div
    class="discovery-page"
    @touchstart="onPullTouchStart"
    @touchmove="onPullTouchMove"
    @touchend="onPullTouchEnd"
    @touchcancel="onPullTouchCancel"
  >
    <div
      class="pull-refresh-indicator"
      :class="{ visible: pullVisible, ready: pullReady, refreshing: pullRefreshing }"
      :style="{ '--pull-offset': `${pullOffset}px` }"
      aria-hidden="true"
    >
      <div class="pull-refresh-pill">
        {{ pullRefreshing ? '刷新中...' : pullReady ? '松开刷新' : '下拉刷新' }}
      </div>
    </div>
    <header class="discovery-header" :class="{ condensed: headerCondensed }">
      <h1 class="discovery-title">发现</h1>
      <p class="discovery-subtitle">发现新内容，也可以直接完成互动。</p>
      <div class="tab-bar ux-tab-shell" role="tablist" aria-label="发现分类">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn ux-tab"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <section v-if="loading" class="loading-state">
      <div class="discovery-skeleton-list" aria-hidden="true">
        <article v-for="n in 4" :key="`discovery-skeleton-${n}`" class="item-card discovery-skeleton-card">
          <div class="item-head">
            <div class="skeleton-line discovery-skeleton-badge"></div>
            <div class="skeleton-line discovery-skeleton-time"></div>
          </div>
          <div class="skeleton-line discovery-skeleton-title"></div>
          <div class="skeleton-line discovery-skeleton-text"></div>
          <div class="skeleton-line discovery-skeleton-text short"></div>
          <div class="item-actions">
            <div class="skeleton-line discovery-skeleton-action"></div>
            <div class="skeleton-line discovery-skeleton-action"></div>
            <div class="skeleton-line discovery-skeleton-action"></div>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'articles'" class="feed-list">
      <article v-for="article in paginatedArticles" :key="`article-${article.id}`" class="item-card article-card ux-card">
        <div class="item-head time-only">
          <span class="item-time">{{ formatDate(article.date) }}</span>
        </div>
        <router-link :to="`/article/${article.id}`" class="item-title-link">
          <h2 class="item-title">{{ article.title }}</h2>
        </router-link>
        <p class="item-excerpt">{{ article.excerpt }}</p>
        <div class="item-meta">
          <span>{{ article.author_username || `用户${article.authorId}` }}</span>
          <span>{{ article.category }}</span>
          <span>{{ article.readTime }} 分钟阅读</span>
        </div>
      </article>
      <div v-if="articlesPage < totalArticlePages" class="load-more-wrap">
        <button class="load-more-btn" type="button" :disabled="loadingMore" @click="loadMore('article')">{{ loadingMore ? '加载中...' : '加载更多' }}</button>
      </div>
    </section>

    <section v-else-if="activeTab === 'statuses'" class="feed-list">
      <article v-for="status in paginatedStatuses" :key="`status-${status.id}`" class="item-card status-card ux-card">
        <div class="item-head time-only">
          <span class="item-time">{{ formatRelative(status.date) }}</span>
        </div>
        <p class="status-content">{{ status.content }}</p>
        <div class="author-line subtle compact">
          <strong>{{ status.author_username || `用户${status.authorId}` }}</strong>
        </div>
        <div class="item-actions">
          <button class="action-btn" :class="{ active: getStats('status', status.id).myReaction === 1 }" type="button" @click="handleReaction('status', status.id, 'like')">赞 {{ getStats('status', status.id).likes }}</button>
          <button class="action-btn" type="button" @click="toggleComments('status', status.id)">评论 {{ getStats('status', status.id).comments }}</button>
          <button class="action-btn" :class="{ active: actionPanelMap[keyOf('status', status.id)] === 'more' }" type="button" @click="toggleActionPanel('status', status.id, 'more')">更多</button>
        </div>
        <div v-if="isCommentOpen('status', status.id)" class="panel-block">
          <div v-if="commentLoadingMap[keyOf('status', status.id)]" class="panel-empty">评论加载中...</div>
          <div v-else class="comment-list">
            <div v-if="!(commentMap[keyOf('status', status.id)] || []).length" class="panel-empty">还没有评论</div>
            <article v-for="comment in (commentMap[keyOf('status', status.id)] || [])" :key="comment.id" class="comment-item">
              <header>
                <strong>{{ comment.author_username || '用户' }}</strong>
                <span>{{ formatDate(comment.created_at) }}</span>
              </header>
              <p>{{ comment.content }}</p>
            </article>
          </div>
          <div v-if="authStore.isLoggedIn" class="panel-editor">
            <textarea v-model="commentDrafts[keyOf('status', status.id)]" rows="2" maxlength="1000" placeholder="写下你的评论..."></textarea>
            <button class="action-btn primary" type="button" @click="submitComment('status', status.id)">发送</button>
          </div>
        </div>
        <div v-if="actionPanelMap[keyOf('status', status.id)]" class="panel-block">
          <div v-if="actionPanelMap[keyOf('status', status.id)] === 'more'" class="more-actions">
            <button class="action-btn" :class="{ active: getStats('status', status.id).myReaction === -1 }" type="button" @click="handleReaction('status', status.id, 'dislike'); closeActionPanel('status', status.id)">
              踩 {{ getStats('status', status.id).dislikes }}
            </button>
            <button class="action-btn" type="button" @click="toggleActionPanel('status', status.id, 'share')">
              转发 {{ getStats('status', status.id).shares }}
            </button>
            <button class="action-btn danger" type="button" @click="toggleActionPanel('status', status.id, 'report')">举报</button>
          </div>
          <div v-else-if="actionPanelMap[keyOf('status', status.id)] === 'share'" class="panel-editor">
            <textarea v-model="shareDrafts[keyOf('status', status.id)]" rows="2" maxlength="500" placeholder="可选：补充一句转发语..."></textarea>
            <div class="panel-buttons">
              <button class="action-btn" type="button" @click="closeActionPanel('status', status.id)">取消</button>
              <button class="action-btn primary" type="button" @click="submitShare('status', status.id)">确认转发</button>
            </div>
          </div>
          <div v-else class="panel-editor">
            <select v-model="reportReasonMap[keyOf('status', status.id)]">
              <option value="垃圾内容">垃圾内容</option>
              <option value="骚扰辱骂">骚扰辱骂</option>
              <option value="违法违规">违法违规</option>
              <option value="侵权抄袭">侵权抄袭</option>
            </select>
            <textarea v-model="reportDetailMap[keyOf('status', status.id)]" rows="2" maxlength="600" placeholder="可选：补充说明..."></textarea>
            <div class="panel-buttons">
              <button class="action-btn" type="button" @click="closeActionPanel('status', status.id)">取消</button>
              <button class="action-btn primary" type="button" @click="submitReport('status', status.id)">提交举报</button>
            </div>
          </div>
        </div>
        <p v-if="actionMessageMap[keyOf('status', status.id)]" class="action-message">{{ actionMessageMap[keyOf('status', status.id)] }}</p>
      </article>
      <div v-if="statusesPage < totalStatusPages" class="load-more-wrap">
        <button class="load-more-btn" type="button" :disabled="loadingMore" @click="loadMore('status')">{{ loadingMore ? '加载中...' : '加载更多' }}</button>
      </div>
    </section>

    <section v-else class="feed-list mixed-list">
      <article
        v-for="item in paginatedMixed"
        :key="`${item.type}-${item.id}`"
        class="item-card ux-card"
        :class="item.type === 'article' ? 'article-card mixed-article' : 'status-card mixed-status'"
      >
        <div class="item-head">
          <span class="type-badge" :class="item.type === 'article' ? 'article' : 'status'">{{ item.type === 'article' ? '文章' : '动态' }}</span>
          <span class="item-time">{{ item.type === 'article' ? formatDate(item.date) : formatRelative(item.date) }}</span>
        </div>
        <template v-if="item.type === 'article'">
          <router-link :to="`/article/${item.id}`" class="item-title-link">
            <h2 class="item-title">{{ item.title }}</h2>
          </router-link>
          <p class="item-excerpt">{{ item.excerpt }}</p>
          <div class="item-meta">
            <span>{{ item.author_username || `用户${item.authorId}` }}</span>
            <span>{{ item.category }}</span>
          </div>
        </template>
        <template v-else>
          <p class="status-content">{{ item.content }}</p>
          <div class="author-line subtle compact">
            <strong>{{ item.author_username || `用户${item.authorId}` }}</strong>
          </div>
        </template>
        <div v-if="item.type === 'status'" class="item-actions">
          <button class="action-btn" :class="{ active: getStats(item.type, item.id).myReaction === 1 }" type="button" @click="handleReaction(item.type, item.id, 'like')">赞 {{ getStats(item.type, item.id).likes }}</button>
          <button class="action-btn" type="button" @click="toggleComments(item.type, item.id)">评论 {{ getStats(item.type, item.id).comments }}</button>
          <button class="action-btn" :class="{ active: actionPanelMap[keyOf(item.type, item.id)] === 'more' }" type="button" @click="toggleActionPanel(item.type, item.id, 'more')">更多</button>
        </div>
        <div v-if="item.type === 'status' && isCommentOpen(item.type, item.id)" class="panel-block">
          <div v-if="commentLoadingMap[keyOf(item.type, item.id)]" class="panel-empty">评论加载中...</div>
          <div v-else class="comment-list">
            <div v-if="!(commentMap[keyOf(item.type, item.id)] || []).length" class="panel-empty">还没有评论</div>
            <article v-for="comment in (commentMap[keyOf(item.type, item.id)] || [])" :key="comment.id" class="comment-item">
              <header>
                <strong>{{ comment.author_username || '用户' }}</strong>
                <span>{{ formatDate(comment.created_at) }}</span>
              </header>
              <p>{{ comment.content }}</p>
            </article>
          </div>
          <div v-if="authStore.isLoggedIn" class="panel-editor">
            <textarea v-model="commentDrafts[keyOf(item.type, item.id)]" rows="2" maxlength="1000" placeholder="写下你的评论..."></textarea>
            <button class="action-btn primary" type="button" @click="submitComment(item.type, item.id)">发送</button>
          </div>
        </div>
        <div v-if="item.type === 'status' && actionPanelMap[keyOf(item.type, item.id)]" class="panel-block">
          <div v-if="actionPanelMap[keyOf(item.type, item.id)] === 'more'" class="more-actions">
            <button class="action-btn" :class="{ active: getStats(item.type, item.id).myReaction === -1 }" type="button" @click="handleReaction(item.type, item.id, 'dislike'); closeActionPanel(item.type, item.id)">
              踩 {{ getStats(item.type, item.id).dislikes }}
            </button>
            <button class="action-btn" type="button" @click="toggleActionPanel(item.type, item.id, 'share')">
              转发 {{ getStats(item.type, item.id).shares }}
            </button>
            <button class="action-btn danger" type="button" @click="toggleActionPanel(item.type, item.id, 'report')">举报</button>
          </div>
          <div v-else-if="actionPanelMap[keyOf(item.type, item.id)] === 'share'" class="panel-editor">
            <textarea v-model="shareDrafts[keyOf(item.type, item.id)]" rows="2" maxlength="500" placeholder="可选：补充一句转发语..."></textarea>
            <div class="panel-buttons">
              <button class="action-btn" type="button" @click="closeActionPanel(item.type, item.id)">取消</button>
              <button class="action-btn primary" type="button" @click="submitShare(item.type, item.id)">确认转发</button>
            </div>
          </div>
          <div v-else class="panel-editor">
            <select v-model="reportReasonMap[keyOf(item.type, item.id)]">
              <option value="垃圾内容">垃圾内容</option>
              <option value="骚扰辱骂">骚扰辱骂</option>
              <option value="违法违规">违法违规</option>
              <option value="侵权抄袭">侵权抄袭</option>
            </select>
            <textarea v-model="reportDetailMap[keyOf(item.type, item.id)]" rows="2" maxlength="600" placeholder="可选：补充说明..."></textarea>
            <div class="panel-buttons">
              <button class="action-btn" type="button" @click="closeActionPanel(item.type, item.id)">取消</button>
              <button class="action-btn primary" type="button" @click="submitReport(item.type, item.id)">提交举报</button>
            </div>
          </div>
        </div>
        <p v-if="item.type === 'status' && actionMessageMap[keyOf(item.type, item.id)]" class="action-message">{{ actionMessageMap[keyOf(item.type, item.id)] }}</p>
      </article>
      <div v-if="mixedPage < totalMixedPages" class="load-more-wrap">
        <button class="load-more-btn" type="button" :disabled="loadingMore" @click="loadMore('mixed')">{{ loadingMore ? '加载中...' : '加载更多' }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiService, { resolveAssetUrl } from '../api'
import { usePullToRefresh } from '../composables/usePullToRefresh'

const authStore = useAuthStore()

const tabs = [
  { key: 'mixed', label: '综合' },
  { key: 'articles', label: '文章' },
  { key: 'statuses', label: '动态' }
]

const activeTab = ref('mixed')
const loading = ref(true)
const loadingMore = ref(false)
const headerCondensed = ref(false)
const lastScrollY = ref(0)

const articles = ref([])
const statuses = ref([])

const articlesPage = ref(1)
const statusesPage = ref(1)
const mixedPage = ref(1)
const perPage = 20

const engagementMap = ref({ article: {}, status: {} })
const commentOpenMap = ref({})
const commentMap = ref({})
const commentDrafts = ref({})
const commentLoadingMap = ref({})

const actionPanelMap = ref({})
const shareDrafts = ref({})
const reportReasonMap = ref({})
const reportDetailMap = ref({})
const actionMessageMap = ref({})
const actionMessageTimerMap = {}

const keyOf = (type, id) => `${type}-${id}`

const normalizeArticle = (a = {}) => ({
  ...a,
  type: 'article',
  authorId: a.authorId ?? a.author_id,
  readTime: a.readTime ?? a.read_time ?? 0,
  date: a.date ?? a.created_at
})

const normalizeStatus = (s = {}) => ({
  ...s,
  type: 'status',
  authorId: s.authorId ?? s.author_id,
  date: s.date ?? s.created_at
})

const paginatedArticles = computed(() => articles.value.slice(0, articlesPage.value * perPage))
const paginatedStatuses = computed(() => statuses.value.slice(0, statusesPage.value * perPage))

const mixedFeed = computed(() => {
  const all = [...articles.value, ...statuses.value]
  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return all
})

const paginatedMixed = computed(() => mixedFeed.value.slice(0, mixedPage.value * perPage))

const totalArticlePages = computed(() => Math.ceil(articles.value.length / perPage))
const totalStatusPages = computed(() => Math.ceil(statuses.value.length / perPage))
const totalMixedPages = computed(() => Math.ceil(mixedFeed.value.length / perPage))

const isImageAvatar = (avatar) =>
  typeof avatar === 'string' && /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(avatar)

const getAvatarText = (avatar, username) => {
  if (isImageAvatar(avatar)) return (username || 'U').charAt(0).toUpperCase()
  const trimmed = typeof avatar === 'string' ? avatar.trim() : ''
  if (trimmed) return trimmed.charAt(0).toUpperCase()
  return (username || 'U').charAt(0).toUpperCase()
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatRelative = (dateStr) => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--'
  const now = Date.now()
  const diff = now - d.getTime()
  const m = 60 * 1000
  const h = 60 * m
  const day = 24 * h
  if (diff < m) return '刚刚'
  if (diff < h) return `${Math.floor(diff / m)} 分钟前`
  if (diff < day) return `${Math.floor(diff / h)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(dateStr)
}

const getStats = (type, id) => {
  const row = engagementMap.value[type]?.[id] || {}
  return {
    likes: Number(row.likes || 0),
    dislikes: Number(row.dislikes || 0),
    comments: Number(row.comments || 0),
    shares: Number(row.shares || 0),
    myReaction: Number(row.myReaction || 0)
  }
}

const setStats = (type, id, data = {}) => {
  engagementMap.value = {
    ...engagementMap.value,
    [type]: {
      ...(engagementMap.value[type] || {}),
      [id]: {
        ...getStats(type, id),
        ...data
      }
    }
  }
}

const setActionMessage = (type, id, message) => {
  const k = keyOf(type, id)
  actionMessageMap.value = { ...actionMessageMap.value, [k]: message }
  if (actionMessageTimerMap[k]) clearTimeout(actionMessageTimerMap[k])
  actionMessageTimerMap[k] = setTimeout(() => {
    const next = { ...actionMessageMap.value }
    delete next[k]
    actionMessageMap.value = next
  }, 2200)
}

const fetchData = async (options = {}) => {
  const { silent = false } = options
  if (!silent) loading.value = true
  try {
    const [articlesRes, statusesRes] = await Promise.all([
      apiService.getArticles({ limit: 100 }),
      apiService.getStatuses()
    ])
    articles.value = (articlesRes.data?.articles || []).map(normalizeArticle)
    statuses.value = (statusesRes.data || []).map(normalizeStatus)
    await loadEngagementBatch()
  } catch (error) {
    console.error('获取发现内容失败:', error)
  } finally {
    if (!silent) loading.value = false
  }
}

const {
  offset: pullOffset,
  visible: pullVisible,
  ready: pullReady,
  refreshing: pullRefreshing,
  onTouchStart: onPullTouchStart,
  onTouchMove: onPullTouchMove,
  onTouchEnd: onPullTouchEnd,
  onTouchCancel: onPullTouchCancel
} = usePullToRefresh(() => fetchData({ silent: true }))

const loadEngagementBatch = async () => {
  try {
    const articleIds = articles.value.map((x) => x.id)
    const statusIds = statuses.value.map((x) => x.id)
    const tasks = []
    if (articleIds.length) tasks.push(apiService.getEngagement('article', articleIds))
    if (statusIds.length) tasks.push(apiService.getEngagement('status', statusIds))

    const results = await Promise.all(tasks)
    for (const item of results) {
      const map = item.data || {}
      const sample = Object.values(map)[0]
      const type = sample?.targetType
      if (!type) continue
      engagementMap.value = {
        ...engagementMap.value,
        [type]: map
      }
    }
  } catch (error) {
    console.error('获取互动数据失败:', error)
  }
}

const handleReaction = async (type, id, reaction) => {
  if (!authStore.isLoggedIn) {
    setActionMessage(type, id, '请先登录后再互动')
    return
  }
  try {
    const response = await apiService.reactToContent(type, id, reaction)
    const data = response.data || {}
    setStats(type, id, {
      likes: Number(data.likes || 0),
      dislikes: Number(data.dislikes || 0),
      comments: Number(data.comments || 0),
      shares: Number(data.shares || 0),
      myReaction: Number(data.myReaction || 0)
    })
  } catch (error) {
    console.error('互动失败:', error)
    setActionMessage(type, id, error.message || '互动失败')
  }
}

const isCommentOpen = (type, id) => !!commentOpenMap.value[keyOf(type, id)]

const toggleComments = async (type, id) => {
  const k = keyOf(type, id)
  const nextOpen = !commentOpenMap.value[k]
  commentOpenMap.value = { ...commentOpenMap.value, [k]: nextOpen }
  if (nextOpen) {
    await loadComments(type, id)
  }
}

const loadComments = async (type, id) => {
  const k = keyOf(type, id)
  commentLoadingMap.value = { ...commentLoadingMap.value, [k]: true }
  try {
    const res = await apiService.getComments(type, id, 50)
    commentMap.value = { ...commentMap.value, [k]: res.data || [] }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    commentLoadingMap.value = { ...commentLoadingMap.value, [k]: false }
  }
}

const submitComment = async (type, id) => {
  if (!authStore.isLoggedIn) {
    setActionMessage(type, id, '请先登录后再评论')
    return
  }
  const k = keyOf(type, id)
  const content = (commentDrafts.value[k] || '').trim()
  if (!content) return

  try {
    const res = await apiService.createComment({ targetType: type, targetId: id, content })
    const list = commentMap.value[k] || []
    commentMap.value = { ...commentMap.value, [k]: [res.data, ...list] }
    commentDrafts.value = { ...commentDrafts.value, [k]: '' }
    setStats(type, id, { comments: getStats(type, id).comments + 1 })
  } catch (error) {
    console.error('评论失败:', error)
    setActionMessage(type, id, error.message || '评论失败')
  }
}

const toggleActionPanel = (type, id, mode) => {
  const k = keyOf(type, id)
  const current = actionPanelMap.value[k]
  actionPanelMap.value = { ...actionPanelMap.value, [k]: current === mode ? '' : mode }
}

const closeActionPanel = (type, id) => {
  const k = keyOf(type, id)
  actionPanelMap.value = { ...actionPanelMap.value, [k]: '' }
}

const submitShare = async (type, id) => {
  if (!authStore.isLoggedIn) {
    setActionMessage(type, id, '请先登录后再转发')
    return
  }
  const k = keyOf(type, id)
  const comment = (shareDrafts.value[k] || '').trim()
  try {
    const res = await apiService.shareContent({ targetType: type, targetId: id, comment })
    const shares = Number(res.data?.engagement?.shares || getStats(type, id).shares)
    setStats(type, id, { shares })
    shareDrafts.value = { ...shareDrafts.value, [k]: '' }
    closeActionPanel(type, id)
    setActionMessage(type, id, '已转发')
  } catch (error) {
    console.error('转发失败:', error)
    setActionMessage(type, id, error.message || '转发失败')
  }
}

const submitReport = async (type, id) => {
  if (!authStore.isLoggedIn) {
    setActionMessage(type, id, '请先登录后再举报')
    return
  }
  const k = keyOf(type, id)
  const reason = (reportReasonMap.value[k] || '垃圾内容').trim()
  const details = (reportDetailMap.value[k] || '').trim()
  try {
    await apiService.reportContent({ targetType: type, targetId: id, reason, details })
    reportDetailMap.value = { ...reportDetailMap.value, [k]: '' }
    closeActionPanel(type, id)
    setActionMessage(type, id, '举报已提交')
  } catch (error) {
    console.error('举报失败:', error)
    setActionMessage(type, id, error.message || '举报失败')
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  articlesPage.value = 1
  statusesPage.value = 1
  mixedPage.value = 1
}

const loadMore = async (type) => {
  loadingMore.value = true
  setTimeout(() => {
    if (type === 'article') articlesPage.value += 1
    if (type === 'status') statusesPage.value += 1
    if (type === 'mixed') mixedPage.value += 1
    loadingMore.value = false
  }, 260)
}

const handleWindowScroll = () => {
  const y = Math.max(window.scrollY || window.pageYOffset || 0, 0)
  const delta = y - lastScrollY.value

  // 仅在接近顶部时展开，避免上滑一点就立即展开头部。
  if (y <= 12) {
    headerCondensed.value = false
  } else if (delta > 4) {
    headerCondensed.value = true
  }

  lastScrollY.value = y
}

onMounted(async () => {
  lastScrollY.value = Math.max(window.scrollY || window.pageYOffset || 0, 0)
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  await fetchData()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleWindowScroll)
})
</script>

<style scoped>
.discovery-page {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 0 var(--layout-gutter) calc(80px + var(--safe-bottom));
}

.pull-refresh-indicator {
  position: fixed;
  left: 50%;
  top: calc(50px + var(--safe-top));
  z-index: 1200;
  transform: translate(-50%, calc(-56px + var(--pull-offset, 0px)));
  opacity: 0;
  transition:
    transform var(--motion-base) var(--motion-smooth),
    opacity var(--motion-fast) var(--motion-smooth);
  pointer-events: none;
}

.pull-refresh-pill {
  min-height: var(--ui-tab-height);
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  color: var(--color-text-tertiary);
  font-size: var(--ui-tab-font);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.pull-refresh-indicator.visible {
  opacity: 1;
}

.pull-refresh-indicator.ready .pull-refresh-pill {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border-light));
}

.pull-refresh-indicator.refreshing .pull-refresh-pill::before {
  content: "";
  width: 12px;
  height: 12px;
  margin-right: 6px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
  border-top-color: var(--color-accent);
  animation: pull-spin 0.8s linear infinite;
}

@keyframes pull-spin {
  to {
    transform: rotate(360deg);
  }
}

.discovery-header {
  padding: var(--space-5) 0 var(--space-4);
  text-align: center;
  transition: padding var(--motion-base) var(--motion-smooth);
}

.discovery-title {
  font-size: var(--type-display);
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin: 0;
  transition: font-size var(--motion-base) var(--motion-smooth), opacity var(--motion-base) var(--motion-smooth);
}

.discovery-subtitle {
  margin-top: var(--space-2);
  font-size: 14px;
  color: var(--color-text-tertiary);
  transition: opacity var(--motion-base) var(--motion-smooth), max-height var(--motion-base) var(--motion-smooth), margin var(--motion-base) var(--motion-smooth);
  max-height: 48px;
  overflow: hidden;
}

.tab-bar {
  margin-top: 12px;
  display: inline-flex;
  box-shadow: none;
  opacity: 0.9;
  transition: gap var(--motion-base) var(--motion-smooth), margin var(--motion-base) var(--motion-smooth), opacity var(--motion-base) var(--motion-smooth);
}

.discovery-header.condensed {
  padding: 8px 0 6px;
}

.discovery-header.condensed .discovery-title {
  font-size: clamp(22px, 3.4vw, 26px);
}

.discovery-header.condensed .discovery-subtitle {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.discovery-header.condensed .tab-bar {
  margin-top: 6px;
  gap: 10px;
  opacity: 0.96;
}

.tab-btn {
  min-height: var(--ui-tab-height);
}

.tab-btn.active {
  background: transparent;
  box-shadow: none;
}

.tab-btn:focus-visible,
.action-btn:focus-visible,
.load-more-btn:focus-visible,
.panel-editor textarea:focus-visible,
.panel-editor select:focus-visible {
  outline: none;
  box-shadow: var(--ux-ring);
}

.loading-state {
  padding: 20px 0 10px;
}

.loading-spinner {
  width: 38px;
  height: 38px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.discovery-skeleton-list {
  display: grid;
  gap: 12px;
}

.discovery-skeleton-card {
  animation: none;
}

.discovery-skeleton-badge {
  width: 64px;
  height: 20px;
  border-radius: 999px;
}

.discovery-skeleton-time {
  width: 96px;
}

.discovery-skeleton-title {
  margin-top: 10px;
  width: 72%;
  height: 14px;
}

.discovery-skeleton-text {
  margin-top: 8px;
  width: 100%;
}

.discovery-skeleton-text.short {
  width: 58%;
}

.discovery-skeleton-action {
  width: 62px;
  height: 28px;
  border-radius: 999px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.feed-list {
  display: grid;
  gap: 6px;
  border-top: 0;
}

.mixed-list .mixed-article {
  border-left: 0;
}

.mixed-list .mixed-status {
  border-left: 0;
}

.item-card {
  display: grid;
  gap: 6px;
  border-radius: var(--panel-radius);
  padding: 12px var(--panel-padding) 10px;
  box-shadow: none;
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
}

.feed-list .item-card:nth-child(1) { animation-delay: 20ms; }
.feed-list .item-card:nth-child(2) { animation-delay: 45ms; }
.feed-list .item-card:nth-child(3) { animation-delay: 70ms; }
.feed-list .item-card:nth-child(4) { animation-delay: 95ms; }
.feed-list .item-card:nth-child(5) { animation-delay: 120ms; }

.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.item-head.time-only {
  justify-content: flex-start;
}

.type-badge {
  min-height: 18px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  opacity: 0.74;
}

.type-badge.article {
  color: var(--color-text-tertiary);
  background: transparent;
  border-color: var(--color-border-light);
}

.type-badge.status {
  color: var(--color-text-tertiary);
  background: transparent;
  border-color: var(--color-border-light);
}

.item-time {
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
  opacity: 0.9;
}

.item-title-link {
  display: inline-block;
  margin-top: 0;
}

.item-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--type-title);
  line-height: 1.3;
  font-weight: 640;
  letter-spacing: -0.01em;
}

.item-excerpt {
  margin-top: 0;
  color: var(--color-text-secondary);
  font-size: var(--type-body);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  margin-top: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
  opacity: 0.84;
}

.item-meta span + span::before {
  content: "·";
  margin-right: 5px;
  color: color-mix(in srgb, var(--color-text-tertiary) 70%, transparent);
}

.author-line {
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-line.subtle {
  opacity: 0.82;
}

.author-line.compact {
  margin-top: 0;
}

.author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--color-border-light);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 500;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.62) grayscale(0.12);
}

.author-line strong {
  font-size: var(--ui-meta-font);
  font-weight: 450;
  color: var(--color-text-tertiary);
}

.status-content {
  margin-top: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.68;
  color: var(--color-text-primary);
}

.item-actions {
  margin-top: 1px;
  padding-top: 6px;
  border-top: 1px solid color-mix(in srgb, var(--color-border-light) 88%, transparent);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  opacity: 0.76;
  transition: opacity var(--motion-base) var(--motion-smooth);
}

.action-btn {
  min-height: var(--ui-action-height);
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border-light) 82%, transparent);
  background: transparent;
  color: color-mix(in srgb, var(--color-text-tertiary) 92%, var(--color-text-secondary));
  padding: 0 9px;
  font-size: var(--ui-action-font);
  font-weight: 550;
  transition:
    transform var(--motion-fast) var(--motion-spring),
    border-color var(--motion-base) var(--motion-smooth),
    color var(--motion-base) var(--motion-smooth),
    background-color var(--motion-base) var(--motion-smooth);
}

.action-btn.active {
  color: var(--color-text-secondary);
  border-color: color-mix(in srgb, var(--color-border) 86%, transparent);
  background: var(--surface-embedded);
}

.action-btn.primary {
  color: #fff;
  border-color: transparent;
  background: var(--color-accent);
}

.action-btn.danger {
  color: #b85f5f;
}

.item-card:hover .item-actions {
  opacity: 1;
}

.item-card:hover .action-btn {
  color: var(--color-text-secondary);
  border-color: color-mix(in srgb, var(--color-accent) 16%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-accent-subtle) 22%, transparent);
}

.item-card:hover {
  background: var(--surface-panel-hover);
}

.more-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.panel-block {
  margin-top: 4px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 8px;
  background: var(--surface-embedded);
}

.panel-empty {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.comment-list {
  display: grid;
  gap: 6px;
}

.comment-item {
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 7px 9px;
  background: var(--color-surface);
}

.comment-item header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.comment-item p {
  margin-top: 5px;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.panel-editor {
  display: grid;
  gap: 6px;
}

.panel-editor textarea,
.panel-editor select {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.panel-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.action-message {
  margin-top: 6px;
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 10px 0 24px;
}

.load-more-btn {
  min-height: 40px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-weight: 600;
  padding: 0 16px;
  transition:
    transform var(--motion-fast) var(--motion-spring),
    border-color var(--motion-base) var(--motion-smooth),
    color var(--motion-base) var(--motion-smooth),
    background-color var(--motion-base) var(--motion-smooth);
}

.load-more-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-accent) 20%, var(--color-border-light));
  color: var(--color-text-primary);
  background: var(--surface-panel-hover);
}

@media (max-width: 768px) {
  .discovery-page {
    padding: 0 var(--layout-gutter-mobile) calc(76px + var(--safe-bottom));
  }

  .discovery-header {
    position: sticky;
    top: calc(44px + var(--safe-top));
    z-index: 11;
    background: color-mix(in srgb, var(--color-bg) 94%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .tab-bar {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 14px;
  }

  .tab-btn {
    min-height: var(--ui-action-height);
  }

  .item-title {
    font-size: 18px;
  }

  .item-card {
    padding: 11px 10px 9px;
    border-radius: 10px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .item-actions {
    opacity: 0.78;
  }
}
</style>
