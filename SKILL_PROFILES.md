# Skill Profiles

Maps project types to skill subsets. Not all 49 skills apply to every project.

## Quick-Match: Domain Name to Profile

| Domain Pattern | Profile |
|---------------|---------|
| *-foundation, *-mission, *-charity, donate-*, give-* | Nonprofit / Donation |
| *-api, *-service, api.*, *-sdk | API Service |
| *-cli, *-tool, *-lib, *-plugin | Developer Tool / OSS |
| *-app, *-dashboard, *-portal, *-hub | SaaS Application |
| Everything else (landing pages, portfolios, info sites) | Marketing Site |

When the domain name is ambiguous, check the folder contents:
- Has `package.json` with Angular/React → SaaS or Dev Tool
- Has only `wrangler.toml` → Marketing Site or API Service
- Has `schema.sql` or Drizzle config → SaaS Application
- Is empty → Marketing Site (default)

---

## Marketing Site

Simple landing page, no auth, no database.

### Included Skills

| # | Skill | Why |
|---|-------|-----|
| 01 | Operating System | Supreme policy, always loaded |
| 02 | Goal and Brief | Product thesis drives copy and layout |
| 06 | Build and Slice Loop | Vertical slices, homepage-first |
| 07 | Quality and Verification | Testing, security, a11y, performance |
| 08 | Deploy and Runtime Verification | Deploy, purge, verify live |
| 09 | Brand and Content System | Copy, trust signals, legal, SEO |
| 10 | Experience and Design System | Typography, color, layout, components |
| 11 | Motion and Interaction System | Transitions, scroll reveals, hover |
| 12 | Media Orchestration | Images, video, logos, social |
| 15 | Easter Eggs | Mandatory hidden delights |
| 16 | Domain Provisioning | Auto-provision CF Worker + DNS |
| 20 | Accessibility Gate | axe-core, focus styling, WCAG AA |
| 24 | Web Manifest System | Sitemap, robots, PWA, opensearch |
| 28 | SEO and Keywords | Keyword research, per-page targeting |
| 29 | Documentation and Codebase Hygiene | README, CLAUDE.md, JSDoc |
| 30 | AI-Native Coding | AI-optimized code patterns |
| 31 | Custom Error Pages | Branded 404, 500, 503, offline |
| 32 | Contact Forms and Endpoints | Working forms with Turnstile, Resend |
| 34 | Launch Day Sequence | Submit sitemap, announce, verify |
| 42 | Internationalization | EN+ES minimum, hreflang |
| 51 | Wisdom and Human Psychology | Cialdini, Kahneman, ethics |

### Skipped Skills

| # | Skill | Why Skipped |
|---|-------|-------------|
| 13 | Observability and Growth | No analytics depth needed for simple landing page |
| 36 | Onboarding and First Run | No user accounts, no onboarding flow |
| 37 | Site Search | Not enough content to warrant search |
| 44 | Drizzle ORM and Migrations | No database |
| 45 | Webhook System | No integrations requiring webhooks |
| 46 | Admin Dashboard | No admin functionality |
| 47 | Keyboard Shortcuts | No app-like interactions |
| 48 | Empty States and Loading | No dynamic lists or data loading |
| 49 | Notification System | No users to notify |

---

## SaaS Application

Full-stack with auth, billing, database, and user accounts.

### Included Skills

| # | Skill | Why |
|---|-------|-----|
| 01 | Operating System | Supreme policy, always loaded |
| 02 | Goal and Brief | Product thesis, users, success criteria |
| 03 | Planning and Research | Research, planning, decomposition |
| 04 | Preference and Memory | User prefs, VoC, memory |
| 05 | Architecture and Stack | Platform, services, auth, data |
| 06 | Build and Slice Loop | Vertical slices, anti-placeholder |
| 07 | Quality and Verification | Testing, security, a11y, performance |
| 08 | Deploy and Runtime Verification | Deploy, purge, verify, rollback |
| 09 | Brand and Content System | Copy, trust, legal, SEO |
| 10 | Experience and Design System | Typography, color, layout, components |
| 11 | Motion and Interaction System | Transitions, scroll, hover |
| 12 | Media Orchestration | Images, video, logos |
| 13 | Observability and Growth | Analytics, Sentry, Stripe, email |
| 14 | Independent Idea Engine | Research improvements, propose upgrades |
| 15 | Easter Eggs | Mandatory hidden delights |
| 18 | Stripe Billing | Free tier + pro, payments |
| 20 | Accessibility Gate | axe-core, WCAG AA |
| 24 | Web Manifest System | Sitemap, robots, PWA |
| 28 | SEO and Keywords | Keyword research, per-page targeting |
| 29 | Documentation and Codebase Hygiene | README, CLAUDE.md, JSDoc |
| 30 | AI-Native Coding | AI-optimized code patterns |
| 31 | Custom Error Pages | Branded 404, 500, 503 |
| 32 | Contact Forms and Endpoints | Working forms with Turnstile |
| 33 | Blog and Content Engine | SEO blog, RSS, categories |
| 34 | Launch Day Sequence | Submit sitemap, announce, verify |
| 36 | Onboarding and First Run | Welcome flow, checklist, activation |
| 37 | Site Search | D1 LIKE or Vectorize, Cmd+K |
| 42 | Internationalization | EN+ES minimum, hreflang |
| 44 | Drizzle ORM and Migrations | Schema conventions, migrations |
| 45 | Webhook System | Stripe/Clerk/GitHub webhooks |
| 46 | Admin Dashboard | Lightweight /admin panel |
| 47 | Keyboard Shortcuts | Cmd+K palette, ? overlay |
| 48 | Empty States and Loading | Action prompts, skeleton screens |
| 49 | Notification System | Push + in-app + email fallback |
| 51 | Wisdom and Human Psychology | Cialdini, Kahneman, ethics |
| 52 | MCP and Cloud Integrations | MCP servers, Slack/Discord/Zapier |

### Skipped Skills

| # | Skill | Why Skipped |
|---|-------|-------------|
| 16 | Domain Provisioning | Already deployed, domain configured |

---

## Nonprofit / Donation Site

Mission-driven site with donation flow, no full SaaS auth.

### Included Skills

| # | Skill | Why |
|---|-------|-----|
| 01 | Operating System | Supreme policy, always loaded |
| 02 | Goal and Brief | Mission thesis, donor personas |
| 06 | Build and Slice Loop | Vertical slices, homepage-first |
| 07 | Quality and Verification | Testing, security, a11y, performance |
| 08 | Deploy and Runtime Verification | Deploy, purge, verify |
| 09 | Brand and Content System | Trust signals critical for donations |
| 10 | Experience and Design System | Typography, color, layout |
| 11 | Motion and Interaction System | Emotional storytelling animations |
| 12 | Media Orchestration | Impact photos, video testimonials |
| 15 | Easter Eggs | Mandatory hidden delights |
| 18 | Stripe Billing | Donation flow (GiveDirectly-style) |
| 19 | Email Templates | Donation receipts, thank-you emails |
| 20 | Accessibility Gate | Nonprofits must be maximally accessible |
| 24 | Web Manifest System | Sitemap, robots, PWA |
| 28 | SEO and Keywords | Keyword research for cause discovery |
| 29 | Documentation and Codebase Hygiene | README, CLAUDE.md |
| 30 | AI-Native Coding | AI-optimized code patterns |
| 31 | Custom Error Pages | Branded error pages |
| 32 | Contact Forms and Endpoints | Volunteer/contact forms |
| 33 | Blog and Content Engine | Impact stories, updates |
| 34 | Launch Day Sequence | Submit sitemap, announce |
| 42 | Internationalization | EN+ES minimum, reach more donors |
| 51 | Wisdom and Human Psychology | Persuasion ethics for donation CTAs |

### Conditional Skills

| # | Skill | Condition |
|---|-------|-----------|
| 43 | AI Chat Widget | Include if enough content to power RAG chat |

---

## API Service

Headless backend, no frontend.

### Included Skills

| # | Skill | Why |
|---|-------|-----|
| 01 | Operating System | Supreme policy, always loaded |
| 02 | Goal and Brief | API purpose, consumers, success criteria |
| 05 | Architecture and Stack | Platform, services, data layer |
| 06 | Build and Slice Loop | Vertical slices, anti-placeholder |
| 07 | Quality and Verification | Testing, security, performance |
| 08 | Deploy and Runtime Verification | Deploy, verify endpoints |
| 13 | Observability and Growth | Analytics, Sentry, error tracking |
| 28 | SEO and Keywords | API discoverability (if public) |
| 29 | Documentation and Codebase Hygiene | OpenAPI spec, README |
| 30 | AI-Native Coding | AI-optimized code patterns |
| 38 | Uptime and Health | Health endpoints, monitoring, status page |
| 40 | Backup and Disaster Recovery | D1/KV/R2 exports, cron backups |
| 44 | Drizzle ORM and Migrations | Schema conventions, migrations |
| 45 | Webhook System | Event routing, idempotency |
| 51 | Wisdom and Human Psychology | API design ethics, developer empathy |
| 52 | MCP and Cloud Integrations | MCP servers, secrets, integrations |

### Skipped Skills

| # | Skill | Why Skipped |
|---|-------|-------------|
| 09 | Brand and Content System | No frontend to brand |
| 10 | Experience and Design System | No UI |
| 11 | Motion and Interaction System | No UI |
| 12 | Media Orchestration | No visual assets |
| 15 | Easter Eggs | No user-facing pages |

---

## Developer Tool / Open Source

OSS project with docs, changelog, community focus.

### Included Skills

| # | Skill | Why |
|---|-------|-----|
| 01 | Operating System | Supreme policy, always loaded |
| 02 | Goal and Brief | Tool purpose, target developers |
| 06 | Build and Slice Loop | Vertical slices, anti-placeholder |
| 07 | Quality and Verification | Testing, security, a11y, performance |
| 08 | Deploy and Runtime Verification | Deploy, verify |
| 09 | Brand and Content System | Project identity, docs site copy |
| 10 | Experience and Design System | Docs site design |
| 11 | Motion and Interaction System | Subtle polish on docs |
| 12 | Media Orchestration | Logos, social cards, diagrams |
| 15 | Easter Eggs | Mandatory hidden delights |
| 20 | Accessibility Gate | Docs must be accessible |
| 24 | Web Manifest System | Sitemap, robots, PWA |
| 28 | SEO and Keywords | Discoverability for developers |
| 29 | Documentation and Codebase Hygiene | README, CONTRIBUTING, JSDoc |
| 30 | AI-Native Coding | AI-optimized code patterns |
| 31 | Custom Error Pages | Branded error pages |
| 33 | Blog and Content Engine | SEO blog for tutorials, announcements |
| 34 | Launch Day Sequence | Submit sitemap, announce, verify |
| 35 | CI/CD Pipeline | GitHub Actions: deploy on push, E2E on PR |
| 37 | Site Search | Cmd+K for docs search |
| 39 | Changelog and Releases | Auto-generate from git, GitHub Releases |
| 47 | Keyboard Shortcuts | Cmd+K palette for docs navigation |
| 51 | Wisdom and Human Psychology | Community building, contributor empathy |

---

## Micro-SaaS (Single-Feature Tool)

Lightweight paid tool — no complex onboarding, minimal admin. Think "one API endpoint with a pretty UI."

### Included Skills

| # | Skill | Why |
|---|-------|-----|
| 01 | Operating System | Supreme policy, always loaded |
| 02 | Goal and Brief | Product thesis, single feature clarity |
| 05 | Architecture and Stack | Platform, services, data |
| 06 | Build and Slice Loop | Vertical slices, anti-placeholder |
| 07 | Quality and Verification | Testing, security, a11y |
| 08 | Deploy and Runtime Verification | Deploy, verify |
| 09 | Brand and Content System | Trust, copy, legal |
| 10 | Experience and Design System | Clean, focused UI |
| 12 | Media Orchestration | Logo, OG image |
| 15 | Easter Eggs | Mandatory hidden delights |
| 18 | Stripe Billing | Simple pricing (free + pro) |
| 20 | Accessibility Gate | WCAG AA |
| 24 | Web Manifest System | Sitemap, robots |
| 28 | SEO and Keywords | Discoverability |
| 29 | Documentation and Codebase Hygiene | README, CLAUDE.md |
| 30 | AI-Native Coding | Code quality |
| 31 | Custom Error Pages | Branded errors |
| 44 | Drizzle ORM | Schema if DB needed |
| 45 | Webhook System | Stripe webhooks |
| 51 | Wisdom and Human Psychology | Conversion ethics |

### Skipped Skills

| # | Skill | Why Skipped |
|---|-------|-------------|
| 33 | Blog Engine | Too heavy for micro-SaaS launch |
| 36 | Onboarding | Single feature, no onboarding needed |
| 37 | Site Search | Not enough content |
| 42 | Internationalization | Only if explicitly needed |
| 46 | Admin Dashboard | No admin complexity |
| 49 | Notification System | Overkill for simple tool |

---

## Profile Selection Decision Tree

```
Is there a database schema or user auth?
├── YES → Is it a full product with multiple features?
│   ├── YES → SaaS Application
│   └── NO → Micro-SaaS
└── NO → Is there a public API with no UI?
    ├── YES → API Service
    └── NO → Is it an open-source tool with docs?
        ├── YES → Developer Tool / OSS
        └── NO → Does it accept donations?
            ├── YES → Nonprofit / Donation
            └── NO → Marketing Site
```
