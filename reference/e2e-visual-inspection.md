# E2E Visual Inspection — implementation reference

Sourced on demand by `rules/e2e-visual-inspection.md`.

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
  // TT-safe: inject via textContent not addStyleTag (throws under require-trusted-types-for 'script')
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
  if (seen[routeKey]) return;
  const png = await page.screenshot({ fullPage: true });
  const verdict = await aiVisionPass(png, routeKey);
  if (verdict.score < 8) {
    throw new Error(`new-section visual fail (${routeKey}): ${verdict.score}/10 — ${verdict.notes}`);
  }
  seen[routeKey] = { hash: sha256(png), score: verdict.score, vetted_at: Date.now() };
  await saveInventory(inventoryPath, seen);
}
```

## AI vision endpoint stub (`e2e/_helpers/visual.ts`)

Prompt:
> "You are auditing a screenshot of a deployed UI page. Rubric: 1) layout sane, 2) contrast ≥ WCAG 2.2 AA, 3) brand colors consistent (#060610 bg, #00E5FF accent), 4) no AI-slop placeholders, 5) no broken images. Return JSON {score: 0-10, notes: string}."

- Default: Claude Sonnet 4.6 via `@anthropic-ai/sdk` vision message-content shape.
- Fallback: current OpenAI multimodal flagship via `openai` SDK Responses API. NOT GPT Image 2 vision (retired 2026-02-13). Use GPT-5-class or later that supports vision.
- Keys: `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` from `get-secret`.

## Per-spec usage pattern

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
  });
});
```
