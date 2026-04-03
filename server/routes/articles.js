const express = require('express')
const router = express.Router()
const { getArticles, getArticleById, getRelatedArticles, createArticle, updateArticle, deleteArticle, getCategories } = require('../data/articles')
const { authMiddleware } = require('../middleware/auth')

// GET /api/articles - 获取文章列表
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10, cursor } = req.query
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
