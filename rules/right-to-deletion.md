---
name: "right-to-deletion"
priority: 2
pack: "compliance"
triggers:
  - "gdpr"
  - "ccpa"
  - "lgpd"
  - "deletion request"
  - "right to be forgotten"
  - "data subject request"
  - "rtbf"
paths:
  - "*"
---

# Right to Deletion — GDPR Art. 17 + CCPA + LGPD Cascade

Every project storing PII MUST implement automated deletion via CF Workflows v2. Manual deletion is a compliance liability.

## When this fires

- Any project with a D1 `users` table AND at least one of: Stripe/Square records, R2 uploads, Vectorize embeddings, Resend/PostHog/Sentry user records.
- Before first deployment of any user-account feature.
- GDPR applies to EU residents' data regardless of server location.

## Legal SLA

| Regulation | Deadline | Exception |
|---|---|---|
| GDPR Art. 17 | 30 days (extendable 60 more with notice) | Legal obligation, public interest, archiving |
| CCPA / CPRA | 45 days (extendable 45 more) | Security, fraud detection, legal obligation |
| LGPD (Brazil) Art. 18 | Immediate or at next feasible moment | Legal basis persists |

- **Target: complete cascade within 24 hours of intake.** 30-day SLA is for extreme edge cases only.

## Intake channels (all three REQUIRED)

### 1. Web form (self-serve)

```ts
// src/worker/routes/deletion-request.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const DeletionRequestSchema = z.object({
  email: z.string().email(),
  reason: z.string().max(500).optional(), // optional per CCPA/GDPR
  turnstileToken: z.string().min(1),
})

app.post('/account/delete', zValidator('json', DeletionRequestSchema), async (c) => {
  const { email, reason, turnstileToken } = c.req.valid('json')

  // Verify Turnstile — prevents abuse of the deletion endpoint
  const ts = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY)
  if (!ts.success) return c.json({ error: 'Turnstile failed' }, 422)

  // Verify ownership — require auth OR email confirmation token
  const session = getSession(c) // Clerk session
  if (!session || session.email !== email) {
    // Send confirmation email with a signed token instead
    const token = await createDeletionToken(email, c.env)
    await sendDeletionConfirmationEmail(email, token, c.env)
    return c.json({ status: 'confirmation_sent' })
  }

  // Immediately create the Workflow instance — durable from this moment
  const id = crypto.randomUUID()
  await c.env.DELETION_WORKFLOW.create({ id, params: { email, reason, requestedAt: new Date().toISOString() } })

  // Log intake to audit table (survives the deletion — see § Audit retention)
  await c.env.DB.prepare(
    `INSERT INTO deletion_audit (id, email_hash, requested_at, channel, status)
     VALUES (?, ?, ?, 'web', 'pending')`
  ).bind(id, await hashEmail(email), new Date().toISOString()).run()

  return c.json({ status: 'queued', requestId: id })
})
```

### 2. Email intake (DSR@yourdomain.com)

- Wire Resend inbound webhook (or Email Workers) to `POST /internal/deletion-email`.
- Parse subject for "delete my account" / "right to erasure" / "RTBF"; auto-queue the Workflow.
- Reply with confirmation email within **5 minutes**.
- Parse body with Workers AI (`@cf/meta/llama-3-8b-instruct`) to extract requester email and intent.

### 3. Admin dashboard

- `/admin/deletion-requests` — lists `deletion_audit` rows, shows status (`pending|running|complete|failed`), allows manual trigger.
- Use `[[feature-flags]]` with key `deletion_dashboard`, `stage='beta'` at launch.

## Cascade entities (ordered by dependency)

```
1. Clerk session invalidation → revoke all sessions for email
2. KV cache purge           → namespace:user:{id}:*
3. D1 application rows      → see waterfall below
4. Vectorize embeddings     → by external_id = user.id
5. R2 uploaded files        → by prefix users/{id}/
6. Stripe customer.delete   → if customer_id exists
7. Square customer archive  → if square_customer_id exists
8. Resend audience remove   → by email from all audiences
9. PostHog person delete    → by distinct_id
10. Sentry user delete      → by username/email
11. Audit log UPDATE        → mark complete, preserve required fields only
```

## CF Workflow — deletion cascade

```ts
// src/worker/workflows/deletion-cascade.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'
import { z } from 'zod'

const DeletionParamsSchema = z.object({
  email: z.string().email(),
  reason: z.string().optional(),
  requestedAt: z.string(),
})

export class DeletionCascade extends WorkflowEntrypoint<Env, z.infer<typeof DeletionParamsSchema>> {
  async run(event: WorkflowEvent<z.infer<typeof DeletionParamsSchema>>, step: WorkflowStep) {
    const { email, requestedAt } = DeletionParamsSchema.parse(event.payload)
    const emailHash = await step.do('hash-email', async () => hashEmail(email))

    // 1. Resolve user ID from D1
    const userId = await step.do('resolve-user', async () => {
      const row = await this.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
      return row?.id ?? null
    })

    if (!userId) {
      await step.do('mark-not-found', async () => {
        await this.env.DB.prepare(
          `UPDATE deletion_audit SET status='not_found', completed_at=? WHERE email_hash=? AND status='pending'`
        ).bind(new Date().toISOString(), emailHash).run()
      })
      return
    }

    // 2. Revoke Clerk sessions
    await step.do('revoke-clerk-sessions', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      await fetch(`https://api.clerk.com/v1/users/${userId}/sessions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.env.CLERK_SECRET_KEY}` },
      })
    })

    // 3. Purge KV cache
    await step.do('purge-kv-cache', async () => {
      // CF KV has no prefix-delete; list then delete in batch
      const keys = await this.env.USER_CACHE.list({ prefix: `user:${userId}:` })
      await Promise.all(keys.keys.map(k => this.env.USER_CACHE.delete(k.name)))
    })

    // 4. D1 cascade — ordered by FK constraint
    await step.do('delete-d1-rows', { retries: { limit: 3, delay: '10 seconds' } }, async () => {
      await this.env.DB.batch([
        this.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
        this.env.DB.prepare('DELETE FROM oauth_accounts WHERE user_id = ?').bind(userId),
        this.env.DB.prepare('DELETE FROM notifications WHERE user_id = ?').bind(userId),
        this.env.DB.prepare('DELETE FROM feature_flag_overrides WHERE user_id = ?').bind(userId),
        this.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
        // Add every FK table that references users.id here
      ])
    })

    // 5. Vectorize embeddings
    const vectorizeResult = await step.do('delete-vectorize', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      const deleteResult = await this.env.VECTORIZE.deleteByIds([`user-${userId}`])
      return deleteResult
    })

    // 6. R2 uploaded files — list + delete all objects under prefix
    await step.do('delete-r2-files', { retries: { limit: 3, delay: '10 seconds' } }, async () => {
      let truncated = true
      let cursor: string | undefined
      while (truncated) {
        const listed = await this.env.R2_BUCKET.list({ prefix: `users/${userId}/`, cursor })
        await Promise.all(listed.objects.map(obj => this.env.R2_BUCKET.delete(obj.key)))
        truncated = listed.truncated
        cursor = listed.truncated ? listed.cursor : undefined
      }
    })

    // 7. Stripe customer.delete
    await step.do('delete-stripe-customer', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      const stripeRow = await this.env.DB.prepare(
        'SELECT stripe_customer_id FROM billing WHERE user_id = ?'
      ).bind(userId).first<{ stripe_customer_id: string | null }>()
      if (stripeRow?.stripe_customer_id) {
        await fetch(`https://api.stripe.com/v1/customers/${stripeRow.stripe_customer_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.env.STRIPE_SECRET_KEY}` },
        })
        await this.env.DB.prepare('DELETE FROM billing WHERE user_id = ?').bind(userId).run()
      }
    })

    // 8. Square customer archive
    await step.do('archive-square-customer', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      const sqRow = await this.env.DB.prepare(
        'SELECT square_customer_id FROM square_customers WHERE user_id = ?'
      ).bind(userId).first<{ square_customer_id: string | null }>()
      if (sqRow?.square_customer_id) {
        await fetch(`https://connect.squareup.com/v2/customers/${sqRow.square_customer_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.env.SQUARE_ACCESS_TOKEN}`, 'Square-Version': '2024-02-22' },
        })
      }
    })

    // 9. Resend audience removal
    await step.do('remove-resend-contact', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      // Resend: delete contact from every audience by email
      const audiences = await fetch('https://api.resend.com/audiences', {
        headers: { Authorization: `Bearer ${this.env.RESEND_API_KEY}` },
      }).then(r => r.json() as Promise<{ data: Array<{ id: string }> }>)

      await Promise.allSettled(
        audiences.data.map(aud =>
          fetch(`https://api.resend.com/audiences/${aud.id}/contacts/${encodeURIComponent(email)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.env.RESEND_API_KEY}` },
          })
        )
      )
    })

    // 10. PostHog person delete
    await step.do('delete-posthog-person', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      // Query by email property to get internal person ID
      await fetch(
        `https://us.posthog.com/api/projects/${this.env.POSTHOG_PROJECT_ID}/persons/?email=${encodeURIComponent(email)}&delete_events=true`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.env.POSTHOG_PERSONAL_API_KEY}` },
        }
      )
    })

    // 11. Sentry user delete
    await step.do('delete-sentry-user', { retries: { limit: 3, delay: '5 seconds' } }, async () => {
      // Sentry: search by email, then DELETE /api/0/organizations/{org}/users/{id}/
      const members = await fetch(
        `https://sentry.io/api/0/organizations/${this.env.SENTRY_ORG}/members/?query=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${this.env.SENTRY_AUTH_TOKEN}` } }
      ).then(r => r.json() as Promise<Array<{ id: string }>>)
      await Promise.allSettled(
        members.map(m =>
          fetch(`https://sentry.io/api/0/organizations/${this.env.SENTRY_ORG}/members/${m.id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.env.SENTRY_AUTH_TOKEN}` },
          })
        )
      )
    })

    // 12. Send receipt email + update audit log
    await step.do('send-receipt-and-close', async () => {
      await sendDeletionReceipt(email, requestedAt, new Date().toISOString(), this.env)
      await this.env.DB.prepare(
        `UPDATE deletion_audit SET status='complete', completed_at=? WHERE email_hash=?`
      ).bind(new Date().toISOString(), emailHash).run()
    })
  }
}
```

## Receipt email (Resend)

- Send from `privacy@yourdomain.com`.
- Subject: `"Your data has been deleted — [date]"`.
- Body must state: (1) request received date, (2) completion date, (3) what was deleted, (4) what was retained and why (audit log), (5) contact for disputes.

```ts
async function sendDeletionReceipt(email: string, requestedAt: string, completedAt: string, env: Env) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Privacy <privacy@${env.DOMAIN}>`,
      to: email,
      subject: `Your data has been deleted — ${new Date(completedAt).toDateString()}`,
      html: deletionReceiptHtml({ requestedAt, completedAt, domain: env.DOMAIN }),
      headers: { 'X-Category': 'transactional' }, // exempt from unsubscribe requirement
    }),
  })
}
```

## Audit log — what MUST survive

- GDPR Art. 17(3)(b) + Art. 5(2) require proof of deletion. The audit row uses email hash — never plaintext.
- Retain for **3 years** (statute of limitations for most EU privacy claims).

```sql
-- migration: add deletion_audit table
CREATE TABLE IF NOT EXISTS deletion_audit (
  id          TEXT PRIMARY KEY,       -- workflow instance ID
  email_hash  TEXT NOT NULL,          -- SHA-256 hex of lowercased email — NOT the email
  requested_at TEXT NOT NULL,         -- ISO-8601 UTC
  completed_at TEXT,                  -- ISO-8601 UTC; NULL until complete
  channel     TEXT NOT NULL,          -- 'web' | 'email' | 'admin'
  status      TEXT NOT NULL DEFAULT 'pending', -- pending|running|complete|failed|not_found
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
-- DO NOT add an email column. The hash is the only link to the identity.
-- NEVER store the plaintext email in this table.
```

**Retained fields (all non-personal):** `id`, `email_hash` (SHA-256 of lowercase email), `requested_at`, `completed_at`, `channel`, `status`.

**Must NOT persist:** name, phone, address, device IDs, IP address, plaintext email, any behavioral data.

## wrangler.jsonc binding

```jsonc
// wrangler.jsonc — add to existing bindings
{
  "workflows": [
    {
      "name": "DELETION_WORKFLOW",
      "binding": "DELETION_WORKFLOW",
      "class_name": "DeletionCascade",
      "script_name": "your-worker-name"
    }
  ]
}
```

## Drift detection

- `grep -rn 'users.*INSERT\|users.*UPDATE' src/worker/` — every new user-data write needs a deletion step added to the Workflow.
- Monthly: query `deletion_audit` for `status='failed'` rows; investigate and rerun.
- Annually: verify all third-party deletion APIs still work (Stripe, Square, Resend, PostHog, Sentry endpoints change).

## See

- `[[hono-api]]` — Workflows v2 step-do patterns + retry semantics
- `[[feature-flags]]` — `deletion_dashboard` flag lifecycle
- `[[zod-everywhere]]` — DeletionParamsSchema at every Workflow boundary
- `[[secret-provisioning]]` — STRIPE_SECRET_KEY + RESEND_API_KEY + POSTHOG_PERSONAL_API_KEY env setup
- `[[email-deliverability]]` + `[[email-deliverability-implementation]]` — receipt email send path
- `[[drift-detection]]` — new data writes that skip cascade registration = drift
