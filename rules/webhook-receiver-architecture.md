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

- Mount one `POST /webhooks/<provider>` route per vendor; each delegates to its vendor handler.
- Vendor handlers are the ONLY place vendor-specific signature logic lives.

See `reference/webhook-receiver-architecture.md` for the full router and per-vendor handler implementations.

---

## Generalized Handler Core

- Read raw body as `Uint8Array` before any parsing; compute SHA-256 hex (`payload_hash`) from it.
- Perform idempotency SELECT on `(provider, event_id)` before any INSERT; return `200 {duplicate:true}` on hit.
- INSERT a `pending` row immediately after sig check; update to `processed` or `dead_lettered` inside `ctx.waitUntil()`.
- On handler failure: increment `retry_count`; after 3 failures write metadata + raw body to R2 DLQ at key `dlq/<provider>/<eventId>/<ts>.json`.

See `reference/webhook-receiver-architecture.md` for the full `_core.ts` implementation.

---

## Per-Vendor Signature Verification

All handlers: read raw body as `Uint8Array` first, verify sig, reject 401 on mismatch, then call `processWebhook()`.

### Stripe

- Header: `Stripe-Signature` — parse `t=<unix>` and `v1=<hex>`.
- Algo: HMAC-SHA256 over `"<t>.<rawBody>"`, hex-encoded; compare with timing-safe equality.
- Replay window: **5 minutes** — reject if `|now - t*1000| > 300_000`.

### Square

- Header: `X-Square-Hmacsha256-Signature`.
- Algo: HMAC-SHA256 over `notificationUrl + rawBody`, base64-encoded.
- Replay window: **6 hours** — check `event.created_at` ISO8601 timestamp.

### GitHub

- Header: `X-Hub-Signature-256` — format `sha256=<hex>`; reject if prefix missing.
- Algo: HMAC-SHA256 over raw body, hex-encoded.
- Idempotency key: `X-Github-Delivery` header value.

### Resend (Svix)

- Headers: `svix-id`, `svix-timestamp`, `svix-signature` — reject 400 if any missing.
- Algo: HMAC-SHA256 over `"<svix-id>.<svix-timestamp>.<rawBody>"`; secret is base64 after stripping `whsec_` prefix; encoded as `v1,<base64>`.
- Replay window: **5 minutes**.

### Twilio

- Header: `X-Twilio-Signature` (HMAC-SHA1, base64).
- Sign input: full request URL + sorted POST form params concatenated (no separator between key and value); body is URL-encoded form, NOT JSON.
- No time window — idempotency via `MessageSid`/`CallSid`.

See `reference/webhook-receiver-architecture.md` for full per-vendor handler code.

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

D1 binding: `DB` (prod database). R2 binding: `WEBHOOK_DLQ` (bucket `webhook-dlq`).

See `reference/webhook-receiver-architecture.md` for the full `wrangler.jsonc` additions snippet.

## Rate Limiter

- Wire a Durable Object rate limiter in front of all `/webhooks/*` routes.
- Reject at **100 req/min/IP** with 429 BEFORE signature verification.

See `reference/webhook-receiver-architecture.md` for the middleware snippet.

## Observability

- Log every `webhook_events` INSERT + status transition to PostHog (`$webhook_received` / `$webhook_processed` / `$webhook_dead_lettered`)
- Alert on `dead_lettered` count > 5 within 15 min (Workers Analytics Engine → PostHog alert)
- Never log raw payload — only `{ provider, event_id, event_type, payload_hash, status }`
