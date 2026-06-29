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

Classify failures (transient/code/config/deploy/data/auth) and apply the matching structured recovery path before escalating or asking the user.

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

## Folded from Superpowers — systematic-debugging

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: [[20-superpowers]] → systematic-debugging/SKILL.md.*

- **Iron Law** — no fix without root-cause investigation first. Symptom patches are failure, even under time pressure.
- **4-phase method** — (1) read the error + stack trace completely (2) reproduce reliably; if not reproducible, gather data, never guess (3) trace to root cause (4) fix the cause + add a failing-then-passing regression test.
- **Single-hypothesis testing** — state "X is root cause because Y", make the SMALLEST change to test it, one variable at a time; failed → form NEW hypothesis, don't stack fixes.
- **3-fix architecture stop** — after 3 failed fixes, stop fixing and question the architecture; cascading new symptoms = wrong pattern, not a bad hypothesis.
- **Root-cause tracing** — bug deep in the call stack: trace backward up the call chain to the original trigger, fix at the source, never at the symptom point.
- **Stack-trace instrumentation** — when manual tracing dead-ends, log `new Error().stack` + context BEFORE the dangerous op; in tests use `console.error` (logger may be suppressed).
- **Condition-based waiting** — replace arbitrary `sleep`/`setTimeout` with `waitFor(condition, desc, timeoutMs)` polling every ~10ms; always timeout with a clear error, call the getter inside the loop for fresh data.
- **Arbitrary timeout only when** — testing real timed behavior (debounce/throttle): first wait for the triggering condition, then the known interval, with a comment justifying WHY.
- **Defense-in-depth** — after finding root cause, validate at EVERY layer data passes (entry / business-logic / environment guard / debug log) to make the bug structurally impossible — one check is bypassed by other paths, mocks, refactors.
- See `reference/error-recovery.md` (condition-based-waiting + defense-in-depth TS code) · [[20-superpowers]]
