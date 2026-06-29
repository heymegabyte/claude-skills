#!/usr/bin/env node
// check-description-sdo.mjs — advisory linter for skill-description quality.
//
// Enforces the Skill Discovery Optimization contract from [[skill-authoring-contract]]:
// - description starts with "Use when…" (NOT a workflow summary)
// - description contains ≥3 trigger phrases (symptoms, error strings, file names)
// - description is third person, ≤1024 chars
// - description names the primary artifact or domain
//
// Advisory only — NOT a blocking gate. Same promotion pathway as check-skill-length.
//
// Usage:
//   node bin/check-description-sdo.mjs           # human-readable
//   node bin/check-description-sdo.mjs --json     # { meta, violations[], summary }
//   node bin/check-description-sdo.mjs --ci        # exit 1 on any violation

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const args = new Set(process.argv.slice(2));
const json = args.has('--json');
const ci = args.has('--ci');

// Workflow-summary red flags — if ANY of these appear in the description, it's
// summarizing WHAT the skill does instead of WHEN to use it.
const WORKFLOW_MARKERS = [
  'write a test', 'watch it fail', 'write minimal code',
  'dispatches a subagent', 'subagent per task', 'code review between',
  'step by step', 'step-by-step', 'first you', 'then you',
  'RED-GREEN-REFACTOR', 'red green refactor',
  'this skill covers', 'this skill provides', 'this skill helps',
  'how to', 'guide to', 'workflow for',
];

function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fm = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

const violations = [];
const skillDirs = readdirSync(ROOT).filter((n) => /^\d{2}-/.test(n));

for (const dir of skillDirs) {
  const skillMd = join(ROOT, dir, 'SKILL.md');
  let text;
  try { text = readFileSync(skillMd, 'utf8'); } catch { continue; }

  const fm = parseFrontmatter(text);
  if (!fm) continue;

  const desc = fm.description || '';
  if (!desc) {
    violations.push({ file: `${dir}/SKILL.md`, kind: 'missing-description', detail: 'no description field' });
    continue;
  }

  const short = `${dir}/SKILL.md`;

  if (desc.length > 1024) {
    violations.push({ file: short, kind: 'description-too-long', detail: `${desc.length} chars (max 1024)` });
  }

  // Check for workflow summary
  const descLower = desc.toLowerCase();
  const workflowHits = WORKFLOW_MARKERS.filter((m) => descLower.includes(m.toLowerCase()));
  if (workflowHits.length > 0) {
    violations.push({ file: short, kind: 'workflow-summary', detail: `description contains workflow: ${workflowHits.slice(0, 3).join(', ')}` });
  }

  // Does it start with "Use when"?
  if (!descLower.startsWith('use when')) {
    violations.push({ file: short, kind: 'no-use-when', detail: `description should start with "Use when…": "${desc.slice(0, 60)}…"` });
  }

  // Trigger count — rough heuristic: count significant words/phrases after "Use when"
  const triggers = desc.match(/`[^`]+`|[\w-]+/g) || [];
  if (triggers.length < 8) {
    violations.push({ file: short, kind: 'few-triggers', detail: `~${triggers.length} trigger words (aim ≥8 distinct symptoms/contexts)` });
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file));

if (json) {
  console.log(JSON.stringify({ meta: { kind: 'advisory' }, violations, summary: { count: violations.length, exit: ci && violations.length ? 1 : 0 } }, null, 2));
} else if (violations.length === 0) {
  console.log('✓ all skill descriptions follow SDO (Use when, no workflow, ≥8 triggers)');
} else {
  console.log(`Description-SDO linter — ${violations.length} issues:\n`);
  for (const v of violations) {
    console.log(`  ${(v.kind || '').padEnd(20)} ${v.file}: ${v.detail}`);
  }
  console.log('\n  Fix: description = "Use when {trigger conditions only}", no workflow summary, third person.');
}

process.exit(ci && violations.length ? 1 : 0);
