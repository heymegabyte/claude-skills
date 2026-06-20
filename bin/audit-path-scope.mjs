#!/usr/bin/env node
/**
 * audit-path-scope.mjs — flag rules that are over-scoped for fleet routing:
 * specific `triggers:` but `paths: ["*"]` (eligible for EVERY prompt). Narrowing
 * their paths to concern/dir globs sharpens the router under Emdash fleet load.
 * Advisory (idea: context economy). Never gates.
 *
 * @example
 * node bin/audit-path-scope.mjs          // report
 * node bin/audit-path-scope.mjs --json
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES = join(dirname(fileURLToPath(import.meta.url)), '..', 'rules');
const JSON_OUT = process.argv.includes('--json');

function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? null : text.slice(3, end);
}

const findings = [];
let universal = 0;
for (const f of readdirSync(RULES).filter(x => x.endsWith('.md'))) {
  const fm = frontmatter(readFileSync(join(RULES, f), 'utf8'));
  if (!fm) continue;
  const starPath = /paths:\s*[\s\S]*?-\s*"\*"/.test(fm) || /paths:\s*\[\s*"\*"\s*\]/.test(fm);
  if (!starPath) continue;
  universal++;
  // count triggers + read pack: core-pack rules are GENUINELY universal (apply to
  // all work) — `["*"]` is correct for them. Only a DOMAIN-packed rule claiming
  // universal paths is a true over-scope candidate (per validator-precision-discipline).
  const pack = (fm.match(/pack:\s*"?([a-z-]+)"?/) || [])[1] || 'unknown';
  const tBlock = fm.match(/triggers:\s*([\s\S]*?)(?:\npaths:|\n[a-z_]+:|$)/);
  const triggers = tBlock ? (tBlock[1].match(/-\s*\S/g) || []).length : 0;
  if (triggers >= 2 && pack !== 'core') {
    findings.push({ file: `rules/${f}`, pack, triggers, kind: 'over-scoped-path', confidence: 'MEDIUM' });
  }
}
findings.sort((a, b) => b.triggers - a.triggers);

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ summary: { universalRules: universal, overScoped: findings.length }, findings }, null, 2) + '\n');
} else {
  console.log(`=== path-scope audit (advisory) ===`);
  console.log(`${universal} rules are paths:["*"] (eligible every prompt); ${findings.length} have specific triggers → narrowing paths sharpens fleet routing:`);
  for (const x of findings) console.log(`  ${x.file.padEnd(52)} ${x.triggers} triggers`);
}
process.exit(0);
