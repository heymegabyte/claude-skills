---
name: "error-recovery"
priority: 2
pack: "core"
triggers:
  - "error"
  - "exception"
  - "rollback"
  - "deploy fail"
paths:
  - "*"
---

# Error Recovery

## Failure classification

- **Transient** (rate limit/timeout) — retry exponential backoff, max 3
- **Code bug** — read → diagnose → fix → test
- **Config** (missing env/binding) — `.env.local` → `wrangler.jsonc` → fix
- **Architecture mismatch** — stop → reassess → propose
- **External down** — status → fallback → note

## Self-heal protocol

- Read FULL error + stack trace
- Check `CONVENTIONS.md` known fixes
- After fix: verify
- After 3 fails: escalate with context

## Never

- Retry the same failed command
- Suppress errors without logging
- Use `--force` / `--no-verify` to bypass
- Ignore TypeScript errors

## Deploy failure

- Read error → fix → retry
- 3 fails → rollback via `wrangler rollback` → diagnose → deploy
- Post-deploy fail → fix → redeploy → retest
- Gradual deployments: auto-rollback fires on error-rate spike during 1% → 10% → 100% ramp

## D1 recovery

- **Time Travel** 30-day PIT recovery (`wrangler d1 time-travel restore`)
- D1 → R2 backup for long-term (1 TB per account, 10 GB per database)
- Batch failures: individual stmt errors in batch response array — check each
- Read-only queries auto-retry (2025-09-11) — don't double-wrap
- Sessions API replicas: handle stale-read by re-issuing with fresh `bookmark`

## Workers errors

- **CPU exceeded** (10ms free / 50ms paid default) → split into `ctx.waitUntil()`
- **Memory exceeded** → stream instead of buffer
- **Unhandled rejection** → `ctx.passThroughOnException()` for graceful degradation
- **Binding missing** → check `wrangler.jsonc` `[vars]` / ``d1_databases`` / ``kv_namespaces`` + `secrets.required` declaration
- WebSocket payload now 32 MiB — frame larger messages

## Durable Objects

- SQLite DO size limit 10 GB — shard by entity
- Alarm misfires → idempotent handler
- Use `getByName(name)` not `idFromName` → `get`

## MCP limits + priority

- **Rate limits**: Stripe 25/sec, GitHub 5000/hr, Firecrawl 1/sec/domain, Postiz 100/day
- **Priority order**:
  1. Dedicated MCP
  2. Bash + API
  3. Computer Use (native only)
- OAuth expired → re-auth (OAuth 2.1 + RFC 8707 for remote servers)
- Rate limited → backoff
- Unreachable → check Coolify

## Sentry integration

- `withSentry` wrapper from `@sentry/cloudflare` v9
- Breadcrumbs before risky ops
- Capture exception with context tags (`worker` | `route` | `userId`)
- Release tracking via `SENTRY_RELEASE` env
- Workers Tracing handles I/O spans automatically — Sentry should focus on exceptions

## Cache misses (Anthropic prompt cache)

- If hit rate <70%, check:
  - `cache_control` placement (must be on stable static content)
  - TTL choice (5m default vs 1h with `{"ttl":"1h"}`)
  - 4-breakpoint limit
- Don't place `cache_control` on per-request varying content (timestamps)
