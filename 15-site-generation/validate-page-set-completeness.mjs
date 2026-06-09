#!/usr/bin/env node
/**
 * validate-page-set-completeness.mjs — union(source, standard, jewels, locales) − cruft gate
 *
 * Purpose: enforce rules/source-site-enhancement.md HARD_GATE_PAGE_COUNT — every rebuild
 * deploys `keep + STANDARD_SET[org_type] + JEWELS[org_type] + locale_count × (keep+standard+jewels)`
 * routes minimum. Floors per 15/page-set-expansion.md: nonprofit 14+10, saas 10+8, local 12+8,
 * portfolio 5+6, church 10+6, gov 12+5, edu 12+6, healthcare 12+6, legal 10+6. English stays
 * unprefixed at `/`; non-English locales mirror at `/{locale}/*`.
 *
 * When: runs post-deploy in `strict` mode after every rebuild/optimize/enhance prompt. Pairs
 * with validate-locale-mirror.mjs (hreflang) + validate-jewel-content-authority.mjs (jewel
 * body authority) + validate-cruft-301.mjs (301-coverage for dead/dupe URLs).
 *
 * Reads (from build dir, default `./`):
 *   _url_inventory.json — Agent-A crawler output: [{url, classification: keep|merge|301|drop}]
 *   _research.json      — Agent-A/E research output: {category, source_url, ...}
 *   _locales.json       — Agent-B demographics output: {locales: ["en","es","pt"], hreflang_pairs}
 *   _org_type.json      — Agent-C infer output: {org_type: "nonprofit"|...}
 *
 * Writes: _route_inventory_gap.json — {expected_routes[], deployed_routes[], missing[],
 *   cruft_still_serving[], pass_fail, summary{expected_count, deployed_count, missing_count,
 *   cruft_count, floor, org_type, locale_count}}
 *
 * Discovery of deployed routes:
 *   1. --deployed-url <url> → fetch `<url>/sitemap.xml` with REAL_UA per rules/fetch-defaults.md
 *   2. else → walk `dist/index.html` + linked HTML for `<a href>` graph + `dist/sitemap.xml`
 *
 * Exit codes: 0 = pass, 1 = fail (missing routes OR cruft serving 200), 2 = config error.
 *
 * Usage:
 *   node validate-page-set-completeness.mjs [--dir ./] [--deployed-url https://x.workers.dev]
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { REAL_UA_DESKTOP, REAL_HEADERS } from './_real-ua.mjs';

const REAL_UA = REAL_UA_DESKTOP;
const FETCH_HEADERS = REAL_HEADERS;

const ORG_FLOORS = {
  nonprofit: { standard: 14, jewels: 10 },
  saas: { standard: 10, jewels: 8 },
  local: { standard: 12, jewels: 8 },
  portfolio: { standard: 5, jewels: 6 },
  church: { standard: 10, jewels: 6 },
  gov: { standard: 12, jewels: 5 },
  edu: { standard: 12, jewels: 6 },
  healthcare: { standard: 12, jewels: 6 },
  legal: { standard: 10, jewels: 6 },
};

const CRUFT_RE = /\/home$|\/testpage$|\/new-page-\d+$|\/-1$|\/-2$|\/page-\d+$|\/blog-\d+$|.+-(copy|backup|old|draft|test|tmp)(-\d+)?$|\/[a-f0-9]{20,}$|\/blog\/\d{4}\/\d{1,2}\/\d{1,2}\/[a-f0-9]{20,}$/;

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const BUILD = resolve(flag('--dir') || '.');
const DEPLOYED_URL = flag('--deployed-url')?.replace(/\/$/, '') || null;

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (err) { console.error(`[validate-page-set-completeness] unparsable ${path}: ${err.message}`); process.exit(2); }
}

const urlInventory = readJson(join(BUILD, '_url_inventory.json'), null);
const research = readJson(join(BUILD, '_research.json'), {});
const locales = readJson(join(BUILD, '_locales.json'), { locales: ['en'] });
const orgTypeData = readJson(join(BUILD, '_org_type.json'), { org_type: research.category || 'local' });

if (!urlInventory) { console.error('[validate-page-set-completeness] _url_inventory.json missing — Agent-A crawler must run first'); process.exit(2); }

const orgType = (orgTypeData.org_type || 'local').toLowerCase();
const floor = ORG_FLOORS[orgType] || ORG_FLOORS.local;
const localeList = Array.isArray(locales.locales) && locales.locales.length ? locales.locales : ['en'];

const keepUrls = urlInventory.filter((r) => r.classification === 'keep').map((r) => r.url.replace(/^https?:\/\/[^/]+/, '') || '/');
const keepCount = keepUrls.length;
const perLocale = keepCount + floor.standard + floor.jewels;
const localeCount = localeList.length;
const expectedTotal = perLocale + (localeCount - 1) * perLocale;

const expectedRoutes = new Set();
const englishRoutes = new Set(keepUrls);
for (let i = 0; i < floor.standard; i++) englishRoutes.add(`__standard_${i}__`);
for (let i = 0; i < floor.jewels; i++) englishRoutes.add(`__jewel_${i}__`);
for (const r of englishRoutes) expectedRoutes.add(r);
for (const loc of localeList) {
  if (loc === 'en') continue;
  for (const r of englishRoutes) expectedRoutes.add(r.startsWith('__') ? `${loc}:${r}` : `/${loc}${r === '/' ? '' : r}`);
}

async function fetchDeployedRoutes(baseUrl) {
  const out = new Set();
  try {
    const sm = await fetch(`${baseUrl}/sitemap.xml`, { headers: FETCH_HEADERS });
    if (sm.ok) {
      const xml = await sm.text();
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const u = m[1].replace(baseUrl, '').replace(/^https?:\/\/[^/]+/, '') || '/';
        out.add(u);
      }
    }
  } catch (err) { console.warn(`[validate-page-set-completeness] sitemap fetch failed: ${err.message}`); }
  return out;
}

function walkDistHtml(dir) {
  const out = new Set();
  if (!existsSync(dir)) return out;
  function recur(d, prefix) {
    for (const e of readdirSync(d)) {
      if (e === 'node_modules' || e.startsWith('.')) continue;
      const p = join(d, e);
      const st = statSync(p);
      if (st.isDirectory()) recur(p, `${prefix}/${e}`);
      else if (e === 'index.html') out.add(prefix || '/');
      else if (e.endsWith('.html')) out.add(`${prefix}/${e.replace(/\.html$/, '')}`);
    }
  }
  recur(dir, '');
  const smPath = join(dir, 'sitemap.xml');
  if (existsSync(smPath)) {
    const xml = readFileSync(smPath, 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const u = m[1].replace(/^https?:\/\/[^/]+/, '') || '/';
      out.add(u);
    }
  }
  return out;
}

const deployedRoutes = DEPLOYED_URL ? await fetchDeployedRoutes(DEPLOYED_URL) : walkDistHtml(join(BUILD, 'dist'));

const missing = [];
for (const u of keepUrls) if (!deployedRoutes.has(u)) missing.push(u);
const deployedCount = deployedRoutes.size;
const standardGap = Math.max(0, floor.standard - Math.max(0, deployedCount - keepCount));
const jewelGap = Math.max(0, floor.jewels - Math.max(0, deployedCount - keepCount - floor.standard));
if (standardGap > 0) missing.push(`__${standardGap}_standard_pages_missing_for_${orgType}__`);
if (jewelGap > 0) missing.push(`__${jewelGap}_jewel_pages_missing_for_${orgType}__`);

const perLocaleDeployed = {};
for (const loc of localeList) {
  if (loc === 'en') continue;
  const prefix = `/${loc}`;
  const mirrorRoutes = [...deployedRoutes].filter((r) => r === prefix || r.startsWith(`${prefix}/`));
  perLocaleDeployed[loc] = mirrorRoutes.length;
  if (mirrorRoutes.length < perLocale) missing.push(`__locale_${loc}_mirror_incomplete_${mirrorRoutes.length}_of_${perLocale}__`);
}

const cruftStillServing = [];
const cruftUrls = urlInventory.filter((r) => CRUFT_RE.test(r.url) || r.classification === '301').map((r) => r.url.replace(/^https?:\/\/[^/]+/, '') || '/');
if (DEPLOYED_URL) {
  for (const c of cruftUrls) {
    try {
      const res = await fetch(`${DEPLOYED_URL}${c}`, { headers: FETCH_HEADERS, redirect: 'manual' });
      if (res.status === 200) cruftStillServing.push(c);
    } catch { /* network failure = treat as not-serving */ }
  }
} else {
  for (const c of cruftUrls) if (deployedRoutes.has(c)) cruftStillServing.push(c);
}

const pass = missing.length === 0 && cruftStillServing.length === 0 && deployedCount >= expectedTotal;
const gap = {
  expected_routes: [...expectedRoutes],
  deployed_routes: [...deployedRoutes],
  missing,
  cruft_still_serving: cruftStillServing,
  pass_fail: pass ? 'pass' : 'fail',
  summary: { expected_count: expectedTotal, deployed_count: deployedCount, missing_count: missing.length, cruft_count: cruftStillServing.length, floor, org_type: orgType, locale_count: localeCount, locales: localeList, per_locale_deployed: perLocaleDeployed, keep_count: keepCount },
};
writeFileSync(join(BUILD, '_route_inventory_gap.json'), JSON.stringify(gap, null, 2));

if (!pass) {
  console.error(`\n[validate-page-set-completeness] BUILD GATE FAILED — ${orgType} site needs ≥${expectedTotal} routes (keep ${keepCount} + standard ${floor.standard} + jewels ${floor.jewels} × ${localeCount} locales), deployed ${deployedCount}.`);
  if (missing.length) { console.error(`  ✗ ${missing.length} missing routes:`); missing.slice(0, 20).forEach((m) => console.error(`    - ${m}`)); if (missing.length > 20) console.error(`    ...+${missing.length - 20} more (see _route_inventory_gap.json)`); }
  if (cruftStillServing.length) { console.error(`  ✗ ${cruftStillServing.length} cruft URLs still serving 200 (must 301):`); cruftStillServing.slice(0, 10).forEach((c) => console.error(`    - ${c}`)); }
  console.error('\n  → see rules/source-site-enhancement.md HARD_GATE_PAGE_COUNT + 15/page-set-expansion.md');
  process.exit(1);
}
console.log(`[validate-page-set-completeness] ✓ ${orgType} | keep=${keepCount} | std=${floor.standard} | jewels=${floor.jewels} | locales=${localeCount} (${localeList.join('|')}) | expected=${expectedTotal} | deployed=${deployedCount}.`);
process.exit(0);
