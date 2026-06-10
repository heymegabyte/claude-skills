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
  await page.addStyleTag({ content: '* { font-smooth: never !important; -webkit-font-smoothing: none !important }' });
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
