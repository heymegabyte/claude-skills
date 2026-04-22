---
name: "OG Image Generation"
description: "Satori (@vercel/og) for edge-rendered OG images from HTML/JSX templates. CF Worker route /api/og?title=X&desc=Y → Satori renders HTML to SVG → resvg converts to PNG → cache in KV/R2. Dark brand template (1200x630), dynamic per-route generation, social platform sizes, meta-tag helper integration."---

# OG Image Generation
## Worker Route (Hono)
```typescript
// src/routes/og.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-wasm';

const og = new Hono<{ Bindings: Env }>();

const ogSchema = z.object({
  title: z.string().min(1).max(120),
  desc: z.string().max(200).optional(),
  size: z.enum(['og', 'twitter', 'linkedin']).default('og'),
});

const SIZES: Record<string, { width: number; height: number }> = {
  og: { width: 1200, height: 630 },
  twitter: { width: 1200, height: 600 },
  linkedin: { width: 1200, height: 627 },
};

og.get('/og', zValidator('query', ogSchema), async (c) => {
  const { title, desc, size } = c.req.valid('query');
  const cacheKey = `og:${size}:${encodeURIComponent(title)}:${encodeURIComponent(desc || '')}`;

  // Check KV cache first
  const cached = await c.env.KV.get(cacheKey, 'arrayBuffer');
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' } });
  }

  try {
    const dimensions = SIZES[size];
    const soraFont = await c.env.R2.get('fonts/Sora-Bold.ttf');
    const spaceFont = await c.env.R2.get('fonts/SpaceGrotesk-Regular.ttf');
    if (!soraFont || !spaceFont) throw new Error('Font files missing from R2');

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 80px',
            background: '#060610',
            fontFamily: 'Space Grotesk',
          },
          children: [
            {
              type: 'div',
              props: {
                style: { width: 64, height: 4, background: '#00E5FF', marginBottom: 24 },
              },
            },
            {
              type: 'div',
              props: {
                style: { fontSize: 56, fontWeight: 700, color: '#FFFFFF', fontFamily: 'Sora', lineHeight: 1.2, marginBottom: 16 },
                children: title,
              },
            },
            desc
              ? {
                  type: 'div',
                  props: {
                    style: { fontSize: 24, color: '#A0A0B8', lineHeight: 1.5 },
                    children: desc,
                  },
                }
              : null,
            {
              type: 'div',
              props: {
                style: { position: 'absolute', bottom: 40, right: 80, fontSize: 20, color: '#00E5FF' },
                children: 'megabyte.space',
              },
            },
          ].filter(Boolean),
        },
      },
      {
        ...dimensions,
        fonts: [
          { name: 'Sora', data: await soraFont.arrayBuffer(), weight: 700, style: 'normal' },
          { name: 'Space Grotesk', data: await spaceFont.arrayBuffer(), weight: 400, style: 'normal' },
        ],
      }
    );

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: dimensions.width } });
    const png = resvg.render().asPng();

    // Cache in KV (7-day TTL)
    await c.env.KV.put(cacheKey, png, { expirationTtl: 604800 });

    // Store in R2 for long-term backup
    const r2Key = `og/${cacheKey.replace(/:/g, '/')}.png`;
    await c.env.R2.put(r2Key, png, { httpMetadata: { contentType: 'image/png' } });

    return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' } });
  } catch (error) {
    // Fallback: serve pre-generated default from R2
    const fallback = await c.env.R2.get('og/default.png');
    if (fallback) {
      return new Response(await fallback.arrayBuffer(), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
      });
    }
    return c.json({ error: 'OG generation failed', code: 'OG_RENDER_ERROR' }, 500);
  }
});

export { og };
```

## Meta-Tag Helper
```typescript
// src/lib/og-meta.ts
interface OgMetaOptions {
  title: string;
  description: string;
  path: string;
  size?: 'og' | 'twitter' | 'linkedin';
}

function ogImageUrl(baseUrl: string, opts: OgMetaOptions): string {
  const params = new URLSearchParams({ title: opts.title, desc: opts.description });
  if (opts.size) params.set('size', opts.size);
  return `${baseUrl}/api/og?${params}`;
}

function generateOgMeta(baseUrl: string, opts: OgMetaOptions): string {
  const ogUrl = ogImageUrl(baseUrl, opts);
  const twitterUrl = ogImageUrl(baseUrl, { ...opts, size: 'twitter' });
  const canonical = `${baseUrl}${opts.path}`;

  return `
    <meta property="og:title" content="${opts.title}" />
    <meta property="og:description" content="${opts.description}" />
    <meta property="og:image" content="${ogUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${opts.title}" />
    <meta name="twitter:description" content="${opts.description}" />
    <meta name="twitter:image" content="${twitterUrl}" />
  `.trim();
}

export { generateOgMeta, ogImageUrl };
```

## Angular SSR Integration
```typescript
// og-meta.service.ts
import { Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class OgMetaService {
  private readonly meta = inject(Meta);

  setOgTags(title: string, description: string, path: string): void {
    const baseUrl = 'https://megabyte.space';
    const ogUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;
    const twitterUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}&size=twitter`;

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: ogUrl });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:url', content: `${baseUrl}${path}` });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:image', content: twitterUrl });
  }
}
```

## Cache Purge on Content Change
```typescript
// Inngest function to purge OG cache when content updates
import { inngest } from './client';

export const purgeOgCache = inngest.createFunction(
  { id: 'purge-og-cache', name: 'Purge OG Image Cache' },
  { event: 'content/updated' },
  async ({ event, step }) => {
    const { path, title } = event.data;
    const cacheKey = `og:og:${encodeURIComponent(title)}:*`;

    await step.run('purge-kv', async () => {
      const keys = await KV.list({ prefix: `og:og:${encodeURIComponent(title)}` });
      await Promise.all(keys.keys.map((k) => KV.delete(k.name)));
    });

    await step.run('purge-r2', async () => {
      const r2Key = `og/og/${encodeURIComponent(title)}`;
      await R2.delete(r2Key);
    });
  }
);
```

## R2 Font Setup
```bash
# Upload brand fonts to R2 for Satori rendering
wrangler r2 object put uploads/fonts/Sora-Bold.ttf --file=./assets/fonts/Sora-Bold.ttf
wrangler r2 object put uploads/fonts/SpaceGrotesk-Regular.ttf --file=./assets/fonts/SpaceGrotesk-Regular.ttf
```

## wrangler.toml Bindings
```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "uploads"
```

## Social Platform Sizes
OG (Facebook/general): 1200x630. Twitter: 1200x600. LinkedIn: 1200x627. All use same template, different crop. Size param on /api/og controls which dimensions Satori renders.

## Fallback Chain
1. KV cache hit → serve immediately. 2. Satori render → cache in KV + R2 → serve. 3. Satori fails → serve R2 default.png. 4. R2 default missing → 500 with error envelope. Pre-generate default.png at deploy time: `curl /api/og?title=Megabyte+Labs&desc=Ship+faster`.
