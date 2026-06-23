---
name: "state-is-the-enemy"
priority: 2
pack: "core"
triggers:
  - "let "
  - "module scope"
  - "in-memory"
  - "cache"
  - "singleton"
  - "global"
  - "durable object"
  - "stateful"
  - "rate limit"
  - "session"
  - "websocket"
paths:
  - "src/worker/**"
  - "workers/**"
  - "apps/*/src/worker/**"
---

# State Is the Enemy — Push to DOs or Eliminate

A Worker isolate boots, serves a request, and may be evicted at any time. Module-level `let`/`const` that accumulates mutable state across requests is a bug that only manifests under concurrent load — and CF Workers run concurrent requests in the same isolate during warm periods.

- If state must persist across requests → Durable Object, D1, KV, or R2.
- If state does not need to persist → compute on demand, cache at CDN — not in Worker memory.

## The three failure modes

### 1. Module-scope mutable variables

- `let requestCount` or `let lastUser` at module scope creates race conditions and cross-request data leaks under concurrency.
- Fix: eliminate mutable module-scope variables. Compute counts from D1/KV. Pass user as a local variable per request.

### 2. In-memory cache with no isolation guarantee

- A `Map` used as a feature-flag cache gives inconsistent values under concurrent writes, empty caches after isolate restart, and stale values after D1 toggles (could be hours).
- Fix: KV with a 60-second TTL — consistent, shared across isolates, auto-expires.

### 3. Singleton that should be a Durable Object

- A `Map<string, { count; resetAt }>` rate limiter is per-isolate: a user hitting 5 isolates gets 5× the allowed rate.
- Fix: Durable Object with transactional `storage.put/get` — single authoritative counter per user, globally.

See `reference/state-is-the-enemy.md` for annotated bug+fix code for all three patterns.

## Canonical state routing

| State type | Correct home |
|---|---|
| Per-user rate limit | Durable Object (not Worker Map, not Redis) |
| WebSocket session | Durable Object (not Worker global) |
| Distributed lock | Durable Object (not Worker boolean) |
| Feature flag value | KV (60s TTL) (not Worker Map) |
| Per-request context | local variable (not module-scope `let`) |
| User session / JWT | Cookie + D1 (not Worker Map) |
| AI conversation history | D1 + DO (not Worker array) |
| Tenant config | KV (60s TTL) (not Worker object) |
| File/blob | R2 (not Worker Buffer) |

## Stateless design checklist (every Worker PR)

- [ ] No `let` or `var` at module scope accumulating state across requests
- [ ] No `Map` / `Set` / `Array` at module scope used as a cache
- [ ] Every cache goes through KV or CF Cache API, not Worker memory
- [ ] Rate limiters implemented as DOs
- [ ] WebSocket sessions implemented as DOs
- [ ] Every piece of "per-tenant" state routes through a DO stub or D1
- [ ] Module-scope `const` are immutable config only (URLs, regexes, Zod schemas)

## Immutable module-scope constants are fine

The rule applies to **mutable** state only. Immutable `const` at module scope — frozen sets, Zod schemas, string constants — are safe and encouraged. See `reference/state-is-the-enemy.md` for the canonical example.

## Durable Objects capabilities

- Per-entity serialized execution (no race conditions)
- Transactional SQLite storage (`this.state.storage`)
- Global singleton per ID (not per-isolate)
- WebSocket hibernation for long-lived connections
- Alarms for scheduled per-entity work

Use DOs without apology. `[[cloudflare-lock-in-is-leverage]]` explicitly endorses deep DO usage.

## Anti-patterns

- `const cache = new Map()` at module top level used as an LRU
- `let currentUser` at module scope "for performance"
- Rate limiter as a Worker-scope counter (broken under multi-isolate deployment)
- "We'll add DOs later when it becomes a problem" — the problem is invisible until prod breaks
- WebSocket session state in Worker memory (evicted = session lost)
- `setInterval` / `setTimeout` at module scope (does not work in CF Workers)

## Cross-links

- `[[cloudflare-lock-in-is-leverage]]` — DOs are the canonical CF stateful primitive
- `[[zod-everywhere]]` — stateless Workers validate all state at every boundary entry
- `[[production-observability-default-on]]` — stateless Workers produce clean traces; stateful ones produce confusing overlapping traces
- `[[fail-fast-build-fail-soft-prod]]` — stateful bugs fail softly in prod (wrong counts, stale caches); detect via observability
- `[[hono-api]]` — Hono middleware context (`c.set` / `c.get`) is request-scoped and safe; module scope is not
