# Skill Router

Route prompts to smallest useful subset. Load `01-operating-system` FIRST always, then add categories and reference docs matching the task. On-demand > eager loading.

## Category Map

- **01 — Operating System** — `ai-native-coding`, `architecture-thought-loop`, `autonomous-orchestrator`, `one-line-saas`, `output-compression`, `context-engineering`
- **02 — Goal and Brief** — —
- **03 — Planning and Research** — `build-breaking-rules`, `competitive-analysis`
- **04 — Preference and Memory** — `brian-decision-model`, `brian-voc-data`, `wisdom-and-human-psychology`
- **05 — Architecture and Stack** — `ai-technology-integration`, `api-design-and-documentation`, `auth-and-session-management`, `auth0-token-vault`, `background-jobs-and-workflows`, `cf-2026-updates`, `cf-agents-do-pattern`, `cf-auto-provision`, `cf-browser-rendering`, `cf-do-rate-limiter`, `cf-hyperdrive`, `cf-rag-vectorize-pattern`, `cf-saas-template-stack`, `cf-websocket-do-pattern`, `cf-workflows-pattern`, `cf-zero-trust-access`, `coolify-docker-proxmox`, `drizzle-orm-and-migrations`, `dynamic-sitemap-from-d1`, `enterprise-multi-tenancy`, `heartbeat-polling`, `mcp-and-cloud-integrations`, `multi-tenant-subdomain-provisioning`, `openapi-generation`, `shared-api-pool`
- **06 — Build and Slice Loop** — `admin-dashboard`, `ai-chat-widget`, `blog-and-content-engine`, `chat-native-dashboard`, `contact-forms-and-endpoints`, `copilot-and-ai-features`, `custom-error-pages`, `data-tables`, `domain-provisioning`, `easter-eggs`, `empty-states-and-loading`, `file-uploads-and-storage`, `internationalization`, `keyboard-shortcuts-and-command-palette`, `microcopy-library`, `notification-center`, `notification-system`, `onboarding-and-first-run`, `pre-digested-builds`, `pwa-kit`, `realtime-and-websockets`, `rich-text-editor`, `site-search`, `stripe-first-donations`, `web-manifest-system`, `webhook-system`
- **07 — Quality and Verification** — `accessibility-gate`, `adversarial-testing`, `agentic-security`, `audio-video-sync`, `chrome-and-browser-workflows`, `completeness-verification`, `computer-use-automation`, `contract-testing`, `e2e-accumulation`, `eval-driven-development`, `evidence-collection`, `llm-evals`, `performance-optimization`, `picovoice-eagle-biometric`, `security-hardening`, `semgrep-codebase-rules`, `slop-detection`, `spec-driven-development`, `stagehand-ai-fallback`, `stagehand-ai-testing`, `tdd-verification`, `testing-matrices`, `ui-completeness-sweep`, `visual-inspection-loop`, `visual-regression`, `wcag-2-2-2026`
- **08 — Deploy and Runtime** — `backup-and-disaster-recovery`, `changelog-and-releases`, `ci-cd-pipeline`, `critical-css`, `font-subsetting`, `gh-fix-ci`, `launch-day-sequence`, `pipeline-health-check`, `r2-lifecycle`, `service-worker`, `uptime-and-health`
- **09 — Brand and Content** — `ai-search-geo`, `documentation-and-codebase-hygiene`, `email-templates`, `grammar-audit`, `per-route-metadata`, `seo-and-keywords`, `social-automation`
- **10 — Experience and Design** — `cinematic-doctrine`, `design-tokens`
- **11 — Motion and Interaction** — —
- **12 — Media Orchestration** — `30-ideogram-methods`, `compression-pipeline`, `image-optimization`, `image-profiling`, `lightbox-classifier`, `media-prompts`, `notebooklm-pipeline`, `og-card-pipeline`, `og-image-generation`, `social-brand-hex`, `technical-diagramming`
- **13 — Observability and Growth** — `activation-funnel`, `analytics-configuration`, `conversion-optimization`, `email-marketing-and-listmonk`, `feature-flags-and-experiments`, `mcp-server-registry`, `sentry-alert-rules`, `square-payments`, `stripe-billing`, `user-feedback-collection`, `workers-tracing-otlp`
- **14 — Independent Idea Engine** — —
- **15 — Site Generation** — `bolt-artifact-protocol`, `build-prompts`, `domain-features`, `homepage-block-library`, `local-seo`, `media-acquisition`, `non-technical-owner-onboarding`, `page-set-expansion`, `pseo-templates`, `quality-gates`, `research-pipeline`, `small-business-mode`, `source-fidelity-loop`, `template-improvements-100`, `template-system`
- **16 — Cinematic Website Prime Directive** — —
- **17 — Non-Engineering Verticals** — `c-suite-personas`, `compliance-os`, `finance-domain`, `pm-domain`
- **18 — Document Processing** — `docx-xlsx`, `pdf-generation`, `pdf-parsing`, `pptx-generation`
- **19 — MCP Authoring** — `forge-mcp-from-openapi`, `http-server-on-workers`, `stdio-server-template`
- **20 — Superpowers** — `brainstorming`, `writing-plans`, `subagent-driven-development`, `using-git-worktrees`, `finishing-a-development-branch`, `requesting-code-review`, `receiving-code-review`, `writing-skills` — process discipline vendored from obra/Superpowers (MIT); TDD/debug/verify/parallel folded into `rules/`

## Task Routing

- **Doctrinal principles** → `rules/agent-resilience-discipline`, `rules/backwards-compatibility-removal-cadence`, `rules/blast-radius-minimization`, `rules/conditional-ci-gates`, `rules/cost-per-request-accountability`, `rules/customer-facing-changelog`, `rules/data-residency-by-default`, `rules/error-budget`, `rules/fail-fast-build-fail-soft-prod`, `rules/mcp-auth-options`, `rules/mcp-error-semantics`, `rules/one-way-two-way-doors`, `rules/pii-handling-discipline`, `rules/portable-audit-discipline`, `rules/production-observability-default-on`, `rules/root-cause-validator-findings`, `rules/state-is-the-enemy`, `rules/structured-logging`, `rules/supply-chain-integrity`, `rules/sync-ui-async-backing`, `rules/ttfr-north-star`, `rules/uuid-version-discipline`, `rules/validator-precision-discipline`, `rules/vendor-risk-tiering`, `rules/webhook-as-skill-pattern`, `rules/working-backwards`
- **New project** → `02`, `03`, `05`, `06`, `09`
- **Build feature** → `05`, `06`, `07`
- **Debug / CI failure** → `07`, `08` — especially `gh-fix-ci`, `spec-driven-development`
- **Deploy / launch** → `08` — add `09` if SEO/content changed
- **Design / frontend polish** → `09`, `10`, `11`, `12`
- **SEO / copy** → `09` — add `06/blog-and-content-engine` or `13/analytics-configuration` when relevant
- **Billing / auth** → `05/auth-and-session-management`, `05/enterprise-multi-tenancy`, `06/webhook-system`, `13/stripe-billing`
- **File uploads / admin / data grids** → `06/file-uploads-and-storage`, `admin-dashboard`, `data-tables`
- **Realtime / AI features** → `05/ai-technology-integration`, `06/realtime-and-websockets`, `ai-chat-widget`, `copilot-and-ai-features`
- **Growth / analytics** → `13` — add `09/social-automation` when publishing
- **Brainstorm / ideas** → `20` brainstorming (process, before ANY creative work), `14`, `03`
- **Plan / code review / worktree / finish branch (process)** → `20` — `writing-plans`, `subagent-driven-development`, `using-git-worktrees`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`
- **Motion / animation** → `11`, `10`
- **Chat / messaging UI** → `06/chat-native-dashboard`, `06/realtime-and-websockets`, `06/notification-center`
- **Microcopy / UX writing** → `06/microcopy-library`, `09`
- **Evidence / screenshots** → `07/evidence-collection`, `07/visual-inspection-loop`
- **Enterprise / multi-tenant** → `05/enterprise-multi-tenancy`, `05/auth-and-session-management`, `13/stripe-billing`
- **Infra / self-hosted** → `05/coolify-docker-proxmox`, `05/cf-auto-provision`, `08/uptime-and-health`
- **Skills / config** → `01`, `04`
- **Iterative loop arcs / doctrinal extraction** → `rules/loop-driven-development`, `01/autonomous-orchestrator`, `rules/monitor-orchestration`
- **Security audit** → `07/agentic-security`, `07/security-hardening`, `07/semgrep-codebase-rules`
- **AI site generation** → `15` — add `09`, `10`, `12` for brand/design/media
- **Website rebuild / clone / "optimize {domain}" / "enhanced version of {site}"** → `15` (esp. `page-set-expansion`, `source-fidelity-loop`, `local-seo`), `16` (cinematic prime directive incl. rules 101-110), `09`, `12` — add `03` for deep research. Auto-applies `rules/source-site-enhancement.md` + `rules/i18n-by-demographics.md`.
- **CF Workers / Durable Objects / edge patterns** → `05/cf-agents-do-pattern`, `05/cf-do-rate-limiter`, `05/cf-websocket-do-pattern`, `05/cf-workflows-pattern`, `05/cf-zero-trust-access`, `05/cf-browser-rendering`, `05/cf-hyperdrive`
- **RAG / vector search / AI on Workers** → `05/cf-rag-vectorize-pattern`, `05/cf-agents-do-pattern`, `07/llm-evals`
- **PWA / service worker / manifest** → `06/pwa-kit`, `06/web-manifest-system`, `08/service-worker`
- **OG images / media pipeline** → `12/og-card-pipeline`, `12/og-image-generation`, `12/image-optimization`
- **MCP server authoring** → `19/forge-mcp-from-openapi`, `19/http-server-on-workers`, `19/stdio-server-template`
- **Document generation (PDF/DOCX/PPTX)** → `18`
- **Non-engineering domains (finance, PM, compliance)** → `17`
- **Payments (Square / Stripe)** → `13/square-payments`, `13/stripe-billing`, `06/stripe-first-donations`
- **Small business / local SEO** → `15/small-business-mode`, `15/local-seo`, `09/per-route-metadata`
- **Accessibility / WCAG** → `07/accessibility-gate`, `07/wcag-2-2-2026`
- **Programmatic SEO** → `15/pseo-templates`, `09/seo-and-keywords`, `09/ai-search-geo`
- **Workers tracing / observability** → `13/workers-tracing-otlp`, `13/analytics-configuration`, `13/sentry-alert-rules`

## File Hints

- `wrangler.toml`, `wrangler.jsonc` → `05`, `08`
- `schema.ts`, `drizzle/**` → `05/drizzle-orm-and-migrations`
- `.github/workflows/**` → `08/ci-cd-pipeline`, `gh-fix-ci`
- `*.spec.ts`, `*.test.ts` → `07`
- `*.css`, `*.scss` → `10`, `11`
- `blog/**`, `posts/**` → `06/blog-and-content-engine`, `09/seo-and-keywords`
- `api/webhooks/**` → `06/webhook-system`
- `api/stripe*` → `13/stripe-billing`
- `api/uploads/**` → `06/file-uploads-and-storage`
- `api/realtime/**` → `06/realtime-and-websockets`
- `inngest/**`, `*workflow*` → `05/background-jobs-and-workflows`, `05/cf-workflows-pattern`
- `durable-objects/**`, `*do.ts` → `05/cf-agents-do-pattern`, `05/cf-do-rate-limiter`, `05/cf-websocket-do-pattern`
- `*.component.ts`, `*.angular.ts` → `06`, `10`
- `og/**`, `og-image*` → `12/og-card-pipeline`, `12/og-image-generation`
- `fonts/**`, `*.woff2` → `08/font-subsetting`
- `sw.ts`, `service-worker*` → `08/service-worker`, `06/pwa-kit`
- `semgrep/**`, `.semgrepignore` → `07/semgrep-codebase-rules`
- `coolify/**`, `docker-compose*` → `05/coolify-docker-proxmox`
- `CLAUDE.md`, `.claude/**` → `01`
- `package.json`, `tsconfig.json` → `05`
- `**/container.ts`, `**/site-generation.ts`, `Dockerfile` → `15`, `05`
- `**/prompts/*.prompt.md` → `15`
- `**/*.pdf`, `**/*.docx`, `**/*.pptx` → `18`
- `vectorize/**`, `*embeddings*`, `*rag*` → `05/cf-rag-vectorize-pattern`
- `sitemap*` → `05/dynamic-sitemap-from-d1`, `09/per-route-metadata`
- `*mcp*`, `*tool-server*` → `19`

## Agent Library

`~/.agentskills/agents/`:

- `architect`
- `code-simplifier`
- `completeness-checker`
- `computer-use-operator`
- `deploy-verifier`
- `security-reviewer`
- `seo-auditor`
- `test-writer`
- `visual-qa`
- `dependency-auditor`
- `meta-orchestrator`
- `migration-agent`
- `content-writer`
- `performance-profiler`
- `incident-responder`
- `accessibility-auditor`
- `cost-estimator`
- `changelog-generator`
