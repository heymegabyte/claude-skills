#!/usr/bin/env node
/**
 * validate-packs.mjs — pack cross-link integrity gate.
 *
 * Asserts:
 *   1. Every `rules/<slug>` reference in any _packs/*.yml resolves to rules/<slug>.md
 *   2. Every rules/<slug>.md is referenced by ≥1 pack
 *   3. Every NN-* skill reference (e.g., 01-operating-system) resolves to a dir
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

const errors = [];

const packFiles = readdirSync(PACKS).filter((f) => f.endsWith('.yml'));
const ruleFiles = new Set(
  readdirSync(RULES)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, '')),
);

const referencedRules = new Set();
const referencedSkills = new Set();

for (const pf of packFiles) {
  const content = readFileSync(join(PACKS, pf), 'utf8');
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

const orphanRules = [...ruleFiles].filter((r) => !referencedRules.has(r));
if (orphanRules.length > 0) {
  for (const r of orphanRules) {
    errors.push(`rules/${r}.md: not referenced by any pack`);
  }
}

if (errors.length === 0) {
  console.log(`✓ pack integrity clean — ${packFiles.length} packs, ${ruleFiles.size} rules, ${referencedSkills.size} skill dirs`);
  process.exit(0);
}

console.error(`✗ pack drift detected (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`);
for (const e of errors) console.error(`  · ${e}`);
console.error('\nFix: add missing rule/skill OR add orphan rule to appropriate pack OR remove dangling reference.');
process.exit(1);
