# Vendor Risk Tiering — implementation reference

Sourced on demand by rules/vendor-risk-tiering.md.

---

## Abstraction layer example (Resend / load-bearing vendor)

The abstraction layer is a thin service module, not a generic interface. It wraps
the vendor SDK into domain language so that if the vendor changes its API, there is
one place to fix.

```ts
// worker/services/email.ts  — wraps Resend (load-bearing)
import { Resend } from 'resend'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail(env: Env, payload: EmailPayload): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: payload.from ?? 'noreply@megabyte.space',
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })
  if (error) throw new Error(`Resend send failed: ${error.message}`)
}
// Consumers call sendEmail(env, {...}) — never import Resend directly elsewhere
```

---

## ARCHITECTURE.md vendor section template

Add this section to every project's `ARCHITECTURE.md` at integration time.

```md
## Vendor Inventory

| Vendor | Tier | Replacement plan |
|--------|------|-----------------|
| Cloudflare (Workers/D1/R2/DO) | Load-bearing (intentional) | N/A — lock-in by design |
| Clerk | Load-bearing | Replace with CF Access + custom JWT in ~2 weeks; migrate user table, swap auth middleware |
| Stripe | Load-bearing | Replace with Square Billing if <$1K MRR; ~1 week migration, data export via Stripe API |
| Resend | Load-bearing | Replace with CF Email Routing + Mailgun in ~3 days |
| PostHog | Replaceable | Swap analytics SDK; 1 day |
| Sentry | Replaceable | Swap error SDK; half day |
| Upstash | Replaceable | Replace with CF KV; 1 day |
```

---

## Secret rotation calendar entries (load-bearing vendors)

Add one entry per load-bearing vendor to `~/.claude/rules/secret-rotation-calendar.md`:

```sh
# Clerk CLERK_SECRET_KEY — rotate every 90 days — next: YYYY-MM-DD
# Stripe STRIPE_SECRET_KEY — rotate every 90 days — next: YYYY-MM-DD
# Resend RESEND_API_KEY — rotate every 90 days — next: YYYY-MM-DD
```
