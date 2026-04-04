<template>
  <div class="messages-page">
    <Transition name="feedback-fade">
      <p v-if="feedbackText" class="feedback-banner" :class="feedbackType">{{ feedbackText }}</p>
    </Transition>

    <section class="messages-header">
      <div>
        <h1>消息中心</h1>
        <p>通知、私信和关注管理都在这里。</p>
      </div>
      <div class="header-actions" v-if="activeTab === 'notifications'">
        <button class="outline-btn chip-button" type="button" @click="enablePush" :disabled="notificationsStore.pushEnabled">
          {{ notificationsStore.pushEnabled ? '离线推送已开启' : '开启离线推送' }}
        </button>
        <button class="outline-btn chip-button" type="button" @click="sendPushTest" :disabled="!notificationsStore.pushEnabled">
          发送测试推送
        </button>
        <button class="outline-btn chip-button" type="button" @click="markAllRead" :disabled="notificationsStore.unreadCount === 0">
          全部已读
        </button>
      </div>
    </section>

    <div class="tab-bar ux-tab-shell">
      <button class="tab-btn ux-tab" :class="{ active: activeTab === 'notifications' }" type="button" @click="activeTab = 'notifications'">
        通知
      </button>
      <button class="tab-btn ux-tab" :class="{ active: activeTab === 'dm' }" type="button" @click="activeTab = 'dm'">
        私信
      </button>
      <button class="tab-btn ux-tab" :class="{ active: activeTab === 'follows' }" type="button" @click="activeTab = 'follows'">
        关注
      </button>
    </div>

    <section v-if="activeTab === 'notifications'" class="messages-section">
      <section class="messages-stats">
        <span class="stat-pill">未读 {{ notificationsStore.unreadCount }}</span>
        <span class="stat-pill" :class="{ ok: notificationsStore.streamConnected }">
          {{ notificationsStore.streamConnected ? '实时连接中' : '实时连接断开' }}
        </span>
      </section>

      <section class="messages-list">
        <div v-if="notificationsStore.loading" class="empty-state">加载中...</div>
        <div v-else-if="!notificationsStore.items.length" class="empty-state">暂无消息通知</div>
        <article
          v-for="item in notificationsStore.items"
          :key="item.id"
          class="message-card ux-card"
          :class="{ unread: !item.is_read }"
        >
          <div class="message-main" @click="openMessage(item)">
            <h3>{{ item.title || '新消息' }}</h3>
            <p>{{ item.content || '你有一条新的通知。' }}</p>
            <span class="meta">{{ formatTime(item.created_at) }}</span>
          </div>
          <button
            v-if="!item.is_read"
            class="mini-btn chip-button"
            type="button"
            @click.stop="markOne(item.id)"
          >
            标记已读
          </button>
        </article>
      </section>
    </section>

    <section v-else-if="activeTab === 'dm'" class="dm-layout">
      <aside class="dm-sidebar">
        <div class="sidebar-title">会话列表</div>
        <div v-if="dmLoading" class="empty-state compact">加载中...</div>
        <div v-else-if="!conversations.length" class="empty-state compact">暂无会话</div>
        <button
          v-for="item in conversations"
          :key="item.peer_id"
          class="conversation-item ux-card"
          :class="{ active: activePeerId === item.peer_id }"
          type="button"
          @click="selectConversation(item.peer_id)"
        >
          <span class="peer-name">{{ item.peer?.username || `用户${item.peer_id}` }}</span>
          <span class="peer-preview">{{ item.latest_message?.content || '点击开始聊天' }}</span>
          <span v-if="item.unread_count > 0" class="peer-badge">{{ item.unread_count }}</span>
        </button>
      </aside>

      <div class="dm-main">
        <template v-if="activePeerId">
          <header class="dm-header">
            <h3>{{ activePeer?.username || `用户${activePeerId}` }}</h3>
          </header>
          <div class="dm-messages" ref="dmListRef">
            <div v-if="messageLoading" class="empty-state compact">加载中...</div>
            <div v-else-if="!messages.length" class="empty-state compact">还没有消息，打个招呼吧</div>
            <article
              v-for="msg in messages"
              :key="msg.id"
              class="dm-message"
              :class="{ mine: Number(msg.sender_id) === Number(authStore.user?.id) }"
            >
              <p>{{ msg.content }}</p>
              <span>{{ formatTime(msg.created_at) }}</span>
            </article>
          </div>
          <div class="dm-editor">
            <textarea v-model="dmDraft" rows="2" maxlength="1000" placeholder="输入私信内容..."></textarea>
            <button type="button" class="outline-btn chip-button" @click="sendDm">发送</button>
          </div>
        </template>
        <div v-else class="empty-state">从左侧选择会话，或在关注页发起私信</div>
      </div>
    </section>

    <section v-else class="follows-section">
      <div class="follows-grid">
        <article v-for="user in userList" :key="user.id" class="user-card ux-card">
          <div class="user-main">
            <div class="avatar-box">
              <img v-if="isImageAvatar(user.avatar)" :src="resolveAssetUrl(user.avatar)" alt="avatar" class="avatar-image" />
              <span v-else>{{ getAvatarText(user.avatar, user.username) }}</span>
            </div>
            <div class="user-info">
              <h3>{{ user.username }}</h3>
              <p>{{ user.headline || '这个人很低调，还没有简介。' }}</p>
            </div>
          </div>
          <div class="user-actions">
            <button
              class="outline-btn chip-button"
              type="button"
              :class="{ primary: followStates[user.id] }"
              @click="toggleFollow(user)"
            >
              {{ followStates[user.id] ? '已关注' : '关注' }}
            </button>
            <button class="outline-btn chip-button" type="button" @click="startDm(user)">私信</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import apiService, { resolveAssetUrl } from '../api'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

const activeTab = ref('notifications')

const conversations = ref([])
const activePeerId = ref(0)
const messages = ref([])
const dmDraft = ref('')
const dmLoading = ref(false)
const messageLoading = ref(false)
const dmListRef = ref(null)

const userList = ref([])
const followStates = ref({})
const feedbackText = ref('')
const feedbackType = ref('success')
let dmPollTimer = null
let feedbackTimer = null

const activePeer = computed(() => conversations.value.find((item) => Number(item.peer_id) === Number(activePeerId.value))?.peer || null)

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('zh-CN', { hour12: false })
}

const isImageAvatar = (avatar) => typeof avatar === 'string' && /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(avatar)

const getAvatarText = (avatar, username) => {
  if (isImageAvatar(avatar)) return (username || 'U').charAt(0).toUpperCase()
  const trimmed = typeof avatar === 'string' ? avatar.trim() : ''
  if (trimmed) return trimmed.charAt(0).toUpperCase()
  return (username || 'U').charAt(0).toUpperCase()
}

const setFeedback = (text, type = 'success') => {
  feedbackText.value = text
  feedbackType.value = type
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedbackText.value = ''
  }, 2200)
}

const enablePush = async () => {
  try {
    await notificationsStore.subscribeSystemPush()
    setFeedback('离线推送已开启')
  } catch (error) {
    setFeedback(error.message || '开启离线推送失败', 'error')
  }
}

const sendPushTest = async () => {
  try {
    await notificationsStore.sendPushTest()
    setFeedback('测试推送已发送')
  } catch (error) {
    setFeedback(error.message || '测试推送发送失败', 'error')
  }
}

const markOne = async (id) => {
  await notificationsStore.markOneRead(id)
}

const markAllRead = async () => {
  await notificationsStore.markAllRead()
}

const openMessage = async (item) => {
  if (!item?.is_read) {
    await markOne(item.id)
  }
  if (item?.link) {
    router.push(item.link)
  }
}

const loadConversations = async () => {
  if (!authStore.isLoggedIn) return
  dmLoading.value = true
  try {
    const res = await apiService.getPrivateConversations(100)
    conversations.value = res.data || []
  } catch (error) {
    console.error('获取会话失败:', error)
  } finally {
    dmLoading.value = false
  }
}

const loadMessages = async (peerId) => {
  if (!peerId || !authStore.isLoggedIn) return
  messageLoading.value = true
  try {
    const res = await apiService.getPrivateMessages(peerId, 200)
    messages.value = res.data || []
    await apiService.markPrivateMessagesRead(peerId)
    await loadConversations()
    await nextTick()
    if (dmListRef.value) {
      dmListRef.value.scrollTop = dmListRef.value.scrollHeight
    }
  } catch (error) {
    console.error('获取私信失败:', error)
  } finally {
    messageLoading.value = false
  }
}

const selectConversation = async (peerId) => {
  activePeerId.value = Number(peerId)
  await loadMessages(activePeerId.value)
}

const refreshActiveMessages = async () => {
  if (!authStore.isLoggedIn || !activePeerId.value || activeTab.value !== 'dm') return
  try {
    const res = await apiService.getPrivateMessages(activePeerId.value, 200)
    messages.value = res.data || []
    await apiService.markPrivateMessagesRead(activePeerId.value)
  } catch (error) {
    console.error('刷新私信失败:', error)
  }
}

const sendDm = async () => {
  if (!authStore.isLoggedIn) {
    setFeedback('请先登录', 'error')
    return
  }
  const content = dmDraft.value.trim()
  if (!activePeerId.value || !content) return

  try {
    const res = await apiService.sendPrivateMessage(activePeerId.value, content)
    messages.value = [...messages.value, res.data]
    dmDraft.value = ''
    await loadConversations()
    await nextTick()
    if (dmListRef.value) {
      dmListRef.value.scrollTop = dmListRef.value.scrollHeight
    }
  } catch (error) {
    console.error('发送私信失败:', error)
    setFeedback(error.message || '发送失败', 'error')
  }
}

const loadUsers = async () => {
  try {
    const res = await apiService.getUsers({ page: 1, limit: 100 })
    const selfId = Number(authStore.user?.id || 0)
    userList.value = (res.data?.users || []).filter((user) => Number(user.id) !== selfId)

    if (authStore.isLoggedIn && userList.value.length) {
      const ids = userList.value.map((item) => item.id)
      const statesRes = await apiService.getFollowStates(ids)
      followStates.value = statesRes.data || {}
    }
  } catch (error) {
    console.error('获取用户失败:', error)
  }
}

const toggleFollow = async (user) => {
  if (!authStore.isLoggedIn) {
    setFeedback('请先登录', 'error')
    return
  }

  const targetId = Number(user.id)
  const following = !!followStates.value[targetId]
  try {
    if (following) {
      await apiService.unfollowUser(targetId)
      followStates.value = { ...followStates.value, [targetId]: false }
    } else {
      await apiService.followUser(targetId)
      followStates.value = { ...followStates.value, [targetId]: true }
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    setFeedback(error.message || '操作失败', 'error')
  }
}

const startDm = async (user) => {
  activeTab.value = 'dm'
  const peerId = Number(user.id)
  activePeerId.value = peerId
  const exists = conversations.value.some((item) => Number(item.peer_id) === peerId)
  if (!exists) {
    conversations.value = [
      {
        peer_id: peerId,
        unread_count: 0,
        peer: { id: peerId, username: user.username, avatar: user.avatar, headline: user.headline },
        latest_message: null
      },
      ...conversations.value
    ]
  }
  await loadMessages(peerId)
}

const startDmPolling = () => {
  stopDmPolling()
  dmPollTimer = setInterval(async () => {
    if (!authStore.isLoggedIn || activeTab.value !== 'dm') return
    await loadConversations()
    await refreshActiveMessages()
  }, 8000)
}

const stopDmPolling = () => {
  if (dmPollTimer) {
    clearInterval(dmPollTimer)
    dmPollTimer = null
  }
}

watch(activeTab, async (tab) => {
  if (tab === 'dm') {
    await loadConversations()
    await refreshActiveMessages()
    startDmPolling()
  } else {
    stopDmPolling()
  }
  if (tab === 'follows') {
    await loadUsers()
  }
})

onMounted(async () => {
  await notificationsStore.fetchList({ limit: 50 })
  await notificationsStore.refreshUnread()
  if (authStore.isLoggedIn) {
    await Promise.all([loadConversations(), loadUsers()])
    if (activeTab.value === 'dm') {
      startDmPolling()
    }
  }
})

onUnmounted(() => {
  stopDmPolling()
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
    feedbackTimer = null
  }
})
</script>

<style scoped>
.messages-page {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 22px var(--layout-gutter) calc(88px + var(--safe-bottom));
}

.feedback-banner {
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, #0f8a63 30%, var(--color-border-light));
  background: color-mix(in srgb, #0f8a63 12%, var(--color-surface));
  color: #0f8a63;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 12px;
}

.feedback-banner.error {
  border-color: color-mix(in srgb, #dc2626 28%, var(--color-border-light));
  background: color-mix(in srgb, #dc2626 10%, var(--color-surface));
  color: #b42323;
}

.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity var(--motion-base) var(--motion-smooth), transform var(--motion-fast) var(--motion-spring);
}

.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px var(--panel-padding);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 88%, transparent);
  border-radius: 14px;
  background: var(--surface-panel);
}

.messages-header h1 {
  font-size: clamp(26px, 2.8vw, 32px);
  letter-spacing: -0.02em;
  margin: 0 0 6px;
}

.messages-header p {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 14px;
}

.tab-bar {
  margin-top: 12px;
  display: inline-flex;
  gap: 16px;
  opacity: 0.9;
}

.tab-btn {
  min-height: var(--ui-tab-height);
  transition:
    transform var(--motion-fast) var(--motion-spring),
    background-color var(--motion-base) var(--motion-smooth),
    color var(--motion-base) var(--motion-smooth);
}

.tab-btn.active {
  background: transparent;
  color: var(--color-text-secondary);
}

.tab-btn:hover {
  transform: none;
}

.messages-section {
  margin-top: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.outline-btn {
  min-height: var(--ui-action-height);
  border-radius: 999px;
  padding: 0 11px;
  font-size: var(--ui-action-font);
  font-weight: 600;
}

.outline-btn.primary {
  border-color: color-mix(in srgb, var(--color-accent) 42%, var(--color-border));
  color: var(--color-accent);
}

.outline-btn:disabled {
  opacity: 0.58;
}

.messages-stats {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  opacity: 0.84;
}

.stat-pill {
  min-height: var(--ui-tab-height);
  border-radius: 999px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: var(--ui-meta-font);
}

.stat-pill.ok {
  color: #0f8a63;
  border-color: color-mix(in srgb, #0f8a63 26%, var(--color-border-light));
}

.messages-list {
  margin-top: 14px;
  display: grid;
  gap: 8px;
  border-top: 0;
}

.message-card {
  border-radius: var(--panel-radius);
  padding: 12px var(--panel-padding);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  animation: fade-up-in var(--motion-base) var(--motion-spring) both;
}

.messages-list .message-card:nth-child(1) { animation-delay: 20ms; }
.messages-list .message-card:nth-child(2) { animation-delay: 45ms; }
.messages-list .message-card:nth-child(3) { animation-delay: 70ms; }
.messages-list .message-card:nth-child(4) { animation-delay: 95ms; }

.message-card.unread {
  border-color: color-mix(in srgb, var(--color-accent) 26%, var(--color-border-light));
  background: color-mix(in srgb, var(--surface-panel-hover) 84%, transparent);
}

.message-main {
  min-width: 0;
  cursor: pointer;
}

.message-main h3 {
  font-size: 15px;
  margin: 0;
  color: var(--color-text-primary);
}

.message-main p {
  margin-top: 5px;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.meta {
  margin-top: 8px;
  display: inline-block;
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
}

.mini-btn {
  align-self: center;
  min-height: var(--ui-tab-height);
  padding: 0 9px;
  font-size: var(--ui-action-font);
}

.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  color: var(--color-text-tertiary);
}

.empty-state.compact {
  padding: 12px;
  border-radius: 10px;
}

.dm-layout {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 14px;
}

.dm-sidebar,
.dm-main {
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--surface-panel);
  padding: var(--panel-padding);
}

.sidebar-title {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.conversation-item {
  width: 100%;
  text-align: left;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 8px;
  position: relative;
  transition:
    transform var(--motion-fast) var(--motion-spring),
    border-color var(--motion-base) var(--motion-smooth),
    background-color var(--motion-base) var(--motion-smooth);
}

.conversation-item.active {
  border-color: color-mix(in srgb, var(--color-accent) 16%, var(--color-border-light));
  background: var(--surface-panel-hover);
}

.conversation-item:hover {
  transform: none;
  border-color: color-mix(in srgb, var(--color-accent) 14%, var(--color-border-light));
  background: var(--surface-panel-hover);
}

.peer-name {
  display: block;
  font-size: var(--ui-meta-font);
  color: var(--color-text-primary);
}

.peer-preview {
  display: block;
  margin-top: 3px;
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peer-badge {
  position: absolute;
  right: 10px;
  top: 10px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #e55454;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.dm-header h3 {
  margin: 2px 0 8px;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.dm-messages {
  min-height: 360px;
  max-height: 460px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

.dm-message {
  max-width: 80%;
  border: 1px solid color-mix(in srgb, var(--color-border-light) 76%, transparent);
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--surface-embedded);
  animation: soft-pop-in var(--motion-fast) var(--motion-spring) both;
}

.dm-message.mine {
  align-self: flex-end;
  border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border-light));
  background: var(--surface-panel-hover);
}

.dm-message p {
  margin: 0;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.dm-message span {
  display: block;
  margin-top: 6px;
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
}

.dm-editor {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.dm-editor textarea {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 8px 10px;
  resize: vertical;
  min-height: 64px;
  background: var(--surface-embedded);
  color: var(--color-text-primary);
  font-family: inherit;
}

.follows-section {
  margin-top: 14px;
}

.follows-grid {
  display: grid;
  gap: 10px;
}

.user-card {
  padding: var(--panel-padding);
}

.user-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-box {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--surface-embedded);
  border: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 11px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h3 {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.user-info p {
  margin-top: 4px;
  font-size: var(--ui-meta-font);
  color: var(--color-text-tertiary);
}

.user-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .messages-page {
    padding: 18px var(--layout-gutter-mobile) calc(88px + var(--safe-bottom));
  }

  .messages-header {
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .tab-bar {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .dm-layout {
    grid-template-columns: 1fr;
  }

  .dm-messages {
    min-height: 240px;
    max-height: 320px;
  }
}
</style>
