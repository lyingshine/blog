const express = require('express')
const router = express.Router()
const si = require('systeminformation')
const os = require('os')
const { readPool, writePool } = require('../db/pool')
const pool = require('../db/pool')
const cache = require('../utils/cache')
const sim = require('../utils/simulator')
const telemetry = require('../utils/telemetry')
const { authMiddleware, requireAdmin } = require('../middleware/auth')

router.use(authMiddleware, requireAdmin)


const history = {
  cpu: [],
  memory: [],
  network: [],
  db: [],
  maxLen: 120
}

const tableCountCache = {
  ttl: 15000,
  ts: 0,
  data: { articleCount: 0, statusCount: 0, userCount: 0 }
}

async function getTableCounts() {
  const now = Date.now()
  if (now - tableCountCache.ts < tableCountCache.ttl) return tableCountCache.data

  const [[{ articleCount }]] = await pool.read('SELECT COUNT(*) as articleCount FROM articles')
  const [[{ statusCount }]] = await pool.read('SELECT COUNT(*) as statusCount FROM statuses')
  const [[{ userCount }]] = await pool.read('SELECT COUNT(*) as userCount FROM users')
  const data = { articleCount, statusCount, userCount }

  tableCountCache.ts = now
  tableCountCache.data = data
  return data
}

async function getMetrics() {
  const [cpuLoad, memInfo, netStats, dbConn] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.networkStats(),
    pool.read('SHOW STATUS LIKE "Threads_connected"')
  ])

  // 鑾峰彇MySQL鏈嶅姟鍣ㄦ€昏繛鎺ユ暟
  const mysqlTotalConnections = dbConn?.[0]?.[0]?.Value || 0
  
  // 获取应用连接池当前连接数
  const readPoolUsed = readPool?.pool?._allConnections?.length || 0
  const writePoolUsed = writePool?.pool?._allConnections?.length || 0
  const appTotalConnections = readPoolUsed + writePoolUsed
  
  // 获取连接池上限
  const readPoolLimit = readPool?.pool?.config?.connectionLimit || 150
  const writePoolLimit = writePool?.pool?.config?.connectionLimit || 50

  const { articleCount, statusCount, userCount } = await getTableCounts()

  const now = Date.now()
  const cpuUsage = cpuLoad.currentLoad / 100
  const memUsage = memInfo.active / memInfo.total

  history.cpu.push({ time: now, value: cpuUsage })
  history.memory.push({ time: now, value: memUsage })
  history.db.push({ time: now, value: mysqlTotalConnections })
  if (history.cpu.length > history.maxLen) {
    history.cpu.shift()
    history.memory.shift()
    history.db.shift()
  }

  const netRx = netStats.reduce((sum, n) => sum + n.rx_sec, 0)
  const netTx = netStats.reduce((sum, n) => sum + n.tx_sec, 0)
  const app1m = telemetry.getSnapshot(60000)
  const app5m = telemetry.getSnapshot(300000)
  const simStats = sim.getRuntimeStats ? sim.getRuntimeStats() : null
  const cacheStats = cache.stats
    ? cache.stats()
    : { size: cache.size(), redis: 'unknown', hits: 0, misses: 0, hitRate: 0 }

  return {
    cpu: {
      usage: cpuUsage,
      cores: os.cpus().length,
      model: os.cpus()[0].model,
      speed: os.cpus()[0].speed,
      avgLoad: os.loadavg()[0],
      history: history.cpu
    },
    memory: {
      total: memInfo.total,
      used: memInfo.used,
      free: memInfo.free,
      usage: memUsage,
      swapTotal: memInfo.swapTotal,
      swapUsed: memInfo.swapUsed,
      history: history.memory
    },
    network: {
      rx: netRx,
      tx: netTx,
      history: history.network
    },
    database: {
      mysqlTotal: mysqlTotalConnections,
      readPoolUsed: readPoolUsed,
      readPoolLimit: readPoolLimit,
      writePoolUsed: writePoolUsed,
      writePoolLimit: writePoolLimit,
      appTotal: appTotalConnections,
      articles: articleCount,
      statuses: statusCount,
      users: userCount,
      history: history.db
    },
    cache: {
      size: cacheStats.size,
      redis: cacheStats.redis,
      hits: cacheStats.hits || 0,
      misses: cacheStats.misses || 0,
      hitRate: cacheStats.hitRate || 0
    },
    cluster: {
      isPrimary: typeof cluster !== 'undefined' ? cluster.isPrimary : true,
      workerId: 0,
      workers: 1
    },
    uptime: process.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    pid: process.pid,
    app: {
      activeRequests: app1m.activeRequests,
      requestPerSecond: app1m.requestPerSecond,
      requestPerMinute: app1m.requestPerMinute,
      errorRate: app1m.errorRate,
      p50LatencyMs: app1m.p50LatencyMs,
      p95LatencyMs: app1m.p95LatencyMs,
      p99LatencyMs: app1m.p99LatencyMs,
      topRoutes: app1m.topRoutes,
      slowRoutes: app1m.slowRoutes,
      totals: app1m.totals
    },
    app5m: {
      requestPerMinute: app5m.requestPerMinute,
      errorRate: app5m.errorRate,
      p95LatencyMs: app5m.p95LatencyMs
    },
    simulator: simStats
  }
}

router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const metrics = await getMetrics()
    res.json(metrics)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/load-config', authMiddleware, (req, res) => {
  try {
    const presets = sim.getAvailablePresets ? sim.getAvailablePresets() : []
    const runtime = sim.getRuntimeStats ? sim.getRuntimeStats() : null
    res.json({ presets, simulator: runtime })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/load-config/preset', authMiddleware, (req, res) => {
  try {
    const { presetId } = req.body || {}
    const runtime = sim.applyPreset(presetId)
    res.json({ ok: true, simulator: runtime })
  } catch (error) {
    res.status(400).json({ error: error.message || 'Invalid preset' })
  }
})

router.post('/load-config', authMiddleware, (req, res) => {
  try {
    const runtime = sim.updateConfig(req.body || {})
    res.json({ ok: true, simulator: runtime })
  } catch (error) {
    res.status(400).json({ error: error.message || 'Invalid config' })
  }
})

router.post('/simulator/control', authMiddleware, async (req, res) => {
  try {
    const action = String(req.body?.action || '').toLowerCase()

    if (action === 'start') {
      await sim.startSimulator()
    } else if (action === 'pause') {
      sim.pauseSimulator()
    } else if (action === 'stop') {
      sim.stopSimulator()
    } else {
      return res.status(400).json({ error: 'Invalid action. Use start/pause/stop.' })
    }

    const runtime = sim.getRuntimeStats ? sim.getRuntimeStats() : null
    res.json({ ok: true, simulator: runtime })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

router.post('/simulate', authMiddleware, async (req, res) => {
  try {
    const { action, duration } = req.body
    await sim[action](duration)
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const activeSessions = sim.getActiveSessions();
    const completedSessions = sim.getCompletedSessions();
    
    // 鑾峰彇娲昏穬鐢ㄦ埛绫诲瀷鍒嗗竷
    const typeDistribution = activeSessions.reduce((acc, session) => {
      acc[session.type] = (acc[session.type] || 0) + 1;
      return acc;
    }, {});
    
    // 璁＄畻骞冲潎浼氳瘽鏃堕暱
    let totalDuration = 0;
    if (completedSessions.length > 0) {
      totalDuration = completedSessions.reduce((sum, session) => sum + session.duration, 0) / completedSessions.length;
    }
    
    res.json({
      currentOnline: activeSessions.length,
      currentTypes: typeDistribution,
      avgDuration: totalDuration,
      totalSessions: completedSessions.length,
      typeDistribution,
      recentSessions: completedSessions.slice(-20) // 鏈€杩?0涓畬鎴愮殑浼氳瘽
    });
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cache', authMiddleware, async (req, res) => {
  try {
    res.json(cache.dump())
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/cache', authMiddleware, async (req, res) => {
  try {
    cache.clear()
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

