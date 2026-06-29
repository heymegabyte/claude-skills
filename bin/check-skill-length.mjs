#!/usr/bin/env node
// check-skill-length.mjs — advisory line-budget audit for skills.
//
// Locks in compression: a SKILL.md is a lean table of contents (depth lives one
// level deep in sibling refs). This flags SKILL.md / supporting docs that drift
// back over budget. Standalone tool (like audit-instruction-files.mjs), NOT yet a
// blocking lint-all gate — promote to an info section after it runs clean a while.
//
// Usage:
//   node bin/check-skill-length.mjs           # human-readable
//   node bin/check-skill-length.mjs --json     # { meta, violations[], summary }
//   node bin/check-skill-length.mjs --ci       # exit 1 on any violation
//
// Budgets (lines): SKILL.md ≤ 250 (lean TOC), supporting *.md ≤ 350.
// Override per-file with an inline `<!-- length-ok -->` marker (intentional length).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SKILL_BUDGET = 250;
const SUPPORT_BUDGET = 350;
const OK_MARKER = 'length-ok';

const args = new Set(process.argv.slice(2));
const json = args.has('--json');
const ci = args.has('--ci');

/** Recursively collect *.md files under a dir. */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const skillDirs = readdirSync(ROOT)
  .filter((n) => /^\d{2}-/.test(n))
  .map((n) => join(ROOT, n))
  .filter((p) => statSync(p).isDirectory());

const violations = [];
for (const dir of skillDirs) {
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8');
    if (text.includes(OK_MARKER)) continue;
    const lines = text.split('\n').length;
    const isSkill = basename(file) === 'SKILL.md';
    const budget = isSkill ? SKILL_BUDGET : SUPPORT_BUDGET;
    if (lines > budget) {
      violations.push({ file: file.replace(ROOT, ''), lines, budget, kind: isSkill ? 'SKILL.md' : 'support' });
    }
  }
}

violations.sort((a, b) => b.lines - a.lines);

if (json) {
  console.log(JSON.stringify({ meta: { skillBudget: SKILL_BUDGET, supportBudget: SUPPORT_BUDGET }, violations, summary: { count: violations.length, exit: ci && violations.length ? 1 : 0 } }, null, 2));
} else if (violations.length === 0) {
  console.log('✓ all skill docs within line budget');
} else {
  console.log(`Skill line-budget — ${violations.length} over budget:\n`);
  for (const v of violations) {
    console.log(`  ${v.lines} > ${v.budget}  ${v.kind.padEnd(8)} ${v.file}`);
  }
  console.log('\n  Fix: split depth into a sibling ref (progressive disclosure), or add <!-- length-ok --> if intentional.');
}

process.exit(ci && violations.length ? 1 : 0);
