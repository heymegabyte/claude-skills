---
name: "supervisor-skills-index"
priority: 4
pack: "core"
triggers: []
paths:
  - "*"
---

# Supervisor Skills Index

Brian's permanent supervisor knowledge system (2026-05-29). Entry point for every large-app build. Status: ✅ authored full · ◐ captured here (expand to full doc in a later wave) · ↪ substantially covered by an existing rule.

1. ✅ **`stack-selector`** — React=small sites; Angular=large apps (ProjectSites admin=Angular); React-in-Angular only as isolated justified integration.
2. ✅ **`angular-large-app-supervisor`** — Angular Router + lazy feature modules + strict TS + Spartan + CDK/Floating UI + Angular i18n + Zod + Formly + contract-first + 4-state + a11y + no-reload + observability + SSR/PWA + DoD.
3. ✅ **`spartan-ui-design-system`** — Spartan-only black/cyan/white compact cockpit + the reusable pattern library (shell/palette/tables/states/editors/charts).
4. ◐ **validation-error-handling-supervisor** — Zod everywhere (client + server + critical-flow re-validate); `@t3-oss/env-core` env; `zod-validation-error` readable msgs; `zod-to-json-schema` forms/docs/AI-tools; `libphonenumber-js`; structured server errors + safe user errors + correlation IDs; never leak secrets/stack-traces. ↪ extends `zod-everywhere` + `contract-first-ai` + `error-recovery`.
5. ◐ **forms-editors-content-supervisor** — Reactive Forms + NGX Formly + Zod; Monaco+Shiki (code/config/prompt), Lexical (rich text), GrapesJS (3rd visual editor view alongside code+preview), Payload CMS (real content mgmt), pdf-lib; versioned JSON editor state, Zod-validated, draft/publish, undo/redo, import/export, responsive preview. ↪ extends `bolt-diy-as-editor-foundation`.
6. ◐ **media-file-document-supervisor** — Uppy + cropper.js + compressor.js + Tesseract.js(OCR=untrusted) + PhotoSwipe + pdf-lib + postal-mime + web-push + dayjs; validate uploads/size/type, compress, previews, tenant-safe. ↪ extends `image-quality`.
7. ◐ **visualization-maps-diagrams-supervisor** — Mermaid(arch/ERD/docs), Excalidraw/tldraw(canvas), ECharts/Unovis(dashboards), @visx/visx(custom), Cytoscape(tenant/site/deploy graphs), MapLibre/h3-js/pmtiles(geo/local-SEO). Charts support decisions, not decoration.
8. ◐ **motion-interaction-supervisor** — Motion(most UI), Theatre.js(timeline-grade only), Rive(interactive vector), lottie-web(playback), Embla(carousel-only), SortableJS(ordering), FullCalendar(scheduling-only), Tippy.js(tooltips); `prefers-reduced-motion` always. ↪ extends `cinematic-ui-patterns`.
9. ◐ **collaboration-sync-supervisor** — Yjs(mature collab), Automerge(local-first), PartyKit/partyserver/partysocket(realtime rooms) — ONLY when realtime/multiplayer/offline/conflict-safe editing is real; version+validate+recover state.
10. ◐ **auth-permissions-security-supervisor** — Better Auth(where it fits) + @casl/ability(server-enforced perms) + @upstash/ratelimit; audit logs, API-key hashing, webhook-sig verify, tenant isolation, SSR/XSS-safe, sandbox dangerous exec. ↪ extends `full-autonomy` guardrails + `secret-provisioning` + `sandbox-execution`.
11. ✅ **notifications-email-webhooks-supervisor** — Novu is THE notification layer for every app + every FUTURE app: full inbox/center/preferences, in-app+email+push via adapters, triggers at every state transition (build/deploy/domain/AI/billing/team/workflow/content) not just errors, typed+Zod payloads, tenant-aware. svix (outbound webhook mgmt + sig verify + delivery + retries), postal-mime, web-push, Resend behind the Novu email adapter. react-email = React-only (reject in Angular). FULL standalone mandate.
12. ◐ **database-data-supervisor** — Cloudflare D1/KV/R2 default; @neondatabase/serverless + @upstash/redis + @upstash/ratelimit ADAPTER-ONLY where business-relevant; Typesense(search), Cube(analytics), NocoDB(DB-mgmt feature only), dayjs, pino; migrations+seed+tenant-isolation+idempotency+safe import/export. ↪ extends `hono-api` D1 patterns + `cloudflare-hostable-supervisor`.
13. ◐ **observability-ops-supervisor** — posthog-js + @sentry/angular + pino + OTel abstractions + Cube + Typesense; telemetry on major actions (privacy-aware names), frontend error capture, backend structured logs, request/trace/workflow/AI-trace IDs, audit logs, health panels; analytics optional for local repro. ↪ extends `auto-meta-work`.
14. ◐ **ai-agent-supervisor** — Vercel AI SDK(streaming/tools/structured/provider-abstraction), Ollama/vLLM(local/self-host), transformers.js, LangChain.js/LlamaIndex.js(only if they cut complexity), assistant-ui(only where it fits); Cloudflare AI Gateway/Vectorize/Sandbox behind adapters. AI enhances, deterministic UX primary; every output Zod-validated + fallback + traced. ↪ extends `contract-first-ai` + `evals`.
15. ◐ **workflow-automation-supervisor** — Inngest / Cloudflare Workflows(+Dynamic) + Svix + Playwright + Crawlee for deploys/imports/crawls/AI-jobs/notifications/billing/scheduled ops; every workflow: typed input + Zod + status + retries + idempotency + logs + trace-id + progress + admin debug panel. Crawlee=backend-only (never in frontend bundle), validate/sanitize crawled content, respect robots/legal/rate-limits/authorization, store runs w/ status+logs+artifacts+trace-id. ↪ extends `event-sourced-build-progress` + `sandbox-execution`.
16. ◐ **crawling-testing-browser-supervisor** — Vitest(units), Playwright/@playwright/test(E2E+automation), Crawlee(OSS crawl/import), Firecrawl/browser-use(only if license/deploy fit); fixtures+mocks+reproducible CI. ↪ extends `e2e-tdd-organization` + `verification-loop`.
17. ◐ **cloudflare-hostable-supervisor** — favor Workers/Pages compat; isolate CF-specific (Workflows/Dynamic/Sandbox/Vectorize/AI-Gateway/edge) behind adapters; document portable-vs-CF; keep local dev reproducible; use CF features only when they clearly help. ↪ extends `05-architecture-and-stack`.
18. ✅ **`package-preference-registry`** — every preferred package + install-now/defer/adapter-only/reject decision (the package-decision matrix).

## Discipline (applies to all)

Listing ≠ installing. Per-package: already-have? · truly-needed? · license(OSS/free only) · Angular/SSR compat · bundle/perf · CF compat · lighter-option? → install/defer/adapter/reject + document. NEVER: paid/pro-only, proprietary kits, non-commercial licenses, duplicate libs, demos-as-features, shallow integrations.

## Expansion plan

◐ entries are real doctrine NOW (usable + crosslinked). Net-new ones (forms-editors, media, viz, motion, collab, notifications, ai-agent, workflow, crawling-testing, cloudflare-hostable) get expanded to standalone full docs in subsequent waves; validation/auth/observability/database substantially live in the ↪ rules already.
