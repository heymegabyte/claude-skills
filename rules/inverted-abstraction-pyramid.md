---
name: "inverted-abstraction-pyramid"
priority: 2
pack: "backend"
triggers:
  - "abstraction"
  - "middleware"
  - "generic"
  - "reusable"
  - "shared util"
  - "base class"
  - "generic handler"
paths:
  - "*"
---

# Inverted Abstraction Pyramid

- Shared infrastructure layer: thin (≤200 lines per file).
- Feature module layer: as deep as the domain requires.
- Wide base at the bottom (feature specifics), narrow tip at the top (shared infrastructure).
- "Generic" is earned: write the specific thing twice, then extract. One use case does not justify an abstraction.

## Rules

- `worker/middleware/` stays thin: auth check, CORS headers, error handler, request ID, rate limiter. Each file ≤200 lines. No business logic.
- `worker/features/<name>/` can be as deep as the domain requires: Zod schemas, service class, multiple handlers, query builders, domain types, constants, README.
- When a generic utility grows past ~100 lines, audit for absorbed domain knowledge — extract it back to the feature.

## Correct pattern — thin shared middleware

```ts
// worker/middleware/auth.ts (~60 lines — this is the ceiling)
export const requireAuth = createMiddleware<{ Bindings: Env; Variables: { userId: string } }>(
  async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json({ error: 'Unauthorized' }, 401);
    try {
      const payload = await verify(token, c.env.CLERK_JWT_KEY);
      c.set('userId', payload.sub);
      await next();
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }
  },
);

// worker/middleware/error-handler.ts (~30 lines)
export function registerErrorHandler(app: Hono) {
  app.onError((err, c) => {
    console.error({ error: err.message, stack: err.stack, url: c.req.url });
    return c.json({ error: 'Internal server error' }, 500);
  });
  app.notFound((c) => c.json({ error: 'Not found' }, 404));
}
```

## Correct pattern — deep feature module

```ts
// worker/features/billing/schemas.ts
export const CreateSubscriptionSchema = z.object({
  planId: z.enum(['starter', 'growth', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
  couponCode: z.string().max(20).optional(),
  seats: z.number().int().min(1).max(500).optional(),
});

// worker/features/billing/billing-service.ts (~300 lines — totally fine here)
export class BillingService {
  constructor(private db: DrizzleD1Database, private stripe: Stripe, private kv: KVNamespace) {}

  async createSubscription(userId: string, input: CreateSubscriptionInput): Promise<Subscription> {
    const plan = PLAN_CONFIG[input.planId];
    const coupon = input.couponCode ? await this.validateCoupon(input.couponCode) : null;
    const stripeSub = await this.stripe.subscriptions.create({
      customer: await this.getOrCreateStripeCustomer(userId),
      items: [{ price: plan.priceId[input.billingCycle] }],
      coupon: coupon?.stripeId,
      quantity: input.seats ?? 1,
    });
    return this.persistAndReturn(userId, stripeSub, input);
  }

  private async validateCoupon(code: string): Promise<{ stripeId: string } | null> {
    // 50 lines of coupon-specific business logic — belongs here, not in a generic "validateCode" util
  }
}

// worker/features/billing/handlers.ts (~120 lines)
billingRouter.post(
  '/subscriptions',
  requireAuth,
  zValidator('json', CreateSubscriptionSchema),
  async (c) => {
    const svc = new BillingService(drizzle(c.env.DB), stripe, c.env.KV);
    const sub = await svc.createSubscription(c.get('userId'), c.req.valid('json'));
    return c.json(sub, 201);
  },
);
```

## Anti-patterns

### Middleware with business logic

```ts
// BAD — auth.ts checking plan, seats, overages; sending email as side effect
export const requireAuth = createMiddleware(async (c, next) => {
  const user = await verifyAndFetchFullUser(c, token); // fetches billing plan, seats, overages
  if (user.plan === 'free' && c.req.path.startsWith('/api/export')) {
    return c.json({ error: 'Upgrade required' }, 403);
  }
  if (user.seats > user.subscription.maxSeats) {
    await sendOverageEmail(c.env, user); // side effect in middleware — impossible to test
  }
});
```

### Generic abstraction from one use case

```ts
// BAD — "generic" webhook handler with only one active payment rail
export function createWebhookHandler<T>(config: {
  verifySignature: (req: Request, secret: string) => Promise<boolean>;
  parsePayload: (body: string) => T;
  route: (event: T) => Promise<void>;
  dedupeTable: string;
}) { ... }
// Write stripe-webhooks.ts and square-webhooks.ts; extract shared verify-signature only after both exist.
```

## Size guidelines

- **`worker/middleware/*.ts`** — 30–80 lines expected, 200 lines ceiling.
- **`worker/middleware/`** (total) — 150–300 lines expected, 500 lines ceiling.
- **`worker/features/<name>/schemas.ts`** — 50–200 lines, no ceiling.
- **`worker/features/<name>/service.ts`** — 100–500 lines, no ceiling.
- **`worker/features/<name>/handlers.ts`** — 80–300 lines; split by resource at 400.
- **`worker/lib/*.ts`** — 30–100 lines expected, 150 lines ceiling; absorb domain back into feature past ceiling.

## Checklist

- `worker/middleware/` contains only: auth, CORS, error handler, request ID, rate limiter, logger. Anything else → move to a feature.
- Every file in `worker/middleware/` stays under 200 lines.
- Feature service classes can be as long as the domain requires.
- Before extracting a shared utility: does it exist in TWO or more features with REAL duplication? If not, leave it in the feature.
- When a shared utility grows past ~100 lines: audit for absorbed domain knowledge; return it to the feature.
- A generic abstraction requiring 20 lines of config per use is worse than two 50-line concrete implementations.

## See

- [[feature-module-architecture]] — canonical feature folder shape at the wide base
- [[hono-api]] — middleware order, `createFactory()`, and route group patterns
- [[zod-everywhere]] — where feature-level depth and sharing genuinely coexist
- [[code-style]] — file size conventions, module boundaries
