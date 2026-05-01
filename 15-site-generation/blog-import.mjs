#!/usr/bin/env node
// blog-import.mjs — promoted from njsk.org/scripts/clean-blog-corpus.mjs + enhance-blog-posts.mjs
// Reusable blog importer for any projectsites.dev rebuild with a source blog.
//
// Pipeline:
//   1. Crawl source blog (RSS preferred, JSON fallback, sitemap last)
//   2. Strip CSS/HTML residue (Squarespace fragments, raw <style>, .sqs-*, #block-*)
//   3. AI-restructure flat paragraphs → typed blocks (lead | heading | paragraph | quote | callout)
//   4. Generate per-post: SEO keywords (3-5), 120-180-char excerpt
//   5. pHash dedup hero images (sharp 8x8 DCT, hamming ≤6) — replaces md5
//   6. Emit src/data/blog-posts.ts (typed array) + public/images/blog/*
//
// Usage:
//   node blog-import.mjs --source https://example.com --out src/data/blog-posts.ts \
//                        --images-dir public/images/blog --delete-orphans
//   Env: OPENAI_API_KEY required for restructure pass.

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]?.startsWith('--') ? true : arr[i + 1]]);
    return acc;
  }, []),
);

const SOURCE_URL = args.source || process.env.SOURCE_URL;
const OUT_TS = args.out || 'src/data/blog-posts.ts';
const IMAGES_DIR = args['images-dir'] || 'public/images/blog';
const DELETE_ORPHANS = !!args['delete-orphans'];
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const REAL_UA =
  process.env.REAL_UA ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

if (!SOURCE_URL) {
  console.error('Usage: node blog-import.mjs --source https://... --out src/data/blog-posts.ts --images-dir public/images/blog [--delete-orphans]');
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error('OPENAI_API_KEY required for AI restructure pass');
  process.exit(1);
}

const FETCH_HEADERS = {
  'User-Agent': REAL_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-User': '?1',
  'Sec-Fetch-Dest': 'document',
  'Upgrade-Insecure-Requests': '1',
};

mkdirSync(IMAGES_DIR, { recursive: true });

// 1. Crawl — RSS first
async function fetchRss() {
  const candidates = ['/blog?format=rss', '/feed.xml', '/rss.xml', '/feed', '/atom.xml'];
  for (const path of candidates) {
    try {
      const r = await fetch(new URL(path, SOURCE_URL), { headers: FETCH_HEADERS });
      if (!r.ok) continue;
      const xml = await r.text();
      if (xml.includes('<item') || xml.includes('<entry')) return xml;
    } catch {}
  }
  return null;
}
async function fetchSquarespaceJson() {
  try {
    const r = await fetch(new URL('/blog?format=json-pretty', SOURCE_URL), { headers: FETCH_HEADERS });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

console.log(`[blog-import] crawling ${SOURCE_URL}…`);
const rss = await fetchRss();
const sqs = !rss ? await fetchSquarespaceJson() : null;
if (!rss && !sqs) {
  console.error('[blog-import] no RSS feed or Squarespace JSON found — falling back to sitemap+scrape not yet implemented');
  process.exit(1);
}

// Parse posts
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
      return r ? r[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    };
    items.push({
      title: get('title'),
      link: get('link'),
      pubDate: get('pubDate'),
      content: get('content:encoded') || get('description'),
      author: get('dc:creator') || get('author'),
    });
  }
  return items;
}

const rawPosts = rss
  ? parseRssItems(rss)
  : sqs.items?.map((i) => ({
      title: i.title,
      link: `${SOURCE_URL}${i.fullUrl}`,
      pubDate: new Date(i.publishOn || i.addedOn).toISOString(),
      content: i.body,
      author: i.author?.displayName || '',
    })) || [];

console.log(`[blog-import] ${rawPosts.length} posts parsed`);

// 2. Strip CSS/HTML residue
function stripResidue(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/id="block-yui_[^"]*"/gi, '')
    .replace(/class="sqs-[^"]*"/gi, '')
    .replace(/class="margin-wrapper[^"]*"/gi, '')
    .replace(/class="content-wrapper[^"]*"/gi, '')
    .replace(/data-block-type="\d+"/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 3. AI restructure → typed blocks
async function restructure(title, html) {
  const cleaned = stripResidue(html);
  // Strip remaining tags except <img>/<a>/<blockquote> for context
  const text = cleaned.replace(/<\/?(?:p|div|span|br)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You restructure raw blog text into typed visual blocks. Preserve direct quotes verbatim. Never alter names, dates, or facts.

Block types:
- lead: opening paragraph (one per post, drop-cap styled)
- heading: section header (level 2)
- paragraph: body paragraph
- quote: direct quotation with attribution
- callout: emphasized aside / scripture / pullquote

Return JSON: { excerpt: string (120-180 chars), keywords: string[] (3-5), blocks: [{type, text, level?}] }
Split long paragraphs into multiple paragraph blocks. Each block stands alone visually.`,
        },
        { role: 'user', content: `Title: ${title}\n\nContent:\n${text.slice(0, 8000)}` },
      ],
    }),
  });
  if (!r.ok) {
    console.error(`[blog-import] OpenAI fail for "${title}": ${r.status}`);
    return null;
  }
  const data = await r.json();
  return JSON.parse(data.choices[0].message.content);
}

// 5. pHash dedup (8x8 DCT via sharp)
async function phash(buffer) {
  try {
    const sharp = (await import('sharp')).default;
    const raw = await sharp(buffer).greyscale().resize(32, 32, { fit: 'fill' }).raw().toBuffer();
    // 32x32 grayscale → DCT → top-left 8x8 → median threshold → 64-bit hash
    const dct = computeDct(raw, 32);
    const block = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) block.push(dct[y * 32 + x]);
    const median = [...block].sort((a, b) => a - b)[32];
    return block.map((v) => (v > median ? '1' : '0')).join('');
  } catch {
    // sharp not installed → fallback md5
    return createHash('md5').update(buffer).digest('hex');
  }
}
function computeDct(pixels, size) {
  const out = new Float64Array(size * size);
  for (let v = 0; v < size; v++) {
    for (let u = 0; u < size; u++) {
      let sum = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          sum += pixels[y * size + x] * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size)) * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      out[v * size + u] = (cu * cv * sum) / 4;
    }
  }
  return out;
}
function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

// Process posts
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const seenHashes = [];
const usedImages = new Set();
const finalPosts = [];

for (const raw of rawPosts) {
  const slug = slugify(raw.title);
  if (!slug) continue;

  // Hero image
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(raw.content);
  let hero = null;
  if (imgMatch) {
    const imgUrl = imgMatch[1];
    try {
      const r = await fetch(imgUrl, { headers: FETCH_HEADERS });
      const buf = Buffer.from(await r.arrayBuffer());
      const hash = await phash(buf);
      const dup = seenHashes.find((h) => hamming(h.hash, hash) <= 6);
      if (dup) {
        hero = dup.path;
      } else {
        const ext = extname(new URL(imgUrl).pathname).toLowerCase() || '.jpg';
        const fname = `${slug}${ext}`;
        const dest = join(IMAGES_DIR, fname);
        writeFileSync(dest, buf);
        hero = `/images/blog/${fname}`;
        seenHashes.push({ hash, path: hero });
        usedImages.add(fname);
      }
    } catch (e) {
      console.warn(`[blog-import] hero fetch fail for ${slug}: ${e.message}`);
    }
  }

  const restructured = await restructure(raw.title, raw.content);
  if (!restructured) continue;

  finalPosts.push({
    slug,
    title: raw.title,
    date: new Date(raw.pubDate || Date.now()).toISOString().slice(0, 10),
    author: raw.author || '',
    excerpt: restructured.excerpt,
    keywords: restructured.keywords,
    hero,
    blocks: restructured.blocks,
  });
  console.log(`[blog-import] ✓ ${slug} (${restructured.blocks.length} blocks)`);
}

// 6. Emit TS file
const ts = `// AUTO-GENERATED by ~/.agentskills/15-site-generation/blog-import.mjs
// Source: ${SOURCE_URL}
// Generated: ${new Date().toISOString()}
// Posts: ${finalPosts.length}

export interface BlogBlock {
  type: 'lead' | 'heading' | 'paragraph' | 'quote' | 'callout';
  text: string;
  level?: number;
}
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  keywords: string[];
  hero: string | null;
  blocks: BlogBlock[];
}

export const blogPosts: BlogPost[] = ${JSON.stringify(finalPosts, null, 2)};
`;
mkdirSync(OUT_TS.split('/').slice(0, -1).join('/') || '.', { recursive: true });
writeFileSync(OUT_TS, ts);
console.log(`[blog-import] wrote ${finalPosts.length} posts → ${OUT_TS}`);

// Delete orphans
if (DELETE_ORPHANS) {
  let deleted = 0;
  for (const f of readdirSync(IMAGES_DIR)) {
    if (!usedImages.has(f) && !seenHashes.some((h) => h.path.endsWith(f))) {
      unlinkSync(join(IMAGES_DIR, f));
      deleted++;
    }
  }
  console.log(`[blog-import] deleted ${deleted} orphan images from ${IMAGES_DIR}`);
}

console.log(`[blog-import] DONE — ${finalPosts.length} posts, ${seenHashes.length} unique hero images`);
