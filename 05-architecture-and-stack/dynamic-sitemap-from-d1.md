---
skill: dynamic-sitemap-from-d1
version: 1.0.0
tags: [cloudflare, d1, seo, sitemap, workers, hono]
cross-links: [pseo-templates, hono-api, cf-d1-patterns]
---

# Dynamic Sitemap from D1

## Why Split Sitemaps

- Google hard limit: 50k URLs / 50MB per sitemap file — split by content type, never alphabetically
- Sitemap index (`sitemap.xml`) references child sitemaps; Googlebot fetches each independently
- Split pattern: `sitemap-static.xml` (hand-authored routes), `sitemap-blog.xml`, `sitemap-products.xml`, `sitemap-pseo.xml`, `sitemap-locales.xml`
- `<lastmod>` from D1 `updated_at` column — do NOT fake with today's date (misleads Googlebot crawl budget)

## D1 Schema Requirements

```sql
-- every content table needs these columns for sitemap generation
ALTER TABLE blog_posts ADD COLUMN slug TEXT UNIQUE NOT NULL;
ALTER TABLE blog_posts ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (unixepoch());
ALTER TABLE blog_posts ADD COLUMN sitemap_priority REAL DEFAULT 0.7;
ALTER TABLE blog_posts ADD COLUMN sitemap_changefreq TEXT DEFAULT 'weekly';
ALTER TABLE blog_posts ADD COLUMN published INTEGER DEFAULT 0;

-- same pattern for products, pseo_pages, locales
```

- Index on `(published, updated_at DESC)` — every sitemap query filters + sorts on both
- `updated_at` is Unix epoch integer, not ISO string — multiply by 1000 for JS `Date`

## Sitemap Index Route

```ts
import { Hono } from 'hono';

type Env = { DB: D1Database; CACHE: Cache; SITE_URL: string };

const app = new Hono<{ Bindings: Env }>();

const SITEMAP_NAMES = ['static', 'blog', 'products', 'pseo', 'locales'] as const;

app.get('/sitemap.xml', async (c) => {
  const cacheKey = new Request(`${c.env.SITE_URL}/sitemap.xml`);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const lastmods = await Promise.all(
    SITEMAP_NAMES.map(async (name) => {
      const row = await c.env.DB.prepare(
        `SELECT MAX(updated_at) as lm FROM sitemap_meta WHERE name = ?`
      ).bind(name).first<{ lm: number | null }>();
      return {
        name,
        lastmod: row?.lm
          ? new Date(row.lm * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      };
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lastmods.map(({ name, lastmod }) => `  <sitemap>
    <loc>${c.env.SITE_URL}/sitemap-${name}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  const response = new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Encoding': 'identity',
    },
  });
  c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
});
```

## Child Sitemap Route (Paginated from D1)

```ts
app.get('/sitemap-blog.xml', async (c) => {
  const cacheKey = new Request(`${c.env.SITE_URL}/sitemap-blog.xml`);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  // D1 cursor-based pagination for >1000 rows
  const rows: { slug: string; updated_at: number; priority: number; changefreq: string }[] = [];
  let offset = 0;
  const PAGE = 500;
  while (true) {
    const page = await c.env.DB.prepare(
      `SELECT slug, updated_at, sitemap_priority as priority, sitemap_changefreq as changefreq
       FROM blog_posts WHERE published = 1
       ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    ).bind(PAGE, offset).all<typeof rows[0]>();
    rows.push(...page.results);
    if (page.results.length < PAGE) break;
    offset += PAGE;
  }

  const urlTags = rows.map(({ slug, updated_at, priority, changefreq }) => `  <url>
    <loc>${c.env.SITE_URL}/blog/${slug}</loc>
    <lastmod>${new Date(updated_at * 1000).toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>`;

  const response = new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
  c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
});
```

- Reuse this pattern for `sitemap-products.xml`, `sitemap-pseo.xml`, `sitemap-locales.xml` — change the table + slug path
- PAGE=500 keeps each D1 round-trip under the 100ms time budget; loop adds round-trips only when needed

## Cache Invalidation

- On content publish: `await caches.default.delete(new Request(\`${SITE_URL}/sitemap-blog.xml\`))` — invalidate child only
- Also delete the sitemap index so `<lastmod>` reflects the new publish timestamp
- Pattern: fire invalidation in the same write handler via `ctx.waitUntil` — non-blocking, no extra latency
- CF Cache API is per-datacenter, not global CDN purge — for zone-wide purge use `fetch('https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache', { method: 'POST', body: JSON.stringify({ files: [...] }) })`

## Static Sitemap Segment

```ts
const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/about', priority: '0.9', changefreq: 'monthly' },
  { loc: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { loc: '/blog', priority: '0.8', changefreq: 'daily' },
  { loc: '/contact', priority: '0.7', changefreq: 'yearly' },
];

app.get('/sitemap-static.xml', (c) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_URLS.map(({ loc, priority, changefreq }) => `  <url>
    <loc>${c.env.SITE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
});
```

- Priority scale: 1.0 homepage, 0.9 top-level marketing, 0.8 feature pages, 0.7 content, 0.5 utility
- No D1 query, no cache API needed — inline constant, cached by CF edge automatically via `Cache-Control`

## Gzip Encoding

```ts
// only apply when payload > 1MB; check Accept-Encoding first
app.get('/sitemap-pseo.xml', async (c) => {
  // ... build xml string ...
  const acceptsGzip = c.req.header('Accept-Encoding')?.includes('gzip') ?? false;
  if (acceptsGzip && xml.length > 1_000_000) {
    const encoder = new TextEncoderStream();
    const compressor = new CompressionStream('gzip');
    const stream = encoder.readable.pipeThrough(compressor);
    const writer = encoder.writable.getWriter();
    writer.write(xml);
    writer.close();
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
});
```

- `CompressionStream('gzip')` is available in Workers runtime — no npm dep needed
- Under 1MB: compression overhead isn't worth it; Googlebot handles plaintext fine

## wrangler.toml Routes

```toml
[[routes]]
pattern = "/sitemap*.xml"
zone_name = "yourdomain.com"

[[routes]]
pattern = "/robots.txt"
zone_name = "yourdomain.com"
```

- Single `sitemap*.xml` wildcard catches index + all children — no per-child route entry needed
- No KV binding required — CF Cache API is available to all Workers by default

## Robots.txt Integration

```ts
app.get('/robots.txt', (c) => {
  return c.text(`User-agent: *\nAllow: /\nSitemap: ${c.env.SITE_URL}/sitemap.xml\n`);
});
```

- Point `Sitemap:` at the index URL only — never individual children; GSC discovers children via the index
- Submit only `sitemap.xml` in Google Search Console → Indexing → Sitemaps

## Nightly Regeneration Cron

```ts
// wrangler.toml: [triggers] crons = ["0 2 * * *"]
export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const SITEMAPS = ['static', 'blog', 'products', 'pseo', 'locales'];
    await Promise.all(
      SITEMAPS.map((name) =>
        caches.default.delete(new Request(`${env.SITE_URL}/sitemap-${name}.xml`))
      )
    );
    await caches.default.delete(new Request(`${env.SITE_URL}/sitemap.xml`));
    // warm the cache immediately after purge
    await Promise.all(
      SITEMAPS.map((name) => fetch(`${env.SITE_URL}/sitemap-${name}.xml`))
    );
    await fetch(`${env.SITE_URL}/sitemap.xml`);
    // ping Google
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(env.SITE_URL + '/sitemap.xml')}`);
  },
};
```

- Run at 2am UTC — low-traffic window, D1 queries won't contend with user requests
- Warm cache immediately after purge so first Googlebot hit is already cached

## Production Checklist

- D1 query must filter `published = 1` — never leak draft URLs into sitemaps
- `<lastmod>` must be ISO 8601 date only (`YYYY-MM-DD`), not datetime — Googlebot prefers date-only
- Validate with `https://www.xml-sitemaps.com/validate-xml-sitemap.html` before going live
- Confirm no duplicate `<loc>` values across child sitemaps — Googlebot deduplicates but it wastes crawl budget
- Monitor errors in Google Search Console → Indexing → Sitemaps after first submission

## See Also

- `[[pseo-templates]]` — pSEO pages slot into `sitemap-pseo.xml` using the same paginated D1 pattern
- `[[hono-api]]` — Hono routing conventions and middleware patterns
- `[[cf-d1-patterns]]` — D1 pagination, cursor patterns, and index design
