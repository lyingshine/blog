<template>
  <div class="inspiration-management">
    <div class="management-header">
      <h3>灵感管理</h3>
      <button @click="$emit('refresh')" class="btn btn-outline" :disabled="loading">
        <Icon name="refresh" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="inspirations.length === 0" class="empty-state">
      <Icon name="lightbulb" size="3rem" color="#9ca3af" />
      <p>暂无灵感</p>
    </div>

    <div v-else class="inspirations-list">
      <div v-for="inspiration in inspirations" :key="inspiration.id" class="inspiration-item">
        <div class="inspiration-info">
          <p class="inspiration-content">{{ inspiration.content }}</p>
          <p class="inspiration-meta">
            <span>作者: {{ inspiration.author?.username || '匿名' }}</span>
            <span>时间: {{ formatDate(inspiration.created_at) }}</span>
          </p>
        </div>
        <div class="inspiration-actions">
          <button @click="$emit('delete', inspiration)" class="btn btn-sm btn-danger">
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
  inspirations: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'delete'])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.inspiration-management {
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

.inspirations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inspiration-item {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.inspiration-info {
  flex: 1;
}

.inspiration-content {
  margin: 0 0 0.5rem 0;
  color: #374151;
  line-height: 1.5;
  font-size: 1rem;
}

.inspiration-meta {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  gap: 1rem;
}

.inspiration-actions {
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