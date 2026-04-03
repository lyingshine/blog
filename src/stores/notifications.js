import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '../api'
import { useAuthStore } from './auth'

function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const normalized = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const streamConnected = ref(false)
  const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const pushAvailable = ref(false)
  const pushEnabled = ref(false)

  let eventSource = null

  const requestSystemPermission = async () => {
    if (typeof Notification === 'undefined') return 'unsupported'
    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  const pushSystemNotification = (payload = {}) => {
    if (typeof Notification === 'undefined') return
    if (permission.value !== 'granted') return

    const title = payload.title || '新消息'
    const body = payload.content || ''
    const n = new Notification(title, {
      body,
      tag: `msg-${payload.id || Date.now()}`,
      renotify: false
    })

    n.onclick = () => {
      window.focus()
      n.close()
      if (payload.link) {
        window.location.hash = ''
        window.location.pathname = payload.link
      }
    }
  }

  const ensureServiceWorkerRegistration = async () => {
    if (!('serviceWorker' in navigator)) return null
    let registration = await navigator.serviceWorker.getRegistration('/')
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js')
    }
    return registration
  }

  const subscribeSystemPush = async () => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      throw new Error('请先登录后再开启系统通知')
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      pushAvailable.value = false
      throw new Error('当前浏览器不支持离线消息推送')
    }
    pushAvailable.value = true

    const permissionResult = await requestSystemPermission()
    if (permissionResult !== 'granted') {
      throw new Error('未获得系统通知权限')
    }

    const keyRes = await apiService.getPushPublicKey()
    const publicKey = keyRes.data?.publicKey || ''
    if (!keyRes.data?.enabled || !publicKey) {
      throw new Error('服务端尚未开启推送能力')
    }

    const registration = await ensureServiceWorkerRegistration()
    if (!registration) {
      throw new Error('Service Worker 注册失败')
    }

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKey)
      })
    }

    const subJson = subscription.toJSON()
    await apiService.subscribePush(subJson)
    pushEnabled.value = true
  }

  const sendPushTest = async () => {
    await apiService.testPush()
  }

  const mergeIncoming = (notification) => {
    if (!notification || !notification.id) return
    const idx = items.value.findIndex((item) => item.id === notification.id)
    if (idx >= 0) {
      items.value[idx] = notification
      return
    }
    items.value.unshift(notification)
  }

  const fetchList = async (params = {}) => {
    loading.value = true
    try {
      const response = await apiService.getNotifications(params)
      const list = response.data?.notifications || []
      items.value = list
      return response.data || {}
    } finally {
      loading.value = false
    }
  }

  const refreshUnread = async () => {
    const response = await apiService.getUnreadNotificationCount()
    unreadCount.value = Number(response.data?.unreadCount || 0)
    return unreadCount.value
  }

  const markOneRead = async (id) => {
    const response = await apiService.markNotificationRead(id)
    unreadCount.value = Number(response.data?.unreadCount || 0)
    const target = items.value.find((item) => item.id === id)
    if (target) target.is_read = 1
  }

  const markAllRead = async () => {
    const response = await apiService.markAllNotificationsRead()
    unreadCount.value = Number(response.data?.unreadCount || 0)
    items.value = items.value.map((item) => ({ ...item, is_read: 1 }))
  }

  const connectStream = () => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) return

    const streamUrl = apiService.getNotificationStreamUrl()
    if (!streamUrl) return

    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    eventSource = new EventSource(streamUrl)

    eventSource.addEventListener('open', () => {
      streamConnected.value = true
    })

    eventSource.addEventListener('unread_count', (event) => {
      try {
        const data = JSON.parse(event.data || '{}')
        unreadCount.value = Number(data.unreadCount || 0)
      } catch {}
    })

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data || '{}')
        mergeIncoming(notification)
        unreadCount.value += 1
        pushSystemNotification(notification)
      } catch {}
    })

    eventSource.onerror = () => {
      streamConnected.value = false
    }
  }

  const disconnectStream = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    streamConnected.value = false
  }

  const init = async () => {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      disconnectStream()
      items.value = []
      unreadCount.value = 0
      pushEnabled.value = false
      return
    }

    pushAvailable.value = 'serviceWorker' in navigator && 'PushManager' in window
    permission.value = typeof Notification !== 'undefined' ? Notification.permission : 'default'
    pushEnabled.value = permission.value === 'granted'

    await refreshUnread()
    connectStream()
  }

  return {
    items,
    unreadCount,
    loading,
    streamConnected,
    permission,
    pushAvailable,
    pushEnabled,
    fetchList,
    refreshUnread,
    markOneRead,
    markAllRead,
    requestSystemPermission,
    subscribeSystemPush,
    sendPushTest,
    connectStream,
    disconnectStream,
    init
  }
})
