---
description: Progressive multimedia enrichment pass — add high-value audio/video/image/interactive to a site, run again and again
argument-hint: [route or "whole site"]
---

Run a repeatable progressive-multimedia enrichment pass per [[website-build-doctrine]] (Phase 2 maximalist enrichment + Phase 4 AI-native spiral already own podcasts/Veo/maps — this command is the iterative discipline that ships them page-by-page).

**Purpose** — make a website measurably richer every run: the right audio/video/image/interactive media, added where it helps the user, never at the cost of performance or a11y.

**When to use** — after a site is functional and you want to deepen it; re-run until satisfied. Targets `$ARGUMENTS` (a route, or `whole site`).

**Inputs** — `$ARGUMENTS` (route or `whole site`); the live project; `docs/multimedia-roadmap.md` if it exists (prior runs' backlog).

**Outputs** — new media sections + reusable media systems + updated `docs/multimedia-roadmap.md` with a prioritized backlog for the next run.

**Verification** — project's normal gates (lint/typecheck/unit/Playwright/build/preview/a11y/perf) green; media SSR-safe; no CWV regression per [[quality-metrics]]; deploy + prod-E2E per [[verification-loop]].

**Can update ~/.agentskills or ~/.claude?** NO — this enhances a project, not global config. Only `/self-improve` touches global.

## Guiding principle

- Add media ONLY when it helps the user: **understand · trust · feel · compare · act · learn · engage · share · remember · convert**.
- No gimmicks. No clutter. No CWV regressions. No autoplay-with-sound. If a section doesn't earn its bytes, don't ship it.

## Progressive loop (the heart)

1. **Inspect** the site (live + source); list every page + its current media.
2. **Find weakest pages** — thinnest, lowest-engagement, most generic surfaces first.
3. **Find UN-implemented opportunities** — never repeat an add already in the roadmap.
4. **Add highest-value first** — one earned win beats five filler embeds.
5. **Protect performance + a11y** at every add (lazy-load, reduced-motion, captions, alt).
6. **Update `docs/multimedia-roadmap.md`** — record what shipped + the next backlog.
7. **Leave a prioritized backlog** so the next run starts richer. Each run makes the site meaningfully better.

Fan out specialist media agents per [[agent-selection]] (audio-systems / video / image / motion) — never one generic worker for all four.

## Decision framework by media type

- **Audio** — podcast section · audio playlist (5 episodes/page, play/pause/next/prev, title/desc/duration/artwork) · Web Audio visualizer (tasteful) · "listen to this page" narration · sticky mini-player. ALWAYS user-initiated, lazy-loaded, no autoplay.
- **Video** — hero/explainer/founder/demo/looped clips. Lazy-load, poster frames, captions + transcript placeholder, zero layout shift, no autoplay-with-sound, respect reduced-motion.
- **Images** — galleries · before/after sliders · comparison · lightbox · responsive modern formats · descriptive alt · locally stored (never hotlink) · transparent logos stay transparent. Per [[image-quality]]; real photos on history per [[timeline-authenticity]].
- **Interactive** — animated stats via `<app-rolling-counter>` · diagrams · timelines · maps · scroll reveals via `appReveal` · microinteractions. In-viewport only, reduced-motion, never distract from the CTA. Primitives per [[cinematic-ui-patterns]].

## Web Audio API / visualizer rules (SSR-safe)

- Guard every browser-only API (`typeof window`, `isPlatformBrowser`).
- Init `AudioContext` ONLY after a user gesture.
- Disconnect/cleanup nodes + cancel RAF on destroy.
- Throttle render; pause when offscreen (IntersectionObserver).
- Provide a non-visual fallback; respect `prefers-reduced-motion`.
- Options: waveform · frequency bars · radial pulse · subtle glow · minimal EQ — premium, never cheesy.

## Reusable systems to ensure exist (project framework + conventions)

`MediaSection` · `PodcastPlaylist` · `AudioPlayer` · `AudioVisualizer` · `VideoFeature` · `ImageGallery` · `ImageLightbox` · `ResponsiveImage` · `AnimatedStats` · `Timeline` · `ShareCard` · `SeoMetadata` · `StructuredData` · `ReducedMotionProvider` · `MediaPerformanceGuard`.

- Angular: standalone + signals/RxJS + SSR/hydration-safe + lazy-loaded.

## Placeholder honesty

- When real media is unavailable, create clearly-marked **demo** metadata (title/desc/duration/transcript/artwork placeholder).
- Never pass off demo episodes as real. Make the site structurally ready to drop in real media.

## Conversion

- Every media section ends in a business CTA: **book · donate · start · quote · contact · listen-more · share · subscribe**. Media is never a dead end.

## Per-page audit template

```
## Page Multimedia Audit: <route>
- **Current state** — what media exists now
- **Best opportunities** — ranked by user value
- **Add now** — highest-value, ship this run
- **Wait** — deferred + why
- **Why** — the user benefit each add serves
```

## `docs/multimedia-roadmap.md` template

```
# Multimedia Roadmap
## Added this run
## Pages improved
## New components
## Placeholders (demo, need real media)
## Perf safeguards
## A11y safeguards
## Best next
## Deferred
## Risks
```

## Final multimedia review table

| Area | Result | Notes |
|---|---|---|
| Media improves context | | |
| No pointless gimmicks | | |
| Audio user-initiated | | |
| Video lazy-loaded | | |
| Images optimized | | |
| Visualizer SSR-safe | | |
| Reduced motion supported | | |
| Accessibility covered | | |
| CTAs included | | |
| Roadmap updated | | |

Each row PASS/FAIL. Any FAIL → repair + rerun the project's checks. Never leave broken multimedia.
