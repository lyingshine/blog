const OPENROUTER_API_KEY = process.env.QWEN_API_KEY || process.env.OPENROUTER_API_KEY || process.env.SIM_OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free'
const OPENROUTER_FIXED_FREE_MODEL = process.env.OPENROUTER_FIXED_FREE_MODEL || 'qwen/qwen3.6-plus-04-02:free'
const OPENROUTER_FREE_MODELS = process.env.OPENROUTER_FREE_MODELS || ''
const OPENROUTER_ENDPOINT = process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions'
const IS_OPENROUTER_ENDPOINT = /openrouter\\.ai/i.test(String(OPENROUTER_ENDPOINT))
const OPENROUTER_TIMEOUT_MS = Math.max(3000, Number(process.env.OPENROUTER_TIMEOUT_MS || 12000))
const OPENROUTER_MAX_CONCURRENCY = Math.max(1, Number(process.env.OPENROUTER_MAX_CONCURRENCY || 8))
const OPENROUTER_RETRY_TIMES = Math.max(1, Number(process.env.OPENROUTER_RETRY_TIMES || 4))
const SIM_AI_STRICT = String(process.env.SIM_AI_STRICT || 'true').toLowerCase() !== 'false'
const SIM_AI_BATCH_ENABLED = String(process.env.SIM_AI_BATCH_ENABLED || 'true').toLowerCase() !== 'false'
const SIM_AI_BATCH_STATUS_INITIAL_SIZE = Math.max(1, Math.min(100, Number(process.env.SIM_AI_BATCH_STATUS_INITIAL_SIZE || 20)))
const SIM_AI_BATCH_STATUS_REFILL_SIZE = Math.max(1, Math.min(200, Number(process.env.SIM_AI_BATCH_STATUS_REFILL_SIZE || 100)))
const SIM_AI_BATCH_COMMENT_SIZE = Math.max(1, Math.min(100, Number(process.env.SIM_AI_BATCH_COMMENT_SIZE || 8)))
const SIM_AI_BATCH_ARTICLE_SIZE = Math.max(1, Math.min(20, Number(process.env.SIM_AI_BATCH_ARTICLE_SIZE || 3)))

const CATEGORIES = ['technology', 'product', 'lifestyle', 'career', 'travel', 'culture', 'finance', 'health', 'education']
const CATEGORY_CN = {
  technology: '技术',
  product: '产品',
  lifestyle: '生活',
  career: '职场',
  travel: '旅行',
  culture: '文化',
  finance: '财务',
  health: '健康',
  education: '学习'
}
const USERNAME_SUFFIX = ['notes', 'daily', 'life', 'memo', 'diary', 'works', 'record']

const ARCHETYPES = [
  {
    id: 'office_worker',
    label: '上班族',
    occupations: ['operations', 'accounting', 'marketing'],
    tone: ['practical', 'calm'],
    topicBias: ['career', 'lifestyle', 'health']
  },
  {
    id: 'young_parent',
    label: '年轻家长',
    occupations: ['admin', 'operations', 'part-time'],
    tone: ['warm', 'realistic'],
    topicBias: ['education', 'lifestyle', 'health']
  },
  {
    id: 'student',
    label: '在读学生',
    occupations: ['student', 'intern'],
    tone: ['curious', 'reflective'],
    topicBias: ['education', 'career', 'lifestyle']
  },
  {
    id: 'engineer',
    label: '工程从业者',
    occupations: ['backend engineer', 'frontend engineer', 'qa engineer'],
    tone: ['concise', 'rational'],
    topicBias: ['technology', 'product', 'career']
  },
  {
    id: 'community_resident',
    label: '社区居民',
    occupations: ['freelancer', 'shop owner', 'self employed'],
    tone: ['grounded', 'friendly'],
    topicBias: ['lifestyle', 'culture', 'finance']
  }
]

let inflight = 0
const queue = []
const contentBuffers = {
  status: [],
  comment: [],
  article: []
}
const bufferFillInFlight = {
  status: null,
  comment: null,
  article: null
}
const bufferBootstrapped = {
  status: false,
  comment: false,
  article: false
}

function resolveFreeModel(model) {
  const raw = String(model || '').trim()
  if (!IS_OPENROUTER_ENDPOINT) return raw || 'qwen-turbo'
  if (!raw) return OPENROUTER_FIXED_FREE_MODEL
  if (raw === 'openrouter/free') return 'openrouter/free'
  if (raw.endsWith(':free')) return raw
  return `${raw}:free`
}

const ENFORCED_FREE_MODEL = resolveFreeModel(OPENROUTER_MODEL)
let modelCursor = 0

function buildFreeModelPool() {
  if (!IS_OPENROUTER_ENDPOINT) {
    return [resolveFreeModel(OPENROUTER_MODEL || 'qwen-turbo')]
  }

  const envList = String(OPENROUTER_FREE_MODELS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(resolveFreeModel)

  if (envList.length) {
    const uniqueEnv = []
    const seenEnv = new Set()
    for (const model of envList) {
      if (!model || seenEnv.has(model)) continue
      seenEnv.add(model)
      uniqueEnv.push(model)
    }
    return uniqueEnv
  }

  const defaults = [
    resolveFreeModel(OPENROUTER_MODEL),
    resolveFreeModel(OPENROUTER_FIXED_FREE_MODEL),
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen3.6-plus-04-02:free',
    'openrouter/free'
  ].map(resolveFreeModel)

  const deduped = []
  const seen = new Set()
  for (const model of [...envList, ...defaults]) {
    if (!model || seen.has(model)) continue
    seen.add(model)
    deduped.push(model)
  }
  return deduped.length ? deduped : [ENFORCED_FREE_MODEL]
}

const FREE_MODEL_POOL = buildFreeModelPool()
console.log(`[Sim AI] Model pool: ${FREE_MODEL_POOL.join(' | ')} | endpoint=${OPENROUTER_ENDPOINT}`)
console.log(
  `[Sim AI] Batch mode: ${SIM_AI_BATCH_ENABLED ? 'on' : 'off'} | status(initial=${SIM_AI_BATCH_STATUS_INITIAL_SIZE}, refill=${SIM_AI_BATCH_STATUS_REFILL_SIZE}) comment=${SIM_AI_BATCH_COMMENT_SIZE} article=${SIM_AI_BATCH_ARTICLE_SIZE}`
)
console.log(`[Sim AI] Strict mode: ${SIM_AI_STRICT ? 'on' : 'off'}`)

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr = []) {
  if (!Array.isArray(arr) || arr.length === 0) return ''
  return arr[randomInt(0, arr.length - 1)]
}

function stripHtml(input = '') {
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsChinese(text = '') {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(String(text))
}

function chineseRatio(text = '') {
  const raw = String(text || '')
  const chars = raw.replace(/\s+/g, '').split('')
  if (!chars.length) return 0
  const zh = chars.filter((ch) => /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(ch)).length
  return zh / chars.length
}

function isUsableChineseText(text = '', minRatio = 0.35) {
  const raw = String(text || '').trim()
  if (!raw) return false
  if (!containsChinese(raw)) return false
  return chineseRatio(raw) >= minRatio
}

function safeString(input = '', max = 220) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function sanitizeStatusItem(item = {}, user) {
  const content = safeString(item.content || item.text || '', 180)
  if (!isUsableChineseText(content, 0.2)) return null
  return {
    content,
    topic: normalizeCategory(item.topic || pick(user?.humanProfile?.topicBias) || 'lifestyle')
  }
}

function sanitizeCommentItem(item = {}) {
  const content = safeString(item.content || item.text || '', 220)
  if (!isUsableChineseText(content, 0.2)) return null
  return { content }
}

function sanitizeArticleItem(item = {}, user) {
  const title = safeString(item.title || '', 80)
  const content = String(item.content || '').trim()
  const excerpt = safeString(item.excerpt || stripHtml(content), 120)
  if (!isUsableChineseText(title, 0.35)) return null
  if (!isUsableChineseText(stripHtml(content), 0.35)) return null
  if (!isUsableChineseText(excerpt, 0.35)) return null

  const topic = normalizeCategory(item.topic || item.category || pick(user?.humanProfile?.topicBias) || 'lifestyle')
  return {
    title,
    category: normalizeCategory(item.category || topic),
    content,
    excerpt,
    description: safeString(item.description || `关于${categoryToChinese(topic)}的一条日常记录`, 90),
    topic
  }
}

function rotateRecent(list = [], value, max = 8) {
  const next = Array.isArray(list) ? list.slice() : []
  next.push(value)
  while (next.length > max) next.shift()
  return next
}

function categoryToChinese(category) {
  const key = String(category || '').toLowerCase().trim()
  return CATEGORY_CN[key] || '生活'
}

function acquireSlot() {
  if (inflight < OPENROUTER_MAX_CONCURRENCY) {
    inflight += 1
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    queue.push(resolve)
  }).then(() => {
    inflight += 1
  })
}

function releaseSlot() {
  inflight = Math.max(0, inflight - 1)
  const next = queue.shift()
  if (next) next()
}

function assignHumanIdentity(user = {}) {
  const target = user
  if (target.humanProfile) return target

  const archetype = pick(ARCHETYPES)
  target.humanProfile = {
    archetypeId: archetype.id,
    archetypeLabel: archetype.label,
    occupation: pick(archetype.occupations),
    tone: pick(archetype.tone),
    topicBias: archetype.topicBias,
    memory: {
      recentTopics: [],
      recentPosts: []
    }
  }

  return target
}

function createHumanUsername(lastNames = [], firstNames = [], occupied = new Set()) {
  const last = String(pick(lastNames) || 'lin').toLowerCase()
  const first = String(pick(firstNames) || 'milo').toLowerCase()
  const prefixes = ['hey', 'real', 'its', 'hello', 'iam', 'note']
  const patterns = [
    () => `${first}.${last}`,
    () => `${last}_${first}`,
    () => `${first}${randomInt(18, 99)}`,
    () => `${pick(prefixes)}_${first}`,
    () => `${first}_${pick(USERNAME_SUFFIX)}`,
    () => `${last}${first}${randomInt(10, 999)}`
  ]

  for (let i = 0; i < 40; i++) {
    const candidate = pick(patterns)()
      .replace(/[^a-z0-9._]/g, '')
      .replace(/\.{2,}/g, '.')
    if (!candidate || candidate.length < 3 || candidate.length > 24) continue
    if (!occupied.has(candidate)) return candidate
  }

  return `${first}${last}${Date.now().toString().slice(-6)}`
}

function extractJsonObject(text = '') {
  const raw = String(text || '').trim()
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (err) {
    // continue
  }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch (err) {
      // continue
    }
  }

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const slice = raw.slice(start, end + 1)
    try {
      return JSON.parse(slice)
    } catch (err) {
      return null
    }
  }

  return null
}

function extractTextFromContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part) return ''
        if (typeof part === 'string') return part
        return part.text || part.content || ''
      })
      .join('\n')
  }
  return ''
}

function fallbackArticle(user) {
  const profile = user?.humanProfile || {}
  const topic = pick(profile.topicBias) || 'lifestyle'
  const topicCn = categoryToChinese(topic)
  const titlePool = [
    `${topicCn}这件小事让我改了做法`,
    `关于${topicCn}的一条当日笔记`,
    `${topicCn}里的一个具体体感`
  ]
  const paragraphA = [
    `这两天在${topicCn}上，我更明显地感到节奏和情绪会互相影响。`,
    `围绕${topicCn}做事时，我发现真正卡住我的不是任务本身，而是切换成本。`,
    `我在${topicCn}这个主题上做了一个小调整，过程比预想更有启发。`
  ]
  const paragraphB = [
    '这次先从最小可执行动作开始，压力变小后反而更容易持续。',
    '我把目标拆得更细，虽然不显眼，但连续几天都能落地。',
    '先把可重复的部分做稳，再考虑优化，整体体验更顺。'
  ]
  const title = pick(titlePool)
  const content = `<p>${pick(paragraphA)}</p><p>${pick(paragraphB)}</p>`
  const excerpt = stripHtml(content).slice(0, 118)
  return {
    title,
    category: topic,
    content,
    excerpt,
    description: `${profile.archetypeLabel || '模拟用户'}关于${topicCn}的日常记录`,
    topic
  }
}

function fallbackStatus(user) {
  const profile = user?.humanProfile || {}
  const topic = pick(profile.topicBias) || 'lifestyle'
  const topicCn = categoryToChinese(topic)
  const statusPool = [
    `今天在${topicCn}上换了个做法，意外地顺手很多。`,
    `${topicCn}这件事我先缩小范围，执行负担一下轻了。`,
    `刚刚复盘了一下${topicCn}，发现慢一点反而更稳。`,
    `围绕${topicCn}做了个小实验，结果比想象中更可持续。`
  ]
  return {
    content: pick(statusPool),
    topic
  }
}

function fallbackComment(target = {}) {
  const seed = String(target.topic || target.title || target.excerpt || '').slice(0, 28)
  const withSeed = [
    `你提到“${seed}”这个点很到位，我也在类似场景里踩过同样的坑。`,
    `看到“${seed}”这段很有共鸣，这里确实是最容易被忽略的细节。`,
    `“${seed}”这个观察很实在，我这边验证下来也很接近。`
  ]
  const noSeed = [
    '这个角度挺有启发，我会按这个思路再试一轮。',
    '你这个结论很落地，尤其是执行层面的细节。',
    '读完很有共鸣，这个判断在实际场景里很有用。'
  ]
  return {
    content: seed ? pick(withSeed) : pick(noSeed)
  }
}

function getModelAttemptOrder() {
  if (!FREE_MODEL_POOL.length) return [ENFORCED_FREE_MODEL]
  const start = modelCursor % FREE_MODEL_POOL.length
  modelCursor = (modelCursor + 1) % FREE_MODEL_POOL.length
  return [...FREE_MODEL_POOL.slice(start), ...FREE_MODEL_POOL.slice(0, start)]
}

async function requestWithModel(model, { systemPrompt, userPrompt, temperature, maxTokens }) {
  await acquireSlot()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)

  try {
    const headers = {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
    if (IS_OPENROUTER_ENDPOINT) {
      headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL || 'http://localhost:3000'
      headers['X-Title'] = process.env.OPENROUTER_APP_NAME || 'blog-simulator'
    }

    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const retryable = res.status === 429 || res.status >= 500 || res.status === 408
      return { ok: false, json: null, rawText: '', reason: `http_${res.status}`, retryable, model, errorText: text }
    }

    const data = await res.json()
    const msg = data?.choices?.[0]?.message || {}
    const contentText = extractTextFromContent(msg.content)
    const reasoningText = extractTextFromContent(msg.reasoning)
    const rawText = String(contentText || reasoningText || '').trim()
    const json = extractJsonObject(rawText)
    return { ok: true, json, rawText, model, retryable: false }
  } catch (err) {
    return {
      ok: false,
      json: null,
      rawText: '',
      reason: err?.message || 'request_error',
      retryable: true,
      model
    }
  } finally {
    clearTimeout(timeout)
    releaseSlot()
  }
}

async function callOpenRouterResponse({ systemPrompt, userPrompt, temperature = 0.9, maxTokens = 650 }) {
  if (!OPENROUTER_API_KEY) return { ok: false, json: null, rawText: '', reason: 'missing_api_key', model: null }

  const attemptOrder = getModelAttemptOrder()
  let lastFail = { ok: false, json: null, rawText: '', reason: 'no_attempt', model: null }

  for (const model of attemptOrder) {
    const result = await requestWithModel(model, { systemPrompt, userPrompt, temperature, maxTokens })
    if (result.ok) return result
    lastFail = result
    if (!result.retryable) break
  }

  return lastFail
}

function createPersonaPrompt(user) {
  assignHumanIdentity(user)
  const p = user.humanProfile
  const topics = (p.memory?.recentTopics || []).slice(-5).join(', ') || 'none'
  return `role=${p.archetypeLabel}; occupation=${p.occupation}; tone=${p.tone}; preferred_topics=${(p.topicBias || []).join(',')}; recent_topics=${topics}`
}

function normalizeCategory(input) {
  const text = String(input || '').toLowerCase().trim()
  if (CATEGORIES.includes(text)) return text
  const hit = CATEGORIES.find((name) => text.includes(name))
  return hit || pick(CATEGORIES)
}

function rememberTopic(user, topic) {
  if (!user?.humanProfile?.memory || !topic) return
  user.humanProfile.memory.recentTopics = rotateRecent(user.humanProfile.memory.recentTopics, topic, 10)
}

function buildArticleFromLooseText(user, rawText = '') {
  const normalized = String(rawText || '').replace(/\s+/g, ' ').trim()
  if (!containsChinese(normalized)) return null
  const profile = user?.humanProfile || {}
  const topic = normalizeCategory(pick(profile.topicBias) || 'lifestyle')
  const plain = normalized.slice(0, 900)
  const paragraphs = plain
    .split(/[。！？]\s*/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5)
  const html = paragraphs.length
    ? paragraphs.map((line) => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}。</p>`).join('')
    : `<p>${plain.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
  const excerpt = stripHtml(html).slice(0, 120)
  const titleSeed = paragraphs[0] || excerpt || '今天的小记录'
  return {
    title: titleSeed.slice(0, 24),
    category: topic,
    content: html,
    excerpt,
    description: `关于${categoryToChinese(topic)}的一条日常记录`,
    topic
  }
}

async function fillBuffer(kind, user, target = {}) {
  if (!SIM_AI_BATCH_ENABLED) return
  if (bufferFillInFlight[kind]) return bufferFillInFlight[kind]

  const promise = (async () => {
    const persona = createPersonaPrompt(user)
    let systemPrompt = ''
    let userPrompt = ''
    let size = 1
    let maxTokens = 1200
    let temperature = 1

    if (kind === 'status') {
      size = bufferBootstrapped.status ? SIM_AI_BATCH_STATUS_REFILL_SIZE : SIM_AI_BATCH_STATUS_INITIAL_SIZE
      maxTokens = Math.min(3800, 120 + size * 60)
      temperature = 1.1
      systemPrompt = [
        'You generate realistic social status updates for simulator traffic.',
        'Return JSON: {"items":[{"content":"...", "topic":"lifestyle"}]}',
        'All generated content must be Chinese.',
        'The expression style must follow the given persona.'
      ].join(' ')
      userPrompt = [
        `Persona: ${persona}.`,
        `Task: generate ${size} different status items in Chinese.`,
        `topic should be one of: ${CATEGORIES.join(',')}`
      ].join('\n')
    } else if (kind === 'comment') {
      size = SIM_AI_BATCH_COMMENT_SIZE
      maxTokens = Math.min(3600, 120 + size * 56)
      temperature = 1.05
      const seed = safeString(target.topic || target.title || target.excerpt || '', 120)
      systemPrompt = [
        'You generate realistic social comments for simulator traffic.',
        'Return JSON: {"items":[{"content":"..."}]}',
        'All generated content must be Chinese.',
        'The expression style must follow the given persona.'
      ].join(' ')
      userPrompt = [
        `Persona: ${persona}.`,
        `Reference: ${seed || 'none'}.`,
        `Task: generate ${size} different comments in Chinese.`
      ].join('\n')
    } else {
      size = SIM_AI_BATCH_ARTICLE_SIZE
      maxTokens = Math.min(7600, 600 + size * 850)
      temperature = 1.05
      systemPrompt = [
        'You generate realistic social blog articles for simulator traffic.',
        'Return JSON: {"items":[{"title":"...","category":"lifestyle","content":"<p>...</p>","excerpt":"...","description":"...","topic":"lifestyle"}]}',
        'All generated fields must be Chinese.',
        'The expression style must follow the given persona.'
      ].join(' ')
      userPrompt = [
        `Persona: ${persona}.`,
        `Task: generate ${size} different articles in Chinese.`,
        'Use HTML for content field (<p> and optional <h2>).',
        `category/topic should be one of: ${CATEGORIES.join(',')}`
      ].join('\n')
    }

    const batchRetries = Math.min(2, OPENROUTER_RETRY_TIMES)
    let produced = []
    for (let i = 0; i < batchRetries; i++) {
      const result = await callOpenRouterResponse({ systemPrompt, userPrompt, temperature, maxTokens })
      const arr = Array.isArray(result?.json?.items) ? result.json.items : []
      if (arr.length) {
        produced = arr
        break
      }
    }

    if (!produced.length) return

    if (kind === 'status') {
      const cleaned = produced.map((item) => sanitizeStatusItem(item, user)).filter(Boolean)
      if (cleaned.length) {
        contentBuffers.status.push(...cleaned)
        bufferBootstrapped.status = true
      }
      return
    }

    if (kind === 'comment') {
      const cleaned = produced.map((item) => sanitizeCommentItem(item)).filter(Boolean)
      if (cleaned.length) contentBuffers.comment.push(...cleaned)
      return
    }

    const cleaned = produced.map((item) => sanitizeArticleItem(item, user)).filter(Boolean)
    if (cleaned.length) contentBuffers.article.push(...cleaned)
  })()

  bufferFillInFlight[kind] = promise
  try {
    await promise
  } finally {
    bufferFillInFlight[kind] = null
  }
}

function warmBuffer(kind, user, target) {
  if (!SIM_AI_BATCH_ENABLED) return
  const lowWatermark =
    kind === 'article'
      ? Math.max(1, Math.floor(SIM_AI_BATCH_ARTICLE_SIZE / 3))
      : kind === 'status'
      ? Math.max(10, Math.floor(SIM_AI_BATCH_STATUS_REFILL_SIZE / 3))
      : 8
  if (contentBuffers[kind].length > lowWatermark) return
  if (bufferFillInFlight[kind]) return
  fillBuffer(kind, user, target).catch(() => {})
}

async function generateHumanArticle(user) {
  assignHumanIdentity(user)
  if (SIM_AI_BATCH_ENABLED) {
    warmBuffer('article', user)
    if (!contentBuffers.article.length) {
      await fillBuffer('article', user)
    }
    const item = contentBuffers.article.shift()
    if (item) {
      rememberTopic(user, item.topic)
      warmBuffer('article', user)
      return item
    }
    // Batch miss: fall through to single-item AI generation instead of hard fallback.
  }

  const persona = createPersonaPrompt(user)

  const systemPrompt = [
    'You generate realistic social blog articles for simulator traffic.',
    'Return only JSON with fields: title, category, content, excerpt, description, topic.',
    'category must be one of: technology, product, lifestyle, career, travel, culture, finance, health, education.',
    'All text fields must be Chinese.',
    'Expression should match the given persona.'
  ].join(' ')

  const userPrompt = [
    `Persona: ${persona}.`,
    'Task: write one Chinese article.',
    'content should be HTML using <p> and optional <h2>.'
  ].join('\n')

  let ai = null
  let looseArticle = null
  for (let i = 0; i < OPENROUTER_RETRY_TIMES; i++) {
    const result = await callOpenRouterResponse({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 900
    })
    ai = result.json
    const chineseOk = containsChinese(ai?.title) && containsChinese(ai?.content) && containsChinese(ai?.excerpt)
    if (!chineseOk && isUsableChineseText(result.rawText, 0.2)) {
      looseArticle = buildArticleFromLooseText(user, result.rawText)
    }
    if (ai && chineseOk) break
    if (looseArticle) break
    ai = null
  }

  if (!ai && !looseArticle) {
    if (SIM_AI_STRICT) {
      throw new Error('AI生成文章失败：未返回可用中文内容')
    }
    const fallback = fallbackArticle(user)
    rememberTopic(user, fallback.topic)
    return fallback
  }

  if (!ai && looseArticle) {
    rememberTopic(user, looseArticle.topic)
    return looseArticle
  }

  const content = String(ai?.content || '').trim()
  if (!content && SIM_AI_STRICT) {
    throw new Error('AI生成文章失败：内容为空')
  }
  const topic = String(ai.topic || ai.category || 'lifestyle').toLowerCase()
  const normalizedTopic = normalizeCategory(topic)
  const excerptSource = String(ai.excerpt || stripHtml(content)).trim()
  const excerpt = excerptSource.slice(0, 120)
  const description = String(ai.description || `关于${categoryToChinese(normalizedTopic)}的一条日常记录`).slice(0, 90)

  const result = {
    title: String(ai.title || '记录一下今天').slice(0, 80),
    category: normalizeCategory(ai.category),
    content,
    excerpt,
    description,
    topic: normalizedTopic
  }

  rememberTopic(user, result.topic)
  return result
}

async function generateHumanStatus(user) {
  assignHumanIdentity(user)
  if (SIM_AI_BATCH_ENABLED) {
    warmBuffer('status', user)
    if (!contentBuffers.status.length) {
      await fillBuffer('status', user)
    }
    const item = contentBuffers.status.shift()
    if (item?.content) {
      rememberTopic(user, item.topic)
      warmBuffer('status', user)
      return item.content
    }
    // Batch miss: fall through to single-item AI generation instead of hard fallback.
  }

  const persona = createPersonaPrompt(user)

  const systemPrompt = [
    'You generate one realistic social status update for simulator traffic.',
    'Return only JSON with fields: content, topic.',
    'All text fields must be Chinese.',
    'Expression should match the given persona.'
  ].join(' ')

  const userPrompt = [
    `Persona: ${persona}.`,
    'Task: write one Chinese status update.'
  ].join('\n')

  let ai = null
  let looseText = ''
  for (let i = 0; i < OPENROUTER_RETRY_TIMES; i++) {
    const result = await callOpenRouterResponse({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 220
    })
    ai = result.json
    looseText = result.rawText || ''
    const chineseOk = containsChinese(ai?.content)
    if (ai && chineseOk) break
    ai = null
    if (isUsableChineseText(looseText, 0.2)) break
  }

  if (!ai && !isUsableChineseText(looseText, 0.2)) {
    if (SIM_AI_STRICT) {
      throw new Error('AI生成动态失败：未返回可用中文内容')
    }
    const fallback = fallbackStatus(user)
    rememberTopic(user, fallback.topic)
    return fallback.content
  }

  const content = String(ai?.content || looseText || '').replace(/\s+/g, ' ').trim()
  const topic = normalizeCategory(ai?.topic || pick(user?.humanProfile?.topicBias) || 'lifestyle')
  rememberTopic(user, topic)

  if (!content) {
    if (SIM_AI_STRICT) {
      throw new Error('AI生成动态失败：内容为空')
    }
    return fallbackStatus(user).content
  }

  return content.slice(0, 180)
}

async function generateHumanComment(user, target = {}) {
  assignHumanIdentity(user)
  if (SIM_AI_BATCH_ENABLED) {
    warmBuffer('comment', user, target)
    if (!contentBuffers.comment.length) {
      await fillBuffer('comment', user, target)
    }
    const item = contentBuffers.comment.shift()
    if (item?.content) {
      warmBuffer('comment', user, target)
      return item.content
    }
    // Batch miss: fall through to single-item AI generation instead of hard fallback.
  }

  const persona = createPersonaPrompt(user)
  const seed = String(target.topic || target.title || target.excerpt || '').slice(0, 160)
  const targetType = target.targetType === 'article' ? 'article' : 'status'

  const systemPrompt = [
    'You generate one realistic comment for simulator traffic.',
    'Return only JSON with field: content.',
    'All text fields must be Chinese.',
    'Expression should match the given persona.'
  ].join(' ')

  const userPrompt = [
    `Persona: ${persona}.`,
    `Target type: ${targetType}.`,
    `Reference text: ${seed || 'none'}.`,
    'Task: write one Chinese comment.'
  ].join('\n')

  let ai = null
  let looseText = ''
  for (let i = 0; i < OPENROUTER_RETRY_TIMES; i++) {
    const result = await callOpenRouterResponse({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 180
    })
    ai = result.json
    looseText = result.rawText || ''
    const chineseOk = containsChinese(ai?.content)
    if (ai && chineseOk) break
    ai = null
    if (isUsableChineseText(looseText, 0.2)) break
  }

  if (!ai && !isUsableChineseText(looseText, 0.2)) {
    if (SIM_AI_STRICT) {
      throw new Error('AI生成评论失败：未返回可用中文内容')
    }
    return fallbackComment(target).content.slice(0, 220)
  }

  const content = String(ai?.content || looseText || '').replace(/\s+/g, ' ').trim()
  if (!content) {
    if (SIM_AI_STRICT) {
      throw new Error('AI生成评论失败：内容为空')
    }
    return fallbackComment(target).content.slice(0, 220)
  }
  return content.slice(0, 220)
}

module.exports = {
  assignHumanIdentity,
  generateHumanArticle,
  generateHumanStatus,
  generateHumanComment,
  createHumanUsername
}


