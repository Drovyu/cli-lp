const MAX_BODY_BYTES = 16 * 1024
const CATEGORY_LABELS = {
  general: 'General question',
  bug: 'Bug report',
  feature: 'Feature request',
  supporter: 'Supporter',
  privacy: 'Privacy / legal',
  security: 'Security',
  other: 'Other',
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function verifyTurnstile(secret, token, ip) {
  const body = new FormData()
  body.set('secret', secret)
  body.set('response', token)
  if (ip) body.set('remoteip', ip)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  })

  if (!response.ok) return null
  return response.json()
}

export async function onRequestPost({ request, env }) {
  if (!env.DISCORD_CONTACT_WEBHOOK_URL || !env.TURNSTILE_SECRET_KEY) {
    return json({ ok: false, error: 'service_unavailable' }, 503)
  }

  const requestUrl = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin && origin !== requestUrl.origin) {
    return json({ ok: false, error: 'invalid_origin' }, 403)
  }

  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.startsWith('application/json')) {
    return json({ ok: false, error: 'invalid_content_type' }, 415)
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'request_too_large' }, 413)
  }

  let payload
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'request_too_large' }, 413)
    }
    payload = JSON.parse(raw)
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400)
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ ok: false, error: 'invalid_json' }, 400)
  }

  // Silently accept bot submissions that fill the hidden field.
  if (cleanString(payload.website)) {
    return json({ ok: true })
  }

  const category = cleanString(payload.category)
  const email = cleanString(payload.email).toLowerCase()
  const subject = cleanString(payload.subject)
  const message = cleanString(payload.message)
  const locale = payload.locale === 'en' ? 'en' : 'ja'
  const turnstileToken = cleanString(payload.turnstileToken)

  if (!CATEGORY_LABELS[category] || !isValidEmail(email)) {
    return json({ ok: false, error: 'invalid_fields' }, 400)
  }
  if (subject.length < 2 || subject.length > 120 || message.length < 10 || message.length > 3000) {
    return json({ ok: false, error: 'invalid_fields' }, 400)
  }
  if (!turnstileToken) {
    return json({ ok: false, error: 'challenge_required' }, 400)
  }

  const ip = request.headers.get('CF-Connecting-IP') || ''
  let challenge
  try {
    challenge = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, ip)
  } catch {
    return json({ ok: false, error: 'challenge_unavailable' }, 503)
  }
  if (challenge?.success !== true || challenge.action !== 'contact' || challenge.hostname !== requestUrl.hostname) {
    return json({ ok: false, error: 'challenge_failed' }, 403)
  }

  let webhookResponse
  try {
    webhookResponse = await fetch(env.DISCORD_CONTACT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Drovyu Contact',
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: `${CATEGORY_LABELS[category]}: ${subject}`,
            description: message,
            color: 0xa259ff,
            fields: [
              { name: 'Reply to', value: email, inline: true },
              { name: 'Language', value: locale.toUpperCase(), inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'cli.drovyu.com/contact' },
          },
        ],
      }),
    })
  } catch {
    return json({ ok: false, error: 'delivery_failed' }, 502)
  }

  if (!webhookResponse.ok) {
    return json({ ok: false, error: 'delivery_failed' }, 502)
  }

  return json({ ok: true })
}

export function onRequest() {
  return json({ ok: false, error: 'method_not_allowed' }, 405)
}
