---
name: "E2E Test Accumulation"
description: "Tests accumulate and never shrink. Each feature adds to the journey test. Cross-page navigation required. 100% E2E feature coverage — every feature has a test. One-line code changes must trigger the full suite to catch regressions."
---

# E2E Test Accumulation (***NEVER DELETE TESTS***)

## Core Rule
Tests are append-only. Every feature built adds tests. Tests are never deleted — only updated when the feature they test changes. The test suite grows monotonically. A shrinking test suite means lost coverage means silent breakage.

## The Growing Journey Test

### Structure: One Long User Journey, Not Isolated Tests
```typescript
// e2e/journey.spec.ts — THE master test that proves EVERYTHING works
// This file ONLY GROWS. New features append steps.

test.describe.serial('Complete User Journey', () => {
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  // === PHASE 1: DISCOVERY (added when homepage built) ===
  test('01. Homepage loads', async () => { /* ... */ });
  test('02. Navigation works', async () => { /* ... */ });
  test('03. Footer links resolve', async () => { /* ... */ });
  
  // === PHASE 2: AUTH (added when auth built) ===
  test('04. Click Sign Up from homepage nav', async () => {
    await page.click('nav >> text=Sign Up');
    await expect(page).toHaveURL(/sign-up/);
  });
  test('05. Complete signup flow', async () => { /* ... */ });
  test('06. Redirect to dashboard after signup', async () => { /* ... */ });
  
  // === PHASE 3: CORE FEATURE (added when feature built) ===
  test('07. Navigate to feature via dashboard', async () => {
    // NOT page.goto('/feature') — click through the UI like a user
    await page.click('[data-testid="sidebar-feature"]');
    await expect(page.locator('h1')).toHaveText('Feature Name');
  });
  test('08. Create new item', async () => { /* ... */ });
  test('09. Edit the item', async () => { /* ... */ });
  test('10. Verify item appears in list', async () => { /* ... */ });
  
  // === PHASE 4: BILLING (added when Stripe built) ===
  test('11. Navigate to billing from settings', async () => {
    await page.click('text=Settings');
    await page.click('text=Billing');
    await expect(page).toHaveURL(/billing/);
  });
  test('12. Subscription plan visible', async () => { /* ... */ });
  
  // === PHASE N: (added with each new feature) ===
  // NEVER delete above tests. Only add below this line.
});
```

### Why Serial, Not Parallel
The journey test runs `.serial` because it tests CROSS-PAGE NAVIGATION. Test 07 depends on being logged in from test 05. Test 11 depends on being on the dashboard from test 06. This IS the real user experience — sequential, stateful, cross-page.

### Parallel Tests Are Separate
Feature-specific tests (form validation, edge cases, error states) run in parallel in separate files. The journey test is the integration layer that proves everything works TOGETHER.

## Cross-Page Navigation Rules

### Never use `page.goto()` for internal navigation
```typescript
// BAD — skips the navigation UI, misses broken links
await page.goto('/dashboard/settings');

// GOOD — clicks through like a real user
await page.click('nav >> text=Dashboard');
await page.click('[data-testid="settings-link"]');
await expect(page).toHaveURL(/settings/);
```

### Exception: first page load only
```typescript
// OK — the journey starts somewhere
await page.goto(PROD_URL);
// After this, all navigation is via clicks
```

### Every navigation must verify
```typescript
// After clicking a link, verify:
// 1. URL changed
await expect(page).toHaveURL(/expected-path/);
// 2. Page content loaded
await expect(page.locator('h1')).toBeVisible();
// 3. No console errors
// 4. No network errors (4xx/5xx)
```

## 100% Feature Coverage

### The Coverage Matrix
Every project maintains a coverage matrix in SPEC.md:

```markdown
## E2E Coverage Matrix
| Feature | Journey Test | Edge Cases | Error States | Mobile |
|---------|-------------|------------|--------------|--------|
| Homepage | 01-03 | homepage.spec.ts | ✅ | ✅ |
| Auth | 04-06 | auth.spec.ts | ✅ | ✅ |
| Dashboard | 07 | dashboard.spec.ts | ✅ | ✅ |
| CRUD | 08-10 | crud.spec.ts | ✅ | ✅ |
| Billing | 11-12 | billing.spec.ts | ✅ | ✅ |
```

### Coverage Rule
If a feature exists in the UI, it MUST have:
1. A step in the journey test (proves it works in context)
2. A dedicated spec file (proves edge cases)
3. Error state coverage (proves graceful failure)
4. Mobile viewport test (proves responsive)

No feature ships without all four. The completeness-checker agent verifies this.

## How Tests Grow

### When a new feature is built:
1. Add journey test steps (append to journey.spec.ts)
2. Create feature spec file (e2e/feature-name.spec.ts)
3. Update coverage matrix in SPEC.md
4. Run full suite — ALL tests must pass (including old ones)

### When a feature changes:
1. Update the affected journey test steps (don't delete, modify)
2. Update the feature spec file
3. Run full suite — regression detected if old tests break

### When a feature is removed:
1. Mark journey test steps as skipped with comment: `// REMOVED: feature-name, date, reason`
2. Don't delete the test file — archive to e2e/archived/
3. This preserves the record of what the feature did

## One-Line Change Regression Detection

The point: when you change ONE line of code, the full E2E suite runs and catches any collateral damage.

```bash
# Pre-push hook or CI gate
npx playwright test --project=chromium
# Runs: journey.spec.ts (the full serial journey)
# Runs: *.spec.ts (all feature-specific parallel tests)
# Runs: a11y.spec.ts (axe-core audit)
# Runs: visual.spec.ts (screenshot comparison)
# If ANY test fails → push blocked
```

### The Regression Chain
Feature A depends on Feature B depends on Feature C.
Change Feature C → journey test catches if B or A broke.
Isolated tests for C pass but journey test fails at step B → you broke the integration.
This is ONLY catchable with cross-page sequential testing.

## Anti-Patterns

### NEVER: Test each page in isolation
```typescript
// BAD — doesn't test navigation, doesn't test auth state, doesn't test cross-page data
test('dashboard loads', async ({ page }) => {
  await page.goto('/dashboard'); // skips login!
});
```

### NEVER: Delete tests when refactoring
```typescript
// BAD — "these tests are outdated, I'll rewrite them later"
// REALITY: "later" never comes, coverage decreases, bugs ship
```

### NEVER: Use test.skip() without a tracking issue
```typescript
// BAD
test.skip('broken test', async () => { /* ... */ });
// GOOD
test.skip('broken test — tracking: GH-123', async () => { /* ... */ });
```

### NEVER: Mock the backend in E2E
```typescript
// BAD — tests pass but production breaks
await page.route('**/api/**', route => route.fulfill({ body: mockData }));
// GOOD — hit the real API on the real production URL
```

## Integration with Build Loop
The build-and-slice-loop (skill 06) MUST:
1. Write failing journey test step BEFORE implementing feature
2. Implement feature until test passes
3. Run FULL suite (not just the new test)
4. Deploy only if ALL tests pass
5. Post-deploy: run suite again against production URL

The UI completeness sweep (skill 07) MUST:
1. After all features built, run journey test end-to-end
2. Any test failure = not done
3. Coverage matrix must show 100% — every feature row filled
