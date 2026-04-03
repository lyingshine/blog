const FEISHU_BOT_WEBHOOK = process.env.FEISHU_BOT_WEBHOOK || ''

function isValidFeishuWebhook(url) {
  return typeof url === 'string' && /^https:\/\/open\.feishu\.cn\/open-apis\/bot\/v2\/hook\/[\w-]+$/.test(url.trim())
}

function resolveWebhook(overrideWebhook) {
  if (isValidFeishuWebhook(overrideWebhook)) {
    return overrideWebhook.trim()
  }
  if (isValidFeishuWebhook(FEISHU_BOT_WEBHOOK)) {
    return FEISHU_BOT_WEBHOOK.trim()
  }
  return ''
}

function isWebhookConfigured(overrideWebhook) {
  return Boolean(resolveWebhook(overrideWebhook))
}

async function sendTextMessage(text, overrideWebhook) {
  const webhook = resolveWebhook(overrideWebhook)
  if (!webhook) {
    throw new Error('Feishu webhook not configured')
  }

  const payload = {
    msg_type: 'text',
    content: {
      text
    }
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.code !== 0) {
    const message = data.msg || `Feishu webhook failed with status ${response.status}`
    throw new Error(message)
  }

  return data
}

module.exports = {
  isValidFeishuWebhook,
  isWebhookConfigured,
  sendTextMessage
}
