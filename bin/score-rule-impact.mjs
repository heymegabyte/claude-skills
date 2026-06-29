#!/usr/bin/env node
// score-rule-impact.mjs — scores every rule 0-100 based on:
//   Crosslinks from other rules (+20 max, weighted)
//   Hook script mentions (+25 max, weighted)
//   Pack memberships (+20, flat)
//   Priority (1=30pts, 2=15pts, else 5pts)
//
// Usage:
//   node bin/score-rule-impact.mjs
//   node bin/score-rule-impact.mjs --json

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const RULES_DIR = join(ROOT, 'rules');
const PACKS_DIR = join(ROOT, '_packs');
const HOOKS_DIR = join(process.env.HOME || '/Users/Apple', '.claude', 'hooks');

const args = process.argv.slice(2);
const json = args.includes('--json');

/** Extract rule slug from a pack member line. */
function memberSlug(member) {
  if (member.startsWith('rules/')) return member.slice(6);
  return member;
}

/** Parse pack YAML, return member slugs. */
function parsePack(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const members = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s+(.+)/);
    if (m) {
      const slug = memberSlug(m[1].trim());
      if (!slug.startsWith('bin/')) members.push(slug);
    }
  }
  return members;
}

// Load all packs → build rule→packCount map
const packFiles = readdirSync(PACKS_DIR).filter((f) => f.endsWith('.yml') && f !== 'README.md');
const packCount = new Map(); // rule slug → count of packs it appears in
for (const f of packFiles) {
  const members = parsePack(join(PACKS_DIR, f));
  const seen = new Set();
  for (const m of members) {
    if (!seen.has(m)) {
      packCount.set(m, (packCount.get(m) || 0) + 1);
      seen.add(m);
    }
  }
}

// Load all hook texts once
const hooks = [];
try {
  for (const f of readdirSync(HOOKS_DIR).filter((f) => f.endsWith('.py'))) {
    hooks.push({ name: f, text: readFileSync(join(HOOKS_DIR, f), 'utf8') });
  }
} catch {
  // No hooks dir — proceed with empty
}

// Read all rules
const ruleFiles = readdirSync(RULES_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('CHANGELOG'));

const scored = [];

for (const f of ruleFiles) {
  const slug = f.replace('.md', '');
  const raw = readFileSync(join(RULES_DIR, f), 'utf8');

  // Count crosslinks — [[other-rule-name]] patterns, excluding self-references
  const crosslinkMatches = raw.match(/\[{2}([\w-]+)\]{2}/g) || [];
  const crosslinks = crosslinkMatches
    .map((m) => m.replace(/\[{2}/, '').replace(/\]{2}/, ''))
    .filter((name) => name !== slug && ruleFiles.includes(name + '.md'));
  const crosslinkCount = crosslinks.length;

  // Count hook mentions (pre-loaded)
  const hookMentions = hooks.filter((h) =>
    h.text.includes(slug) || h.text.includes(slug.replace(/-/g, '_').replace(/\./g, '_'))
  ).map((h) => h.name);

  // Extract priority from frontmatter
  const priorityMatch = raw.match(/^priority:\s*(\d+)/m);
  const priority = priorityMatch ? parseInt(priorityMatch[1], 10) : 0;

  // Pack count
  const packs = packCount.get(slug) || 0;

  // Scoring
  const crossScore = Math.min(crosslinkCount / 5, 1) * 20;
  const hookScore = Math.min(hookMentions.length / 3, 1) * 25;
  const packScore = Math.min(packs / 3, 1) * 20;
  let priorityScore;
  if (priority === 1) priorityScore = 30;
  else if (priority === 2) priorityScore = 15;
  else priorityScore = 5;

  const total = Math.round(crossScore + hookScore + packScore + priorityScore);

  scored.push({
    slug,
    total,
    crosslinks: crosslinkCount,
    hooks: hookMentions.length,
    packs,
    priority,
  });
}

scored.sort((a, b) => b.total - a.total);

if (json) {
  console.log(JSON.stringify({ rules: scored }, null, 2));
} else {
  const header = 'Score | Rule | Crosslinks | Hooks | Packs | Priority';
  const sep = '--: | :-- | --: | --: | --: | --:';
  console.log(header);
  console.log(sep);
  for (const r of scored) {
    console.log(
      `${String(r.total).padStart(5)} | ${r.slug.padEnd(44)} | ${String(r.crosslinks).padStart(9)} | ${String(r.hooks).padStart(5)} | ${String(r.packs).padStart(5)} | ${String(r.priority).padStart(8)}`
    );
  }
}
