const pool = require('../db/pool')
const cache = require('../utils/cache')

let articleListVersion = 1
const ARTICLE_COUNT_TTL = 30000
const articleCountCache = {
  all: { value: 0, ts: 0 },
  byCategory: new Map()
}

function bumpArticleListVersion() {
  articleListVersion += 1
}

async function getArticleTotal(category) {
  const now = Date.now()

  if (!category) {
    if (now - articleCountCache.all.ts < ARTICLE_COUNT_TTL) return articleCountCache.all.value
    const [[{ count }]] = await pool.read('SELECT COUNT(*) as count FROM articles')
    articleCountCache.all = { value: count, ts: now }
    return count
  }

  const cached = articleCountCache.byCategory.get(category)
  if (cached && now - cached.ts < ARTICLE_COUNT_TTL) return cached.value

  const [[{ count }]] = await pool.read('SELECT COUNT(*) as count FROM articles WHERE category = ?', [category])
  articleCountCache.byCategory.set(category, { value: count, ts: now })
  return count
}

function adjustArticleTotals(category, delta) {
  if (articleCountCache.all.ts > 0) {
    articleCountCache.all.value = Math.max(0, articleCountCache.all.value + delta)
  }

  if (category && articleCountCache.byCategory.has(category)) {
    const prev = articleCountCache.byCategory.get(category)
    articleCountCache.byCategory.set(category, {
      value: Math.max(0, prev.value + delta),
      ts: prev.ts
    })
  }
}

const getArticles = async (category, page = 1, limit = 10, cursor = null) => {
  const cacheKey = `articles:v${articleListVersion}:${category || 'all'}:${cursor || page}:${limit}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const params = []
  let query = 'SELECT id, title, category, read_time, excerpt, description, gradient, author_id, author_username, author_avatar, created_at FROM articles'

  if (category) {
    query += ' WHERE category = ?'
    params.push(category)
  }

  if (cursor) {
    if (params.length > 0) {
      query += ' AND id < ?'
    } else {
      query += ' WHERE id < ?'
    }
    params.push(parseInt(cursor))
  }

  query += ' ORDER BY id DESC LIMIT ?'
  params.push(parseInt(limit) + 1)

  const [rows] = await pool.read(query, params)

  const hasMore = rows.length > parseInt(limit)
  const articles = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = articles.length > 0 ? articles[articles.length - 1].id : null

  const total = await getArticleTotal(category)

  const result = {
    articles,
    total,
    hasMore,
    nextCursor,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  }

  cache.set(cacheKey, result, 60000)
  return result
}

const getArticleById = async (id) => {
  const cacheKey = `article:${id}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const [rows] = await pool.read('SELECT * FROM articles WHERE id = ? LIMIT 1', [id])
  const article = rows[0] || null
  if (article) cache.set(cacheKey, article, 30000)
  return article
}

const getRelatedArticles = async (id, category) => {
  const cacheKey = `related:${id}:${category}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const [rows] = await pool.read(
    'SELECT id, title, category, excerpt, gradient, created_at FROM articles WHERE id != ? AND category = ? ORDER BY id DESC LIMIT 2',
    [id, category]
  )
  cache.set(cacheKey, rows, 10000)
  return rows
}

const createArticle = async ({ title, category, excerpt, description, content, authorId }) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ]

  const gradient = gradients[Math.floor(Math.random() * gradients.length)]
  const readTime = Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, '').length / 500))
  const finalExcerpt = excerpt || description || content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
  const finalDescription = description || excerpt || ''
  const normalizedCategory = category || 'Î´·ÖÀà'

  const [userRows] = await pool.read('SELECT username, avatar FROM users WHERE id = ? LIMIT 1', [authorId])
  const user = userRows[0] || {}

  const [result] = await pool.write(
    'INSERT INTO articles (title, category, read_time, excerpt, description, gradient, author_id, author_username, author_avatar, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [title, normalizedCategory, readTime, finalExcerpt, finalDescription, gradient, authorId, user.username || '', user.avatar || '', content]
  )

  bumpArticleListVersion()
  adjustArticleTotals(normalizedCategory, 1)
  cache.del('categories')

  return await getArticleById(result.insertId)
}

const updateArticle = async (id, updates, authorId) => {
  const article = await getArticleById(id)
  if (!article) return null
  if (article.author_id !== authorId) return null

  const fields = []
  const values = []
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const col = key === 'readTime' ? 'read_time' : key
      fields.push(`${col} = ?`)
      values.push(value)
    }
  }

  if (fields.length === 0) return article

  values.push(id)
  await pool.write(`UPDATE articles SET ${fields.join(', ')} WHERE id = ?`, values)

  bumpArticleListVersion()
  cache.del(`article:${id}`)
  cache.del('categories')

  if (updates.category && updates.category !== article.category) {
    adjustArticleTotals(article.category, -1)
    adjustArticleTotals(updates.category, 1)
  }

  return await getArticleById(id)
}

const deleteArticle = async (id, authorId) => {
  const article = await getArticleById(id)
  if (!article) return false
  if (article.author_id !== authorId) return false

  await pool.write('DELETE FROM articles WHERE id = ?', [id])

  bumpArticleListVersion()
  adjustArticleTotals(article.category, -1)
  cache.del(`article:${id}`)
  cache.del('categories')

  return true
}

const getCategories = async () => {
  const cacheKey = 'categories'
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const [rows] = await pool.read('SELECT DISTINCT category FROM articles')
  const result = rows.map((r) => r.category)
  cache.set(cacheKey, result, 300000)
  return result
}

module.exports = {
  getArticles,
  getArticleById,
  getRelatedArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories
}
