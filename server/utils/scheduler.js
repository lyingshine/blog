const { createArticle } = require('../data/articles')
const { createStatus } = require('../data/statuses')
const articleTemplates = require('./articleTemplates')
const statusPool = require('./statusPool')

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[randomInt(0, arr.length - 1)]

const publishedStats = {
  articles: 0,
  statuses: 0
}

function getRandomArticle() {
  return pick(articleTemplates)
}

function getRandomStatus() {
  return pick(statusPool)
}

async function getRandomAuthorId() {
  const pool = require('../db/pool')
  const [[{ maxId }]] = await pool.query('SELECT MAX(id) as maxId FROM users')
  const totalUsers = maxId || 100000
  return randomInt(1, totalUsers)
}

async function publishOneArticle() {
  try {
    const authorId = await getRandomAuthorId()
    const template = getRandomArticle()
    const article = await createArticle({
      title: template.title,
      category: template.category,
      excerpt: template.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
      description: template.content.replace(/<[^>]*>/g, '').substring(0, 150),
      content: template.content,
      authorId
    })
    return article
  } catch (e) {
    console.error('[Scheduler] Failed to create article:', e.message)
    return null
  }
}

async function publishOneStatus() {
  try {
    const authorId = await getRandomAuthorId()
    const content = getRandomStatus()
    const status = await createStatus({ content, authorId })
    return status
  } catch (e) {
    console.error('[Scheduler] Failed to create status:', e.message)
    return null
  }
}

function getActivityMultiplier() {
  const hour = new Date().getHours()
  if (hour >= 9 && hour < 12) return 1.5
  if (hour >= 14 && hour < 18) return 1.3
  if (hour >= 20 && hour < 23) return 1.2
  if (hour >= 0 && hour < 6) return 0.3
  if (hour >= 6 && hour < 9) return 0.6
  return 1.0
}

function scheduleArticle() {
  const multiplier = getActivityMultiplier()
  const baseDelay = 800
  const adjustedDelay = baseDelay / multiplier
  const delay = randomInt(Math.max(200, adjustedDelay * 0.5), adjustedDelay * 1.5)

  setTimeout(async () => {
    const article = await publishOneArticle()
    if (article) {
      publishedStats.articles += 1
    }
    scheduleArticle()
  }, delay)
}

function scheduleStatus() {
  const multiplier = getActivityMultiplier()
  const baseDelay = 200
  const adjustedDelay = baseDelay / multiplier
  const delay = randomInt(Math.max(50, adjustedDelay * 0.5), adjustedDelay * 1.5)

  setTimeout(async () => {
    const status = await publishOneStatus()
    if (status) {
      publishedStats.statuses += 1
    }
    scheduleStatus()
  }, delay)
}

function startScheduler() {
  console.log('[Scheduler] 持续内容调度器已启动')

  scheduleArticle()
  scheduleStatus()

  setInterval(() => {
    console.log(`[Scheduler] 最近窗口发布统计：文章 ${publishedStats.articles}，动态 ${publishedStats.statuses}`)
    publishedStats.articles = 0
    publishedStats.statuses = 0
  }, 30000)
}

function stopScheduler() {
  console.log('[Scheduler] 内容调度器已停止')
}

module.exports = { startScheduler, stopScheduler, publishOneArticle, publishOneStatus }
