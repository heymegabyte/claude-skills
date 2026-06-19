# Template.projectsites.dev — 100 Lightning-Build Upgrades

Canonical roadmap for `heymegabyte/template.projectsites.dev` (and the `apps/builder` pipeline).

**Goal**: cut wall-clock build from ~12-25min to ≤90s for a full 14-page emit. 10 categories × 10 ideas = 100.

Brian (2026-05-11): *"Come up with 100 ideas + recommendations + upgrades on how to improve heymegabyte/template.projectsites.dev and then integrate them so that we can achieve lightning quick website builds."*

## 1 · Build & Bundle Speed (1-10)

1. **Bun-everywhere** — replace Node+npm with Bun (10× install, 2× build vs npm); stable on Vite 5 + React 19.
2. **Pre-compiled template shell to R2** — emit `template-shell-<sha>.tar.zst` per release; builder extracts (~200ms) vs `git clone` (~8s).
3. **esbuild dev server** — replace Vite dev for builder previews (sub-100ms cold-start); production still via Vite/Rollup.
4. **Lightning CSS** — drop PostCSS; Tailwind v4 ships with it natively (10× faster, Rust-native).
5. **SWC JSX transform** — `@vitejs/plugin-react-swc`; 20× faster cold-start vs Babel.
6. **Vendor-chunk per block** — `manualChunks` per block-slug; only changed blocks invalidate cache; CDN hit-rate 95%+.
7. **Skip typecheck during build** — `tsc --noEmit` runs in parallel; build never blocks on types; CI gate still enforces.
8. **Persistent build cache in R2** — keyed by `pnpm-lock.yaml` hash; cold builds restore `node_modules/.cache` + `dist/.vite` (~3s vs 45s fresh).
9. **Tree-shake unused CSS** — `unused-css-purge` post-build; cuts CSS 60-80% (beyond Tailwind utility-level).
10. **HTTP/3 + Brotli 11** — Cloudflare auto-enables; confirm `Content-Encoding: br`; cuts download 18-25% vs gzip.

## 2 · Block Library Composability (11-20)

11. **Codegen `<HomepageRenderer>`** — derive from `blocksManifest.schema.json`; adding a block is one PR, no main-renderer edit.
12. **Storybook-equivalent block gallery** — `npm run blocks` opens gallery of all 50 blocks with hot props editing.
13. **Zod-validated block props** — every block exports `Schema = z.object({...})`; runtime validates at mount; compile-time via `z.infer`.
14. **`<link rel="modulepreload">`** — per-block preload hints in HTML head from `blocksManifest.json`; cuts INP for below-fold blocks.
15. **Named View Transitions per block** — `view-transition-name: block-<slug>` enables smooth swaps on AI regen.
16. **Block manifest version pinning** — `block.version: 'v1.2.0'`; rollback by changing one string.
17. **Per-block dependency graph** — `block.deps: ['hls.js','@mapbox/mapbox-gl']`; only present blocks pull deps; cuts vendor chunks 40-60%.
18. **Per-block error boundary** — one bad block can't kill homepage; renders "block unavailable" + reports to Sentry.
19. **A/B variants baked in** — `props.variant: 'A'|'B'`; PostHog feature flags pick winner.
20. **Edit-mode overlay** — `?edit=1` shows block name + props badge; one-click "regenerate this block" via builder API.

## 3 · Data Pipeline (21-30)

21. **Research JSON v2 schema** — single source of truth per page (copy + citations + media + meta + JSON-LD); no cross-file imports.
22. **Citations injected in research phase** — research agent writes `_citations.json` per page; assembly just consumes.
23. **`Conf<T>` confidence wrapper required** — every numeric field is `{value: T, conf: 0-1, sources: string[]}`; <0.7 confidence blocks deploy.
24. **Source-fidelity diff report** — builder emits `_fidelity.json`; gate fails if >5% of source pages missing.
25. **DTCG-compliant brand tokens** — brand extraction writes W3C Design Token Format JSON via Style Dictionary; fuels CSS vars + Tailwind theme.
26. **Auto 9-stop OKLCH palette** — single brand hex → `--c-50…--c-950` with perceptually uniform spacing; ships as `colors.css`.
27. **Per-page references file auto-generated** — `_citations.json[<slug>]` → `src/data/citations/<slug>.ts`; codegen, no manual write.
28. **Per-page `_meta.json`** — title/desc/og/twitter/jsonLd pre-computed at research time; renderer just reads.
29. **JSON-LD scaffold per page-type** — `homepage|services|about|team|contact|blog|faq` each get canonical JSON-LD template filled from research.
30. **Wayback Machine fallback** — when live source 404s, fetch oldest healthy capture; critical for rebuilding dead sites.

## 4 · Media Pipeline (31-40)

31. **Parallel image generation** — 1 GPT Image call per slot, full fanout (15-30 slots/site → 30s total vs 7min serial).
32. **Pre-warm OG image cache** — Worker cron daily refreshes OG cards; CDN serves from cache.
33. **Logo→favicon pipeline** — Ideogram v3 for logo → `sharp` emits 16+ favicon variants (all sizes, maskable, monochrome, splash).
34. **R2 image transforms** — `?w=800&fmt=webp&q=85` via Cloudflare Image Resizing; drops Cloudinary; cuts $/mo 90%.
35. **`<picture>` with AVIF+WebP+JPEG** — triple `<source>` per `<img>`; AVIF is 25% smaller than WebP.
36. **Topic-matched Pexels** — per-page topic → Pexels search → top result; fallback when AI image fails relevance gate.
37. **Sora b-roll for hero-video-loop** — 12s loop from `videoBrief`; AV1 + H.264 dual encode.
38. **NotebookLM podcast parallel** — per-site podcast runs alongside image gen, not after; cuts critical path 8min.
39. **GPT Image 2 vision auto-alt-text** — every image gets vision-generated alt-text; a11y score jump 78 → 98.
40. **Image-relevance gate ≥8/10** — GPT Image 2 vision judges section-topic match; below threshold auto-regenerates (max 3 rounds).

## 5 · SEO Automation (41-50)

41. **Per-route metadata validator** — `validate-route-metadata.mjs` checks all 28 required fields; fails build on missing.
42. **JSON-LD validator per page type** — schema.org-aware; catches malformed Organization/LocalBusiness/Article/FAQPage.
43. **Sitemap with `<lastmod>` from git mtime** — auto-generated at build; every URL has accurate last-modified.
44. **Robots.txt per-site tuned** — block AI crawlers on opt-out; allow GoogleBot + Bingbot + DuckDuckBot always.
45. **Canonical URLs from custom hostname** — swap `*.projectsites.dev` for actual domain at build; never ship `workers.dev` canonicals.
46. **Hreflang alternates** — multi-locale sites get `<link rel="alternate" hreflang>` pairs auto-emitted.
47. **Organization JSON-LD from NAP** — name/address/phone → full schema.org Organization with sameAs social handles.
48. **Featured snippet QA** — every page intro forced to 40-60 words, lead-with-answer format; 16%→54% AI citation lift.
49. **Internal-linking auto-inject** — ≥2 internal links per page at assembly time via entity recognition.
50. **`/humans.txt` + `/.well-known/security.txt`** — auto-emitted, links to GitHub repo + contact email.

## 6 · PWA Auto-Scaffold (51-60)

51. **`site.webmanifest` auto-built** — name/short_name/description/icons/screenshots/shortcuts from brand JSON; no hand-edits.
52. **Workbox-generated `sw.js`** — strategies per file type (NetworkFirst HTML, CacheFirst fonts, StaleWhileRevalidate images, NetworkOnly API).
53. **Maskable + monochrome icons** — sharp pipeline pads logo 10% for safe-zone; emits monochrome glyph for iOS pinned-tab.
54. **Screenshot capture in build** — Playwright headless 1280×720 + 412×915 for top 4 routes → `/screenshots/{wide,narrow}-<route>.png`.
55. **Branded `offline.html`** — inline CSS + base64 logo; ≤30KB; matches site theme.
56. **Update-toast component** — `workbox-window` waiting event → "New version — Refresh / Dismiss" toast.
57. **Custom A2HS install banner** — Chrome `beforeinstallprompt` captured + delayed 30s; brand-styled.
58. **Push notification opt-in scaffold** — gated, user-initiated only; never auto-prompt.
59. **Periodic background sync** — content freshness check every 24h when network available.
60. **iOS splash screens** — sharp emits Apple-specific splash images (10 sizes for every iPhone+iPad).

## 7 · Deploy & Runtime (61-70)

61. **Atomic deploy + auto-rollback** — upload to R2 staging → smoke-test → swap pointer; on failure, never touch live.
62. **Parallel `wrangler deploy`** — for multi-site batches, deploy up to 5 concurrent.
63. **Per-site Worker subdomain** — `<slug>.projectsites.dev` auto-routed via wildcard cert; custom hostnames overlay later.
64. **D1 migrations versioned + auto-applied** — `migrations/0001_*.sql`; `wrangler d1 migrations apply` at deploy.
65. **R2 lifecycle rules** — image variants older than 90d auto-deleted; keeps storage costs flat.
66. **`/health` endpoint mandatory** — returns `{status, version, timestamp, bindings}`; uptime checks hit this.
67. **Sentry release tagging** — `SENTRY_RELEASE=$(git rev-parse HEAD)` on every deploy; source-map upload via `sentry-cli`.
68. **Bot Fight Mode auto-on** — Cloudflare API call during provisioning; blocks 99% of scraper traffic.
69. **Hyperdrive for Postgres-backed** — when site uses Postgres, Hyperdrive cuts query latency 8×.
70. **AI Gateway for LLM-backed** — every LLM call through AI Gateway for caching + rate limiting + analytics; cuts cost 30-50%.

## 8 · Quality Gates Parallelism (71-80)

71. **All 18 validators in parallel** — `Promise.all` cuts gate time from ~3min to ~25s.
72. **Validator cache busts only on source change** — checksum source files; skip validators whose inputs haven't changed.
73. **Single JSON report from validators** — `_validation.json` aggregates all 18 outputs; CI displays as expandable tree.
74. **Lighthouse CI post-deploy** — 6-bp; fails build if Perf<75, A11y<95, SEO<90, BP<90.
75. **Playwright AI Healer** — selectors break → AI Healer rewrites on the fly; manual rewrites for true regressions only.
76. **Percy visual diff on PR** — AI-driven visual regression with 40% false-positive reduction.
77. **Axe-core 0-violation gate** — runs at all 6 breakpoints; ADA Title II ready before 2027/2028 deadlines.
78. **Yoast SEO score gate** — GREEN required for title, meta, keyphrase density, internal links, transition words.
79. **Brand-consistency validator** — logos match SVG/PNG variants, colors hit brand hex, fonts load woff2 first.
80. **Citation validator on every claim** — grep `\d+%|\$\d+[MBK]|\d+x` against `_citations.json`; fail on unsourced.

## 9 · AI Generation Speed (81-90)

81. **Prompt caching aggressive** — stable prefix (skill rules + template + research JSON) cached at 90% discount; only delta sent per page.
82. **Streaming `<boltArtifact>` parsing** — apply files as they arrive; first paint ≤30s into generation, not after full response.
83. **Parallel page generation** — 1 LLM call per route, fan-out 14 calls; total time = slowest page.
84. **Differential regeneration** — only rebuild changed pages on iteration N+1; track `_iteration_log.json` diffs.
85. **Background research while user is on intro** — start research before user finishes brief; 30-90s saved.
86. **Pre-warm common research in KV** — BLS volunteer data, USDA food insecurity, Charity Navigator EIN lookups cached 7d.
87. **Cache GPT Image 2 vision per image URL** — same hero image gets vision called once across all sites sharing it.
88. **Template token substitution before LLM** — replace `{{BRAND_HEX}}`, `{{NAP}}`, `{{EIN}}` server-side; cuts prompt 30-40%.
89. **Multi-model routing** — Haiku for SEO copy + slugs, Sonnet for body copy + JSON-LD, Opus for architecture + research synthesis.
90. **Cost-budget guard rails** — estimate before run, abort if >$X; default $2-5 per full 14-page emit.

## 10 · Distribution & Observability (91-100)

91. **Auto-provision GA4+GTM+PostHog+Sentry** — `provision-analytics.sh` at end-of-scaffold; zero manual dashboard work.
92. **Auto Sentry release** — `sentry-cli releases new` + sourcemaps upload + finalize on deploy.
93. **Listmonk auto-provisioned** — Coolify VM, Resend SMTP relay, list created with brand-styled welcome email.
94. **CSP report-uri** — per site, `/csp-report` endpoint logs to D1; alerts on spike.
95. **Stripe webhook scaffold** — idempotent receiver, signature verification, Inngest fan-out; ships in template.
96. **Status page auto-register** — site added to `statushub.megabyte.space` on first deploy.
97. **Auto-submit to Google Search Console** — API call after first deploy; sitemap immediately indexed.
98. **Auto-submit to Bing Webmaster Tools** — same as #97 for Bing.
99. **Schema.org Markup Validator** — runs `validator.schema.org` against live URL post-deploy; warnings logged, errors fail build.
100. **Auto land-grab on first deploy** — Namecheap (domain reserved), npm (package name held), X+IG+TikTok (@handles claimed), GitHub org; defensive only, ~$50/site amortized.

## Top-10 quick wins (highest ROI, ship FIRST)

**Effort scale**: S=≤4h, M=≤1d, L=≤3d, XL=≤1w. **Impact**: speed = wall-clock saved per build; quality = downstream defect reduction.

| # | Idea | Effort | Build-time saved | Notes |
|---|------|--------|------------------|-------|
| 81 | Prompt caching aggressive | S | 8-12min/site | one-time skill+template prefix |
| 83 | Parallel page generation | M | 9-15min/site | fan-out 14 LLM calls instead of serial |
| 31 | Parallel image generation | S | 5-7min/site | formalize existing partial implementation |
| 82 | Streaming `<boltArtifact>` parsing | M | 1-3min/site (perceived: first paint ≤30s) | massive UX win |
| 84 | Differential regeneration | M | 10-20min on iteration | only rebuild changed pages |
| 71 | All 18 validators in parallel | S | 2-3min/site | `Promise.all` |
| 2 | Pre-compiled template shell to R2 | M | 8-12s/site | one-time R2 emit per template release |
| 88 | Template token substitution before LLM | S | 30-90s/site + lower API cost | replace `{{BRAND_HEX}}` etc. server-side |
| 89 | Multi-model routing | S | $1-3/site saved | Haiku for slugs, Sonnet for body, Opus for arch |
| 33 | Logo→favicon pipeline | M | 5-10min/site (manual work eliminated) | `sharp` pipeline |

Sum of top-10 wins: **~35-65 minutes saved per site**, plus $2-4/site cost reduction. Wall-clock target: 12-25min → ≤90s achievable when combined.

## Integration roadmap (phased)

- **Phase 1 (speed wins, ship first)** — 81, 83, 31, 82, 71, 88, 89. Touches `apps/builder/src/{generator,pipeline}` + `apps/builder/prompts/_creativity_preamble.txt`. No template changes.
- **Phase 2 (template polish)** — 2, 11, 13, 17, 18. Touches `template.projectsites.dev/{vite.config.ts,src/components/blocks}`. New `blocksManifest.schema.json`.
- **Phase 3 (quality + observability)** — 41, 71-80, 91-94. New `_validation.json` aggregator, parallel validator runner.
- **Phase 4 (PWA + SEO auto-scaffold)** — 33, 41-50, 51-60.
- **Phase 5 (ongoing — distribution)** — 91-100. Run on every new site provision.

Block library (50 blocks) is Phase 2 prerequisite — see `15-site-generation/homepage-block-library.md`.

## Reference

- Pairs with: `template-system.md` + `build-prompts.md` + `quality-gates.md` + `homepage-block-library.md`.
- Tracks: `~/.claude/projects/-Users-apple-emdash-projects-projectsites-dev/memory/project_progressive_rebuild.md` (delight queue) — every iteration must surface ≥1 new delight from the list above.
- This file IS the integration plan; new ideas append here, never inline elsewhere.
