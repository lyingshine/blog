const Redis = require('ioredis')

let redis = null

try {
  const redisPassword = process.env.REDIS_PASSWORD || process.env.REDIS_PASS || undefined
  const redisUsername = process.env.REDIS_USERNAME || undefined

  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    username: redisUsername,
    password: redisPassword,
    retryStrategy: (times) => {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
    lazyConnect: false,
    enableOfflineQueue: false
  })

  redis.on('error', (err) => {
    console.error('[Cache] Redis error:', err?.message || err)
  })
} catch (e) {
  redis = null
}

const localCache = new Map()
const LOCAL_TTL = 5000
const cacheMetrics = {
  hits: 0,
  misses: 0
}

function get(key) {
  const item = localCache.get(key)
  if (!item) {
    cacheMetrics.misses++
    return null
  }
  if (Date.now() - item.timestamp > item.ttl) {
    localCache.delete(key)
    cacheMetrics.misses++
    return null
  }
  cacheMetrics.hits++
  return item.value
}

function set(key, value, ttl = LOCAL_TTL) {
  localCache.set(key, { value, timestamp: Date.now(), ttl })
}

function del(key) {
  localCache.delete(key)
}

function invalidate(pattern) {
  for (const key of localCache.keys()) {
    if (key.startsWith(pattern)) {
      localCache.delete(key)
    }
  }
}

function isAlive() {
  return redis !== null && redis.status === 'ready'
}

async function redisGet(key) {
  if (!isAlive()) return null
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

async function redisSet(key, value, ttl = 3000) {
  if (!isAlive()) return
  try {
    await redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value))
  } catch (e) {}
}

async function redisDel(pattern) {
  if (!isAlive()) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch (e) {}
}

async function getWithFallback(key, fetchFn, ttl = 3000) {
  const local = get(key)
  if (local) return local

  const remote = await redisGet(key)
  if (remote) {
    set(key, remote, ttl)
    return remote
  }

  const data = await fetchFn()
  if (data) {
    set(key, data, ttl)
    redisSet(key, data, ttl)
  }
  return data
}

async function invalidateAll(pattern) {
  invalidate(pattern)
  await redisDel(pattern)
}

function stats() {
  const total = cacheMetrics.hits + cacheMetrics.misses
  return {
    size: localCache.size,
    redis: isAlive() ? 'connected' : 'disconnected',
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
    hitRate: total > 0 ? cacheMetrics.hits / total : 0
  }
}

function size() {
  return localCache.size;
}

module.exports = {
  get,
  set,
  del,
  invalidate,
  getWithFallback,
  invalidateAll,
  stats,
  isAlive,
  size
}
