---
name: "e2e-visual-inspection"
priority: 2
pack: "testing"
triggers:
  - "visual"
  - "screenshot"
  - "ai vision"
paths:
  - "concern:e2e-testing"
---

# E2E Visual Inspection

## Two surfaces, two contracts

### Surface 1 — Random snapshot sampling

- Each test step has a **30%** chance of triggering `await randomSnapshot(page, 'step-name')`.
- Sample seeded by `${TEST_TITLE}:${STEP_NAME}:${SHARD_INDEX}` — same spec on same shard always samples the same steps (reproducible).
- First run on a step = baseline written to `e2e/__snapshots__/<feature>/<spec>/<step>.png`.
- Subsequent runs: `pixelmatch` diff with `threshold: 0.1` (10% per-pixel tolerance) AND `maxDiffPixelRatio: 0.005` (0.5% of total image area). Exceeds either → test fails with diff image attached as Playwright trace artifact.
- Anti-aliasing + font rendering masked via `page.evaluate` style injection (NOT `page.addStyleTag({content})` — throws under Trusted Types CSP; see note in axe recipe).

### Surface 2 — New-section AI vision pass

- `e2e/__seen-routes__.json` is the durable inventory: every route + component combination ever screenshot'd, keyed by `<route>:<viewport>`.
- Before any spec's first interaction with a route, `assertNewSection(page, routeKey)` checks the inventory. If unknown → mandatory full-viewport screenshot + AI-vision call.
- AI vision rubric:
  - **Layout sane?** (no overlapping elements, no off-screen content, no text-on-text)
  - **Contrast safe?** (WCAG 2.2 AA visible to a sighted reviewer)
  - **Brand consistent?** (dark theme #060610, cyan #00E5FF, no off-brand colors)
  - **No AI-slop content?** (no Lorem ipsum, no `[Name]` placeholders, no broken images)
  - **Score ≥ 8/10** — fail if below
- On pass: route added to `__seen-routes__.json` with screenshot hash + score. On fail: spec fails with vision feedback in trace.
- New components (without own route) detected via `data-testid` presence — first time a `data-testid` value appears, vision check runs.

See `reference/e2e-visual-inspection.md` for helper implementation (`randomSnapshot`, `assertNewSection`, AI vision endpoint stub, per-spec usage pattern).

## Cache & cost discipline

- AI vision call ≈ $0.005/image. Only fires on never-seen routes — typically 5–20 calls per full suite, $0.10 max per CI run.
- `e2e/__snapshots__/` baseline images ARE committed to git. Diff updates require explicit `--update-snapshots` flag + PR review.
- `__seen-routes__.json` is committed — its growth tracks the suite's coverage frontier.

## Anti-patterns

- Snapshot the entire viewport when only one component changed — scope to the component selector via `locator.screenshot()`.
- Set `threshold: 1` to silence flake — fix the flake instead.
- Skip new-section gate for "internal pages".
- Stub the AI vision call in CI — costs are trivial and the gate is the value.

## Parallel-runner integration

- Random sampling is shard-safe because the seed includes `SHARD_INDEX`.
- `__seen-routes__.json` updates are commit-back-to-main from the merge runner, not individual shard runners. Shards APPEND to a temp file; merge step deduplicates.

## Reliable axe-on-prod recipe (`scanAxeStable`)

Battle-tested over a 26-round njsk.org arc (~210 real WCAG nodes fixed across 26 gated routes). Copy `e2e/lib/axe.ts` `scanAxeStable(page, opts)` into every project that gates a11y on prod.

1. **Freeze animations before scanning.** Inject CSS zeroing `animation-duration`/`transition-duration`/`transition-delay` + `transform: none !important` on `*`. **NEVER `page.addStyleTag({content})` on a Trusted-Types-hardened prod site** — throws `requires a TrustedHTML value` under `require-trusted-types-for 'script'` CSP (`[[csp-trusted-types]]`). CSP-safe injection: `await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '<css>'; document.head.appendChild(s); })` — `textContent` is NOT governed by Trusted Types. Reference incident: njsk.org pass-226.

2. **Force-settle scroll-reveals to final state.** For `.reveal, [data-reveal], main section, .reveal-stagger > *, .hero-rise > *`: add visible class + set inline `opacity:1; transform:none; animation:none`. Zeroing CSS durations alone loses the race on animation-dense pages. Only animation-marked elements are touched; genuinely-hidden content (closed `<details>`, dialogs, `[hidden]`) stays hidden.

3. **`iframes: false` in axe run options.** Third-party embed iframes (Square/Stripe, YouTube) load async; per-frame analysis intermittently throws `Execution context was destroyed`. Their a11y is the vendor's responsibility.

4. **Self-heal contrast flake with bounded re-scan loop.** If (and only if) a `color-contrast` violation appears, re-settle (increasing hold) and re-scan, up to 3 extra attempts. A static-color violation persists every attempt (correctly reported); mid-animation sample clears.

5. **`scroll: false` option for scroll-spy pages.** A history-timeline/TOC scroll-spy that does `replaceState` + `scrollIntoView({behavior:smooth})` races the programmatic scroll loop and destroys page context mid-scan. Add option to skip scroll and force-settle reveals directly.

6. **Neutralize floating chrome for geometry scan.** Drop every `position:fixed`/`sticky` element to `static` after scroll-settle. Sticky headers/scroll-progress/back-to-top/fixed CTAs reposition and overlap at narrow widths, producing phantom `target-size` hits.

7. **`retries: 3` + `workers: 2` in prod config.** Live-edge variance (post-deploy propagation, chunk-fetch blips under contention) needs retries. Pair with `wait-prod-settle` step that polls served bundle hash == just-built one before testing.

8. **Verify fixes with a no-manipulation plain-axe probe FIRST.** When a route fights manipulation (inconsistent phantom violations even with scroll:false), trust plain `AxeBuilder().analyze()` as ground truth. If plain-axe is AXE-0, gate it with least-manipulation mode.

### Recurring real-defect classes the gate catches

- **`<dl>` misuse** — stat-grids/FAQ accordions with stray `<p>` inside dt/dd, `<details>` as direct child, dd-before-dt, dt/dd nested >1 div deep. Fix: convert `<dl>`/`<dt>`/`<dd>` → `<div>`/`<span>`/`<p>`.
- **Decorative oversized numerals** — index counters in pale `*-200`/`-300` token (often `/80` opacity) on white ≈ 1.3–2:1. Size to normal-text 4.5:1 bar (`*-700`); large-text 3:1 exemption flips across device-pixel-ratios. (Cross-link `text-contrast.md`.)
- **Eyebrow/label text** in `*-500` brand token on white ≈ 4.0:1 (just under 4.5:1). Bump one shade. Dark-on-dark mirror: `*-600`/`-700` text on dark panel — bump lighter (`*-300`).
- **`landmark-unique`** — shared component (newsletter signup) rendered both inline AND by the layout, or two same-purpose `<section aria-label>`s. Fix: give component a `label` prop for distinct names.
- **`landmark-complementary-is-top-level`** — `<aside>` (sticky TOC, contact-info panel, blog callout) nested inside section/article landmark → `<div>`.
- **`aria-hidden-focus`** — custom accordion collapsed via `grid-template-rows:0fr`/`max-height` keeps content in DOM + tab order; `aria-hidden` alone leaves it focusable. Fix: add `inert` (React 19 boolean) on collapsed panel.
- **`nested-interactive`** — interactive data-viz `<svg role="img">` containing focusable `role="button"` segments. Drop `role="img"`; describe via `<figcaption>`, keep segment labels.
- **`scrollable-region-focusable`** — `overflow-x-auto` chart/table wrapper needs `tabIndex={0}` + `role="region"` + `aria-label`.
