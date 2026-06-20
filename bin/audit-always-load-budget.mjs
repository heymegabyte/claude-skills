#!/usr/bin/env node
/**
 * audit-always-load-budget.mjs — enforce the priority:1 always-load token budget.
 *
 * The skill-router loads every `priority: 1` rule on EVERY prompt (the only
 * always-load tier — core pack is not auto-expanded). If that set outgrows the
 * ~40K router budget, it crowds out the rules a prompt actually needs and every
 * turn pays the tax. The Jun-2026 arc cut it from 34 rules/59K → 21/31.5K by
 * downgrading domain/SRE rules to priority:2 (they load via triggers when
 * relevant). This guard prevents regression: a new priority:1 rule that pushes
 * the set over budget fails CI — forcing a conscious "is this truly every-prompt?".
 *
 * @example
 * node bin/audit-always-load-budget.mjs        // report
 * node bin/audit-always-load-budget.mjs --ci   // exit 1 if over BUDGET
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET = 38_000; // headroom under the router's ~40K context budget
const JSON_OUT = process.argv.includes('--json');
const CI = process.argv.includes('--ci');

function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? null : text.slice(3, end);
}

function alwaysLoadFiles() {
  const out = [];
  const add = (rel) => {
    const fm = frontmatter(readFileSync(join(ROOT, rel), 'utf8'));
    if (fm && /^priority:\s*1\b/m.test(fm)) out.push({ file: rel, tokens: Math.ceil(statSync(join(ROOT, rel)).size / 4) });
  };
  for (const f of readdirSync(join(ROOT, 'rules'))) if (f.endsWith('.md')) add(`rules/${f}`);
  for (const d of readdirSync(ROOT)) {
    if (/^\d\d-/.test(d)) {
      try { statSync(join(ROOT, d, 'SKILL.md')); add(`${d}/SKILL.md`); } catch { /* no SKILL.md */ }
    }
  }
  return out.sort((a, b) => b.tokens - a.tokens);
}

const files = alwaysLoadFiles();
const total = files.reduce((s, f) => s + f.tokens, 0);
const over = total > BUDGET;

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ summary: { rules: files.length, tokens: total, budget: BUDGET, over }, heaviest: files.slice(0, 8) }, null, 2) + '\n');
} else {
  console.log(`=== always-load budget (priority:1 = every prompt) ===`);
  console.log(`  ${files.length} rules · ~${total} tokens · budget ${BUDGET} · ${over ? '✗ OVER' : '✓ under'}`);
  if (over) {
    console.log('  Trim by downgrading a domain rule to priority:2 (it keeps loading via triggers). Heaviest:');
    for (const f of files.slice(0, 6)) console.log(`    ${String(f.tokens).padStart(5)}  ${f.file}`);
  }
}
process.exit(CI && over ? 1 : 0);
