<template>
  <div class="notification-container">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      :class="['notification', `notification-${notification.type}`]"
    >
      <Icon :name="getIcon(notification.type)" />
      <span class="notification-message">{{ notification.message }}</span>
      <button @click="removeNotification(notification.id)" class="notification-close">
        <Icon name="times" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '../../stores/notification.store'
import Icon from './Icon.vue'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

const getIcon = (type) => {
  const iconMap = {
    success: 'check',
    error: 'times',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  }
  return iconMap[type] || 'info-circle'
}

const removeNotification = (id) => {
  notificationStore.removeNotification(id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  min-width: 300px;
  animation: slideIn 0.3s ease-out;
}

.notification-success {
  border-left-color: #10b981;
  color: #065f46;
}

.notification-error {
  border-left-color: #ef4444;
  color: #991b1b;
}

.notification-warning {
  border-left-color: #f59e0b;
  color: #92400e;
}

.notification-info {
  border-left-color: #3b82f6;
  color: #1e40af;
}

.notification-message {
  flex: 1;
  font-weight: 500;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #374151;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>