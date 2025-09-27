<template>
  <div class="article-management">
    <div class="management-header">
      <h3>文章管理</h3>
      <button @click="$emit('refresh')" class="btn btn-outline" :disabled="loading">
        <Icon name="refresh" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="articles.length === 0" class="empty-state">
      <Icon name="document" size="3rem" color="#9ca3af" />
      <p>暂无文章</p>
    </div>

    <div v-else class="articles-list">
      <div v-for="article in articles" :key="article.id" class="article-item">
        <div class="article-info">
          <h4 class="article-title">{{ article.title }}</h4>
          <p class="article-meta">
            <span>作者: {{ article.author?.username || '未知' }}</span>
            <span>创建时间: {{ formatDate(article.createdAt) }}</span>
            <span :class="['status', `status-${article.status}`]">
              {{ getStatusText(article.status) }}
            </span>
          </p>
        </div>
        <div class="article-actions">
          <button @click="$emit('toggle-status', article)" class="btn btn-sm">
            {{ article.status === 'published' ? '设为草稿' : '发布' }}
          </button>
          <button @click="$emit('delete', article)" class="btn btn-sm btn-danger">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Icon from '../common/Icon.vue'

defineProps({
  articles: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'delete', 'toggle-status'])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusText = (status) => {
  const statusMap = {
    'published': '已发布',
    'draft': '草稿',
    'archived': '已归档'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.article-management {
  width: 100%;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.management-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.article-item {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-info {
  flex: 1;
}

.article-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.article-meta {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  gap: 1rem;
}

.status {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-published {
  background: #dcfce7;
  color: #166534;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.article-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
  color: #1f2937;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.btn-danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-outline {
  background: transparent;
  color: #6b7280;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #374151;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>