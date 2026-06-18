---
name: "vendor-risk-tiering"
priority: 1
pack: "core"
triggers:
  - "vendor"
  - "third party"
  - "third-party"
  - "dependency risk"
  - "vendor lock"
  - "migration plan"
  - "replacement plan"
  - "vendor tier"
  - "load-bearing"
  - "replaceable"
paths:
  - "ARCHITECTURE.md"
  - "wrangler.toml"
  - "package.json"
  - "worker/**"
  - "src/**"
---

# Vendor Risk Tiering (Load-Bearing vs Replaceable)

Every third-party service used in a project is classified at integration time. The tier determines the overhead applied to that relationship.

## The two tiers

### Load-bearing
Replacing this vendor requires a **multi-week migration** touching data, auth contracts, or core infrastructure. Examples: Cloudflare (Workers, D1, R2, Durable Objects), Clerk (auth), Stripe (billing/payouts), Square (POS payments), Resend (transactional email).

**Overhead for load-bearing vendors:**
- Documented replacement plan in `ARCHITECTURE.md` (≤1 paragraph: "to replace X, we would Y in Z weeks")
- Secret rotation schedule ≤ 90 days (per `secret-provisioning`)
- Abstraction layer wrapping the vendor surface — no raw SDK calls scattered across 30 files
- No single-point-of-failure usage: at least one tested fallback path or degraded-mode behavior

### Replaceable
Equivalent alternatives exist and migration would take **days**, not weeks. Examples: PostHog (→ Plausible / Amplitude), Sentry (→ Axiom / BugSnag), Upstash (→ CF KV directly), Inngest (→ CF Queues + Workflows).

**Overhead for replaceable vendors:**
- None. Use the SDK directly, no abstraction layer required.
- Swap decision is autonomous per `autonomous-engineering` — no approval needed.

## The CF lock-in exception

Cloudflare primitives are **load-bearing BY DESIGN**. Deep CF lock-in is the declared strategy per `cloudflare-lock-in-is-leverage`. There is no replacement plan for CF itself — that is intentional. All other load-bearing dependencies need active justification at integration time.

## Classification decision tree

```
Is replacing this vendor:
  A) A day of work or less? → Replaceable
  B) Painful but < 1 week?  → Replaceable (still no overhead)
  C) Multi-week + data migration or auth change? → Load-bearing

Is it CF (Workers / D1 / R2 / DO / KV / Queues / Cache)?
  → Load-bearing by doctrine; NO replacement plan required
```

## Abstraction layer for load-bearing vendors

The abstraction layer is a thin service module, not a generic interface. It wraps the vendor SDK into domain language so that if the vendor changes its API, there is one place to fix:

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

## ARCHITECTURE.md vendor section template

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

## Secret rotation schedule (load-bearing vendors)

All load-bearing vendor secrets rotate on a ≤90-day cadence per `secret-provisioning`:

```sh
# ~/.claude/rules/secret-rotation-calendar.md entry for each load-bearing vendor:
# Clerk CLERK_SECRET_KEY — rotate every 90 days — next: YYYY-MM-DD
# Stripe STRIPE_SECRET_KEY — rotate every 90 days — next: YYYY-MM-DD
# Resend RESEND_API_KEY — rotate every 90 days — next: YYYY-MM-DD
```

## Cross-links

- **[[cloudflare-lock-in-is-leverage]]** — CF lock-in as a deliberate architectural choice
- **[[secret-provisioning]]** — rotation cadence by vendor tier
- **[[payments-routing]]** — Stripe vs Square routing (both are load-bearing; never mix usage patterns for the same payment type)
- **[[autonomous-engineering]]** — adding a new load-bearing vendor is `review-recommended`; removing one is `approval-required`
- **[[drift-detection]]** — raw SDK calls scattered outside the service module = drift; consolidate in-turn
