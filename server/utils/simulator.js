const API_BASE = 'http://localhost:3000/api'

const LOAD_PRESET = (process.env.LOAD_PRESET || 'medium').toLowerCase()

const LOAD_PRESETS = {
  low: {
    id: 'low',
    label: '低压',
    description: '适合本地联调，整体节奏保守。',
    maxRegisteredUsers: 10000,
    peakOnlineUsers: 1200,
    baseRegistrationRate: 0.2,
    baseLoginRate: 5,
    concurrentRequests: 120,
    actionMultiplier: 1.2,
    visitorRatio: 0.08,
    sessionDurationMultiplier: 0.9,
    cooldownMultiplier: 1.1,
    actionIntervalMultiplier: 1,
    writeMultiplier: 0.7,
    cohortMix: { ACTIVE_VETERAN: 0.16, SILENT_VETERAN: 0.76, NEW_USER: 0.08 },
    loginBias: { ACTIVE_VETERAN: 2.2, SILENT_VETERAN: 1.0, NEW_USER: 0.9 }
  },
  medium: {
    id: 'medium',
    label: '中压',
    description: '默认压测档，读流量和写流量比较均衡。',
    maxRegisteredUsers: 100000,
    peakOnlineUsers: 12000,
    baseRegistrationRate: 2,
    baseLoginRate: 20,
    concurrentRequests: 900,
    actionMultiplier: 4,
    visitorRatio: 0.12,
    sessionDurationMultiplier: 1,
    cooldownMultiplier: 1,
    actionIntervalMultiplier: 1,
    writeMultiplier: 1,
    cohortMix: { ACTIVE_VETERAN: 0.18, SILENT_VETERAN: 0.72, NEW_USER: 0.1 },
    loginBias: { ACTIVE_VETERAN: 2.4, SILENT_VETERAN: 1.0, NEW_USER: 0.85 }
  },
  high: {
    id: 'high',
    label: '高压',
    description: '明显拉高在线、动作速度和排队压力。',
    maxRegisteredUsers: 1000000,
    peakOnlineUsers: 45000,
    baseRegistrationRate: 6,
    baseLoginRate: 65,
    concurrentRequests: 3200,
    actionMultiplier: 10,
    visitorRatio: 0.18,
    sessionDurationMultiplier: 1.2,
    cooldownMultiplier: 0.75,
    actionIntervalMultiplier: 0.72,
    writeMultiplier: 1.35,
    cohortMix: { ACTIVE_VETERAN: 0.22, SILENT_VETERAN: 0.66, NEW_USER: 0.12 },
    loginBias: { ACTIVE_VETERAN: 2.7, SILENT_VETERAN: 1.0, NEW_USER: 1.05 }
  },
  extreme: {
    id: 'extreme',
    label: '极限',
    description: '尽量把登录、请求和写入速度都压上去。',
    maxRegisteredUsers: 10000000,
    peakOnlineUsers: 120000,
    baseRegistrationRate: 12,
    baseLoginRate: 160,
    concurrentRequests: 9000,
    actionMultiplier: 18,
    visitorRatio: 0.22,
    sessionDurationMultiplier: 1.35,
    cooldownMultiplier: 0.55,
    actionIntervalMultiplier: 0.5,
    writeMultiplier: 1.8,
    cohortMix: { ACTIVE_VETERAN: 0.26, SILENT_VETERAN: 0.6, NEW_USER: 0.14 },
    loginBias: { ACTIVE_VETERAN: 3.0, SILENT_VETERAN: 1.0, NEW_USER: 1.2 }
  }
}

function clonePreset(preset) {
  return JSON.parse(JSON.stringify(preset))
}

function resolvePreset(presetId = LOAD_PRESET) {
  if (presetId && LOAD_PRESETS[presetId]) {
    return clonePreset(LOAD_PRESETS[presetId])
  }
  return clonePreset(LOAD_PRESETS.medium)
}

let currentScale = resolvePreset()

let registeredUsers = []
let activeSessions = new Map()
let completedSessions = []
const MAX_HISTORY = 200

const USER_TYPES = {
  ACTIVE_VETERAN: {
    name: 'Active veteran',
    sessionDuration: [10, 35],
    actionInterval: [25, 110],
    behavior: {
      browseArticles: 0.32,
      browseStatuses: 0.28,
      publishArticle: 0.17,
      publishStatus: 0.16,
      likeContent: 0.07
    }
  },
  SILENT_VETERAN: {
    name: 'Silent veteran',
    sessionDuration: [2, 10],
    actionInterval: [90, 260],
    behavior: {
      browseArticles: 0.7,
      browseStatuses: 0.25,
      publishArticle: 0.02,
      publishStatus: 0.02,
      likeContent: 0.01
    }
  },
  NEW_USER: {
    name: 'New user',
    sessionDuration: [4, 16],
    actionInterval: [60, 170],
    behavior: {
      browseArticles: 0.45,
      browseStatuses: 0.32,
      publishArticle: 0.08,
      publishStatus: 0.1,
      likeContent: 0.05
    }
  },
  VISITOR: {
    name: 'Visitor',
    sessionDuration: [1, 6],
    actionInterval: [160, 600],
    behavior: {
      browseArticles: 0.82,
      browseStatuses: 0.18,
      publishArticle: 0,
      publishStatus: 0,
      likeContent: 0
    }
  }
}

const stats = {
  registrations: 0,
  logins: 0,
  articles: 0,
  statuses: 0,
  browses: 0,
  likes: 0,
  totalRequests: 0,
  failedRequests: 0,
  startTime: Date.now()
}

const intakeValve = {
  value: 1,
  lastUpdateAt: 0,
  lastPressure: {
    p95LatencyMs: 0,
    errorRate: 0,
    queueUsage: 0,
    target: 1
  }
}

const loginValve = {
  value: 1,
  lastUpdateAt: 0,
  lastP95: 0,
  lastErrorRate: 0
}

function resetStats() {
  stats.registrations = 0
  stats.logins = 0
  stats.articles = 0
  stats.statuses = 0
  stats.browses = 0
  stats.likes = 0
  stats.totalRequests = 0
  stats.failedRequests = 0
  stats.startTime = Date.now()
  intakeValve.value = 1
  intakeValve.lastUpdateAt = 0
  intakeValve.lastPressure = {
    p95LatencyMs: 0,
    errorRate: 0,
    queueUsage: 0,
    target: 1
  }
  loginValve.value = 1
  loginValve.lastUpdateAt = 0
  loginValve.lastP95 = 0
  loginValve.lastErrorRate = 0
}

let activeRequests = 0
let simulatorEpoch = 0
const intervalHandles = new Set()
const loginInFlight = new Set()
const LOGIN_WORKERS = Math.max(1, Number(process.env.SIM_LOGIN_WORKERS || 4))
const REGISTRATION_WORKERS = Math.max(1, Number(process.env.SIM_REG_WORKERS || 1))

function getMaxConcurrent() {
  return currentScale.concurrentRequests
}

function estimateTargetRpm(config = currentScale) {
  const onlineFactor = Math.max(1, config.peakOnlineUsers / 40)
  const speedFactor = Math.max(1, config.actionMultiplier * (2 - Math.min(1.5, config.actionIntervalMultiplier || 1)))
  const queueFactor = Math.max(1, config.concurrentRequests / 10)
  return Math.round(Math.min(queueFactor * 60, onlineFactor * speedFactor * 16))
}

function sanitizeConfig(input) {
  const next = {
    ...currentScale,
    ...input
  }

  next.maxRegisteredUsers = Math.max(1000, Math.round(Number(next.maxRegisteredUsers || currentScale.maxRegisteredUsers)))
  next.peakOnlineUsers = Math.max(10, Math.round(Number(next.peakOnlineUsers || currentScale.peakOnlineUsers)))
  next.baseRegistrationRate = Math.max(0.05, Number(next.baseRegistrationRate || currentScale.baseRegistrationRate))
  next.baseLoginRate = Math.max(0.5, Number(next.baseLoginRate || currentScale.baseLoginRate))
  next.concurrentRequests = Math.max(10, Math.round(Number(next.concurrentRequests || currentScale.concurrentRequests)))
  next.actionMultiplier = Math.max(0.5, Number(next.actionMultiplier || currentScale.actionMultiplier))
  next.visitorRatio = clamp(Number(next.visitorRatio ?? currentScale.visitorRatio), 0, 0.9)
  next.sessionDurationMultiplier = Math.max(0.3, Number(next.sessionDurationMultiplier || currentScale.sessionDurationMultiplier))
  next.cooldownMultiplier = Math.max(0.2, Number(next.cooldownMultiplier || currentScale.cooldownMultiplier))
  next.actionIntervalMultiplier = Math.max(0.2, Number(next.actionIntervalMultiplier || currentScale.actionIntervalMultiplier))
  next.writeMultiplier = Math.max(0.1, Number(next.writeMultiplier || currentScale.writeMultiplier || 1))
  next.id = next.id || 'custom'
  next.label = next.label || '自定义压测'
  next.description = next.description || '当前正在使用自定义调速参数。'
  next.estimatedPeakRpm = estimateTargetRpm(next)
  return next
}

currentScale = sanitizeConfig(currentScale)

const firstNames = ['alex', 'milo', 'luna', 'nora', 'ivy', 'leo', 'mason', 'ella', 'liam', 'olivia', 'ethan', 'ava', 'mia', 'zoe']
const lastNames = ['chen', 'wang', 'li', 'zhao', 'liu', 'zhou', 'xu', 'sun', 'huang', 'wu', 'guo', 'lin', 'he', 'gao']
const domains = ['gmail.com', 'outlook.com', 'qq.com', '163.com', 'foxmail.com', 'hotmail.com']

const articleTemplates = require('./articleTemplates')
const statusPool = require('./statusPool')
const telemetry = require('./telemetry')
const pool = require('../db/pool')
const bcrypt = require('bcryptjs')

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[randomInt(0, arr.length - 1)]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const SIM_STOCK_PASSWORD = 'SimUser@123'

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num))
}

function weightedPick(weightMap) {
  const entries = Object.entries(weightMap).filter(([, weight]) => weight > 0)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (total <= 0) return entries[0]?.[0] || 'SILENT_VETERAN'

  let roll = Math.random() * total
  for (const [key, weight] of entries) {
    roll -= weight
    if (roll <= 0) return key
  }
  return entries[entries.length - 1][0]
}

function assignCohortByMix() {
  return weightedPick(currentScale.cohortMix)
}

function randomPastTimestamp(minDaysAgo, maxDaysAgo) {
  const days = randomInt(minDaysAgo, maxDaysAgo)
  return Date.now() - days * 24 * 60 * 60 * 1000 - randomInt(0, 24 * 60 * 60 * 1000)
}

function normalizeUserProfile(user) {
  const profile = {
    id: user.id,
    username: user.username,
    token: user.token || null,
    refreshToken: user.refreshToken || null,
    loginCount: user.loginCount || 0,
    articleCount: user.articleCount || 0,
    statusCount: user.statusCount || 0,
    browses: user.browses || 0,
    registrationTime: user.registrationTime || randomPastTimestamp(5, 540),
    userType: user.userType || assignCohortByMix(),
    nextLoginAt: user.nextLoginAt || 0,
    lastSessionEndedAt: user.lastSessionEndedAt || 0
  }

  profile.userType = inferUserType(profile)
  return profile
}

function normalizeRegisteredUsers(users) {
  return users.map(normalizeUserProfile)
}

function inferUserType(user) {
  const ageDays = (Date.now() - (user.registrationTime || Date.now())) / (24 * 60 * 60 * 1000)
  const logins = user.loginCount || 0
  const actions = (user.articleCount || 0) * 6 + (user.statusCount || 0) * 4 + (user.browses || 0) * 0.05
  const engagement = actions / Math.max(1, logins)

  if (ageDays < 2 && logins < 3) return 'NEW_USER'
  if (engagement > 9 || logins > 45) return 'ACTIVE_VETERAN'
  if (ageDays > 30 && engagement < 2.5) return 'SILENT_VETERAN'

  const fallback = {
    ACTIVE_VETERAN: currentScale.cohortMix.ACTIVE_VETERAN,
    SILENT_VETERAN: currentScale.cohortMix.SILENT_VETERAN,
    NEW_USER: currentScale.cohortMix.NEW_USER
  }
  return weightedPick(fallback)
}

function updateUserLifecycle(user) {
  user.userType = inferUserType(user)
}

function getOnboardingCohortMix() {
  const base = currentScale.cohortMix || { ACTIVE_VETERAN: 0.18, SILENT_VETERAN: 0.72, NEW_USER: 0.1 }
  const newCap = clamp(base.NEW_USER ?? 0.1, 0.04, 0.2)
  const remaining = 1 - newCap
  const veteranShare = (base.ACTIVE_VETERAN || 0.2) / Math.max(0.01, (base.ACTIVE_VETERAN || 0.2) + (base.SILENT_VETERAN || 0.7))
  return {
    ACTIVE_VETERAN: remaining * veteranShare,
    SILENT_VETERAN: remaining * (1 - veteranShare),
    NEW_USER: newCap
  }
}

function enrichProfileAsStockUser(profile) {
  const cohort = weightedPick(getOnboardingCohortMix())
  profile.userType = cohort

  if (cohort === 'ACTIVE_VETERAN') {
    profile.registrationTime = randomPastTimestamp(45, 900)
    profile.loginCount = randomInt(18, 120)
    profile.articleCount = randomInt(6, 80)
    profile.statusCount = randomInt(20, 180)
    profile.browses = randomInt(500, 9000)
    profile.nextLoginAt = Date.now() + randomInt(8 * 1000, 90 * 1000)
  } else if (cohort === 'SILENT_VETERAN') {
    profile.registrationTime = randomPastTimestamp(90, 1200)
    profile.loginCount = randomInt(3, 35)
    profile.articleCount = randomInt(0, 10)
    profile.statusCount = randomInt(0, 24)
    profile.browses = randomInt(60, 2200)
    profile.nextLoginAt = Date.now() + randomInt(15 * 1000, 3 * 60 * 1000)
  } else {
    profile.registrationTime = Date.now() - randomInt(0, 36 * 60 * 60 * 1000)
    profile.loginCount = randomInt(0, 3)
    profile.articleCount = randomInt(0, 2)
    profile.statusCount = randomInt(0, 4)
    profile.browses = randomInt(0, 90)
    profile.nextLoginAt = Date.now() + getNewUserWarmupMs()
  }

  updateUserLifecycle(profile)
  return profile
}

function getBootstrapPoolSize() {
  const byOnline = Math.max(2000, Math.round(currentScale.peakOnlineUsers * 8))
  const byPreset = Math.max(5000, Math.round(currentScale.maxRegisteredUsers * 0.15))
  return Math.min(currentScale.maxRegisteredUsers, 120000, Math.max(byOnline, byPreset))
}

async function bootstrapStockUsers() {
  const target = getBootstrapPoolSize()
  if (target <= 0) return

  const seeded = []
  for (let i = 0; i < target; i++) {
    const username = `stock_${pick(lastNames)}_${pick(firstNames)}_${String(i + 1).padStart(7, '0')}`
    const profile = enrichProfileAsStockUser(
      normalizeUserProfile({
        id: `stock_${i + 1}`,
        username,
        token: null,
        loginCount: 0,
        articleCount: 0,
        statusCount: 0,
        browses: 0,
        registrationTime: randomPastTimestamp(30, 1200),
        userType: 'SILENT_VETERAN',
        nextLoginAt: Date.now() + randomInt(1000, 90000)
      })
    )
    seeded.push(profile)
  }

  // 直接导入数据库作为存量账号，后续仍走正常 /auth/login 流程。
  const hashedPassword = await bcrypt.hash(SIM_STOCK_PASSWORD, 10)
  const batchSize = 500
  for (let i = 0; i < seeded.length; i += batchSize) {
    const chunk = seeded.slice(i, i + batchSize)
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, NOW())').join(', ')
    const values = []
    for (const user of chunk) {
      values.push(
        user.username,
        `${user.username}@stock.local`,
        hashedPassword,
        String(user.username || 'S').charAt(0).toUpperCase(),
        'user'
      )
    }
    try {
      await pool.write(
        `INSERT IGNORE INTO users (username, email, password, avatar, role, created_at) VALUES ${placeholders}`,
        values
      )
    } catch (err) {
      console.error('[Sim] 存量用户导入失败:', err?.message || err)
    }
  }

  registeredUsers = seeded
  console.log(`[Sim] 已导入存量用户池：${registeredUsers.length.toLocaleString()}（直导 DB，登录走 /auth/login）`)
}

function getActivityMultiplier() {
  const hour = new Date().getHours()
  if (hour >= 9 && hour < 12) return 2.3
  if (hour >= 14 && hour < 18) return 2.1
  if (hour >= 20 && hour < 23) return 1.9
  if (hour >= 0 && hour < 6) return 0.35
  if (hour >= 6 && hour < 9) return 0.75
  return 1.3
}

function getVisitorPulseMultiplier() {
  const hour = new Date().getHours()
  if (hour >= 10 && hour < 12) return 1.3
  if (hour >= 20 && hour < 23) return 1.4
  if (hour >= 0 && hour < 6) return 0.45
  return 1.0
}

function getPressureTarget() {
  const app30s = telemetry.getSnapshot ? telemetry.getSnapshot(30000) : {}
  const p95 = Number(app30s?.p95LatencyMs || 0)
  const errRate = Number(app30s?.errorRate || 0)
  const queueUsage = getMaxConcurrent() > 0 ? activeRequests / getMaxConcurrent() : 0

  let target = 1
  if (errRate > 0.08 || p95 > 8000 || queueUsage > 0.98) target = 0.12
  else if (errRate > 0.05 || p95 > 5000 || queueUsage > 0.9) target = 0.3
  else if (errRate > 0.03 || p95 > 3200 || queueUsage > 0.8) target = 0.5
  else if (errRate > 0.02 || p95 > 1800 || queueUsage > 0.7) target = 0.72
  else if (errRate < 0.01 && p95 > 0 && p95 < 440 && queueUsage < 0.45) target = 1.35
  else if (errRate < 0.015 && p95 > 0 && p95 < 640 && queueUsage < 0.55) target = 1.18

  intakeValve.lastPressure = {
    p95LatencyMs: p95,
    errorRate: errRate,
    queueUsage,
    target
  }
  return target
}

function getLoginValveTarget() {
  const app30s = telemetry.getSnapshot ? telemetry.getSnapshot(30000) : {}
  const p95 = Number(app30s?.p95LatencyMs || 0)
  const errRate = Number(app30s?.errorRate || 0)

  let target = 1
  if (errRate > 0.05 || p95 > 7000) target = 0.12
  else if (errRate > 0.03 || p95 > 5000) target = 0.25
  else if (errRate > 0.02 || p95 > 3600) target = 0.4
  else if (errRate > 0.015 || p95 > 2400) target = 0.6
  else if (errRate < 0.01 && p95 > 0 && p95 < 900) target = 1.1

  loginValve.lastP95 = p95
  loginValve.lastErrorRate = errRate
  return target
}

function getLoginValve() {
  const now = Date.now()
  if (now - loginValve.lastUpdateAt > 1000) {
    const target = getLoginValveTarget()
    loginValve.value = clamp(loginValve.value * 0.65 + target * 0.35, 0.1, 1.2)
    loginValve.lastUpdateAt = now
  }
  return loginValve.value
}

function canAttemptLoginNow() {
  const dynamicCap = Math.max(1, Math.floor(LOGIN_WORKERS * getLoginValve()))
  return loginInFlight.size < dynamicCap
}

function getIntakeValve() {
  const now = Date.now()
  if (now - intakeValve.lastUpdateAt > 1000) {
    const target = getPressureTarget()
    intakeValve.value = clamp(intakeValve.value * 0.6 + target * 0.4, 0.12, 1.5)
    intakeValve.lastUpdateAt = now
  }
  return intakeValve.value
}

function getPressureLevel() {
  const intake = getIntakeValve()
  // 0: 低压，1: 高压
  return clamp((1.1 - intake) / 1.0, 0, 1)
}

function getRampBoost() {
  // 在系统健康时提升供给，在压力升高时自动降速
  const healthyRamp = 1 + Math.min(4.5, Math.log10(Math.max(10, registeredUsers.length + 10)))
  return healthyRamp * getIntakeValve()
}

function getNewUserWarmupMs() {
  const boost = getRampBoost()
  const min = Math.max(2 * 1000, Math.round(15 * 1000 / boost))
  const max = Math.max(12 * 1000, Math.round(45 * 1000 / Math.sqrt(boost)))
  return randomInt(min, max)
}

function getActionDelay(baseMin, baseMax) {
  const actionSpeed = currentScale.actionMultiplier * (currentScale.actionIntervalMultiplier || 1)
  const pressure = getPressureLevel()
  const pressureDelayFactor = 1 + pressure * 1.7
  const scaleAdjustedMin = Math.max(100, (baseMin / actionSpeed) * pressureDelayFactor)
  const scaleAdjustedMax = Math.max(200, (baseMax / actionSpeed) * pressureDelayFactor)
  return randomInt(scaleAdjustedMin, scaleAdjustedMax)
}

function getBehaviorWeights(behavior) {
  const pressure = getPressureLevel()
  const writeThrottle = 1 - pressure * 0.75
  const writeMultiplier = (currentScale.writeMultiplier || 1) * Math.max(0.2, writeThrottle)
  const weights = {
    browseArticles: behavior.browseArticles,
    browseStatuses: behavior.browseStatuses,
    publishArticle: behavior.publishArticle * writeMultiplier,
    publishStatus: behavior.publishStatus * writeMultiplier,
    likeContent: behavior.likeContent
  }

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / total]))
}

async function apiRequest(endpoint, options = {}) {
  const shouldCountFailure = options.countFailure !== false
  const requestOptions = { ...options }
  if (Object.prototype.hasOwnProperty.call(requestOptions, 'countFailure')) {
    delete requestOptions.countFailure
  }

  stats.totalRequests++
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...requestOptions,
      headers: { 'Content-Type': 'application/json', ...requestOptions.headers }
    })
    const data = await res.json()
    if ((!res.ok || !data?.success) && shouldCountFailure) stats.failedRequests++
    return { ...(data || {}), __status: res.status, __ok: res.ok }
  } catch (err) {
    if (shouldCountFailure) stats.failedRequests++
    return null
  }
}

async function loginAndStoreTokens(user, increaseLoginCount = false) {
  if (!user || user.isVisitor) return false
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: user.username, password: SIM_STOCK_PASSWORD }),
    countFailure: false
  })
  if (!data?.success) return false

  user.token = data.data.accessToken || data.data.token || null
  user.refreshToken = data.data.refreshToken || null
  if (increaseLoginCount) {
    user.loginCount = (user.loginCount || 0) + 1
  }
  return Boolean(user.token)
}

async function refreshAndStoreTokens(user) {
  if (!user || user.isVisitor || !user.refreshToken) return false
  const data = await apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: user.refreshToken }),
    countFailure: false
  })
  if (!data?.success) return false

  user.token = data.data.accessToken || data.data.token || user.token || null
  user.refreshToken = data.data.refreshToken || user.refreshToken || null
  return Boolean(user.token)
}

function getJwtExpireAtMs(token) {
  if (!token || typeof token !== 'string') return 0
  try {
    const payload = token.split('.')[1]
    if (!payload) return 0
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    const exp = Number(json?.exp || 0)
    return exp > 0 ? exp * 1000 : 0
  } catch (err) {
    return 0
  }
}

function shouldProactiveRefresh(user) {
  if (!user || !user.token || !user.refreshToken) return false
  const expiresAt = getJwtExpireAtMs(user.token)
  if (!expiresAt) return false
  return expiresAt - Date.now() <= 60 * 1000
}

async function apiRequestAsUser(user, endpoint, options = {}) {
  if (!user || user.isVisitor) {
    return apiRequest(endpoint, options)
  }

  if (!user.token) {
    const loggedIn = await loginAndStoreTokens(user, false)
    if (!loggedIn) {
      return null
    }
  }

  if (shouldProactiveRefresh(user)) {
    await refreshAndStoreTokens(user)
  }

  const first = await apiRequest(endpoint, {
    ...options,
    countFailure: false,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${user.token}` }
  })

  if (first?.success || first?.__status !== 401) {
    if (first && !first.success && first.__status !== 401) stats.failedRequests++
    return first
  }

  const refreshed = await refreshAndStoreTokens(user)
  if (refreshed) {
    const second = await apiRequest(endpoint, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${user.token}` }
    })
    return second
  }

  const relogin = await loginAndStoreTokens(user, false)
  if (!relogin) {
    stats.failedRequests++
    return first
  }

  return apiRequest(endpoint, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${user.token}` }
  })
}

async function withBackpressure(fn) {
  while (activeRequests >= getMaxConcurrent()) await sleep(10)
  activeRequests++
  try {
    return await fn()
  } finally {
    activeRequests--
  }
}

function createVisitorSession() {
  const visitorId = `visitor_${Date.now()}_${randomInt(1000, 9999)}`
  return new Session({
    id: visitorId,
    username: 'visitor',
    isVisitor: true,
    articleCount: 0,
    statusCount: 0,
    browses: 0
  }, 'VISITOR')
}

class Session {
  constructor(user, type) {
    this.user = user
    this.type = type
    this.startTime = Date.now()
    this.isAlive = true
    this.actionsInSession = 0
    this.beforeCounters = {
      articleCount: user.articleCount || 0,
      statusCount: user.statusCount || 0,
      browses: user.browses || 0
    }

    this.userTypeConfig = USER_TYPES[type] || USER_TYPES.SILENT_VETERAN
    this.duration = this.getDuration()
  }

  getDuration() {
    const [min, max] = this.userTypeConfig.sessionDuration
    const durationFactor = currentScale.sessionDurationMultiplier || 1
    const pressure = getPressureLevel()
    const holdFactor = 1 + pressure * 1.2
    const mins = Math.max(1, Math.round(randomInt(min, max) * durationFactor * holdFactor))
    return mins * 60 * 1000
  }

  async run() {
    while (this.isAlive && Date.now() - this.startTime < this.duration) {
      if (isPaused) {
        await sleep(200)
        continue
      }
      await this.performAction()
      const [minInterval, maxInterval] = this.userTypeConfig.actionInterval
      const baseDelay = randomInt(minInterval * 1000, maxInterval * 1000)
      const pressure = getPressureLevel()
      const pressureDelayFactor = 1 + pressure * 1.5
      const finalDelay =
        (baseDelay * pressureDelayFactor) /
        (getActivityMultiplier() * currentScale.actionMultiplier * (currentScale.actionIntervalMultiplier || 1))
      await sleep(Math.max(1000, finalDelay))
    }

    this.isAlive = false
    this.endTime = Date.now()
    this.finish()
  }

  finish() {
    const duration = this.endTime - this.startTime
    const deltaActions = this.user.isVisitor
      ? this.actionsInSession
      : Math.max(
          0,
          (this.user.articleCount || 0) - this.beforeCounters.articleCount +
            (this.user.statusCount || 0) - this.beforeCounters.statusCount +
            (this.user.browses || 0) - this.beforeCounters.browses
        )

    completedSessions.push({ type: this.type, duration, actions: deltaActions })
    if (completedSessions.length > MAX_HISTORY) completedSessions.shift()

    if (!this.user.isVisitor) {
      this.user.lastSessionEndedAt = Date.now()
      const cooldown = getSessionCooldownMs(this.user.userType)
      this.user.nextLoginAt = Date.now() + cooldown
      updateUserLifecycle(this.user)
    }
  }

  async performAction() {
    if (this.user.isVisitor) {
      const roll = Math.random()
      if (roll < 0.8) {
        await withBackpressure(() => this.browseArticles())
      } else {
        await withBackpressure(() => this.browseStatuses())
      }
      return
    }

    const behavior = getBehaviorWeights(this.userTypeConfig.behavior)
    const roll = Math.random()

    let cumulative = 0
    if (roll < (cumulative += behavior.browseArticles)) {
      await withBackpressure(() => this.browseArticles())
    } else if (roll < (cumulative += behavior.browseStatuses)) {
      await withBackpressure(() => this.browseStatuses())
    } else if (roll < (cumulative += behavior.publishArticle)) {
      await withBackpressure(() => this.publishArticle())
    } else if (roll < (cumulative += behavior.publishStatus)) {
      await withBackpressure(() => this.publishStatus())
    } else {
      await withBackpressure(() => this.likeRandomContent())
    }
  }

  async browseArticles() {
    this.user.browses = (this.user.browses || 0) + 1
    this.actionsInSession++
    const data = await apiRequestAsUser(this.user, '/articles?limit=20')
    if (data?.success && data.data.articles?.length) {
      const article = pick(data.data.articles)
      await sleep(getActionDelay(1000, 3000))
      await apiRequestAsUser(this.user, `/articles/${article.id}`)
      stats.browses++
    }
  }

  async browseStatuses() {
    await sleep(getActionDelay(800, 2000))
    this.actionsInSession++
    const data = await apiRequestAsUser(this.user, '/statuses?limit=20')
    if (data?.success && data.data?.length) {
      const status = pick(data.data)
      if (!this.user.isVisitor && Math.random() > 0.8) {
        await apiRequestAsUser(this.user, `/statuses/${status.id}/like`, { method: 'POST' })
        stats.likes++
      }
      stats.browses++
    }
  }

  async publishArticle() {
    if (this.user.isVisitor) return

    await sleep(getActionDelay(2000, 5000))
    const template = pick(articleTemplates)
    const data = await apiRequestAsUser(this.user, '/articles', {
      method: 'POST',
      body: JSON.stringify({
        title: template.title,
        category: template.category,
        content: template.content,
        excerpt: '...',
        description: '...'
      })
    })

    if (data?.success) {
      this.user.articleCount = (this.user.articleCount || 0) + 1
      this.actionsInSession++
      stats.articles++
    }
  }

  async publishStatus() {
    if (this.user.isVisitor) return

    await sleep(getActionDelay(1500, 3000))
    const data = await apiRequestAsUser(this.user, '/statuses', {
      method: 'POST',
      body: JSON.stringify({ content: pick(statusPool) })
    })

    if (data?.success) {
      this.user.statusCount = (this.user.statusCount || 0) + 1
      this.actionsInSession++
      stats.statuses++
    }
  }

  async likeRandomContent() {
    if (this.user.isVisitor) return

    if (Math.random() > 0.5) {
      const articlesData = await apiRequestAsUser(this.user, '/articles?limit=10')
      if (articlesData?.success && articlesData.data.articles?.length) {
        const article = pick(articlesData.data.articles)
        await apiRequestAsUser(this.user, `/articles/${article.id}/like`, { method: 'POST' })
        this.actionsInSession++
        stats.likes++
      }
    } else {
      const statusesData = await apiRequestAsUser(this.user, '/statuses?limit=10')
      if (statusesData?.success && statusesData.data?.length) {
        const status = pick(statusesData.data)
        await apiRequestAsUser(this.user, `/statuses/${status.id}/like`, { method: 'POST' })
        this.actionsInSession++
        stats.likes++
      }
    }
  }
}

function getSessionCooldownMs(type) {
  const cooldownFactor = currentScale.cooldownMultiplier || 1
  const acceleration = Math.max(1, getRampBoost())
  const scaled = (min, max) => {
    const effectiveFactor = cooldownFactor / acceleration
    const scaledMin = Math.max(8 * 1000, Math.round(min * effectiveFactor))
    const scaledMax = Math.max(30 * 1000, Math.round(max * effectiveFactor))
    return [scaledMin, Math.max(scaledMax, scaledMin + 10 * 1000)]
  }
  switch (type) {
    case 'ACTIVE_VETERAN': {
      const [min, max] = scaled(30 * 1000, 6 * 60 * 1000)
      return randomInt(min, max)
    }
    case 'NEW_USER': {
      const [min, max] = scaled(45 * 1000, 10 * 60 * 1000)
      return randomInt(min, max)
    }
    case 'SILENT_VETERAN':
    default: {
      const [min, max] = scaled(2 * 60 * 1000, 30 * 60 * 1000)
      return randomInt(min, max)
    }
  }
}

function isEligibleForLogin(user) {
  if (!user || !user.id) return false
  if (activeSessions.has(user.id)) return false
  if (loginInFlight.has(user.id)) return false
  if (!user.nextLoginAt) return true
  return Date.now() >= user.nextLoginAt
}

function pickLoginCandidate() {
  if (registeredUsers.length === 0) return null

  const maxSample = Math.min(
    220,
    Math.max(48, Math.round(48 * getRampBoost()), Math.round(Math.sqrt(registeredUsers.length) * 4)),
    registeredUsers.length
  )
  const sessions = Array.from(activeSessions.values()).filter((s) => !s.user.isVisitor)
  const totalNonVisitorOnline = sessions.length
  const onlineTypeCounts = sessions.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {})
  let best = null
  let bestScore = -1

  for (let i = 0; i < maxSample; i++) {
    const candidate = pick(registeredUsers)
    if (!isEligibleForLogin(candidate)) continue

    updateUserLifecycle(candidate)
    const baseBias = currentScale.loginBias[candidate.userType] || 1
    const stalenessBoost = candidate.lastSessionEndedAt
      ? clamp((Date.now() - candidate.lastSessionEndedAt) / (45 * 60 * 1000), 0.6, 2.8)
      : 1.6

    let ratioCorrection = 1
    if (totalNonVisitorOnline > 60 && currentScale.cohortMix[candidate.userType] !== undefined) {
      const targetRatio = currentScale.cohortMix[candidate.userType]
      const currentRatio = (onlineTypeCounts[candidate.userType] || 0) / totalNonVisitorOnline
      if (currentRatio > targetRatio * 1.2) ratioCorrection = 0.25
      else if (currentRatio < targetRatio * 0.75) ratioCorrection = 1.6
    }

    const score = baseBias * stalenessBoost * ratioCorrection * (0.7 + Math.random() * 0.8)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }

  return best
}

let isRunning = false
let isPaused = false
let pausedAt = 0

async function waitWhilePaused(epoch) {
  while (isRunning && isPaused && epoch === simulatorEpoch) {
    await sleep(200)
  }
}

async function scheduleRegistrations() {
  const epoch = simulatorEpoch
  while (isRunning && epoch === simulatorEpoch) {
    await waitWhilePaused(epoch)
    if (!isRunning || epoch !== simulatorEpoch) break

    const baseDelay = 1000 / currentScale.baseRegistrationRate
    const activity = Math.max(0.8, getActivityMultiplier())
    const throughputBoost = getRampBoost()
    const delay = (baseDelay / activity) / (Math.max(0.5, currentScale.actionMultiplier) * throughputBoost)
    await sleep(Math.max(15, randomInt(delay * 0.7, delay * 1.15)))
    if (!isRunning || epoch !== simulatorEpoch) break
    if (isPaused) continue

    if (registeredUsers.length >= currentScale.maxRegisteredUsers) {
      await sleep(5000)
      continue
    }

    const username = `${pick(lastNames)}_${pick(firstNames)}_${String(randomInt(1, 999999)).padStart(6, '0')}`
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email: `${username}@${pick(domains)}`,
        password: SIM_STOCK_PASSWORD
      })
    })

    if (data?.success) {
      const profile = enrichProfileAsStockUser(normalizeUserProfile({
        id: data.data.user.id,
        username: data.data.user.username,
        token: data.data.token,
        refreshToken: data.data.refreshToken || null,
        loginCount: 0,
        articleCount: 0,
        statusCount: 0,
        browses: 0,
        registrationTime: Date.now(),
        userType: 'NEW_USER',
        nextLoginAt: Date.now() + getNewUserWarmupMs()
      }))
      registeredUsers.push(profile)
      stats.registrations++
    }
  }
}

async function scheduleLogins() {
  const epoch = simulatorEpoch
  while (isRunning && epoch === simulatorEpoch) {
    await waitWhilePaused(epoch)
    if (!isRunning || epoch !== simulatorEpoch) break

    if (!canAttemptLoginNow()) {
      await sleep(20)
      continue
    }

    const baseDelay = 1000 / currentScale.baseLoginRate
    const activity = Math.max(0.8, getActivityMultiplier())
    const throughputBoost = getRampBoost()
    const delay = (baseDelay / activity) / (Math.max(0.5, currentScale.actionMultiplier) * throughputBoost)
    await sleep(Math.max(8, randomInt(delay * 0.7, delay * 1.15)))
    if (!isRunning || epoch !== simulatorEpoch) break
    if (isPaused) continue
    if (registeredUsers.length === 0) continue

    const candidate = pickLoginCandidate()
    if (!candidate) continue
    if (loginInFlight.has(candidate.id)) continue
    loginInFlight.add(candidate.id)

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: candidate.username, password: SIM_STOCK_PASSWORD })
      })

      if (data?.success) {
        candidate.token = data.data.token
        candidate.refreshToken = data.data.refreshToken || null
        candidate.loginCount = (candidate.loginCount || 0) + 1
        candidate.userType = inferUserType(candidate)

        const session = new Session(candidate, candidate.userType)
        activeSessions.set(candidate.id, session)
        stats.logins++
        session.run().then(() => activeSessions.delete(candidate.id))
      }
    } finally {
      loginInFlight.delete(candidate.id)
    }
  }
}

async function scheduleVisitors() {
  if (currentScale.visitorRatio <= 0) return

  const epoch = simulatorEpoch
  while (isRunning && epoch === simulatorEpoch) {
    await waitWhilePaused(epoch)
    if (!isRunning || epoch !== simulatorEpoch) break

    const activity = getActivityMultiplier()
    const pulse = getVisitorPulseMultiplier() * getIntakeValve()

    const nonVisitorOnline = Array.from(activeSessions.values()).filter((s) => !s.user.isVisitor).length
    const currentVisitors = Array.from(activeSessions.values()).filter((s) => s.user.isVisitor).length

    const targetByShare = Math.ceil((nonVisitorOnline * currentScale.visitorRatio) / Math.max(0.01, 1 - currentScale.visitorRatio))
    const targetVisitors = Math.max(0, Math.round(targetByShare * pulse))

    if (currentVisitors >= targetVisitors) {
      await sleep(4000)
      continue
    }

    const deficit = Math.max(1, targetVisitors - currentVisitors)
    const visitorArrivalRate = Math.max(0.2, currentScale.baseLoginRate * currentScale.visitorRatio * (deficit / 20))
    const baseDelay = 1000 / visitorArrivalRate
    const delay = (baseDelay / activity) / Math.max(0.5, currentScale.actionMultiplier)
    await sleep(Math.max(100, randomInt(delay * 0.7, delay * 1.3)))

    if (!isRunning || epoch !== simulatorEpoch) break
    if (isPaused) continue

    const session = createVisitorSession()
    activeSessions.set(session.user.id, session)
    session.run().then(() => activeSessions.delete(session.user.id))
  }
}

async function reconnectSessions() {
  const lastData = readSessionFile()
  if (!lastData.active.length) return

  console.log(`[Sim] 正在恢复上次在线会话：${lastData.active.length} 个`)

  const reconnectPromises = lastData.active.map(async (saved) => {
    try {
      if (saved.username === 'visitor') return

      const profile = registeredUsers.find((u) => u.username === saved.username)
      if (!profile || activeSessions.has(profile.id)) return

      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: profile.username, password: SIM_STOCK_PASSWORD })
      })

      if (data?.success) {
        profile.token = data.data.token
        profile.refreshToken = data.data.refreshToken || null
        profile.loginCount = (profile.loginCount || 0) + 1
        profile.userType = saved.type || inferUserType(profile)

        const session = new Session(profile, profile.userType)
        activeSessions.set(profile.id, session)
        stats.logins++
        session.run().then(() => activeSessions.delete(profile.id))
      }
    } catch (err) {
      // ignore reconnect errors
    }
  })

  await Promise.allSettled(reconnectPromises)
  console.log(`[Sim] 已恢复在线用户：${activeSessions.size} 个`)
}

function summarizeComposition() {
  const sessions = Array.from(activeSessions.values())
  const total = sessions.length || 1
  const activeVeterans = sessions.filter((s) => s.type === 'ACTIVE_VETERAN').length
  const silentVeterans = sessions.filter((s) => s.type === 'SILENT_VETERAN').length
  const newUsers = sessions.filter((s) => s.type === 'NEW_USER').length
  const visitors = sessions.filter((s) => s.type === 'VISITOR').length

  return {
    activeVeterans,
    silentVeterans,
    newUsers,
    visitors,
    activePct: ((activeVeterans / total) * 100).toFixed(1),
    silentPct: ((silentVeterans / total) * 100).toFixed(1),
    newPct: ((newUsers / total) * 100).toFixed(1),
    visitorPct: ((visitors / total) * 100).toFixed(1)
  }
}

async function startSimulator() {
  if (isRunning && isPaused) {
    resumeSimulator()
    return
  }
  if (isRunning) return
  isRunning = true
  isPaused = false
  pausedAt = 0
  simulatorEpoch += 1
  resetStats()
  completedSessions = []
  registeredUsers = []

  console.log(`[Sim] 启动压测模拟器，当前预设：${currentScale.label}`)
  console.log(
    `[Sim] 配置：注册用户池 ${currentScale.maxRegisteredUsers.toLocaleString()} | 峰值在线目标 ${currentScale.peakOnlineUsers.toLocaleString()} | 估算峰值请求 ${estimateTargetRpm(currentScale).toLocaleString()} rpm | 最大并发请求 ${currentScale.concurrentRequests}`
  )
  console.log(`[Sim] 说明：${currentScale.description}`)
  console.log(`[Sim] 游客占比 ${(currentScale.visitorRatio * 100).toFixed(1)}% | 写入倍率 ${currentScale.writeMultiplier.toFixed(2)}x`)
  console.log('[Sim] 已禁用恢复机制：本次从空状态启动')
  await bootstrapStockUsers()

  for (let i = 0; i < REGISTRATION_WORKERS; i++) {
    scheduleRegistrations()
  }
  for (let i = 0; i < LOGIN_WORKERS; i++) {
    scheduleLogins()
  }
  scheduleVisitors()

  const statsInterval = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000
    const apm = ((stats.articles / elapsed) * 60).toFixed(0)
    const spm = ((stats.statuses / elapsed) * 60).toFixed(0)
    const bpm = ((stats.browses / elapsed) * 60).toFixed(0)
    const errRate = stats.totalRequests > 0 ? ((stats.failedRequests / stats.totalRequests) * 100).toFixed(1) : 0
    const c = summarizeComposition()

    console.log(
      `[Sim] 注册用户 ${registeredUsers.length.toLocaleString()} | 在线 ${activeSessions.size.toLocaleString()} (` +
        `活跃老用户 ${c.activeVeterans} (${c.activePct}%) / 沉默老用户 ${c.silentVeterans} (${c.silentPct}%) / 新用户 ${c.newUsers} (${c.newPct}%) / 游客 ${c.visitors} (${c.visitorPct}%)) ` +
        `| 发文 ${apm} 篇/分钟 | 动态 ${spm} 条/分钟 | 浏览 ${bpm} 次/分钟 | 错误率 ${errRate}% | 请求队列 ${activeRequests}/${getMaxConcurrent()}`
    )
    console.log(
      `[Sim] 当前预设：${currentScale.label} | 峰值在线目标：${currentScale.peakOnlineUsers.toLocaleString()} | 注册用户池：${currentScale.maxRegisteredUsers.toLocaleString()}`
    )
  }, 30000)
  intervalHandles.add(statsInterval)

  const sessionFlushInterval = setInterval(() => {
    writeSessionFile().catch(() => {})
  }, 10000)
  intervalHandles.add(sessionFlushInterval)

  const userFlushInterval = setInterval(() => {
    writeUsersFile().catch(() => {})
  }, 10000)
  intervalHandles.add(userFlushInterval)
}
const fs = require('fs')
const path = require('path')
const SESSION_FILE = path.join(__dirname, '..', 'data', 'sim_sessions.json')
const USERS_FILE = path.join(__dirname, '..', 'data', 'sim_users.json')

async function writeSessionFile() {
  try {
    const data = {
      active: Array.from(activeSessions.values()).map((s) => ({
        id: s.user.id,
        username: s.user.username,
        type: s.type,
        onlineTime: Date.now() - s.startTime,
        remaining: s.duration - (Date.now() - s.startTime)
      })),
      completed: completedSessions
    }
    await fs.promises.writeFile(SESSION_FILE, JSON.stringify(data))
  } catch (err) {
    // ignore write errors in simulator
  }
}

async function writeUsersFile() {
  try {
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(registeredUsers))
  } catch (err) {
    // ignore write errors in simulator
  }
}

function readSessionFile() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'))
    }
  } catch (err) {
    // ignore read errors
  }
  return { active: [], completed: [] }
}

function readUsersFile() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
    }
  } catch (err) {
    // ignore read errors
  }
  return []
}

function stopSimulator() {
  isRunning = false
  isPaused = false
  pausedAt = 0
  simulatorEpoch += 1
  for (const session of activeSessions.values()) session.isAlive = false
  activeSessions.clear()
  loginInFlight.clear()
  activeRequests = 0
  for (const handle of intervalHandles) clearInterval(handle)
  intervalHandles.clear()
  console.log('[Sim] 模拟器已停止')
}

function pauseSimulator() {
  if (!isRunning || isPaused) return
  isPaused = true
  pausedAt = Date.now()
  console.log('[Sim] 模拟器已暂停')
}

function resumeSimulator() {
  if (!isRunning || !isPaused) return
  const pausedDuration = Math.max(0, Date.now() - pausedAt)
  isPaused = false
  pausedAt = 0

  // 将暂停时长补回会话与登录冷却，避免暂停期间被“偷走”运行时间。
  for (const session of activeSessions.values()) {
    session.startTime += pausedDuration
  }
  for (const user of registeredUsers) {
    if (user && user.nextLoginAt) {
      user.nextLoginAt += pausedDuration
    }
  }
  stats.startTime += pausedDuration
  console.log('[Sim] 模拟器已继续运行')
}

function getActiveSessions() {
  const data = readSessionFile()
  return data.active
}

function getCompletedSessions() {
  const data = readSessionFile()
  return data.completed
}

function getRuntimeStats() {
  const elapsed = Math.max(1, (Date.now() - stats.startTime) / 1000)
  return {
    state: isRunning ? (isPaused ? 'paused' : 'running') : 'stopped',
    running: isRunning,
    paused: isPaused,
    scale: currentScale.label,
    presetId: currentScale.id,
    description: currentScale.description,
    peakOnlineTarget: currentScale.peakOnlineUsers,
    maxRegisteredUsers: currentScale.maxRegisteredUsers,
    targetPeakRpm: estimateTargetRpm(currentScale),
    controls: {
      baseRegistrationRate: currentScale.baseRegistrationRate,
      baseLoginRate: currentScale.baseLoginRate,
      concurrentRequests: currentScale.concurrentRequests,
      actionMultiplier: currentScale.actionMultiplier,
      actionIntervalMultiplier: currentScale.actionIntervalMultiplier,
      sessionDurationMultiplier: currentScale.sessionDurationMultiplier,
      cooldownMultiplier: currentScale.cooldownMultiplier,
      visitorRatio: currentScale.visitorRatio,
      writeMultiplier: currentScale.writeMultiplier
    },
    queue: {
      active: activeRequests,
      limit: getMaxConcurrent()
    },
    valve: {
      intake: intakeValve.value,
      p95LatencyMs: intakeValve.lastPressure.p95LatencyMs,
      errorRate: intakeValve.lastPressure.errorRate,
      queueUsage: intakeValve.lastPressure.queueUsage,
      target: intakeValve.lastPressure.target,
      loginIntake: loginValve.value,
      loginP95LatencyMs: loginValve.lastP95,
      loginErrorRate: loginValve.lastErrorRate,
      loginInFlight: loginInFlight.size,
      loginCap: Math.max(1, Math.floor(LOGIN_WORKERS * getLoginValve()))
    },
    totals: {
      registrations: stats.registrations,
      logins: stats.logins,
      articles: stats.articles,
      statuses: stats.statuses,
      browses: stats.browses,
      likes: stats.likes,
      requests: stats.totalRequests,
      failedRequests: stats.failedRequests
    },
    ratesPerMinute: {
      articles: (stats.articles / elapsed) * 60,
      statuses: (stats.statuses / elapsed) * 60,
      browses: (stats.browses / elapsed) * 60
    },
    errorRate: stats.totalRequests > 0 ? stats.failedRequests / stats.totalRequests : 0
  }
}

function getAvailablePresets() {
  return Object.values(LOAD_PRESETS).map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    maxRegisteredUsers: preset.maxRegisteredUsers,
    peakOnlineTarget: preset.peakOnlineUsers,
    targetPeakRpm: estimateTargetRpm(preset)
  }))
}

function applyPreset(presetId) {
  const preset = LOAD_PRESETS[presetId]
  if (!preset) {
    throw new Error(`Unknown load preset: ${presetId}`)
  }

  const wasRunning = isRunning
  if (wasRunning) stopSimulator()

  currentScale = sanitizeConfig(resolvePreset(presetId))

  if (wasRunning) startSimulator()
  return getRuntimeStats()
}

function updateConfig(partialConfig = {}) {
  const wasRunning = isRunning
  if (wasRunning) stopSimulator()

  currentScale = sanitizeConfig({
    ...currentScale,
    ...partialConfig,
    id: 'custom',
    label: '自定义压测',
    description: '当前正在使用自定义调速参数。'
  })

  if (wasRunning) startSimulator()
  return getRuntimeStats()
}

module.exports = {
  startSimulator,
  pauseSimulator,
  resumeSimulator,
  stopSimulator,
  getActiveSessions,
  getCompletedSessions,
  getRuntimeStats,
  getAvailablePresets,
  applyPreset,
  updateConfig
}

