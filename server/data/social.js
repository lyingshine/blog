const pool = require('../db/pool')

const ALLOWED_TARGET_TYPES = new Set(['status', 'article'])

function normalizeTargetType(targetType) {
  const normalized = String(targetType || '').trim().toLowerCase()
  return ALLOWED_TARGET_TYPES.has(normalized) ? normalized : ''
}

function normalizeTargetId(targetId) {
  const parsed = Number.parseInt(targetId, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

async function ensureTargetExists(targetType, targetId) {
  const type = normalizeTargetType(targetType)
  const id = normalizeTargetId(targetId)
  if (!type || !id) return false

  const table = type === 'status' ? 'statuses' : 'articles'
  const [rows] = await pool.read(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [id])
  return !!rows[0]
}

async function getTargetAuthorId(targetType, targetId) {
  const type = normalizeTargetType(targetType)
  const id = normalizeTargetId(targetId)
  if (!type || !id) return 0

  const table = type === 'status' ? 'statuses' : 'articles'
  const [rows] = await pool.read(`SELECT author_id FROM ${table} WHERE id = ? LIMIT 1`, [id])
  return Number(rows[0]?.author_id || 0)
}

async function setReaction({ userId, targetType, targetId, reaction }) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedTargetId = normalizeTargetId(targetId)
  const normalizedReaction = Number(reaction) === -1 ? -1 : 1

  if (!normalizedTargetType || !normalizedTargetId || !userId) {
    return null
  }

  const [existingRows] = await pool.read(
    'SELECT id, reaction FROM content_reactions WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1',
    [userId, normalizedTargetType, normalizedTargetId]
  )
  const existing = existingRows[0] || null

  if (existing && Number(existing.reaction) === normalizedReaction) {
    await pool.write('DELETE FROM content_reactions WHERE id = ?', [existing.id])
  } else if (existing) {
    await pool.write('UPDATE content_reactions SET reaction = ? WHERE id = ?', [normalizedReaction, existing.id])
  } else {
    await pool.write(
      'INSERT INTO content_reactions (user_id, target_type, target_id, reaction, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, normalizedTargetType, normalizedTargetId, normalizedReaction]
    )
  }

  return getEngagementByTarget(normalizedTargetType, normalizedTargetId, userId)
}

async function getEngagementByTarget(targetType, targetId, userId = 0) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedTargetId = normalizeTargetId(targetId)
  if (!normalizedTargetType || !normalizedTargetId) return null

  const [[reactionRows], [commentRows], [shareRows], [myReactionRows]] = await Promise.all([
    pool.read(
      `SELECT
        COALESCE(SUM(CASE WHEN reaction = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN reaction = -1 THEN 1 ELSE 0 END), 0) AS dislikes
      FROM content_reactions
      WHERE target_type = ? AND target_id = ?`,
      [normalizedTargetType, normalizedTargetId]
    ),
    pool.read(
      'SELECT COUNT(*) AS total FROM content_comments WHERE target_type = ? AND target_id = ?',
      [normalizedTargetType, normalizedTargetId]
    ),
    pool.read(
      'SELECT COUNT(*) AS total FROM content_shares WHERE target_type = ? AND target_id = ?',
      [normalizedTargetType, normalizedTargetId]
    ),
    userId
      ? pool.read(
        'SELECT reaction FROM content_reactions WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1',
        [userId, normalizedTargetType, normalizedTargetId]
      )
      : Promise.resolve([[]])
  ])

  return {
    targetType: normalizedTargetType,
    targetId: normalizedTargetId,
    likes: Number(reactionRows[0]?.likes || 0),
    dislikes: Number(reactionRows[0]?.dislikes || 0),
    comments: Number(commentRows[0]?.total || 0),
    shares: Number(shareRows[0]?.total || 0),
    myReaction: Number(myReactionRows[0]?.reaction || 0)
  }
}

async function getEngagementBatch(targetType, ids = [], userId = 0) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedIds = [...new Set(ids.map((id) => normalizeTargetId(id)).filter(Boolean))]
  if (!normalizedTargetType || normalizedIds.length === 0) return {}

  const placeholders = normalizedIds.map(() => '?').join(',')
  const reactionSql = `
    SELECT target_id,
      COALESCE(SUM(CASE WHEN reaction = 1 THEN 1 ELSE 0 END), 0) AS likes,
      COALESCE(SUM(CASE WHEN reaction = -1 THEN 1 ELSE 0 END), 0) AS dislikes
    FROM content_reactions
    WHERE target_type = ? AND target_id IN (${placeholders})
    GROUP BY target_id
  `
  const commentSql = `
    SELECT target_id, COUNT(*) AS total
    FROM content_comments
    WHERE target_type = ? AND target_id IN (${placeholders})
    GROUP BY target_id
  `
  const shareSql = `
    SELECT target_id, COUNT(*) AS total
    FROM content_shares
    WHERE target_type = ? AND target_id IN (${placeholders})
    GROUP BY target_id
  `

  const tasks = [
    pool.read(reactionSql, [normalizedTargetType, ...normalizedIds]),
    pool.read(commentSql, [normalizedTargetType, ...normalizedIds]),
    pool.read(shareSql, [normalizedTargetType, ...normalizedIds])
  ]

  if (userId) {
    const mySql = `
      SELECT target_id, reaction
      FROM content_reactions
      WHERE user_id = ? AND target_type = ? AND target_id IN (${placeholders})
    `
    tasks.push(pool.read(mySql, [userId, normalizedTargetType, ...normalizedIds]))
  }

  const [reactionRes, commentRes, shareRes, myRes = [[]]] = await Promise.all(tasks)
  const reactionRows = reactionRes[0] || []
  const commentRows = commentRes[0] || []
  const shareRows = shareRes[0] || []
  const myRows = myRes[0] || []

  const result = {}
  normalizedIds.forEach((id) => {
    result[id] = {
      targetType: normalizedTargetType,
      targetId: id,
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      myReaction: 0
    }
  })

  reactionRows.forEach((row) => {
    const id = Number(row.target_id)
    if (!result[id]) return
    result[id].likes = Number(row.likes || 0)
    result[id].dislikes = Number(row.dislikes || 0)
  })

  commentRows.forEach((row) => {
    const id = Number(row.target_id)
    if (!result[id]) return
    result[id].comments = Number(row.total || 0)
  })

  shareRows.forEach((row) => {
    const id = Number(row.target_id)
    if (!result[id]) return
    result[id].shares = Number(row.total || 0)
  })

  myRows.forEach((row) => {
    const id = Number(row.target_id)
    if (!result[id]) return
    result[id].myReaction = Number(row.reaction || 0)
  })

  return result
}

async function getComments(targetType, targetId, limit = 50) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedTargetId = normalizeTargetId(targetId)
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50))
  if (!normalizedTargetType || !normalizedTargetId) return []

  const [rows] = await pool.read(
    `SELECT c.id, c.user_id, c.target_type, c.target_id, c.content, c.parent_id, c.created_at,
      u.username AS author_username,
      u.avatar AS author_avatar
    FROM content_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.target_type = ? AND c.target_id = ?
    ORDER BY c.id DESC
    LIMIT ?`,
    [normalizedTargetType, normalizedTargetId, safeLimit]
  )

  return rows
}

async function createComment({ userId, targetType, targetId, content, parentId = null }) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedTargetId = normalizeTargetId(targetId)
  const trimmedContent = String(content || '').trim().slice(0, 1000)
  const normalizedParentId = parentId ? normalizeTargetId(parentId) : null

  if (!userId || !normalizedTargetType || !normalizedTargetId || !trimmedContent) {
    return null
  }

  const [result] = await pool.write(
    'INSERT INTO content_comments (user_id, target_type, target_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, normalizedTargetType, normalizedTargetId, trimmedContent, normalizedParentId]
  )

  const [rows] = await pool.read(
    `SELECT c.id, c.user_id, c.target_type, c.target_id, c.content, c.parent_id, c.created_at,
      u.username AS author_username,
      u.avatar AS author_avatar
    FROM content_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
    LIMIT 1`,
    [result.insertId]
  )

  return rows[0] || null
}

async function createShare({ userId, targetType, targetId, comment = '' }) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedTargetId = normalizeTargetId(targetId)
  const trimmedComment = String(comment || '').trim().slice(0, 500)

  if (!userId || !normalizedTargetType || !normalizedTargetId) {
    return null
  }

  const [result] = await pool.write(
    'INSERT INTO content_shares (user_id, target_type, target_id, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
    [userId, normalizedTargetType, normalizedTargetId, trimmedComment]
  )

  return {
    id: result.insertId,
    user_id: userId,
    target_type: normalizedTargetType,
    target_id: normalizedTargetId,
    comment: trimmedComment
  }
}

async function createReport({ userId, targetType, targetId, reason, details = '' }) {
  const normalizedTargetType = normalizeTargetType(targetType)
  const normalizedTargetId = normalizeTargetId(targetId)
  const trimmedReason = String(reason || '').trim().slice(0, 120)
  const trimmedDetails = String(details || '').trim().slice(0, 600)

  if (!userId || !normalizedTargetType || !normalizedTargetId || !trimmedReason) {
    return null
  }

  await pool.write(
    `INSERT INTO content_reports (user_id, target_type, target_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', NOW())
     ON DUPLICATE KEY UPDATE reason = VALUES(reason), details = VALUES(details), status = 'pending'`,
    [userId, normalizedTargetType, normalizedTargetId, trimmedReason, trimmedDetails]
  )

  const [rows] = await pool.read(
    `SELECT id, user_id, target_type, target_id, reason, details, status, created_at
     FROM content_reports
     WHERE user_id = ? AND target_type = ? AND target_id = ?
     LIMIT 1`,
    [userId, normalizedTargetType, normalizedTargetId]
  )

  return rows[0] || null
}

async function followUser(followerId, followeeId) {
  const a = normalizeTargetId(followerId)
  const b = normalizeTargetId(followeeId)
  if (!a || !b || a === b) return false

  await pool.write(
    'INSERT IGNORE INTO user_follows (follower_id, followee_id, created_at) VALUES (?, ?, NOW())',
    [a, b]
  )
  return true
}

async function unfollowUser(followerId, followeeId) {
  const a = normalizeTargetId(followerId)
  const b = normalizeTargetId(followeeId)
  if (!a || !b || a === b) return false

  await pool.write('DELETE FROM user_follows WHERE follower_id = ? AND followee_id = ?', [a, b])
  return true
}

async function isFollowing(followerId, followeeId) {
  const a = normalizeTargetId(followerId)
  const b = normalizeTargetId(followeeId)
  if (!a || !b || a === b) return false

  const [rows] = await pool.read(
    'SELECT id FROM user_follows WHERE follower_id = ? AND followee_id = ? LIMIT 1',
    [a, b]
  )
  return !!rows[0]
}

async function getFollowStats(userId, viewerId = 0) {
  const uid = normalizeTargetId(userId)
  if (!uid) return null

  const [[followersRows], [followingRows], [followingStateRows]] = await Promise.all([
    pool.read('SELECT COUNT(*) AS total FROM user_follows WHERE followee_id = ?', [uid]),
    pool.read('SELECT COUNT(*) AS total FROM user_follows WHERE follower_id = ?', [uid]),
    viewerId
      ? pool.read('SELECT id FROM user_follows WHERE follower_id = ? AND followee_id = ? LIMIT 1', [viewerId, uid])
      : Promise.resolve([[]])
  ])

  return {
    userId: uid,
    followers: Number(followersRows[0]?.total || 0),
    following: Number(followingRows[0]?.total || 0),
    isFollowing: !!followingStateRows[0]
  }
}

async function getFollowingList(userId, limit = 50) {
  const uid = normalizeTargetId(userId)
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50))
  if (!uid) return []

  const [rows] = await pool.read(
    `SELECT u.id, u.username, u.avatar, u.headline, f.created_at AS followed_at
     FROM user_follows f
     JOIN users u ON u.id = f.followee_id
     WHERE f.follower_id = ?
     ORDER BY f.id DESC
     LIMIT ?`,
    [uid, safeLimit]
  )
  return rows
}

async function getFollowersList(userId, limit = 50) {
  const uid = normalizeTargetId(userId)
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50))
  if (!uid) return []

  const [rows] = await pool.read(
    `SELECT u.id, u.username, u.avatar, u.headline, f.created_at AS followed_at
     FROM user_follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.followee_id = ?
     ORDER BY f.id DESC
     LIMIT ?`,
    [uid, safeLimit]
  )
  return rows
}

async function getFollowStateBatch(viewerId, targetUserIds = []) {
  const uid = normalizeTargetId(viewerId)
  const normalizedIds = [...new Set(targetUserIds.map((id) => normalizeTargetId(id)).filter(Boolean))]
  const map = {}
  normalizedIds.forEach((id) => {
    map[id] = false
  })

  if (!uid || normalizedIds.length === 0) return map

  const placeholders = normalizedIds.map(() => '?').join(',')
  const [rows] = await pool.read(
    `SELECT followee_id
     FROM user_follows
     WHERE follower_id = ? AND followee_id IN (${placeholders})`,
    [uid, ...normalizedIds]
  )

  rows.forEach((row) => {
    map[Number(row.followee_id)] = true
  })

  return map
}

async function sendPrivateMessage({ senderId, receiverId, content }) {
  const s = normalizeTargetId(senderId)
  const r = normalizeTargetId(receiverId)
  const trimmed = String(content || '').trim().slice(0, 1000)

  if (!s || !r || s === r || !trimmed) return null

  const [result] = await pool.write(
    'INSERT INTO private_messages (sender_id, receiver_id, content, is_read, created_at) VALUES (?, ?, ?, 0, NOW())',
    [s, r, trimmed]
  )

  const [rows] = await pool.read(
    `SELECT pm.id, pm.sender_id, pm.receiver_id, pm.content, pm.is_read, pm.created_at,
      su.username AS sender_username,
      su.avatar AS sender_avatar,
      ru.username AS receiver_username,
      ru.avatar AS receiver_avatar
     FROM private_messages pm
     JOIN users su ON su.id = pm.sender_id
     JOIN users ru ON ru.id = pm.receiver_id
     WHERE pm.id = ?
     LIMIT 1`,
    [result.insertId]
  )

  return rows[0] || null
}

async function getPrivateMessages(userId, peerUserId, limit = 100) {
  const uid = normalizeTargetId(userId)
  const pid = normalizeTargetId(peerUserId)
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 100))

  if (!uid || !pid) return []

  const [rows] = await pool.read(
    `SELECT pm.id, pm.sender_id, pm.receiver_id, pm.content, pm.is_read, pm.created_at,
      su.username AS sender_username,
      su.avatar AS sender_avatar,
      ru.username AS receiver_username,
      ru.avatar AS receiver_avatar
     FROM private_messages pm
     JOIN users su ON su.id = pm.sender_id
     JOIN users ru ON ru.id = pm.receiver_id
     WHERE (pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?)
     ORDER BY pm.id DESC
     LIMIT ?`,
    [uid, pid, pid, uid, safeLimit]
  )

  return rows.reverse()
}

async function markMessagesAsRead(userId, peerUserId) {
  const uid = normalizeTargetId(userId)
  const pid = normalizeTargetId(peerUserId)
  if (!uid || !pid) return

  await pool.write(
    'UPDATE private_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
    [pid, uid]
  )
}

async function getConversations(userId, limit = 50) {
  const uid = normalizeTargetId(userId)
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50))
  if (!uid) return []

  const [rows] = await pool.read(
    `SELECT
      IF(pm.sender_id = ?, pm.receiver_id, pm.sender_id) AS peer_id,
      MAX(pm.id) AS latest_message_id,
      MAX(pm.created_at) AS latest_at,
      SUM(CASE WHEN pm.receiver_id = ? AND pm.is_read = 0 THEN 1 ELSE 0 END) AS unread_count
    FROM private_messages pm
    WHERE pm.sender_id = ? OR pm.receiver_id = ?
    GROUP BY peer_id
    ORDER BY latest_message_id DESC
    LIMIT ?`,
    [uid, uid, uid, uid, safeLimit]
  )

  if (!rows.length) return []

  const peerIds = rows.map((row) => Number(row.peer_id)).filter(Boolean)
  const messageIds = rows.map((row) => Number(row.latest_message_id)).filter(Boolean)

  const peerPlaceholders = peerIds.map(() => '?').join(',')
  const messagePlaceholders = messageIds.map(() => '?').join(',')

  const [[peerRows], [messageRows]] = await Promise.all([
    pool.read(
      `SELECT id, username, avatar, headline
       FROM users
       WHERE id IN (${peerPlaceholders})`,
      peerIds
    ),
    pool.read(
      `SELECT id, sender_id, receiver_id, content, created_at
       FROM private_messages
       WHERE id IN (${messagePlaceholders})`,
      messageIds
    )
  ])

  const peerMap = new Map(peerRows.map((row) => [Number(row.id), row]))
  const messageMap = new Map(messageRows.map((row) => [Number(row.id), row]))

  return rows.map((row) => {
    const peer = peerMap.get(Number(row.peer_id)) || null
    const latestMessage = messageMap.get(Number(row.latest_message_id)) || null
    return {
      peer_id: Number(row.peer_id),
      unread_count: Number(row.unread_count || 0),
      latest_at: row.latest_at,
      peer,
      latest_message: latestMessage
    }
  })
}

module.exports = {
  normalizeTargetType,
  normalizeTargetId,
  ensureTargetExists,
  getTargetAuthorId,
  setReaction,
  getEngagementByTarget,
  getEngagementBatch,
  getComments,
  createComment,
  createShare,
  createReport,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowStats,
  getFollowingList,
  getFollowersList,
  getFollowStateBatch,
  sendPrivateMessage,
  getPrivateMessages,
  markMessagesAsRead,
  getConversations
}
