# System Inventory

Complete file listing for the Claude Code skills system.
Audit date: 2026-04-19

## Layer Definitions

| Layer | Purpose |
|-------|---------|
| **Kernel** | Supreme policy, conflict resolution, operating rules |
| **Product Compiler** | Skills that transform a prompt into a deployed product |
| **Capability Pack** | Domain-specific feature knowledge (Stripe, SEO, etc.) |
| **Release Pipeline** | Deploy, verify, monitor, iterate |
| **Meta** | Documentation, routing, profiles, config |

---

## /Users/apple/.agentskills/ (Skills Repository)

### Meta / Routing Files

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `_router.md` | 104 | Deterministic skill routing decision tree | Meta |
| `README.md` | 240 | System overview, architecture, execution flow | Meta |
| `CONVENTIONS.md` | 269 | Shared constants: brand, deploy, secrets, patterns | Meta |
| `SKILL_PROFILES.md` | 289 | Project-type to skill-subset mapping (6 profiles) | Meta |
| `MASTER_PROMPT.md` | 189 | Best master prompt for system activation | Meta |
| `QUICK_REF.md` | 95 | One-page cheat sheet for simple tasks | Meta |
| `STYLE_GUIDES.md` | 120 | Compact rules from top style guides | Meta |
| `CHANGELOG.md` | 84 | Skills system version history | Meta |
| `llms.txt` | 87 | Machine-readable skill index | Meta |

### Scripts

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `scripts/discover-secrets.sh` | 78 | Runtime secret discovery across all sources | Release Pipeline |
| `scripts/gpt4o-vision-analyze.sh` | 45 | Single screenshot GPT-4o vision analysis | Release Pipeline |
| `scripts/visual-tdd-loop.sh` | 102 | Full visual TDD automation loop | Release Pipeline |

### Skill Directories (Active — 49 numbered + 1 unnumbered)

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `01-operating-system/SKILL.md` | 564 | Supreme policy, autonomy, emphasis, done definitions | Kernel |
| `02-goal-and-brief/SKILL.md` | 202 | Project thesis, users, success criteria | Product Compiler |
| `03-planning-and-research/SKILL.md` | 277 | Research, planning, decomposition, parallelism | Product Compiler |
| `04-preference-and-memory/SKILL.md` | 279 | VoC, preferences, confidence levels, memory | Kernel |
| `05-architecture-and-stack/SKILL.md` | 453 | Platform selection, services, auth, data patterns | Product Compiler |
| `06-build-and-slice-loop/SKILL.md` | 415 | Vertical slices, anti-placeholder, code quality | Product Compiler |
| `07-quality-and-verification/SKILL.md` | 1011 | Testing, security, accessibility, performance, visual QA | Release Pipeline |
| `08-deploy-and-runtime-verification/SKILL.md` | 372 | Deploy, purge, verify live, rollback | Release Pipeline |
| `09-brand-and-content-system/SKILL.md` | 494 | Copy, brand extraction, trust, legal, tone | Product Compiler |
| `10-experience-and-design-system/SKILL.md` | 531 | Typography, color, layout, components, anti-slop | Product Compiler |
| `11-motion-and-interaction-system/SKILL.md` | 472 | Transitions, scroll, hover, reduced-motion | Product Compiler |
| `12-media-orchestration/SKILL.md` | 715 | Images, video, logos, social previews, critique | Product Compiler |
| `12-media-orchestration/templates/PROMPTS.md` | 290 | Reusable media generation prompts | Product Compiler |
| `13-observability-and-growth/SKILL.md` | 430 | Analytics, Sentry, Stripe, email, experiments | Capability Pack |
| `14-independent-idea-engine/SKILL.md` | 394 | Autonomous research, proposals, defect discovery | Product Compiler |
| `15-easter-eggs/SKILL.md` | 125 | Hidden delights via URL params | Capability Pack |
| `16-domain-provisioning/SKILL.md` | 164 | Auto-provision CF Worker, DNS, placeholder | Product Compiler |
| `17-competitive-analysis/SKILL.md` | 173 | Scrape competitors, extract features/pricing | Product Compiler |
| `18-stripe-billing/SKILL.md` | 232 | Payments: free + pro, donations | Capability Pack |
| `19-email-templates/SKILL.md` | 192 | Branded transactional email via Resend | Capability Pack |
| `20-accessibility-gate/SKILL.md` | 349 | WCAG AA, axe-core, focus styling | Release Pipeline |
| `24-web-manifest-system/SKILL.md` | 246 | PWA manifest, sitemap, robots, meta files | Capability Pack |
| `26-shared-api-pool/SKILL.md` | 139 | Centralized API keys, Coolify services | Capability Pack |
| `27-social-automation/SKILL.md` | 144 | Auto-post via Postiz on deploy | Capability Pack |
| `28-seo-and-keywords/SKILL.md` | 596 | Keyword research, Yoast rules, schema markup | Capability Pack |
| `29-documentation-and-codebase-hygiene/SKILL.md` | 371 | README, CLAUDE.md, JSDoc, stale removal | Meta |
| `30-ai-native-coding/SKILL.md` | 347 | AI-optimized code patterns, full-stack integration | Product Compiler |
| `31-custom-error-pages/SKILL.md` | 154 | Branded 404, 500, 503, offline pages | Capability Pack |
| `32-contact-forms-and-endpoints/SKILL.md` | 210 | Working forms: Turnstile, Zod, Resend | Capability Pack |
| `33-blog-and-content-engine/SKILL.md` | 144 | SEO blog: markdown, RSS, categories | Capability Pack |
| `34-launch-day-sequence/SKILL.md` | 145 | Go-live checklist: sitemap, announce, verify | Release Pipeline |
| `35-ci-cd-pipeline/SKILL.md` | 219 | GitHub Actions: deploy on push, E2E on PR | Release Pipeline |
| `36-onboarding-and-first-run/SKILL.md` | 129 | Welcome flow, checklist, activation tracking | Capability Pack |
| `37-site-search/SKILL.md` | 491 | CF AI Search, Cmd+K modal, auto-indexing | Capability Pack |
| `38-uptime-and-health/SKILL.md` | 198 | Health endpoints, monitoring, status page | Release Pipeline |
| `39-changelog-and-releases/SKILL.md` | 144 | Auto-changelog, GitHub Releases, versioning | Release Pipeline |
| `40-backup-and-disaster-recovery/SKILL.md` | 250 | Single-zip restore, cron backups to R2 | Release Pipeline |
| `41-user-feedback-collection/SKILL.md` | 250 | In-app widget, NPS, testimonial moderation | Capability Pack |
| `42-internationalization/SKILL.md` | 149 | EN+ES minimum, AI translate, hreflang | Capability Pack |
| `43-ai-chat-widget/SKILL.md` | 172 | Workers AI + Vectorize RAG chat widget | Capability Pack |
| `44-drizzle-orm-and-migrations/SKILL.md` | 207 | Drizzle ORM for D1/Neon, schema conventions | Product Compiler |
| `45-webhook-system/SKILL.md` | 184 | Stripe/Clerk/GitHub webhooks, idempotency | Capability Pack |
| `46-admin-dashboard/SKILL.md` | 161 | Lightweight /admin with bolt.diy editor | Capability Pack |
| `47-keyboard-shortcuts-and-command-palette/SKILL.md` | 145 | Cmd+K palette, ? shortcuts overlay | Capability Pack |
| `48-empty-states-and-loading/SKILL.md` | 166 | Action prompts, skeleton screens | Capability Pack |
| `49-notification-system/SKILL.md` | 177 | OneSignal push + in-app bell + email fallback | Capability Pack |
| `50-coolify-docker-proxmox/SKILL.md` | 237 | Self-hosted infra: Coolify API, Docker, Proxmox | Capability Pack |
| `51-wisdom-and-human-psychology/SKILL.md` | 530 | Cialdini, Kahneman, servant leadership, ethics | Kernel |
| `52-mcp-and-cloud-integrations/SKILL.md` | 436 | MCP servers, secrets discovery, cloud APIs | Capability Pack |
| `53-autonomous-orchestrator/SKILL.md` | 413 | Master orchestration, parallel agents, completion | Kernel |
| `54-computer-use-automation/SKILL.md` | 258 | Desktop automation via Computer Use MCP | Capability Pack |
| `55-chrome-and-browser-workflows/SKILL.md` | 228 | Browser automation via Chrome/Playwright MCP | Capability Pack |
| `56-completeness-verification/SKILL.md` | 237 | Vision-loop done detector, convergence test | Release Pipeline |
| `57-ai-technology-integration/SKILL.md` | 322 | AI APIs, models, visual TDD, generation | Product Compiler |
| `gh-fix-ci/SKILL.md` | 69 | Debug failing GitHub Actions PR checks | Release Pipeline |

### Archive (v3 — superseded)

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `.archive/v3/always-deploy-and-test/SKILL.md` | 72 | Superseded by 08 | (archived) |
| `.archive/v3/api-key-helper/SKILL.md` | 437 | Superseded by 05 | (archived) |
| `.archive/v3/auto-logo/SKILL.md` | 198 | Superseded by 12 | (archived) |
| `.archive/v3/base-layer/SKILL.md` | 370 | Superseded by 01+05+06 | (archived) |
| `.archive/v3/beyond-the-prompt/SKILL.md` | 198 | Superseded by 01+02 | (archived) |
| `.archive/v3/cloudflare-deploy/SKILL.md` | 224 | Superseded by 05+08 | (archived) |
| `.archive/v3/deploy-and-verify/SKILL.md` | 76 | Superseded by 08 | (archived) |
| `.archive/v3/doc/SKILL.md` | 80 | Superseded by 09 | (archived) |
| `.archive/v3/frontend-design/SKILL.md` | 71 | Superseded by 10+11 | (archived) |
| `.archive/v3/gh-address-comments/SKILL.md` | 100 | Superseded by 07 | (archived) |
| `.archive/v3/gh-fix-ci/SKILL.md` | 69 | Superseded by gh-fix-ci | (archived) |
| `.archive/v3/google-analytics/SKILL.md` | 391 | Superseded by 13 | (archived) |
| `.archive/v3/imagegen/SKILL.md` | 279 | Superseded by 12 | (archived) |
| `.archive/v3/listmonk/SKILL.md` | 275 | Superseded by 13 | (archived) |
| `.archive/v3/new-project-bootstrap/SKILL.md` | 141 | Superseded by 02+06 | (archived) |
| `.archive/v3/pdf/SKILL.md` | 67 | Superseded by 09 | (archived) |
| `.archive/v3/playwright-tdd/SKILL.md` | 166 | Superseded by 07 | (archived) |
| `.archive/v3/quality-gate/SKILL.md` | 106 | Superseded by 07 | (archived) |
| `.archive/v3/security-best-practices/SKILL.md` | 74 | Superseded by 07 | (archived) |
| `.archive/v3/sentry/SKILL.md` | 123 | Superseded by 13 | (archived) |
| `.archive/v3/sora/SKILL.md` | 178 | Superseded by 12 | (archived) |
| `.archive/v3/stripe-checkout/SKILL.md` | 112 | Superseded by 13 | (archived) |
| `.archive/v3/test-on-production/SKILL.md` | 61 | Superseded by 08 | (archived) |
| `.archive/v3/visual-qa/SKILL.md` | 111 | Superseded by 07 | (archived) |

### Plugin

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `.claude-plugin/plugin.json` | 24 | Claude Code plugin manifest | Meta |

---

## /Users/apple/.claude/ (Claude Code Configuration)

### Core Config

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `CLAUDE.md` | 89 | Global user instructions (Emdash OS v5) | Kernel |
| `settings.json` | 279 | Claude Code harness settings, hooks config | Meta |
| `settings.local.json` | 11 | Local settings overrides | Meta |
| `keybindings.json` | 11 | Custom keyboard shortcuts | Meta |
| `.mcp.json` | 9 | MCP server connection config | Meta |
| `policy-limits.json` | 12 | Policy limits config | Meta |
| `loop.md` | 1 | Loop mode prompt | Meta |

### Rules (Global — apply to all projects)

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `rules/always.md` | 25 | Brand, deploy, secrets, quality gates | Kernel |
| `rules/brian-preferences.md` | 54 | Communication and output preferences | Kernel |
| `rules/code-style.md` | 23 | TypeScript + Angular style rules | Product Compiler |
| `rules/computer-use-safety.md` | 23 | Safety rules for desktop automation | Kernel |
| `rules/copy-writing.md` | 15 | Copy voice rules (Mailchimp + GOV.UK) | Product Compiler |
| `rules/deployment.md` | (in CLAUDE.md context) | Deploy rules | Release Pipeline |
| `rules/error-recovery.md` | 26 | Self-healing decision tree | Kernel |
| `rules/hono-api.md` | 13 | Hono API best practices | Product Compiler |
| `rules/mcp-rate-limits.md` | 20 | MCP service rate limits and tool priority | Meta |
| `rules/quality-metrics.md` | 73 | Quantitative thresholds for all metrics | Release Pipeline |
| `rules/testing.md` | 12 | Playwright + Vitest rules | Release Pipeline |

### Agents (Spawnable sub-agents)

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `agents/computer-use-operator.md` | 63 | Native macOS app automation | Capability Pack |
| `agents/deploy-verifier.md` | 37 | Post-deploy smoke tests at 6 breakpoints | Release Pipeline |
| `agents/security-reviewer.md` | 56 | OWASP audit of code changes (read-only) | Release Pipeline |
| `agents/seo-auditor.md` | 51 | SEO compliance check per page | Release Pipeline |
| `agents/test-writer.md` | 45 | Generate Vitest + Playwright tests | Release Pipeline |
| `agents/visual-qa.md` | 69 | Screenshot-based visual defect detection | Release Pipeline |

### Hooks (Automated behaviors)

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `hooks/audit-log.sh` | 18 | Log tool invocations for audit trail | Meta |
| `hooks/computer-use-safety.sh` | 19 | Safety checks before computer-use actions | Kernel |
| `hooks/post-compact.sh` | 34 | Preserve context after compaction | Meta |
| `hooks/session-end-learn.sh` | (not counted) | Learn from session end | Meta |
| `hooks/session-start.sh` | (not counted) | Session initialization | Meta |

### Commands (Symlinks to skills)

| Path | Target | Purpose | Layer |
|------|--------|---------|-------|
| `commands/accessibility` | `20-accessibility-gate` | Slash command shortcut | Meta |
| `commands/deploy` | `08-deploy-and-runtime-verification` | Slash command shortcut | Meta |
| `commands/design` | `10-experience-and-design-system` | Slash command shortcut | Meta |
| `commands/drizzle` | `44-drizzle-orm-and-migrations` | Slash command shortcut | Meta |
| `commands/gh-fix-ci` | `gh-fix-ci` | Slash command shortcut | Meta |
| `commands/launch` | `34-launch-day-sequence` | Slash command shortcut | Meta |
| `commands/media` | `12-media-orchestration` | Slash command shortcut | Meta |
| `commands/observability` | `13-observability-and-growth` | Slash command shortcut | Meta |
| `commands/operating-system` | `01-operating-system` | Slash command shortcut | Meta |
| `commands/quality-gate` | `07-quality-and-verification` | Slash command shortcut | Meta |
| `commands/seo` | `28-seo-and-keywords` | Slash command shortcut | Meta |
| `commands/stripe` | `18-stripe-billing` | Slash command shortcut | Meta |
| `commands/wisdom` | `51-wisdom-and-human-psychology` | Slash command shortcut | Meta |

### Output Styles

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `output-styles/concise.md` | 12 | Concise output mode config | Meta |
| `output-styles/verbose.md` | 11 | Verbose output mode config | Meta |

### Plugins

| Path | Lines | Purpose | Layer |
|------|-------|---------|-------|
| `plugins/blocklist.json` | 16 | Blocked plugins | Meta |
| `plugins/installed_plugins.json` | 67 | Installed plugin registry | Meta |
| `plugins/known_marketplaces.json` | 17 | Plugin marketplace URLs | Meta |

### Symlink

| Path | Target | Purpose |
|------|--------|---------|
| `skills` (symlink) | `/Users/apple/.agentskills` | Makes skills discoverable at `~/.claude/skills/` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Active numbered skill directories | 49 (01-57, gaps at 21-23, 25) |
| Unnumbered skill directories | 1 (gh-fix-ci) |
| **Total active skills** | **50** |
| Archived skills (v3) | 24 |
| Meta/routing files | 9 |
| Scripts | 3 |
| Rules files | 10 |
| Agent definitions | 6 |
| Hooks | 5 |
| Commands (symlinks) | 13 |
| Output styles | 2 |
| Total skill lines (active) | ~15,408 |
| Total meta lines | ~1,477 |
| Total system lines (excl. archive) | ~17,400 |

### Layer Distribution

| Layer | Files | Lines |
|-------|-------|-------|
| Kernel | 5 skills + CLAUDE.md + 4 rules | ~1,700 |
| Product Compiler | 15 skills + 3 rules | ~5,800 |
| Capability Pack | 24 skills + 1 agent | ~5,900 |
| Release Pipeline | 7 skills + 3 scripts + 5 agents + 2 rules | ~3,100 |
| Meta | 9 meta files + commands + hooks + plugins | ~1,900 |
