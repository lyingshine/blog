const express = require('express')
const router = express.Router()
const { getArticles, getArticleById, getRelatedArticles, createArticle, updateArticle, deleteArticle, getCategories } = require('../data/articles')
const { authMiddleware } = require('../middleware/auth')
const pool = require('../db/pool')

// GET /api/articles - 获取文章列表
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10, cursor, authorId } = req.query
    const parsedAuthorId = Number(authorId || 0)
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100)

    if (parsedAuthorId > 0) {
      const params = []
      const where = ['author_id = ?']
      params.push(parsedAuthorId)

      if (category) {
        where.push('category = ?')
        params.push(category)
      }
      if (cursor) {
        where.push('id < ?')
        params.push(parseInt(cursor, 10))
      }

      const [rows] = await pool.read(
        `SELECT id, title, category, read_time, excerpt, description, gradient, author_id, author_username, author_avatar, created_at
         FROM articles
         WHERE ${where.join(' AND ')}
         ORDER BY id DESC
         LIMIT ?`,
        [...params, parsedLimit + 1]
      )

      const hasMore = rows.length > parsedLimit
      const articles = hasMore ? rows.slice(0, -1) : rows
      const nextCursor = articles.length ? articles[articles.length - 1].id : null

      const countParams = [parsedAuthorId]
      let countSql = 'SELECT COUNT(*) as count FROM articles WHERE author_id = ?'
      if (category) {
        countSql += ' AND category = ?'
        countParams.push(category)
      }
      const [[{ count }]] = await pool.read(countSql, countParams)

      return res.json({
        success: true,
        data: {
          articles,
          total: count,
          hasMore,
          nextCursor,
          page: Number(page),
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit)
        }
      })
    }

    const result = await getArticles(category, page, limit, cursor)
    res.json({ success: true, data: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取文章失败' })
  }
})

// GET /api/articles/meta/categories - 获取所有分类
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await getCategories()
    res.json({ success: true, data: categories })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取分类失败' })
  }
})

// GET /api/articles/:id - 获取单篇文章
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const article = await getArticleById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: '文章未找到' })
    }
    const related = await getRelatedArticles(id, article.category)
    res.json({ success: true, data: { article, related } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '获取文章失败' })
  }
})

// POST /api/articles - 创建文章
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, excerpt, description, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容为必填项' })
    }
    const newArticle = await createArticle({ title, category, excerpt, description, content, authorId: req.user.id })
    res.status(201).json({ success: true, data: newArticle })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '创建文章失败' })
  }
})

// PUT /api/articles/:id - 更新文章
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const updated = await updateArticle(id, req.body, req.user.id)
    if (!updated) {
      return res.status(404).json({ success: false, message: '文章未找到或无权限' })
    }
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '更新文章失败' })
  }
})

// DELETE /api/articles/:id - 删除文章
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const deleted = await deleteArticle(id, req.user.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: '文章未找到或无权限' })
    }
    res.json({ success: true, message: '文章已删除' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '删除文章失败' })
  }
})

module.exports = router
