#!/usr/bin/env node
// check-rationalization-table.mjs — advisory linter for discipline-skill hygiene.
//
// A discipline skill (one that enforces a rule the agent may rationalize away under
// pressure) should carry a rationalization table + red-flags list so the agent can
// self-diagnose when it's about to violate the rule. This scans SKILL.md and rules/*.md
// for markers that indicate discipline content, then checks whether those markers are
// present. Advisory only — NOT a blocking gate. Promote to info-section in lint-all.sh
// after it runs clean a while (matches check-skill-length precedent).
//
// Usage:
//   node bin/check-rationalization-table.mjs           # human-readable
//   node bin/check-rationalization-table.mjs --json     # { meta, violations[], summary }
//   node bin/check-rationalization-table.mjs --ci        # exit 1 on any violation

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const args = new Set(process.argv.slice(2));
const json = args.has('--json');
const ci = args.has('--ci');

// Is this file a discipline rule (prohibits a behavior, not just describing a pattern)?
function isDiscipline(text) {
  const markers = [
    /NO\s+\w+\s+WITHOUT/i,         // "NO SKILL WITHOUT A FAILING TEST"
    /Iron\s+Law/i,                  // "Iron Law: ..."
    /never\s+skip/i,               // "never skip X"
    /delete\s+(it|the|means)/i,   // "delete it, start over"
    /no\s+exception/i,             // "no exceptions"
    /MUST\s+NOT|MUST\s+NEVER/i,   // MUST NOT / MUST NEVER
    /hard\s+gate/i,                // "hard gate"
    /red.flag/i,                   // an existing red-flags list
    /rationalization/i,            // an existing rationalization table
    /stop\s+and\s+start\s+over/i, // "STOP and start over"
  ];
  return markers.some((re) => re.test(text));
}

// Does it already have a rationalization table?
function hasRationalizationTable(text) {
  return /Excuse.*Reality|reality.*excuse|rationalization/i.test(text) &&
    /\|.+\|.+\|/.test(text); // table row
}

// Does it already have a red-flags list?
function hasRedFlags(text) {
  return /red.flags?.{0,20}(STOP|list|start over)/is.test(text) ||
    /## Red Flags/i.test(text);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const violations = [];
const files = [
  ...walk(join(ROOT, 'rules')),
  ...walk(join(ROOT)).filter((f) => f.endsWith('/SKILL.md')),
];

for (const file of files) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  if (!isDiscipline(text)) continue;

  const short = file.replace(ROOT, '');
  const hasTable = hasRationalizationTable(text);
  const hasFlags = hasRedFlags(text);

  if (!hasTable && !hasFlags) {
    violations.push({ file: short, kind: 'missing-both', detail: 'discipline rule with no rationalization table or red-flags list' });
  } else if (!hasTable) {
    violations.push({ file: short, kind: 'missing-table', detail: 'has red-flags but no rationalization table' });
  } else if (!hasFlags) {
    violations.push({ file: short, kind: 'missing-red-flags', detail: 'has rationalization table but no red-flags list' });
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file));

if (json) {
  console.log(JSON.stringify({ meta: { kind: 'advisory' }, violations, summary: { count: violations.length, exit: ci && violations.length ? 1 : 0 } }, null, 2));
} else if (violations.length === 0) {
  console.log('✓ all discipline rules carry rationalization-table + red-flags');
} else {
  console.log(`Rationalization-table linter — ${violations.length} discipline rules could benefit:\n`);
  for (const v of violations) {
    console.log(`  ${v.kind.padEnd(16)} ${v.file}`);
  }
  console.log('\n  Fix: add a | Excuse | Reality | table + ## Red Flags list per [[skill-authoring-contract]].');
}

process.exit(ci && violations.length ? 1 : 0);
