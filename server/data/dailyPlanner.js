const pool = require('../db/pool')

let plannerSchemaReadyPromise = null

async function ensurePlannerSchema() {
  if (plannerSchemaReadyPromise) return plannerSchemaReadyPromise

  plannerSchemaReadyPromise = (async () => {
    await pool.write(`
      CREATE TABLE IF NOT EXISTS daily_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        plan_json LONGTEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_daily_plans_updated_at (updated_at),
        CONSTRAINT fk_daily_plans_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  })()

  return plannerSchemaReadyPromise
}

function normalizeTask(item = {}) {
  return {
    id: String(item.id || ''),
    title: String(item.title || '').slice(0, 120),
    deadlineDate: String(item.deadlineDate || '').slice(0, 20),
    deadlineTime: String(item.deadlineTime || '').slice(0, 20),
    deadlineDateTime: String(item.deadlineDateTime || '').slice(0, 40),
    estimateMinutes: Math.max(0, Math.min(720, Number(item.estimateMinutes) || 0)),
    result: String(item.result || '').slice(0, 500),
    completed: Boolean(item.completed),
    completedAt: String(item.completedAt || '').slice(0, 40)
  }
}

function normalizePayload(payload = {}) {
  const tasks = Array.isArray(payload.tasks) ? payload.tasks.slice(0, 300).map(normalizeTask) : []
  const filterMode = ['today', 'future', 'overdue', 'all'].includes(payload.filterMode) ? payload.filterMode : 'today'

  return {
    isEditMode: Boolean(payload.isEditMode),
    filterMode,
    hideCompleted: Boolean(payload.hideCompleted),
    batchReminderMarkSent: String(payload.batchReminderMarkSent || '').slice(0, 3000),
    feishuWebhook: String(payload.feishuWebhook || '').slice(0, 1000),
    tasks
  }
}

async function getDailyPlanner(userId) {
  await ensurePlannerSchema()
  const [rows] = await pool.read('SELECT plan_json, updated_at FROM daily_plans WHERE user_id = ? LIMIT 1', [userId])
  const record = rows[0]
  if (!record) return null

  let payload = null
  try {
    payload = JSON.parse(record.plan_json || '{}')
  } catch (error) {
    payload = {}
  }

  return {
    ...normalizePayload(payload),
    updatedAt: record.updated_at
  }
}

async function saveDailyPlanner(userId, payload = {}) {
  await ensurePlannerSchema()
  const normalized = normalizePayload(payload)

  await pool.write(
    `
      INSERT INTO daily_plans (user_id, plan_json, updated_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        plan_json = VALUES(plan_json),
        updated_at = NOW()
    `,
    [userId, JSON.stringify(normalized)]
  )

  return getDailyPlanner(userId)
}

module.exports = {
  getDailyPlanner,
  saveDailyPlanner
}
