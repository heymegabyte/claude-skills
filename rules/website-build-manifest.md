---
name: "website-build-manifest"
priority: 2
pack: "website-build"
triggers:
  - "build a website"
  - "rebuild"
  - "projectsites"
  - "finish the website"
  - "one-line site"
  - "make a site"
  - "website prompt"
paths:
  - "org:website_build"
---

# Website Build Manifest

The single acceptance checklist a one-line projectsites.dev / Emdash website prompt must satisfy before DONE. Loads only on website prompts (pack `website-build`) — not always-on. Each item links the rule carrying the detail; this file is the index, not the spec.

> **Why priority 1**: the `website-build` pack (~25 members, >40K tokens) exceeds the router's load budget, so a site prompt can't load every member — the router ranks + truncates. This lean index loads FIRST and cross-links the full requirement set, so completeness survives truncation: load this, then pull each detail rule on demand. Keeping it small is the routing optimization — never inline spec here.
Cross-links: `[[always]]` `[[website-build-doctrine]]` `[[competitor-research]]` `[[source-site-enhancement]]` `[[emdash-fleet]]` `[[verification-loop]]`

## Phase order (one prompt → full product)

1. **Phase -1 competitor research** — top 5-10 peer sites, 100-pt rubric, set the floor (`[[competitor-research]]`). Skipping = build fail.
2. **Phase 0 context saturation** — research → `_research.json`/`_brand.json`/`_assets.json` before code (`[[website-build-doctrine]]`).
3. **Phases 1-6 build loop** — template clone → maximalist enrichment → swap-out authority → AI-native spiral → agent swarm → "what else" loop.
4. **Fan out** — multi-faceted site prompt fires the Monitor in the FIRST tool message (`[[monitor-orchestration]]`, `[[emdash-fleet]]`).

## Per-page technical gates (see `[[always]]` § Every page)

- Keyphrase-first title 50-60 chars · meta desc 120-156 · one H1 · canonical.
- **`<head>` server-side per-route** via Worker `HTMLRewriter` — NEVER client-only (else whole site collapses to one indexable URL).
- JSON-LD only when accurate (WebPage floor; never pad; FAQPage only with real Q&A).
- OG 1200×630 ≤100KB branded card · 2+ internal + 1+ outbound links · Yoast GREEN.
- `fetchpriority="high"` on LCP img + preload · font woff2 preload · DNS-prefetch.

## Per-site required assets (see `[[always]]` § Every site)

- `site.webmanifest` (screenshots/shortcuts/share_target) · split-by-purpose `robots.txt` · `humans.txt` · `sitemap.xml` with content-true `<lastmod>` · `security.txt` · favicon set · apple-touch-icon · kill-switch SW.
- AVIF-primary images >200KB · JS chunks ≤250KB gz.
- Contact/HQ page with address → MANDATORY branded Google Map pointed at the exact address.

## Cinematic + interaction (skill 16, `[[website-build-doctrine]]`)

- 100 build-breaking rules across 10 categories satisfied before DONE.
- View Transitions · scroll-driven motion · `@starting-style` · `prefers-reduced-motion`.
- Full-featured Lightbox on all image groups · Cmd/Ctrl-K palette auto-focus.

## Architecture (CF-first, `[[cloudflare-lock-in-is-leverage]]`)

- React 19 + Vite SSR/SSG + TanStack Router + Tailwind v4 + shadcn (default), OR Angular 21 stack when chosen (`[[frontend-stack]]`).
- CF Workers + Hono + D1 + R2 + KV + DO (`[[hono-api]]`). Deep lock-in is the feature.
- Every clickable entity linked (email/phone/URL/route) — unlinked email/phone = build fail.
- Every form: Turnstile + Zod + Resend deliverability gate.

## Quality gates (every gate green before DONE)

- Deployed + CDN-purged at real URL · Playwright E2E GREEN at 6 breakpoints (`[[verification-loop]]`).
- AI vision ≥9/10 · Lighthouse perf ≥90 / a11y ≥95 / SEO ≥95 / BP ≥95 · axe 0 violations (WCAG 2.2 AA). Thresholds are authoritative from `~/.claude` env (`EMDASH_LIGHTHOUSE_MIN_*`, `EMDASH_AI_VISION_MIN`, `EMDASH_AXE_MAX_VIOLATIONS`) — read those, never hardcode looser.
- CSP Level 3 strict-dynamic + nonce · Trusted Types · all hyperlinks valid · INP ≤200ms.
- Every new feature behind a flag (`[[feature-flags]]`, default off) · JSON-LD per page (accurate types only).
- Zero errors / stubs / TODO in shipped strings · zero unactioned Recs.

## Build defaults — read from `~/.claude` env (AUTHORITATIVE — never hardcode looser)

The harness config is the source of truth for site-build defaults; read these, don't assume:

- `EMDASH_FRONTEND_DEFAULT` (react-19-vite) / `EMDASH_FRONTEND_FALLBACK` (angular-21) — stack choice per `[[frontend-stack]]`.
- `EMDASH_SITE_MODE` (cinematic-pwa-spa) — the build profile (cinematic + PWA + SPA).
- `EMDASH_PWA_REQUIRED` (true) — `[[web-manifest-system]]` PWA assets + kill-switch SW are mandatory.
- `EMDASH_JSONLD_REQUIRED` (true) — JSON-LD per page (accurate types only).
- `EMDASH_LIGHTHOUSE_MIN_PERF` (90) `_MIN_A11Y` (95) `_MIN_SEO` (95) `_MIN_BP` (95) · `EMDASH_AI_VISION_MIN` (9) · `EMDASH_AXE_MAX_VIOLATIONS` (0) — the quality bar above.

## Build-gate validators — where they live (don't hunt the plugin)

The `validate-*.mjs` build-gates a rule names (and their `build_validators.ts` orchestrator) live in the **generated site's** repo, scaffolded from `template.projectsites.dev` — NOT in this plugin. The rule defines WHAT each checks + the fail codes; the build CREATES the validator from that spec, wires it into `build_validators.ts`, and runs it in CI. A referenced validator missing from `bin/` is expected — generate it, don't skip the gate.

## Done definition (overrides generic gates for site prompts)

- Deployed at real URL · every gate green · Self-Verify Statement per route · announced to user.
- Reusable patterns flow BACK to `template.projectsites.dev` SAME TURN.

## Full rule set — load on demand (router truncates the >40K website-build pack)

<!-- grow-ok --> The pack exceeds budget, so not every member co-loads. This is the complete recoverable index — pull any of these when its concern is in scope:

- **Stack foundation**: `[[shadcn-design-system]]` (React default) OR `[[spartan-ui-design-system]]` (Angular) · `[[frontend-stack]]`
- **Cinematic + design**: `[[cinematic-ui-patterns]]` (RollingCounter/Reveal, React+Angular) · `[[gorgeous-by-default]]` · `[[text-contrast]]` · `[[logo-contrast]]` · `[[image-quality]]`
- **Content + brand**: `[[copy-writing]]` · `[[citations]]` · `[[timeline-authenticity]]` · `[[i18n-by-demographics]]` · `[[thin-source-amplification]]`
- **Forms + comms**: `[[email-deliverability]]` (every-form gate)
- **Skills (numbered)**: `[[02-goal-and-brief]]` · `[[15-site-generation]]` · `[[16-cinematic-website-prime-directive]]` · `[[09-brand-and-content-system]]` · `[[10-experience-and-design-system]]` · `[[11-motion-and-interaction-system]]` · `[[12-media-orchestration]]` · `[[14-independent-idea-engine]]`
- **Final pass**: `[[supreme-polish]]`

## See

- `[[always]]` — the per-page/per-site/per-entity detail this manifest indexes
- `[[website-build-doctrine]]` — Phase -1 → Phase 8 sequence
- `[[source-site-enhancement]]` — when the prompt names an existing domain to rebuild
