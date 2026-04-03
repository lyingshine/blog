const {
  getPushSubscriptionsByUserId,
  removePushSubscriptionByEndpoint
} = require('../data/pushSubscriptions')

let webpush = null
let vapidReady = false

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

function ensureWebPush() {
  if (webpush) return webpush
  try {
    // Lazy require so server can still boot without dependency in non-push environments.
    // eslint-disable-next-line global-require
    webpush = require('web-push')
    return webpush
  } catch (error) {
    console.warn('[Push] web-push dependency missing, push disabled')
    return null
  }
}

function ensureVapidConfig() {
  if (vapidReady) return true
  const wp = ensureWebPush()
  if (!wp) return false
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY, push disabled')
    return false
  }
  wp.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidReady = true
  return true
}

function isEnabled() {
  return ensureVapidConfig()
}

function getPublicKey() {
  return VAPID_PUBLIC_KEY
}

async function sendPushToUser(userId, payload = {}) {
  if (!ensureVapidConfig()) return
  const wp = ensureWebPush()
  if (!wp) return

  const subscriptions = await getPushSubscriptionsByUserId(userId)
  if (!subscriptions.length) return

  const body = JSON.stringify(payload)
  await Promise.all(
    subscriptions.map(async (item) => {
      const sub = {
        endpoint: item.endpoint,
        keys: {
          p256dh: item.p256dh,
          auth: item.auth
        }
      }

      try {
        await wp.sendNotification(sub, body, {
          TTL: 60,
          urgency: 'normal'
        })
      } catch (error) {
        const statusCode = error?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscriptionByEndpoint(item.endpoint)
          return
        }
        console.error('[Push] send failed:', statusCode || '', error?.message || error)
      }
    })
  )
}

module.exports = {
  isEnabled,
  getPublicKey,
  sendPushToUser
}
