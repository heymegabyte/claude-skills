---
name: "Stagehand AI Testing"
version: "2.0.0"
updated: "2026-04-23"
description: "AI browser testing: Stagehand (act/extract/observe/agent on a11y tree) + Playwright v1.56 AI agents (Planner/Generator/Healer). MCP-based testing on accessibility tree, not screenshots. Self-healing selectors. Multi-agent testing pattern."
---

# Stagehand AI Testing

## What Is Stagehand
Open-source AI browser automation SDK (browserbase/stagehand, 22K+ stars, MIT). Four primitives -- `act()`, `extract()`, `observe()`, `agent()` -- that resolve natural language instructions against the accessibility tree at runtime. Selectors self-heal when pages change. Uses Vercel AI SDK under the hood, supports OpenAI/Anthropic/Gemini. 10-100x faster than vision-based approaches because it reads the a11y tree, not screenshots.

## Playwright AI Agents (v1.56+)
Three built-in AI agents complement Stagehand:
- **Planner:** Explores apps, designs test plans from natural language descriptions
- **Generator:** Creates executable test code from plans
- **Healer:** Auto-fixes broken tests when UI changes

Pattern: static Playwright specs for stable tests. AI agents for flaky/new tests. Run agents only on failed tests in second pass (70% token savings). Reserve AI for UI-churn areas.

## MCP-Based Testing
Playwright MCP operates on **accessibility tree**, not screenshots. Returns structured snapshots: hierarchy of roles, names, states. Target "Role: button, Name: Checkout" — 10x more stable than CSS selectors. AOM-reasoning > DOM-scraping.

## Multi-Agent Testing Pattern (2026)
Run four agents in parallel per deploy:
- **Functional Agent:** Happy path clicks, form submissions, navigation flows
- **Security Agent:** XSS probing, auth bypass attempts, injection testing
- **Accessibility Agent:** WCAG 2.2 compliance, axe-core integration
- **Performance Agent:** CWV measurement, bundle size checks

## Install
```bash
pnpm add @browserbasehq/stagehand
npm pkg set type=module
```

Env: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`. Local mode (headless Chromium) or Browserbase cloud.

## Core API

### Init
```typescript
import { Stagehand } from '@browserbasehq/stagehand';

const stagehand = new Stagehand({
  env: 'LOCAL',                        // 'LOCAL' | 'BROWSERBASE'
  model: 'google/gemini-2.0-flash',   // any major provider
  headless: true,
});
await stagehand.init();
const page = stagehand.context.pages()[0];
```

### act() -- Execute Actions
Natural language browser actions. Returns void. Resolves against a11y tree.
```typescript
await stagehand.act('click the Sign In button');
await stagehand.act('type "test@megabyte.space" into the email field');
await stagehand.act('press Enter');
```

### extract() -- Structured Data
Pulls typed data from current page using Zod schemas.
```typescript
import { z } from 'zod';

const { title, price } = await stagehand.extract(
  'extract the product title and price',
  z.object({
    title: z.string().describe('Product name'),
    price: z.string().describe('Price with currency symbol'),
  })
);
```

### observe() -- Discover Actions
Returns available actions/elements matching an instruction. Use to find selectors dynamically.
```typescript
const actions = await stagehand.observe('find all navigation links');
// Returns: [{ description: 'Home link', selector: 'a[href="/"]' }, ...]
```

### agent() -- Multi-Step Workflows
Autonomous agent for complex tasks requiring multiple decisions.
```typescript
const agent = stagehand.agent({ model: 'anthropic/claude-sonnet-4-20250514' });
await agent.execute('Navigate to pricing, select the Pro plan, and fill out the signup form');
```

## When to Use Stagehand

| Scenario | Tool |
|----------|------|
| Known stable selector | Playwright (faster, no LLM cost) |
| Selector keeps breaking | Stagehand act() |
| Dynamic/personalized content | Stagehand extract() |
| Unknown page structure | Stagehand observe() |
| Multi-step unknown flow | Stagehand agent() |
| Visual layout check | GPT-4o Vision (not Stagehand) |
| Accessibility audit | axe-core + Playwright a11y tree |

Rule: Playwright for the 80% predictable. Stagehand for the 20% requiring AI.

## Fallback Pattern (Primary Integration)
Try Playwright selector first. If it fails (timeout/stale), fall back to Stagehand AI resolution. This gives speed when selectors work and resilience when they break.

```typescript
import { test, expect } from '@playwright/test';
import { Stagehand } from '@browserbasehq/stagehand';

async function resilientClick(page: Page, selector: string, fallbackInstruction: string) {
  try {
    await page.click(selector, { timeout: 3000 });
  } catch {
    const stagehand = new Stagehand({ env: 'LOCAL', headless: true });
    await stagehand.init();
    const aiPage = stagehand.context.pages()[0];
    await aiPage.goto(page.url());
    await stagehand.act(fallbackInstruction);
    await stagehand.close();
  }
}

// Usage in test
test('checkout flow completes', async ({ page }) => {
  await page.goto(PROD_URL!);
  await resilientClick(page, '[data-testid="add-to-cart"]', 'click the Add to Cart button');
  await resilientClick(page, '[data-testid="checkout"]', 'click the Checkout button');
});
```

## Stagehand-First Test Pattern
For tests that are entirely AI-driven (scraping, dynamic UIs, unknown layouts):

```typescript
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

async function aiSmokeTest(url: string) {
  const stagehand = new Stagehand({ env: 'LOCAL', headless: true });
  await stagehand.init();
  const page = stagehand.context.pages()[0];
  await page.goto(url);

  // Verify page has expected content
  const meta = await stagehand.extract(
    'extract the page title, meta description, and main heading',
    z.object({
      title: z.string(),
      description: z.string(),
      heading: z.string(),
    })
  );

  // Verify navigation works
  const navLinks = await stagehand.observe('find all main navigation links');
  for (const link of navLinks) {
    await stagehand.act(`click the ${link.description}`);
    await page.waitForLoadState('domcontentloaded');
    await page.goBack();
  }

  await stagehand.close();
  return { meta, linksChecked: navLinks.length };
}
```

## Integration with Emdash Testing

### E2E Fallback in test-writer Agent
When generating Playwright tests, add Stagehand fallback for fragile selectors. Priority: `data-testid` > `role` > `text` > Stagehand AI.

### Visual Inspection Loop
Stagehand observe() discovers interactive elements. GPT-4o Vision scores aesthetics. Both run in visual-inspection-loop.md cycle.

### CI/CD
Local mode (`env: 'LOCAL'`) runs headless Chromium -- no external API needed for the browser. Only needs an LLM API key. Add to `package.json`:
```json
{
  "devDependencies": {
    "@browserbasehq/stagehand": "^2.0.0",
    "@playwright/test": "^1.50.0",
    "zod": "^3.24.0"
  }
}
```

## Cost
act/extract/observe use ~200-500 tokens per call. Gemini Flash: ~$0.001/call. Claude Sonnet: ~$0.005/call. agent() uses 2-10x more (multi-step). Cache repeated actions (auto-caching built in).

## Anti-Patterns
- NEVER use Stagehand for every action (slow, expensive). Playwright first.
- NEVER use Stagehand for visual checks (use GPT-4o Vision).
- NEVER skip Zod schemas in extract() (untyped data = bugs).
- NEVER run agent() for single actions (use act() instead).
- NEVER hardcode Browserbase API key in repo (use `get-secret`).
