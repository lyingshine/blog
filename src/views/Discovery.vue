<template>
  <div class="discovery-page">
    <header class="discovery-header">
      <h1 class="discovery-title">发现</h1>
      <p class="discovery-subtitle">发现新内容，也可以直接完成互动。</p>
      <div class="tab-bar" role="tablist" aria-label="发现分类">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <section v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </section>

    <section v-else-if="activeTab === 'articles'" class="feed-list">
      <article v-for="article in paginatedArticles" :key="`article-${article.id}`" class="item-card article-card">
        <div class="item-head">
          <span class="type-badge article">文章</span>
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
        <div class="item-actions">
          <button class="action-btn" :class="{ active: getStats('article', article.id).myReaction === 1 }" type="button" @click="handleReaction('article', article.id, 'like')">赞 {{ getStats('article', article.id).likes }}</button>
          <button class="action-btn" :class="{ active: getStats('article', article.id).myReaction === -1 }" type="button" @click="handleReaction('article', article.id, 'dislike')">踩 {{ getStats('article', article.id).dislikes }}</button>
          <button class="action-btn" type="button" @click="toggleComments('article', article.id)">评论 {{ getStats('article', article.id).comments }}</button>
          <button class="action-btn" type="button" @click="toggleActionPanel('article', article.id, 'share')">转发 {{ getStats('article', article.id).shares }}</button>
          <button class="action-btn danger" type="button" @click="toggleActionPanel('article', article.id, 'report')">举报</button>
        </div>
        <div v-if="isCommentOpen('article', article.id)" class="panel-block">
          <div v-if="commentLoadingMap[keyOf('article', article.id)]" class="panel-empty">评论加载中...</div>
          <div v-else class="comment-list">
            <div v-if="!(commentMap[keyOf('article', article.id)] || []).length" class="panel-empty">还没有评论</div>
            <article v-for="comment in (commentMap[keyOf('article', article.id)] || [])" :key="comment.id" class="comment-item">
              <header>
                <strong>{{ comment.author_username || '用户' }}</strong>
                <span>{{ formatDate(comment.created_at) }}</span>
              </header>
              <p>{{ comment.content }}</p>
            </article>
          </div>
          <div v-if="authStore.isLoggedIn" class="panel-editor">
            <textarea v-model="commentDrafts[keyOf('article', article.id)]" rows="2" maxlength="1000" placeholder="写下你的评论..."></textarea>
            <button class="action-btn primary" type="button" @click="submitComment('article', article.id)">发送</button>
          </div>
        </div>
        <div v-if="actionPanelMap[keyOf('article', article.id)]" class="panel-block">
          <div v-if="actionPanelMap[keyOf('article', article.id)] === 'share'" class="panel-editor">
            <textarea v-model="shareDrafts[keyOf('article', article.id)]" rows="2" maxlength="500" placeholder="可选：补充一句转发语..."></textarea>
            <div class="panel-buttons">
              <button class="action-btn" type="button" @click="closeActionPanel('article', article.id)">取消</button>
              <button class="action-btn primary" type="button" @click="submitShare('article', article.id)">确认转发</button>
            </div>
          </div>
          <div v-else class="panel-editor">
            <select v-model="reportReasonMap[keyOf('article', article.id)]">
              <option value="垃圾内容">垃圾内容</option>
              <option value="骚扰辱骂">骚扰辱骂</option>
              <option value="违法违规">违法违规</option>
              <option value="侵权抄袭">侵权抄袭</option>
            </select>
            <textarea v-model="reportDetailMap[keyOf('article', article.id)]" rows="2" maxlength="600" placeholder="可选：补充说明..."></textarea>
            <div class="panel-buttons">
              <button class="action-btn" type="button" @click="closeActionPanel('article', article.id)">取消</button>
              <button class="action-btn primary" type="button" @click="submitReport('article', article.id)">提交举报</button>
            </div>
          </div>
        </div>
        <p v-if="actionMessageMap[keyOf('article', article.id)]" class="action-message">{{ actionMessageMap[keyOf('article', article.id)] }}</p>
      </article>
      <div v-if="articlesPage < totalArticlePages" class="load-more-wrap">
        <button class="load-more-btn" type="button" :disabled="loadingMore" @click="loadMore('article')">{{ loadingMore ? '加载中...' : '加载更多' }}</button>
      </div>
    </section>

    <section v-else-if="activeTab === 'statuses'" class="feed-list">
      <article v-for="status in paginatedStatuses" :key="`status-${status.id}`" class="item-card status-card">
        <div class="item-head">
          <span class="type-badge status">动态</span>
          <span class="item-time">{{ formatRelative(status.date) }}</span>
        </div>
        <div class="author-line">
          <div class="author-avatar">
            <img v-if="isImageAvatar(status.author_avatar)" :src="resolveAssetUrl(status.author_avatar)" alt="avatar" class="avatar-image" />
            <span v-else>{{ getAvatarText(status.author_avatar, status.author_username) }}</span>
          </div>
          <strong>{{ status.author_username || `用户${status.authorId}` }}</strong>
        </div>
        <p class="status-content">{{ status.content }}</p>
        <div class="item-actions">
          <button class="action-btn" :class="{ active: getStats('status', status.id).myReaction === 1 }" type="button" @click="handleReaction('status', status.id, 'like')">赞 {{ getStats('status', status.id).likes }}</button>
          <button class="action-btn" :class="{ active: getStats('status', status.id).myReaction === -1 }" type="button" @click="handleReaction('status', status.id, 'dislike')">踩 {{ getStats('status', status.id).dislikes }}</button>
          <button class="action-btn" type="button" @click="toggleComments('status', status.id)">评论 {{ getStats('status', status.id).comments }}</button>
          <button class="action-btn" type="button" @click="toggleActionPanel('status', status.id, 'share')">转发 {{ getStats('status', status.id).shares }}</button>
          <button class="action-btn danger" type="button" @click="toggleActionPanel('status', status.id, 'report')">举报</button>
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
          <div v-if="actionPanelMap[keyOf('status', status.id)] === 'share'" class="panel-editor">
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
        class="item-card"
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
          <div class="author-line">
            <div class="author-avatar">
              <img v-if="isImageAvatar(item.author_avatar)" :src="resolveAssetUrl(item.author_avatar)" alt="avatar" class="avatar-image" />
              <span v-else>{{ getAvatarText(item.author_avatar, item.author_username) }}</span>
            </div>
            <strong>{{ item.author_username || `用户${item.authorId}` }}</strong>
          </div>
          <p class="status-content">{{ item.content }}</p>
        </template>
        <div class="item-actions">
          <button class="action-btn" :class="{ active: getStats(item.type, item.id).myReaction === 1 }" type="button" @click="handleReaction(item.type, item.id, 'like')">赞 {{ getStats(item.type, item.id).likes }}</button>
          <button class="action-btn" :class="{ active: getStats(item.type, item.id).myReaction === -1 }" type="button" @click="handleReaction(item.type, item.id, 'dislike')">踩 {{ getStats(item.type, item.id).dislikes }}</button>
          <button class="action-btn" type="button" @click="toggleComments(item.type, item.id)">评论 {{ getStats(item.type, item.id).comments }}</button>
          <button class="action-btn" type="button" @click="toggleActionPanel(item.type, item.id, 'share')">转发 {{ getStats(item.type, item.id).shares }}</button>
          <button class="action-btn danger" type="button" @click="toggleActionPanel(item.type, item.id, 'report')">举报</button>
        </div>
        <div v-if="isCommentOpen(item.type, item.id)" class="panel-block">
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
        <div v-if="actionPanelMap[keyOf(item.type, item.id)]" class="panel-block">
          <div v-if="actionPanelMap[keyOf(item.type, item.id)] === 'share'" class="panel-editor">
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
        <p v-if="actionMessageMap[keyOf(item.type, item.id)]" class="action-message">{{ actionMessageMap[keyOf(item.type, item.id)] }}</p>
      </article>
      <div v-if="mixedPage < totalMixedPages" class="load-more-wrap">
        <button class="load-more-btn" type="button" :disabled="loadingMore" @click="loadMore('mixed')">{{ loadingMore ? '加载中...' : '加载更多' }}</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import apiService, { resolveAssetUrl } from '../api'

const authStore = useAuthStore()

const tabs = [
  { key: 'mixed', label: '综合' },
  { key: 'articles', label: '文章' },
  { key: 'statuses', label: '动态' }
]

const activeTab = ref('mixed')
const loading = ref(true)
const loadingMore = ref(false)

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

const fetchData = async () => {
  loading.value = true
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
    loading.value = false
  }
}

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

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.discovery-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 22px calc(80px + var(--safe-bottom));
}

.discovery-header {
  padding: 24px 0 16px;
  text-align: center;
}

.discovery-title {
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin: 0;
}

.discovery-subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.tab-bar {
  margin-top: 14px;
  display: inline-flex;
  gap: 6px;
  padding: 5px;
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: var(--ux-shadow-soft);
}

.tab-btn {
  min-height: 38px;
  min-width: 86px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.tab-btn.active {
  color: var(--color-accent);
  background: var(--color-accent-subtle);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 24%, var(--color-border-light));
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
  padding: 72px 0;
  text-align: center;
  color: var(--color-text-secondary);
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.feed-list {
  display: grid;
  gap: 12px;
}

.mixed-list .mixed-article {
  border-left: 4px solid color-mix(in srgb, var(--color-accent) 52%, var(--color-border-light));
}

.mixed-list .mixed-status {
  border-left: 4px solid color-mix(in srgb, #16a34a 52%, var(--color-border-light));
}

.item-card {
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 12px;
  box-shadow: var(--ux-shadow-soft);
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

.type-badge {
  min-height: 24px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
}

.type-badge.article {
  color: var(--color-accent);
  background: var(--color-accent-subtle);
  border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border-light));
}

.type-badge.status {
  color: #15803d;
  background: color-mix(in srgb, #16a34a 12%, var(--color-surface));
  border-color: color-mix(in srgb, #16a34a 28%, var(--color-border-light));
}

.item-time {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.item-title-link {
  display: inline-block;
  margin-top: 8px;
}

.item-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 19px;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.item-excerpt {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.author-line {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--color-border-light);
  background: var(--color-surface-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 700;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-content {
  margin-top: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.68;
  color: var(--color-text-primary);
}

.item-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  min-height: 32px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-surface-elevated) 92%, transparent);
  color: var(--color-text-secondary);
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  transition:
    transform var(--motion-fast) var(--motion-spring),
    border-color var(--motion-base) var(--motion-smooth),
    color var(--motion-base) var(--motion-smooth),
    background-color var(--motion-base) var(--motion-smooth);
}

.action-btn.active {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 34%, var(--color-border-light));
  background: var(--color-accent-subtle);
}

.action-btn.primary {
  color: #fff;
  border-color: transparent;
  background: var(--color-accent);
}

.action-btn.danger {
  color: #c03f3f;
}

.panel-block {
  margin-top: 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 10px;
  background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
}

.panel-empty {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.comment-list {
  display: grid;
  gap: 8px;
}

.comment-item {
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 8px 10px;
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
  margin-top: 6px;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.panel-editor {
  display: grid;
  gap: 8px;
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
  gap: 8px;
}

.action-message {
  margin-top: 8px;
  font-size: 12px;
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
  font-weight: 700;
  padding: 0 16px;
  transition:
    transform var(--motion-fast) var(--motion-spring),
    border-color var(--motion-base) var(--motion-smooth),
    color var(--motion-base) var(--motion-smooth),
    background-color var(--motion-base) var(--motion-smooth);
}

.load-more-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-accent) 26%, var(--color-border-light));
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-accent-subtle) 50%, var(--color-surface));
}

@media (max-width: 768px) {
  .discovery-page {
    padding: 0 16px calc(76px + var(--safe-bottom));
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
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tab-btn {
    width: 100%;
    min-width: 0;
  }

  .item-title {
    font-size: 18px;
  }
}
</style>
