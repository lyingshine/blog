const MAX_HISTORY_WINDOW_MS = 10 * 60 * 1000
const MAX_HISTORY_HARD_LIMIT = 300000

const state = {
  activeRequests: 0,
  totalRequests: 0,
  totalErrors: 0,
  history: []
}

function normalizePath(path = '') {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
}

function pushRecord(record) {
  state.history.push(record)
  const cutoff = Date.now() - MAX_HISTORY_WINDOW_MS
  while (state.history.length && state.history[0].ts < cutoff) {
    state.history.shift()
  }
  while (state.history.length > MAX_HISTORY_HARD_LIMIT) {
    state.history.shift()
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

function aggregateByRoute(records) {
  const routeMap = new Map()
  for (const r of records) {
    const key = `${r.method} ${r.route}`
    const old = routeMap.get(key) || { route: key, count: 0, errors: 0, totalDuration: 0, maxDuration: 0 }
    old.count += 1
    old.errors += r.status >= 500 ? 1 : 0
    old.totalDuration += r.durationMs
    old.maxDuration = Math.max(old.maxDuration, r.durationMs)
    routeMap.set(key, old)
  }

  const rows = Array.from(routeMap.values()).map((v) => ({
    route: v.route,
    count: v.count,
    errorRate: v.count > 0 ? v.errors / v.count : 0,
    avgDurationMs: v.count > 0 ? v.totalDuration / v.count : 0,
    maxDurationMs: v.maxDuration
  }))

  const topRoutes = rows
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const slowRoutes = rows
    .filter((r) => r.count >= 3)
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
    .slice(0, 6)

  return { topRoutes, slowRoutes }
}

function getSnapshot(windowMs = 60000) {
  const now = Date.now()
  const records = state.history.filter((r) => now - r.ts <= windowMs)
  const requestCount = records.length
  const errorCount = records.filter((r) => r.status >= 500).length
  const durations = records.map((r) => r.durationMs).sort((a, b) => a - b)
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000))

  const { topRoutes, slowRoutes } = aggregateByRoute(records)

  return {
    activeRequests: state.activeRequests,
    requestCount,
    requestPerSecond: requestCount / windowSeconds,
    requestPerMinute: requestCount * (60000 / windowMs),
    errorRate: requestCount > 0 ? errorCount / requestCount : 0,
    p50LatencyMs: percentile(durations, 50),
    p95LatencyMs: percentile(durations, 95),
    p99LatencyMs: percentile(durations, 99),
    topRoutes,
    slowRoutes,
    totals: {
      requests: state.totalRequests,
      errors: state.totalErrors
    }
  }
}

function middleware(req, res, next) {
  state.activeRequests += 1
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    state.activeRequests = Math.max(0, state.activeRequests - 1)
    state.totalRequests += 1
    if (res.statusCode >= 500) state.totalErrors += 1

    pushRecord({
      ts: Date.now(),
      method: req.method,
      route: normalizePath(req.baseUrl ? `${req.baseUrl}${req.path}` : req.path),
      status: res.statusCode,
      durationMs
    })
  })

  next()
}

module.exports = {
  middleware,
  getSnapshot
}
