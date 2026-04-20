---
name: playwright-tdd
description: Every feature MUST be verified with Playwright E2E tests + visual inspection. Tests simulate real user behavior starting from the homepage. All projects use TDD with Playwright as the primary verification method.
---

# Playwright E2E TDD — Mandatory for All Projects

Every code change, feature, or fix MUST be verified with Playwright E2E tests and visual inspection before it can be considered complete. This is non-negotiable.

## Core Principles

1. **Test like a human** — Every E2E test starts from the homepage (`/`) and navigates to the feature using UI interactions (clicks, typing, scrolling). Never navigate directly to a deep URL unless testing that specific behavior.

2. **Visual inspection is mandatory** — After tests pass, take screenshots with Playwright and read them with the Read tool to visually verify the output. Never trust that passing tests mean the UI looks correct.

3. **TDD order** — Write the failing test FIRST, then implement the feature, then verify the test passes, then take screenshots for visual inspection.

4. **Production tests** — After deploying, run a subset of E2E tests against the production URL to verify the deployment. Use a test account where authentication is needed.

## Test Structure

### Local E2E Tests (before deployment)
```bash
# Run all E2E tests against the local mock server
npx playwright test --reporter=list

# Run a specific test file
npx playwright test e2e/feature-name.spec.ts --reporter=list

# Run with screenshots for visual inspection
npx playwright test --reporter=list
# Then read e2e/screenshots/*.png with the Read tool
```

### Production E2E Tests (after deployment)
```javascript
// Use a separate config or inline baseURL override
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://production-url.com/');
// ... test the feature
await page.screenshot({ path: 'e2e/screenshots/prod-feature.png' });
// Read the screenshot to visually verify
```

## Test Writing Rules

1. **Start from homepage** — `await page.goto('/');` then navigate via UI
2. **No sleeps** — Use `waitForSelector`, `waitForURL`, `expect().toBeVisible()` with timeouts
3. **Stable selectors** — Use `#id`, `.class`, `[data-testid]`, `role`, or text content
4. **Parallel-safe** — Tests must not depend on shared state
5. **Deterministic** — Same input always produces same result
6. **Screenshots at milestones** — Take screenshots at key points for visual verification
7. **Broken image detection** — Check `naturalWidth > 0` for images that must render
8. **z-index verification** — Use `getComputedStyle(el).zIndex` to verify layering
9. **Form persistence** — Test that form data survives page refresh where applicable
10. **Error handling** — Test that errors are user-friendly and recoverable

## Visual Inspection Checklist

After taking a screenshot, check for:
- [ ] Layout is correct (no overlapping, no clipping)
- [ ] Text is readable (contrast, size)
- [ ] Images loaded (not broken, correct aspect ratio)
- [ ] Colors match the design system
- [ ] Spacing is consistent
- [ ] Interactive elements look clickable
- [ ] Loading states are visible when expected
- [ ] Error states are user-friendly
- [ ] Mobile responsiveness (if applicable)
- [ ] Animations completed (not frozen mid-transition)

## When to Run Tests

### Every code change:
1. Run affected E2E tests locally
2. Take screenshots and visually inspect

### Every deployment:
1. Deploy to production
2. Run production E2E tests against live URL
3. Take production screenshots and visually inspect
4. If anything fails, fix and redeploy

### Every feature:
1. Write failing E2E test (Red)
2. Implement feature (Green)
3. Run test, verify passes
4. Take screenshot, visually inspect
5. Deploy
6. Run production test
7. Take production screenshot, visually inspect

## Test File Naming Convention

```
e2e/
├── feature-name.spec.ts      # Feature-specific tests
├── create-site.spec.ts       # Create page tests
├── admin-dashboard.spec.ts   # Admin page tests
├── homepage.spec.ts           # Homepage tests
├── auth-flow.spec.ts          # Authentication tests
├── screenshots/
│   ├── feature-name-step1.png
│   ├── feature-name-step2.png
│   ├── prod-feature-name.png  # Production screenshots prefixed with prod-
│   └── ...
└── fixtures.ts                # Shared test fixtures (authedPage, etc.)
```

## Example Test Template

```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test('feature works end-to-end', async ({ authedPage: page }) => {
    // Start from homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to feature via UI
    await page.locator('.nav-link', { hasText: 'Feature' }).click();
    await page.waitForURL('**/feature');

    // Interact with the feature
    await page.fill('#input', 'test value');
    await page.locator('.submit-btn').click();

    // Verify result
    await expect(page.locator('.result')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.result')).toContainText('Success');

    // Screenshot for visual inspection
    await page.screenshot({ path: 'e2e/screenshots/feature-result.png' });
  });
});
```

## Production Test Template

```typescript
// Run after deployment
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://production-url.com/');
await page.waitForLoadState('networkidle');

// Test the feature on production
// ... same interactions as local test

// Screenshot for visual inspection
await page.screenshot({ path: 'e2e/screenshots/prod-feature.png' });

// Verify images actually loaded
const img = page.locator('img.feature-image');
const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
console.log('Image loaded:', naturalWidth > 0);
```

## Integration with CI/CD

- E2E tests MUST pass before merging PRs
- Production E2E tests run after every deployment
- Screenshots are saved as CI artifacts for review
- Failed visual inspections block the pipeline
