<template>
  <div class="trash-management">
    <div class="management-header">
      <h3>回收站</h3>
      <div class="header-actions">
        <button @click="$emit('refresh')" class="btn btn-outline" :disabled="loading">
          <Icon name="refresh" :class="{ 'animate-spin': loading }" />
          刷新
        </button>
        <button 
          v-if="trashArticles.length > 0" 
          @click="$emit('clear-all')" 
          class="btn btn-danger"
        >
          <Icon name="trash" />
          清空回收站
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="trashArticles.length === 0" class="empty-state">
      <Icon name="trash" size="3rem" color="#9ca3af" />
      <p>回收站为空</p>
    </div>

    <div v-else class="trash-list">
      <div v-for="article in trashArticles" :key="article.id" class="trash-item">
        <div class="article-info">
          <h4 class="article-title">{{ article.title }}</h4>
          <p class="article-meta">
            <span>作者: {{ article.author?.username || '未知' }}</span>
            <span>删除时间: {{ formatDate(article.deletedAt) }}</span>
          </p>
        </div>
        <div class="article-actions">
          <button @click="$emit('restore', article)" class="btn btn-sm btn-success">
            <Icon name="undo" />
            恢复
          </button>
          <button @click="$emit('permanent-delete', article)" class="btn btn-sm btn-danger">
            <Icon name="trash" />
            永久删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Icon from '../common/Icon.vue'

defineProps({
  trashArticles: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'restore', 'permanent-delete', 'clear-all'])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.trash-management {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.trash-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trash-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
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
  color: #374151;
}

.article-meta {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  gap: 1rem;
}

.article-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.btn-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.btn-success:hover {
  background: #dcfce7;
  color: #14532d;
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