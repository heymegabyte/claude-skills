#!/usr/bin/env node
/**
 * skill-quality-scores.mjs
 *
 * Scans all SKILL.md files in the plugin and scores each on 6 quality dimensions:
 *   1. Description quality (length ≥60 chars, specificity)
 *   2. Examples in body (code blocks or bullet examples)
 *   3. Cross-link count ([[...]] references)
 *   4. Budget marker present (<!-- budget: ~N -->)
 *   5. Pack membership (assigned to at least one pack)
 *   6. Frontmatter completeness (metadata, triggers, paths)
 *
 * Usage:
 *   node bin/skill-quality-scores.mjs [--threshold <N>]
 *
 *   --threshold <N>  Only show skills below this total score (default: 0 = all).
 *
 * Output: ranked table to stdout.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { argv, exit } from 'node:process';

const PLUGIN_ROOT = new URL('..', import.meta.url).pathname;

function parseArgs() {
  const idx = argv.indexOf('--threshold');
  const threshold = idx !== -1 && argv[idx + 1] ? parseInt(argv[idx + 1], 10) : 0;
  return { threshold };
}

function findSkillDirs(root) {
  const entries = readdirSync(root);
  return entries
    .filter(e => /^\d{2}-/.test(e) && statSync(join(root, e)).isDirectory())
    .sort();
}

function loadFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { frontmatter: {}, body: raw, raw };
  const body = raw.slice(fmMatch[0].length).trim();
  const lines = fmMatch[1].split('\n');
  const frontmatter = {};
  let currentKey = null;
  for (const line of lines) {
    const headerMatch = line.match(/^(\w[\w-]*?):\s*(.*)/);
    if (headerMatch) {
      currentKey = headerMatch[1];
      frontmatter[currentKey] = headerMatch[2].replace(/^["']|["']$/g, '');
    } else if (currentKey && /^\s{2}/.test(line)) {
      frontmatter[currentKey] += '\n' + line.trim();
    }
  }
  return { frontmatter, body, raw };
}

function scoreDescription(desc) {
  let score = 0;
  if (!desc || desc.length < 10) return 0;
  // Length score (0-3)
  if (desc.length >= 60) score += 3;
  else if (desc.length >= 30) score += 2;
  else score += 1;
  // Specificity signals (0-3)
  const signals = ['Cloudflare', 'Workers', 'D1', 'R2', 'KV', 'Zod', 'Drizzle',
    'shadcn', 'TanStack', 'Tailwind', 'Hono', 'Playwright', 'Vitest',
    'React', 'Angular', 'Vite', 'D1', 'Inngest', 'Resend', 'PostHog',
    'Sentry', 'Lighthouse', 'axe', 'WCAG', 'CLS', 'LCP', 'INP', 'CWV'];
  const matches = signals.filter(s => desc.includes(s));
  score += Math.min(matches.length, 3);
  return score;
}

function scoreExamples(body) {
  // Check for code blocks or bullet examples
  const codeBlocks = (body.match(/```/g) || []).length / 2;
  if (codeBlocks >= 3) return 3;
  if (codeBlocks >= 1) return 2;
  const bullets = (body.match(/^- /g) || []).length;
  if (bullets >= 5) return 1;
  return 0;
}

function scoreCrossLinks(body) {
  const links = (body.match(/\[\[([^\]]+)\]\]/g) || []).length;
  if (links >= 10) return 3;
  if (links >= 5) return 2;
  if (links >= 1) return 1;
  return 0;
}

function scoreBudget(raw) {
  return /<!--\s*budget:\s*~\d+\s*-->/.test(raw) ? 3 : 0;
}

function scorePackMembership(frontmatter) {
  const pack = frontmatter.pack || '';
  if (pack && pack !== 'none') return 3;
  // Check if file mentions pack membership in body
  return 0;
}

function scoreFrontmatter(frontmatter) {
  let score = 0;
  if (frontmatter.name) score += 1;
  if (frontmatter.description) score += 1;
  if (frontmatter['metadata.version'] || frontmatter.metadata) score += 1;
  if (frontmatter.triggers || frontmatter.when_to_use) score += 1;
  if (frontmatter.paths || frontmatter['pack']) score += 1;
  return score;
}

function buildReport(skillDirs, root) {
  const results = [];

  for (const dir of skillDirs) {
    const skillPath = join(root, dir, 'SKILL.md');
    if (!existsSync(skillPath)) {
      results.push({
        skill: dir,
        description: '(no SKILL.md)',
        descScore: 0, exampleScore: 0, linkScore: 0,
        budgetScore: 0, packScore: 0, fmScore: 0,
        total: 0,
      });
      continue;
    }

    const { frontmatter, body, raw } = loadFrontmatter(skillPath);
    const desc = frontmatter.description || '';
    const ds = scoreDescription(desc);
    const es = scoreExamples(body);
    const ls = scoreCrossLinks(body);
    const bs = scoreBudget(raw);
    const ps = scorePackMembership(frontmatter);
    const fs = scoreFrontmatter(frontmatter);
    const total = ds + es + ls + bs + ps + fs;

    results.push({
      skill: dir,
      description: desc.slice(0, 60) + (desc.length > 60 ? '...' : ''),
      descScore: ds,
      exampleScore: es,
      linkScore: ls,
      budgetScore: bs,
      packScore: ps,
      fmScore: fs,
      total,
    });
  }

  results.sort((a, b) => a.total - b.total);
  return results;
}

function printReport(report, threshold) {
  console.log();
  console.log('Skill Quality Scores');
  console.log('='.repeat(96));
  console.log();
  console.log(
    'Skill'.padEnd(36) +
    'Desc'.padEnd(6) +
    'Exmp'.padEnd(6) +
    'Link'.padEnd(6) +
    'Budg'.padEnd(6) +
    'Pack'.padEnd(6) +
    'Fm'.padEnd(6) +
    'Total'.padEnd(6)
  );
  console.log('-'.repeat(96));

  for (const r of report) {
    if (threshold > 0 && r.total >= threshold) continue;
    console.log(
      r.skill.padEnd(36) +
      String(r.descScore).padEnd(6) +
      String(r.exampleScore).padEnd(6) +
      String(r.linkScore).padEnd(6) +
      String(r.budgetScore).padEnd(6) +
      String(r.packScore).padEnd(6) +
      String(r.fmScore).padEnd(6) +
      String(r.total).padEnd(6)
    );
  }

  console.log();
  const totalSkills = report.length;
  const avg = report.reduce((s, r) => s + r.total, 0) / totalSkills;
  const max = Math.max(...report.map(r => r.total));
  const min = Math.min(...report.map(r => r.total));
  console.log(`Skills scanned: ${totalSkills}  |  Avg: ${avg.toFixed(1)}  |  Max: ${max}  |  Min: ${min}`);
  console.log(`Max possible: 18 (3+3+3+3+3+5) — per dimension: Desc(3) Exmp(3) Link(3) Budg(3) Pack(3) FM(5)`);
  console.log();

  // Improvement candidates (below median)
  const median = report[Math.floor(report.length / 2)].total;
  const below = report.filter(r => r.total <= median && r.total > 0);
  if (below.length) {
    console.log('Improvement candidates (at or below median):');
    for (const r of below.slice(0, 5)) {
      const zeros = [];
      if (r.descScore === 0) zeros.push('desc');
      if (r.exampleScore === 0) zeros.push('examples');
      if (r.linkScore === 0) zeros.push('cross-links');
      if (r.budgetScore === 0) zeros.push('budget');
      if (r.packScore === 0) zeros.push('pack');
      if (r.fmScore < 3) zeros.push('frontmatter');
      console.log(`  ${r.skill.padEnd(36)} score=${r.total}/18  missing: ${zeros.join(', ')}`);
    }
    console.log();
  }
}

function main() {
  const { threshold } = parseArgs();
  const root = PLUGIN_ROOT;
  const skillDirs = findSkillDirs(root);
  const report = buildReport(skillDirs, root);
  printReport(report, threshold);
}

main();
