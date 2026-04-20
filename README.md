# Emdash Operating System v4

## 50-Skill Autonomous Product-Building System

An aggressive, multimedia-rich operating system for Claude Code that converts weak, one-line prompts into fully realized, production-ready products with elite UX, outstanding media, bold design, meaningful animation, rigorous testing, and enterprise-grade instrumentation.

---

## Architecture

```
.agentskills/
├── README.md                              ← This file
├── MASTER_PROMPT.md                       ← Best master prompt for activation
├── _router.md                             ← Deterministic skill routing (load FIRST)
├── CONVENTIONS.md                         ← Shared constants (brand, deploy, secrets)
├── QUICK_REF.md                           ← One-page cheat sheet for simple tasks
├── SKILL_PROFILES.md                      ← Project-type skill subsets (5 profiles)
├── llms.txt                               ← Machine-readable skill index
├── CHANGELOG.md                           ← Skills system version history
├── scripts/discover-secrets.sh            ← Runtime secret discovery
├── 01-operating-system/SKILL.md           ← Supreme policy, autonomy, speed, emphasis
├── 02-goal-and-brief/SKILL.md             ← Project thesis, users, success criteria
├── 03-planning-and-research/SKILL.md      ← Research, planning, decomposition, parallelism
├── 04-preference-and-memory/SKILL.md      ← Preferences, VoC, memory, confidence levels
├── 05-architecture-and-stack/SKILL.md     ← Platform, services, auth, data, API keys
├── 06-build-and-slice-loop/SKILL.md       ← Vertical slices, anti-placeholder, code quality
├── 07-quality-and-verification/SKILL.md   ← Testing, security, accessibility, performance
├── 08-deploy-and-runtime-verification/    ← Deploy, purge, verify, rollback
│   └── SKILL.md
├── 09-brand-and-content-system/SKILL.md   ← Brand, copy, trust, legal, SEO, docs
├── 10-experience-and-design-system/       ← Typography, color, layout, components, anti-slop
│   └── SKILL.md
├── 11-motion-and-interaction-system/      ← Transitions, scroll, hover, reduced-motion
│   └── SKILL.md
├── 12-media-orchestration/                ← Images, video, logos, social, critique/remix
│   ├── SKILL.md
│   └── templates/PROMPTS.md               ← Reusable media generation prompts
├── 13-observability-and-growth/SKILL.md   ← Analytics, Sentry, Stripe, email, experiments
├── 14-independent-idea-engine/SKILL.md    ← Autonomous research, proposals, self-critique
├── 15-easter-eggs/SKILL.md               ← MANDATORY: hidden delights via URL params
├── 16-domain-provisioning/SKILL.md       ← Auto-provision CF Worker, DNS, gorgeous placeholder
├── 17-competitive-analysis/SKILL.md      ← Scrape 3 competitors + web search before building
├── 18-stripe-billing/SKILL.md            ← Free tier + $50/mo pro, donations like givedirectly
├── 19-email-templates/SKILL.md           ← Branded HTML email templates for all transactional
├── 20-accessibility-gate/SKILL.md        ← axe-core audit + beautiful focus styling, WCAG AA
├── 24-web-manifest-system/SKILL.md       ← install.doctor-grade PWA manifest with screenshots, rich snippets (4+ JSON-LD), cross-site linking, opensearch, humans.txt, security.txt
├── 26-shared-api-pool/SKILL.md           ← Centralized API keys + Coolify self-hosted services
├── 27-social-automation/SKILL.md         ← Auto-post via Postiz to 15+ platforms on deploy
├── 28-seo-and-keywords/SKILL.md         ← Keyword research, Yoast rules, per-page targeting
├── 29-documentation-and-codebase-hygiene/SKILL.md ← README template, CLAUDE.md, JSDoc, stale removal
├── 30-ai-native-coding/SKILL.md         ← AI-optimized code patterns, full-stack integration
├── 31-custom-error-pages/SKILL.md       ← Branded 404, 500, 503, offline pages
├── 32-contact-forms-and-endpoints/SKILL.md ← Working forms with Turnstile, Resend, 8-point tests
├── 33-blog-and-content-engine/SKILL.md  ← SEO blog: markdown, RSS, categories, seed posts
├── 34-launch-day-sequence/SKILL.md      ← Go-live: submit sitemap, announce, verify everything
├── 35-ci-cd-pipeline/SKILL.md           ← GitHub Actions: deploy on push, E2E on PR, previews
├── 36-onboarding-and-first-run/SKILL.md ← SaaS: welcome flow, checklist, activation tracking
├── 37-site-search/SKILL.md              ← D1 LIKE or Vectorize semantic search, Cmd+K modal
├── 38-uptime-and-health/SKILL.md        ← Health endpoints, external monitoring, status page
├── 39-changelog-and-releases/SKILL.md   ← Auto-generate from git, /changelog, GitHub Releases
├── 40-backup-and-disaster-recovery/SKILL.md ← Single-zip restore, D1/KV/R2 exports, cron backups
├── 41-user-feedback-collection/SKILL.md ← In-app widget, NPS via PostHog, testimonial moderation
├── 42-internationalization/SKILL.md     ← EN+ES minimum, AI translate, hreflang, language selector
├── 43-ai-chat-widget/SKILL.md           ← CONDITIONAL: Workers AI + Vectorize RAG chat (when needed)
├── 44-drizzle-orm-and-migrations/SKILL.md ← Drizzle ORM for D1/Neon, schema conventions, migrations
├── 45-webhook-system/SKILL.md           ← Stripe/Clerk/GitHub webhooks, idempotency, event routing
├── 46-admin-dashboard/SKILL.md          ← Lightweight /admin with embedded bolt.diy editor iframe
├── 47-keyboard-shortcuts-and-command-palette/SKILL.md ← Cmd+K palette, ? shortcuts overlay
├── 48-empty-states-and-loading/SKILL.md ← Every empty list prompts action, skeleton screens
├── 49-notification-system/SKILL.md      ← OneSignal push + in-app bell + email fallback
├── 50-coolify-docker-proxmox/SKILL.md   ← Self-hosted infra: Coolify API, Docker, Proxmox (ask first)
├── 51-wisdom-and-human-psychology/SKILL.md ← Timeless principles: Cialdini, Kahneman, servant leadership, ethics
├── 52-mcp-and-cloud-integrations/SKILL.md ← MCP servers, secrets discovery, Slack/Discord/Zapier, AI API strategy
├── 53-autonomous-orchestrator/SKILL.md  ← Master orchestrator: parallel agents, autonomous decisions, competitive iteration
└── gh-fix-ci/SKILL.md                   ← Debug failing GitHub Actions PR checks
```

---

## Execution Flow (one-line prompt → production product)

```
01 Operating System    → Parse prompt, load policy, detect emphasis
02 Goal and Brief      → Establish product thesis before first build
03 Planning & Research → Research domain, plan implementation, decompose
04 Preference & Memory → Load user prefs, VoC, apply confirmed patterns
05 Architecture        → Select stack, design boundaries, configure services
        ↓
   ┌────┴────┐
   │ PARALLEL │
   ├─────────┤
06 Build Loop          → Implement vertical slices (homepage first)
12 Media Orchestration → Generate images, video, logos, icons
09 Brand & Content     → Write copy, establish trust, add legal
13 Observability       → Set up analytics, errors, payments, email
   └────┬────┘
        ↓
07 Quality Gate        → Test, lint, audit security, check accessibility
08 Deploy & Verify     → Deploy, purge cache, verify live, fix-forward
10 Design System       → Polish visuals, check responsiveness
11 Motion System       → Add transitions, scroll reveals, hover states
14 Idea Engine         → Research improvements, propose aligned upgrades
```

---

## Dependency Map

```
Foundation: 01-operating-system (supreme policy)
                    ↓
Context:    02-goal-and-brief + 04-preference-and-memory
                    ↓
Planning:   03-planning-and-research + 05-architecture-and-stack
                    ↓
Build:      06-build-and-slice-loop (parallel with 09, 12, 13)
                    ↓
Quality:    07-quality-and-verification + 10-design + 11-motion
                    ↓
Ship:       08-deploy-and-runtime-verification
                    ↓
Improve:    14-independent-idea-engine
```

---

## Migration from v3

| Old Skill | → New Location |
|-----------|---------------|
| base-layer | → 01 + 05 + 06 |
| beyond-the-prompt | → 01 + 02 |
| always-deploy-and-test | → 08 |
| deploy-and-verify | → 08 |
| test-on-production | → 08 |
| playwright-tdd | → 07 |
| quality-gate | → 07 |
| visual-qa | → 07 |
| frontend-design | → 10 + 11 |
| security-best-practices | → 07 |
| cloudflare-deploy | → 05 + 08 |
| google-analytics | → 13 |
| stripe-checkout | → 13 |
| listmonk | → 13 |
| auto-logo | → 12 |
| imagegen | → 12 |
| sora | → 12 |
| sentry | → 13 |
| api-key-helper | → 05 |
| gh-address-comments | → 07 |
| gh-fix-ci | → 07 |
| pdf | → 09 |
| doc | → 09 |
| new-project-bootstrap | → 02 + 06 |

---

## Policies

### Single-Prompt Interpretation
When under-specified: infer from domain name, apply stack defaults, build everything, record assumptions. Only ask if answer changes architecture, billing, security, or branding.

### Safe Autonomy
**DO:** choose tech, add SEO/analytics/legal, compress images, deploy, test, generate logos, research improvements, implement aligned ideas.
**DON'T:** deploy for analysis tasks, mutate global skills without explicit request, embed secrets in global files, override stricter rules with looser ones.
**ASK:** architecture forks, paid services not in stack, brand changes, legal commitments.

### Done Definitions
| Task | Done When |
|------|-----------|
| Build | Deployed + tests pass + live URL verified |
| Analysis | Written report, no deployment |
| Design | Screenshots reviewed at desktop + mobile |

### Conflict Resolution
1. 01-operating-system wins over everything
2. Project CLAUDE.md wins over global skills (for that project)
3. More specific wins over more general
4. Stricter wins over looser
5. User corrections win over all inferred behavior

### Quality Bar
- E2E: 0 failures, homepage-first Playwright at 6 breakpoints
- Lighthouse: report score, don't block for multimedia-heavy pages
- A11y: skip link, ARIA, focus rings, 4.5:1 contrast, axe-core 0 violations
- SEO: per-page keywords, Yoast checklist, JSON-LD, OG tags, sitemap, robots.txt
- Readability: Flesch >= 50 on all user-facing text and code comments
- Security: CSP, Zod validation, Turnstile on forms, no exposed secrets
- Visual: no breaks at 375px or 1280px
- Interactive: cursor:pointer + hover + focus + active everywhere
- Docs: README (install.doctor template), CLAUDE.md current, JSDoc on exports
- AI-native: explicit names, flat code, co-located context, complete features

---

## System Self-Improvement Loop

The skill system evolves continuously through these mechanisms:

### Per-Prompt (Automatic)
- Check if any skill's advice was wrong or outdated → flag in report
- Fix broken skill content immediately if it caused a build failure
- Save new patterns to MEMORY.md

### Per-5-Prompts (Micro-Audit)
- Review skill activation patterns → identify unused skills
- Check SKILL_PROFILES.md accuracy for current project type
- Verify CLAUDE.md and MEMORY.md consistency

### Per-Project (End-of-Project Review)
- Generate skill usage heatmap (which skills were used, how often)
- Propose merges for skills that always activate together
- Archive candidates for skills never triggered across 3+ projects
- Batch-apply all pending skill updates from MEMORY.md

### Periodically (Source Freshness)
- Web-search for updates to authoritative sources (web.dev, NNGroup, OWASP, etc.)
- When new research contradicts skill content, propose updates with evidence
- Track Cloudflare changelog for new services that change architecture defaults

### Guard Rails
- Max 3 skill file modifications per prompt
- Never weaken quality gates or remove safety checks
- Always announce modifications in end-of-prompt report
- Log changes to CHANGELOG.md

---

## Loading Order (Optimal Token Efficiency)

```
1. _router.md        → Determine which skills to load (saves ~30K tokens on non-build tasks)
2. CONVENTIONS.md    → Load shared constants once (prevents re-derivation across skills)
3. SKILL_PROFILES.md → Pick project type → get exact skill subset
4. Skill 01          → Supreme policy (always)
5. Phase skills      → Only what's needed for current phase
```

This order prevents loading all 50 skills for a simple bug fix (which would waste ~40K tokens of context).
