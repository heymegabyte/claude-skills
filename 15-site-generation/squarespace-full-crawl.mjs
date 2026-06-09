#!/usr/bin/env node
// Squarespace full-archive crawler — proven on njsk.org (129 posts, 1027 images).
// Usage: DOMAIN=https://example.com node squarespace-full-crawl.mjs
// Output: posts.json (every post with full body, images, dates, tags, categories).
//
// Why this script: Squarespace's HTML pagination silently drops posts; the
// JSON endpoint at /blog?format=json&offset=N is the source of truth. Loop
// until items.length===0, dedup by item.id, then verify count matches sitemap.

import fs from 'fs';
import { REAL_HEADERS } from './_real-ua.mjs';

const DOMAIN = process.env.DOMAIN || (() => { throw new Error('Set DOMAIN env'); })();
const SLEEP_MS = parseInt(process.env.SLEEP_MS || '500', 10); // Be polite

async function fetchPage(offset) {
  const url = `${DOMAIN}/blog?format=json&offset=${offset}`;
  const res = await fetch(url, { headers: REAL_HEADERS });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function fetchSitemapBlogCount() {
  try {
    const res = await fetch(`${DOMAIN}/sitemap.xml`);
    if (!res.ok) return null;
    const xml = await res.text();
    const matches = xml.match(/<loc>[^<]*\/blog\/[^<]+<\/loc>/g) || [];
    return matches.length;
  } catch {
    return null;
  }
}

const posts = new Map();
let offset = 0;
let pageNum = 1;

while (true) {
  console.log(`Page ${pageNum}, offset=${offset}…`);
  const json = await fetchPage(offset);
  const items = json.items || [];
  if (items.length === 0) break;
  for (const item of items) {
    if (!posts.has(item.id)) posts.set(item.id, item);
  }
  // Squarespace offset = publishOn (ms) of the LAST item on the page
  const last = items[items.length - 1];
  const nextOffset = last.publishOn;
  if (nextOffset === offset) break; // Defensive: avoid infinite loop
  offset = nextOffset;
  pageNum++;
  if (pageNum > 100) throw new Error('Too many pages — sanity check');
  await new Promise((r) => setTimeout(r, SLEEP_MS));
}

const arr = [...posts.values()].sort((a, b) => b.publishOn - a.publishOn);
fs.writeFileSync('posts.json', JSON.stringify(arr, null, 2));

console.log(`\nCrawled ${arr.length} posts → posts.json`);

// Verification: cross-check against sitemap
const sitemapCount = await fetchSitemapBlogCount();
if (sitemapCount !== null) {
  console.log(`Sitemap blog count: ${sitemapCount}`);
  if (sitemapCount !== arr.length) {
    console.error(`MISMATCH: crawler=${arr.length} sitemap=${sitemapCount}`);
    console.error('Manual verification required: click "Older Posts" on live site to last page.');
    process.exit(1);
  }
  console.log('✓ Crawled count matches sitemap.');
}

console.log('\nNext: extract.mjs (HTML→markdown), download images, generate blog-posts.ts');
console.log('See ~/.agentskills/15-site-generation/build-prompts.md → "Full Blog Archive Crawl"');
