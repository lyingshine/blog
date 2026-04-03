const channels = new Map()

function getChannel(userId) {
  const key = String(userId)
  if (!channels.has(key)) {
    channels.set(key, new Set())
  }
  return channels.get(key)
}

function subscribe(userId, res) {
  const channel = getChannel(userId)
  channel.add(res)
}

function unsubscribe(userId, res) {
  const key = String(userId)
  const channel = channels.get(key)
  if (!channel) return
  channel.delete(res)
  if (channel.size === 0) {
    channels.delete(key)
  }
}

function publish(userId, payload = {}) {
  const key = String(userId)
  const channel = channels.get(key)
  if (!channel || channel.size === 0) return

  const message = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`
  for (const client of channel) {
    client.write(message)
  }
}

function publishCount(userId, unreadCount = 0) {
  const key = String(userId)
  const channel = channels.get(key)
  if (!channel || channel.size === 0) return

  const message = `event: unread_count\ndata: ${JSON.stringify({ unreadCount })}\n\n`
  for (const client of channel) {
    client.write(message)
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  publish,
  publishCount
}
