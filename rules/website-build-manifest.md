---
name: "website-build-manifest"
priority: 1
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
  - "concern:public"
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
- AI vision ≥8/10 · Lighthouse a11y ≥95 / perf ≥75 · axe 0 violations (WCAG 2.2 AA).
- CSP Level 3 strict-dynamic + nonce · Trusted Types · all hyperlinks valid · INP ≤200ms.
- Every new feature behind a flag (`[[feature-flags]]`, default off) · JSON-LD per page (accurate types only).
- Zero errors / stubs / TODO in shipped strings · zero unactioned Recs.

## Done definition (overrides generic gates for site prompts)

- Deployed at real URL · every gate green · Self-Verify Statement per route · announced to user.
- Reusable patterns flow BACK to `template.projectsites.dev` SAME TURN.

## See

- `[[always]]` — the per-page/per-site/per-entity detail this manifest indexes
- `[[website-build-doctrine]]` — Phase -1 → Phase 8 sequence
- `[[source-site-enhancement]]` — when the prompt names an existing domain to rebuild
