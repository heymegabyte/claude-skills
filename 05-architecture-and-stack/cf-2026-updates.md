# Cloudflare 2026 Platform Updates — Quick Reference

Pin this alongside the other `05-architecture-and-stack` submodules. Reflects the platform state as of May 2026.

## Workers Runtime

- **WorkerEntrypoint RPC** — default for service-to-service calls between Workers. Promise pipelining, 32 MiB payload limit, JSRPC compat date `2024-04-03`. Prefer over `fetch()`-over-HTTP service bindings.
- **Smart Placement** — no longer co-locates with D1 (D1 has global replicas now). Drop any guidance saying "enable Smart Placement when bound to D1."
- **Workers Builds** — recommended CI for new projects (native, GitHub/GitLab integration, PR checks, rollbacks, pnpm 10 support)
- **Gradual deployments** + Version Metadata binding — 1% → 10% → 100% traffic splits with `version_id`/`version_tag` access inside the Worker. mTLS bindings compatible.
- **Workers Automatic Tracing (OTLP)** open beta — `[observability] enabled = true` in `wrangler.jsonc`; free until Mar 1 2026 then billed
- **WebSocket payload up to 32 MiB** — both Workers and Durable Objects (2025-10-25)

## D1

- **Read replication GA** via the Sessions API — `db.withSession(bookmark)` for sequentially-consistent reads, no extra cost
- **Read-only queries auto-retry** (2025-09-11) — remove custom retry wrappers around SELECT/EXPLAIN
- **Storage cap** — 1 TB per account, 10 GB per database (raised from 250 GB)
- **Jurisdiction pinning** (2025-11-05) — set EU/FedRAMP at create time for compliance
- **Time Travel** — 30-day PIT recovery via `wrangler d1 time-travel restore`
- D1 has **no transactions** — use `db.batch([stmt1, stmt2])` for atomic multi-statement execution
- **D1 → R2** for long-term backups beyond 30 days

## R2

- **Infrequent Access storage class** + lifecycle transitions — default lifecycle Standard → IA after 30 days for backups/exports/old uploads
- **Event notifications → Queues** at 5,000 msg/sec — wire R2 → Queue → consumer Worker for thumbnailing/AV-scan/index instead of polling
- Cross-region replication available for compliance and latency

## Durable Objects

- **SQLite-backed DOs GA** (2025-04-07), 10 GB per DO, available on Free plan. Paid storage billing began 2026-01-07.
- New DOs default to `new_sqlite_classes` not `new_classes`
- **`DurableObjectNamespace.getByName(name)`** (2025-08-21) — replaces `idFromName` → `get` two-step pattern
- Alarms remain idempotent — handler must tolerate replay

## Workflows v2 (2026-05)

- 50,000 concurrent instances (was 4,500), 300 creates/sec, 2M queued per workflow
- Deterministic step-based execution — `step.do`, `step.sleep`, `step.waitForEvent`, `step.sleepUntil`
- New default for any agentic or long-running task

### Decision matrix

- **Workflows v2** — multi-step, deterministic, durable, agentic
- **Queues** — fan-out, fire-and-forget, R2 event ingestion
- **DO alarms** — per-entity scheduled work tied to entity state
- **Cron Triggers** — simple periodic tasks (sweeps, summaries)

## Vectorize

- 5M dimensions per index (was 200K)
- topK up to 100 (50 with values/metadata)
- 10 metadata indexes per index, 10 KiB metadata per vector

## Hyperdrive

- Now supports **MySQL + Postgres**, free on Workers Free
- Connection pooling and query caching included at no charge
- Front any external Postgres/MySQL with Hyperdrive — never direct connection

## AI Gateway

- `env.AI.run()` auto-routes through AI Gateway when configured
- Direct Anthropic via `https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/anthropic/v1/messages`
- Provides logging, caching, rate-limit, fallback
- Wire as the 4th observability pillar

## Containers

- `await env.MY_CONTAINER.fetch()` from a Worker spins a Docker container on demand
- Escape hatch for non-JS runtimes — Playwright headful, ffmpeg, Python ML, Java services
- GPU instances "coming soon"

## Wrangler / Config

- **`wrangler.jsonc`** — new default (not `.toml`). New features ship JSON-only.
- **`secrets.required`** — config property declares required secrets. Validated at `wrangler dev`/`deploy`/`vite dev`. Feeds `wrangler types`.
- **`wrangler types`** — supported way to get typed bindings (over `@cloudflare/workers-types`)
- **Remote bindings** via `remote: true` per binding — routes operations through Miniflare to real prod resources during dev. New default workflow — local code + remote bindings for hard-to-mock services (R2, AI, Vectorize).

## Clerk + Workers

- **Clerk M2M JWT tokens** (2026-02-24) — free, networkless verification for service-to-service identity
- `CLERK_JWT_KEY` PEM verification for zero-RTT session checks at the edge
- Use Clerk M2M instead of static API keys between Workers

## Drizzle v1 + RQBv2

- **RQBv2** — `with` for nested relations, JIT-compiled row mapper opt-in, single SQL query always
- `._query` removed for Postgres
- Pin Drizzle to v1.x

## Canonical Bindings Stack (saas-starter template)

- `d1_databases` — Sessions API enabled, jurisdiction-pinned if regulated
- `kv_namespaces` — CACHE (5min default TTL), CONFIG, RATE_LIMIT
- `r2_buckets` — UPLOADS (IA lifecycle 30d), BACKUPS (IA lifecycle 7d)
- `ai` — Workers AI gateway
- `hyperdrive` — for external Postgres/MySQL
- `vectorize_indexes` — for RAG
- `queues` — R2 event consumers
- `durable_objects` — `new_sqlite_classes` for entity state
- `containers` — non-JS workloads
- `assets` — Workers Assets binding
- `secrets` — `secrets.required` block enforces declaration
- `[observability] enabled = true` — Workers Tracing OTLP
