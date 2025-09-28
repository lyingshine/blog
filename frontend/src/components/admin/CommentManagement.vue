<template>
  <div class="comment-management">
    <div class="management-header">
      <h3>评论管理</h3>
      <button @click="$emit('refresh')" class="btn btn-outline" :disabled="loading">
        <Icon name="refresh" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="comments.length === 0" class="empty-state">
      <Icon name="chat" size="3rem" color="#9ca3af" />
      <p>暂无评论</p>
    </div>

    <div v-else class="comments-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-info">
          <h4 class="comment-author">{{ comment.author?.username || '匿名用户' }}</h4>
          <p class="comment-content">{{ comment.content }}</p>
          <p class="comment-meta">
            <span>文章: {{ comment.article?.title || '未知文章' }}</span>
            <span>时间: {{ formatDate(comment.created_at) }}</span>
            <span :class="['status', `status-${comment.status}`]">
              {{ getStatusText(comment.status) }}
            </span>
          </p>
        </div>
        <div class="comment-actions">
          <button @click="$emit('approve', comment)" class="btn btn-sm">
            {{ comment.status === 'approved' ? '取消批准' : '批准' }}
          </button>
          <button @click="$emit('delete', comment)" class="btn btn-sm btn-danger">
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
  comments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'approve', 'delete'])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getStatusText = (status) => {
  const statusMap = {
    'approved': '已批准',
    'pending': '待审核',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.comment-management {
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

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-item {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.comment-info {
  flex: 1;
}

.comment-author {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.comment-content {
  margin: 0 0 0.5rem 0;
  color: #374151;
  line-height: 1.5;
}

.comment-meta {
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

.status-approved {
  background: #dcfce7;
  color: #166534;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-rejected {
  background: #fef2f2;
  color: #dc2626;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
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