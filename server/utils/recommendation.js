const pool = require('../db/pool')

function toNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function nowTs() {
  return Date.now()
}

function daysSince(dateLike) {
  const ts = new Date(dateLike).getTime()
  if (!Number.isFinite(ts)) return 999
  const delta = Math.max(0, nowTs() - ts)
  return delta / (24 * 60 * 60 * 1000)
}

function recencyBoost(dateLike, halfLifeHours = 48, base = 2.4) {
  const ts = new Date(dateLike).getTime()
  if (!Number.isFinite(ts)) return 0
  const hours = Math.max(0, (nowTs() - ts) / (60 * 60 * 1000))
  const decay = Math.exp(-hours / Math.max(1, halfLifeHours))
  return base * decay
}

function engagementBoost({ likes = 0, comments = 0, shares = 0 } = {}) {
  const weighted = toNum(likes) * 1.1 + toNum(comments) * 1.8 + toNum(shares) * 2.1
  return Math.log1p(Math.max(0, weighted))
}

function pushScore(map, key, score) {
  if (!key) return
  map[key] = (map[key] || 0) + score
}

function classOfChar(ch) {
  if (/[\u4e00-\u9fff]/.test(ch)) return 'C'
  if (/[a-z]/i.test(ch)) return 'E'
  if (/\d/.test(ch)) return 'D'
  if (/[，。！？；：,.!?;:]/.test(ch)) return 'P'
  return 'O'
}

function compactPattern(text = '') {
  const s = String(text || '').slice(0, 180)
  let pattern = ''
  let prev = ''
  let run = 0
  for (const ch of s) {
    const cls = classOfChar(ch)
    if (cls === prev) {
      run += 1
      continue
    }
    if (prev) pattern += `${prev}${Math.min(run, 4)}`
    prev = cls
    run = 1
  }
  if (prev) pattern += `${prev}${Math.min(run, 4)}`
  return pattern
}

function normalizeForSimilarity(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/\d+/g, '0')
    .replace(/\s+/g, '')
    .replace(/[“”"'`]/g, '')
    .replace(/[，。！？；：,.!?;:()（）【】\[\]<>《》]/g, '|')
    .replace(/\|+/g, '|')
    .trim()
}

function charNgramSet(s, n = 3) {
  const src = String(s || '')
  const out = new Set()
  if (!src) return out
  if (src.length <= n) {
    out.add(src)
    return out
  }
  for (let i = 0; i <= src.length - n; i += 1) {
    out.add(src.slice(i, i + n))
  }
  return out
}

function jaccard(aSet, bSet) {
  if (!aSet.size || !bSet.size) return 0
  let inter = 0
  for (const item of aSet) {
    if (bSet.has(item)) inter += 1
  }
  const union = aSet.size + bSet.size - inter
  return union > 0 ? inter / union : 0
}

function syntaxSignature(item) {
  const text = item.type === 'article'
    ? `${item.title || ''} ${item.excerpt || ''}`
    : `${item.content || ''}`

  const normalized = normalizeForSimilarity(text)
  const markerPool = ['今天', '最近', '这周', '关于', '记录', '复盘', '聊聊', '不是', '先做', '为什么']
  const marker = markerPool.find((m) => normalized.includes(m)) || 'none'
  const hasQuestion = /[?？]/.test(text) ? 'q1' : 'q0'
  const hasList = /1\)|1\.|一、|首先|其次|最后/.test(text) ? 'l1' : 'l0'
  const pattern = compactPattern(text)
  return {
    key: `${marker}|${hasQuestion}|${hasList}|${pattern}`,
    grams: charNgramSet(normalized, 3)
  }
}

function diversifyBySyntax(candidates = [], target = 100) {
  const picked = []
  const exactSignatures = new Set()
  const pickedSigs = []
  const authorCount = {}
  const backups = []

  for (const item of candidates) {
    if (picked.length >= target) break
    const sig = syntaxSignature(item)
    const authorId = toNum(item.author_id || item.authorId)
    const sameAuthorCount = authorId ? (authorCount[authorId] || 0) : 0
    const hardAuthorCap = picked.length < 30 ? 3 : 5

    let tooSimilar = false
    if (exactSignatures.has(sig.key)) {
      tooSimilar = true
    } else {
      for (const prev of pickedSigs) {
        if (prev.type !== item.type) continue
        if (jaccard(prev.grams, sig.grams) >= 0.82) {
          tooSimilar = true
          break
        }
      }
    }

    if (sameAuthorCount >= hardAuthorCap || tooSimilar) {
      backups.push({ item, sig })
      continue
    }

    picked.push(item)
    pickedSigs.push({ ...sig, type: item.type })
    exactSignatures.add(sig.key)
    if (authorId) authorCount[authorId] = sameAuthorCount + 1
  }

  for (const { item, sig } of backups) {
    if (picked.length >= target) break
    if (exactSignatures.has(sig.key)) continue
    picked.push(item)
    pickedSigs.push({ ...sig, type: item.type })
    exactSignatures.add(sig.key)
  }

  return picked
}

async function buildUserPreference(userId) {
  const safeUserId = toNum(userId)
  if (!safeUserId) {
    return {
      category: {},
      author: {},
      type: { article: 0, status: 0 },
      follows: new Set()
    }
  }

  const [followRows] = await pool.read(
    'SELECT followee_id FROM user_follows WHERE follower_id = ?',
    [safeUserId]
  )
  const follows = new Set((followRows || []).map((row) => toNum(row.followee_id)).filter(Boolean))

  const [reactionRows] = await pool.read(
    `SELECT
      cr.target_type,
      cr.reaction,
      cr.updated_at,
      a.author_id AS article_author_id,
      a.category AS article_category,
      s.author_id AS status_author_id
    FROM content_reactions cr
    LEFT JOIN articles a ON cr.target_type = 'article' AND a.id = cr.target_id
    LEFT JOIN statuses s ON cr.target_type = 'status' AND s.id = cr.target_id
    WHERE cr.user_id = ?
    ORDER BY cr.updated_at DESC
    LIMIT 800`,
    [safeUserId]
  )

  const [commentRows] = await pool.read(
    `SELECT
      cc.target_type,
      cc.created_at,
      a.author_id AS article_author_id,
      a.category AS article_category,
      s.author_id AS status_author_id
    FROM content_comments cc
    LEFT JOIN articles a ON cc.target_type = 'article' AND a.id = cc.target_id
    LEFT JOIN statuses s ON cc.target_type = 'status' AND s.id = cc.target_id
    WHERE cc.user_id = ?
    ORDER BY cc.created_at DESC
    LIMIT 600`,
    [safeUserId]
  )

  const [shareRows] = await pool.read(
    `SELECT
      cs.target_type,
      cs.created_at,
      a.author_id AS article_author_id,
      a.category AS article_category,
      s.author_id AS status_author_id
    FROM content_shares cs
    LEFT JOIN articles a ON cs.target_type = 'article' AND a.id = cs.target_id
    LEFT JOIN statuses s ON cs.target_type = 'status' AND s.id = cs.target_id
    WHERE cs.user_id = ?
    ORDER BY cs.created_at DESC
    LIMIT 600`,
    [safeUserId]
  )

  const category = {}
  const author = {}
  const type = { article: 0, status: 0 }

  const applyInteraction = (row, baseWeight) => {
    const targetType = String(row.target_type || '')
    if (targetType !== 'article' && targetType !== 'status') return

    const eventDays = daysSince(row.updated_at || row.created_at)
    const freshness = Math.max(0.35, Math.exp(-eventDays / 60))
    const score = baseWeight * freshness

    type[targetType] = (type[targetType] || 0) + score
    if (targetType === 'article') {
      pushScore(category, row.article_category, score)
      pushScore(author, toNum(row.article_author_id), score)
    } else {
      pushScore(author, toNum(row.status_author_id), score)
    }
  }

  for (const row of reactionRows || []) {
    const reaction = toNum(row.reaction)
    const w = reaction === 1 ? 2.8 : -2.2
    applyInteraction(row, w)
  }
  for (const row of commentRows || []) applyInteraction(row, 2.1)
  for (const row of shareRows || []) applyInteraction(row, 2.4)

  for (const authorId of follows) {
    pushScore(author, authorId, 2.6)
  }

  return { category, author, type, follows }
}

function scoreCandidate(item, preference) {
  const contentType = item.type
  const authorId = toNum(item.author_id || item.authorId)
  const category = item.category || ''

  const prefType = toNum(preference.type[contentType], 0) * 0.2
  const prefAuthor = toNum(preference.author[authorId], 0) * 0.95
  const prefCategory = contentType === 'article' ? toNum(preference.category[category], 0) * 0.75 : 0
  const followBoost = preference.follows.has(authorId) ? 1.6 : 0

  const recency = recencyBoost(item.created_at || item.date, 54, 2.3)
  const hot = engagementBoost(item)
  const randomJitter = (Math.random() - 0.5) * 0.24

  return recency + hot + prefType + prefAuthor + prefCategory + followBoost + randomJitter
}

async function queryArticleCandidates(limit = 240, viewerId = 0) {
  const safeLimit = Math.min(500, Math.max(20, toNum(limit, 240)))
  const viewer = toNum(viewerId)

  const [rows] = await pool.read(
    `SELECT
      a.id, a.title, a.category, a.read_time, a.excerpt, a.description, a.gradient,
      a.author_id, a.author_username, a.author_avatar, a.created_at,
      COALESCE(r.likes, 0) AS likes,
      COALESCE(c.comments, 0) AS comments,
      COALESCE(s.shares, 0) AS shares
    FROM articles a
    LEFT JOIN (
      SELECT target_id,
        SUM(CASE WHEN reaction = 1 THEN 1 ELSE 0 END) AS likes
      FROM content_reactions
      WHERE target_type = 'article'
      GROUP BY target_id
    ) r ON r.target_id = a.id
    LEFT JOIN (
      SELECT target_id, COUNT(*) AS comments
      FROM content_comments
      WHERE target_type = 'article'
      GROUP BY target_id
    ) c ON c.target_id = a.id
    LEFT JOIN (
      SELECT target_id, COUNT(*) AS shares
      FROM content_shares
      WHERE target_type = 'article'
      GROUP BY target_id
    ) s ON s.target_id = a.id
    WHERE (? = 0 OR a.author_id <> ?)
    ORDER BY a.id DESC
    LIMIT ?`,
    [viewer, viewer, safeLimit]
  )

  return rows.map((row) => ({ ...row, type: 'article' }))
}

async function queryStatusCandidates(limit = 240, viewerId = 0) {
  const safeLimit = Math.min(500, Math.max(20, toNum(limit, 240)))
  const viewer = toNum(viewerId)

  const [rows] = await pool.read(
    `SELECT
      st.id, st.content, st.author_id, st.author_username, st.author_avatar, st.created_at,
      COALESCE(r.likes, 0) AS likes,
      COALESCE(c.comments, 0) AS comments,
      COALESCE(s.shares, 0) AS shares
    FROM statuses st
    LEFT JOIN (
      SELECT target_id,
        SUM(CASE WHEN reaction = 1 THEN 1 ELSE 0 END) AS likes
      FROM content_reactions
      WHERE target_type = 'status'
      GROUP BY target_id
    ) r ON r.target_id = st.id
    LEFT JOIN (
      SELECT target_id, COUNT(*) AS comments
      FROM content_comments
      WHERE target_type = 'status'
      GROUP BY target_id
    ) c ON c.target_id = st.id
    LEFT JOIN (
      SELECT target_id, COUNT(*) AS shares
      FROM content_shares
      WHERE target_type = 'status'
      GROUP BY target_id
    ) s ON s.target_id = st.id
    WHERE (? = 0 OR st.author_id <> ?)
    ORDER BY st.id DESC
    LIMIT ?`,
    [viewer, viewer, safeLimit]
  )

  return rows.map((row) => ({ ...row, type: 'status' }))
}

async function generateDiscoveryRecommendations({ userId = 0, articleLimit = 100, statusLimit = 100 } = {}) {
  const safeArticleLimit = Math.min(200, Math.max(10, toNum(articleLimit, 100)))
  const safeStatusLimit = Math.min(200, Math.max(10, toNum(statusLimit, 100)))
  const safeUserId = toNum(userId)

  const [preference, articleCandidates, statusCandidates] = await Promise.all([
    buildUserPreference(safeUserId),
    queryArticleCandidates(Math.max(safeArticleLimit * 3, 120), safeUserId),
    queryStatusCandidates(Math.max(safeStatusLimit * 3, 120), safeUserId)
  ])

  const scoredArticles = articleCandidates
    .map((item) => ({ ...item, _score: scoreCandidate(item, preference) }))
    .sort((a, b) => b._score - a._score)
  const scoredStatuses = statusCandidates
    .map((item) => ({ ...item, _score: scoreCandidate(item, preference) }))
    .sort((a, b) => b._score - a._score)

  const diversifiedArticles = diversifyBySyntax(scoredArticles, safeArticleLimit)
  const diversifiedStatuses = diversifyBySyntax(scoredStatuses, safeStatusLimit)

  return {
    articles: diversifiedArticles.map(({ _score, ...item }) => item),
    statuses: diversifiedStatuses.map(({ _score, ...item }) => item)
  }
}

module.exports = {
  generateDiscoveryRecommendations
}

