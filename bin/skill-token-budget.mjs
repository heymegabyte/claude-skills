#!/usr/bin/env node
/**
 * skill-token-budget.mjs
 *
 * Scans all SKILL.md files for `<!-- budget: ~N -->` markers, sums by pack,
 * reports total budget, and warns on skills without budget markers.
 *
 * Usage:
 *   node bin/skill-token-budget.mjs [--pack <name>]
 *
 *   --pack <name>  Filter results to a single pack (e.g. "core").
 *
 * Output: formatted table to stdout.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { argv, exit } from 'node:process';

const PLUGIN_ROOT = new URL('..', import.meta.url).pathname;

function parseArgs() {
  const idx = argv.indexOf('--pack');
  const packFilter = idx !== -1 && argv[idx + 1] ? argv[idx + 1] : null;
  return { packFilter };
}

function findSkillDirs(root) {
  const entries = readdirSync(root);
  return entries
    .filter(e => /^\d{2}-/.test(e) && statSync(join(root, e)).isDirectory())
    .sort();
}

function extractBudgets(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const budgetMatch = raw.match(/<!--\s*budget:\s*~(\d+)\s*-->/);
  return budgetMatch ? parseInt(budgetMatch[1], 10) : 0;
}

function extractFrontmatterField(filePath, field) {
  const raw = readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return '';
  const re = new RegExp(`^${field}:\\s*(.*)$`, 'm');
  const m = fmMatch[1].match(re);
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
}

function loadPacks(root) {
  const packsDir = join(root, '_packs');
  if (!existsSync(packsDir)) return {};
  const files = readdirSync(packsDir).filter(f => f.endsWith('.yml'));
  const packMap = {};
  for (const file of files) {
    const name = file.replace('.yml', '');
    const raw = readFileSync(join(packsDir, file), 'utf8');
    // Extract members: lines under `members:` that start with ` - `
    const memberMatch = raw.match(/^members:\n((?:  - .*\n?)*)/m);
    if (memberMatch) {
      const members = memberMatch[1]
        .split('\n')
        .map(l => l.trim().replace(/^- /, '').trim())
        .filter(Boolean);
      packMap[name] = members;
    }
  }
  return packMap;
}

function findPackForSkill(skillDir, packMap) {
  for (const [packName, members] of Object.entries(packMap)) {
    if (members.some(m => m.includes(skillDir) || skillDir.includes(m))) {
      return packName;
    }
  }
  return null;
}

function buildReport(skillDirs, root, packFilter) {
  const packMap = loadPacks(root);
  const results = [];
  let totalBudget = 0;
  let unstampedCount = 0;

  for (const dir of skillDirs) {
    const skillPath = join(root, dir, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const budget = extractBudgets(skillPath);
    const pack = extractFrontmatterField(skillPath, 'pack') || findPackForSkill(dir, packMap) || '';
    const description = extractFrontmatterField(skillPath, 'description');

    if (packFilter && pack !== packFilter) continue;

    totalBudget += budget;
    if (budget === 0) unstampedCount++;

    results.push({
      skill: dir,
      pack: pack || '(none)',
      budget,
      description: description.slice(0, 50) + (description.length > 50 ? '...' : ''),
    });
  }

  return { results, totalBudget, unstampedCount };
}

function printReport(report) {
  const { results, totalBudget, unstampedCount } = report;

  console.log();
  console.log('Skill Token Budgets');
  console.log('='.repeat(96));
  console.log();

  if (results.length === 0) {
    console.log('No skills match the filter.');
    console.log();
    return;
  }

  console.log('Skill'.padEnd(36) + 'Pack'.padEnd(16) + 'Budget'.padEnd(10) + 'Description');
  console.log('-'.repeat(96));

  // Group by pack
  const byPack = {};
  for (const r of results) {
    if (!byPack[r.pack]) byPack[r.pack] = [];
    byPack[r.pack].push(r);
  }

  for (const [packName, entries] of Object.entries(byPack).sort()) {
    let packTotal = 0;
    for (const r of entries) {
      console.log(
        r.skill.padEnd(36) +
        (r.budget > 0 ? String(r.budget).padEnd(10) : '---'.padEnd(10)) +
        r.description
      );
      packTotal += r.budget;
    }
    if (packTotal > 0) {
      console.log(''.padEnd(36) + `Pack total: ${packTotal}`.padEnd(26));
    }
    console.log();
  }

  console.log(`Grand total budget: ${totalBudget} tokens`);
  if (unstampedCount > 0) {
    console.log(`Skills without budget marker: ${unstampedCount}`);
    const unstamped = results.filter(r => r.budget === 0);
    for (const r of unstamped) {
      console.log(`  ${r.skill}`);
    }
  }
  console.log(`Skills scanned: ${results.length}`);
  console.log();
}

function main() {
  const { packFilter } = parseArgs();
  const root = PLUGIN_ROOT;
  const skillDirs = findSkillDirs(root);
  const report = buildReport(skillDirs, root, packFilter);
  printReport(report);
}

main();
