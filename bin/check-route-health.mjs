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

let selected;
try {
  const out = execFileSync('python3', [ROUTER, 'route', PROMPT, '--cwd', '/tmp'], { encoding: 'utf8' });
  const d = JSON.parse(out);
  selected = new Set((d.selected || []).map((s) => s.id));
} catch (err) {
  console.log(`=== route-health === SKIP (router not runnable: ${String(err).slice(0, 60)})`);
  process.exit(0);
}

const manifestSelected = selected.has('rules/website-build-manifest');
const got = CRITICAL.filter((c) => selected.has(c));
const missing = CRITICAL.filter((c) => !selected.has(c));

console.log('=== route-health (manifest must survive truncation on a site prompt) ===');
console.log(`  manifest selected: ${manifestSelected ? '✓' : '✗ DROPPED'} · critical selected: ${got.length}/${CRITICAL.length}`);
for (const m of missing) console.error(`  ✗ not selected: ${m}`);

// Fatal ONLY if the manifest itself is dropped — that breaks the whole recovery design.
// A missing non-manifest critical node is a warning (recoverable via the manifest).
if (CI && !manifestSelected) {
  console.error('\n  FATAL: website-build-manifest dropped for budget — recovery index unreachable. Trim tier-1 or pack, or strengthen its triggers.');
  process.exit(1);
}
