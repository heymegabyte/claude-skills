---
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

## Correct Pattern — Stripe dispute auto-accept

```ts
// worker/features/billing/stripe-webhooks.ts
import Stripe from 'stripe';
import { z } from 'zod';

const DisputeSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  charge: z.string(),
});

export async function handleStripeDispute(
  env: Env,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> {
  const dispute = DisputeSchema.parse(event.data.object);

  // idempotency guard — webhook may fire more than once
  const already = await env.DB.prepare(
    'SELECT 1 FROM payment_events WHERE event_id = ? AND source = ?',
  ).bind(event.id, 'stripe').first();
  if (already) return;

  await env.DB.prepare(
    'INSERT INTO payment_events (event_id, source, processed_at) VALUES (?, ?, ?)',
  ).bind(event.id, 'stripe', new Date().toISOString()).run();

  // auto-accept disputes under $25 (amount is in cents)
  if (dispute.amount <= 2500) {
    await stripe.disputes.accept(dispute.id);
    // evidence submission is optional for small disputes; Stripe closes them automatically
    return;
  }

  // larger disputes: submit evidence (receipt, IP log, delivery confirmation)
  await stripe.disputes.update(dispute.id, {
    evidence: {
      customer_email_address: await getCustomerEmail(env, dispute.charge),
      receipt: await buildReceiptEvidenceUrl(env, dispute.charge),
      uncategorized_text: 'Customer received and used the service. See attached receipt.',
    },
    submit: true,
  });
}
```

## Correct Pattern — Stripe subscription cancellation with proration refund

```ts
// worker/features/billing/cancel-subscription.ts
export async function cancelSubscription(
  env: Env,
  stripe: Stripe,
  subscriptionId: string,
  userId: string,
): Promise<{ refundAmount: number; currency: string }> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const daysSinceBillingCycleStart = Math.floor(
    (Date.now() / 1000 - sub.current_period_start) / 86400,
  );

  if (daysSinceBillingCycleStart <= 30) {
    // cancel immediately and issue prorated refund for unused days
    const cancelled = await stripe.subscriptions.cancel(subscriptionId, {
      prorate: true,
    });

    // Stripe creates a credit balance; convert to refund immediately
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: sub.customer as string,
    });
    const creditBalance = Math.abs(invoice.amount_due); // negative = credit

    if (creditBalance > 0) {
      const charge = sub.latest_invoice
        ? (await stripe.invoices.retrieve(sub.latest_invoice as string)).charge
        : null;

      if (charge) {
        await stripe.refunds.create({
          charge: charge as string,
          amount: creditBalance,
          reason: 'requested_by_customer',
        });
      }
    }

    return { refundAmount: creditBalance, currency: sub.currency };
  }

  // outside the 30-day window: cancel at period end, no refund
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return { refundAmount: 0, currency: sub.currency };
}
```

## Correct Pattern — Square dispute auto-accept

```ts
// worker/features/payments/square-webhooks.ts
import { Client, Environment } from 'square';
import { z } from 'zod';

const SquareDisputeSchema = z.object({
  id: z.string(),
  amount_money: z.object({
    amount: z.number(), // cents
    currency: z.string(),
  }),
  disputed_payment: z.object({ payment_id: z.string() }),
});

export async function handleSquareDispute(
  env: Env,
  client: Client,
  payload: unknown,
): Promise<void> {
  const { data } = z.object({ data: z.object({ object: z.object({ dispute: SquareDisputeSchema }) }) }).parse(payload);
  const dispute = data.object.dispute;

  // idempotency guard
  const already = await env.DB.prepare(
    'SELECT 1 FROM payment_events WHERE event_id = ? AND source = ?',
  ).bind(dispute.id, 'square').first();
  if (already) return;

  await env.DB.prepare(
    'INSERT INTO payment_events (event_id, source, processed_at) VALUES (?, ?, ?)',
  ).bind(dispute.id, 'square', new Date().toISOString()).run();

  if (dispute.amount_money.amount <= 2500) {
    await client.disputesApi.acceptDispute(dispute.id);
    return;
  }

  // submit evidence for larger disputes
  await client.disputesApi.submitEvidenceDispute(dispute.id);
}
```

## Correct Pattern — Resend refund receipt

```ts
// worker/lib/refund-receipt.ts
import { Resend } from 'resend';

export async function sendRefundReceipt(
  ctx: ExecutionContext,
  env: Env,
  opts: {
    to: string;
    refundAmount: number;
    currency: string;
    originalChargeDate: string;
    reason: string;
  },
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: opts.currency.toUpperCase(),
  }).format(opts.refundAmount / 100);

  // non-blocking — receipt does not delay the API response
  ctx.waitUntil(
    resend.emails.send({
      from: 'billing@megabyte.space',
      to: opts.to,
      subject: `Refund of ${formatted} processed`,
      html: `<p>Your refund of ${formatted} has been processed. Original charge: ${opts.originalChargeDate}. Reason: ${opts.reason}. Allow 5–10 business days to appear on your statement.</p>`,
    }),
  );
}
```

## Anti-Patterns

### No dispute handler

```ts
// BAD — dispute webhook registered but handler is a stub
app.post('/webhooks/stripe', async (c) => {
  const event = await stripe.webhooks.constructEvent(...);
  if (event.type === 'charge.dispute.created') {
    // TODO: handle disputes
    return c.json({ ok: true });
  }
});
// Result: 0.75% chargeback rate, processor flags account, possible suspension
```

### Manual refund queue

```ts
// BAD — creates a D1 table of "refunds to process manually"
// Solo builder never empties this queue; chargebacks follow
await env.DB.prepare(
  'INSERT INTO pending_refunds (charge_id, reason, created_at) VALUES (?, ?, ?)',
).bind(chargeId, 'cancellation', new Date().toISOString()).run();
```

### Refund without idempotency guard

```ts
// BAD — webhook replay fires refund twice
app.post('/webhooks/stripe', async (c) => {
  const event = ...; // parsed
  if (event.type === 'charge.dispute.created') {
    await stripe.disputes.accept(event.data.object.id); // fires again on retry
  }
});
```

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
