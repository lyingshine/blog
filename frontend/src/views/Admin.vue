<template>
  <div class="admin-dashboard">
    <!-- 顶部导航栏 -->
    <header class="dashboard-header backdrop-blur bg-elevated">
      <div class="container container-xl">
        <div class="header-content flex justify-between items-center py-6">
          <div class="header-info">
            <h1 class="dashboard-title text-responsive-3xl font-extrabold leading-tight mb-2">数据管理</h1>
            <p class="dashboard-subtitle text-responsive-base text-secondary">个人数据管理中心</p>
          </div>
          <div class="header-actions flex items-center gap-4">
            <button @click="refreshAllData" class="btn btn-outline" :disabled="loading">
              <Icon name="refresh" :class="{ 'animate-spin': loading }" />
              刷新数据
            </button>
            <div class="user-menu card card-compact flex items-center gap-3">
              <img :src="currentUser?.avatar || '/default-avatar.svg'" 
                   :alt="currentUser?.username" 
                   class="user-avatar w-8 h-8 rounded-full">
              <span class="user-name font-medium text-primary">{{ currentUser?.username }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="container container-xl">
      <!-- 统计卡片 -->
      <section class="stats-section py-8">
        <div class="stats-grid grid grid-auto-fit-md gap-6">
          <StatCard 
            v-for="stat in statsData" 
            :key="stat.key"
            :title="stat.title"
            :value="stat.value"
            :icon="stat.icon"
            :color="stat.color"
            :trend="stat.trend"
          />
        </div>
      </section>

      <!-- 快速操作 -->
      <section class="quick-actions py-8">
        <div class="section-header mb-6">
          <h2 class="text-responsive-2xl font-bold text-inverse">快速操作</h2>
        </div>
        <div class="actions-grid grid grid-auto-fit-sm gap-4">
          <ActionCard
            title="新建文章"
            description="创建新的博客文章"
            icon="plus"
            color="blue"
            @click="$router.push('/create')"
          />

          <ActionCard
            title="系统设置"
            description="配置系统参数"
            icon="settings"
            color="purple"
            @click="activeTab = 'settings'"
          />
          <ActionCard
            title="数据备份"
            description="备份系统数据"
            icon="database"
            color="orange"
            @click="backupData"
          />
        </div>
      </section>

      <!-- 主要内容区域 -->
      <section class="main-content card rounded-3xl shadow-lg mb-8 overflow-hidden">
        <div class="nav-pills content-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="['nav-pill', { active: activeTab === tab.key }]"
          >
            <Icon :name="tab.icon" />
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="badge badge-secondary ml-2">{{ tab.count }}</span>
          </button>
        </div>

        <div class="tab-content">
          <!-- 文章管理 -->
          <div v-if="activeTab === 'articles'" class="tab-panel p-8">
            <ArticleManagement 
              :articles="articles"
              :loading="loading"
              @refresh="fetchArticles"
              @delete="handleDeleteArticle"
              @toggle-status="handleToggleArticleStatus"
            />
          </div>



          <!-- 评论管理 -->
          <div v-if="activeTab === 'comments'" class="tab-panel p-8">
            <CommentManagement 
              :comments="comments"
              :loading="loading"
              @refresh="loadComments"
              @approve="handleApproveComment"
              @delete="handleDeleteComment"
            />
          </div>

          <!-- 灵感管理 -->
          <div v-if="activeTab === 'inspirations'" class="tab-panel p-8">
            <InspirationManagement 
              :inspirations="inspirations"
              :loading="loading"
              @refresh="loadInspirations"
              @delete="handleDeleteInspiration"
            />
          </div>

          <!-- 系统设置 -->
          <div v-if="activeTab === 'settings'" class="tab-panel p-8">
            <SystemSettings 
              :server-status="serverStatus"
              :db-status="dbStatus"
              @init-database="handleInitDatabase"
              @create-sample-data="handleCreateSampleData"
              @clear-cache="handleClearCache"
            />
          </div>

          <!-- 回收站 -->
          <div v-if="activeTab === 'trash'" class="tab-panel p-8">
            <TrashManagement 
              :trash-articles="trashArticles"
              :loading="loading"
              @refresh="fetchTrashArticles"
              @restore="handleRestoreArticle"
              @permanent-delete="handlePermanentDeleteArticle"
              @clear-all="handleClearAllTrash"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- 全局加载遮罩 -->
    <LoadingOverlay v-if="loading" />

    <!-- 通知组件 -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useArticleStore } from '../stores/article.store'
import { useNotificationStore } from '../stores/notification.store'

// 组件导入
import StatCard from '../components/admin/StatCard.vue'
import ActionCard from '../components/admin/ActionCard.vue'
import ArticleManagement from '../components/admin/ArticleManagement.vue'

import CommentManagement from '../components/admin/CommentManagement.vue'
import InspirationManagement from '../components/admin/InspirationManagement.vue'
import SystemSettings from '../components/admin/SystemSettings.vue'
import TrashManagement from '../components/admin/TrashManagement.vue'
import LoadingOverlay from '../components/common/LoadingOverlay.vue'
import NotificationContainer from '../components/common/NotificationContainer.vue'
import Icon from '../components/common/Icon.vue'

const router = useRouter()
const authStore = useAuthStore()
const articleStore = useArticleStore()
const notificationStore = useNotificationStore()

// 响应式数据
const loading = ref(false)
const activeTab = ref('articles')

// 统计数据
const stats = reactive({
  articles: 0,
  comments: 0,
  inspirations: 0,
  views: 0,
  todayViews: 0
})

// 业务数据
const comments = ref([])
const inspirations = ref([])
const serverStatus = ref('online')
const dbStatus = ref('connected')

// 计算属性
const currentUser = computed(() => authStore.user)

const articles = computed(() => articleStore.articles.value || [])
const trashArticles = computed(() => articleStore.trashArticles.value || [])

const statsData = computed(() => [
  {
    key: 'articles',
    title: '文章总数',
    value: stats.articles,
    icon: 'document',
    color: 'blue',
    trend: { value: 12, type: 'up' }
  },
  {
    key: 'comments',
    title: '评论总数',
    value: stats.comments,
    icon: 'chat',
    color: 'purple',
    trend: { value: 5, type: 'down' }
  },
  {
    key: 'inspirations',
    title: '灵感总数',
    value: stats.inspirations,
    icon: 'lightbulb',
    color: 'yellow',
    trend: { value: 15, type: 'up' }
  },
  {
    key: 'views',
    title: '总浏览量',
    value: stats.views,
    icon: 'eye',
    color: 'indigo',
    trend: { value: 23, type: 'up' }
  },
  {
    key: 'todayViews',
    title: '今日浏览',
    value: stats.todayViews,
    icon: 'trending-up',
    color: 'pink',
    trend: { value: 45, type: 'up' }
  }
])

const tabs = computed(() => [
  {
    key: 'articles',
    label: '文章管理',
    icon: 'document',
    count: stats.articles
  },
  {
    key: 'comments',
    label: '评论管理',
    icon: 'chat',
    count: stats.comments
  },
  {
    key: 'inspirations',
    label: '灵感管理',
    icon: 'lightbulb',
    count: stats.inspirations
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: 'settings'
  },
  {
    key: 'trash',
    label: '回收站',
    icon: 'trash',
    count: trashArticles.value?.length || 0
  }
])

// API 调用函数
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('blog_token')
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API调用失败 [${url}]:`, error)
    throw error
  }
}

// 数据加载函数
const loadStats = async () => {
  try {
    const data = await apiCall('/api/admin/stats')
    if (data.stats) {
      // 只更新后端统计数据，前端计算的数据保持不变
      stats.views = data.stats.views || 0
      stats.todayViews = data.stats.todayViews || 0
    }
  } catch (error) {
    notificationStore.error('获取统计数据失败')
  }
}



const loadComments = async () => {
  try {
    const data = await apiCall('/api/comments')
    comments.value = data.comments || []
    stats.comments = comments.value.length
  } catch (error) {
    notificationStore.error('获取评论列表失败')
  }
}

const loadInspirations = async () => {
  try {
    const data = await apiCall('/api/inspirations?limit=100')
    inspirations.value = data.inspirations || []
    stats.inspirations = inspirations.value.length
  } catch (error) {
    notificationStore.error('获取灵感列表失败')
  }
}

const fetchArticles = async () => {
  try {
    await articleStore.fetchArticles({ limit: 100 })
    stats.articles = articles.value.length
  } catch (error) {
    notificationStore.error('获取文章列表失败')
  }
}

const fetchTrashArticles = async () => {
  try {
    await articleStore.fetchTrashArticles()
  } catch (error) {
    notificationStore.error('获取回收站数据失败')
  }
}

// 事件处理函数
const refreshAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      fetchArticles(),
      loadComments(),
      loadInspirations(),
      fetchTrashArticles()
    ])
    notificationStore.success('数据刷新成功')
  } catch (error) {
    notificationStore.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleDeleteArticle = async (article) => {
  try {
    const result = await articleStore.deleteArticle(article.id)
    if (result.success) {
      notificationStore.success('文章已移至回收站')
      // 同时更新文章列表和回收站，确保统计数据正确
      await Promise.all([fetchArticles(), fetchTrashArticles()])
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    notificationStore.error('删除文章失败')
  }
}

const handleToggleArticleStatus = async (article) => {
  try {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    const result = await articleStore.updateArticle(article.id, { status: newStatus })
    if (result.success) {
      notificationStore.success(`文章已${newStatus === 'published' ? '发布' : '设为草稿'}`)
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    notificationStore.error('更新文章状态失败')
  }
}



const handleApproveComment = async (comment) => {
  try {
    const newStatus = comment.status === 'approved' ? 'pending' : 'approved'
    await apiCall(`/api/comments/${comment.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    })
    
    const index = comments.value.findIndex(c => c.id === comment.id)
    if (index !== -1) {
      comments.value[index].status = newStatus
    }
    
    notificationStore.success(`评论已${newStatus === 'approved' ? '批准' : '设为待审核'}`)
  } catch (error) {
    notificationStore.error('更新评论状态失败')
  }
}

const handleDeleteComment = async (comment) => {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    await apiCall(`/api/comments/${comment.id}`, { method: 'DELETE' })
    comments.value = comments.value.filter(c => c.id !== comment.id)
    stats.comments = comments.value.length
    notificationStore.success('评论已删除')
  } catch (error) {
    notificationStore.error('删除评论失败')
  }
}

const handleDeleteInspiration = async (inspiration) => {
  if (!confirm('确定要删除这条灵感吗？')) return
  
  try {
    await apiCall(`/api/inspirations/${inspiration.id}`, { method: 'DELETE' })
    inspirations.value = inspirations.value.filter(i => i.id !== inspiration.id)
    stats.inspirations = inspirations.value.length
    notificationStore.success('灵感已删除')
  } catch (error) {
    notificationStore.error('删除灵感失败')
  }
}

const handleRestoreArticle = async (article) => {
  try {
    const result = await articleStore.restoreArticle(article.id)
    if (result.success) {
      notificationStore.success('文章已恢复')
      await Promise.all([fetchArticles(), fetchTrashArticles()])
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    notificationStore.error('恢复文章失败')
  }
}

const handlePermanentDeleteArticle = async (article) => {
  if (!confirm(`确定要永久删除文章"${article.title}"吗？此操作不可恢复。`)) return
  
  try {
    const result = await articleStore.permanentDeleteArticle(article.id)
    if (result.success) {
      notificationStore.success('文章已永久删除')
      // 更新回收站列表，永久删除不影响文章统计
      await fetchTrashArticles()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    notificationStore.error('永久删除文章失败')
  }
}

const handleClearAllTrash = async () => {
  if (!confirm('确定要清空回收站吗？这将永久删除所有回收站中的文章。')) return
  
  try {
    const result = await articleStore.clearTrash()
    if (result.success) {
      notificationStore.success('回收站已清空')
      // 更新回收站列表，清空回收站不影响文章统计
      await fetchTrashArticles()
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    notificationStore.error('清空回收站失败')
  }
}

const handleInitDatabase = async () => {
  if (!confirm('确定要初始化数据库吗？这将重置所有数据结构。')) return
  
  try {
    await apiCall('/api/admin/init-database', { method: 'POST' })
    notificationStore.success('数据库初始化成功')
    await refreshAllData()
  } catch (error) {
    notificationStore.error('数据库初始化失败')
  }
}

const handleCreateSampleData = async () => {
  if (!confirm('确定要创建示例数据吗？')) return
  
  try {
    await apiCall('/api/admin/sample-data', { method: 'POST' })
    notificationStore.success('示例数据创建成功')
    await refreshAllData()
  } catch (error) {
    notificationStore.error('创建示例数据失败')
  }
}

const handleClearCache = () => {
  localStorage.clear()
  sessionStorage.clear()
  notificationStore.success('缓存已清理')
}

const backupData = async () => {
  try {
    const response = await fetch('/api/admin/backup', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('blog_token')}`
      }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blog-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      notificationStore.success('数据备份成功')
    } else {
      throw new Error('备份失败')
    }
  } catch (error) {
    notificationStore.error('数据备份失败')
  }
}

// 监听器
watch(activeTab, (newTab) => {
  // 切换标签页时可以执行特定的数据加载逻辑
  console.log(`切换到标签页: ${newTab}`)
})

// 生命周期
onMounted(async () => {
  // 检查用户是否已登录
  if (!currentUser.value) {
    notificationStore.error('请先登录')
    router.push('/login')
    return
  }
  
  // 初始化数据
  await refreshAllData()
})
</script>

<style scoped>
/* 页面基础样式 - 使用设计系统 */
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)) 100%);
  background-attachment: fixed;
}

/* 顶部导航栏 - 使用设计系统 */
.dashboard-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 900; /* 低于dropdown(1000)，确保不会挡住用户菜单弹出层 */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6) 0;
}

.header-info {
  flex: 1;
}

.dashboard-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: var(--color-accent); /* 回退颜色 */
}

.dashboard-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.user-menu:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: var(--font-weight-medium);
  color: #1f2937;
}

/* 容器样式 */
.container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* 统计区域 */
.stats-section {
  padding: var(--space-8) 0;
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.1s both;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}

/* 快速操作区域 */
.quick-actions {
  padding: var(--space-8) 0;
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.2s both;
}

.section-header {
  margin-bottom: var(--space-6);
}

.section-header h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-inverse);
  margin: 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

/* 主要内容区域 */
.main-content {
  background: var(--bg-elevated);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-8);
  overflow: hidden;
  animation: fadeInUp var(--duration-500) var(--ease-out) 0.3s both;
}

/* 导航标签 - 使用设计系统导航组件 */
.content-tabs {
  display: flex;
  background: var(--bg-secondary);
  padding: var(--space-1);
  border-radius: var(--radius-2xl);
  margin: var(--space-6);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.content-tabs::-webkit-scrollbar {
  display: none;
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: transparent;
  border: none;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-medium);
  color: #6b7280;
  font-size: var(--text-sm);
  white-space: nowrap;
  min-width: fit-content;
}

.nav-pill:hover:not(.active) {
  color: #374151;
  background: rgba(255, 255, 255, 0.5);
}

.nav-pill.active {
  background: #ffffff;
  color: #1f2937;
  box-shadow: var(--shadow-sm);
  font-weight: var(--font-weight-semibold);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2_5);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-none);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.badge-secondary {
  background: #e5e7eb;
  color: #374151;
  font-weight: var(--font-weight-semibold);
}

.nav-pill.active .badge-secondary {
  background: #dbeafe;
  color: #1e40af;
}

.tab-content {
  min-height: 500px;
}

.tab-panel {
  padding: var(--space-8);
}

/* 动画系统 */
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

/* 加载动画 */
.animate-spin {
  animation: spin var(--duration-1000) linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
    padding: var(--space-4) 0;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .dashboard-title {
    font-size: var(--text-3xl);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .content-tabs {
    flex-wrap: wrap;
    gap: var(--space-1);
    margin: var(--space-4);
  }
  
  .nav-pill {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .tab-panel {
    padding: var(--space-4);
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--space-2);
  }
  
  .dashboard-title {
    font-size: var(--text-2xl);
  }
  
  .content-tabs {
    margin: var(--space-2);
  }
  
  .tab-panel {
    padding: var(--space-3);
  }
}

/* 无障碍支持 - 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .stats-section,
  .quick-actions,
  .main-content {
    animation: none;
  }
  
  .user-menu,
  .nav-pill {
    transition: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .dashboard-header {
    border-bottom-width: 2px;
  }
  
  .user-menu,
  .nav-pill {
    border-width: 2px;
  }
}

/* 打印样式 */
@media print {
  .admin-dashboard {
    background: var(--bg-primary) !important;
  }
  
  .dashboard-header {
    position: static;
    background: var(--bg-primary) !important;
  }
  
  .header-actions,
  .quick-actions {
    display: none !important;
  }
  
  .content-tabs {
    display: none !important;
  }
  
  .tab-content {
    min-height: auto;
  }
}

/* 深色模式优化 */
:root.dark .dashboard-title {
  background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 90%, white));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:root.dark .dashboard-header {
  background: rgba(23, 23, 23, 0.95);
}

:root.dark .nav-pill {
  color: #9ca3af;
}

:root.dark .nav-pill:hover:not(.active) {
  color: #f3f4f6;
  background: rgba(255, 255, 255, 0.1);
}

:root.dark .nav-pill.active {
  background: #374151;
  color: #ffffff;
}

:root.dark .badge-secondary {
  background: #4b5563;
  color: #e5e7eb;
}

:root.dark .nav-pill.active .badge-secondary {
  background: #1e40af;
  color: #dbeafe;
}

:root.dark .user-name {
  color: #f9fafb;
}

:root.dark .content-tabs {
  background: #1f2937;
}

/* 焦点状态优化 */
.nav-pill:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* 滚动条样式 */
.content-tabs {
  scrollbar-width: thin;
  scrollbar-color: var(--color-gray-300) transparent;
}

.content-tabs::-webkit-scrollbar {
  height: 4px;
}

.content-tabs::-webkit-scrollbar-track {
  background: transparent;
}

.content-tabs::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--radius-full);
}

.content-tabs::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}
</style>