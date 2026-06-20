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
  // ACTIONABLE only if the rule maps to a concern the router actually detects
  // (~/.claude/bin/skill-router.py). A broad rule with no concern home (loop-driven,
  // copy-writing, supreme-polish) has nowhere to scope TO — `["*"]` is its correct
  // home. Flag only rules whose name/triggers match a proven concern keyword.
  const CONCERN_KEYWORDS = {
    email: ['email', 'smtp', 'dkim', 'spf', 'dmarc', 'resend', 'deliverability'],
    payments: ['stripe', 'square', 'payment', 'billing', 'refund', 'checkout', 'invoice'],
    auth: ['auth', 'clerk', 'login', 'session', 'sso', 'oauth'],
    'ai-features': ['llm', 'openai', 'anthropic', 'embedding', 'rag'],
    'e2e-testing': ['playwright', 'e2e', 'vitest'],
    'd1-database': ['d1', 'drizzle', 'sqlite'],
    ecommerce: ['shopify', 'cart', 'product catalog', 'ecommerce'],
  };
  const hay = (f + ' ' + (tBlock ? tBlock[1] : '')).toLowerCase();
  const concern = Object.entries(CONCERN_KEYWORDS).find(([, ks]) => ks.some((k) => hay.includes(k)));
  if (triggers >= 2 && pack !== 'core' && concern) {
    findings.push({ file: `rules/${f}`, pack, triggers, suggestConcern: `concern:${concern[0]}`, kind: 'over-scoped-path', confidence: 'MEDIUM' });
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
