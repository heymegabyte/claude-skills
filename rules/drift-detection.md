---
name: "drift-detection"
priority: 2
pack: "core"
triggers:
  - "drift"
paths:
  - "*"
---

# Architecture Drift Detection

Drift is the gap between how the system is SUPPOSED to be structured and how it actually is. Fix IMMEDIATELY, in the same turn it surfaces — never deferred. A scattered route, an unflagged feature, an untyped AI output: all drift, all merge-blockers.

## What counts as drift

- Route handler without an owning feature module
- Feature module without a `manifest.ts`
- Feature module without a wired feature flag
- Feature flag without a corresponding `manifest.ts`
- `manifest.ts` without colocated `__tests__/`
- Tests not linked back to a manifest (no `featureSlug` reference)
- API route without a Zod schema at its boundary
- API route that needs a flag guard but has none (`isFlagOn` missing)
- AI output consumed without a schema / contract validating it
- Tool (MCP / function-call) without an input AND output schema
- Dashboard / UI string not run through the i18n layer
- Log line emitted without a request id AND feature correlation id
- Sentry span / breadcrumb without feature context (`featureSlug` tag)
- Duplicate Zod schemas (same shape defined in ≥2 places)
- Duplicate TypeScript types (same shape defined in ≥2 places)
- Dead feature flags (no code reads them)
- Dead routes (registered but unreachable / no callers)
- Dead feature folders (module exists, nothing imports it)
- Unused exports (no importers — run `knip`)
- Module missing a `README.md`
- AI-heavy feature missing eval / regression coverage

## Immediacy rule

- See drift → fix drift in the SAME turn. Never punted to a TODO or next PR. (TODOs for genuine future work are fine per `todos-are-roadmap`; ban is scoped to architecture drift.)
- If a drift fix needs a design conversation (rare), surface it in Recs; everything else ships inline.

## Per-repo enforcement

- Validators live at `tools/architecture-validation/`
- `pnpm validate:architecture` runs locally + in CI
- CI fails the merge on serious drift (missing manifest, unguarded route, untyped AI output, untyped tool)
- Cosmetic drift (missing README, unused export) warns; structural drift blocks

## Canonical implementation (projectsites.dev)

- `scripts/validate-feature-manifests.mjs` — asserts every module has all 7 manifest fields + colocated tests
- `scripts/validate-feature-drift.mjs` — asserts route↔flag↔manifest↔e2e↔FEATURES.md coherence, flags dead flags/routes/folders
- `.github/workflows/feature-architecture.yml` runs both on every push
- Copy these verbatim into every new emdash project; wire into `predeploy` + CI

## Build-artifact drift guards

Any artifact GENERATED at build (sitemap, RSS/JSON feed, service-worker precache list, robots.txt, OG/JSON-LD, icon manifest) silently drifts from its source-of-truth when a route/asset/file is added or renamed. **Every generated/curated artifact gets a build gate that re-derives or cross-checks it against its single source of truth, and fails the build on mismatch.**

### The rule

- **One source of truth per route/asset set**, imported by BOTH the app and every validator (Node ≥23 can `import` a `.ts` directly). No hand-maintained second copy.
- Write a gate that asserts coverage/validity, wired into the build chain. Exit 1 on drift.
- When a gate's class first bites, fix the instance AND ship the gate same turn (per `prompt-as-training-signal`).

### Reference guards (njsk.org, 2026-06)

- **sitemap ↔ route source** — `generate-sitemap.mjs` imports `pageMeta`, fails if any public SEO route absent from `STATIC_ROUTES`.
- **SW precache ↔ public/** — `validate-links.mjs` parses `sw.js` `STATIC_ASSETS`, asserts every asset-extension entry exists in `public/`.
- **JSON-LD structural** — `validate-jsonld.mjs` asserts each block has `@context` + `@type` + type-specific required fields (`HowTo→step`, `FAQPage→mainEntity`, `WebPage→name`, …).
- **route manifest ↔ worker soft-404** — shared `known-routes.ts` (`KNOWN_ROUTES` + `isKnownRoute`) imported by link validator AND Worker; unknown HTML paths return real 404 (not 200 soft-404).
- **SPA route ↔ known-route manifest** — `validate-spa-routes.mjs` asserts every non-dynamic `KNOWN_ROUTES` entry has a matching `<Route>` in `app.tsx`. A route present in the manifest + page-meta + sitemap but ABSENT from the SPA router serves a 200 shell that renders the 404 page — a soft-404 on an SEO-indexed URL the link validator can't catch (it checks manifest membership, not Route existence). Reference: njsk.org `/grants` shipped this way (full content + meta + sitemap, no `<Route>`) until the gate caught it.
- **fabricated-people** — `validate-no-fabricated-people.mjs` flags person-name paired with quote/testimonial lacking a `_confirmations.json` entry. See `copy-writing.md § Fabricated-people build gate`.

### Audit cadence

- Periodically curl/Playwright the LIVE artifacts: `sitemap.xml`, `feed.xml`, `robots.txt`, `site.webmanifest` (every icon/screenshot/shortcut/start_url resolves), `sw.js` precache, OG image dimensions (1200×630 ≤100KB), hreflang reciprocity. Built ≠ served-correctly.

## Scan cadence (before every new feature)

1. `pnpm validate:architecture` — confirm zero existing drift before adding more
2. Grep `libs/features/*/manifest.ts` — does the capability extend an existing module?
3. Grep `src/routes/` + `src/services/` for partial implementations to colocate
4. New capability → scaffold the full module; never scatter handlers in `routes/` without a module

## Agent drift signals

Owned by `agent-diversity-reviewer` role + `/drift-check` and `/agent-diversity-review` commands. Run on every multi-agent turn before DONE. Each is a merge-blocker when found.

- Too many generic agents — undifferentiated agents where named specialists exist
- Agents with overlapping scope — two agents touching same files / owning same concern
- Agents that do not verify their own work — no build / test / E2E / screenshot proof in report
- Agents that change files outside their stated scope
- Agents that skip tests — no failing-test-first, no regression spec, no `e2e/<feature>/` coverage
- Agents that ignore user stack preferences — drift from mandated stack
- Agents that fail to update docs — touched surface but left CLAUDE.md / README / `FEATURES.md` stale
- Agents that propose global changes but don't implement them
- Agents that make architectural changes without a review agent
- Agents that defer obvious in-scope work — push <2h ship-able items to Recs per `auto-integrate-recs`
