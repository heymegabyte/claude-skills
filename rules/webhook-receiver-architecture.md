---
name: "webhook-receiver-architecture"
priority: 2
pack: "backend"
triggers:
  - "webhook"
  - "webhook handler"
  - "signature verification"
  - "idempotency"
  - "stripe webhook"
  - "square webhook"
  - "github webhook"
  - "resend webhook"
  - "twilio webhook"
paths:
  - "concern:hono-stack"
  - "concern:cloudflare-workers"
  - "src/worker/routes/webhooks/**"
  - "workers/*/src/routes/webhooks/**"
---

# Webhook Receiver Architecture

Universal pattern for receiving, verifying, deduplicating, and auditing webhooks on CF Workers + Hono + D1.
Cross-links: `[[payments-routing]]` `[[secret-provisioning]]` `[[error-recovery]]` `[[hono-api]]`

## Core invariants (never violate)

- **Verify signature BEFORE any DB write** — reject fast (401) on bad sig
- **Idempotency check BEFORE processing** — UNIQUE on `(provider, event_id)` → 200 on dup
- **Respond 200/204 fast** — push async work to `ctx.waitUntil()`, never block the response
- **Dead-letter on unhandled** — unknown `event_type` → R2 DLQ, not a 500
- **Never log raw payload** — log `payload_hash` (SHA-256 hex) only; full payload to R2

---

## D1 Schema

```sql
-- Migration: 0042_webhook_events.sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  provider    TEXT NOT NULL,           -- 'stripe' | 'square' | 'github' | 'resend' | 'twilio'
  event_id    TEXT NOT NULL,           -- vendor event ID (idempotency key)
  event_type  TEXT NOT NULL,           -- e.g. 'payment_intent.succeeded'
  signature   TEXT NOT NULL,           -- raw sig header value (for audit)
  payload_hash TEXT NOT NULL,          -- SHA-256 hex of raw body
  received_at INTEGER NOT NULL,        -- unix epoch ms
  processed_at INTEGER,               -- null until handler finishes
  retry_count INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | processed | dead_lettered | ignored
  error       TEXT,                   -- last error message if failed
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status
  ON webhook_events (provider, status, received_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON webhook_events (received_at);
```

---

## Hono Route Shape

```typescript
// src/worker/routes/webhooks/index.ts
import { Hono } from 'hono'
import { handleStripeWebhook } from './stripe'
import { handleSquareWebhook } from './square'
import { handleGitHubWebhook } from './github'
import { handleResendWebhook } from './resend'
import { handleTwilioWebhook } from './twilio'

export const webhookRoutes = new Hono<{ Bindings: Env }>()
  .post('/stripe',  (c) => handleStripeWebhook(c))
  .post('/square',  (c) => handleSquareWebhook(c))
  .post('/github',  (c) => handleGitHubWebhook(c))
  .post('/resend',  (c) => handleResendWebhook(c))
  .post('/twilio',  (c) => handleTwilioWebhook(c))
```

---

## Generalized Handler Core

All vendor handlers share this shape — signature verification is the ONLY vendor-specific part:

```typescript
// src/worker/routes/webhooks/_core.ts
import type { Context } from 'hono'

export type WebhookProvider = 'stripe' | 'square' | 'github' | 'resend' | 'twilio'

export interface WebhookHandlerContext {
  provider: WebhookProvider
  eventId: string
  eventType: string
  rawBody: Uint8Array
  payloadHash: string
  signature: string
  receivedAt: number
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function processWebhook(
  c: Context<{ Bindings: Env }>,
  ctx: WebhookHandlerContext,
  handler: (payload: unknown) => Promise<void>
): Promise<Response> {
  const db = c.env.DB

  // 1. Idempotency read — return 200 if already seen
  const existing = await db
    .prepare('SELECT status FROM webhook_events WHERE provider = ? AND event_id = ?')
    .bind(ctx.provider, ctx.eventId)
    .first<{ status: string }>()

  if (existing) {
    return c.json({ ok: true, duplicate: true, status: existing.status }, 200)
  }

  // 2. Insert pending row (UNIQUE constraint prevents races)
  await db
    .prepare(`
      INSERT INTO webhook_events
        (provider, event_id, event_type, signature, payload_hash, received_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(ctx.provider, ctx.eventId, ctx.eventType, ctx.signature, ctx.payloadHash, ctx.receivedAt)
    .run()

  // 3. Respond fast; push work async
  c.executionCtx.waitUntil(
    (async () => {
      try {
        const payload = JSON.parse(new TextDecoder().decode(ctx.rawBody))
        await handler(payload)
        await db
          .prepare('UPDATE webhook_events SET status = ?, processed_at = ? WHERE provider = ? AND event_id = ?')
          .bind('processed', Date.now(), ctx.provider, ctx.eventId)
          .run()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        const isRetryable = await incrementRetry(db, ctx.provider, ctx.eventId, msg)
        if (!isRetryable) {
          await deadLetter(c.env.WEBHOOK_DLQ, ctx, ctx.rawBody, msg)
        }
      }
    })()
  )

  return c.json({ ok: true }, 200)
}

async function incrementRetry(db: D1Database, provider: string, eventId: string, error: string) {
  const row = await db
    .prepare('SELECT retry_count FROM webhook_events WHERE provider = ? AND event_id = ?')
    .bind(provider, eventId)
    .first<{ retry_count: number }>()

  const count = (row?.retry_count ?? 0) + 1
  const isDead = count >= 3

  await db
    .prepare('UPDATE webhook_events SET retry_count = ?, status = ?, error = ? WHERE provider = ? AND event_id = ?')
    .bind(count, isDead ? 'dead_lettered' : 'pending', error, provider, eventId)
    .run()

  return !isDead  // true = still retryable
}

async function deadLetter(
  bucket: R2Bucket,
  ctx: WebhookHandlerContext,
  rawBody: Uint8Array,
  error: string
) {
  const key = `dlq/${ctx.provider}/${ctx.eventId}/${ctx.receivedAt}.json`
  const body = JSON.stringify({
    provider: ctx.provider,
    eventId: ctx.eventId,
    eventType: ctx.eventType,
    payloadHash: ctx.payloadHash,
    error,
    deadLetteredAt: Date.now(),
  })
  // Store metadata + raw payload separately to avoid 128MB R2 limit issues
  await Promise.all([
    bucket.put(key, body, { httpMetadata: { contentType: 'application/json' } }),
    bucket.put(`${key}.raw`, rawBody),
  ])
}
```

---

## Per-Vendor Signature Verification

### Stripe — HMAC-SHA256 + 5-min replay window

```typescript
// src/worker/routes/webhooks/stripe.ts
// Docs: https://stripe.com/docs/webhooks/signatures
import type { Context } from 'hono'
import { processWebhook, sha256Hex } from './_core'

const REPLAY_WINDOW_MS = 5 * 60 * 1000  // 5 minutes

export async function handleStripeWebhook(c: Context<{ Bindings: Env }>) {
  const rawBody = new Uint8Array(await c.req.arrayBuffer())
  const sigHeader = c.req.header('stripe-signature') ?? ''
  const secret = c.env.STRIPE_WEBHOOK_SECRET  // see [[secret-provisioning]]

  // Parse t= and v1= from sig header
  const params = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
  const timestamp = parseInt(params['t'] ?? '0', 10)
  const v1 = params['v1'] ?? ''

  if (!timestamp || !v1) return c.json({ error: 'missing_sig' }, 400)

  // Replay-attack window
  if (Math.abs(Date.now() - timestamp * 1000) > REPLAY_WINDOW_MS) {
    return c.json({ error: 'replay_expired' }, 400)
  }

  // Compute expected sig: HMAC-SHA256(timestamp.payload)
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${new TextDecoder().decode(rawBody)}`))
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (!timingSafeEqual(expected, v1)) return c.json({ error: 'bad_sig' }, 401)

  const payload = JSON.parse(new TextDecoder().decode(rawBody))

  return processWebhook(c, {
    provider: 'stripe',
    eventId: payload.id,
    eventType: payload.type,
    rawBody,
    payloadHash: await sha256Hex(rawBody),
    signature: sigHeader,
    receivedAt: Date.now(),
  }, async (data) => {
    await routeStripeEvent(c.env, data as { type: string; data: unknown })
  })
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function routeStripeEvent(env: Env, event: { type: string; data: unknown }) {
  switch (event.type) {
    case 'payment_intent.succeeded':   return handlePaymentSucceeded(env, event.data)
    case 'customer.subscription.updated': return handleSubUpdated(env, event.data)
    // ... add per your Stripe product
    default: return  // unknown events are logged as 'ignored' by processWebhook
  }
}
```

### Square — HMAC-SHA256 + 6-hr replay window

```typescript
// src/worker/routes/webhooks/square.ts
// Docs: https://developer.squareup.com/docs/webhooks/step1-signature
import type { Context } from 'hono'
import { processWebhook, sha256Hex } from './_core'

const REPLAY_WINDOW_MS = 6 * 60 * 60 * 1000  // 6 hours

export async function handleSquareWebhook(c: Context<{ Bindings: Env }>) {
  const rawBody = new Uint8Array(await c.req.arrayBuffer())
  const sigHeader = c.req.header('x-square-hmacsha256-signature') ?? ''
  const notificationUrl = c.env.SQUARE_WEBHOOK_NOTIFICATION_URL  // full URL of this endpoint
  const secret = c.env.SQUARE_WEBHOOK_SIGNATURE_KEY

  // Square sign input: notification-url + raw-body
  const signInput = new TextEncoder().encode(notificationUrl + new TextDecoder().decode(rawBody))
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, signInput)
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)))

  if (expected !== sigHeader) return c.json({ error: 'bad_sig' }, 401)

  const payload = JSON.parse(new TextDecoder().decode(rawBody))

  // Square event timestamp is ISO8601 in event_time
  const eventTime = new Date(payload.created_at ?? Date.now()).getTime()
  if (Math.abs(Date.now() - eventTime) > REPLAY_WINDOW_MS) {
    return c.json({ error: 'replay_expired' }, 400)
  }

  return processWebhook(c, {
    provider: 'square',
    eventId: payload.event_id,
    eventType: payload.type,
    rawBody,
    payloadHash: await sha256Hex(rawBody),
    signature: sigHeader,
    receivedAt: Date.now(),
  }, async (data) => {
    await routeSquareEvent(c.env, data as { type: string; data: unknown })
  })
}
```

### GitHub — HMAC-SHA256 (`X-Hub-Signature-256`)

```typescript
// src/worker/routes/webhooks/github.ts
// Docs: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
import type { Context } from 'hono'
import { processWebhook, sha256Hex } from './_core'

export async function handleGitHubWebhook(c: Context<{ Bindings: Env }>) {
  const rawBody = new Uint8Array(await c.req.arrayBuffer())
  const sigHeader = c.req.header('x-hub-signature-256') ?? ''  // format: sha256=<hex>
  const deliveryId = c.req.header('x-github-delivery') ?? crypto.randomUUID()
  const eventType = c.req.header('x-github-event') ?? 'unknown'
  const secret = c.env.GITHUB_WEBHOOK_SECRET

  if (!sigHeader.startsWith('sha256=')) return c.json({ error: 'bad_sig_format' }, 400)
  const received = sigHeader.slice(7)

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, rawBody)
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expected !== received) return c.json({ error: 'bad_sig' }, 401)

  return processWebhook(c, {
    provider: 'github',
    eventId: deliveryId,
    eventType,
    rawBody,
    payloadHash: await sha256Hex(rawBody),
    signature: sigHeader,
    receivedAt: Date.now(),
  }, async (data) => {
    // e.g. push, pull_request, workflow_run
    await routeGitHubEvent(c.env, eventType, data)
  })
}
```

### Resend — Svix (`svix-id` / `svix-timestamp` / `svix-signature`)

```typescript
// src/worker/routes/webhooks/resend.ts
// Docs: https://resend.com/docs/dashboard/webhooks/introduction (uses Svix)
// Svix format: v1,<base64-sig> — may have multiple comma-separated after v1,
import type { Context } from 'hono'
import { processWebhook, sha256Hex } from './_core'

const REPLAY_WINDOW_MS = 5 * 60 * 1000

export async function handleResendWebhook(c: Context<{ Bindings: Env }>) {
  const rawBody = new Uint8Array(await c.req.arrayBuffer())
  const msgId = c.req.header('svix-id') ?? ''
  const msgTimestamp = c.req.header('svix-timestamp') ?? ''
  const msgSig = c.req.header('svix-signature') ?? ''
  const secret = c.env.RESEND_WEBHOOK_SECRET  // starts with "whsec_" — base64 decode the suffix

  if (!msgId || !msgTimestamp || !msgSig) return c.json({ error: 'missing_svix_headers' }, 400)

  const ts = parseInt(msgTimestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > REPLAY_WINDOW_MS / 1000) {
    return c.json({ error: 'replay_expired' }, 400)
  }

  // Svix sign input: "<msgId>.<msgTimestamp>.<rawBody>"
  const signInput = `${msgId}.${msgTimestamp}.${new TextDecoder().decode(rawBody)}`
  const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signInput))
  const expected = `v1,${btoa(String.fromCharCode(...new Uint8Array(signed)))}`

  const receivedSigs = msgSig.split(' ')
  const valid = receivedSigs.some(sig => sig === expected)
  if (!valid) return c.json({ error: 'bad_sig' }, 401)

  const payload = JSON.parse(new TextDecoder().decode(rawBody))

  return processWebhook(c, {
    provider: 'resend',
    eventId: msgId,
    eventType: payload.type ?? 'unknown',
    rawBody,
    payloadHash: await sha256Hex(rawBody),
    signature: msgSig,
    receivedAt: Date.now(),
  }, async (data) => {
    await routeResendEvent(c.env, data as { type: string })
  })
}
```

### Twilio — HMAC-SHA1 (`X-Twilio-Signature` over URL + POST params)

```typescript
// src/worker/routes/webhooks/twilio.ts
// Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
// Twilio signs: full URL + sorted POST form params (NOT JSON body)
import type { Context } from 'hono'
import { processWebhook, sha256Hex } from './_core'

export async function handleTwilioWebhook(c: Context<{ Bindings: Env }>) {
  const rawBody = new Uint8Array(await c.req.arrayBuffer())
  const sigHeader = c.req.header('x-twilio-signature') ?? ''
  const authToken = c.env.TWILIO_AUTH_TOKEN
  const requestUrl = c.env.TWILIO_WEBHOOK_URL  // must match exactly what Twilio sends to

  // Parse URL-encoded form body
  const formData = new URLSearchParams(new TextDecoder().decode(rawBody))
  const params: Record<string, string> = {}
  formData.forEach((v, k) => { params[k] = v })

  // Sign: URL + sorted param keys + their values (concatenated, no separator)
  const paramStr = Object.keys(params).sort()
    .reduce((acc, k) => acc + k + (params[k] ?? ''), '')
  const signInput = requestUrl + paramStr

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signInput))
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)))

  if (expected !== sigHeader) return c.json({ error: 'bad_sig' }, 401)

  const eventId = params['MessageSid'] ?? params['CallSid'] ?? crypto.randomUUID()
  const eventType = params['SmsStatus'] ? 'sms.status' : params['CallStatus'] ? 'call.status' : 'unknown'

  return processWebhook(c, {
    provider: 'twilio',
    eventId,
    eventType,
    rawBody,
    payloadHash: await sha256Hex(rawBody),
    signature: sigHeader,
    receivedAt: Date.now(),
  }, async (_data) => {
    // Route by eventType
  })
}
```

---

## Retry + Backoff Strategy

- Max retries: **3** (controlled by `retry_count` in `webhook_events`)
- After 3 failures: `status = 'dead_lettered'`, payload written to R2 DLQ
- Re-processing DLQ: `wrangler r2 object get WEBHOOK_DLQ dlq/<provider>/<eventId>/<ts>.json` → manual replay via `POST /webhooks/<provider>` with original body + fresh sig (or admin bypass route)
- Cron-based retry sweep: `0 * * * *` → query `status = 'pending' AND retry_count < 3 AND received_at < (now - 60000)` → requeue via `ctx.waitUntil()`

## Replay-Attack Prevention Matrix

| Vendor | Header | Window | Algo |
|---|---|---|---|
| Stripe | `Stripe-Signature` `t=` | 5 min | HMAC-SHA256 |
| Square | `X-Square-Hmacsha256-Signature` + event `created_at` | 6 hr | HMAC-SHA256 base64 |
| GitHub | `X-Hub-Signature-256` `sha256=` prefix | delivery ID uniqueness | HMAC-SHA256 hex |
| Resend (Svix) | `svix-timestamp` | 5 min | HMAC-SHA256 base64 |
| Twilio | `X-Twilio-Signature` | none (idempotency only) | HMAC-SHA1 base64 |

## Wrangler bindings required

```jsonc
// wrangler.jsonc additions
{
  "d1_databases": [{ "binding": "DB", "database_name": "prod", "database_id": "..." }],
  "r2_buckets": [{ "binding": "WEBHOOK_DLQ", "bucket_name": "webhook-dlq" }]
}
```

```bash
# Secrets — per [[secret-provisioning]]
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put SQUARE_WEBHOOK_SIGNATURE_KEY
wrangler secret put SQUARE_WEBHOOK_NOTIFICATION_URL
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put RESEND_WEBHOOK_SECRET
wrangler secret put TWILIO_AUTH_TOKEN
wrangler secret put TWILIO_WEBHOOK_URL
```

## Rate Limiter (cf-do-rate-limiter)

Wire a Durable Object rate limiter in front of all `/webhooks/*` routes to prevent abuse. Reject at 100 req/min/IP with 429 BEFORE signature verification:

```typescript
// In webhookRoutes middleware
webhookRoutes.use('*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown'
  const limiter = c.env.RATE_LIMITER.get(c.env.RATE_LIMITER.idFromName(`webhook:${ip}`))
  const ok = await limiter.fetch(new Request('https://internal/check')).then(r => r.ok)
  if (!ok) return c.json({ error: 'rate_limited' }, 429)
  await next()
})
```

## Observability

- Log every `webhook_events` INSERT + status transition to PostHog (`$webhook_received` / `$webhook_processed` / `$webhook_dead_lettered`)
- Alert on `dead_lettered` count > 5 within 15 min (Workers Analytics Engine → PostHog alert)
- Never log raw payload — only `{ provider, event_id, event_type, payload_hash, status }`
