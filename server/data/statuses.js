const pool = require('../db/pool')
const cache = require('../utils/cache')

let statusListVersion = 1

function bumpStatusListVersion() {
  statusListVersion += 1
}

const getStatuses = async (page = 1, limit = 50, cursor = null) => {
  const cacheKey = `statuses:v${statusListVersion}:${cursor || page}:${limit}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const params = []
  let query = 'SELECT id, content, author_id, author_username, author_avatar, likes, created_at FROM statuses'

  if (cursor) {
    query += ' WHERE id < ?'
    params.push(parseInt(cursor))
  }

  query += ' ORDER BY id DESC LIMIT ?'
  params.push(parseInt(limit) + 1)

  const [rows] = await pool.read(query, params)

  const hasMore = rows.length > parseInt(limit)
  const statuses = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = statuses.length > 0 ? statuses[statuses.length - 1].id : null

  const result = { statuses, hasMore, nextCursor }
  cache.set(cacheKey, result, 10000)
  return result
}

const createStatus = async ({ content, authorId }) => {
  const [userRows] = await pool.read('SELECT username, avatar FROM users WHERE id = ? LIMIT 1', [authorId])
  const user = userRows[0] || {}

  const [result] = await pool.write(
    'INSERT INTO statuses (content, author_id, author_username, author_avatar, likes, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
    [content, authorId, user.username || '', user.avatar || '']
  )

  bumpStatusListVersion()

  const [rows] = await pool.read('SELECT id, content, author_id, author_username, author_avatar, likes, created_at FROM statuses WHERE id = ? LIMIT 1', [result.insertId])
  return rows[0]
}

const deleteStatus = async (id, authorId) => {
  const [rows] = await pool.read('SELECT id, author_id FROM statuses WHERE id = ? LIMIT 1', [id])
  const status = rows[0]
  if (!status) return false
  if (status.author_id !== authorId) return false

  await pool.write('DELETE FROM statuses WHERE id = ?', [id])
  bumpStatusListVersion()
  return true
}

const likeStatus = async (id) => {
  await pool.write('UPDATE statuses SET likes = likes + 1 WHERE id = ?', [id])
  const [rows] = await pool.read('SELECT id, likes FROM statuses WHERE id = ? LIMIT 1', [id])
  bumpStatusListVersion()
  return rows[0]
}

module.exports = {
  getStatuses,
  createStatus,
  deleteStatus,
  likeStatus
}
