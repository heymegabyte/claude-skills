# Skill Profiles

Use `01-operating-system` as the policy layer, then pull the smallest profile that matches the repo or prompt. Do not preload every reference doc.

## Domain → Profile

| Pattern | Profile |
|---------|---------|
| `*-foundation`, `*-mission`, `*-charity`, `donate-*`, `give-*` | Nonprofit |
| `*-api`, `api.*`, `*-service`, `*-sdk` | API Service |
| `*-cli`, `*-tool`, `*-lib`, `*-plugin` | Developer Tool |
| `*-app`, `*-dashboard`, `*-portal`, `*-hub` | SaaS |
| everything else | Marketing Site |

Ambiguous repos: Angular or auth/billing flows usually mean SaaS. `wrangler.toml` plus minimal routes usually means Marketing Site or API Service. DB schema + background jobs usually means SaaS.

## Marketing Site

Load `02-goal-and-brief`, `03-planning-and-research`, `06-build-and-slice-loop/contact-forms-and-endpoints`, `custom-error-pages`, `domain-provisioning`, `easter-eggs`, `internationalization`, `web-manifest-system`, `09-brand-and-content-system/seo-and-keywords`, `email-templates`, `10-experience-and-design-system`, `11-motion-and-interaction-system`, `12-media-orchestration`.

## SaaS Application

Load all core categories plus these references first: `05-architecture-and-stack/api-design-and-documentation`, `auth-and-session-management`, `background-jobs-and-workflows`, `drizzle-orm-and-migrations`, `mcp-and-cloud-integrations`, `06-build-and-slice-loop/admin-dashboard`, `ai-chat-widget`, `data-tables`, `empty-states-and-loading`, `file-uploads-and-storage`, `keyboard-shortcuts-and-command-palette`, `notification-center`, `onboarding-and-first-run`, `realtime-and-websockets`, `rich-text-editor`, `site-search`, `webhook-system`, `07-quality-and-verification/accessibility-gate`, `performance-optimization`, `security-hardening`, `08-deploy-and-runtime-verification/ci-cd-pipeline`, `backup-and-disaster-recovery`, `uptime-and-health`, `09-brand-and-content-system/documentation-and-codebase-hygiene`, `seo-and-keywords`, `13-observability-and-growth/analytics-configuration`, `feature-flags-and-experiments`, `stripe-billing`, `user-feedback-collection`.

## Nonprofit

Load `02-goal-and-brief`, `03-planning-and-research`, `06-build-and-slice-loop/blog-and-content-engine`, `contact-forms-and-endpoints`, `domain-provisioning`, `easter-eggs`, `internationalization`, `web-manifest-system`, `09-brand-and-content-system/email-templates`, `seo-and-keywords`, `social-automation`, `13-observability-and-growth/stripe-billing`, `user-feedback-collection`.

## API Service

Load `03-planning-and-research`, `05-architecture-and-stack/api-design-and-documentation`, `auth-and-session-management`, `background-jobs-and-workflows`, `drizzle-orm-and-migrations`, `mcp-and-cloud-integrations`, `openapi-generation`, `shared-api-pool`, `06-build-and-slice-loop/realtime-and-websockets`, `webhook-system`, `07-quality-and-verification/performance-optimization`, `security-hardening`, `08-deploy-and-runtime-verification/backup-and-disaster-recovery`, `changelog-and-releases`, `ci-cd-pipeline`, `uptime-and-health`, `13-observability-and-growth/feature-flags-and-experiments`.

## Developer Tool

Load `03-planning-and-research`, `05-architecture-and-stack/api-design-and-documentation`, `mcp-and-cloud-integrations`, `07-quality-and-verification/security-hardening`, `semgrep-codebase-rules`, `08-deploy-and-runtime-verification/changelog-and-releases`, `ci-cd-pipeline`, `09-brand-and-content-system/documentation-and-codebase-hygiene`, `seo-and-keywords`, `12-media-orchestration`.

## Micro-SaaS

Load the SaaS profile, then trim to `05-architecture-and-stack/api-design-and-documentation`, `auth-and-session-management`, `drizzle-orm-and-migrations`, `06-build-and-slice-loop/contact-forms-and-endpoints`, `custom-error-pages`, `file-uploads-and-storage`, `notification-center`, `site-search`, `webhook-system`, `07-quality-and-verification/performance-optimization`, `security-hardening`, `09-brand-and-content-system/seo-and-keywords`, `13-observability-and-growth/email-marketing-and-listmonk`, `feature-flags-and-experiments`, `stripe-billing`.
