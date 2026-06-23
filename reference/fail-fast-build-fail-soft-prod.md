# Fail Fast in Build, Fail Soft in Prod — implementation reference

Sourced on demand by rules/fail-fast-build-fail-soft-prod.md.

## Build-time: fail-fast examples

### Env validation script (throws on bad config)

```typescript
// scripts/validate-env.ts — CORRECT: throw in build tooling
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  POSTHOG_API_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
});

// .parse() throws ZodError with full details on failure
// This is correct: block the deploy immediately
const env = EnvSchema.parse(process.env);
```

### Vitest test (assert freely)

```typescript
// vitest test — CORRECT: throw/assert freely
import { describe, it, expect } from 'vitest';

it('validates user schema', () => {
  // Let Vitest catch the throw — that IS the test
  expect(() => UserSchema.parse({ id: null })).toThrow();
});
```

### Seed script (hard exit on data corruption)

```typescript
// scripts/seed-d1.ts — CORRECT: hard exit on data corruption
const rows = await db.prepare('SELECT * FROM users').all();
if (!rows.success) {
  console.error('Seed failed:', rows.error);
  process.exit(1); // hard fail, do not continue
}
```

## Production: fail-soft examples

### Zod safeParse with structured 400

```typescript
// worker/routes/api/users.ts — CORRECT: safeParse in prod handler
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

app.post('/api/users', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);

  if (!parsed.success) {
    // Return structured error, NOT a throw
    return c.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      400
    );
  }

  // Continue with parsed.data
});
```

### Non-critical service failure: degrade, not crash

`X-Degraded: 1` surfaces degraded responses in observability without breaking the user experience. Log the non-critical failure; do not propagate it as a 500.

```typescript
// worker/routes/dashboard.ts — CORRECT: degrade when analytics are down
app.get('/dashboard', async (c) => {
  const [user, analyticsResult] = await Promise.allSettled([
    getUser(c.env, userId),
    getAnalyticsSummary(c.env, userId),
  ]);

  if (user.status === 'rejected') {
    // Auth is critical — this is a real failure
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const analytics = analyticsResult.status === 'fulfilled'
    ? analyticsResult.value
    : null; // degrade: show dashboard without analytics

  return c.json({
    user: user.value,
    analytics, // null = degraded; UI shows "Analytics unavailable"
    degraded: analyticsResult.status === 'rejected',
  }, 200, {
    'X-Degraded': analyticsResult.status === 'rejected' ? '1' : '0',
  });
});
```

### Stale cache over error

Serve stale KV when D1 is down; default-off is safer than crash.

```typescript
// worker/lib/feature-flags.ts — CORRECT: serve stale on D1 failure
async function getFlagValue(key: string, env: Env): Promise<boolean> {
  try {
    const fresh = await env.DB.prepare(
      'SELECT enabled FROM feature_flags WHERE key = ?'
    ).bind(key).first<{ enabled: number }>();

    const value = (fresh?.enabled ?? 0) === 1;
    // Update KV cache with fresh value
    await env.KV.put(`flag:${key}`, JSON.stringify(value), { expirationTtl: 60 });
    return value;
  } catch (err) {
    // D1 is down: serve stale KV value rather than crashing
    const stale = await env.KV.get(`flag:${key}`, 'json') as boolean | null;
    console.log(JSON.stringify({
      level: 'warn',
      message: 'D1 flag fetch failed, serving stale KV',
      key,
      staleAvailable: stale !== null,
    }));
    return stale ?? false; // default-off is safer than crash
  }
}
```

### Queue failed work, return 202

Return 202 Accepted — never 500 (broken) or silently swallowed (lost message).

```typescript
// worker/routes/api/notifications.ts — CORRECT: queue on failure, not 500
app.post('/api/notifications/send', async (c) => {
  const { userId, message } = await c.req.json();

  try {
    await sendEmail(c.env, userId, message);
    return c.json({ status: 'sent' });
  } catch (err) {
    // Email service down: queue for retry, return 202 Accepted
    await c.env.NOTIFICATION_QUEUE.send({ userId, message, retryCount: 0 });
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Email failed, queued for retry',
      userId,
      error: String(err),
    }));
    return c.json({ status: 'queued' }, 202);
  }
});
```

### Security-critical path: reject hard, never degrade

Auth failure that "degrades" to letting the user in is a security incident. 401/403 are correct prod behavior, not infrastructure failures.

```typescript
// CORRECT: auth path throws hard even in prod
app.use('*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const user = await verifyJWT(token, c.env).catch(() => null);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  c.set('user', user);
  await next();
});
```

## The boundary table (quick reference)

```
zod.parse()         ← build scripts, test setup, codegen, CLI tools
zod.safeParse()     ← prod request handlers, queue consumers, cron workers

throw               ← Vitest tests, build scripts, pre-deploy validation
try/catch+fallback  ← prod handlers for non-critical paths

assert()            ← test assertions, build-time invariants
X-Degraded header   ← prod degraded-but-serving responses

process.exit(1)     ← build failures (CI blocks deploy)
console.log+200     ← prod non-critical failures (user gets response)
```
