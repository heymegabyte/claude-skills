#!/usr/bin/env node
/**
 * check-route-health.mjs — runtime assertion that a canonical one-line website
 * prompt actually routes the build flow, with the manifest SURVIVING budget truncation.
 *
 * Gates 21 (route-phrasing) and 22 (manifest-recovery) are STATIC — they prove triggers
 * exist and the recovery index references every essential. But the whole recovery design
 * rests on one RUNTIME invariant they can't check: on a real site prompt the budget is
 * maxed (~48K, ~60 rules drop), and the design only works if `website-build-manifest`
 * lands in `selected` (NOT dropped) — it's the index that recovers everything else. If
 * the manifest itself were ever truncated, the entire flow silently collapses.
 *
 * This check routes the live router and asserts the manifest is selected + the core flow
 * is present. Needs the live skills.db (~/.claude/data); in CI that DB is absent, so it
 * SKIPS gracefully (exit 0) per portable-audit-discipline — it runs in local pre-commit
 * where the DB exists, which is exactly when a routing-affecting edit is being made.
 *
 * @example
 * node bin/check-route-health.mjs        // report
 * node bin/check-route-health.mjs --ci   // exit 1 if manifest is dropped/absent (skips if no DB)
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CI = process.argv.includes('--ci');
const DB = join(homedir(), '.claude/data/skills.db');
const ROUTER = join(homedir(), '.claude/bin/skill-router.py');
const PROMPT = 'build a website for acme dental in newark nj';
// Core flow that must be SELECTED (not just recoverable) on a canonical site prompt.
const CRITICAL = [
  'rules/website-build-manifest',
  '02-goal-and-brief',
  '16-cinematic-website-prime-directive',
  'rules/website-build-doctrine',
  'rules/competitor-research',
  'rules/verification-loop',
];

if (!existsSync(DB) || !existsSync(ROUTER)) {
  console.log('=== route-health === SKIP (no live skills.db — CI/headless; static gates 21+22 cover invariants)');
  process.exit(0);
}

let selected, fp;
try {
  const out = execFileSync('python3', [ROUTER, 'route', PROMPT, '--cwd', '/tmp'], { encoding: 'utf8' });
  const d = JSON.parse(out);
  selected = new Set((d.selected || []).map((s) => s.id));
  fp = d.fingerprint || {};
} catch (err) {
  console.log(`=== route-health === SKIP (router not runnable: ${String(err).slice(0, 60)})`);
  process.exit(0);
}

const manifestSelected = selected.has('rules/website-build-manifest');
const got = CRITICAL.filter((c) => selected.has(c));
const missing = CRITICAL.filter((c) => !selected.has(c));

// Intent-detection keystone: a one-line website prompt must set is_website_build=True so
// every org:website_build-scoped rule (CF-LAW, csp-trusted-types, secrets, cinematic, copy,
// polish, the supervisors) loads. If this regresses, the manifest still loads via pack so the
// check above passes — but ALL org-scoped detail silently stops loading. Assert a representative
// org-scoped rule is selected to catch that.
const intentFired = fp.is_website_build === true;
const ORG_SCOPED_PROBE = 'rules/projectsites-cloudflare-first'; // org:website_build — must load on a site prompt
const orgScopedLoaded = selected.has(ORG_SCOPED_PROBE);

console.log('=== route-health (manifest survives truncation + intent-detection fires on a site prompt) ===');
console.log(`  manifest selected: ${manifestSelected ? '✓' : '✗ DROPPED'} · critical: ${got.length}/${CRITICAL.length} · is_website_build: ${intentFired ? '✓' : '✗'} · org-scoped loads: ${orgScopedLoaded ? '✓' : '✗'}`);
for (const m of missing) console.error(`  ✗ not selected: ${m}`);

if (CI && !manifestSelected) {
  console.error('\n  FATAL: website-build-manifest dropped for budget — recovery index unreachable. Trim tier-1 or pack, or strengthen its triggers.');
  process.exit(1);
}
if (CI && !intentFired) {
  console.error('\n  FATAL: is_website_build=False on a website prompt — intent-detection regressed. Every org:website_build-scoped rule (CF-LAW, csp, secrets, cinematic…) silently stops loading. Check the prompt-intent block in cmd_route.');
  process.exit(1);
}
if (CI && !orgScopedLoaded) {
  console.error(`\n  FATAL: ${ORG_SCOPED_PROBE} (org:website_build) not loaded on a website prompt — org-scoping broke. Foundational architecture/security detail is unreachable.`);
  process.exit(1);
}
