<div align="center">
  <a href="https://github.com/heymegabyte/claude-skills">
    <img width="148" alt="Emdash Skills" src="https://raw.githubusercontent.com/heymegabyte/claude-skills/master/logo.png" />
  </a>
  <h1>Emdash Skills</h1>
  <p><strong>Autonomous product-building OS for 32+ AI coding tools.<br/>One-line prompts → deployed products on Cloudflare Workers.</strong></p>
</div>

<div align="center">
  <a href="https://github.com/heymegabyte/claude-skills"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/heymegabyte/claude-skills?logo=github&logoColor=white&style=for-the-badge&color=060610" /></a>
  <a href="https://megabyte.space"><img alt="Homepage" src="https://img.shields.io/website?down_color=%23FF4136&down_message=Down&label=Homepage&logo=home-assistant&logoColor=white&up_color=%232ECC40&up_message=Up&url=https%3A%2F%2Fmegabyte.space&style=for-the-badge" /></a>
  <a href="https://github.com/heymegabyte/claude-skills/blob/master/LICENSE"><img alt="License: Rutgers" src="https://img.shields.io/badge/License-Rutgers-7C3AED?logo=open-source-initiative&logoColor=white&style=for-the-badge" /></a>
  <a href="https://github.com/heymegabyte/claude-skills/issues"><img alt="Issues" src="https://img.shields.io/github/issues/heymegabyte/claude-skills?logo=github&logoColor=white&style=for-the-badge&color=00E5FF" /></a>
  <a href="https://www.npmjs.com/package/@heymegabyte/claude-skills"><img alt="npm" src="https://img.shields.io/npm/v/@heymegabyte/claude-skills?logo=npm&logoColor=white&style=for-the-badge&color=50AAE3" /></a>
  <a href="https://jsr.io/@heymegabyte/claude-skills"><img alt="JSR" src="https://img.shields.io/jsr/v/@heymegabyte/claude-skills?logo=jsr&logoColor=white&style=for-the-badge&color=7C3AED" /></a>
</div>

<br/>

<div align="center">
  <code>15 categories</code> · <code>119 reference docs</code> · <code>19 agents</code> · <code>12 templates</code><br/>
  <a href="https://claude.megabyte.space"><strong>🌐 Showcase Website</strong></a>
</div>

<br/>

### When to Use

| Building... | Skills Load | Install |
|---|---|---|
| **SaaS product** | 01-OS → 02-Brief → 05-Arch → 06-Build → 07-QA → 08-Deploy + all agents | `claude plugin install heymegabyte/claude-skills` |
| **API / backend** | 01-OS → 05-Arch → 06-Build → 08-Deploy → 13-Observability | `npm i @heymegabyte/claude-skills` |
| **Marketing site** | 01-OS → 09-Brand → 10-Design → 11-Motion → 12-Media | `npm i @heymegabyte/claude-skills` |
| **Features on existing project** | 01-OS → 06-Build → 07-QA (skill router auto-selects from context) | `claude plugin install heymegabyte/claude-skills` |
| **Just rules for your AI tool** | No skills — use a platform variant file directly | See [32 variants](#cross-platform-support-32-variants) below |

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR PROMPT                              │
│              "Build a SaaS for dog walkers"                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SKILL ROUTER                                │
│  Matches prompt → loads smallest useful subset of skills        │
│  01-OS always loaded │ then 02-Brief → 05-Arch → 06-Build      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ ARCHITECT│  │ PARALLEL │  │ PARALLEL │
        │  (Opus)  │  │  BUILD   │  │  VERIFY  │
        │          │  │ 3-5 agents│  │ 3 agents │
        │ repo-map │  │ frontend │  │ deploy   │
        │ task graph│  │ backend  │  │ seo      │
        │ seams    │  │ content  │  │ visual   │
        └──────────┘  │ media    │  │ a11y     │
                      │ tests    │  └──────────┘
                      └──────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HARD GATES                                 │
│  Playwright 6bp ✓ │ Vision ≥8/10 ✓ │ Lighthouse A11y ≥95 ✓     │
│  axe-core 0 ✓ │ SEO GREEN ✓ │ 0 errors ✓ │ Flesch ≥60 ✓       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   DEPLOYED   │
                    │ CF Workers   │
                    │   + purged   │
                    └──────────────┘
```

## Install

```bash
# GitHub Skills (recommended)
gh skill install heymegabyte/claude-skills

# Claude Code plugin
claude plugin install heymegabyte/claude-skills

# npm (includes all 32+ platform variants)
npm i @heymegabyte/claude-skills

# JSR
npx jsr add @heymegabyte/claude-skills

# OpenAI Codex
git clone https://github.com/heymegabyte/claude-skills ~/.codex/skills

# Manual
git clone https://github.com/heymegabyte/claude-skills ~/.agentskills
```

## Cross-Platform Support (32 variants)

Auto-generated on every push to master. Each format uses native frontmatter for its tool.

| Format | Path | Notes |
|--------|------|-------|
| **Cursor** (modern) | `.cursor/rules/emdash-skills.mdc` | MDC frontmatter: `alwaysApply: true` |
| **Windsurf** (modern) | `.windsurf/rules/emdash-skills.md` | `trigger: always_on` |
| **Augment** (modern) | `.augment/rules/emdash-skills.md` | `type: always_apply` |
| **Copilot** (modern) | `.github/instructions/emdash-skills.instructions.md` | `applyTo: "**"` |
| **OpenHands** | `.openhands/microagents/repo.md` | Plain markdown |
| **Cursor** (legacy) | `.cursorrules` | Single-file format |
| **Windsurf** (legacy) | `.windsurfrules` | Single-file format |
| **Cline** | `.clinerules` | Single-file format |
| **Copilot** (legacy) | `.github/copilot-instructions.md` | Plain markdown |
| **Augment** (legacy) | `.augment-guidelines` | Single-file format |
| **Aider** | `.aider-conventions.md` | Plain markdown |
| **Zed** | `.rules` | Plain markdown |
| **Codex** | `CODEX.md` + `.agents/skills/` | SKILL.md per category |
| **Gemini CLI** | `GEMINI.md` | Plain markdown |
| **Amp** | `AMP.md` | Plain markdown |
| **Replit** | `replit.md` | Plain markdown |
| **Devin** | `.devin/skills/emdash/SKILL.md` | SKILL.md with frontmatter |
| **Goose** | `.goose/recipes/emdash-skills.yaml` | YAML recipe format |
| **AGENTS.md** | `AGENTS.md` | Devin, Jules, Copilot, OpenHands |
| **Amazon Q** | `.amazonq/rules/` | Directory format |
| **JetBrains Junie** | `.junie/guidelines.md` | Plain markdown |
| **Trae** | `.trae/rules/project_rules.md` | ByteDance IDE |
| **Tabnine** | `.tabnine/guidelines/guidelines.md` | Directory format |
| **Kilo Code** | `.kilo/rules/` | Roo Code successor |
| **Roo Code** | `.roo/rules/` | Active until May 2026 |
| **Continue.dev** | `.continue/rules/` | Directory format |
| **JetBrains AI** | `.aiassistant/rules/emdash-skills.md` | Separate from Junie |
| **Kiro** (AWS) | `.kiro/steering/emdash-skills.md` | Workspace steering |
| **Void** | `.void/rules/emdash-skills.md` | Open-source VS Code fork |
| **Qodo** | `QODO.MD` | PR-Agent auto-detects |
| **Bolt.new** | `.bolt/promptfile` | Plain text instructions |
| **Cursor BugBot** | `.cursor/BUGBOT.md` | Per-directory code review |

## Skill Categories

```
          ┌──────────────────────────────────────────────┐
          │              EMDASH SKILL MAP                 │
          │                                               │
          │   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
          │   │ 01  │→ │ 02  │→ │ 03  │→ │ 04  │       │
          │   │ OS  │  │Brief│  │Plan │  │Pref │       │
          │   │  6  │  │  0  │  │  1  │  │  3  │       │
          │   └─────┘  └─────┘  └─────┘  └─────┘       │
          │                                               │
          │   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
          │   │ 05  │→ │ 06  │→ │ 07  │→ │ 08  │       │
          │   │Arch │  │Build│  │ QA  │  │Ship │       │
          │   │ 12  │  │ 26  │  │ 25  │  │ 10  │       │
          │   └─────┘  └─────┘  └─────┘  └─────┘       │
          │                                               │
          │   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
          │   │ 09  │→ │ 10  │→ │ 11  │→ │ 12  │       │
          │   │Brand│  │ UX  │  │Motn │  │Media│       │
          │   │  7  │  │  2  │  │  1  │  │ 10  │       │
          │   └─────┘  └─────┘  └─────┘  └─────┘       │
          │                                               │
          │   ┌─────┐  ┌─────┐  ┌─────┐                  │
          │   │ 13  │→ │ 14  │→ │ 15  │                  │
          │   │Grow │  │Ideas│  │ Gen │                  │
          │   │  7  │  │  0  │  │  9  │                  │
          │   └─────┘  └─────┘  └─────┘                  │
          │                                               │
          │   Numbers = reference docs per category       │
          └──────────────────────────────────────────────┘
```

| # | Category | Docs | What It Handles |
|--:|----------|:----:|-----------------|
| 01 | **Operating System** | 6 | Core policy, autonomy, parallelization, AI-native coding, output compression |
| 02 | **Goal & Brief** | — | Product thesis from a domain name, business model inference |
| 03 | **Planning & Research** | 1 | Competitive analysis, task decomposition, parallel workstreams |
| 04 | **Preference & Memory** | 3 | Voice of Customer data, user preferences, behavioral psychology |
| 05 | **Architecture & Stack** | 12 | CF Workers, Hono, Drizzle v1, Coolify, MCP, auth, API design, multi-tenancy |
| 06 | **Build & Slice Loop** | 26 | Forms, search, blog, i18n, PWA, webhooks, admin, data tables, chat |
| 07 | **Quality & Verification** | 25 | E2E, a11y, security hardening, perf, visual QA, adversarial, AI testing |
| 08 | **Deploy & Runtime** | 10 | CI/CD, launch-day sequence, uptime, backup, changelog, GitHub CI fix |
| 09 | **Brand & Content** | 7 | SEO engine, copy system, email templates, social automation |
| 10 | **Design System** | 2 | Anti-slop design, dark-first, bold typography, CSS architecture |
| 11 | **Motion & Interaction** | 1 | Scroll-driven animations, View Transitions, reduced-motion |
| 12 | **Media Orchestration** | 10 | Image/video generation, AI prompts, compression, OG previews, diagramming |
| 13 | **Growth & Observability** | 7 | Stripe billing, analytics, Sentry alerts, email, experiments, CRO |
| 14 | **Idea Engine** | — | Autonomous research, evidence-backed improvement proposals |
| 15 | **Site Generation** | 9 | Full-corpus rebuild, slot-first GPT Image 1.5 media, NotebookLM podcast/infographic/video, citations |

## Agents

```
         AGENT ROUTING BY MODEL TIER

  ┌─────────────────────────────────────┐
  │            OPUS (heavy)             │
  │  Architecture │ Security │ Vision   │
  │  Completeness │ Meta-orchestration  │
  ├─────────────────────────────────────┤
  │           SONNET (standard)         │
  │  Build │ Test │ Deploy │ Debug      │
  │  Migrate │ Profile │ Simplify      │
  │  Dependencies │ Incidents │ CU-op  │
  ├─────────────────────────────────────┤
  │            HAIKU (fast)             │
  │  Content │ SEO │ A11y │ Changelog  │
  │  Cost estimation                    │
  └─────────────────────────────────────┘
```

| Agent | Model | Effort | Purpose |
|-------|:-----:|:------:|---------|
| **architect** | Opus | max | Repo-map generation, task graphs, architectural seams |
| **completeness-checker** | Opus | max | Zero Recommendations Gate — nothing ships incomplete |
| **meta-orchestrator** | Opus | max | Cross-agent coordination and task graph execution |
| **security-reviewer** | Opus | max | OWASP Top 10:2025, secrets exposure, CSP audit |
| **visual-qa** | Opus | max | Screenshot all 6 breakpoints, AI vision layout detection |
| **code-simplifier** | Sonnet | high | Reduce complexity while preserving all functionality |
| **computer-use-operator** | Sonnet | high | Native macOS app automation via Computer Use MCP |
| **dependency-auditor** | Sonnet | high | Package security, license compliance, update strategy |
| **deploy-verifier** | Sonnet | high | Post-deploy smoke tests at 6 breakpoints |
| **incident-responder** | Sonnet | high | Sentry-triggered triage, root cause, auto-fix PRs |
| **migration-agent** | Sonnet | high | Framework/DB/API migration with rollback safety |
| **performance-profiler** | Sonnet | high | Core Web Vitals analysis, bundle audit, runtime profiling |
| **test-writer** | Sonnet | high | TDD-first Playwright E2E + Vitest units, stable selectors |
| **accessibility-auditor** | Haiku | low | axe-core WCAG 2.2 AA audits and remediation guidance |
| **changelog-generator** | Haiku | low | Conventional commit parsing, user-outcome release notes |
| **content-writer** | Haiku | low | Marketing copy, microcopy, alt text, SEO content |
| **cost-estimator** | Haiku | low | Cloudflare Workers cost forecasting and free-tier warnings |
| **seo-auditor** | Haiku | low | Title, meta, H1, JSON-LD, OG tags, sitemap validation |
| **notebooklm-orchestrator** | Sonnet | high | Podcast (ElevenLabs) + infographic + explainer video pipeline per site |

## Hard Gates

Every deploy must clear all gates. No exceptions. No overrides.

| Gate | Threshold | Tool |
|------|:---------:|------|
| E2E Tests | 0 failures @ 6 breakpoints | Playwright v1.59+ |
| Visual QA | ≥ 8/10 | AI vision (Claude Sonnet 4.6 default; current OpenAI multimodal fallback) |
| Accessibility | ≥ 95 | Lighthouse |
| A11y Violations | 0 | axe-core |
| SEO Score | GREEN | Yoast-equivalent |
| Console Errors | 0 | Browser DevTools |
| Placeholders | 0 | Content sweep |
| Readability | Flesch ≥ 60 | Copy audit |

## Stack

```
  REQUEST FLOW

  Browser ──→ CF Workers ──→ Hono RPC ──→ Drizzle v1 ──→ D1/Neon
     │              │             │              │
     │         KV/Upstash    Zod valid.     Migrations
     │              │             │
     ├── Clerk (auth)        Turnstile
     ├── Stripe (pay)        Resend (email)
     ├── PostHog (analytics) Sentry (errors)
     └── GA4/GTM (tracking)  Inngest (jobs)
```

| Layer | Technology |
|-------|------------|
| Hosting | Cloudflare Workers |
| Backend | Hono RPC + `@hono/zod-validator` |
| Frontend | Angular 21 + Ionic 8 + PrimeNG 21 (or vanilla) |
| Database | D1 (edge) / Neon (Postgres) |
| ORM | Drizzle v1 + Zod |
| Cache | KV / Upstash Redis |
| Auth | Clerk |
| Payments | Stripe |
| Email | Resend + Listmonk |
| Jobs | Inngest |
| Testing | Playwright v1.59+ + Vitest |
| Lint | ESLint + Prettier |
| Runtime | Bun |
| Monitoring | PostHog + Sentry + GA4/GTM |

## Templates

| Template | Purpose |
|----------|---------|
| `acceptance-criteria.md` | Structured AC with testable conditions |
| `adr-template.md` | Architecture Decision Records |
| `brief.md` | Product brief from domain name |
| `launch-checklist.md` | Pre-launch verification checklist |
| `product-intent.yaml` | Machine-readable product definition |
| `qa-report.json` | Structured QA output format |
| `repo-map.md` | Codebase architecture map |
| `saas-feature-manifest.md` | Complete SaaS feature matrix |
| `session-learning.md` | Post-session knowledge extraction |
| `starter-scaffold.md` | New project scaffolding guide |
| `semgrep-rules/` | Custom Semgrep rules for codebase enforcement |
| `task-graph.json` | Parallelizable task decomposition |

## Tools

| Script | Purpose |
|--------|---------|
| `bin/check-required-keys.sh` | API Key Gate helper — verifies per-mode required keys present, JSON output + audit log |
| `bin/emdash-quick-lint` | Staged-file linting (ESLint+Prettier+ShellCheck) |
| `bin/emdash-secret-scan` | Pre-commit secret detection via `detect-secrets` |
| `bin/emdash-cost-check` | Quick Cloudflare cost estimate from wrangler.toml |
| `scripts/discover-secrets.sh` | Inventory all available API keys across sources |
| `scripts/gpt4o-vision-analyze.sh` | GPT-4o screenshot analysis for visual QA |
| `scripts/validate-skills.sh` | Cross-reference validation for skill files |
| `scripts/visual-tdd-loop.sh` | Automated screenshot→fix→verify loop |

## Task Routing

The router loads the smallest useful subset per task — never the full 119 docs. See [`_router.md`](_router.md) for the complete routing table.

| When you say... | Skills loaded |
|-----------------|---------------|
| "Build a new project" | 02 → 03 → 05 → 06 → 09 |
| "Add a feature" | 05 → 06 → 07 |
| "Fix CI" | 07 → 08 (especially `gh-fix-ci`) |
| "Deploy this" | 08 (+ 09 if content changed) |
| "Polish the frontend" | 09 → 10 → 11 → 12 |
| "Set up billing" | 05/auth → 06/webhooks → 13/stripe |
| "Add analytics" | 13 (+ 09/social if publishing) |
| "Brainstorm ideas" | 03 → 14 |

## Ideal Prompts

Copy-paste these as-is. Each one routes through the skill graph and produces a deployed, gate-cleared product. The shorter the prompt, the more the skill engine infers — domain name alone is enough.

### Build a SaaS from a domain

```
Build acmebilling.dev — recurring subscription billing for indie SaaS founders. Stripe-native, Clerk auth, Inngest for retry workflows.
```

- **Skills** — 01 → 02 → 03 → 05 → 06 → 07 → 08 → 13
- **Agents** — architect (Opus) → 5 parallel build agents → deploy-verifier + seo-auditor + visual-qa
- **Gate fires** — API Key Gate checks `STRIPE_*`, `CLERK_*`, `INNGEST_*`, `CLOUDFLARE_API_KEY` (global) before any scaffold
- **Output** — live Worker on `acmebilling.dev` with checkout, dashboard, webhook handler, Sentry + PostHog + GA4 wired

### Rebuild an existing site

```
Rebuild brianzalewski.com — pull current site from Wayback if dead, keep every page, modernize design, ship to CF Workers.
```

- **Skills** — 01 → 02 → 09 (brand extraction) → 15 (full corpus + media+video extraction + grammar audit) → 07 → 08
- **Agents** — architect → content-writer + visual-qa + seo-auditor
- **Gate** — every original URL = 200 or 301; logo retention; theme match; favicon set via real-favicongenerator

### Spin up a portfolio from one line

```
Make me a portfolio site at brian.dev — I'm a principal engineer, AI builder, Megabyte Labs founder.
```

- **Skills** — 01 → 02 (founder inference) → 09 → 10 → 11 → 12 → 14 (auto-suggests project tiles + impact stats) → 07 → 08
- **Optional pairing** — if a flagship SaaS exists, portfolio links to it as primary work
- **Output** — dark-first single-page with hero + work + writing + contact

### Local-business site (NAP + reviews + map)

```
Build paterson-dental.com — family dental practice in Paterson NJ, online booking, insurance verification, Spanish/English.
```

- **Skills** — 01 → 02 → 09 → 10 → 13 (local conversion patterns: phone_click, direction_click, booking_click)
- **Gate** — `GOOGLE_MAPS_API_KEY` + `GOOGLE_PLACES_API_KEY` required
- **Output** — full-width Maps embed, NAP schema.org `LocalBusiness`, OpenTable/Booksy embed, Twilio SMS booking

### Non-profit with donation flow

```
Build sjsk.org — community clothing distribution for SJSK in Newark, donor portal, impact counter, tax receipt PDFs.
```

- **Skills** — 01 → 02 → 09 → 13 (Stripe-first GiveDirectly UX)
- **Gate** — `STRIPE_*` keys
- **Output** — Donate CTA in nav, recurring + one-time, Resend tax receipts, impact counters with IO+rAF roll-in

### Brainstorm before you build

```
What's the highest-ROI thing I can ship this week? Read PORTFOLIO.md, scan current projects, propose 3 ideas with confidence scores.
```

- **Skills** — 14 (idea engine) → bounded web research → self-critique filter
- **Output** — 3 evidence-backed proposals with `apa_citation` per claim, viral coefficient + AI search visibility scoring, auto-implements `confidence ≥ 0.85` aligned ideas

### Add a feature to an existing project

```
Add a magic-link auth flow to acme.dev — passwordless email via Resend, Clerk session, redirect to /dashboard.
```

- **Skills** — 05 (architecture decision) → 06 (build slice) → 07 (Playwright E2E homepage-first)
- **Agents** — test-writer (failing test FIRST) → implementation → deploy-verifier

### Debug a wedged pipeline

```
projectsites.dev workflow stuck on site_id 47 for 3 hours. Diagnose, fix, retrigger.
```

- **Skills** — 08 (deploy/runtime) → 07
- **Rule loaded** — `failed-pipeline-protocol.md` (5 canonical failure modes)
- **Sequence** — detect via D1 query → diagnose root cause (CHECK constraint? timeout? OOM?) → fix → verify in isolation → mint session → retrigger via direct worker URL → background monitor

### Ship a content-driven blog at scale

```
Generate 50 programmatic SEO pages for acme.dev — integration|comparison|use-case|template|location templates, GEO-optimized, citations.
```

- **Skills** — 09 (pSEO 5 types + GEO + sourced facts via APA citations) → 06 → 07
- **Output** — 50 unique routes, no templated copy, every quantitative claim cites APA 7th source, Schema.org `Article` with `citation:CreativeWork[]`

### One-line magic

```
ghost.megabyte.space
```

- **Skills** — 01 (one-line prompt mode inference) → 02 → 05 → 09 → 10 → 11 → 12 → 07 → 08
- Domain alone routes to a complete product
- Gate fires
- Brand extracted from existing infrastructure
- Curated dark/neon aesthetic from `~/Snapchat/best/` 622-shot reference
- Logo from Ideogram
- Deployed to CF Workers

### Prompt patterns that work

| Phrase | Effect |
|--------|--------|
| `boil the lake` | Force complete-not-shortcut mode for the next decision |
| `parallel everything` | Decompose first, spawn 3-5 agents per phase |
| `skip api key gate` | Bypass key check (rare — deploys will likely 500) |
| `recommendations loop until zero` | Keep finding+fixing until no rec remains |
| `chain MCPs` | Use meta-orchestrator across 19+ services |
| `homepage-first` | Reset E2E flow to start at `/` and click through |
| `boil X, flag Y` | Do X completely; surface Y as issue |
| `make it shorter` | Reduce 40-60% (Brian's #1 most-used phrase, 670+ logged uses) |
| `the whole thing` | Never truncate — full file output |
| `Now ...` | Chain to previous task, don't reset context |

## Philosophy

- **Distribution > Technology** — The best tool nobody knows about is the worst tool. Auto-create repos for new skills. Integrate into every ecosystem. Broadcast widely.
- **Boil the Lake** — When completeness costs minutes more than a shortcut, do complete. Boil lakes, flag oceans.
- **TDD Always** — Failing test first → implement → pass. Real user flows. Homepage first. Click through UI. Never `page.goto()` for internal navigation.
- **One Person + AI = Twenty** — The barrier is gone. What remains is taste, judgment, and willingness to do the complete thing.

## Can You Make This Better?

Seriously — [open an issue](https://github.com/heymegabyte/claude-skills/issues/new?title=Improvement%20suggestion&body=I%20think%20this%20could%20be%20better%20if...) or submit a PR. Some things we're thinking about:

- **More skill categories?** Is 15 the right number or are we missing something?
- **Better agent routing?** Should model assignments shift as Claude evolves?
- **Templates you wish existed?** What boilerplate do you write over and over?
- **Skills for other stacks?** This is CF Workers + Angular today. What else?
- **Prompting patterns** that consistently produce better results?

If you've built something similar, stolen ideas from here, or just have opinions — we want to hear it. The whole point is that this gets better every day.

## License

Copyright (c) 2024-2026 [Brian Zalewski](https://megabyte.space) / [Megabyte Labs](https://megabyte.space). [The Rutgers License](LICENSE).

TL;DR — It's free. Use it. But if it helped you, be cool about it and [send what feels right](mailto:hey@megabyte.space). We made this and we'd like to eat.
