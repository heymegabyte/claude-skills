#!/usr/bin/env node
// validate-assets.mjs — build gate for projectsites.dev sites
// Verifies: 9 mandatory files present, every <img>/<link>/<script>/<source>/<video> ref resolves
// Usage: node validate-assets.mjs <dist-dir>
// Exit 0 = pass, exit 1 = fail (build break).

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';

const DIST = resolve(process.argv[2] || 'dist');
if (!existsSync(DIST)) {
  console.error(`[validate-assets] dist dir not found: ${DIST}`);
  process.exit(1);
}

const MANDATORY_FILES = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'safari-pinned-tab.svg',
  'site.webmanifest',
  'browserconfig.xml',
  'robots.txt',
  'sitemap.xml',
  'humans.txt',
  'og-image.png',
];

const EXTERNAL_HOST_ALLOWLIST = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'googletagmanager.com',
  'www.google-analytics.com',
  'www.googletagmanager.com',
  'analytics.google.com',
  'region1.google-analytics.com',
  'us-assets.i.posthog.com',
  'us.i.posthog.com',
  'app.posthog.com',
  'browser.sentry-cdn.com',
  'www.google.com',
  'maps.googleapis.com',
  'www.googleadservices.com',
  'connect.facebook.net',
  'static.cloudflareinsights.com',
  'challenges.cloudflare.com',
  'microlink.io',
  'res.cloudinary.com',
  'images.pexels.com',
  'videos.pexels.com',
  'images.unsplash.com',
  'cdn.shopify.com',
];

function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => entry.toLowerCase().endsWith(e))) out.push(p);
  }
  return out;
}

const failures = [];
const warnings = [];

// Gate 1 — mandatory files exist at root of dist
for (const f of MANDATORY_FILES) {
  if (!existsSync(join(DIST, f)) && !existsSync(join(DIST, '.well-known', f))) {
    failures.push(`MISSING mandatory file: ${f}`);
  }
}
// security.txt special-cases the .well-known location
if (!existsSync(join(DIST, '.well-known', 'security.txt'))) {
  failures.push('MISSING mandatory file: .well-known/security.txt');
}

// Gate 2 — every reference in HTML/CSS resolves
const htmlFiles = walk(DIST, ['.html']);
const cssFiles = walk(DIST, ['.css']);

const refRegexes = [
  // HTML attribute refs
  /<(?:img|source|video|audio|track|iframe|embed|input|script|link)[^>]+(?:src|href|srcset|poster|action|data)\s*=\s*["']([^"']+)["']/gi,
  /<meta[^>]+content\s*=\s*["'](https?:\/\/[^"']+\.(?:png|jpg|jpeg|webp|avif|svg|ico|gif|mp4|webm|woff2|json))["']/gi,
  // CSS url() refs
  /url\(\s*["']?([^)"']+)["']?\s*\)/gi,
];

const checked = new Set();
function checkRef(rawSrc, fromFile) {
  if (!rawSrc) return;
  // Strip srcset descriptors (e.g. "img.jpg 2x" or "img.jpg 800w")
  const candidates = rawSrc.includes(',')
    ? rawSrc.split(',').map((p) => p.trim().split(/\s+/)[0])
    : [rawSrc.split(/\s+/)[0]];
  for (const src of candidates) {
    if (!src) continue;
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('mailto:') || src.startsWith('tel:') || src.startsWith('javascript:')) continue;
    if (src.startsWith('#') || src === '/') continue;
    const key = `${fromFile}|${src}`;
    if (checked.has(key)) continue;
    checked.add(key);

    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const host = new URL(src).hostname;
        if (!EXTERNAL_HOST_ALLOWLIST.some((h) => host === h || host.endsWith('.' + h))) {
          warnings.push(`UNKNOWN external host (${host}) in ${relative(DIST, fromFile)}: ${src}`);
        }
      } catch {
        failures.push(`INVALID url in ${relative(DIST, fromFile)}: ${src}`);
      }
      continue;
    }

    // Local path
    let local = src.split('?')[0].split('#')[0];
    if (local.startsWith('//')) continue; // protocol-relative external
    const abs = local.startsWith('/')
      ? join(DIST, local)
      : resolve(dirname(fromFile), local);
    if (!existsSync(abs)) {
      failures.push(`BROKEN ref in ${relative(DIST, fromFile)}: ${src} → ${relative(DIST, abs)}`);
    }
  }
}

for (const file of [...htmlFiles, ...cssFiles]) {
  const content = readFileSync(file, 'utf8');
  for (const regex of refRegexes) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(content)) !== null) {
      checkRef(m[1], file);
    }
  }
}

// Report
if (warnings.length) {
  console.warn(`\n[validate-assets] ${warnings.length} warnings:`);
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}
if (failures.length) {
  console.error(`\n[validate-assets] ${failures.length} failures:`);
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  console.error(`\n[validate-assets] BUILD GATE FAILED`);
  process.exit(1);
}
console.log(`[validate-assets] ✓ ${htmlFiles.length} HTML + ${cssFiles.length} CSS files, ${checked.size} refs, all resolve.`);
console.log(`[validate-assets] ✓ all ${MANDATORY_FILES.length + 1} mandatory files present.`);
