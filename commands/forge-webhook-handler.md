---
description: Scaffold a complete webhook handler (Hono route + sig verification + D1 idempotency + R2 dead-letter) for a named vendor
argument-hint: <vendor>  # stripe | square | github | resend | twilio
allowed-tools: Bash, Read, Write, Edit, Glob
---

Forge a production-ready webhook handler for the named vendor. Reads `[[webhook-receiver-architecture]]` for vendor configs and outputs all files. Run `/forge-webhook-handler stripe` and get everything in one shot.

## Supported vendors

| Vendor | Sig header | Algo | Replay window |
|---|---|---|---|
| `stripe` | `Stripe-Signature` | HMAC-SHA256 | 5 min |
| `square` | `X-Square-Hmacsha256-Signature` | HMAC-SHA256 base64 | 6 hr |
| `github` | `X-Hub-Signature-256` | HMAC-SHA256 hex | delivery ID |
| `resend` | `svix-id` / `svix-timestamp` / `svix-signature` | HMAC-SHA256 Svix | 5 min |
| `twilio` | `X-Twilio-Signature` | HMAC-SHA1 base64 | idempotency only |

## What gets generated

```
src/worker/routes/webhooks/
  _core.ts                        ← shared processWebhook + DLQ + sha256Hex (create if missing)
  <vendor>.ts                     ← signature verification + event router for this vendor
  index.ts                        ← Hono mount (patched to include new vendor if existing)

migrations/
  XXXX_webhook_events.sql         ← D1 table + indexes (create once, skip if exists)

tests/
  webhooks/<vendor>.test.ts       ← Vitest unit tests with valid + invalid sig cases
```

## Execution

```bash
VENDOR="${ARGUMENTS%% *}"
echo "Forging webhook handler for: $VENDOR"
```

### Step 1 — detect project root

```bash
# Find wrangler.jsonc or wrangler.toml to anchor the project
find . -maxdepth 3 -name "wrangler.jsonc" -o -name "wrangler.toml" | head -1
```

### Step 2 — check existing files

```bash
ls src/worker/routes/webhooks/ 2>/dev/null || echo "no webhooks dir yet"
ls migrations/ | grep webhook 2>/dev/null || echo "no webhook migration yet"
```

### Step 3 — write `_core.ts` if missing

Only create if `src/worker/routes/webhooks/_core.ts` does not exist. Full content from `[[webhook-receiver-architecture]]` § Generalized Handler Core. Skip if present.

### Step 4 — write vendor handler

Write `src/worker/routes/webhooks/<vendor>.ts` with:

- `import { processWebhook, sha256Hex } from './_core'`
- Full signature verification per vendor table above (exact algorithm + replay window)
- `routeXxxEvent()` switch with `TODO` stubs for the most common event types per vendor:

**stripe**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `checkout.session.completed`

**square**: `payment.completed`, `payment.updated`, `refund.created`, `order.updated`, `subscription.created`, `subscription.updated`

**github**: `push`, `pull_request`, `workflow_run`, `release`, `issues`, `check_run`

**resend**: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.opened`, `email.clicked`

**twilio**: `sms.status` (Delivered/Failed/Undelivered), `call.status` (completed/failed/busy/no-answer)

### Step 5 — patch or create `index.ts`

If `index.ts` exists, add the missing `.post('/<vendor>', ...)` line. If not, create the full mount file.

### Step 6 — write migration

Check highest existing migration number, write `migrations/<N+1>_webhook_events.sql`. Use `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` — safe to run multiple times:

```sql
-- Full schema from [[webhook-receiver-architecture]] § D1 Schema
CREATE TABLE IF NOT EXISTS webhook_events ( ... );
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON webhook_events (...);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events (...);
```

### Step 7 — write Vitest test

```typescript
// tests/webhooks/<vendor>.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { handle<Vendor>Webhook } from '../../src/worker/routes/webhooks/<vendor>'

describe('<vendor> webhook handler', () => {
  it('rejects missing signature header', async () => { ... })
  it('rejects bad signature', async () => { ... })
  it('rejects replayed event outside window', async () => { ... })
  it('accepts valid signature and returns 200', async () => { ... })
  it('returns 200 on duplicate event_id (idempotency)', async () => { ... })
  it('dead-letters unknown event type gracefully', async () => { ... })
})
```

Use `crypto.subtle` to generate valid HMAC sigs in test setup — never hardcode sigs.

### Step 8 — print secrets needed

```bash
echo ""
echo "=== Secrets to provision (wrangler secret put) ==="
```

Print the exact `wrangler secret put <NAME>` commands for the chosen vendor from `[[webhook-receiver-architecture]]` § Wrangler bindings required.

### Step 9 — print R2 + D1 binding snippets

Print the `wrangler.jsonc` additions needed for `DB` and `WEBHOOK_DLQ` if not already present in the project's `wrangler.jsonc`.

### Step 10 — run migration

```bash
wrangler d1 execute prod --file=migrations/<N+1>_webhook_events.sql --local 2>&1 || true
```

### Step 11 — run tests

```bash
npx vitest run tests/webhooks/<vendor>.test.ts 2>&1
```

### Step 12 — report

Report what was created, what was skipped (already existed), and any test failures with exact line references. If tests fail, fix inline and re-run before declaring done.

## Anti-patterns

- Do NOT add `await` before `ctx.waitUntil()` — it is fire-and-forget by design
- Do NOT log raw payload body — log `payload_hash` only
- Do NOT return 500 on unknown event type — dead-letter it and return 200
- Do NOT use `app.use('*', bodyCache)` — read body ONCE via `c.req.arrayBuffer()`; passing raw bytes downstream
- Do NOT skip idempotency check for "simple" webhooks — Square sends duplicates on retries
