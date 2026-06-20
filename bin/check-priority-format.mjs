#!/usr/bin/env node
/**
 * check-priority-format.mjs — fail if any rule/SKILL frontmatter declares a
 * non-numeric `priority:` value.
 *
 * THE ROOT CAUSE of the Jun-2026 routing arc: six rules carried `priority: high`
 * (a string). `cmd_rebuild_index()` did `int(fm.get("priority"))`, which threw
 * `ValueError: invalid literal for int() with base 10: 'high'` — so the rebuild
 * crashed and skills.db silently stayed STALE for the entire arc. Every priority,
 * pack, and path change was invisible to the live router because the DB never
 * rebuilt. One bad string broke one-prompt website routing for days.
 *
 * The router was hardened (`_parse_priority` no longer crashes), but a string
 * priority still routes wrong (maps to the default tier, never tier-1). This gate
 * makes the malformed value impossible to commit: priority MUST be a positive
 * integer. 1 = always-load (tier-1), 2 = trigger/path load, 3 = explicit only,
 * 4+ = deep-archive (loads only on a direct name/path hit). Any non-numeric value
 * (`high`, `medium`, `low`) is the crash class this gate exists to block.
 *
 * @example
 * node bin/check-priority-format.mjs        // report all priorities
 * node bin/check-priority-format.mjs --ci   // exit 1 on any non-numeric priority
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');
const CI = process.argv.includes('--ci');
// Valid = any positive integer. The crash class is a NON-numeric value (`high`),
// not a high tier — 4/5 are intentional deep-archive priorities.
const isValid = (raw) => {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1;
};

function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? null : text.slice(3, end);
}

function priorityFiles() {
  const out = [];
  const add = (rel) => {
    const fm = frontmatter(readFileSync(join(ROOT, rel), 'utf8'));
    if (!fm) return;
    // Match the FIRST top-level `priority:` key (ignore indented examples in body-less fm).
    const m = fm.match(/^priority:\s*(.+?)\s*$/m);
    if (m) out.push({ file: rel, raw: m[1] });
  };
  for (const f of readdirSync(join(ROOT, 'rules'))) if (f.endsWith('.md')) add(`rules/${f}`);
  for (const d of readdirSync(ROOT)) {
    if (/^\d\d-/.test(d)) {
      try { statSync(join(ROOT, d, 'SKILL.md')); add(`${d}/SKILL.md`); } catch { /* none */ }
    }
  }
  return out;
}

const files = priorityFiles();
const bad = files.filter((f) => !isValid(f.raw));

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ summary: { checked: files.length, bad: bad.length }, violations: bad }, null, 2) + '\n');
} else {
  console.log('=== priority-format (must be a positive integer, never a string) ===');
  console.log(`  ${files.length} files with priority · ${bad.length === 0 ? '✓ all numeric' : `✗ ${bad.length} non-numeric`}`);
  for (const b of bad) console.error(`  ✗ ${b.file}: priority: ${b.raw}  (must be a positive integer)`);
  if (bad.length) console.error('\n  Non-numeric priority crashes rebuild-index → skills.db goes stale → routing rots silently.');
}

if (CI && bad.length) process.exit(1);
