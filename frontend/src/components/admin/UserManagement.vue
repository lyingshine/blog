<template>
  <div class="user-management">
    <div class="management-header">
      <h3>用户管理</h3>
      <button @click="$emit('refresh')" class="btn btn-outline" :disabled="loading">
        <Icon name="refresh" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="users.length === 0" class="empty-state">
      <Icon name="users" size="3rem" color="#9ca3af" />
      <p>暂无用户</p>
    </div>

    <div v-else class="users-list">
      <div v-for="user in users" :key="user.id" class="user-item">
        <div class="user-avatar">
          <img :src="user.avatar || '/default-avatar.png'" :alt="user.username" />
        </div>
        <div class="user-info">
          <h4 class="user-name">{{ user.username }}</h4>
          <p class="user-meta">
            <span>邮箱: {{ user.email }}</span>
            <span>注册时间: {{ formatDate(user.created_at) }}</span>
            <span :class="['role', `role-${user.role}`]">
              {{ getRoleText(user.role) }}
            </span>
          </p>
        </div>
        <div class="user-actions">
          <button @click="$emit('view', user)" class="btn btn-sm">
            查看详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Icon from '../common/Icon.vue'

defineProps({
  users: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'view'])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getRoleText = (role) => {
  const roleMap = {
    'admin': '管理员',
    'user': '普通用户',
    'moderator': '版主'
  }
  return roleMap[role] || role
}
</script>

<style scoped>
.user-management {
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

.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-item {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.user-meta {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  gap: 1rem;
}

.role {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-admin {
  background: #fef2f2;
  color: #dc2626;
}

.role-user {
  background: #f0f9ff;
  color: #0369a1;
}

.role-moderator {
  background: #f3e8ff;
  color: #7c3aed;
}

.user-actions {
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