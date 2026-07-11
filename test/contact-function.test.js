import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest, onRequestPost } from '../functions/api/contact.js'

const env = {
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  DISCORD_CONTACT_WEBHOOK_URL: 'https://discord.invalid/webhook',
}

function contactRequest(overrides = {}) {
  const payload = {
    category: 'bug',
    email: 'USER@example.com',
    subject: 'Preview issue',
    message: 'The preview does not load correctly.',
    locale: 'en',
    turnstileToken: 'token',
    website: '',
    ...overrides,
  }
  return new Request('https://cli.drovyu.com/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://cli.drovyu.com',
    },
    body: JSON.stringify(payload),
  })
}

test('validates Turnstile and forwards a safe Discord embed', async (t) => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url: String(url), init })
    if (String(url).includes('siteverify')) {
      return Response.json({ success: true, hostname: 'cli.drovyu.com', action: 'contact' })
    }
    return new Response(null, { status: 204 })
  })

  const response = await onRequestPost({ request: contactRequest(), env })
  assert.equal(response.status, 200)
  assert.equal(calls.length, 2)

  const discordBody = JSON.parse(calls[1].init.body)
  assert.deepEqual(discordBody.allowed_mentions, { parse: [] })
  assert.equal(discordBody.embeds[0].fields[0].value, 'user@example.com')
  assert.equal(discordBody.embeds[0].description, 'The preview does not load correctly.')
})

test('rejects invalid JSON values', async () => {
  const request = new Request('https://cli.drovyu.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'null',
  })
  const response = await onRequestPost({ request, env })
  assert.equal(response.status, 400)
})

test('rejects a Turnstile token issued for another action', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    success: true,
    hostname: 'cli.drovyu.com',
    action: 'different-action',
  }))

  const response = await onRequestPost({ request: contactRequest(), env })
  assert.equal(response.status, 403)
})

test('rejects non-POST methods', async () => {
  assert.equal((await onRequest()).status, 405)
})
