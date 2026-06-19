#!/usr/bin/env node
/**
 * skill-health-report.mjs — per-skill health score for the agentskills repo.
 *
 * Health combines:
 *   - token cost: estimated tokens (chars/4) across all *.md files in the skill dir
 *   - retrieval proxy: count of distinct trigger phrases in SKILL.md frontmatter
 *   - health = normalizedTriggers / normalizedTokens  (leaner + more discoverable = better)
 *
 * Activation counts from ~/.claude/agent-memory/ if present; else "unknown".
 *
 * @example
 *   node bin/skill-health-report.mjs
 *   node bin/skill-health-report.mjs --json
 *   node bin/skill-health-report.mjs --ci
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const JSON_FLAG = process.argv.includes('--json');
const CI_FLAG = process.argv.includes('--ci');

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Read file bytes safely; returns empty string on error.
 * @param {string} p - Absolute file path.
 * @returns {string}
 */
function safeRead(p) {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}

/**
 * Recursively collect all *.md files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function findMdFiles(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...findMdFiles(full));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Count chars in a file and estimate tokens (chars / 4).
 * @param {string} p
 * @returns {number}
 */
function estimateTokens(p) {
  try {
    const s = statSync(p);
    return Math.ceil(s.size / 4);
  } catch { return 0; }
}

/**
 * Extract trigger phrases from SKILL.md YAML frontmatter.
 * Handles: triggers: []  and  triggers:\n  - "phrase"
 * @param {string} content - Raw SKILL.md text.
 * @returns {string[]}
 */
function parseTriggers(content) {
  // Find frontmatter block
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];

  const block = fm[1];

  // Inline array: triggers: ["a","b"] or triggers: []
  const inlineMatch = block.match(/^triggers:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    const inner = inlineMatch[1].trim();
    if (!inner) return [];
    return inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }

  // Multi-line list:
  // triggers:
  //   - "phrase"
  const multiMatch = block.match(/^triggers:\s*\r?\n((?:[ \t]+-[ \t]+.*(?:\r?\n|$))*)/m);
  if (multiMatch) {
    return multiMatch[1]
      .split('\n')
      .map(l => l.replace(/^[ \t]+-[ \t]+/, '').trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  return [];
}

/**
 * Load activation counts from ~/.claude/agent-memory if a matching JSON/JSONL exists.
 * Returns a map of skillName → count, or an empty map if no data found.
 * @returns {Map<string,number>}
 */
function loadActivations() {
  const memDir = join(process.env.HOME ?? '/Users/Apple', '.claude', 'agent-memory');
  if (!existsSync(memDir)) return new Map();

  const counts = new Map();
  let entries;
  try { entries = readdirSync(memDir, { withFileTypes: true }); } catch { return counts; }

  for (const e of entries) {
    if (!e.isFile()) continue;
    const full = join(memDir, e.name);
    const text = safeRead(full);
    // Look for any mention of skill numbers or names in activation logs
    const lines = text.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const skillKey = obj.skill ?? obj.skillId ?? obj.name ?? '';
        if (skillKey) {
          counts.set(skillKey, (counts.get(skillKey) ?? 0) + 1);
        }
      } catch { /* non-JSON line */ }
    }
  }
  return counts;
}

/**
 * Normalize an array of numbers to [0,1] using min-max.
 * @param {number[]} arr
 * @returns {number[]}
 */
function minMaxNormalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 0.5);
  return arr.map(v => (v - min) / (max - min));
}

// ── collect skill data ────────────────────────────────────────────────────────

/** @type {Array<{id:string, label:string, tokens:number, triggers:number, activations:number|'unknown', health:number}>} */
const skills = [];

const activationMap = loadActivations();

let dirEntries;
try { dirEntries = readdirSync(ROOT, { withFileTypes: true }); } catch { process.exit(1); }

for (const e of dirEntries) {
  if (!e.isDirectory()) continue;
  if (!/^\d{2}-/.test(e.name)) continue;

  const skillDir = join(ROOT, e.name);
  const skillMdPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) continue;

  const skillContent = safeRead(skillMdPath);
  const triggers = parseTriggers(skillContent);

  // Sum tokens across all *.md files in the skill dir
  const mdFiles = findMdFiles(skillDir);
  const tokens = mdFiles.reduce((sum, f) => sum + estimateTokens(f), 0);

  // Activation: try matching by skill id (e.g. "operating-system") or directory name
  const skillId = e.name.replace(/^\d{2}-/, '');
  const activations = activationMap.get(skillId) ?? activationMap.get(e.name) ?? 'unknown';

  skills.push({
    id: e.name,
    label: e.name,
    tokens,
    triggers: triggers.length,
    activations,
    health: 0, // computed below
  });
}

// Compute health scores — attach norm values to each skill object before sorting
const tokenArr = skills.map(s => s.tokens);
const triggerArr = skills.map(s => s.triggers);

const normTokens = minMaxNormalize(tokenArr);
const normTriggers = minMaxNormalize(triggerArr);

for (let i = 0; i < skills.length; i++) {
  const s = skills[i];
  const nt = normTokens[i];
  const ntr = normTriggers[i];
  // health = normalizedTriggers / (normalizedTokens + epsilon)
  // Higher triggers + lower tokens = better health
  s.health = parseFloat((ntr / (nt + 0.01)).toFixed(4));
  // Store for review-candidate badness (must be attached BEFORE sort reorders array)
  s._normToken = nt;
  s._normTrigger = ntr;
}

// Sort best → worst health
skills.sort((a, b) => b.health - a.health);

// Flag top-5 highest-token / lowest-trigger as review candidates
// badness = high _normToken + low _normTrigger
const reviewCandidates = [...skills]
  .sort((a, b) => (b._normToken + (1 - b._normTrigger)) - (a._normToken + (1 - a._normTrigger)))
  .slice(0, 5)
  .map(s => s.id);

// ── output ────────────────────────────────────────────────────────────────────

if (JSON_FLAG) {
  process.stdout.write(JSON.stringify({
    generated: new Date().toISOString(),
    skills: skills.map(s => ({
      id: s.id,
      tokens: s.tokens,
      triggers: s.triggers,
      activations: s.activations,
      health: s.health,
      reviewCandidate: reviewCandidates.includes(s.id),
    })),
    reviewCandidates,
  }, null, 2) + '\n');
} else {
  const col = (s, w) => String(s).padEnd(w);
  const rpad = (s, w) => String(s).padStart(w);

  console.log('\n── Skill Health Report ──────────────────────────────────────────────');
  console.log(
    col('Rank', 5) + col('Skill', 42) + rpad('Tokens', 9) + rpad('Triggers', 10) +
    rpad('Activations', 13) + rpad('Health', 9) + '  Flags'
  );
  console.log('─'.repeat(90));

  skills.forEach((s, i) => {
    const flag = reviewCandidates.includes(s.id) ? '⚠ review' : '';
    console.log(
      col(i + 1, 5) +
      col(s.id, 42) +
      rpad(s.tokens.toLocaleString(), 9) +
      rpad(s.triggers, 10) +
      rpad(String(s.activations), 13) +
      rpad(s.health.toFixed(3), 9) +
      '  ' + flag
    );
  });

  console.log('\n── Review Candidates (high-token / low-trigger) ─────────────────────');
  reviewCandidates.forEach((id, i) => {
    const s = skills.find(x => x.id === id);
    console.log(`  ${i + 1}. ${id}  (tokens: ${s?.tokens?.toLocaleString()}, triggers: ${s?.triggers})`);
  });
  console.log('');
}

// --ci exits 0 (advisory only — no hard failures)
process.exit(0);
