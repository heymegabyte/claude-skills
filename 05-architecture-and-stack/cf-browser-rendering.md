---
name: "cf-browser-rendering"
priority: 2
pack: "architecture"
triggers:
  - "screenshot"
  - "OG card"
  - "og image"
  - "pdf generation"
  - "headless browser"
  - "web scraping"
  - "puppeteer"
  - "playwright"
  - "browser rendering"
  - "visual qa"
  - "automated screenshot"
paths:
  - "**/wrangler.{toml,jsonc}"
  - "**/og/**"
  - "**/screenshots/**"
  - "**/pdf/**"
---

# CF Browser Rendering

Cloudflare-native headless Chromium. Two integration modes: **REST API** (stateless, zero Worker code) and **Workers Binding** (full Puppeteer API inside a Worker). Both run on CF's edge — no Playwright Cloud, no self-hosted browser farm.

Source: `developers.cloudflare.com/browser-rendering`. See `[[cloudflare-lock-in-is-leverage]]`.

## Pricing

- Free tier: generous included minutes per month
- Paid: **$0.09/hr of browser time** — cheaper than Playwright Cloud ($0.40+/hr) and BrowserBase ($0.10+/hr with seat fees)
- Pay only for active browser time; idle/hibernated sessions cost nothing
- Available on Free and Paid plans — no Workers Paid plan required for REST API

## Mode 1 — REST API (no Worker code, stateless)

Best for: OG card generation, one-off screenshots, PDF from URL, CI visual snapshots.

### Screenshot endpoint

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/browser-rendering/screenshot" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://megabyte.space/blog/my-post",
    "viewport": { "width": 1200, "height": 630 },
    "screenshotOptions": { "fullPage": false, "type": "png" },
    "gotoOptions": { "waitUntil": "networkidle0", "timeout": 30000 }
  }' \
  --output og-card.png
```

### PDF generation endpoint

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/browser-rendering/pdf" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://megabyte.space/invoice/123",
    "pdfOptions": {
      "format": "A4",
      "printBackground": true,
      "margin": { "top": "1cm", "bottom": "1cm", "left": "1cm", "right": "1cm" }
    }
  }' \
  --output invoice.pdf
```

### Render HTML → screenshot (OG cards from template)

```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/browser-rendering/screenshot" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body style=\"margin:0;background:#060610;color:#00E5FF;font-family:Sora,sans-serif;display:flex;align-items:center;justify-content:center;width:1200px;height:630px\"><h1>My Post Title</h1></body></html>",
    "viewport": { "width": 1200, "height": 630 },
    "screenshotOptions": { "type": "png" }
  }' \
  --output og.png
```

### REST API from a Worker (OG card on-demand)

```ts
// src/worker/routes/og.ts
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/og', async (c) => {
  const title = c.req.query('title') ?? 'Megabyte';
  const html = `<html><body style="margin:0;width:1200px;height:630px;
    background:#060610;color:#00E5FF;font-family:Sora,sans-serif;
    display:flex;align-items:center;padding:80px">
    <h1 style="font-size:72px;line-height:1.1">${title}</h1>
  </body></html>`;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/browser-rendering/screenshot`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html,
        viewport: { width: 1200, height: 630 },
        screenshotOptions: { type: 'png' },
      }),
    }
  );

  return new Response(res.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
});

export default app;
```

## Mode 2 — Workers Binding (Puppeteer API)

Best for: scraping authenticated pages, multi-step flows, full-page interactions, session reuse.

### wrangler.toml

```toml
[browser]
binding = "MYBROWSER"
```

No other config needed — CF provisions the headless Chromium instance automatically.

### Basic Worker (screenshot + close)

```ts
import puppeteer from '@cloudflare/puppeteer';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await puppeteer.launch(env.MYBROWSER);
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.goto('https://example.com', { waitUntil: 'networkidle0' });

    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    await browser.close();

    return new Response(screenshot, { headers: { 'Content-Type': 'image/png' } });
  },
};
```

### Session reuse pattern (critical for performance)

Omit `browser.close()` to keep the session warm. CF closes it after 1 minute of inactivity by default. Use `keep_alive` to extend to 10 minutes.

```ts
import puppeteer, { Browser } from '@cloudflare/puppeteer';

// DO-backed session reuse (one browser per DO instance)
export class BrowserSession {
  private browser: Browser | null = null;
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async getBrowser(): Promise<Browser> {
    if (this.browser) {
      try {
        // Check if still alive
        await this.browser.version();
        return this.browser;
      } catch {
        this.browser = null;
      }
    }
    this.browser = await puppeteer.launch(this.env.MYBROWSER, {
      keep_alive: 600_000, // 10 minutes in ms
    });
    return this.browser;
  }

  async fetch(request: Request): Promise<Response> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.goto(new URL(request.url).searchParams.get('url') ?? 'about:blank');
    const html = await page.content();
    await page.close(); // close page, NOT browser — keeps session alive
    return new Response(html);
  }
}
```

### PDF generation via binding

```ts
const page = await browser.newPage();
await page.goto('https://megabyte.space/invoice/123', { waitUntil: 'networkidle0' });
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
});
await browser.close();
return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
```

### Scraping with selector targeting

```ts
await page.goto('https://example.com/data');
await page.waitForSelector('.price-table');
const data = await page.evaluate(() => {
  // Note: can only return primitives (string, number, boolean) or JSON-serializable objects
  return Array.from(document.querySelectorAll('.price-row')).map((row) => ({
    name: row.querySelector('.name')?.textContent?.trim(),
    price: row.querySelector('.price')?.textContent?.trim(),
  }));
});
```

## Use cases

| Use case | Mode | Notes |
|---|---|---|
| OG card generation | REST API | Render HTML template, return PNG, cache at CDN |
| Invoice PDF | REST API | Pass URL + cookies for auth |
| Visual QA snapshots | REST API | CI: capture + diff against baseline |
| Authenticated scraping | Workers Binding | Inject cookies, navigate multi-step |
| Web crawling | Workers Binding | Session reuse across pages — open page, close page, keep browser |
| Stagehand AI scraping | Workers Binding | AI-driven element selection by intent |

## Gotchas

- **XPath not supported** — use CSS selectors only; XPath raises a security error at runtime
- **`userAgent` does not bypass bot protection** — sites with Cloudflare Bot Management will still block headless
- **`page.evaluate()` primitives only** — return strings/numbers/booleans or JSON-serializable objects; DOM nodes, functions, and class instances cannot cross the boundary
- **One browser per Worker invocation** — each `puppeteer.launch()` consumes a concurrent browser slot; use DO session reuse for high-throughput workloads
- **Session limit** — default 2 concurrent browser sessions per account on free tier; contact CF for higher limits on paid plans
- **`browser.close()` vs `page.close()`** — close pages between requests, keep browser open for session reuse; browser closes itself after `keep_alive` ms of inactivity

## Cross-links

- `[[cf-do-rate-limiter]]` — wrap the OG endpoint with DO rate limiter to prevent abuse
- `[[cloudflare-lock-in-is-leverage]]` — CF Browser Rendering vs self-hosted Playwright
- `[[ai-agent-supervisor]]` — agents can trigger screenshot tasks as tool calls
