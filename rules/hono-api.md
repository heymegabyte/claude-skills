---
name: "hono-api"
priority: 2
pack: "backend"
triggers:
  - "hono"
  - "worker api"
paths:
  - "concern:hono-stack"
  - "concern:cloudflare-workers"
---

# Hono API Rules

Define Hono-on-Workers API patterns including RPC mode, WorkerEntrypoint bindings, Zod middleware, and structured error responses for every endpoint.

## Core patterns

- Inline handlers for type inference (not separate controller files)
- RPC mode: `export type AppType = typeof app;` client uses `hc<AppType>`
- For internal Worker-to-Worker calls use **`WorkerEntrypoint` RPC** (promise pipelining, 32 MiB payload limit, JSRPC compat date `2024-04-03`) — not service-binding `fetch()` over HTTP
- Middleware order: global logger → route-group CORS → route-specific auth
- `@hono/zod-validator` on ALL request bodies
- `@hono/zod-openapi` for OpenAPI schema
- Centralized error handler: `app.onError()` + `app.notFound()`
- Split large apps: `app.route('/path', subApp)`

## Conventions

- Error envelope: `{error:string, code?:string, details?:unknown}`
- Rate limit public endpoints: KV-based per-IP counters
- Turnstile verification on all form submissions
- Health endpoint: `GET /health` returns `{status, version, timestamp}`
- Drizzle ORM v1 with **RQBv2** (`with` for nested relations, JIT-compiled row mapper, single SQL query always — `._query` removed for Postgres) for all database access
- Webhooks: verify signature → deduplicate → route → handle

## Factory + chaining

- `createFactory()` for reusable middleware chains with shared context
- Method chaining: `app.use(cors()).get('/api/items', handler).post('/api/items', handler)`
- Pin Hono **v4.12.x** (Apr 2026, ~14KB). For cold-start-sensitive Workers use the **`hono/tiny` preset** (SmartRouter, ~6KB) — trades slightly slower routing for smaller bundle.

## D1 patterns

- Batch API (`db.batch([stmt1, stmt2])`) not `BEGIN/COMMIT` (D1 has no transactions)
- **Read-only queries auto-retry** (2025-09-11 — remove custom retry wrappers around `SELECT`/`EXPLAIN`)
- **Read replication GA via Sessions API**: `db.withSession(bookmark)` gives sequentially-consistent reads across replicas at no extra cost
- Time Travel 30-day PIT recovery
- **1 TB storage limit per account** (not per-DB), 10 GB per database
- D1 → R2 backup for long-term
- **Jurisdiction pinning** (2025-11-05): set EU/FedRAMP jurisdiction at create time for compliance

## Workers patterns

- CPU limit 10ms (free) / 50ms default (paid, configurable to 5min)
- Wall time 30s (paid)
- Use `ctx.waitUntil()` for async post-response work
- `ctx.passThroughOnException()` for graceful degradation
- Bindings typed via `wrangler types` (preferred over hand-maintained `Env` interface)
- **`wrangler.jsonc`** is the new default (not `.toml`)
- **`secrets.required`** config property declares required secrets — validated at `wrangler dev`/`deploy`
- **Remote bindings** via `remote: true` per binding routes operations through Miniflare to real prod resources during dev
- **Dynamic Workers** (Developer Week 2026): stateful + auto-horizontal-scaling + long tasks ≤30 min in one primitive — for session management, real-time collab, multi-step workflows without hand-rolling DO/KV state

## Durable Objects

- SQLite-backed DOs GA (2025-04-07), 10 GB per DO, available on Free plan
- Paid storage billing began 2026-01-07
- New DOs default to `new_sqlite_classes` not `new_classes`
- Direct stub: `env.MY_DO.getByName(name)` (replaces `idFromName` → `get` two-step)
- **WebSocket message size 1 MiB → 32 MiB** (2026); DOs now placeable in **Oceania** (lower latency for AU/NZ eyeballs)
- **DO Facets** (Agents Week 2026): one DO spawns child facets each with isolated SQLite — for per-tenant / AI-generated-app state in a sandbox
- Inspect/edit SQLite-DO data via **Data Studio** in the dashboard

## R2 patterns

- Lifecycle Standard → Infrequent Access after 30 days for backups/exports/old uploads
- R2 event notifications → Queues at 5,000 msg/sec for thumbnailing/AV-scan/index instead of polling

## Vectorize

- 5M dimensions/index
- topK up to 100 (50 with values/metadata)
- 10 metadata indexes/index
- 10 KiB metadata/vector

## Hyperdrive

- MySQL + Postgres, free on Workers Free
- Connection pooling + query caching included
- Front any external Postgres/MySQL with Hyperdrive, not direct connection

## AI Gateway

- `env.AI.run()` auto-routes through AI Gateway for logging, caching, rate-limit, fallback
- Wire as the 4th observability pillar (Sentry + PostHog + GA4 + AI Gateway)

## Workflows v2 (2026-05)

- 50K concurrent instances
- 300 creates/sec
- 2M queued/workflow
- Deterministic step-based execution (`step.do`, `step.sleep`, `step.waitForEvent`)
- Default for any agentic or long-running task

## Containers

- `await env.MY_CONTAINER.fetch()` from a Worker spins a Docker container on demand
- Escape hatch for non-JS runtimes (Playwright headful, ffmpeg, Python ML)

## Clerk M2M JWT (2026-02-24)

- Free, networkless verification for service-to-service identity
- Use instead of static API keys between Workers
- `CLERK_JWT_KEY` PEM verification for zero-RTT session checks at the edge

## OpenAPI generation

- **`hono-openapi`** is the OpenAPI serving layer: `describeRoute(meta)` per-route + `openAPISpecs(app, {openapi:'3.1.0',...})` to emit the spec document.
- **`@asteasolutions/zod-to-openapi`** derives the spec from Zod schemas: `extendZodWithOpenApi(z)` once at startup + `OpenApiGeneratorV31` to build the registry — never hand-maintain OpenAPI YAML/JSON.
- Use `@hono/zod-validator` (or `hono-openapi`'s own resolver) for per-route input validation; Zod remains the SSOT per `[[zod-everywhere]]`.
- `@hono/zod-openapi` is **superseded** for new OpenAPI work — use `hono-openapi` + `zod-to-openapi` instead.

## CF 2026 primitives (Agents/Dev Week — reach for these before rolling your own)

- **Flagship** — native CF feature-flag service (KV + DO, sub-ms eval). Evaluate before the custom D1 flag tables in `feature-flags.md` for new builds.
- **Cloudflare Agent Memory** — managed persistent agent memory (recall/forget over time); use for AI-native agents instead of hand-rolled state.
- **Outbound Workers for Sandboxes** — programmable zero-trust egress proxy; inject credentials + enforce policy without exposing tokens to untrusted/AI-generated code (pairs with `ai-agent-security.md`).
- **Artifacts** — git-compatible versioned storage for agent code/data outputs.
