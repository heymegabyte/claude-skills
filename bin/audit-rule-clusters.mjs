#!/usr/bin/env node
// audit-rule-clusters.mjs — pairwise 3-gram Jaccard similarity for ALL rule pairs.
// Skips pairs already in the same pack (intentional neighbors).
// Outputs top 10 most similar pairs with recommendation.
//
// Usage:
//   node bin/audit-rule-clusters.mjs
//   node bin/audit-rule-clusters.mjs --json

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const RULES_DIR = join(ROOT, 'rules');
const PACKS_DIR = join(ROOT, '_packs');

const args = process.argv.slice(2);
const json = args.includes('--json');

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

/** Extract rule slug from a pack member line (strip 'rules/' prefix, no extension). */
function memberSlug(member) {
  if (member.startsWith('rules/')) return member.slice(6);
  return member;
}

/** Parse pack YAML, return set of member slugs. */
function parsePack(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const members = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s+(.+)/);
    if (m) {
      const slug = memberSlug(m[1].trim());
      if (!slug.startsWith('bin/')) members.add(slug);
    }
  }
  return members;
}

// Collect all pack member sets and build same-pack pairs
const packs = readdirSync(PACKS_DIR)
  .filter((f) => f.endsWith('.yml') && f !== 'README.md')
  .map((f) => parsePack(join(PACKS_DIR, f)));

const samePack = new Set();
for (const pack of packs) {
  const members = [...pack];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const key = [members[i], members[j]].sort().join('::');
      samePack.add(key);
    }
  }
}

// Read all rule files
const ruleFiles = readdirSync(RULES_DIR)
  .filter((f) => f.endsWith('.md') && !f.startsWith('CHANGELOG'));

const ruleTexts = new Map();
for (const f of ruleFiles) {
  const raw = readFileSync(join(RULES_DIR, f), 'utf8');
  const body = raw.replace(/^---[\s\S]*?---\n?/, '');
  ruleTexts.set(f.replace('.md', ''), body);
}

const ruleSlugs = [...ruleTexts.keys()];
const pairs = [];

for (let i = 0; i < ruleSlugs.length; i++) {
  const a = ruleSlugs[i];
  const ta = trigrams(ruleTexts.get(a));
  for (let j = i + 1; j < ruleSlugs.length; j++) {
    const b = ruleSlugs[j];
    const key = [a, b].sort().join('::');
    if (samePack.has(key)) continue;
    const score = jaccard(ta, trigrams(ruleTexts.get(b)));
    if (score > 0) {
      pairs.push({ a, b, score });
    }
  }
}

pairs.sort((a, b) => b.score - a.score);
const top10 = pairs.slice(0, 10);

// Recommend: MERGE if >0.35, CROSS_LINK if >0.15, OK otherwise
const results = top10.map((p) => {
  let rec;
  if (p.score > 0.35) rec = 'MERGE';
  else if (p.score > 0.15) rec = 'CROSS_LINK';
  else rec = 'OK';
  return { ...p, recommendation: rec };
});

if (json) {
  console.log(JSON.stringify({ totalPairs: pairs.length, top: results }, null, 2));
} else {
  console.log(`Rule cluster audit — ${pairs.length} cross-pack pairs, top 10 by similarity:\n`);
  for (const r of results) {
    const bar = '█'.repeat(Math.round(r.score * 30));
    console.log(`  ${(r.score * 100).toFixed(1)}%  ${r.a.padEnd(40)} ${r.b.padEnd(40)} [${r.recommendation}]`);
    console.log(`  ${''.padEnd(5)}  ${bar}`);
    console.log();
  }
  console.log('  Recommendation guide: MERGE (>0.35), CROSS_LINK (>0.15), OK (≤0.15)');
}
