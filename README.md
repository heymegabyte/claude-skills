<div align="center">

# claude-skills

### The autonomous product-building OS for Claude Code

14 skill categories. 58 submodules. 9 agents. One-line prompts → production products.

[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-00E5FF?style=for-the-badge&logo=anthropic&logoColor=white)](https://github.com/megabytespace/claude-skills)
[![Skills](https://img.shields.io/badge/Skills-14%20Categories-7C3AED?style=for-the-badge)](https://github.com/megabytespace/claude-skills)
[![Agents](https://img.shields.io/badge/Agents-9-50AAE3?style=for-the-badge)](https://github.com/megabytespace/claude-skills/tree/master/agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-060610?style=for-the-badge)](LICENSE)

</div>

---

## Install

```bash
claude plugin install megabytespace/claude-skills
```

Or clone directly:

```bash
git clone https://github.com/megabytespace/claude-skills ~/.agentskills
ln -sf ~/.agentskills ~/.claude/skills
```

---

## What It Does

Give Claude Code a one-line prompt. Get a complete, deployed, production-ready product.

```
You: "fundl.ink"
Claude: [deploys a full donation platform on Cloudflare Workers with Stripe,
         dark theme, SEO, accessibility, analytics, social automation,
         Easter egg, PWA manifest, contact form, and blog — in under 30 minutes]
```

The skill system transforms Claude from a code assistant into an autonomous product builder that makes every creative, technical, and architectural decision without asking.

---

## The 14 Categories

| # | Category | What It Handles |
|---|----------|----------------|
| **01** | **Operating System** | Policy, autonomy, parallelization, AI-native coding patterns |
| **02** | **Goal & Brief** | Product thesis from domain name, business model inference |
| **03** | **Planning & Research** | Competitor analysis, task decomposition, parallel workstreams |
| **04** | **Preference & Memory** | Voice of Customer, user preferences, behavioral psychology |
| **05** | **Architecture & Stack** | CF Workers, Hono, Drizzle, Coolify, MCP integrations, API design |
| **06** | **Build & Slice Loop** | 15 feature packs: forms, search, blog, i18n, PWA, webhooks, etc. |
| **07** | **Quality & Verification** | E2E testing, a11y, security, performance, visual QA, AI critique |
| **08** | **Deploy & Runtime** | CI/CD, launch day, uptime monitoring, backup, changelog |
| **09** | **Brand & Content** | SEO engine, copy system, email templates, social automation |
| **10** | **Design System** | Anti-AI-slop design, dark-first, bold typography, motion |
| **11** | **Motion & Interaction** | CSS scroll animations, View Transitions, reduced-motion |
| **12** | **Media Orchestration** | Image/video generation, compression pipeline, social previews |
| **13** | **Growth & Observability** | Stripe billing, GA4/PostHog analytics, user feedback |
| **14** | **Idea Engine** | Autonomous research, evidence-backed improvement proposals |

Each category contains submodule `.md` files for specialized capabilities — 58 total.

---

## 9 Bundled Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `architect` | opus | Repo analysis, task graphs, architectural seams |
| `code-simplifier` | sonnet | Reduce complexity while preserving functionality |
| `completeness-checker` | opus | Zero Recommendations Gate — finds what's missing |
| `deploy-verifier` | sonnet | Post-deploy smoke tests at 6 breakpoints |
| `security-reviewer` | opus | OWASP Top 10 audit, read-only |
| `seo-auditor` | haiku | SEO compliance per page |
| `test-writer` | sonnet | Vitest + Playwright test generation |
| `visual-qa` | opus | Screenshot-based visual defect detection |
| `computer-use-operator` | sonnet | Native macOS app automation |

---

## Default Stack

Every project ships with this stack unless requirements demand otherwise:

| Layer | Default |
|-------|---------|
| Hosting | Cloudflare Workers |
| Backend | Hono (RPC mode) |
| Frontend | Angular 19 + Ionic + PrimeNG |
| Database | D1 (simple) / Neon Postgres (complex) |
| Auth | Clerk |
| Payments | Stripe ($50/mo Pro tier) |
| Email | Resend (transactional) / Listmonk (marketing) |
| Testing | Playwright + Vitest |
| Linting | Biome |
| Runtime | Bun |

---

## How It Works

```
Prompt arrives
├── Decompose into parallel tasks (30 seconds)
├── Spawn agents simultaneously:
│   ├── Agent A: Homepage → deploy immediately
│   ├── Agent B: Backend + DB + auth
│   ├── Agent C: Content + SEO
│   ├── Agent D: Analytics + integrations
│   └── Agent E: Tests + accessibility
├── First deploy in under 10 minutes
├── Visual TDD loop: screenshot → AI critique → fix → verify
└── Zero Recommendations Gate: loop until genuinely done
```

### Hard Gates (nothing ships without these)

- [ ] Playwright E2E passes at 6 breakpoints
- [ ] GPT-4o vision >= 8/10, zero layout breaks
- [ ] Yoast GREEN on all SEO checks
- [ ] Lighthouse Accessibility >= 95
- [ ] axe-core: 0 violations
- [ ] Zero console errors
- [ ] Zero placeholders/TODO

---

## File Structure

```
claude-skills/
├── .claude-plugin/plugin.json     # Plugin manifest
├── _router.md                     # Skill routing by task type
├── CONVENTIONS.md                 # Brand tokens, deploy commands, patterns
├── MASTER_PROMPT.md               # Full activation prompt
├── QUICK_REF.md                   # One-page cheat sheet
├── SKILL_PROFILES.md              # Project-type profiles (SaaS, nonprofit, API, etc.)
├── 01-operating-system/
│   ├── SKILL.md                   # Main skill file
│   ├── ai-native-coding.md        # Submodule
│   └── autonomous-orchestrator.md # Submodule
├── 02-goal-and-brief/
│   └── SKILL.md
├── ...                            # 14 categories total
├── agents/                        # 9 bundled agents
│   ├── architect.md
│   ├── code-simplifier.md
│   └── ...
├── scripts/                       # Utility scripts
└── templates/                     # Project templates
```

---

## Brand

| Token | Value |
|-------|-------|
| Background | `#060610` |
| Cyan | `#00E5FF` |
| Blue | `#50AAE3` |
| Purple | `#7C3AED` (cosmic only) |
| Heading font | Sora |
| Body font | Space Grotesk |
| Mono font | JetBrains Mono |

---

## Built With Data

This system is trained on **10,255 real messages** across **3,102 conversations** — not generic best practices. Every rule, threshold, and decision heuristic comes from actual engineering work:

- **Voice of the Customer** data with exact language patterns and dissatisfaction signals
- **Decision model** predicting technology choices with a 4-gate evaluation framework
- **Expertise map** distinguishing deep knowledge from learning areas
- **Communication DNA** encoding cognitive style, interaction velocity, and delegation preferences

---

## Author

**Brian Zalewski** — Principal Software Engineer, 14+ years. Founder of [Megabyte Labs](https://megabyte.space).

Open-source wizardry. 100% wizardry. 0% robes.

---

<div align="center">

**[megabyte.space](https://megabyte.space)**

</div>
