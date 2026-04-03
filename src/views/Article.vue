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
          <div class="article-author-row">
            <div class="author-meta">
              <div class="author-avatar">
                <img
                  v-if="isImageAvatar(article.author_avatar)"
                  :src="resolveAssetUrl(article.author_avatar)"
                  alt="avatar"
                  class="avatar-image"
                />
                <span v-else>{{ getAvatarText(article.author_avatar, article.author_username) }}</span>
              </div>
              <div class="author-info">
                <strong>{{ article.author_username || `用户${article.author_id}` }}</strong>
                <span>作者</span>
              </div>
            </div>
            <div
              v-if="authStore.isLoggedIn && Number(article.author_id) && Number(article.author_id) !== Number(authStore.user?.id)"
              class="author-actions"
            >
              <button class="author-btn" :class="{ active: authorFollowed }" type="button" @click="toggleAuthorFollow">
                {{ authorFollowed ? '已关注' : '关注' }}
              </button>
              <button class="author-btn" type="button" @click="messageAuthor">私信</button>
            </div>
          </div>
          <div class="article-actions">
            <button class="action-btn" :class="{ active: engagement.myReaction === 1 }" type="button" @click="reactArticle('like')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a2 2 0 0 0-2-2h0a2 2 0 0 0-1.8 1.1L7 10H4a2 2 0 0 0-2 2v1.6a2 2 0 0 0 .16.8l1.2 2.8A2 2 0 0 0 5.2 18H14a2 2 0 0 0 2-2V9z"/>
                <path d="M18 9h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              </svg>
              <span>{{ engagement.likes }}</span>
            </button>
            <button class="action-btn" :class="{ active: engagement.myReaction === -1 }" type="button" @click="reactArticle('dislike')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 14H5.236a2 2 0 0 1-1.968-2.358l1.2-6A2 2 0 0 1 6.43 4H10z"/>
                <path d="M14 14V6.5a2 2 0 0 1 2-2h.15a2 2 0 0 1 1.98 1.7l.84 5.5A2 2 0 0 1 16.99 14z"/>
                <path d="M10 14l2.3 5.4a1.6 1.6 0 0 0 1.47 1h0a1.6 1.6 0 0 0 1.51-2.1L14 14"/>
              </svg>
              <span>{{ engagement.dislikes }}</span>
            </button>
            <button class="action-btn" type="button" @click="toggleComments">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>评论 {{ engagement.comments }}</span>
            </button>
            <button class="action-btn" type="button" @click="toggleActionPanel('share')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>转发 {{ engagement.shares }}</span>
            </button>
            <button class="action-btn danger" type="button" @click="toggleActionPanel('report')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z"/>
                <path d="M12 8v4"/>
                <circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
              <span>举报</span>
            </button>
          </div>
          <div v-if="actionPanelMode" class="action-panel">
            <div v-if="actionPanelMode === 'share'" class="action-form">
              <textarea
                v-model="shareDraft"
                rows="2"
                maxlength="500"
                placeholder="可选：补充一句转发语..."
              ></textarea>
              <div class="action-form-buttons">
                <button type="button" class="submit-comment" @click="toggleActionPanel('')">取消</button>
                <button type="button" class="submit-comment primary" @click="submitShareArticle">确认转发</button>
              </div>
            </div>
            <div v-else class="action-form">
              <select v-model="reportReason">
                <option value="垃圾内容">垃圾内容</option>
                <option value="骚扰辱骂">骚扰辱骂</option>
                <option value="违法违规">违法违规</option>
                <option value="侵权抄袭">侵权抄袭</option>
              </select>
              <textarea
                v-model="reportDetails"
                rows="2"
                maxlength="600"
                placeholder="可选：补充说明..."
              ></textarea>
              <div class="action-form-buttons">
                <button type="button" class="submit-comment" @click="toggleActionPanel('')">取消</button>
                <button type="button" class="submit-comment primary" @click="submitReportArticle">提交举报</button>
              </div>
            </div>
          </div>
          <p v-if="actionNotice" class="action-notice">{{ actionNotice }}</p>
        </header>

        <div v-if="!isFocusMode" class="article-hero" :style="{ background: article.gradient }">
          <div class="hero-overlay"></div>
        </div>

        <article class="article-body" ref="articleBody" v-html="article.content"></article>

        <section v-if="showComments" class="comment-section">
          <h3>评论</h3>
          <div v-if="commentLoading" class="comment-loading">评论加载中...</div>
          <div v-else class="comment-list">
            <div v-if="!comments.length" class="comment-empty">还没有评论</div>
            <article v-for="comment in comments" :key="comment.id" class="comment-item">
              <header>
                <strong>{{ comment.author_username || '用户' }}</strong>
                <span>{{ formatDate(comment.created_at) }}</span>
              </header>
              <p v-if="comment.parent_id && commentParentMap[comment.id]" class="reply-parent">
                回复 {{ commentParentMap[comment.id].author_username || '用户' }}：{{ commentParentMap[comment.id].content }}
              </p>
              <p>{{ comment.content }}</p>
              <button v-if="authStore.isLoggedIn" class="reply-btn" type="button" @click="setReplyTarget(comment)">回复</button>
            </article>
          </div>
          <div v-if="authStore.isLoggedIn" class="comment-editor">
            <div v-if="replyTarget" class="replying-hint">
              正在回复 {{ replyTarget.author_username || '用户' }}
              <button type="button" @click="clearReplyTarget">取消</button>
            </div>
            <textarea v-model="commentDraft" rows="3" maxlength="1000" placeholder="写下你的评论..."></textarea>
            <button type="button" class="submit-comment" @click="submitComment">发送评论</button>
          </div>
          <p v-else class="comment-hint">登录后可发表评论</p>
        </section>

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
import apiService, { resolveAssetUrl } from '../api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const articleBody = ref(null)
const activeTocId = ref('')
const toc = ref([])
const article = ref(null)
const relatedArticles = ref([])
const isFocusMode = ref(false)
const loading = ref(true)
const error = ref(null)
const focusStorageKey = 'article-focus-mode'
const engagement = ref({ likes: 0, dislikes: 0, comments: 0, shares: 0, myReaction: 0 })
const showComments = ref(false)
const comments = ref([])
const commentLoading = ref(false)
const commentDraft = ref('')
const commentParentMap = ref({})
const replyTarget = ref(null)
const authorFollowed = ref(false)
const actionPanelMode = ref('')
const shareDraft = ref('')
const reportReason = ref('垃圾内容')
const reportDetails = ref('')
const actionNotice = ref('')
let actionNoticeTimer = null

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
    await Promise.all([
      loadEngagement(rawArticle.id || id),
      loadAuthorFollowState(rawArticle.author_id || 0)
    ])

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

const isImageAvatar = (avatar) =>
  typeof avatar === 'string' &&
  /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(avatar)

const getAvatarText = (avatar, username) => {
  if (isImageAvatar(avatar)) return (username || 'U').charAt(0).toUpperCase()
  const trimmed = typeof avatar === 'string' ? avatar.trim() : ''
  if (trimmed) return trimmed.charAt(0).toUpperCase()
  return (username || 'U').charAt(0).toUpperCase()
}

const loadAuthorFollowState = async (authorId) => {
  if (!authStore.isLoggedIn || !authorId || Number(authorId) === Number(authStore.user?.id)) {
    authorFollowed.value = false
    return
  }
  try {
    const response = await apiService.getFollowState(authorId)
    authorFollowed.value = !!response.data?.isFollowing
  } catch (err) {
    console.error('获取作者关注状态失败:', err)
  }
}

const toggleAuthorFollow = async () => {
  const authorId = Number(article.value?.author_id || 0)
  if (!authorId || authorId === Number(authStore.user?.id)) return
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    return
  }

  try {
    if (authorFollowed.value) {
      await apiService.unfollowUser(authorId)
      authorFollowed.value = false
    } else {
      await apiService.followUser(authorId)
      authorFollowed.value = true
    }
  } catch (err) {
    console.error('关注操作失败:', err)
    alert(err.message || '操作失败')
  }
}

const messageAuthor = async () => {
  const authorId = Number(article.value?.author_id || 0)
  if (!authorId || authorId === Number(authStore.user?.id)) return
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  const content = prompt(`发给 ${article.value?.author_username || '作者'} 的私信内容：`) || ''
  if (!content.trim()) return
  try {
    await apiService.sendPrivateMessage(authorId, content)
    alert('私信已发送')
  } catch (err) {
    console.error('发送私信失败:', err)
    alert(err.message || '发送失败')
  }
}

const loadEngagement = async (articleId) => {
  try {
    const response = await apiService.getEngagement('article', [articleId])
    const stats = response.data?.[articleId] || response.data?.[Number(articleId)] || {}
    engagement.value = {
      likes: Number(stats.likes || 0),
      dislikes: Number(stats.dislikes || 0),
      comments: Number(stats.comments || 0),
      shares: Number(stats.shares || 0),
      myReaction: Number(stats.myReaction || 0)
    }
  } catch (err) {
    console.error('获取互动数据失败:', err)
  }
}

const reactArticle = async (reaction) => {
  if (!authStore.isLoggedIn) {
    alert('请先登录后再互动')
    return
  }
  if (!article.value?.id) return

  try {
    const response = await apiService.reactToContent('article', article.value.id, reaction)
    const data = response.data || {}
    engagement.value = {
      likes: Number(data.likes || 0),
      dislikes: Number(data.dislikes || 0),
      comments: Number(data.comments || engagement.value.comments || 0),
      shares: Number(data.shares || engagement.value.shares || 0),
      myReaction: Number(data.myReaction || 0)
    }
  } catch (err) {
    console.error('互动失败:', err)
  }
}

const toggleComments = async () => {
  showComments.value = !showComments.value
  if (showComments.value) {
    await loadComments()
  }
}

const loadComments = async () => {
  if (!article.value?.id) return
  commentLoading.value = true
  try {
    const response = await apiService.getComments('article', article.value.id, 100)
    const list = response.data || []
    comments.value = list
    const parentLookup = {}
    list.forEach((item) => {
      if (item.parent_id) {
        const parent = list.find((x) => Number(x.id) === Number(item.parent_id))
        if (parent) parentLookup[item.id] = parent
      }
    })
    commentParentMap.value = parentLookup
  } catch (err) {
    console.error('加载评论失败:', err)
  } finally {
    commentLoading.value = false
  }
}

const submitComment = async () => {
  if (!authStore.isLoggedIn) {
    alert('请先登录后再评论')
    return
  }
  const content = commentDraft.value.trim()
  if (!content || !article.value?.id) return

  try {
    const response = await apiService.createComment({
      targetType: 'article',
      targetId: article.value.id,
      content,
      parentId: replyTarget.value?.id || null
    })
    comments.value = [response.data, ...comments.value]
    if (response.data?.parent_id) {
      const parent = comments.value.find((x) => Number(x.id) === Number(response.data.parent_id))
      if (parent) {
        commentParentMap.value = { ...commentParentMap.value, [response.data.id]: parent }
      }
    }
    commentDraft.value = ''
    clearReplyTarget()
    engagement.value.comments += 1
  } catch (err) {
    console.error('评论失败:', err)
    alert(err.message || '评论失败')
  }
}

const setReplyTarget = (comment) => {
  replyTarget.value = comment
}

const clearReplyTarget = () => {
  replyTarget.value = null
}

const setActionNotice = (text) => {
  actionNotice.value = text
  if (actionNoticeTimer) clearTimeout(actionNoticeTimer)
  actionNoticeTimer = setTimeout(() => {
    actionNotice.value = ''
  }, 2200)
}

const toggleActionPanel = (mode) => {
  actionPanelMode.value = actionPanelMode.value === mode ? '' : mode
}

const submitShareArticle = async () => {
  if (!authStore.isLoggedIn) {
    setActionNotice('请先登录后再转发')
    return
  }
  if (!article.value?.id) return
  const comment = shareDraft.value.trim()
  try {
    const response = await apiService.shareContent({
      targetType: 'article',
      targetId: article.value.id,
      comment
    })
    const shareCount = Number(response.data?.engagement?.shares || 0)
    engagement.value.shares = shareCount
    shareDraft.value = ''
    actionPanelMode.value = ''
    setActionNotice('已转发')
  } catch (err) {
    console.error('转发失败:', err)
    setActionNotice(err.message || '转发失败')
  }
}

const submitReportArticle = async () => {
  if (!authStore.isLoggedIn) {
    setActionNotice('请先登录后再举报')
    return
  }
  if (!article.value?.id) return

  const reason = reportReason.value.trim()
  const details = reportDetails.value.trim()

  try {
    await apiService.reportContent({
      targetType: 'article',
      targetId: article.value.id,
      reason,
      details
    })
    reportDetails.value = ''
    actionPanelMode.value = ''
    setActionNotice('举报已提交')
  } catch (err) {
    console.error('举报失败:', err)
    setActionNotice(err.message || '举报失败')
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
  padding: 0 22px calc(76px + var(--safe-bottom));
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
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 20px;
  padding: 0 28px 30px;
  box-shadow: var(--ux-shadow-soft);
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
}

.article-layout.focus-mode {
  max-width: 980px;
}

.article-layout.focus-mode .article-container {
  max-width: 760px;
}

/* Article Header */
.article-header {
  padding: 28px 0 20px;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 18px;
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
  animation-delay: 30ms;
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
  min-height: 34px;
  padding: 6px 12px;
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
  line-height: 1.18;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.article-description {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.68;
}

.article-author-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-weight: 600;
  color: var(--color-text-primary);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-info strong {
  font-size: 14px;
  color: var(--color-text-primary);
}

.author-info span {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.author-actions {
  display: flex;
  gap: 8px;
}

.author-btn {
  min-height: 32px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  padding: 0 10px;
  font-size: 12px;
}

.author-btn.active {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 34%, var(--color-border-light));
}

.article-actions {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
}

.action-btn.active {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 34%, var(--color-border-light));
}

.action-btn.danger {
  color: #d64f4f;
}

.action-panel {
  margin-top: 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 10px;
  background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent);
}

.action-form {
  display: grid;
  gap: 8px;
}

.action-form textarea,
.action-form select {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.action-form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-notice {
  margin-top: 8px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

/* Article Hero */
.article-hero {
  height: 68px;
  border-radius: 10px;
  margin-bottom: 20px;
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
  line-height: 1.85;
  color: var(--color-text-primary);
  max-width: 66ch;
  margin: 0 auto;
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
  margin-bottom: 20px;
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
  -webkit-overflow-scrolling: touch;
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.comment-section {
  margin-top: 24px;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 14px;
  background: color-mix(in srgb, var(--color-surface-elevated) 68%, transparent);
}

.comment-section h3 {
  margin: 0 0 10px;
  font-size: 18px;
}

.comment-loading,
.comment-empty,
.comment-hint {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.comment-list {
  display: grid;
  gap: 10px;
}

.comment-item {
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 10px;
}

.comment-item header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.comment-item p {
  margin: 8px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-parent {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.reply-btn {
  margin-top: 6px;
  min-height: 28px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  font-size: 12px;
  padding: 0 10px;
}

.comment-editor {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.replying-hint {
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

.replying-hint button {
  border: none;
  background: none;
  color: var(--color-accent);
  font-size: 12px;
}

.comment-editor textarea {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  min-height: 80px;
  padding: 8px 10px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
}

.submit-comment {
  justify-self: end;
  min-height: 36px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-surface-elevated);
  color: var(--color-text-secondary);
  padding: 0 12px;
}

.submit-comment.primary {
  color: #fff;
  border-color: transparent;
  background: var(--color-accent);
}

.article-author-row,
.article-actions,
.comment-section,
.related-card {
  box-shadow: var(--ux-shadow-soft);
}

.author-btn,
.action-btn,
.reply-btn,
.submit-comment,
.back-button {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.author-btn,
.action-btn,
.reply-btn,
.submit-comment {
  background: color-mix(in srgb, var(--color-surface-elevated) 94%, transparent);
}

.author-btn:hover,
.action-btn:hover,
.reply-btn:hover,
.submit-comment:hover,
.back-button:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-accent-subtle) 54%, var(--color-surface));
}

.action-btn.active {
  background: color-mix(in srgb, var(--color-accent-subtle) 72%, var(--color-surface));
}

.action-btn.danger:hover {
  border-color: color-mix(in srgb, #d64f4f 34%, var(--color-border));
  background: color-mix(in srgb, #d64f4f 12%, var(--color-surface));
  color: #b13232;
}

.author-btn:focus-visible,
.action-btn:focus-visible,
.reply-btn:focus-visible,
.submit-comment:focus-visible,
.back-button:focus-visible,
.comment-editor textarea:focus-visible {
  outline: none;
  box-shadow: var(--ux-ring);
}

.comment-item {
  background: color-mix(in srgb, var(--color-surface-elevated) 76%, transparent);
  animation: fade-up-in var(--motion-fast) var(--motion-spring) both;
}

/* Article Footer */
.article-footer {
  margin-top: 30px;
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
  margin-top: 26px;
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
    padding: 0 16px calc(72px + var(--safe-bottom));
  }

  .article-container {
    border-radius: 14px;
    padding: 0 14px 22px;
  }

  .article-header {
    padding: 22px 0 16px;
  }

  .article-meta {
    gap: 6px;
    margin-bottom: 16px;
  }

  .meta-divider {
    display: none;
  }

  .article-date,
  .article-read-time {
    font-size: 13px;
  }

  .focus-toggle {
    margin-left: 0;
    width: 100%;
    min-height: 40px;
    justify-self: stretch;
    margin-top: 4px;
    border-radius: 10px;
  }

  .article-title {
    font-size: 28px;
  }

  .article-description {
    font-size: 15px;
  }

  .article-author-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .author-actions {
    width: 100%;
  }

  .author-btn {
    flex: 1;
  }

  .article-hero {
    height: 140px;
    margin-bottom: 24px;
    border-radius: var(--radius-lg);
  }

  .article-body {
    font-size: 15px;
    line-height: 1.78;
  }

  .article-body :deep(h2) {
    font-size: 22px;
    margin: 28px 0 12px;
  }

  .article-body :deep(h3) {
    font-size: 18px;
    margin: 22px 0 10px;
  }

  .article-body :deep(pre) {
    padding: 16px;
    font-size: 13px;
    margin: 18px 0;
  }

  .back-button {
    width: 100%;
    justify-content: center;
    min-height: 44px;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>



