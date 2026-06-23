# Refund Automation — implementation reference

Sourced on demand by rules/refund-automation.md.

---

## Stripe dispute auto-accept handler

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

---

## Stripe subscription cancellation with proration refund

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

---

## Square dispute auto-accept handler

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

---

## Resend refund receipt (non-blocking)

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

---

## Anti-pattern code examples

### No dispute handler (stub)

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
