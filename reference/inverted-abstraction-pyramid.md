# Inverted Abstraction Pyramid — implementation reference

Sourced on demand by rules/inverted-abstraction-pyramid.md.

---

## Thin shared middleware examples

Auth middleware (~60 lines — this is the ceiling) and error handler (~30 lines).

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

---

## Deep feature module example

Schema + service class (300 lines is fine at the feature layer) + handler.

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

---

## Anti-pattern examples

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
