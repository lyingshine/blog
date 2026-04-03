const pool = require('../db/pool')

const upsertPushSubscription = async ({
  userId,
  endpoint,
  p256dh,
  auth,
  userAgent = ''
}) => {
  await pool.write(
    `
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      p256dh = VALUES(p256dh),
      auth = VALUES(auth),
      user_agent = VALUES(user_agent),
      updated_at = NOW()
    `,
    [userId, endpoint, p256dh, auth, userAgent]
  )
}

const removePushSubscription = async ({ userId, endpoint }) => {
  const [result] = await pool.write(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [userId, endpoint]
  )
  return result.affectedRows > 0
}

const removePushSubscriptionByEndpoint = async (endpoint) => {
  await pool.write('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint])
}

const getPushSubscriptionsByUserId = async (userId) => {
  const [rows] = await pool.read(
    'SELECT id, user_id, endpoint, p256dh, auth, user_agent FROM push_subscriptions WHERE user_id = ?',
    [userId]
  )
  return rows
}

module.exports = {
  upsertPushSubscription,
  removePushSubscription,
  removePushSubscriptionByEndpoint,
  getPushSubscriptionsByUserId
}
