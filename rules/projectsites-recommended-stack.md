---
last_reviewed: 2026-06-29
superseded_by: null
priority: 2
pack: core
triggers:
  - "projectsites"
  - "stack"
  - "package"
  - "library"
  - "tooling"
  - "selected package"
paths:
  - "concern:cloudflare-workers"
  - "org:website_build"
---

# ProjectSites.dev — Selected Package Policy

ProjectSites.dev is **Cloudflare-first + TypeScript-first**. Use ONLY the selected package families below unless a new tool is explicitly approved. Full status-tagged matrix + phased TODOs: repo `docs/STACK.md`. Binding infra doctrine: `[[projectsites-cloudflare-first]]`. Global package matrix: `[[package-preference-registry]]`.

## Selected packages

- **Backend/API:** Hono · Effect · Zod · hono-openapi · @hono/zod-openapi · zod-openapi · zod-to-openapi · Drizzle ORM · Drizzle Kit · OpenFGA · Unkey · OpenFeature · CloudEvents · DOMPurify.
- **Builder/editor/admin:** TanStack Virtual · Radix UI · shadcn/ui · cmdk · Storybook · Plate.js · React Flow / XYFlow · Monaco Editor · Satori · Shiki · GrapesJS (only when justified for HTML/email/template-builder) · NgRx + RxJS (Angular admin surfaces only).
- **Search:** Orama = default for **generated child-site** search (ships in the site bundle). **Platform/admin** search (submissions, sites, leads, logs) uses **Cloudflare AI Search (AutoRAG)** — CF-native, NOT Orama.
- **AI/LLM/observability:** MCP TypeScript SDK · Langfuse · LiteLLM (internal gateway service, not a per-app dep) · OpenTelemetry · Sentry.
- **Infrastructure:** OpenTofu.

## Companion package rule

Companion packages are allowed ONLY when tightly coupled to an approved tool — e.g. `drizzle-kit`/`drizzle-zod` with Drizzle · `@hono/zod-openapi`/`zod-to-openapi` with Hono+Zod · `jose` only if JWT/JWKS already required · `@tanstack/react-virtual` for TanStack Virtual · `@xyflow/react` for React Flow · `@monaco-editor/react` (React Monaco surface) · `@shikijs/monaco` (Shiki+Monaco) · `class-variance-authority`/`clsx`/`tailwind-merge` with shadcn/ui · `@ngrx/{store,effects,entity,signals,...}` where the Angular admin needs them · `@modelcontextprotocol/sdk` for the MCP server · OTel/`@sentry/*` SDKs matching the runtime · OpenTofu Cloudflare/Neon/Upstash/GitHub providers as the IaC needs.

## Do not add

- Duplicate libraries solving the same problem as a selected tool.
- Broad extra recommendations from prior brainstorming lists.
- Managed-service defaults that violate Cloudflare-first (GCP Cloud Run, Supabase, Firebase, random managed services).
- Fake integrations or placeholder code implying something works before it does.

## Implementation rules

- Prefer no DB → Cloudflare primitives → Neon-via-Hyperdrive (Postgres only) → Upstash (Redis only) → Fly.io (containers that don't fit CF).
- D1 before Neon; DO/KV/Queues/Workflows before Redis.
- Typed contracts + OpenAPI + schema validation + typed events + explicit authorization.
- Generated customer sites: performance, accessibility, SEO, low JS, safe HTML (DOMPurify), scalable per-site search (Orama); platform/admin search = Cloudflare AI Search.
- AI features: Langfuse traces + OpenTelemetry context + Sentry errors + prompt/version + cost + fallback metadata.
- Repo maintenance: concise docs, merge duplicate markdown, remove stale files, optimize for AI context.

## See

- repo `docs/STACK.md` — the canonical selected-tooling matrix + Phase 0–5 TODOs
- `[[projectsites-cloudflare-first]]` — binding infra doctrine
- `[[package-preference-registry]]` — global preferred-package matrix
