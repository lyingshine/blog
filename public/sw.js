const CACHE_NAME = 'myself-pwa-v2'
const OFFLINE_URL = '/offline.html'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-icon.svg',
  OFFLINE_URL
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
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
      caches.match(request).then((cached) => {
        if (cached) {
          return cached
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          return response
        })
      })
    )
    return
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
