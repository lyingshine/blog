import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  let notificationId = 0

  const addNotification = (type, message, duration = 5000) => {
    const id = ++notificationId
    const notification = {
      id,
      type,
      message,
      timestamp: Date.now()
    }
    
    notifications.value.push(notification)
    
    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value = []
  }

  // 便捷方法
  const success = (message, duration) => addNotification('success', message, duration)
  const error = (message, duration) => addNotification('error', message, duration)
  const warning = (message, duration) => addNotification('warning', message, duration)
  const info = (message, duration) => addNotification('info', message, duration)

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
})