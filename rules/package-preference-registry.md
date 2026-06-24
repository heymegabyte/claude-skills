---
name: "package-preference-registry"
priority: 3
pack: "core"
triggers:
  - "package"
  - "library"
  - "dep"
paths:
  - "*"
---

# Package Preference Registry

Canonical preferred packages + decision discipline. **Listing ≠ installing.** Every dep needs a real business requirement. No bloat, demos-as-features, duplicate architectures, shallow integrations.

## Prime principle (OSS-first)

Prefer high-quality OSS that reduces implementation risk, improves user value, or creates reusable capabilities. Check: licensing, maintenance, API stability, security, tests, deployment fit. Liberal adoption of *recyclable, actively-maintained, typed, composable, testable, accessible, provider-agnostic* tools beats hand-rolling — but every candidate clears the decision gate below.

## Decision discipline (run for EVERY candidate)

1. Already have an equivalent? 2. Feature truly needs it? 3. License (free/OSS only — no paid/pro-only, no non-commercial, no proprietary UI kits). 4. Angular/SSR compatible? 5. Bundle/perf impact? 6. Cloudflare compatible (adapter where relevant)? 7. Lighter existing solution enough? → **install now · defer · adapter-only · reject** + document why.

## Hard NEVER

Paid/pro-only deps · proprietary UI kits · non-commercial licenses · duplicate libs for one purpose · demos masquerading as features · unmaintained libs.

## Decisions (✅ install now · ⏳ defer until feature exists · 🔌 adapter-only · ❌ reject)

### UI / components (Angular)

- ✅ **Spartan UI** — THE primary + only Angular component system (admin + marketing). shadcn-for-Angular, OSS, Tailwind-composed, owns-the-code.
- ✅ **Angular CDK** — overlays/drag-drop/virtual-scroll/a11y primitives.
- ✅ **Floating UI** — positioning for popovers/tooltips/menus.
- ⏳ **Tippy.js** — only if tooltip need exceeds Floating UI primitives.
- ⏳ **Embla Carousel** — only where carousel UX is genuinely valuable.
- ⏳ **SortableJS** — when drag-reorder is needed (saved views, list ordering).
- ⏳ **FullCalendar** — only where scheduling exists.
- ⏳ **PhotoSwipe** — only where real media galleries exist.
- ❌ PrimeNG / Angular Material / Taiga / NG-ZORRO / Kendo / Syncfusion — mixing kits / non-Spartan. (Reversed from PrimeNG 2026-05-29.)
- ❌ Ionic-as-web-UI — Ionic/Capacitor reserved for native mobile shells only.

### Tables / data UX

- ✅ **TanStack Table** — headless smart tables (sort/filter/group/column-vis), Spartan-styled. INSTALLED in projectsites.dev v2 (`@tanstack/angular-table ^8`, 2026-05-30): `createAngularTable(() => ({...}))` with signal-bound `state`/`onSortingChange`/`onGlobalFilterChange`; render rows manually from `table.getRowModel().rows` (read `row.original`) so custom cells (helm badges) stay simple — skip FlexRender for text/badge columns. Sortable `<th>` with `getToggleSortingHandler()` + `aria-sort`. Reference: `pages/admin-v2/sections/sites.component.ts`.
- ⏳ **TanStack Query** — server-state cache; adopt when client-cache complexity warrants.
- ⏳ **TanStack Virtual** — large lists/virtualized rows.
- ⏳ **AG Grid Community** — ONLY for heavy enterprise grids (100k+ rows); Community license; master/detail is Enterprise-only.

### Forms / validation

- ✅ **Zod** — every runtime boundary (core per `zod-everywhere`).
- ✅ **Angular Reactive Forms** — typed forms.
- ✅ **zod-validation-error** — human-readable error formatting.
- ✅ **zod-to-json-schema** — forms/docs/AI-tools/generated interfaces (keep alongside `zod-to-openapi`; different targets).
- ✅ **@t3-oss/env-core** — env-var validation.
- ⏳ **NGX Formly** — schema-driven forms where complexity justifies it.
- ⏳ **libphonenumber-js** — phone validation where phone inputs exist.

### API contracts / OpenAPI

- ✅ **@asteasolutions/zod-to-openapi** — DERIVE OpenAPI 3.x from Zod schemas (`extendZodWithOpenApi` + `OpenApiGeneratorV31`); never hand-maintain. Pairs with Stainless SDK-codegen + `zod-to-json-schema`.
- ✅ **hono-openapi** — OpenAPI serving layer for Hono: `describeRoute()` + `openAPISpecs(app)`. Supersedes `@hono/zod-openapi` for new work; use with `@hono/zod-validator` or its own resolver.

### Editors / content

- ✅ **Monaco Editor** — code/config/log/prompt editing + read-only viewers. INSTALLED in projectsites.dev v2 (site-detail logs viewer). **Angular+esbuild gotchas (hard-won):** (1) `import('monaco-editor')`'s CSS pulls `codicon.ttf` → esbuild fails "No loader for .ttf" → add `"loader": { ".ttf": "file" }` to the `@angular/build` builder options. (2) Read-only viewers need NO language worker — set `self.MonacoEnvironment = { getWorker: () => ({postMessage(){},addEventListener(){},removeEventListener(){},terminate(){},dispatchEvent:()=>false,onmessage:null,onmessageerror:null,onerror:null}) }` (a stub worker object) BEFORE `import('monaco-editor')` to kill the "could not create web worker" console warning + any worker-asset 404; monarch highlighting still runs main-thread. (3) Dynamic `import()` inside `afterNextRender` → own lazy chunk (monaco is ~5MB, never initial). `defineTheme('ps-cockpit', {base:'vs-dark', colors:{'editor.background':'#03070a',...}})`, `automaticLayout:false` + ResizeObserver, dispose on destroy. Reference: `pages/admin-v2/sections/code-viewer.component.ts`.
- ⏳ **Shiki** — lighter highlight where a full editor is overkill.
- ⏳ **Lexical** — rich text editor.
- ⏳ **GrapesJS** — third visual drag-and-drop editor view (alongside code + preview).
- ⏳ **Payload CMS** — only where content management is a real product feature.
- ⏳ **pdf-lib** — PDF generation/manipulation.
- 🔌 **Blockly** — only if a blocks/visual-logic need is real.

### Media / files

- ✅ **Uppy** (uploads) — INSTALLED in projectsites.dev v2 media section. **Lean-integration recipe:** use `@uppy/core` + `@uppy/xhr-upload` ONLY — NOT `@uppy/dashboard` (its CSS pulls fonts → esbuild asset pain). Wire native HTML5 drag-drop + a hidden file input → `uppy.addFile({name,type,data:file})`; `autoProceed:true` + XHRUpload `{ endpoint, method:'POST', fieldName:'file', formData:true, headers: (): Record<string,string> => token ? {Authorization:\`Bearer \${token}\`} : {} }`. Render progress/list with your own Spartan UI from Uppy events (`upload-progress`/`upload-success`/`upload-error`/`complete`). NOTE: a bare`<img>` can't send a Bearer, so for auth-gated raw endpoints show a metadata card (kind/size/status), not a thumbnail. Reference: `pages/admin-v2/sections/media.component.ts`.
- ⏳ **cropper.js** · **compressor.js** · **Tesseract.js** (OCR = untrusted output) — adopt per real media features.

### Diagrams / viz / maps

- ✅ **Apache ECharts** — dashboard chart lib (Apache-2.0). INSTALLED in projectsites.dev v2 (`echarts ^6.1.0`, 2026-05-30). **Lazy-load contract:** dynamic `import('echarts')` inside `afterNextRender` → own chunk (~1.16MB, never initial). Theme transparent canvas + helm hex; `prefers-reduced-motion` → `animation:false`; ResizeObserver + `dispose()` on destroy; `role="img"` + data-derived `aria-label`. Reference: `pages/admin-v2/sections/donut-chart.component.ts`.
- ⏳ **Mermaid** (arch/workflow/ERD/docs) · **Unovis** (alt dashboards) · **@visx/visx** (custom viz) · **Cytoscape** (dependency/tenant/site graphs) · **Excalidraw**/**tldraw** (canvas) · **MapLibre**/**h3-js**/**pmtiles** (geo/local-SEO). Charts support decisions, not decoration.

### Motion

- ✅ **Motion** — subtle, `prefers-reduced-motion`-gated.
- ⏳ **lottie-web** · 🔌 **Rive** · ❌ heavy **Theatre.js** unless a real cinematic need.

### Collaboration / sync

- ⏳ **Yjs** (mature collab editing) · **Automerge** (local-first) · **PartyKit**/**partyserver**/**partysocket** (realtime rooms) — ONLY when real multiplayer/offline/conflict-safe editing is needed.

### Auth / security

- ⏳ **Better Auth** — where it fits the auth model.
- ✅ **@casl/ability** — permissions/abilities (server-enforced).
- ⏳ **@upstash/ratelimit** — rate limiting (adapter).

### Notifications / email / webhooks

- ⏳ **Novu** — full notification center/inbox/preferences (in-app+email+push) when notifications are a feature.
- ⏳ **svix** — webhook management + signature verify.
- ⏳ **postal-mime** · **web-push**.
- ✅ **Amazon SES** — transactional email (SigV4 raw-send from Workers, zero npm dep) + ⏳ **listmonk** (self-hosted, relays via SES SMTP) for newsletters/campaigns.
- ❌ **Resend** (removed 2026-06-19).
- ✅ **react-email** (`@react-email/components` + `render()`) — ACCEPTED 2026-06-19 for (a) React/Vite sites and any React surface, and (b) **server-side transactional email templating** (`render()` returns HTML string, framework-agnostic — runs in the Worker, never imported into the Angular admin bundle). Pairs with SES/listmonk send path + Novu email adapter. Still ❌ inside the Angular admin SPA bundle.

### Database / backend / search / analytics

- 🔌 **@neondatabase/serverless** (Neon Postgres, via Hyperdrive) · **@upstash/redis** — adapter-only; keep local dev reproducible. Default stays Cloudflare D1/KV/R2.
- ⏳ **Typesense** (search) · **Cube** (analytics) · **NocoDB** (only where DB-management is a real product feature).
- ✅ **dayjs** (dates) · **pino** (structured logs).

### Observability / testing

- ✅ **@sentry/angular** (already wired) · **posthog-js** (already wired) · **Vitest** (units) · **@playwright/test** + **Playwright** (E2E + browser automation). OTel-compatible abstractions for traces.

### Payments

- 🔌 **stripe** — ONLY when billing is required (per `payments-routing`: Square for accept-money default; Stripe for SaaS billing/payouts). Behind adapter.

### Control-flow / FP

- ✅ **effect** — typed errors, retry/timeout/concurrency, DI for complex services/workflows. SPECIFIC surfaces only — not a wholesale rewrite. `effect/Schema` does NOT replace Zod at I/O boundaries; Zod stays SSOT. Adopt per-service; Workers-compatible ESM.

### AI / agents

- ✅ **Cloudflare Agents SDK** (`agents` npm — [cloudflare/agents](https://github.com/cloudflare/agents)) — THE preferred framework for stateful AI agents on Workers. Durable-Object-backed `Agent` class, built-in state + SQL storage, WebSocket/SSE streaming, scheduled tasks, human-in-the-loop, `McpAgent` for remote MCP servers, React hooks (`agents/react`). First reach for any agent/chat/MCP-server build per `cloudflare-lock-in-is-leverage`. Skills: `cloudflare:agents-sdk`, `cloudflare:build-agent`, `cloudflare:build-mcp`.
- ✅ **Cloudflare agents-starter** ([cloudflare/agents-starter](https://github.com/cloudflare/agents-starter)) — THE preferred starter template for a new agent app (Workers + Agents SDK + chat UI + tool-calling + scheduling). `git clone` / `npm create cloudflare -- --template cloudflare/agents-starter` instead of scaffolding by hand.
- ✅ **Cloudflare Containers** (`@cloudflare/containers` — [cloudflare/containers](https://github.com/cloudflare/containers)) — THE preferred way to run containerized apps/workloads alongside Workers. `Container` class on a Durable Object — `sleepAfter` idle hibernation, auto-restart, per-instance routing. Use for any "needs a real container" app before reaching for external container hosts.
- ⏳ **Vercel AI SDK** (streaming/tool-calling/structured-output/provider abstraction — has Angular hooks) · **assistant-ui** (only where an assistant UI truly fits).
- 🔌 **Cloudflare AI Gateway**/**Vectorize**/**Sandbox SDK** (adapter-only).
- ⏳ **Ollama**/**vLLM**/**transformers.js** (prefer local/self-host where practical).
- ⏳ **LangChain.js**/**LlamaIndex.js** ONLY where they reduce complexity. Every AI output Zod-validated + fallback + traced per `contract-first-ai`+`ai-agent-supervisor`.

### Crawling / workflows / automation

- ⏳ **Inngest** / **Cloudflare Workflows** (+ Dynamic) — deploys/imports/crawls/AI-jobs/notifications/billing/scheduled ops; typed input + Zod + status + retries + trace-id + idempotency.
- ⏳ **Crawlee** (OSS crawl/import).
- 🔌 **Firecrawl**/**browser-use** — only if license/deployment fit.

## Per-package full-detail template (fill as each is adopted)

`purpose · philosophy · when to use · when NOT · setup/config · advanced APIs · pitfalls · license · ProjectSites relevance · install now/later/adapter`
