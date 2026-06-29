#!/usr/bin/env node
// suggest-pack-membership.mjs — 3-gram Jaccard similarity between orphan rules
// and each pack's member texts. Defaults to checking the 2 known orphans:
// agpl-isolation-via-http-boundary and cloudflare-native-provisioning.
//
// Usage:
//   node bin/suggest-pack-membership.mjs
//   node bin/suggest-pack-membership.mjs --rule agpl-isolation-via-http-boundary
//   node bin/suggest-pack-membership.mjs --json

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const RULES_DIR = join(ROOT, 'rules');
const PACKS_DIR = join(ROOT, '_packs');

const args = process.argv.slice(2);
const json = args.includes('--json');

let targetRules = [];
const ruleFlagIdx = args.indexOf('--rule');
if (ruleFlagIdx !== -1 && args[ruleFlagIdx + 1]) {
  targetRules = [args[ruleFlagIdx + 1]];
} else {
  targetRules = ['agpl-isolation-via-http-boundary', 'cloudflare-native-provisioning'];
}

/** Produce character 3-gram set from text. */
function trigrams(text) {
  const s = new Set();
  const cleaned = text.replace(/\s+/g, ' ').toLowerCase();
  for (let i = 0; i < cleaned.length - 2; i++) {
    s.add(cleaned.slice(i, i + 3));
  }
  return s;
}

/** Jaccard similarity between two sets. */
function jaccard(a, b) {
  const intersect = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersect.size / union.size;
}

/** Read text content of a rule file by slug (without .md). */
function readRule(slug) {
  const p = join(RULES_DIR, slug + '.md');
  try {
    // Skip YAML frontmatter (between --- delimiters)
    const raw = readFileSync(p, 'utf8');
    const body = raw.replace(/^---[\s\S]*?---\n?/, '');
    return body;
  } catch {
    return '';
  }
}

/** Parse pack YAML (minimal — no deps), returning {name, members[]}. */
function parsePack(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const nameMatch = text.match(/^name:\s*(.+)/m);
  const members = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s+(.+)/);
    if (m) members.push(m[1].trim());
  }
  return { name: nameMatch ? nameMatch[1] : basename(filePath, '.yml'), members };
}

/** Compute pack's combined trigram set from its rule members. */
function packTrigramSet(pack) {
  let combined = '';
  for (const member of pack.members) {
    if (member.startsWith('rules/')) {
      const slug = member.replace('rules/', '');
      combined += readRule(slug) + '\n';
    }
  }
  return trigrams(combined);
}

// Load all packs
const packs = readdirSync(PACKS_DIR)
  .filter((f) => f.endsWith('.yml') && f !== 'README.md')
  .map((f) => parsePack(join(PACKS_DIR, f)));

const results = [];
for (const ruleSlug of targetRules) {
  const ruleText = readRule(ruleSlug);
  if (!ruleText) {
    results.push({ rule: ruleSlug, error: 'Rule file not found or empty' });
    continue;
  }
  const ruleTg = trigrams(ruleText);
  const suggestions = packs
    .map((pack) => ({
      pack: pack.name,
      score: jaccard(ruleTg, packTrigramSet(pack)),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  results.push({ rule: ruleSlug, suggestions });
}

if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    if (r.error) {
      console.log(`\n  ${r.rule}: ${r.error}`);
      continue;
    }
    console.log(`\n  ${r.rule} — ranked pack suggestions:`);
    for (const s of r.suggestions) {
      const bar = '█'.repeat(Math.round(s.score * 30));
      console.log(`    ${(s.score * 100).toFixed(1)}%  ${s.pack.padEnd(20)} ${bar}`);
    }
  }
}
