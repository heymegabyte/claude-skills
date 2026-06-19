---
skill: og-card-pipeline
version: 1.0.0
tags: [cloudflare, workers, og, opengraph, satori, r2, media]
cross-links: [cf-browser-rendering, always, r2-patterns]
---

# OG Card Pipeline

Advanced companion to `og-image-generation.md`. Focuses on: content-hash URLs for immutable caching, per-entity typed JSX templates, module-scoped font memoization, and R2 as the sole cache layer. Skip this file for simple query-param cards — use the base file. Use this when you need per-route typed cards (blog, product, profile, event) with scraper-proof cache invalidation.

## Why OG Cards Matter

- Twitter/X, LinkedIn, Slack, iMessage all render OG cards on link share — blank card = invisible on social
- `1200×630` is the canonical size; render at exactly that — no upscaling needed, 2× retina handled by display
- `og:image` must be an absolute HTTPS URL; relative URLs silently fail in most scrapers
- Stale OG images linger 7–30 days in scraper caches — content-hash URLs force a fresh fetch on every content change
- `summary_large_image` Twitter card type always beats `summary` — never use `summary` for visual content
- LinkedIn's scraper caches more aggressively than Twitter — path-based hashes are more reliable than `?v=` params

## Stack Choice

- **Satori** (Vercel): JSX object tree → SVG; runs pure WASM in Workers — no headless browser, no cold-start penalty from Puppeteer
- **Resvg-wasm**: SVG → PNG in Workers; ~2MB WASM binary — lazy-load from R2 on first request, then module-scope cache
- **R2**: sole storage layer for WASM, fonts, and rendered PNGs — no KV needed, immutable URLs make TTLs irrelevant
- **CF Browser Rendering** (`@cloudflare/puppeteer`): fallback only when Satori can't handle a design (CSS `backdrop-filter`, SVG `feBlend`); costs 1 session/render, ~2–5s — reserve for <5% of cards
- Never use `canvas` in Workers — no native canvas API in the V8 isolate

## Install + wrangler.toml

```bash
npm i satori @resvg/resvg-wasm
npm i -D @types/react
```

```toml
# wrangler.toml
[[r2_buckets]]
binding = "OG_BUCKET"
bucket_name = "og-cards"

# Optional: dedicated DB binding if card props come from D1
[[d1_databases]]
binding = "DB"
database_name = "main"
database_id = "your-d1-id"
```

## One-Time R2 Asset Upload

```bash
# Fonts — TTF only; OTF has partial Satori support (some features silently dropped)
wrangler r2 object put og-cards/fonts/Sora-Bold.ttf --file ./assets/fonts/Sora-Bold.ttf
wrangler r2 object put og-cards/fonts/Sora-Regular.ttf --file ./assets/fonts/Sora-Regular.ttf

# Resvg WASM — path must match ensureResvg() below
wrangler r2 object put og-cards/wasm/resvg.wasm \
  --file ./node_modules/@resvg/resvg-wasm/index_bg.wasm
```

- Re-upload fonts when upgrading Satori major versions — glyph subset requirements change
- Pin `@resvg/resvg-wasm` version in `package.json`; WASM binary must match the JS wrapper exactly

## WASM + Font Bootstrap

```ts
// src/og/bootstrap.ts
import initResvg, { Resvg } from '@resvg/resvg-wasm';
export { Resvg };

// Module-scope singletons — survive across requests in the same isolate
let resvgReady = false;
let fontsCache: { soraBold: ArrayBuffer; soraRegular: ArrayBuffer } | null = null;

export async function ensureResvg(bucket: R2Bucket): Promise<void> {
  if (resvgReady) return;
  const obj = await bucket.get('wasm/resvg.wasm');
  if (!obj) throw new Error('resvg.wasm missing from R2 — run upload script');
  await initResvg(await obj.arrayBuffer());
  resvgReady = true;
}

export async function getFonts(
  bucket: R2Bucket
): Promise<{ soraBold: ArrayBuffer; soraRegular: ArrayBuffer }> {
  if (fontsCache) return fontsCache;
  const [bold, regular] = await Promise.all([
    bucket.get('fonts/Sora-Bold.ttf'),
    bucket.get('fonts/Sora-Regular.ttf'),
  ]);
  if (!bold || !regular) throw new Error('Fonts missing from R2');
  fontsCache = {
    soraBold: await bold.arrayBuffer(),
    soraRegular: await regular.arrayBuffer(),
  };
  return fontsCache;
}
```

- First request: WASM init + font fetch from R2 (~300–500ms overhead); subsequent requests in same isolate: 0ms
- Isolates are reused across requests in the same CF PoP — module-scope caching is safe and effective
- Never store WASM/fonts in Workers KV for this — R2 streaming avoids KV's 25MB value limit

## Content-Hash Caching

```ts
// src/og/cache.ts
export function hashProps(props: unknown): string {
  // TextEncoder + crypto.subtle — available in Workers (no Node import needed)
  const json = JSON.stringify(props);
  // Synchronous hex hash via a simple djb2 for speed; use subtle.digest for crypto-grade
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h << 5) + h) ^ json.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function r2Key(type: string, hash: string): string {
  return `cards/${type}/${hash}.png`;
}

export async function getCachedPng(
  bucket: R2Bucket,
  key: string
): Promise<Response | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Cache': 'HIT',
    },
  });
}

export async function storePng(
  bucket: R2Bucket,
  key: string,
  png: Uint8Array
): Promise<void> {
  await bucket.put(key, png, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
    customMetadata: { generatedAt: new Date().toISOString() },
  });
}
```

- `immutable` directive tells CDN edges and browsers the bytes will never change at this URL — safe because the URL encodes the content hash
- Content changes → new hash → new R2 key → scraper fetches fresh — no manual cache purge needed
- Stale keys accumulate; run a monthly Scheduled Worker to delete R2 objects older than 90 days with `bucket.list()` + `bucket.delete()`

## SVG → PNG Conversion

```ts
// src/og/render.ts
import { Resvg, ensureResvg } from './bootstrap';

export async function svgToPng(svg: string, bucket: R2Bucket): Promise<Uint8Array> {
  await ensureResvg(bucket);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: false }, // only embedded fonts — Workers has no system fonts
  });
  return resvg.render().asPng();
}
```

## Template: Blog Post Card

```ts
// src/og/templates/blog.ts
import satori from 'satori';

export interface BlogCardProps {
  title: string;       // ≤80 chars for clean render; truncate at 80 before passing
  author: string;
  date: string;        // pre-formatted: 'Jun 18, 2026'
  category: string;
  logoDataUrl: string; // base64 PNG — Satori can't fetch external URLs at render time
}

export async function renderBlogCard(
  props: BlogCardProps,
  fonts: { soraBold: ArrayBuffer; soraRegular: ArrayBuffer }
): Promise<string> {
  return satori(
    {
      type: 'div',
      props: {
        style: {
          width: 1200, height: 630,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          backgroundColor: '#060610',
          padding: '60px 80px',
          fontFamily: 'Sora',
        },
        children: [
          // Accent bar
          { type: 'div', props: { style: { width: 64, height: 4, backgroundColor: '#00E5FF', marginBottom: 24 } } },
          // Category chip
          {
            type: 'div',
            props: {
              style: {
                backgroundColor: '#00E5FF1A', color: '#00E5FF',
                border: '1px solid #00E5FF33', borderRadius: 6,
                padding: '6px 16px', fontSize: 14, width: 'fit-content',
              },
              children: props.category,
            },
          },
          // Title — Satori wraps text automatically; keep ≤80 chars for 2-line max at fontSize 52
          {
            type: 'div',
            props: {
              style: {
                color: '#FFFFFF', fontSize: 52, fontWeight: 700,
                lineHeight: 1.15, maxWidth: 900, marginTop: 24,
              },
              children: props.title,
            },
          },
          // Footer
          {
            type: 'div',
            props: {
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { color: '#7C3AED', fontSize: 18, fontWeight: 400 },
                    children: `${props.author} · ${props.date}`,
                  },
                },
                {
                  type: 'img',
                  props: {
                    src: props.logoDataUrl,
                    width: 120, height: 36,
                    style: { objectFit: 'contain' },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200, height: 630,
      fonts: [
        { name: 'Sora', data: fonts.soraBold, weight: 700, style: 'normal' },
        { name: 'Sora', data: fonts.soraRegular, weight: 400, style: 'normal' },
      ],
    }
  );
}
```

- Satori does NOT support `gap`, `fit-content` (use explicit widths), `text-overflow: ellipsis`, or CSS variables — check supported properties at `github.com/vercel/satori#css`
- External image URLs at render time fail silently — convert logo to base64 data URL once at startup and cache in module scope
- `lineHeight` in Satori is unitless (1.15), not `px` or `em`

## Template: Product / Landing Card

```ts
// src/og/templates/product.ts
import satori from 'satori';

export interface ProductCardProps {
  tagline: string;    // hero line, ≤60 chars
  subheadline: string; // ≤120 chars
  logoDataUrl: string;
  accentColor?: string; // defaults to '#00E5FF'
}

export async function renderProductCard(
  props: ProductCardProps,
  fonts: { soraBold: ArrayBuffer; soraRegular: ArrayBuffer }
): Promise<string> {
  const accent = props.accentColor ?? '#00E5FF';
  return satori(
    {
      type: 'div',
      props: {
        style: {
          width: 1200, height: 630,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          // Satori supports linear-gradient via backgroundImage
          backgroundImage: 'linear-gradient(135deg, #060610 0%, #0d0d2b 100%)',
          padding: '80px 100px',
          fontFamily: 'Sora',
          position: 'relative',
        },
        children: [
          // Top accent bar (full width)
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute', top: 0, left: 0,
                width: 1200, height: 4, backgroundColor: accent,
              },
            },
          },
          // Logo top-left
          {
            type: 'img',
            props: {
              src: props.logoDataUrl,
              width: 100, height: 30,
              style: { objectFit: 'contain', marginBottom: 48 },
            },
          },
          // Tagline
          {
            type: 'div',
            props: {
              style: { color: '#FFFFFF', fontSize: 64, fontWeight: 700, lineHeight: 1.1, marginBottom: 24 },
              children: props.tagline,
            },
          },
          // Subheadline
          {
            type: 'div',
            props: {
              style: { color: '#A0A0C0', fontSize: 24, fontWeight: 400, lineHeight: 1.5, maxWidth: 800 },
              children: props.subheadline,
            },
          },
          // Bottom CTA pill
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute', bottom: 60, right: 100,
                backgroundColor: accent, borderRadius: 8,
                padding: '12px 28px', fontSize: 18, fontWeight: 700, color: '#060610',
              },
              children: 'megabyte.space',
            },
          },
        ],
      },
    },
    {
      width: 1200, height: 630,
      fonts: [
        { name: 'Sora', data: fonts.soraBold, weight: 700, style: 'normal' },
        { name: 'Sora', data: fonts.soraRegular, weight: 400, style: 'normal' },
      ],
    }
  );
}
```

## Logo Preload (base64 data URL)

```ts
// src/og/logo.ts — call once at isolate startup, cache in module scope
let logoCache: string | null = null;

export async function getLogoDataUrl(bucket: R2Bucket): Promise<string> {
  if (logoCache) return logoCache;
  const obj = await bucket.get('brand/logo.png');
  if (!obj) throw new Error('brand/logo.png missing from R2');
  const buf = await obj.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  logoCache = `data:image/png;base64,${b64}`;
  return logoCache;
}
```

- `btoa` + `Uint8Array` works in Workers without Buffer — no Node import needed
- Keep logo PNG under 50KB; larger logos inflate every OG render's memory footprint

## Hono Route (complete)

```ts
// src/routes/og.ts
import { Hono } from 'hono';
import { getFonts, ensureResvg } from '../og/bootstrap';
import { svgToPng } from '../og/render';
import { hashProps, r2Key, getCachedPng, storePng } from '../og/cache';
import { renderBlogCard } from '../og/templates/blog';
import { renderProductCard } from '../og/templates/product';
import { getLogoDataUrl } from '../og/logo';

const og = new Hono<{ Bindings: Env }>();

og.get('/og/:type/:slug', async (c) => {
  const { type, slug } = c.req.param();
  const bucket = c.env.OG_BUCKET;

  // parallel bootstrap — skips on warm isolate
  const [fonts, logoDataUrl] = await Promise.all([
    getFonts(bucket),
    getLogoDataUrl(bucket),
  ]);

  let props: Record<string, unknown> | null = null;
  let svg: string | null = null;

  if (type === 'blog') {
    const post = await c.env.DB
      .prepare('SELECT title, author_name, published_at, category FROM blog_posts WHERE slug = ? AND published = 1')
      .bind(slug)
      .first<{ title: string; author_name: string; published_at: number; category: string }>();
    if (!post) return c.notFound();
    props = {
      title: post.title.slice(0, 80),
      author: post.author_name,
      date: new Date(post.published_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: post.category,
      logoDataUrl,
    };
    const hash = hashProps(props);
    const key = r2Key('blog', hash);
    const cached = await getCachedPng(bucket, key);
    if (cached) return cached;
    svg = await renderBlogCard(props as any, fonts);
    const png = await svgToPng(svg, bucket);
    await storePng(bucket, key, png);
    return new Response(png, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Cache': 'MISS' },
    });
  }

  if (type === 'product') {
    // product cards are static per slug — slug maps to a config object
    const configs: Record<string, { tagline: string; subheadline: string }> = {
      default: { tagline: 'Ship faster with AI.', subheadline: 'Cloudflare-native tools for solo builders who move at agent speed.' },
    };
    const config = configs[slug] ?? configs['default'];
    props = { ...config, logoDataUrl };
    const hash = hashProps(props);
    const key = r2Key('product', hash);
    const cached = await getCachedPng(bucket, key);
    if (cached) return cached;
    svg = await renderProductCard(props as any, fonts);
    const png = await svgToPng(svg, bucket);
    await storePng(bucket, key, png);
    return new Response(png, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Cache': 'MISS' },
    });
  }

  return c.notFound();
});

export { og };
```

## Meta Tags in HTML

```html
<!-- Blog post page — absolute URL, path-based hash baked in at SSR/SSG time -->
<meta property="og:image" content="https://yourdomain.com/og/blog/my-post-slug" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://yourdomain.com/og/blog/my-post-slug" />
```

- Never `summary` — always `summary_large_image`
- LinkedIn re-scrapes on `?v={hash}` param change if you can't use path-based invalidation
- Validate with Twitter Card Validator (`cards.twitter.com/validator`) and Facebook Sharing Debugger after deploy

## CF Browser Rendering Fallback (rare)

```ts
// Only when Satori cannot handle the design — e.g. CSS backdrop-filter, feBlend
import puppeteer from '@cloudflare/puppeteer';

export async function renderWithBrowser(
  env: { MYBROWSER: Fetcher; OG_BUCKET: R2Bucket },
  screenshotUrl: string,
  cacheKey: string
): Promise<Uint8Array> {
  const browser = await puppeteer.launch(env.MYBROWSER);
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(screenshotUrl, { waitUntil: 'networkidle0' });
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }) as Uint8Array;
  await browser.close();
  await storePng(env.OG_BUCKET, cacheKey, png);
  return png;
}
```

- Add `browser = { binding = "MYBROWSER" }` to `wrangler.toml` and enable CF Browser Rendering in dashboard
- Each call costs one browser session from your plan quota — cache aggressively

## R2 Lifecycle: Monthly Cleanup Cron

```ts
// src/scheduled/og-cleanup.ts — wire to `scheduled` export in worker entry
export async function cleanOgCache(bucket: R2Bucket): Promise<void> {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days
  let cursor: string | undefined;
  do {
    const list = await bucket.list({ prefix: 'cards/', cursor, limit: 1000 });
    const toDelete = list.objects
      .filter((o) => new Date(o.uploaded).getTime() < cutoff)
      .map((o) => o.key);
    await Promise.all(toDelete.map((k) => bucket.delete(k)));
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
}
```

```toml
# wrangler.toml
[triggers]
crons = ["0 3 1 * *"] # 03:00 UTC on the 1st of each month
```

## Satori Gotchas (production-verified)

- `gap` is not supported — use `padding` + fixed widths for spacing between flex children
- `fit-content` in width/height not supported — set explicit pixel dimensions
- `text-overflow: ellipsis` not supported — truncate strings in JS before passing to Satori
- CSS variables (`var(--color)`) not supported — inline all values
- `position: absolute` children require `position: relative` on parent — works correctly in Satori
- External image `src` at render time fails silently — always preload as base64 data URL
- OTF fonts may drop features (ligatures, kerning) — stick to TTF for predictable rendering
- WASM cold start: first request ~500–800ms; warm isolate <100ms — acceptable for OG (scrapers don't hot-path)

## Production Checklist

- `wrangler r2 object put` fonts + WASM before first deploy
- Validate card render locally: `wrangler dev` → `curl http://localhost:8787/og/blog/test-slug > /tmp/test.png && open /tmp/test.png`
- Run Twitter Card Validator and Facebook Sharing Debugger post-deploy
- Confirm `X-Cache: HIT` on second request to verify R2 cache is working
- Set R2 lifecycle cron or bucket expiry rule for `cards/` prefix — unchecked growth is the only real risk
- Monitor R2 storage in CF dashboard — 1000 cards × 150KB avg = 150MB, well within free tier

## See Also

- `[[cf-browser-rendering]]` — when Satori cannot handle complex CSS; Puppeteer session setup
- `[[always]]` — OG image is a hard gate on every page before ship
- `[[r2-patterns]]` — R2 lifecycle rules, presigned URLs, multipart upload patterns
- `og-image-generation.md` (this dir) — simpler query-param based cards; use when you don't need typed per-entity templates
