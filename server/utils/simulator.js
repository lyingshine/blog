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
let runGeneratedUsernames = new Set()
let userByUsername = new Map()

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
const {
  assignHumanIdentity,
  generateHumanArticle,
  generateHumanStatus,
  generateHumanComment,
  createHumanUsername
} = require('./simHumanGenerator')
const telemetry = require('./telemetry')
const pool = require('../db/pool')
const bcrypt = require('bcryptjs')

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[randomInt(0, arr.length - 1)]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const SIM_STOCK_PASSWORD = 'SimUser@123'
const SIM_USER_EMAIL_DOMAIN = 'sim.local'
const SIM_CONTENT_TARGET = Math.max(1000, Number(process.env.SIM_CONTENT_TARGET || 10000))
const SIM_SEED_BATCH_SIZE = Math.max(100, Number(process.env.SIM_SEED_BATCH_SIZE || 1000))
const SIM_RUNTIME_ALLOW_WRITES = String(process.env.SIM_RUNTIME_ALLOW_WRITES || 'false').toLowerCase() === 'true'

const CN_LAST_NAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '周', '吴', '赵', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗']
const CN_GIVEN_NAMES = [
  '子涵', '雨桐', '浩然', '思远', '欣怡', '宇辰', '佳宁', '晨曦', '泽宇', '一诺', '可欣', '铭轩', '梓涵', '若彤', '俊杰',
  '昊天', '沐阳', '诗雨', '嘉悦', '星辰', '语彤', '知夏', '景行', '明轩', '安然', '念一', '北辰', '初夏', '晚晴', '时雨'
]
const CN_USER_SUFFIX = ['日常', '随笔', '生活志', '记录本', '慢生活', '小站']

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
    dbUserId: Number(user.dbUserId || user.db_user_id || 0),
    username: user.username,
    token: user.token || null,
    refreshToken: user.refreshToken || null,
    loginCount: user.loginCount || 0,
    articleCount: user.articleCount || 0,
    statusCount: user.statusCount || 0,
    browses: user.browses || 0,
    humanProfile: user.humanProfile || null,
    socialCircle: Array.isArray(user.socialCircle) ? user.socialCircle.slice(0, 16) : [],
    registrationTime: user.registrationTime || randomPastTimestamp(5, 540),
    userType: user.userType || assignCohortByMix(),
    nextLoginAt: user.nextLoginAt || 0,
    lastSessionEndedAt: user.lastSessionEndedAt || 0
  }

  assignHumanIdentity(profile)
  profile.userType = inferUserType(profile)
  return profile
}

function normalizeRegisteredUsers(users) {
  return users.map(normalizeUserProfile)
}

function rebuildUserIndex() {
  userByUsername = new Map()
  for (const user of registeredUsers) {
    if (user?.username) userByUsername.set(user.username, user)
  }
}

function rememberUser(user) {
  if (!user?.username) return
  userByUsername.set(user.username, user)
}

function getUserByUsername(username) {
  if (!username) return null
  return userByUsername.get(username) || null
}

function pickDistinctUsers(sampleSize, exceptUsername) {
  const chosen = []
  const used = new Set([exceptUsername])
  let guard = 0
  while (chosen.length < sampleSize && guard < sampleSize * 12 && registeredUsers.length > 1) {
    guard += 1
    const candidate = pick(registeredUsers)
    if (!candidate?.username || used.has(candidate.username)) continue
    used.add(candidate.username)
    chosen.push(candidate.username)
  }
  return chosen
}

function ensureSocialCircle(user) {
  if (!user || user.isVisitor) return []
  if (Array.isArray(user.socialCircle) && user.socialCircle.length >= 4) {
    return user.socialCircle
  }

  const targetSize = user.userType === 'ACTIVE_VETERAN' ? randomInt(8, 16) : user.userType === 'NEW_USER' ? randomInt(4, 9) : randomInt(5, 12)
  user.socialCircle = pickDistinctUsers(targetSize, user.username)
  return user.socialCircle
}

function pickCircleUser(user) {
  const circle = ensureSocialCircle(user)
  if (!circle.length) return null
  const shuffledPick = pick(circle)
  return getUserByUsername(shuffledPick)
}

function pickCircleAuthorId(user) {
  const circleUser = pickCircleUser(user)
  if (!circleUser?.dbUserId || circleUser.dbUserId <= 0) return 0
  return circleUser.dbUserId
}

async function reactToContent(user, targetType, targetId, reaction = 'like') {
  if (!user || !user.token || !targetType || !targetId) return null
  return apiRequestAsUser(user, '/social/reactions', {
    method: 'POST',
    body: JSON.stringify({
      targetType,
      targetId,
      reaction
    })
  })
}

async function commentOnContent(user, targetType, targetId, seed = {}) {
  if (!SIM_RUNTIME_ALLOW_WRITES) return null
  if (!user || !user.token || !targetType || !targetId) return null
  const comment = await generateHumanComment(user, {
    targetType,
    title: seed.title || '',
    excerpt: seed.excerpt || '',
    topic: seed.topic || ''
  })

  return apiRequestAsUser(user, '/social/comments', {
    method: 'POST',
    body: JSON.stringify({
      targetType,
      targetId,
      content: comment
    })
  })
}

async function maybeFollowFromCircle(user) {
  if (!user || !user.token || !user.dbUserId) return false
  if (Math.random() > 0.18) return false

  const target = pickCircleUser(user)
  if (!target?.dbUserId || target.dbUserId === user.dbUserId) return false

  const resp = await apiRequestAsUser(user, `/social/follows/${target.dbUserId}`, { method: 'POST' })
  return Boolean(resp?.success)
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
  const maxPresetPool = Object.values(LOAD_PRESETS).reduce((best, preset) => {
    const byOnline = Math.max(2000, Math.round(preset.peakOnlineUsers * 8))
    const byPreset = Math.max(5000, Math.round(preset.maxRegisteredUsers * 0.15))
    const value = Math.min(preset.maxRegisteredUsers, 120000, Math.max(byOnline, byPreset))
    return Math.max(best, value)
  }, 0)
  return Math.max(5000, maxPresetPool)
}

function makeStockUsername(index) {
  const first = firstNames[index % firstNames.length]
  const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length]
  const bucket = pick(['notes', 'daily', 'lab', 'studio', 'works'])
  const serial = String(Math.floor(index / (firstNames.length * lastNames.length)) + 1).padStart(4, '0')
  return `${first}.${last}_${bucket}${serial}`
}

async function bootstrapStockUsers() {
  const target = getBootstrapPoolSize()
  if (target <= 0) return

  const seeded = []
  for (let i = 0; i < target; i++) {
    const username = makeStockUsername(i)
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
    runGeneratedUsernames.add(username)
  }

  // 直接导入数据库作为存量账号，后续仍走正常 /auth/login 流程。
  const hashedPassword = await bcrypt.hash(SIM_STOCK_PASSWORD, 10)
  const [[{ existingStockUsers }]] = await pool.read(
    "SELECT COUNT(*) AS existingStockUsers FROM users WHERE email LIKE '%@stock.local'"
  )

  if (Number(existingStockUsers || 0) < target) {
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
  } else {
    console.log(`[Sim] 复用已有存量用户池：${Number(existingStockUsers).toLocaleString()}`)
  }

  registeredUsers = seeded
  rebuildUserIndex()
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
  const allowWrites = SIM_RUNTIME_ALLOW_WRITES
  const weights = {
    browseArticles: behavior.browseArticles,
    browseStatuses: behavior.browseStatuses,
    publishArticle: allowWrites ? behavior.publishArticle * writeMultiplier : 0,
    publishStatus: allowWrites ? behavior.publishStatus * writeMultiplier : 0,
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
  user.dbUserId = Number(data?.data?.user?.id || user.dbUserId || 0)
  rememberUser(user)
  ensureSocialCircle(user)
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
  user.dbUserId = Number(data?.data?.user?.id || user.dbUserId || 0)
  rememberUser(user)
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
    this.recentSeen = []
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
    if (!this.user.isVisitor) {
      ensureSocialCircle(this.user)
      await maybeFollowFromCircle(this.user)
    }

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

  rememberSeen(targetType, item) {
    if (!item?.id) return
    this.recentSeen.push({
      targetType,
      id: Number(item.id),
      authorId: Number(item.author_id || item.authorId || 0),
      title: item.title || '',
      excerpt: item.excerpt || item.content || ''
    })
    if (this.recentSeen.length > 18) this.recentSeen.shift()
  }

  pickSeenTarget() {
    if (!this.recentSeen.length) return null

    if (Math.random() > 0.55) {
      const circleIds = ensureSocialCircle(this.user)
        .map((name) => getUserByUsername(name))
        .map((u) => Number(u?.dbUserId || 0))
        .filter((id) => id > 0)
      const socialTargets = this.recentSeen.filter((item) => circleIds.includes(item.authorId))
      if (socialTargets.length) return pick(socialTargets)
    }

    return pick(this.recentSeen)
  }

  async maybeReactOrComment(target) {
    if (!target || this.user.isVisitor) return
    const pressure = getPressureLevel()
    const reactRate = clamp(0.28 - pressure * 0.2, 0.06, 0.28)
    const commentRate = clamp(0.14 - pressure * 0.1, 0.03, 0.14)

    if (Math.random() < reactRate) {
      const reaction = Math.random() > 0.12 ? 'like' : 'dislike'
      const reacted = await reactToContent(this.user, target.targetType, target.id, reaction)
      if (reacted?.success && reaction === 'like') stats.likes++
    }

    if (Math.random() < commentRate) {
      const commented = await commentOnContent(this.user, target.targetType, target.id, {
        title: target.title,
        excerpt: target.excerpt
      })
      if (commented?.success) this.actionsInSession++
    }
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
    const preferredAuthorId = pickCircleAuthorId(this.user)
    const endpoint = preferredAuthorId && Math.random() > 0.35 ? `/articles?limit=20&authorId=${preferredAuthorId}` : '/articles?limit=20'
    const data = await apiRequestAsUser(this.user, endpoint)
    if (data?.success && data.data.articles?.length) {
      const article = pick(data.data.articles)
      await sleep(getActionDelay(1000, 3000))
      await apiRequestAsUser(this.user, `/articles/${article.id}`)
      this.rememberSeen('article', article)
      if (!this.user.isVisitor && Math.random() < 0.24) {
        await this.maybeReactOrComment({
          targetType: 'article',
          id: article.id,
          authorId: article.author_id,
          title: article.title,
          excerpt: article.excerpt
        })
      }
      stats.browses++
    }
  }

  async browseStatuses() {
    await sleep(getActionDelay(800, 2000))
    this.actionsInSession++
    const preferredAuthorId = pickCircleAuthorId(this.user)
    const endpoint = preferredAuthorId && Math.random() > 0.3 ? `/statuses?limit=20&authorId=${preferredAuthorId}` : '/statuses?limit=20'
    const data = await apiRequestAsUser(this.user, endpoint)
    if (data?.success && data.data?.length) {
      const status = pick(data.data)
      this.rememberSeen('status', status)
      if (!this.user.isVisitor && Math.random() < 0.34) {
        await this.maybeReactOrComment({
          targetType: 'status',
          id: status.id,
          authorId: status.author_id,
          excerpt: status.content
        })
      }
      stats.browses++
    }
  }

  async publishArticle() {
    if (this.user.isVisitor) return

    await sleep(getActionDelay(2000, 5000))
    const generated = await generateHumanArticle(this.user)
    const template = pick(articleTemplates)
    const payload = {
      title: generated?.title || template.title,
      category: generated?.category || template.category,
      content: generated?.content || template.content,
      excerpt: generated?.excerpt || '...',
      description: generated?.description || '...'
    }
    const data = await apiRequestAsUser(this.user, '/articles', {
      method: 'POST',
      body: JSON.stringify(payload)
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
    const generated = await generateHumanStatus(this.user)
    const data = await apiRequestAsUser(this.user, '/statuses', {
      method: 'POST',
      body: JSON.stringify({ content: generated || pick(statusPool) })
    })

    if (data?.success) {
      this.user.statusCount = (this.user.statusCount || 0) + 1
      this.actionsInSession++
      stats.statuses++
    }
  }

  async likeRandomContent() {
    if (this.user.isVisitor) return

    let target = this.pickSeenTarget()
    if (!target) {
      if (Math.random() > 0.5) {
        const articlesData = await apiRequestAsUser(this.user, '/articles?limit=10')
        if (articlesData?.success && articlesData.data.articles?.length) {
          const article = pick(articlesData.data.articles)
          target = {
            targetType: 'article',
            id: Number(article.id),
            authorId: Number(article.author_id || 0),
            title: article.title,
            excerpt: article.excerpt
          }
          this.rememberSeen('article', article)
        }
      } else {
        const statusesData = await apiRequestAsUser(this.user, '/statuses?limit=10')
        if (statusesData?.success && statusesData.data?.length) {
          const status = pick(statusesData.data)
          target = {
            targetType: 'status',
            id: Number(status.id),
            authorId: Number(status.author_id || 0),
            excerpt: status.content
          }
          this.rememberSeen('status', status)
        }
      }
    }

    if (!target) return

    const reacted = await reactToContent(this.user, target.targetType, target.id, 'like')
    if (reacted?.success) {
      this.actionsInSession++
      stats.likes++
      if (Math.random() < 0.28) {
        await commentOnContent(this.user, target.targetType, target.id, {
          title: target.title,
          excerpt: target.excerpt
        })
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

function makeChineseSimUsername(index = 0) {
  const last = pick(CN_LAST_NAMES)
  const given = pick(CN_GIVEN_NAMES)
  const suffix = pick(CN_USER_SUFFIX)
  const serial = String((index % 900000) + 100000).slice(-6)
  return `${last}${given}${suffix}${serial}`
}

async function getSeedStatus() {
  const [[{ simUsers }]] = await pool.read(`SELECT COUNT(*) AS simUsers FROM users WHERE email LIKE ?`, [`%@${SIM_USER_EMAIL_DOMAIN}`])
  const [[{ simArticles }]] = await pool.read(
    `SELECT COUNT(*) AS simArticles
     FROM articles a
     JOIN users u ON u.id = a.author_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  const [[{ simStatuses }]] = await pool.read(
    `SELECT COUNT(*) AS simStatuses
     FROM statuses s
     JOIN users u ON u.id = s.author_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  const [[{ simComments }]] = await pool.read(
    `SELECT COUNT(*) AS simComments
     FROM content_comments c
     JOIN users u ON u.id = c.user_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )

  const users = Number(simUsers || 0)
  const articles = Number(simArticles || 0)
  const statuses = Number(simStatuses || 0)
  const comments = Number(simComments || 0)
  return {
    users,
    articles,
    statuses,
    comments,
    targetContent: SIM_CONTENT_TARGET,
    ready: users > 0 && articles >= SIM_CONTENT_TARGET && statuses >= SIM_CONTENT_TARGET
  }
}

async function loadSimUsersFromDb() {
  const [rows] = await pool.read(
    `SELECT id, username, avatar, created_at
     FROM users
     WHERE email LIKE ?
     ORDER BY id ASC
     LIMIT ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`, Math.min(currentScale.maxRegisteredUsers, 200000)]
  )

  registeredUsers = normalizeRegisteredUsers(
    rows.map((row, idx) => ({
      id: `sim_${row.id}`,
      dbUserId: row.id,
      username: row.username,
      token: null,
      refreshToken: null,
      loginCount: randomInt(0, 18),
      articleCount: randomInt(0, 16),
      statusCount: randomInt(0, 42),
      browses: randomInt(0, 1200),
      registrationTime: new Date(row.created_at || Date.now()).getTime(),
      userType: idx % 7 === 0 ? 'ACTIVE_VETERAN' : idx % 5 === 0 ? 'NEW_USER' : 'SILENT_VETERAN',
      nextLoginAt: Date.now() + randomInt(1000, 120000)
    }))
  )
  rebuildUserIndex()
}

async function generateSimUsers(batchSize = SIM_SEED_BATCH_SIZE) {
  const target = Math.max(1, Number(batchSize || SIM_SEED_BATCH_SIZE))
  const hashedPassword = await bcrypt.hash(SIM_STOCK_PASSWORD, 10)
  const values = []
  for (let i = 0; i < target; i++) {
    const username = makeChineseSimUsername(i + Date.now())
    values.push(username, `${username}@${SIM_USER_EMAIL_DOMAIN}`, hashedPassword, String(username).charAt(0), 'user')
  }
  const placeholders = Array.from({ length: target }, () => '(?, ?, ?, ?, ?, NOW())').join(', ')
  await pool.write(
    `INSERT IGNORE INTO users (username, email, password, avatar, role, created_at) VALUES ${placeholders}`,
    values
  )
  await loadSimUsersFromDb()
  return getSeedStatus()
}

async function generateSimContent(batchSize = SIM_SEED_BATCH_SIZE) {
  const amount = Math.max(1, Number(batchSize || SIM_SEED_BATCH_SIZE))
  const [authors] = await pool.read(
    `SELECT id, username, avatar
     FROM users
     WHERE email LIKE ?
     ORDER BY RAND()
     LIMIT 2000`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )

  if (!authors.length) {
    throw new Error('请先生成模拟用户')
  }

  const articleRows = []
  const statusRows = []
  const commentDrafts = []
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ]

  for (let i = 0; i < amount; i++) {
    const author = authors[i % authors.length]
    const pseudoUser = normalizeUserProfile({
      id: `seed_${author.id}_${i}`,
      dbUserId: author.id,
      username: author.username,
      token: null,
      loginCount: 0,
      articleCount: 0,
      statusCount: 0,
      browses: 0,
      registrationTime: Date.now() - randomInt(1, 120) * 86400000,
      userType: 'SILENT_VETERAN'
    })
    const article = await generateHumanArticle(pseudoUser)
    const status = await generateHumanStatus(pseudoUser)

    const cleanContent = String(article?.content || '').trim()
    const plain = cleanContent.replace(/<[^>]*>/g, '').trim()
    const readTime = Math.max(1, Math.ceil(plain.length / 500))
    articleRows.push([
      String(article?.title || `生活记录 ${i + 1}`).slice(0, 280),
      String(article?.category || 'lifestyle').slice(0, 50),
      readTime,
      String(article?.excerpt || plain.slice(0, 110)).slice(0, 1200),
      String(article?.description || '').slice(0, 1200),
      pick(gradients),
      author.id,
      author.username || '',
      author.avatar || '',
      cleanContent || `<p>${plain || '今日记录'}</p>`
    ])
    statusRows.push([String(status || '今日记录').slice(0, 500), author.id, author.username || '', author.avatar || '', 0])
    const commenter = authors[(i + 7) % authors.length]
    const titleHint = String(article?.title || '').slice(0, 22)
    const statusHint = String(status || '').slice(0, 22)
    commentDrafts.push({
      article: [
        commenter.id,
        'article',
        i, // placeholder for article index
        `看到“${titleHint || '这篇内容'}”这个点很有共鸣，实操里确实容易被忽略。`.slice(0, 500)
      ],
      status: [
        commenter.id,
        'status',
        i, // placeholder for status index
        `这条动态很真实，尤其是“${statusHint || '这个细节'}”这部分。`.slice(0, 500)
      ]
    })
  }

  let articleIds = []
  let statusIds = []
  if (articleRows.length) {
    const [result] = await pool.write(
      'INSERT INTO articles (title, category, read_time, excerpt, description, gradient, author_id, author_username, author_avatar, content, created_at) VALUES ?',
      [articleRows.map((row) => [...row, new Date()])]
    )
    const firstId = Number(result?.insertId || 0)
    if (firstId > 0) {
      articleIds = Array.from({ length: articleRows.length }, (_, i) => firstId + i)
    }
  }
  if (statusRows.length) {
    const [result] = await pool.write(
      'INSERT INTO statuses (content, author_id, author_username, author_avatar, likes, created_at) VALUES ?',
      [statusRows.map((row) => [...row, new Date()])]
    )
    const firstId = Number(result?.insertId || 0)
    if (firstId > 0) {
      statusIds = Array.from({ length: statusRows.length }, (_, i) => firstId + i)
    }
  }

  const commentRows = []
  if (articleIds.length && statusIds.length) {
    for (const draft of commentDrafts) {
      const aIdx = Number(draft.article[2] || 0)
      const sIdx = Number(draft.status[2] || 0)
      const articleId = articleIds[aIdx]
      const statusId = statusIds[sIdx]
      if (articleId) commentRows.push([draft.article[0], 'article', articleId, draft.article[3], null, new Date()])
      if (statusId) commentRows.push([draft.status[0], 'status', statusId, draft.status[3], null, new Date()])
    }
  }
  if (commentRows.length) {
    await pool.write(
      'INSERT INTO content_comments (user_id, target_type, target_id, content, parent_id, created_at) VALUES ?',
      [commentRows]
    )
  }
  return getSeedStatus()
}

async function deleteSimContent() {
  await pool.write(
    `DELETE c FROM content_comments c
     JOIN users u ON u.id = c.user_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  await pool.write(
    `DELETE c FROM content_comments c
     JOIN articles a ON c.target_type = 'article' AND c.target_id = a.id
     JOIN users u ON u.id = a.author_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  await pool.write(
    `DELETE c FROM content_comments c
     JOIN statuses s ON c.target_type = 'status' AND c.target_id = s.id
     JOIN users u ON u.id = s.author_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  await pool.write(
    `DELETE a FROM articles a
     JOIN users u ON u.id = a.author_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  await pool.write(
    `DELETE s FROM statuses s
     JOIN users u ON u.id = s.author_id
     WHERE u.email LIKE ?`,
    [`%@${SIM_USER_EMAIL_DOMAIN}`]
  )
  return getSeedStatus()
}

async function deleteSimUsers() {
  await pool.write(`DELETE FROM users WHERE email LIKE ?`, [`%@${SIM_USER_EMAIL_DOMAIN}`])
  await loadSimUsersFromDb()
  return getSeedStatus()
}

function generateRegistrationIdentity() {
  const occupied = new Set(registeredUsers.map((user) => user.username))
  for (const name of runGeneratedUsernames) occupied.add(name)

  const username = createHumanUsername(lastNames, firstNames, occupied)
  const email = `${username}@${pick(domains)}`
  return { username, email }
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

    const { username, email } = generateRegistrationIdentity()
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password: SIM_STOCK_PASSWORD
      })
    })

    if (data?.success) {
      runGeneratedUsernames.add(data.data.user.username || username)
      const profile = enrichProfileAsStockUser(normalizeUserProfile({
        id: data.data.user.id,
        dbUserId: data.data.user.id,
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
      rememberUser(profile)
      ensureSocialCircle(profile)
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
        candidate.dbUserId = Number(data?.data?.user?.id || candidate.dbUserId || 0)
        rememberUser(candidate)
        ensureSocialCircle(candidate)
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
        profile.dbUserId = Number(data?.data?.user?.id || profile.dbUserId || 0)
        rememberUser(profile)
        ensureSocialCircle(profile)
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
  runGeneratedUsernames = new Set()
  userByUsername = new Map()

  console.log(`[Sim] 启动压测模拟器，当前预设：${currentScale.label}`)
  console.log(
    `[Sim] 配置：注册用户池 ${currentScale.maxRegisteredUsers.toLocaleString()} | 峰值在线目标 ${currentScale.peakOnlineUsers.toLocaleString()} | 估算峰值请求 ${estimateTargetRpm(currentScale).toLocaleString()} rpm | 最大并发请求 ${currentScale.concurrentRequests}`
  )
  console.log(`[Sim] 说明：${currentScale.description}`)
  console.log(`[Sim] 游客占比 ${(currentScale.visitorRatio * 100).toFixed(1)}% | 写入倍率 ${currentScale.writeMultiplier.toFixed(2)}x`)
  console.log('[Sim] 已禁用恢复机制：本次从空状态启动')
  const seed = await getSeedStatus()
  if (!seed.ready) {
    isRunning = false
    throw new Error(
      `请先生成初始数据：当前模拟用户 ${seed.users}，文章 ${seed.articles}，动态 ${seed.statuses}，要求文章/动态至少 ${seed.targetContent}`
    )
  }

  await loadSimUsersFromDb()

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

async function cleanupRunGeneratedData() {
  const usernames = Array.from(runGeneratedUsernames).filter((name) => typeof name === 'string' && name.trim())
  if (!usernames.length) return

  const chunkSize = 500
  let deleted = 0
  for (let i = 0; i < usernames.length; i += chunkSize) {
    const chunk = usernames.slice(i, i + chunkSize)
    const placeholders = chunk.map(() => '?').join(', ')
    const [result] = await pool.write(`DELETE FROM users WHERE username IN (${placeholders})`, chunk)
    deleted += Number(result?.affectedRows || 0)
  }

  runGeneratedUsernames.clear()
  console.log(`[Sim] 已清理本轮模拟数据用户：${deleted} 个`)
}

async function stopSimulator(options = {}) {
  const { cleanupGeneratedData = false } = options
  isRunning = false
  isPaused = false
  pausedAt = 0
  simulatorEpoch += 1
  for (const session of activeSessions.values()) session.isAlive = false
  activeSessions.clear()
  // 停止后不再展示历史会话，后台活动面板应立即归零。
  completedSessions = []
  loginInFlight.clear()
  activeRequests = 0
  for (const handle of intervalHandles) clearInterval(handle)
  intervalHandles.clear()
  // 立即落盘，避免读取到旧的 active/completed 残留。
  await writeSessionFile().catch(() => {})
  if (cleanupGeneratedData) {
    await cleanupRunGeneratedData().catch((err) => {
      console.error('[Sim] 清理本轮模拟数据失败:', err?.message || err)
    })
  }
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
  if (!isRunning) return []
  const data = readSessionFile()
  return data.active
}

function getCompletedSessions() {
  if (!isRunning) return []
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

async function applyPreset(presetId) {
  const preset = LOAD_PRESETS[presetId]
  if (!preset) {
    throw new Error(`Unknown load preset: ${presetId}`)
  }

  const wasRunning = isRunning
  if (wasRunning) await stopSimulator({ cleanupGeneratedData: false })

  currentScale = sanitizeConfig(resolvePreset(presetId))

  if (wasRunning) await startSimulator()
  return getRuntimeStats()
}

async function updateConfig(partialConfig = {}) {
  const wasRunning = isRunning
  if (wasRunning) await stopSimulator({ cleanupGeneratedData: false })

  currentScale = sanitizeConfig({
    ...currentScale,
    ...partialConfig,
    id: 'custom',
    label: '自定义压测',
    description: '当前正在使用自定义调速参数。'
  })

  if (wasRunning) await startSimulator()
  return getRuntimeStats()
}

module.exports = {
  startSimulator,
  pauseSimulator,
  resumeSimulator,
  stopSimulator,
  getSeedStatus,
  generateSimUsers,
  generateSimContent,
  deleteSimUsers,
  deleteSimContent,
  getActiveSessions,
  getCompletedSessions,
  getRuntimeStats,
  getAvailablePresets,
  applyPreset,
  updateConfig
}

