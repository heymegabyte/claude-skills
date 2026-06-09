#!/usr/bin/env node
/**
 * validate-packs.mjs — pack cross-link integrity gate.
 *
 * Errors (exit 1):
 *   1. Every `rules/<slug>` reference in any _packs/*.yml resolves to rules/<slug>.md
 *   2. Every rules/<slug>.md is referenced by ≥1 pack
 *   3. Every NN-* skill reference (e.g., 01-operating-system) resolves to a dir
 *   4. Every pack file has required `name` + `description` + `members` fields
 *
 * Warnings (informational, no exit code change):
 *   - Rules referenced by ≥3 packs (multi-concern rules are intentional, but 3+
 *     usually signals over-bundling; review whether the rule is too broad)
 *   - Silenceable via `.validate-packs-ignore` (one rule slug per line, # comments OK)
 *
 * Exit codes: 0 = clean, 1 = drift detected.
 * Run: node scripts/validate-packs.mjs
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = join(ROOT, '_packs');
const RULES = join(ROOT, 'rules');
const IGNORE_FILE = join(ROOT, '.validate-packs-ignore');

const ignoredSlugs = new Set();
if (existsSync(IGNORE_FILE)) {
  for (const raw of readFileSync(IGNORE_FILE, 'utf8').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (line) ignoredSlugs.add(line);
  }
}

const errors = [];

const packFiles = readdirSync(PACKS).filter((f) => f.endsWith('.yml'));
const ruleFiles = new Set(
  readdirSync(RULES)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, '')),
);

const referencedRules = new Set();
const referencedSkills = new Set();
const rulePackMap = new Map(); // rule slug → [packs it appears in]
const REQUIRED_PACK_FIELDS = ['name:', 'description:', 'members:'];

for (const pf of packFiles) {
  const content = readFileSync(join(PACKS, pf), 'utf8');

  // Schema check: required fields
  for (const field of REQUIRED_PACK_FIELDS) {
    if (!content.includes(`\n${field}`) && !content.startsWith(field)) {
      errors.push(`${pf}: missing required field '${field}'`);
    }
  }

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const ruleMatch = line.match(/^\s*-\s+rules\/(\S+)/);
    const skillMatch = line.match(/^\s*-\s+(\d{2}-[\w-]+)/);
    if (ruleMatch) {
      const slug = ruleMatch[1];
      referencedRules.add(slug);
      if (!ruleFiles.has(slug)) {
        errors.push(`${pf}: references missing rule '${slug}'`);
      }
      if (!rulePackMap.has(slug)) rulePackMap.set(slug, []);
      rulePackMap.get(slug).push(pf);
    } else if (skillMatch) {
      const skill = skillMatch[1];
      referencedSkills.add(skill);
      const skillDir = join(ROOT, skill);
      if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
        errors.push(`${pf}: references missing skill dir '${skill}'`);
      }
    }
  }
}

// Multi-pack warning: ≥3 references suggests the rule may be too broad.
// Per Brian's design, cross-pack references are intentional (load-bundling), so
// only ≥3 surfaces a warning; ≥2 is allowed silently.
const warnings = [];
for (const [slug, packs] of rulePackMap.entries()) {
  if (packs.length >= 3 && !ignoredSlugs.has(slug)) {
    warnings.push(`rules/${slug}.md: in ${packs.length} packs (${packs.join(', ')}) — consider whether the rule is too broad`);
  }
}

const orphanRules = [...ruleFiles].filter((r) => !referencedRules.has(r));
if (orphanRules.length > 0) {
  for (const r of orphanRules) {
    errors.push(`rules/${r}.md: not referenced by any pack`);
  }
}

if (warnings.length > 0) {
  console.error(`⚠ ${warnings.length} pack warning(s):`);
  for (const w of warnings) console.error(`  · ${w}`);
  console.error('  (silence specific slugs via .validate-packs-ignore)\n');
}

const summary = `${packFiles.length} packs, ${ruleFiles.size} rules, ${referencedSkills.size} skill dirs, ${warnings.length} warnings, ${ignoredSlugs.size} ignored`;

if (errors.length === 0) {
  console.log(`✓ pack integrity clean — ${summary}`);
  process.exit(0);
}

console.error(`✗ pack drift detected (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`);
for (const e of errors) console.error(`  · ${e}`);
console.error('\nFix: add missing rule/skill OR add orphan rule to appropriate pack OR remove dangling reference.');
process.exit(1);
