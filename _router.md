# Skill Router

Deterministic decision tree. Match task type first, then refine by file context.

**LOADING POLICY: Be generous. At least 29 skills loaded at all times. Never leave more than half unloaded. When in doubt, load the skill.**

## Always Active (load EVERY session — non-negotiable)

01 Operating System, 05 Architecture, 06 Build Loop, 07 Quality, 08 Deploy,
09 Brand/Content, 10 Design, 12 Media, 13 Observability, 20 Accessibility,
24 Web Manifest, 28 SEO, 29 Documentation, 30 AI-Native, 32 Contact Forms,
37 AI Search, 43 AI Chat, 44 Drizzle, 48 Empty States, 51 Wisdom,
52 MCP Integrations, 53 Autonomous Orchestrator, 54 Computer Use,
55 Browser Workflows, 56 Completeness Verification, 57 AI Technology
CONVENTIONS.md, STYLE_GUIDES.md

**(26 skills + 2 shared files = always loaded, 45% of 58)**

## By Task Type (ADD these to the always-active base)

| Task | Add Skills | Total ~Loaded |
|------|-----------|---------------|
| New project (no code) | 02, 03, 15, 16, 17, 21, 22, 23, 25, 34 | 36 |
| Build / implement feature | 11, 15, 21, 22, 23, 25, 33, 36, 45, 46, 47, 49 | 38 |
| Fix / debug | gh-fix-ci | 27 |
| Deploy only | 34 | 27 |
| Full project / autonomous | ALL 58 skills | 58 |
| Design / visual | 11, 15, 31 | 29 |
| SEO / content | 33, 42 | 28 |
| Billing / payments | 18, 45 | 28 |
| Infrastructure | 50, 26 | 28 |
| Testing / QA | 11 | 27 |
| Visual QA / screenshots | 11 | 27 (+ spawn visual-qa agent) |
| Desktop automation | (already have 54) | 26 (+ spawn computer-use-operator) |
| Onboarding / UX | 36, 47, 49 | 29 |
| i18n / localization | 42 | 27 |
| Error handling | 31 | 27 |

## By File Being Edited (ADD to current set)

| File Pattern | Add Skills |
|-------------|------------|
| *.spec.ts, *.test.ts | (already have 07) |
| wrangler.toml | (already have 05, 08) |
| drizzle/*, schema.ts | (already have 44) |
| *.css, *.scss | 11 |
| /blog/*, /posts/* | 33 |
| /admin/* | 46 |
| /api/webhooks/* | 45 |
| /api/stripe* | 18, 45 |
| .github/workflows/* | 35, gh-fix-ci |

## By Profile (from SKILL_PROFILES.md)

| Profile | Load ALL always-active + these |
|---------|-------------------------------|
| Marketing Site | 11, 15, 21, 22, 23, 25, 31, 33, 34, 42 (36 total) |
| SaaS Application | ALL 58 skills |
| Nonprofit / Donation | 11, 15, 18, 19, 21, 22, 23, 25, 31, 33, 34, 41, 42, 43 (40 total) |
| API Service | 21, 22, 23, 25, 26, 38, 40, 45, 50 (35 total) |
| Developer Tool / OSS | 21, 22, 23, 25, 33, 35, 39, 47 (34 total) |
| Micro-SaaS | 11, 18, 21, 22, 23, 25, 31, 45 (34 total) |

## Parallel Agent Skill Distribution (Option C)

When spawning parallel agents, each gets its own context window:

| Agent | Role | Skills to Load |
|-------|------|---------------|
| Frontend | UI, design, motion | 01, 06, 09, 10, 11, 12, 15, 24, 28, 30, 31, 32, 42, 47, 48, 51 |
| Backend | API, DB, auth, webhooks | 01, 05, 06, 07, 13, 18, 30, 37, 44, 45, 49, 52 |
| Content | Copy, SEO, blog, media | 01, 09, 12, 28, 29, 33, 42, 51 |
| Quality | Testing, a11y, visual QA | 01, 07, 08, 20, 30 |
| Deploy | Ship, launch, social | 01, 08, 27, 34, 35, 38, 40, 52 |

## Computer Use & Browser Automation (Skills 54-55)

When computer-use or browser MCP is available:
- **Dedicated MCP** (Slack, Gmail, Stripe, GitHub) → Use first, fastest
- **Playwright MCP** → Web testing, forms, screenshots (Skill 55)
- **Firecrawl MCP** → Web scraping, search, extraction (Skill 55)
- **Chrome MCP** → Web app interaction when no dedicated MCP
- **Computer Use** → ONLY native macOS apps (Finder, System Settings, Notes, Preview, Maps) (Skill 54)

### Custom Agents (in ~/.claude/agents/)
| Agent | Model | Use For |
|-------|-------|---------|
| deploy-verifier | sonnet | Post-deploy smoke tests at 6 breakpoints |
| security-reviewer | opus | OWASP audit of code changes (read-only) |
| test-writer | sonnet | Generate Vitest + Playwright tests |
| seo-auditor | haiku | SEO compliance check per page |
| visual-qa | opus | Screenshot-based visual defect detection |
| computer-use-operator | sonnet | Native macOS app automation |

## Prompt-to-Path Decision Tree

```
Is this "build everything" or "full completion"?
├── YES → Load ALL 58 skills. Spawn parallel agents. Cascade protocol.
└── NO → Is this a NEW project (empty folder)?
    ├── YES → Always-active (26) + New Project extras (36 total)
    └── NO → Does it mention BUG or ERROR?
        ├── YES → Always-active (26) + gh-fix-ci (27 total)
        └── NO → Does it mention DESIGN or VISUAL?
            ├── YES → Always-active (26) + 11, 15, 31 (29 total)
            └── NO → Always-active (26) + task-specific (27-38 total)
```
