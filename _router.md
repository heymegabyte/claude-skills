# Skill Router

Route prompts to the smallest useful subset. Load `01-operating-system` first, then add categories and reference docs that match the task. Prefer on-demand references over eager loading.

## Category Map

| # | Skill | Reference Docs |
|---|-------|----------------|
| 01 | Operating System | `ai-native-coding`, `architecture-thought-loop`, `autonomous-orchestrator`, `one-line-saas` |
| 02 | Goal and Brief | — |
| 03 | Planning and Research | `competitive-analysis` |
| 04 | Preference and Memory | `brian-decision-model`, `brian-voc-data`, `wisdom-and-human-psychology` |
| 05 | Architecture and Stack | `ai-technology-integration`, `api-design-and-documentation`, `auth-and-session-management`, `background-jobs-and-workflows`, `cf-auto-provision`, `coolify-docker-proxmox`, `drizzle-orm-and-migrations`, `mcp-and-cloud-integrations`, `openapi-generation`, `shared-api-pool` |
| 06 | Build and Slice Loop | `admin-dashboard`, `ai-chat-widget`, `blog-and-content-engine`, `contact-forms-and-endpoints`, `copilot-and-ai-features`, `custom-error-pages`, `data-tables`, `domain-provisioning`, `easter-eggs`, `empty-states-and-loading`, `file-uploads-and-storage`, `internationalization`, `keyboard-shortcuts-and-command-palette`, `microcopy-library`, `notification-center`, `notification-system`, `onboarding-and-first-run`, `realtime-and-websockets`, `rich-text-editor`, `site-search`, `web-manifest-system`, `webhook-system` |
| 07 | Quality and Verification | `accessibility-gate`, `adversarial-testing`, `chrome-and-browser-workflows`, `completeness-verification`, `computer-use-automation`, `contract-testing`, `e2e-accumulation`, `eval-driven-development`, `performance-optimization`, `security-hardening`, `semgrep-codebase-rules`, `slop-detection`, `spec-driven-development`, `stagehand-ai-testing`, `tdd-verification`, `testing-matrices`, `ui-completeness-sweep`, `visual-inspection-loop`, `visual-regression` |
| 08 | Deploy and Runtime Verification | `backup-and-disaster-recovery`, `changelog-and-releases`, `ci-cd-pipeline`, `critical-css`, `font-subsetting`, `gh-fix-ci`, `launch-day-sequence`, `service-worker`, `uptime-and-health` |
| 09 | Brand and Content System | `documentation-and-codebase-hygiene`, `email-templates`, `seo-and-keywords`, `social-automation` |
| 10 | Experience and Design System | `design-tokens` |
| 11 | Motion and Interaction System | — |
| 12 | Media Orchestration | `compression-pipeline`, `image-optimization`, `media-prompts`, `og-image-generation` |
| 13 | Observability and Growth | `analytics-configuration`, `email-marketing-and-listmonk`, `feature-flags-and-experiments`, `sentry-alert-rules`, `stripe-billing`, `user-feedback-collection` |
| 14 | Independent Idea Engine | — |

## Task Routing

| Task | Load |
|------|------|
| New project | `02-goal-and-brief`, `03-planning-and-research`, `05-architecture-and-stack`, `06-build-and-slice-loop`, `09-brand-and-content-system` |
| Build feature | `05-architecture-and-stack`, `06-build-and-slice-loop`, `07-quality-and-verification` |
| Debug / CI failure | `07-quality-and-verification`, `08-deploy-and-runtime-verification`, especially `gh-fix-ci` and `spec-driven-development` |
| Deploy / launch | `08-deploy-and-runtime-verification`, plus `09-brand-and-content-system` if SEO/content changed |
| Design / frontend polish | `09-brand-and-content-system`, `10-experience-and-design-system`, `11-motion-and-interaction-system`, `12-media-orchestration` |
| SEO / copy | `09-brand-and-content-system`, plus `06-build-and-slice-loop/blog-and-content-engine` or `13-observability-and-growth/analytics-configuration` when relevant |
| Billing / auth | `05-architecture-and-stack/auth-and-session-management`, `06-build-and-slice-loop/webhook-system`, `13-observability-and-growth/stripe-billing` |
| File uploads / admin / data grids | `06-build-and-slice-loop/file-uploads-and-storage`, `admin-dashboard`, `data-tables` |
| Realtime / AI features | `05-architecture-and-stack/ai-technology-integration`, `06-build-and-slice-loop/realtime-and-websockets`, `ai-chat-widget`, `copilot-and-ai-features` |
| Growth / analytics | `13-observability-and-growth`, plus `09-brand-and-content-system/social-automation` when publishing content |

## File Hints

| File Pattern | Load |
|--------------|------|
| `wrangler.toml`, `wrangler.jsonc` | `05-architecture-and-stack`, `08-deploy-and-runtime-verification` |
| `schema.ts`, `drizzle/**` | `05-architecture-and-stack/drizzle-orm-and-migrations` |
| `.github/workflows/**` | `08-deploy-and-runtime-verification/ci-cd-pipeline`, `gh-fix-ci` |
| `*.spec.ts`, `*.test.ts` | `07-quality-and-verification` |
| `*.css`, `*.scss` | `10-experience-and-design-system`, `11-motion-and-interaction-system` |
| `blog/**`, `posts/**` | `06-build-and-slice-loop/blog-and-content-engine`, `09-brand-and-content-system/seo-and-keywords` |
| `api/webhooks/**` | `06-build-and-slice-loop/webhook-system` |
| `api/stripe*` | `13-observability-and-growth/stripe-billing` |
| `api/uploads/**` | `06-build-and-slice-loop/file-uploads-and-storage` |
| `api/realtime/**` | `06-build-and-slice-loop/realtime-and-websockets` |

## Agent Library

Custom agents live in `~/.claude/agents/`. Current library: `architect`, `code-simplifier`, `completeness-checker`, `computer-use-operator`, `deploy-verifier`, `security-reviewer`, `seo-auditor`, `test-writer`, `visual-qa`, `dependency-auditor`, `meta-orchestrator`, `migration-agent`, `content-writer`, `performance-profiler`, `incident-responder`, `accessibility-auditor`, `cost-estimator`, `changelog-generator`.
