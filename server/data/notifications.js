const pool = require('../db/pool')

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100

function normalizeLimit(limit) {
  const parsed = Number.parseInt(limit, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

const createNotification = async ({
  userId,
  actorId = null,
  type = 'system',
  title = '',
  content = '',
  link = ''
}) => {
  const [result] = await pool.write(
    'INSERT INTO notifications (user_id, actor_id, type, title, content, link, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())',
    [userId, actorId, type, title, content, link]
  )
  const [rows] = await pool.read(
    'SELECT id, user_id, actor_id, type, title, content, link, is_read, created_at FROM notifications WHERE id = ? LIMIT 1',
    [result.insertId]
  )
  return rows[0] || null
}

const getNotificationsByUserId = async (userId, { limit = DEFAULT_LIMIT, cursor } = {}) => {
  const safeLimit = normalizeLimit(limit)
  const params = [userId]
  let query = `
    SELECT id, user_id, actor_id, type, title, content, link, is_read, created_at
    FROM notifications
    WHERE user_id = ?
  `

  if (cursor) {
    query += ' AND id < ?'
    params.push(Number.parseInt(cursor, 10))
  }

  query += ' ORDER BY id DESC LIMIT ?'
  params.push(safeLimit + 1)

  const [rows] = await pool.read(query, params)
  const hasMore = rows.length > safeLimit
  const list = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = list.length > 0 ? list[list.length - 1].id : null

  return {
    notifications: list,
    hasMore,
    nextCursor
  }
}

const getUnreadCountByUserId = async (userId) => {
  const [[row]] = await pool.read(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  )
  return Number(row?.total || 0)
}

const markNotificationRead = async (id, userId) => {
  const [result] = await pool.write(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  )
  return result.affectedRows > 0
}

const markAllNotificationsRead = async (userId) => {
  await pool.write('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId])
}

module.exports = {
  createNotification,
  getNotificationsByUserId,
  getUnreadCountByUserId,
  markNotificationRead,
  markAllNotificationsRead
}
