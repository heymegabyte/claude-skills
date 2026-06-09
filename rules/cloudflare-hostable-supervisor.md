---
name: "cloudflare-hostable-supervisor"
priority: 2
pack: "backend"
triggers:
  - "cloudflare"
paths:
  - "concern:cloudflare-workers"
---

# Cloudflare-Hostable Supervisor

Prefer systems that run on Cloudflare (Workers/Pages/D1/R2/KV/DO/Queues/Workflows/Vectorize/AI Gateway/Sandbox) without painting the product into a corner. Cloudflare-first is the default; every non-Cloudflare dependency hides behind an adapter so local dev stays reproducible and a swap never rewrites product code.

## When this fires

- Every architecture decision on a large app per `stack-selector`
- Every new external dependency from `package-preference-registry`
- Every "where does this run" question

## The doctrine

- **Cloudflare-first** — reach for the CF primitive before a third party per `cloudflare-lock-in-is-leverage`
- **Adapter-isolated** — Neon/Upstash/Stripe/etc. live behind a typed port; product code imports the port, never the vendor SDK directly
- **Reproducible local** — every adapter has a local/dev impl (Miniflare, local SQLite, in-memory) so `nx serve` works offline
- **Documented portability** — each adapter's README states: portable vs CF-specific, swap cost, local impl

## Adapter ports (canonical)

- `StoragePort` — R2 | S3 | local-fs
- `KvPort` — Workers KV | Upstash | in-memory
- `SqlPort` — D1 | Neon (via Hyperdrive) | local SQLite
- `QueuePort` — CF Queues | Upstash QStash | in-memory
- `AiPort` — Workers AI | AI Gateway → any provider | local Ollama
- `VectorPort` — Vectorize | pgvector (Neon) | in-memory
