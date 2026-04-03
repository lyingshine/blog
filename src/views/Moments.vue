<template>
  <div class="moments-page">
    <section class="moments-hero">
      <p class="hero-kicker">Moments</p>
      <h1 class="hero-title">把一瞬间，写成可回看的轨迹</h1>
      <p class="hero-subtitle">记录短想法、进展和感受。每条都很轻，但合起来会定义你的长期方向。</p>
      <div class="hero-meta">
        <span>{{ statuses.length }} 条动态</span>
        <span class="dot">·</span>
        <span>{{ authStore.isLoggedIn ? '可发布互动' : '登录后可发布与互动' }}</span>
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
            <div class="item-header">
              <div class="author-meta">
                <div class="author-avatar">
                  <img
                    v-if="isImageAvatar(status.author_avatar)"
                    :src="resolveAssetUrl(status.author_avatar)"
                    alt="avatar"
                    class="avatar-image"
                  />
                  <span v-else>{{ getAvatarText(status.author_avatar, status.author_username) }}</span>
                </div>
                <div class="author-info">
                  <strong>{{ status.author_username || `用户${status.authorId}` }}</strong>
                  <span>{{ formatDate(status.date) }}</span>
                </div>
              </div>
              <div v-if="authStore.isLoggedIn && Number(status.authorId) !== Number(authStore.user?.id)" class="author-actions">
                <button
                  type="button"
                  class="mini-outline"
                  :class="{ active: !!followStates[status.authorId] }"
                  @click="toggleFollow(status)"
                >
                  {{ followStates[status.authorId] ? '已关注' : '关注' }}
                </button>
                <button type="button" class="mini-outline" @click="sendDmToAuthor(status)">私信</button>
              </div>
            </div>
            <p class="item-content">{{ status.content }}</p>
            <div class="item-footer">
              <span class="item-date">{{ formatDate(status.date) }}</span>
              <div class="item-actions">
                <button class="icon-btn like-btn" :class="{ liked: status.myReaction === 1 }" @click="handleReaction(status, 'like')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{{ status.likes || 0 }}</span>
                </button>
                <button class="icon-btn dislike-btn" :class="{ disliked: status.myReaction === -1 }" @click="handleReaction(status, 'dislike')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 14H5.236a2 2 0 0 1-1.968-2.358l1.2-6A2 2 0 0 1 6.43 4H10z"/>
                    <path d="M14 14V6.5a2 2 0 0 1 2-2h.15a2 2 0 0 1 1.98 1.7l.84 5.5A2 2 0 0 1 16.99 14z"/>
                    <path d="M10 14l2.3 5.4a1.6 1.6 0 0 0 1.47 1h0a1.6 1.6 0 0 0 1.51-2.1L14 14"/>
                  </svg>
                  <span>{{ status.dislikes || 0 }}</span>
                </button>
                <button class="icon-btn" @click="toggleComments(status)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{{ status.comments || 0 }}</span>
                </button>
                <button class="icon-btn" @click="toggleActionPanel(status.id, 'share')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  <span>{{ status.shares || 0 }}</span>
                </button>
                <button class="icon-btn report-btn" @click="toggleActionPanel(status.id, 'report')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z"/>
                    <path d="M12 8v4"/>
                    <circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none"/>
                  </svg>
                  <span>举报</span>
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
            <div v-if="actionPanelMap[status.id]" class="action-panel">
              <div v-if="actionPanelMap[status.id] === 'share'" class="action-form">
                <textarea
                  v-model="shareDrafts[status.id]"
                  rows="2"
                  maxlength="500"
                  placeholder="可选：补充一句转发语..."
                ></textarea>
                <div class="action-form-buttons">
                  <button type="button" class="mini-submit" @click="closeActionPanel(status.id)">取消</button>
                  <button type="button" class="mini-submit primary" @click="submitShare(status)">确认转发</button>
                </div>
              </div>
              <div v-else class="action-form">
                <select v-model="reportReasonMap[status.id]">
                  <option value="垃圾内容">垃圾内容</option>
                  <option value="骚扰辱骂">骚扰辱骂</option>
                  <option value="违法违规">违法违规</option>
                  <option value="侵权抄袭">侵权抄袭</option>
                </select>
                <textarea
                  v-model="reportDetailMap[status.id]"
                  rows="2"
                  maxlength="600"
                  placeholder="可选：补充说明..."
                ></textarea>
                <div class="action-form-buttons">
                  <button type="button" class="mini-submit" @click="closeActionPanel(status.id)">取消</button>
                  <button type="button" class="mini-submit primary" @click="submitReport(status)">提交举报</button>
                </div>
              </div>
            </div>
            <p v-if="actionMessageMap[status.id]" class="action-message">{{ actionMessageMap[status.id] }}</p>
            <div v-if="activeCommentStatusId === status.id" class="comment-panel">
              <div v-if="commentLoadingMap[status.id]" class="comment-loading">评论加载中...</div>
              <div v-else class="comment-list">
                <div v-if="!(commentMap[status.id] || []).length" class="comment-empty">还没有评论</div>
                <div v-for="comment in (commentMap[status.id] || [])" :key="comment.id" class="comment-item">
                  <div class="comment-meta">
                    <strong>{{ comment.author_username || '用户' }}</strong>
                    <span>{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <p v-if="comment.parent_id && commentParentMap[status.id]?.[comment.id]" class="reply-parent">
                    回复 {{ commentParentMap[status.id][comment.id].author_username || '用户' }}：
                    {{ commentParentMap[status.id][comment.id].content }}
                  </p>
                  <p>{{ comment.content }}</p>
                  <button
                    v-if="authStore.isLoggedIn"
                    class="reply-btn"
                    type="button"
                    @click="setReplyTarget(status.id, comment)"
                  >
                    回复
                  </button>
                </div>
              </div>
              <div v-if="authStore.isLoggedIn" class="comment-editor">
                <div v-if="replyTargetMap[status.id]" class="replying-hint">
                  正在回复 {{ replyTargetMap[status.id].author_username || '用户' }}
                  <button type="button" @click="clearReplyTarget(status.id)">取消</button>
                </div>
                <textarea
                  v-model="commentDrafts[status.id]"
                  rows="2"
                  maxlength="1000"
                  placeholder="写下你的评论..."
                ></textarea>
                <button class="mini-submit" type="button" @click="submitComment(status)">发送</button>
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
import apiService, { resolveAssetUrl } from '../api'

const authStore = useAuthStore()

const statuses = ref([])
const newStatus = ref('')
const loading = ref(true)
const submitting = ref(false)
const activeCommentStatusId = ref(0)
const commentMap = ref({})
const commentDrafts = ref({})
const commentLoadingMap = ref({})
const followStates = ref({})
const replyTargetMap = ref({})
const commentParentMap = ref({})
const actionPanelMap = ref({})
const shareDrafts = ref({})
const reportReasonMap = ref({})
const reportDetailMap = ref({})
const actionMessageMap = ref({})
const actionMessageTimerMap = {}

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

const normalizeStatus = (s = {}) => ({
  ...s,
  authorId: s.authorId ?? s.author_id,
  date: s.date ?? s.created_at,
  likes: Number(s.likes || 0),
  dislikes: Number(s.dislikes || 0),
  comments: Number(s.comments || 0),
  shares: Number(s.shares || 0),
  myReaction: Number(s.myReaction || 0)
})

const isImageAvatar = (avatar) =>
  typeof avatar === 'string' &&
  /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(avatar)

const getAvatarText = (avatar, username) => {
  if (isImageAvatar(avatar)) return (username || 'U').charAt(0).toUpperCase()
  const trimmed = typeof avatar === 'string' ? avatar.trim() : ''
  if (trimmed) return trimmed.charAt(0).toUpperCase()
  return (username || 'U').charAt(0).toUpperCase()
}

const loadFollowStates = async () => {
  if (!authStore.isLoggedIn || !statuses.value.length) return
  try {
    const authorIds = [
      ...new Set(
        statuses.value
          .map((s) => Number(s.authorId))
          .filter((id) => id > 0 && id !== Number(authStore.user?.id))
      )
    ]
    if (!authorIds.length) return
    const response = await apiService.getFollowStates(authorIds)
    followStates.value = response.data || {}
  } catch (error) {
    console.error('获取关注状态失败:', error)
  }
}

const loadEngagement = async () => {
  if (!statuses.value.length) return
  try {
    const ids = statuses.value.map((s) => s.id)
    const res = await apiService.getEngagement('status', ids)
    const map = res.data || {}
    statuses.value = statuses.value.map((item) => {
      const stats = map[item.id] || {}
      return normalizeStatus({
        ...item,
        likes: stats.likes ?? item.likes,
        dislikes: stats.dislikes ?? item.dislikes,
        comments: stats.comments ?? item.comments,
        shares: stats.shares ?? item.shares,
        myReaction: stats.myReaction ?? item.myReaction
      })
    })
  } catch (error) {
    console.error('获取互动数据失败:', error)
  }
}

const fetchStatuses = async () => {
  loading.value = true
  try {
    const response = await apiService.getStatuses()
    statuses.value = (response.data || []).map(normalizeStatus)
    await Promise.all([loadEngagement(), loadFollowStates()])
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
    statuses.value.unshift(normalizeStatus(response.data))
    newStatus.value = ''
    await Promise.all([loadEngagement(), loadFollowStates()])
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

const handleReaction = async (status, reaction = 'like') => {
  if (!authStore.isLoggedIn) {
    alert('请先登录后再互动')
    return
  }
  if (!status?.id) return

  const target = statuses.value.find((s) => s.id === status.id)
  if (!target) return

  try {
    const response = await apiService.reactToContent('status', status.id, reaction)
    const data = response.data || {}
    target.likes = Number(data.likes || 0)
    target.dislikes = Number(data.dislikes || 0)
    target.comments = Number(data.comments || target.comments || 0)
    target.shares = Number(data.shares || target.shares || 0)
    target.myReaction = Number(data.myReaction || 0)
  } catch (error) {
    console.error('互动失败:', error)
  }
}

const toggleComments = async (status) => {
  if (!status?.id) return
  if (activeCommentStatusId.value === status.id) {
    activeCommentStatusId.value = 0
    return
  }
  activeCommentStatusId.value = status.id
  await loadComments(status.id)
}

const loadComments = async (statusId) => {
  commentLoadingMap.value = { ...commentLoadingMap.value, [statusId]: true }
  try {
    const response = await apiService.getComments('status', statusId, 50)
    const list = response.data || []
    const parentLookup = {}
    list.forEach((item) => {
      if (item.parent_id) {
        const parent = list.find((x) => Number(x.id) === Number(item.parent_id))
        if (parent) {
          parentLookup[item.id] = parent
        }
      }
    })
    commentMap.value = { ...commentMap.value, [statusId]: list }
    commentParentMap.value = { ...commentParentMap.value, [statusId]: parentLookup }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    commentLoadingMap.value = { ...commentLoadingMap.value, [statusId]: false }
  }
}

const submitComment = async (status) => {
  if (!authStore.isLoggedIn) {
    alert('请先登录后再评论')
    return
  }
  const text = (commentDrafts.value[status.id] || '').trim()
  if (!text) return

  if (!status) return

  try {
    const response = await apiService.createComment({
      targetType: 'status',
      targetId: status.id,
      content: text,
      parentId: replyTargetMap.value[status.id]?.id || null
    })
    const list = commentMap.value[status.id] || []
    const nextList = [response.data, ...list]
    const parentLookup = { ...(commentParentMap.value[status.id] || {}) }
    if (response.data?.parent_id) {
      const parent = nextList.find((x) => Number(x.id) === Number(response.data.parent_id))
      if (parent) {
        parentLookup[response.data.id] = parent
      }
    }
    commentMap.value = { ...commentMap.value, [status.id]: nextList }
    commentParentMap.value = { ...commentParentMap.value, [status.id]: parentLookup }
    commentDrafts.value = { ...commentDrafts.value, [status.id]: '' }
    clearReplyTarget(status.id)
    await loadEngagement()
  } catch (error) {
    console.error('评论失败:', error)
  }
}

const setReplyTarget = (statusId, comment) => {
  replyTargetMap.value = { ...replyTargetMap.value, [statusId]: comment }
}

const clearReplyTarget = (statusId) => {
  const next = { ...replyTargetMap.value }
  delete next[statusId]
  replyTargetMap.value = next
}

const toggleFollow = async (status) => {
  const authorId = Number(status?.authorId || 0)
  if (!authorId || authorId === Number(authStore.user?.id)) return
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    return
  }

  const following = !!followStates.value[authorId]
  try {
    if (following) {
      await apiService.unfollowUser(authorId)
      followStates.value = { ...followStates.value, [authorId]: false }
    } else {
      await apiService.followUser(authorId)
      followStates.value = { ...followStates.value, [authorId]: true }
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    alert(error.message || '操作失败')
  }
}

const sendDmToAuthor = async (status) => {
  const authorId = Number(status?.authorId || 0)
  if (!authorId || authorId === Number(authStore.user?.id)) return
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  const content = prompt(`发给 ${status.author_username || '对方'} 的私信内容：`) || ''
  if (!content.trim()) return
  try {
    await apiService.sendPrivateMessage(authorId, content)
    alert('私信已发送')
  } catch (error) {
    console.error('发送私信失败:', error)
    alert(error.message || '发送失败')
  }
}

const setActionMessage = (statusId, message) => {
  actionMessageMap.value = { ...actionMessageMap.value, [statusId]: message }
  if (actionMessageTimerMap[statusId]) clearTimeout(actionMessageTimerMap[statusId])
  actionMessageTimerMap[statusId] = setTimeout(() => {
    const next = { ...actionMessageMap.value }
    delete next[statusId]
    actionMessageMap.value = next
  }, 2200)
}

const toggleActionPanel = (statusId, mode) => {
  const current = actionPanelMap.value[statusId]
  actionPanelMap.value = { ...actionPanelMap.value, [statusId]: current === mode ? '' : mode }
}

const closeActionPanel = (statusId) => {
  actionPanelMap.value = { ...actionPanelMap.value, [statusId]: '' }
}

const submitShare = async (status) => {
  if (!authStore.isLoggedIn) {
    setActionMessage(status.id, '请先登录后再转发')
    return
  }
  const comment = (shareDrafts.value[status.id] || '').trim()
  try {
    const response = await apiService.shareContent({
      targetType: 'status',
      targetId: status.id,
      comment
    })
    const engagement = response.data?.engagement || {}
    status.shares = Number(engagement.shares || status.shares || 0)
    shareDrafts.value = { ...shareDrafts.value, [status.id]: '' }
    closeActionPanel(status.id)
    setActionMessage(status.id, '已转发')
  } catch (error) {
    console.error('转发失败:', error)
    setActionMessage(status.id, error.message || '转发失败')
  }
}

const submitReport = async (status) => {
  if (!authStore.isLoggedIn) {
    setActionMessage(status.id, '请先登录后再举报')
    return
  }
  const reason = (reportReasonMap.value[status.id] || '垃圾内容').trim()
  const details = (reportDetailMap.value[status.id] || '').trim()
  try {
    await apiService.reportContent({
      targetType: 'status',
      targetId: status.id,
      reason,
      details
    })
    reportDetailMap.value = { ...reportDetailMap.value, [status.id]: '' }
    closeActionPanel(status.id)
    setActionMessage(status.id, '举报已提交')
  } catch (error) {
    console.error('举报失败:', error)
    setActionMessage(status.id, error.message || '举报失败')
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
  padding: 24px 22px calc(84px + var(--safe-bottom));
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
  min-height: 34px;
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
  min-height: 42px;
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
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
}

.moments-page .timeline .timeline-item:nth-child(1) { animation-delay: 20ms; }
.moments-page .timeline .timeline-item:nth-child(2) { animation-delay: 45ms; }
.moments-page .timeline .timeline-item:nth-child(3) { animation-delay: 70ms; }
.moments-page .timeline .timeline-item:nth-child(4) { animation-delay: 95ms; }

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
  transition:
    border-color var(--motion-base) var(--motion-smooth),
    transform var(--motion-fast) var(--motion-spring),
    box-shadow var(--motion-base) var(--motion-smooth);
}

.moments-page .item-card:hover {
  border-color: color-mix(in srgb, var(--color-accent) 22%, var(--color-border));
  transform: translateY(-1px);
}

.moments-page .item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.moments-page .author-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.moments-page .author-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.moments-page .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.moments-page .author-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.moments-page .author-info strong {
  font-size: 13px;
  color: var(--color-text-primary);
}

.moments-page .author-info span {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.moments-page .author-actions {
  display: flex;
  gap: 6px;
}

.moments-page .mini-outline {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.moments-page .mini-outline.active {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 34%, var(--color-border-light));
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
  min-height: 36px;
  padding: 5px 10px;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.moments-page .like-btn:hover,
.moments-page .dislike-btn:hover,
.moments-page .delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.moments-page .like-btn.liked,
.moments-page .dislike-btn.disliked {
  color: #ef4444;
}

.moments-page .like-btn.liked svg {
  fill: #ef4444;
}

.moments-page .comment-panel {
  margin-top: 12px;
  border-top: 1px solid var(--color-border-light);
  padding-top: 12px;
  animation: fade-up-in var(--motion-fast) var(--motion-spring) both;
}

.moments-page .comment-loading,
.moments-page .comment-empty {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.moments-page .comment-list {
  display: grid;
  gap: 8px;
}

.moments-page .comment-item {
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 8px 10px;
}

.moments-page .comment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.moments-page .comment-item p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.moments-page .reply-parent {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.moments-page .reply-btn {
  margin-top: 6px;
  min-height: 28px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-size: 12px;
  padding: 0 10px;
}

.moments-page .comment-editor {
  margin-top: 8px;
  display: grid;
  gap: 8px;
}

.moments-page .replying-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.moments-page .replying-hint button {
  border: none;
  background: none;
  color: var(--color-accent);
  font-size: 12px;
}

.moments-page .comment-editor textarea {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.moments-page .mini-submit {
  justify-self: end;
  min-height: 34px;
  border: 1px solid var(--color-border-light);
  background: var(--color-surface-elevated);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--color-text-secondary);
}

.moments-page .mini-submit.primary {
  color: #fff;
  border-color: transparent;
  background: var(--color-accent);
}

.moments-page .action-panel {
  margin-top: 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 10px;
  background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent);
  animation: soft-pop-in var(--motion-base) var(--motion-spring) both;
}

.moments-page .action-form {
  display: grid;
  gap: 8px;
}

.moments-page .action-form textarea,
.moments-page .action-form select {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.moments-page .action-form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.moments-page .action-message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.moments-page .item-card {
  box-shadow: var(--ux-shadow-soft);
}

.moments-page .icon-btn,
.moments-page .mini-outline,
.moments-page .hint-btn,
.moments-page .mini-submit,
.moments-page .publish-btn,
.moments-page .reply-btn {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.moments-page .icon-btn {
  border: 1px solid transparent;
  border-radius: 999px;
  min-height: 34px;
  padding: 4px 10px;
}

.moments-page .icon-btn:hover {
  border-color: var(--color-border-light);
  background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
  color: var(--color-text-primary);
}

.moments-page .icon-btn:focus-visible,
.moments-page .mini-outline:focus-visible,
.moments-page .hint-btn:focus-visible,
.moments-page .mini-submit:focus-visible,
.moments-page .publish-btn:focus-visible,
.moments-page .reply-btn:focus-visible,
.moments-page .comment-editor textarea:focus-visible {
  outline: none;
  box-shadow: var(--ux-ring);
}

.moments-page .like-btn.liked,
.moments-page .dislike-btn.disliked {
  background: color-mix(in srgb, #ef4444 12%, transparent);
  border-color: color-mix(in srgb, #ef4444 36%, var(--color-border-light));
}

.moments-page .mini-outline,
.moments-page .hint-btn,
.moments-page .mini-submit,
.moments-page .reply-btn {
  background: color-mix(in srgb, var(--color-surface-elevated) 94%, transparent);
}

.moments-page .mini-outline:hover,
.moments-page .hint-btn:hover,
.moments-page .mini-submit:hover,
.moments-page .reply-btn:hover {
  background: color-mix(in srgb, var(--color-accent-subtle) 60%, var(--color-surface-elevated));
  border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border-light));
  color: var(--color-text-primary);
}

.moments-page .publish-btn {
  box-shadow: 0 8px 20px color-mix(in srgb, var(--color-accent) 28%, transparent);
}

.moments-page .publish-btn:hover:enabled {
  transform: translateY(-1px);
}

.moments-page .comment-item {
  background: color-mix(in srgb, var(--color-surface-elevated) 74%, transparent);
}

.moments-page .author-info strong {
  letter-spacing: -0.01em;
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
    padding: 18px 16px calc(72px + var(--safe-bottom));
  }

  .moments-page .hero-title {
    font-size: 30px;
  }

  .moments-page .hero-subtitle {
    font-size: 14px;
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

  .moments-page .item-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .moments-page .timeline-item {
    grid-template-columns: 14px minmax(0, 1fr);
    gap: 10px;
  }
}
</style>
