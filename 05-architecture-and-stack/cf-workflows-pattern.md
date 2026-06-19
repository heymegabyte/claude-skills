---
name: "cf-workflows-pattern"
priority: 2
pack: "architecture"
triggers:
  - "workflow"
  - "durable execution"
  - "background job"
  - "step.do"
  - "long running"
paths:
  - "**/workflows/**"
---

# Cloudflare Workflows — Durable Multi-Step Execution

Native CF primitive for long-running, retry-safe, hibernation-friendly multi-step processes. Replaces Inngest, Trigger.dev, Temporal for most use cases. See `[[cloudflare-lock-in-is-leverage]]`.

Source: `cloudflare/workflows-starter` (★47), `cloudflare/dynamic-workflows` (per-tenant variant — separate submodule).

## When to use

- Multi-step processes where intermediate state must survive crashes/restarts
- Human-in-the-loop approval gates (`step.waitForEvent()`)
- Webhook-driven processes that may take minutes/hours
- Async ingestion (RAG, image processing, video transcoding)
- Anywhere you'd reach for Inngest — use Workflows first

## Pattern A: `step.do()` with retry config

```ts
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';

export class OrderWorkflow extends WorkflowEntrypoint<Env, { orderId: string }> {
  async run(event: WorkflowEvent<{ orderId: string }>, step: WorkflowStep) {
    const order = await step.do('fetch order', async () => {
      return await this.env.DB.prepare('SELECT * FROM orders WHERE id = ?')
        .bind(event.payload.orderId).first<Order>();
    });

    // Idempotent write with retries
    const payment = await step.do('charge payment', {
      retries: { limit: 5, delay: '5 second', backoff: 'exponential' },
      timeout: '15 minutes',
    }, async () => {
      // Use idempotency key to prevent double-charge on retry
      return await chargeSquare(order.total, { idempotencyKey: order.id });
    });

    await step.do('send confirmation', async () => {
      await this.env.RESEND.emails.send({
        from: 'orders@example.com',
        to: order.email,
        subject: 'Order confirmed',
        html: renderTemplate({ order, payment }),
      });
    });
  }
}
```

**Critical**: steps may re-execute on retry. Use idempotency keys (Square, Stripe both support) or check-then-act for non-idempotent operations.

## Pattern B: `step.waitForEvent()` — human approval gate

```ts
const approval = await step.waitForEvent('request-approval', {
  type: 'approval',
  timeout: '24 hours',
});

if (approval.payload.decision === 'approved') {
  await step.do('execute', async () => { /* ... */ });
} else {
  await step.do('notify rejection', async () => { /* ... */ });
}
```

Instance **hibernates** (zero cost) while waiting. Resume via REST:

```sh
curl -X POST https://api.cloudflare.com/client/v4/accounts/$ACCT/workflows/$NAME/instances/$ID/events/request-approval \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"decision":"approved","approver":"brian@megabyte.space"}'
```

## Pattern C: `step.sleep()` — schedule future work without burning compute

```ts
await step.do('send welcome email', async () => { /* ... */ });
await step.sleep('1 day');
await step.do('send onboarding tips email', async () => { /* ... */ });
await step.sleep('7 days');
await step.do('send trial-ending email', async () => { /* ... */ });
```

Replaces cron + DB-tracked queue. Workflow hibernates between sleeps.

## wrangler.jsonc — workflow binding

```jsonc
{
  "workflows": [{
    "name": "order-workflow",
    "binding": "ORDER_WORKFLOW",
    "class_name": "OrderWorkflow"
  }],
  "observability": { "enabled": true, "head_sampling_rate": 1 }
}
```

`class_name` must match the exported class name EXACTLY. `observability` block feeds Workers Tracing OTLP — needed for debugging long-running workflow instances.

## Triggering a workflow

```ts
app.post('/orders', async (c) => {
  const body = await c.req.json<{ orderId: string }>();
  const instance = await c.env.ORDER_WORKFLOW.create({
    id: body.orderId, // dedup key — second create with same id throws
    params: body,
  });
  return c.json({ workflowId: instance.id, status: await instance.status() });
});
```

Pass the order ID as the workflow instance ID for natural dedup. Second `create` with same ID throws — meaning duplicate POST is idempotent at the workflow layer.

## Compatibility date gotcha

```jsonc
"compatibility_date": "2024-10-22" // or later
```

Workflows silently break on earlier compat dates. Always set ≥ 2024-10-22.

## Anti-patterns

- ❌ Putting non-idempotent writes bare in `step.do()` — wrap with idempotency key OR use upsert
- ❌ Omitting `observability` config — debugging hibernating workflows is impossible without OTLP
- ❌ Using `setTimeout` or `Date.now()` inside steps — non-deterministic across retries; use `step.sleep()` and pass timestamps via params
- ❌ Reaching for Inngest when CF Workflows fits — see `[[cloudflare-lock-in-is-leverage]]`

## See also for per-tenant variant

When each tenant runs different workflow code (multi-tenant SaaS), see `cf-dynamic-workflows-pattern.md` (separate submodule using `cloudflare/dynamic-workflows`).

## Cross-link

- `[[cloudflare-lock-in-is-leverage]]` — Workflows > Inngest for most cases
- `cf-rag-vectorize-pattern` (this dir) — RAG ingestion uses Workflows
- `cf-agents-do-pattern` (this dir) — agents can trigger workflows via `workflow.create()`
- `[[verification-loop]]` — workflows count as deployed surfaces; assert via REST
- `[[error-recovery]]` — retry + idempotency patterns
