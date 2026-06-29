---
last_reviewed: 2026-06-29
superseded_by: null
name: "refund-automation"
priority: 2
pack: "payments"
triggers:
  - "refund"
  - "dispute"
  - "chargeback"
  - "cancellation"
  - "charge.dispute"
  - "DISPUTE_CREATED"
  - "cancel_at_period_end"
paths:
  - "concern:stripe-billing"
  - "concern:square-payments"
---

# Refund Automation

No payment feature merges without automated refund + dispute paths wired up. A solo builder cannot staff a refund queue; manual queues accrue chargebacks silently until the processor flags the account at 0.75%.

## Rules

- **Stripe Radar** — auto-refund charges with `risk_score > 75` before settlement.
- **Stripe `charge.dispute.created`** — auto-accept disputes ≤ $25 (2500 cents); fighting costs more.
- **Stripe subscription cancellation** — prorated refund for unused days when cancelled within 30 days; `cancel_at_period_end` outside that window.
- **Square `DISPUTE_CREATED`** — auto-accept disputes ≤ $25, same threshold.
- **Both rails** — D1 `payment_events` dedupe table prevents double-refund on webhook replay.
- **Both rails** — Resend receipt issued within 30 seconds of webhook processing via `ctx.waitUntil()`.

## Handler requirements

### Stripe dispute (`charge.dispute.created`)

- Zod-parse `event.data.object` before any DB write; reject malformed payloads.
- Idempotency check against `payment_events(event_id, source='stripe')` before calling any Stripe API.
- Auto-accept when `dispute.amount <= 2500` cents; submit evidence for larger disputes.
- Evidence fields: `customer_email_address`, `receipt` URL, `uncategorized_text`.

See `reference/refund-automation.md` for the full `handleStripeDispute` handler.

### Stripe subscription cancellation

- Calculate `daysSinceBillingCycleStart = floor((now/1000 - sub.current_period_start) / 86400)`.
- Within 30 days: `stripe.subscriptions.cancel({ prorate: true })` then retrieve upcoming invoice credit balance and immediately create a refund against the original charge.
- Outside 30 days: `stripe.subscriptions.update({ cancel_at_period_end: true })`, no refund.

See `reference/refund-automation.md` for the full `cancelSubscription` implementation.

### Square dispute (`DISPUTE_CREATED`)

- Same idempotency pattern against `payment_events(event_id, source='square')`.
- Auto-accept at ≤ 2500 cents via `client.disputesApi.acceptDispute(dispute.id)`.
- Submit evidence for larger disputes via `client.disputesApi.submitEvidenceDispute(dispute.id)`.

See `reference/refund-automation.md` for the full `handleSquareDispute` handler.

### Refund receipt email

- Send via Resend inside `ctx.waitUntil()` — never block the API response.
- Format amount with `Intl.NumberFormat` using the charge's currency.
- From address must pass `email-deliverability.md` gate (SPF+DKIM+DMARC).

See `reference/refund-automation.md` for the full `sendRefundReceipt` implementation.

## Anti-patterns (build-fail)

- **Stub dispute handler** — `charge.dispute.created` registered but returns early without action → 0.75% chargeback rate, processor suspension risk.
- **Manual refund queue** — inserting to a `pending_refunds` table for human processing → solo builder never drains it; chargebacks follow.
- **No idempotency guard** — calling `stripe.disputes.accept()` or `stripe.refunds.create()` without checking `payment_events` first → webhook replay fires twice.

See `reference/refund-automation.md` for code examples of each anti-pattern.

## Checklist

- `payment_events(event_id, source, processed_at)` D1 table with UNIQUE constraint on `(event_id, source)` exists before any webhook handler goes live.
- Stripe Radar rule configured: auto-refund `risk_score > 75` before settlement.
- `charge.dispute.created` webhook registered and routed to handler.
- Auto-accept threshold: $25 (2500 cents) — review annually against dispute volume.
- Subscription cancellation: prorated refund within 30 days, `cancel_at_period_end` outside.
- Square `DISPUTE_CREATED` webhook wired if Square is the accept-money rail.
- Refund receipt via Resend in `ctx.waitUntil()` — never blocking the API response.
- Resend from address passes `email-deliverability.md` gate (SPF+DKIM+DMARC).
- `charge.refunded` and `payment.refund.updated` logged to D1 for audit trail.

## D1 schema

```sql
-- migration: 0020_payment_events.sql
CREATE TABLE payment_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    TEXT NOT NULL,
  source      TEXT NOT NULL CHECK(source IN ('stripe', 'square')),
  event_type  TEXT,
  amount      INTEGER,
  currency    TEXT,
  processed_at TEXT NOT NULL,
  UNIQUE(event_id, source)
);
```

## See

- [[payments-routing]] — Square vs Stripe rail selection; which handler belongs in which webhook route
- [[hono-api]] — webhook signature verification pattern (Square-Signature HMAC, Stripe-Signature t=+v1=)
- [[solo-builder-doctrine]] — no-staging, no manual queue; automation is the only viable ops model
- [[stripe-billing]] — subscription lifecycle, proration, credit balance behavior
- [[square-payments]] — Square Subscriptions recurring-donation cancellation flow
