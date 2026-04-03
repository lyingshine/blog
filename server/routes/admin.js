const express = require('express')
const router = express.Router()
const si = require('systeminformation')
const os = require('os')
const fs = require('fs')
const path = require('path')
const { readPool, writePool } = require('../db/pool')
const pool = require('../db/pool')
const cache = require('../utils/cache')
const sim = require('../utils/simulator')
const telemetry = require('../utils/telemetry')
const { authMiddleware, requireAdmin } = require('../middleware/auth')

router.use(authMiddleware, requireAdmin)

const LOG_DIR = path.join(__dirname, '..', 'logs')
const LOG_TYPE_MAP = {
  out: 'server.out.log',
  err: 'server.err.log'
}

async function readTailLines(filePath, lineCount = 120) {
  const normalizedCount = Math.max(10, Math.min(400, Number(lineCount) || 120))
  const estimatedBytes = Math.max(32 * 1024, Math.min(1024 * 1024, normalizedCount * 280))
  let fh

  try {
    fh = await fs.promises.open(filePath, 'r')
    const stat = await fh.stat()
    if (!stat.size) return { lines: [], size: 0, mtimeMs: stat.mtimeMs, exists: true }

    const toRead = Math.min(stat.size, estimatedBytes)
    const start = Math.max(0, stat.size - toRead)
    const buffer = Buffer.alloc(toRead)
    await fh.read(buffer, 0, toRead, start)

    const text = buffer.toString('utf8')
    const lines = text
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .slice(-normalizedCount)

    return { lines, size: stat.size, mtimeMs: stat.mtimeMs, exists: true }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { lines: [], size: 0, mtimeMs: 0, exists: false }
    }
    throw error
  } finally {
    if (fh) await fh.close()
  }
}


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

router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const type = String(req.query?.type || 'both').toLowerCase()
    const lines = Number(req.query?.lines || 120)
    const wantOut = type === 'out' || type === 'both'
    const wantErr = type === 'err' || type === 'both'

    if (!wantOut && !wantErr) {
      return res.status(400).json({ error: 'Invalid type. Use out/err/both.' })
    }

    const outPath = path.join(LOG_DIR, LOG_TYPE_MAP.out)
    const errPath = path.join(LOG_DIR, LOG_TYPE_MAP.err)
    const [stdout, stderr] = await Promise.all([
      wantOut ? readTailLines(outPath, lines) : Promise.resolve(null),
      wantErr ? readTailLines(errPath, lines) : Promise.resolve(null)
    ])

    res.json({
      type,
      lines: Math.max(10, Math.min(400, Number(lines) || 120)),
      timestamp: Date.now(),
      sources: {
        out: stdout,
        err: stderr
      }
    })
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

router.get('/reports', authMiddleware, async (req, res) => {
  try {
    const status = String(req.query?.status || 'all').toLowerCase()
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 100)))
    const params = []
    let whereSql = ''

    if (['pending', 'resolved', 'rejected'].includes(status)) {
      whereSql = 'WHERE r.status = ?'
      params.push(status)
    }

    params.push(limit)
    const [rows] = await pool.read(
      `SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.reason,
        r.details,
        r.status,
        r.created_at,
        u.username AS reporter_username,
        u.avatar AS reporter_avatar
      FROM content_reports r
      JOIN users u ON u.id = r.user_id
      ${whereSql}
      ORDER BY r.id DESC
      LIMIT ?`,
      params
    )

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/reports/:id', authMiddleware, async (req, res) => {
  try {
    const reportId = Number.parseInt(req.params.id, 10)
    const status = String(req.body?.status || '').toLowerCase()
    if (!Number.isFinite(reportId) || reportId <= 0) {
      return res.status(400).json({ success: false, message: '举报 ID 无效' })
    }
    if (!['pending', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: '状态无效' })
    }

    const [result] = await pool.write('UPDATE content_reports SET status = ? WHERE id = ?', [status, reportId])
    if (!result?.affectedRows) {
      return res.status(404).json({ success: false, message: '举报不存在' })
    }

    const [rows] = await pool.read(
      `SELECT id, user_id, target_type, target_id, reason, details, status, created_at
       FROM content_reports
       WHERE id = ?
       LIMIT 1`,
      [reportId]
    )

    res.json({ success: true, data: rows[0] || null })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

module.exports = router

