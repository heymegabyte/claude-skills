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

Every Playwright run randomly captures a sample of in-test screenshots and diffs them against committed baselines. Every never-before-seen route or component gets a mandatory AI-vision pass on first render. Tests that look correct but render broken are the silent killer — this rule kills them.

## Two surfaces, two contracts

### Surface 1 — Random snapshot sampling

- Each test step has a 30% chance of triggering `await randomSnapshot(page, 'step-name')`.
- Sample seeded by `${TEST_TITLE}:${STEP_NAME}:${SHARD_INDEX}` — same spec on same shard always samples the same steps (reproducible).
- First run on a step = baseline written to `e2e/__snapshots__/<feature>/<spec>/<step>.png`. Subsequent runs = `pixelmatch` diff with `threshold: 0.1` (10% per-pixel tolerance) AND `maxDiffPixelRatio: 0.005` (0.5% of total image area).
- Diff exceeds either threshold → test fails with the diff image attached as a Playwright trace artifact.
- Anti-aliasing + font rendering masked via `page.addStyleTag` with `* { font-smooth: never !important }` before snapshot.

### Surface 2 — New-section AI vision pass

- `e2e/__seen-routes__.json` is the durable inventory: every route + component combination ever screenshot'd by the suite, keyed by `<route>:<viewport>`.
- Before any spec's first interaction with a route, helper `assertNewSection(page, routeKey)` checks the inventory. If unknown → mandatory full-viewport screenshot + AI-vision call.
- AI vision rubric (sent to GPT Image 2 vision or Claude Sonnet 4.6 via vision endpoint):
  - **Layout sane?** (no overlapping elements, no off-screen content, no text-on-text)
  - **Contrast safe?** (WCAG 2.2 AA visible to a sighted reviewer)
  - **Brand consistent?** (dark theme #060610, cyan #00E5FF, no off-brand colors)
  - **No AI-slop content?** (no Lorem ipsum, no `[Name]` placeholders, no broken images)
  - **Score ≥ 8/10?** — fail if below
- On pass: route added to `__seen-routes__.json` with the screenshot hash + score. On fail: spec fails with the vision feedback in the trace.
- New components (without their own route) detected via `data-testid` presence in DOM — first time a `data-testid` value appears, vision check runs.

## Helper API (`e2e/_helpers/snapshot.ts`)

```ts
import { Page, expect } from '@playwright/test';

export async function randomSnapshot(
  page: Page,
  stepName: string,
  opts: { force?: boolean; threshold?: number } = {},
): Promise<void> {
  const seed = `${process.env.TEST_TITLE}:${stepName}:${process.env.SHARD_INDEX ?? '0'}`;
  const fire = opts.force || hashToFloat(seed) < 0.3;
  if (!fire) return;
  // TT-safe (see § Reliable axe recipe #1): addStyleTag({content}) throws under
  // require-trusted-types-for 'script'; inject via textContent instead.
  await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '* { font-smooth: never !important; -webkit-font-smoothing: none !important }'; document.head.appendChild(s); });
  await expect(page).toHaveScreenshot(`${stepName}.png`, {
    threshold: opts.threshold ?? 0.1,
    maxDiffPixelRatio: 0.005,
    animations: 'disabled',
    caret: 'hide',
  });
}

export async function assertNewSection(
  page: Page,
  routeKey: string,
): Promise<void> {
  const inventoryPath = 'e2e/__seen-routes__.json';
  const seen = await loadInventory(inventoryPath);
  if (seen[routeKey]) return; // already vetted
  const png = await page.screenshot({ fullPage: true });
  const verdict = await aiVisionPass(png, routeKey);
  if (verdict.score < 8) {
    throw new Error(`new-section visual fail (${routeKey}): ${verdict.score}/10 — ${verdict.notes}`);
  }
  seen[routeKey] = { hash: sha256(png), score: verdict.score, vetted_at: Date.now() };
  await saveInventory(inventoryPath, seen);
}
```

### AI vision endpoint

- Default: Claude Sonnet 4.6 via `@anthropic-ai/sdk` with the `vision` message-content shape.
- Fallback: current OpenAI multimodal flagship via `openai` SDK Responses API (image input support). **NOT GPT Image 2 vision** — retired 2026-02-13 per `platform.openai.com/docs/deprecations`. Use whichever GPT-5-class or later model supports vision in the live `openai` SDK at the time of call.
- Both keyed via `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` from get-secret.
- Verified 2026-06-09 per OpenAI deprecation docs.
- Endpoint stub at `e2e/_helpers/visual.ts` — keep the prompt sharp:
  > "You are auditing a screenshot of a deployed UI page. Rubric: 1) layout sane, 2) contrast ≥ WCAG 2.2 AA, 3) brand colors consistent (#060610 bg, #00E5FF accent), 4) no AI-slop placeholders, 5) no broken images. Return JSON {score: 0-10, notes: string}."

## Per-spec usage

Every `<feature>/visual.spec.ts` declares:

```ts
import { test, expect } from '@playwright/test';
import { randomSnapshot, assertNewSection } from '../_helpers/snapshot';

test.describe('booking funnel', () => {
  test('renders correctly across viewport states', async ({ page }, info) => {
    process.env.TEST_TITLE = info.titlePath.join('|');
    await page.goto('/');
    await assertNewSection(page, `/:${info.project.name}`);
    await randomSnapshot(page, 'homepage');
    await page.click('[data-testid="hero-book-cta"]');
    await assertNewSection(page, `/book:${info.project.name}`);
    await randomSnapshot(page, 'booking-step-1');
    // ...etc
  });
});
```

## Cache & cost discipline

- AI vision call ≈ $0.005 per image. Only fires on never-seen routes — typically 5-20 calls per full suite, $0.10 max per CI run.
- Snapshot baseline images live under `e2e/__snapshots__/` and ARE committed to git. Diff updates require explicit `--update-snapshots` flag + PR review.
- `__seen-routes__.json` is committed too — its growth tracks the suite's coverage frontier.

## Anti-patterns

- ❌ Snapshot the entire viewport when only one component changed — scope to the component selector via `locator.screenshot()`.
- ❌ Set `threshold: 1` to silence flake — fix the flake (anti-aliasing, font load timing, animation) instead.
- ❌ Skip new-section gate for "internal pages" — the whole point is catching the broken first render.
- ❌ Stub the AI vision call in CI — costs are trivial and the gate is the value.

## Parallel-runner integration

- Random sampling is shard-safe because the seed includes `SHARD_INDEX`. Each shard samples a deterministic subset; combined, the union covers most steps.
- `__seen-routes__.json` updates are commit-back-to-main from the merge runner, not from individual shard runners (avoid write conflicts). Shards APPEND to a temp file; the merge step deduplicates.

## Reliable axe-on-prod recipe (`scanAxeStable` — battle-tested over a 26-round njsk.org arc)

Running `@axe-core/playwright` against a LIVE prod URL (not a static build) is flaky by default — animations, scroll-spies, payment iframes, and edge contention all produce phantom violations. A shared `e2e/lib/axe.ts` `scanAxeStable(page, opts)` wrapper with these 8 patterns made a 26-route public gate reliably deterministic. Copy it into every project that gates a11y on prod.

1. **Freeze animations before scanning.** Inject CSS zeroing `animation-duration`/`transition-duration`/`transition-delay` + `transform: none !important` on `*`. Without it, axe samples a reveal mid-fade and reports a transient `color-contrast` (a token at partial opacity reads as a faded color). The pass-6 class.
   - **⚠️ NEVER `page.addStyleTag({content})` on a Trusted-Types-hardened prod site.** It throws `[Report Only] requires a TrustedHTML value` under the `require-trusted-types-for 'script'` CSP that `[[csp-trusted-types]]` mandates — Playwright injects the content via an innerHTML-class path. The failure is INTERMITTENT (fires per-spec across every axe-clean test) so it reads as flakiness, not a hard bug. CSP-safe injection: `await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '<css>'; document.head.appendChild(s); })` — `textContent` is NOT governed by Trusted Types (only `innerHTML`/`script.src` are). Same fix for any `addScriptTag`. Reference incident: njsk.org pass-226 (the hidden cause the matrix never reached 6/6). Items 2/6 below force-settle via `page.evaluate` already — they're TT-safe; only this `addStyleTag` was the trap.
2. **Force-settle scroll-reveals to their final state.** For `.reveal, [data-reveal], main section, .reveal-stagger > *, .hero-rise > *`: add the visible class + set inline `opacity:1; transform:none; animation:none`. Zeroing CSS durations alone loses the race on animation-dense pages. Only animation-MARKED elements are touched, so genuinely-hidden content (closed `<details>`, dialogs, `[hidden]`) stays hidden.
3. **`iframes: false` in the axe run options.** Third-party embed iframes (Square/Stripe payments, YouTube) load/reload async and their per-frame analysis intermittently throws `Execution context was destroyed … because of a navigation`. Their a11y is the vendor's responsibility and unfixable by you; first-party content iframes are rare, so this loses no real coverage and stops the crash.
4. **Self-heal the contrast flake with a bounded re-scan loop.** Under parallel load, prod render pressure still occasionally beats the settle. If (and only if) a `color-contrast` violation appears, re-settle (increasing hold) and re-scan, up to 3 extra attempts. A STATIC-color violation persists every attempt (correctly reported); a mid-animation sample clears. This is correct measurement, NOT a relaxed assertion.
5. **`scroll: false` option for scroll-spy pages.** A history-timeline / TOC scroll-spy that does `replaceState` + `scrollIntoView({behavior:smooth})` on scroll RACES the programmatic scroll loop and destroys the page context mid-scan. Add an option that skips the scroll and force-settles reveals directly (they don't need the scroll to fire their IntersectionObserver). Gradual user-scroll is unaffected — it's a test-only fast-scroll artifact, not a user bug; verify by wheel-scrolling and checking the URL stays put.
6. **Neutralize floating chrome for the geometry scan.** Drop every `position:fixed`/`sticky` element to `static` after the scroll-settle. Sticky headers / scroll-progress / back-to-top / fixed CTAs reposition and overlap content at narrow widths, producing phantom `target-size` "partially obscured" hits about the chrome, not the page under test.
7. **`retries: 3` + `workers: 2` in the prod config.** Live-edge variance (post-deploy propagation + chunk-fetch `Importing a module script failed` console blips under contention) needs retries the in-scan self-heal can't cover. A real defect still fails all 3. Pair with a `wait-prod-settle` step that polls the served bundle hash == the just-built one before testing.
8. **Verify fixes with a no-manipulation PLAIN-axe probe FIRST.** When a route fights the manipulation (produces inconsistent phantom `landmark-one-main`/`page-has-heading-one`/contrast even with scroll:false — seen on `/about`, `/contact`), trust a plain `AxeBuilder().analyze()` (no force-reveal, no position drop) as ground truth. If plain-axe is AXE-0, the page is clean; gate it with the least-manipulation mode (or a raw-HTTP/probe check). A direct DOM probe (`document.querySelectorAll('main').length`) confirms phantoms.

### Recurring real-defect classes the gate catches (every content page had ≥1)

- **`<dl>` misuse** — stat-grids / FAQ accordions wrapped in `<dl>` with a stray `<p>` inside the dt/dd group, `<details>` as a direct child, dd-before-dt order, or dt/dd nested >1 div deep. Fix: convert `<dl>`/`<dt>`/`<dd>` → `<div>`/`<span>`/`<p>` (they're visual grids, not definition lists). Leave genuinely-valid dls.
- **Decorative oversized numerals** — index counters / step numbers in a pale `*-200`/`-300` token (often with `/80` opacity) on white ≈ 1.3–2:1. Size to the NORMAL-text 4.5:1 bar (`*-700`); the large-text 3:1 exemption flips across device-pixel-ratios. (Cross-link `text-contrast.md`.)
- **Eyebrow/label text** in a `*-500` brand token on white ≈ 4.0:1 (just under). Bump one shade. **Dark-on-dark** mirror: `*-600`/`-700` text on a dark panel — bump LIGHTER (`*-300`).
- **`landmark-unique`** — a shared component (newsletter signup) rendered both inline AND by the layout, or two same-purpose `<section aria-label>`s, collide on the same accessible name. Fix: give the component a `label` prop for distinct names.
- **`landmark-complementary-is-top-level`** — `<aside>` (sticky TOC, contact-info panel, blog callout) nested inside a section/article landmark → `<div>`.
- **`aria-hidden-focus`** — a custom accordion that collapses via `grid-template-rows:0fr`/`max-height` keeps its content in the DOM + tab order; `aria-hidden` alone leaves it focusable. Fix: add `inert` (React 19 boolean) on the collapsed panel — one prop cleared 67 nodes on a 67-item FAQ.
- **`nested-interactive`** — an interactive data-viz `<svg role="img">` containing focusable `role="button"` segments. Drop `role="img"` (it's a graphics container, not an atomic image); describe via `<figcaption>`, keep the segments' labels.
- **`scrollable-region-focusable`** — an `overflow-x-auto` chart/table wrapper needs `tabIndex={0}` + `role="region"` + `aria-label` for keyboard scroll.

Reference incident: njsk.org passes 4–33 — ~210 real WCAG nodes fixed across 26 gated routes; the recipe above is what made the prod gate deterministic enough to find them.
