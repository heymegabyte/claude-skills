#!/usr/bin/env node
/**
 * check-route-phrasing.mjs — guarantee natural one-line website prompts route the
 * build flow.
 *
 * The skill-router fires the website-build pack only when a prompt SUBSTRING-matches
 * a trigger on some pack member (match_triggers → re.search). Real users rarely type
 * "build a website" verbatim — they say "make me a site for my plumbing business",
 * "I need a website for my nonprofit", "create a landing page for my law firm". Before
 * the Jun-2026 phrasing fix those routed 0-2/6 core nodes with NO manifest, so a
 * one-line prompt silently skipped the entire Phase -1→8 doctrine.
 *
 * This gate mirrors the router's matcher statically (no live skills.db needed → CI-safe):
 * every prompt in CORPUS must substring-match at least one trigger declared by a
 * website-build pack member. A new phrasing that matches nothing fails the build,
 * forcing a trigger addition rather than a silent routing miss.
 *
 * @example
 * node bin/check-route-phrasing.mjs        // report coverage
 * node bin/check-route-phrasing.mjs --ci   // exit 1 if any corpus prompt routes nothing
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CI = process.argv.includes('--ci');

// Realistic one-line website prompts a user might type. Each MUST route the
// website-build pack. Add a row whenever a new natural phrasing is discovered.
const CORPUS = [
  'build a website for acme dental in newark nj',
  'rebuild acmeroofing.com',
  'make me a site for my plumbing business',
  'i need a website for my nonprofit',
  'create a landing page for my law firm',
  'design a website for my bakery',
  'i want a website for my church',
  'clone and improve competitor.com',
  'make me a website for my restaurant',
  'set up a website for my dental practice',
  'build me a site for my gym',
  'we need a site for my law office',
];

// Pull triggers from every website-build pack member (any member match expands the pack).
function packMembers() {
  const yml = readFileSync(join(ROOT, '_packs/website-build.yml'), 'utf8');
  return yml
    .split('\n')
    .filter((l) => /^\s+-\s/.test(l))
    .map((l) => l.replace(/^\s+-\s*/, '').trim());
}

function frontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? null : text.slice(3, end);
}

function triggersOf(member) {
  // member is "rules/foo" or "NN-skill" (→ NN-skill/SKILL.md)
  const rel = member.startsWith('rules/') ? `${member}.md` : `${member}/SKILL.md`;
  let text;
  try {
    text = readFileSync(join(ROOT, rel), 'utf8');
  } catch {
    return [];
  }
  const fm = frontmatter(text);
  if (!fm) return [];
  const out = [];
  let inTriggers = false;
  for (const line of fm.split('\n')) {
    if (/^triggers:/.test(line)) { inTriggers = true; continue; }
    if (inTriggers) {
      const m = line.match(/^\s+-\s*"?([^"]+?)"?\s*$/);
      if (m) out.push(m[1].toLowerCase());
      else if (/^\S/.test(line)) break; // next top-level key
    }
  }
  return out;
}

const allTriggers = [...new Set(packMembers().flatMap(triggersOf))];
// Mirror match_triggers: substring search ({placeholder} → wildcard, but corpus has none).
const matches = (prompt) => allTriggers.some((t) => prompt.toLowerCase().includes(t));

const missed = CORPUS.filter((p) => !matches(p));

console.log('=== route-phrasing (natural one-line site prompts must route website-build) ===');
console.log(`  ${allTriggers.length} pack triggers · ${CORPUS.length} prompts · ${missed.length === 0 ? '✓ all route' : `✗ ${missed.length} route NOTHING`}`);
for (const p of missed) console.error(`  ✗ no website-build trigger matches: "${p}"`);
if (missed.length) console.error('\n  Add a trigger to a website-build pack member (e.g. rules/website-build-manifest.md).');

if (CI && missed.length) process.exit(1);
