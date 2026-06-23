# Right to Deletion — Implementation Reference

Sourced on demand by `rules/right-to-deletion.md`.

---

## Web form intake handler

Full Hono route for `POST /account/delete`. Verifies Turnstile, checks Clerk session
ownership (falls back to email-confirmation token), creates the CF Workflow instance,
and writes the audit row immediately.

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

---

## CF Workflow — deletion cascade (`DeletionCascade`)

Full `WorkflowEntrypoint` implementation. Steps run in dependency order: resolve user →
revoke sessions → purge KV → delete D1 rows → delete Vectorize → delete R2 → delete
Stripe → archive Square → remove Resend → delete PostHog → delete Sentry → send receipt.

Every step has `retries: { limit: 3 }` except the audit-only steps. FK-ordered D1 deletes
are batched in a single `env.DB.batch([...])` call.

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

---

## Receipt email via Resend (`sendDeletionReceipt`)

Send from `privacy@yourdomain.com`. Required body content: (1) request received date,
(2) completion date, (3) what was deleted, (4) what was retained and why, (5) dispute contact.
Mark `X-Category: transactional` to exempt from unsubscribe requirement.

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

---

## `deletion_audit` table — DDL

The audit row uses email hash, never plaintext. GDPR Art. 17(3)(b) + Art. 5(2) require
proof of deletion. Retain for 3 years.

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
