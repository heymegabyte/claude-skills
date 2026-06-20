#!/usr/bin/env node
/**
 * audit-dead-paths.mjs — catch rule `paths:` constraints the router can NEVER match.
 *
 * The skill-router (~/.claude/bin/skill-router.py, mirrored at bin/skill-router.py)
 * matches `concern:X` / `stack:X` / `org:X` paths against the project fingerprint.
 * If a rule scopes to a concern/stack/org the fingerprinter never EMITS, that path
 * is dead — the rule silently never path-matches (found 5 such in the Jun-2026 arc:
 * concern:public, concern:public_facing). This guard reads the LIVE vocabulary
 * straight from the engine so it stays in sync, then scans every rule.
 *
 * @example
 * node bin/audit-dead-paths.mjs          // report
 * node bin/audit-dead-paths.mjs --ci     // exit 1 on any dead path (HIGH — real bug)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');
const CI = process.argv.includes('--ci');

/** Read the live concern/stack/org vocabulary from the router engine. */
function liveVocabulary() {
  const engine = join(ROOT, 'bin', 'skill-router.py');
  const src = existsSync(engine) ? readFileSync(engine, 'utf8') : '';
  const grab = (re) => new Set([...src.matchAll(re)].map((m) => m[1]));
  return {
    concern: grab(/concerns"\]\.append\("([a-z0-9-]+)"\)/g),
    stack: grab(/fp\["stack"\]\s*=\s*"([a-z0-9-]+)"/g),
    org: new Set([...src.matchAll(/fp\["is_([a-z0-9_]+)"\]\s*=\s*True/g)].map((m) => m[1])),
  };
}

function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? null : text.slice(3, end);
}

function rulePaths(fm) {
  const m = fm.match(/paths:\s*((?:\n\s*-\s*.+)+)/);
  if (!m) return [];
  return [...m[1].matchAll(/-\s*"?([^"\n]+)"?/g)].map((x) => x[1].trim().replace(/"/g, ''));
}

function mdFiles() {
  const out = [];
  for (const f of readdirSync(join(ROOT, 'rules'))) if (f.endsWith('.md')) out.push(`rules/${f}`);
  for (const d of readdirSync(ROOT)) {
    if (/^\d\d-/.test(d)) {
      const dir = join(ROOT, d);
      try { for (const f of readdirSync(dir)) if (f.endsWith('.md')) out.push(`${d}/${f}`); } catch { /* skip */ }
    }
  }
  return out;
}

const vocab = liveVocabulary();
const findings = [];
for (const rel of mdFiles()) {
  const fm = frontmatter(readFileSync(join(ROOT, rel), 'utf8'));
  if (!fm) continue;
  for (const p of rulePaths(fm)) {
    let kind = null;
    if (p.startsWith('concern:') && !vocab.concern.has(p.slice(8))) kind = 'concern';
    else if (p.startsWith('stack:') && !vocab.stack.has(p.slice(6))) kind = 'stack';
    else if (p.startsWith('org:') && !vocab.org.has(p.slice(4))) kind = 'org';
    if (kind) findings.push({ file: rel, path: p, kind, confidence: 'HIGH', detail: `${kind} not emitted by skill-router.py fingerprint` });
  }
}

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ summary: { dead: findings.length, liveConcerns: [...vocab.concern], liveStacks: [...vocab.stack], liveOrg: [...vocab.org] }, findings }, null, 2) + '\n');
} else {
  console.log('=== dead-path audit (HIGH — a dead path never matches the fingerprint) ===');
  if (!findings.length) console.log('  ✓ 0 dead paths — every concern:/stack:/org: maps to a live fingerprint value.');
  for (const f of findings) console.log(`  ✗ ${f.path.padEnd(28)} ${f.file}  (${f.detail})`);
}
process.exit(CI && findings.length ? 1 : 0);
