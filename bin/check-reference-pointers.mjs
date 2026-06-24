#!/usr/bin/env node
/**
 * check-reference-pointers.mjs — integrity gate for the dynamic-sourcing arc.
 *
 * The compression arc moved implementation detail out of ~32 rules into
 * router-invisible `reference/*.md`, leaving a plain-path pointer (`See
 * `reference/<basename>.md``) in each rule. Those pointers are NOT `[[crosslinks]]`,
 * so the crosslinks gate (16) does not validate them — a rename/typo would
 * silently leave a rule pointing at a dead file, and the AI would follow it to
 * nothing. This gate closes that hole.
 *
 * FATAL (exit 1 with --ci): a `reference/<file>.md` pointer whose target is missing.
 * WARN (non-fatal): an orphan reference/*.md that no rule/skill points to (dead weight).
 *
 * Placeholders in doctrine text (containing `<`/`>`, or the literal `reference/x.md`
 * example) are skipped.
 *
 * @example
 * node bin/check-reference-pointers.mjs          // report
 * node bin/check-reference-pointers.mjs --ci     // exit 1 on any broken pointer
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CI = process.argv.includes('--ci');
const POINTER = /reference\/([A-Za-z0-9._-]+\.md)/g; // excludes `<...>` placeholders by charclass

function sourceFiles() {
  const out = [];
  for (const f of readdirSync(join(ROOT, 'rules'))) if (f.endsWith('.md')) out.push(`rules/${f}`);
  for (const d of readdirSync(ROOT)) {
    if (/^\d\d-/.test(d) && existsSync(join(ROOT, d, 'SKILL.md'))) out.push(`${d}/SKILL.md`);
  }
  return out;
}

const broken = [];
const pointed = new Set();
let total = 0;

for (const rel of sourceFiles()) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  for (const m of src.matchAll(POINTER)) {
    const target = m[1];
    if (target === 'x.md') continue; // doctrine placeholder
    total++;
    pointed.add(target);
    if (!existsSync(join(ROOT, 'reference', target))) broken.push({ rel, target });
  }
}

const refFiles = existsSync(join(ROOT, 'reference'))
  ? readdirSync(join(ROOT, 'reference')).filter((f) => f.endsWith('.md') && f !== 'README.md')
  : [];
const orphans = refFiles.filter((f) => !pointed.has(f));

console.log('=== reference/ pointer integrity (dynamic-sourcing arc) ===');
console.log(`  ${total} pointers · ${pointed.size} unique targets · ${refFiles.length} reference files · ${broken.length} broken · ${orphans.length} orphan`);
for (const b of broken) console.error(`  ✗ BROKEN: ${b.rel} → reference/${b.target} (missing)`);
for (const o of orphans) console.warn(`  ⚠ orphan: reference/${o} (no rule points to it)`);

if (broken.length) {
  console.error('\n  FATAL: a rule points to a reference/ file that does not exist. Restore the file or fix the pointer.');
  if (CI) process.exit(1);
}
process.exit(0);
