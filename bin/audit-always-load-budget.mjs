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
const BUDGET = 38_000; // priority:1 (tier-1) set — headroom under the router's ~40K budget

// Full always-ELIGIBLE set = priority:1 + every rule with `paths: ["*"]` (match-all).
// Both load on EVERY prompt at the 150K router budget, so both are the per-turn tax.
// RATCHET: set just above the current compressed total; lower it as the compression
// arc shrinks files further. It may only go DOWN — this is what stops the every-prompt
// load drifting back toward 150K (the Jun-21 user directive). Per [[instruction-compression-playbook]].
const ELIGIBLE_BUDGET = 72_000;
const JSON_OUT = process.argv.includes('--json');
const CI = process.argv.includes('--ci');

function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? null : text.slice(3, end);
}

/** True when a frontmatter `paths:` block contains a bare `*` (match-all → always eligible). */
function hasStarPath(fm) {
  return /paths:\s*(?:\n\s*-\s*["']?\*["']?|\[\s*["']?\*)/.test(fm);
}

function collect(predicate) {
  const out = [];
  const add = (rel) => {
    const fm = frontmatter(readFileSync(join(ROOT, rel), 'utf8'));
    if (fm && predicate(fm)) out.push({ file: rel, tokens: Math.ceil(statSync(join(ROOT, rel)).size / 4) });
  };
  for (const f of readdirSync(join(ROOT, 'rules'))) if (f.endsWith('.md')) add(`rules/${f}`);
  for (const d of readdirSync(ROOT)) {
    if (/^\d\d-/.test(d)) {
      try { statSync(join(ROOT, d, 'SKILL.md')); add(`${d}/SKILL.md`); } catch { /* no SKILL.md */ }
    }
  }
  return out.sort((a, b) => b.tokens - a.tokens);
}

const tier1 = collect((fm) => /^priority:\s*1\b/m.test(fm));
const eligible = collect((fm) => /^priority:\s*1\b/m.test(fm) || hasStarPath(fm));
const tier1Total = tier1.reduce((s, f) => s + f.tokens, 0);
const eligTotal = eligible.reduce((s, f) => s + f.tokens, 0);
const tier1Over = tier1Total > BUDGET;
const eligOver = eligTotal > ELIGIBLE_BUDGET;
const over = tier1Over || eligOver;

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({
    tier1: { rules: tier1.length, tokens: tier1Total, budget: BUDGET, over: tier1Over },
    eligible: { rules: eligible.length, tokens: eligTotal, budget: ELIGIBLE_BUDGET, over: eligOver },
    heaviest: eligible.slice(0, 8),
  }, null, 2) + '\n');
} else {
  console.log(`=== always-load budget (loads on EVERY prompt) ===`);
  console.log(`  tier-1 (priority:1):  ${tier1.length} rules · ~${tier1Total} tok · budget ${BUDGET} · ${tier1Over ? '✗ OVER' : '✓ under'}`);
  console.log(`  eligible (+paths:*):  ${eligible.length} rules · ~${eligTotal} tok · budget ${ELIGIBLE_BUDGET} · ${eligOver ? '✗ OVER' : '✓ under'}`);
  if (over) {
    console.log('  FIX: compress the heaviest (per [[instruction-compression-playbook]]) or scope a domain/log rule off paths:["*"]. Heaviest always-eligible:');
    for (const f of eligible.slice(0, 8)) console.log(`    ${String(f.tokens).padStart(5)}  ${f.file}`);
  }
}
process.exit(CI && over ? 1 : 0);
