---
name: "fail-fast-build-fail-soft-prod"
priority: 1
pack: "core"
triggers:
  - "zod.parse"
  - "safeParse"
  - "throw"
  - "error handling"
  - "graceful degradation"
  - "500"
  - "try catch"
  - "fallback"
  - "retry"
paths:
  - "src/worker/**"
  - "workers/**"
  - "apps/*/src/**"
  - "scripts/**"
  - "*.test.ts"
  - "*.spec.ts"
---

# Fail Fast in Build, Fail Soft in Prod

Two different error philosophies apply in two different environments. Getting them backwards
produces either silent prod breakage (failing fast in CI but swallowing errors in prod) or
terrible user experience (throwing 500s at users when a graceful degradation was possible).

## The core rule

| Context | Philosophy | Mechanism |
|---|---|---|
| Build / CI / Vitest / scripts | **Fail fast, fail loud** | `throw`, `zod.parse()`, `assert()`, exit code 1 |
| Production request handler | **Fail soft, degrade gracefully** | `zod.safeParse()`, `try/catch` with fallback, stale cache, `X-Degraded` header |

## Build-time: fail fast

In build scripts, test setup, code generation, and schema validation tooling — throw hard.
The goal is to block the deploy before bad code reaches users.

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

```typescript
// vitest test — CORRECT: throw/assert freely
import { describe, it, expect } from 'vitest';

it('validates user schema', () => {
  // Let Vitest catch the throw — that IS the test
  expect(() => UserSchema.parse({ id: null })).toThrow();
});
```

```typescript
// scripts/seed-d1.ts — CORRECT: hard exit on data corruption
const rows = await db.prepare('SELECT * FROM users').all();
if (!rows.success) {
  console.error('Seed failed:', rows.error);
  process.exit(1); // hard fail, do not continue
}
```

## Production: fail soft

In Worker request handlers, the user is waiting for a response. A 500 is the worst outcome:
it is invisible to the user (no context), breaks the experience completely, and provides
no signal to recover from. Graceful degradation keeps the user in a working product while
the error is logged and tracked.

### Zod: safeParse with fallback

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

The `X-Degraded` header surfaces degraded responses in observability without breaking the
user experience. Log the analytics failure, but do not propagate it as a 500.

### Stale cache over error

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

### Queue failed work, do not surface the error

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

202 Accepted is semantically correct: the work is accepted but not yet complete. This is
far better than 500 (broken) or silently swallowing the error (lost message).

## The boundary table

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

## The one exception: security-critical prod paths must throw

Auth, payment, and data-integrity paths do NOT degrade gracefully. An auth failure that
"degrades" to letting the user in is a security incident.

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

401/403 responses are not "hard failures" — they are correct prod behavior. The rule
applies to infrastructure failures (DB down, email service timeout), not to intentional
rejection logic.

## Anti-patterns

- `zod.parse()` in a prod request handler — one unexpected API response crashes all users
- `try/catch { return 500 }` for a non-critical feature — show disabled UI instead
- Swallowing errors silently (`catch (e) {}`) — degraded = logged, never invisible
- `process.exit(1)` inside a Worker fetch handler — terminates the isolate abruptly
- Treating all 500s as equivalent — track them in Sentry with full context
- "We'll add error handling later" — graceful degradation is part of the feature spec

## Cross-links

- `[[zod-everywhere]]` — `parse` vs `safeParse` selection IS this rule in practice
- `[[error-recovery]]` — retry logic and recovery patterns for queue consumers
- `[[verification-loop]]` — build-time failure gates that enforce fail-fast
- `[[production-observability-default-on]]` — fail-soft is only safe when you can observe degraded responses via `X-Degraded` header and structured logs
- `[[state-is-the-enemy]]` — stateless Workers have simpler failure modes; stateful ones compound gracefully
