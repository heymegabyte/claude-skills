---
last_reviewed: 2026-06-29
superseded_by: null
name: "fail-fast-build-fail-soft-prod"
priority: 2
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

Throw hard in build/CI/scripts; return typed error objects and graceful fallbacks in production Workers — never crash a live request.

## The core rule

| Context | Philosophy | Mechanism |
|---|---|---|
| Build / CI / Vitest / scripts | **Fail fast, fail loud** | `throw`, `zod.parse()`, `assert()`, exit code 1 |
| Production request handler | **Fail soft, degrade gracefully** | `zod.safeParse()`, `try/catch` with fallback, stale cache, `X-Degraded` header |

## Build-time: fail fast

- Use `zod.parse()` (not `safeParse`) in build scripts, test setup, code generation, and schema validation tooling — throw hard and block the deploy.
- In Vitest tests, use `expect(() => ...).toThrow()` freely — the throw IS the assertion.
- In seed/migration scripts, call `process.exit(1)` on any data corruption or unexpected DB state.

See `reference/fail-fast-build-fail-soft-prod.md` for full examples.

## Production: fail soft

A 500 is the worst outcome — invisible to the user, breaks the experience, provides no recovery signal.

- **`zod.safeParse()` in prod handlers** — return a structured `400` with `parsed.error.flatten()`; never throw.
- **Non-critical service failure** — use `Promise.allSettled`, serve the page with the failed section as `null`, and set `X-Degraded: 1` on the response; log the failure.
- **Stale cache over error** — when D1 is down, serve the stale KV value and log a `warn`; `false` (default-off) is safer than a crash.
- **Queue failed work** — on email/notification failure, enqueue for retry and return `202 Accepted`; never `500` and never silently swallow.

See `reference/fail-fast-build-fail-soft-prod.md` for all four patterns with full code.

## Exception: security-critical prod paths must throw

Auth, payment, and data-integrity paths do NOT degrade gracefully — an auth failure that "degrades" to letting the user in is a security incident.

- Return `401`/`403` immediately on missing or invalid credentials.
- The rule applies to infrastructure failures (DB down, email timeout), not intentional rejection logic.

See `reference/fail-fast-build-fail-soft-prod.md` for the auth middleware example.

## Anti-patterns

- `zod.parse()` in a prod handler — one unexpected API response crashes all users.
- `try/catch { return 500 }` for a non-critical feature — show disabled UI instead.
- `catch (e) {}` silently — degraded = logged, never invisible.
- `process.exit(1)` inside a Worker fetch handler — terminates the isolate abruptly.
- Treating all 500s as equivalent — track in Sentry with full context.
- Deferring error handling — graceful degradation is part of the feature spec.

## Cross-links

- `[[zod-everywhere]]` — `parse` vs `safeParse` selection IS this rule in practice
- `[[error-recovery]]` — retry logic and recovery patterns for queue consumers
- `[[verification-loop]]` — build-time failure gates that enforce fail-fast
- `[[production-observability-default-on]]` — fail-soft is only safe when `X-Degraded` and structured logs are observed
- `[[state-is-the-enemy]]` — stateless Workers have simpler failure modes; stateful ones compound gracefully
