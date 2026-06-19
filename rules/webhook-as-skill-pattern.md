---
name: "webhook-as-skill-pattern"
priority: 2
pack: "backend"
triggers:
  - "webhook skill"
  - "forge webhook"
  - "webhook integration"
  - "webhook receiver"
paths:
  - "src/worker/routes/webhook-*.ts"
  - "src/worker/webhooks/**"
  - "skills/*-webhooks/**"
  - "e2e/webhooks/**"
---

# Webhook-as-Skill Pattern

Every webhook-emitting service Brian's stack consumes gets a **paired skill** at `skills/<provider>-webhooks/`.

Cross-links: `[[webhook-receiver-architecture]]` `[[forge-from-openapi]]` `[[hono-api]]` `[[secret-provisioning]]` `[[payments-routing]]`

## Module structure (invariant across providers)

```
skills/<provider>-webhooks/
  SKILL.md
src/worker/routes/webhook-{provider}.ts   ← verify → idempotency → dispatch
src/worker/webhooks/{provider}/
  schemas.ts       ← Zod discriminated union, one type per event_type
  handlers.ts      ← async dispatch router + one stub per event_type
  index.ts         ← re-exports + event union type
e2e/webhooks/{provider}/
  valid-signature.spec.ts
  invalid-signature.spec.ts
  replay-attack.spec.ts
  fixtures/        ← one realistic JSON payload per event type
.env.template      ← <PROVIDER>_WEBHOOK_SECRET= entry
```

Only the signature algorithm and event type set change per provider.

## Required processing order (non-negotiable)

**Verify signature → idempotency check → audit insert → async dispatch → 200**

Deviations:

- Sig check after DB write → replay attacks write garbage rows.
- Missing idempotency → duplicate provisioning, double-charges.
- Sync dispatch → CPU/wall-time kills the Worker before handler finishes.
- Missing DLQ → unhandled event_types lose events silently.

`[[webhook-receiver-architecture]]` documents invariants, D1 schema, and Hono route template.

## Provider inventory

- **Stripe** — `skills/stripe-webhooks/` — HMAC-SHA256 + timestamp — `STRIPE_WEBHOOK_SECRET`
- **Square** — `skills/square-webhooks/` — HMAC-SHA256 of URL+body — `SQUARE_WEBHOOK_SIGNATURE_KEY`
- **GitHub** — `skills/github-webhooks/` — HMAC-SHA256 — `GITHUB_WEBHOOK_SECRET`
- **Resend** — `skills/resend-webhooks/` — Svix — `RESEND_WEBHOOK_SECRET`
- **Twilio** — `skills/twilio-webhooks/` — HMAC-SHA256 of URL+params — `TWILIO_AUTH_TOKEN`
- **Clerk** — `skills/clerk-webhooks/` — Svix — `CLERK_WEBHOOK_SECRET`
- **SendGrid** — `skills/sendgrid-webhooks/` — ECDSA P-256 — `SENDGRID_WEBHOOK_PUBLIC_KEY`
- **PostHog** — `skills/posthog-webhooks/` — none (IP allowlist) — —
- **Inngest** — `skills/inngest-webhooks/` — HMAC-SHA256 — `INNGEST_SIGNING_KEY`

New provider → add row here + run `/forge-webhook-skill <provider> <spec>` same turn.

## Hono route wiring (`[[hono-api]]`)

```typescript
// src/worker/app.ts
import { webhookRoutes } from './routes/webhooks/index'
app.route('/webhooks', webhookRoutes)
```

```typescript
export const webhookRoutes = new Hono<{ Bindings: Env }>()
  .route('/stripe', stripeWebhookRoute)
  .route('/square', squareWebhookRoute)
  .route('/github', githubWebhookRoute)
  .route('/resend', resendWebhookRoute)
```

One `.route()` per provider — never a mega-handler with a `provider` query param.

## Secrets (`[[secret-provisioning]]` + `[[secret-auto-provisioning]]`)

1. `wrangler.jsonc` → `[vars]` block (value in `.dev.vars`, never committed).
2. `wrangler secret put <NAME>` for production.
3. `.env.template` for onboarding documentation.

Forge command appends `<PROVIDER>_WEBHOOK_SECRET=` to `.env.template` automatically.

## Verification gate (`[[verification-loop]]`)

1. `wrangler deploy`
2. `npx playwright test e2e/webhooks/<provider>/valid-signature.spec.ts --config=playwright.prod.config.ts`
3. Assert 200 on valid sig, 401 on bad sig, 200+idempotent on re-delivery.

Integration is NOT DONE until all three pass against the live URL.

## Zod schemas are the source of truth

- Use `schemas.ts` Zod types, not provider SDK types — Zod gives runtime validation; SDK types do not.
- `z.infer<typeof Schema>` produces the TS type — no duplication.
- When provider ships a TS SDK (Stripe, Clerk), wrap it: `z.object({ type: z.literal('payment_intent.succeeded'), data: z.object({ object: StripePaymentIntentSchema }) })`.

## Idempotency is not optional

- Stripe retries up to **15 times over 3 days**.
- Square retries up to **5 times**.
- GitHub retries up to **3 times** with exponential backoff.
- `UNIQUE (provider, event_id)` on `webhook_events` is the guard — duplicate insert throws → catch → return 200.

## Dead-letter queue discipline

- Unknown `event_type` → dead-letter, never 500. A 500 on unknown types causes Stripe to mark the endpoint degraded and may disable it.
- DLQ convention: `R2 / dlq/<provider>/<recordId>.json` with `{ error, payloadHash, receivedAt }`.
- Never include raw payload in DLQ — log `payload_hash` (SHA-256 hex); store full payload in separate R2 object keyed by hash.

## The forge command

`/forge-webhook-skill <provider> <spec>` (see `commands/forge-webhook-skill.md`) — accepts AsyncAPI YAML, JSON event-type list, or inline JSON array. Emits the complete module tree above.

Trigger it:

- Any time a provider integration is added that emits webhooks.
- Any time a new event type is added to an existing provider integration.
- Any time a hand-rolled webhook handler is found in a project (replace it).

## Drift signals (fix on sight)

- Handler does NOT read raw body before verifying signature → body already consumed; sig check always fails.
- Handler `await`s business logic inside request-response cycle (not in `waitUntil`) → silent Worker CPU kill.
- Webhook endpoint without `e2e/webhooks/<provider>/` spec → build fail.
- `<PROVIDER>_WEBHOOK_SECRET` missing from `.env.template` → secret-provisioning gap.
- Provider in inventory above without `skills/<provider>-webhooks/` folder → forge it this turn.
