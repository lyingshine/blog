const CACHE_NAME = 'myself-pwa-v4'
const OFFLINE_URL = '/offline.html'
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-icon.svg',
  OFFLINE_URL
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          return (await cache.match(request)) || (await cache.match(OFFLINE_URL))
        })
    )
    return
  }

  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)))
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: '新消息', content: event.data ? event.data.text() : '' }
  }

  const title = payload.title || '新消息'
  const options = {
    body: payload.content || '',
    data: {
      link: payload.link || '/messages'
    },
    icon: '/pwa-icon.svg',
    badge: '/favicon.svg',
    tag: `push-${payload.id || Date.now()}`
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetLink = event.notification?.data?.link || '/messages'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetLink)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetLink)
      }
      return null
    })
  )
})
