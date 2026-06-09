# Standards Kernel

Reference these by ID. Don't repeat definitions across files.

## #wcag22 — WCAG 2.2 AA (9 new criteria)

- 2.4.11 Focus Appearance · 2.4.12 Focus Not Obscured Min · 2.4.13 Focus Not Obscured Enhanced · 2.5.7 Dragging Movements · 2.5.8 Target Size 24px · 3.2.6 Consistent Help · 3.3.7 Redundant Entry · 3.3.8 Accessible Auth Min · 3.3.9 Accessible Auth Enhanced
- axe-core auto-tests ONLY 2.5.8; other 8 require manual review or axe DevTools Pro
- Contrast ≥4.5:1 normal, ≥3:1 large/UI

## #ada — ADA deadlines (DOJ Title II, extended Apr 2026 IFR)

- ≥50K pop → Apr 26 2027
- <50K / special districts → Apr 26 2028
- Standard: WCAG 2.1 AA
- HHS Section 504: May 2026 healthcare federal-fund recipients

## #owasp2025 — OWASP Top 10:2025

1. Broken Access Control (incl SSRF)
2. Security Misconfiguration
3. Supply Chain
4. Injection
5. Crypto Failures
6. (new) #10 Mishandling Exceptional Conditions

## #cwv — Core Web Vitals (cinematic targets)

- LCP ≤2.0s (target ≤1.5s)
- CLS ≤0.05
- INP ≤100ms (≤200ms = fail)
- Debug INP via Long Animation Frames API (LoAF, Chrome 123+)

## #breakpoints — 6 breakpoints

375 (iPhone SE) · 390 (Pixel 7) · 768 (iPad) · 1024 (laptop) · 1280 (desktop) · 1920 (wide)

## #budget — Asset budget per route

- JS ≤200KB gz total, no chunk >250KB gz
- CSS ≤50KB gz
- Fonts ≤100KB woff2 preload
- Largest image ≤200KB
- Total images ≤500KB
- Hero ≤150KB

## #brand — Megabyte brand

- Colors: `#060610` `#00E5FF` `#50AAE3` `#7C3AED`
- Fonts: Sora (body) · Space Grotesk (headings) · JetBrains Mono · Clash Display (hero)
- Tone: dark-first, bold, anti-slop, "Hey" not "Hi"
- Contact: `hey@megabyte.space`

## #ailen — Banned anti-slop copy

`delve | leverage | unleash | revolutionize | best-in-class | cutting-edge | discover | innovative | seamless | robust | synergy | elevate | empower | transformative | limitless | game-changing | next-generation | world-class | turnkey | disrupt | scalable | utilize | facilitate | state-of-the-art | paradigm | holistic | harness | foster | bolster | spearhead | tapestry | landscape | ecosystem | streamline | cornerstone | pivotal | myriad | plethora | supercharge | boundless`

Banned unsourced authority: `studies show | research suggests | most users | industry-leading | trusted by | proven | widely-recognized | leading provider | recent studies | experts agree | countless | numerous | typically | generally`

## #aicrawlers — robots.txt AI crawler list

Explicit Allow/Disallow per: GPTBot · ClaudeBot · Claude-User · Claude-SearchBot · PerplexityBot · Google-Extended · CCBot · Bytespider

## #jsonld — Required JSON-LD per page

WebPage floor. Add Organization · BreadcrumbList · FAQPage · Person · Product · Service ONLY when real entities. Never pad. FAQPage only when real Q&A exists.

## #stack — Default stack

- Edge: CF Workers + Hono
- Frontend: React 19 + Vite + SSR/SSG + TanStack Router + Tailwind v4 + shadcn/ui (default) OR Angular 21 + Nx + Spartan UI (when chosen)
- DB: D1 (read-replicas, Sessions API) / Neon (via Hyperdrive)
- Cache: Upstash / KV
- ORM: Drizzle v1 RQBv2 + Zod
- Auth: Clerk (M2M JWT)
- Payments: Square (accept) / Stripe Billing (SaaS recurring) / Stripe Connect (payouts)
- Jobs: Inngest / Workflows v2
- Email: Resend
- Runtime: Node 22 native TS / Bun 1.2+
- TS: 5.9+ strict
- Lint: oxlint + ESLint 9 + Prettier (NEVER Biome)
- Hooks: lefthook (NOT husky)
- Test: Playwright v1.59+ + Vitest 3
- Observability tiers — solo: PostHog + Workers Tracing; enterprise: + Sentry + GA4 + Axiom; LLM-heavy: + AI Gateway

## #integrations — Auto-provision tiers

Tier 1 (solo): PostHog + Workers Tracing
Tier 2 (enterprise): + Sentry `@sentry/cloudflare` v9 + GA4/GTM + Axiom
Tier 3 (AI-heavy >10k LLM/mo): + AI Gateway

## #model — Model routing

- Opus 4.7 (`claude-opus-4-7`) — architecture, security review, planning, visual QA, completeness, multi-file refactor. 1M context, 128K output. Adaptive thinking only.
- Sonnet 4.6 (`claude-sonnet-4-6`) — standard implementation, feature, debug, test, simplify, deploy. 1M context, 64K output.
- Haiku 4.5 (`claude-haiku-4-5`) — format, lint, changelog, content, simple review, hook eval, cost estimate. 200K context, 64K output.
- Subagent default: `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6`

## #cmdk — Cmd+K mandate

`Meta+K` / `Ctrl+K` opens AI chat or command palette AND focuses input on same frame. `autofocus` + post-mount `.focus()` OR `requestAnimationFrame(() => inputRef.current?.focus({preventScroll:true}))` after open-state flip. Already open → re-focus + select text. Esc → return focus to trigger. Build gate: Playwright `press('Meta+K')` then assert input focused.

## #hooks — Determinism order

hooks > rules > skills > prompts

Wired in `~/.claude/settings.json` § hooks.*:

- `~/.claude/hooks/enforce-tdd-e2e.py` (PostToolUse)
- `~/.claude/hooks/session-start-reminders.py` (SessionStart)
- `~/.claude/hooks/sync-desktop-skills.py` (Stop + UserPromptSubmit)
