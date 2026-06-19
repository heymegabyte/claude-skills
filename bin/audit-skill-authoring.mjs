#!/usr/bin/env node
/**
 * audit-skill-authoring.mjs
 *
 * Audits every NN-*\/SKILL.md and rules\/*.md for authoring quality.
 *
 * Checks:
 *   1. description-template — frontmatter description should state what+when.
 *      Flags if first body line (after frontmatter) does not describe purpose. MEDIUM.
 *   2. dependency-DAG — detects cycles in `depends_on:` frontmatter. HIGH if cycle found.
 *   3. eval-presence — flags skill dirs (NN-*\/) with no evals\/ dir or __eval__.json. MEDIUM.
 *
 * Flags:
 *   --json   Output as JSON array
 *   --ci     Exit 1 only on HIGH severity findings
 *
 * @example
 * node bin/audit-skill-authoring.mjs
 * node bin/audit-skill-authoring.mjs --json
 * node bin/audit-skill-authoring.mjs --ci
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), '..');

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const CI_MODE = args.includes('--ci');

/** @typedef {{ file: string, check: string, severity: 'HIGH'|'MEDIUM', message: string }} Finding */

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { data, body } where data is a plain key→value object (strings + arrays only).
 *
 * @param {string} content - Raw file contents
 * @returns {{ data: Record<string, unknown>, body: string }}
 * @example
 * parseFrontmatter('---\nname: foo\n---\n# Hello')
 * // → { data: { name: 'foo' }, body: '# Hello' }
 */
function parseFrontmatter(content) {
  const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const m = content.match(FM_RE);
  if (!m) return { data: {}, body: content };

  const raw = m[1];
  const body = m[2] ?? '';
  const data = /** @type {Record<string, unknown>} */ ({});

  let currentKey = '';
  let inList = false;
  for (const line of raw.split('\n')) {
    const listItem = line.match(/^\s+-\s+(.*)/);
    const kvPair = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)/);

    if (listItem && inList) {
      const arr = /** @type {string[]} */ (data[currentKey]);
      arr.push(listItem[1].trim());
    } else if (kvPair) {
      currentKey = kvPair[1];
      const val = kvPair[2].trim();
      if (val === '' || val === '[]') {
        data[currentKey] = [];
        inList = true;
      } else if (val.startsWith('[')) {
        // inline array: [a, b]
        data[currentKey] = val.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);
        inList = false;
      } else {
        data[currentKey] = val.replace(/^["']|["']$/g, '');
        inList = false;
      }
    } else if (line.match(/^\s+-\s+/) && !inList) {
      // list without a preceding key (shouldn't happen, but guard)
      inList = false;
    }
  }

  return { data, body };
}

/**
 * Return the first non-empty, non-heading line from the body.
 *
 * @param {string} body - Markdown body after frontmatter
 * @returns {string}
 * @example
 * firstBodyLine('\n# Title\n\nSome text here.')
 * // → 'Some text here.'
 */
function firstBodyLine(body) {
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#')) return t;
  }
  return '';
}

/**
 * Heuristic: does the description look like a routing-friendly "what+when" phrase?
 * Returns true if it contains a gerund OR "use when" OR meets minimum length.
 *
 * @param {string} desc - Description string from frontmatter
 * @returns {boolean}
 * @example
 * hasWhatWhen('Auditing skills for quality. Use when checking authoring.')
 * // → true
 * hasWhatWhen('foo')
 * // → false
 */
function hasWhatWhen(desc) {
  if (!desc || desc.length < 30) return false;
  const lower = desc.toLowerCase();
  // Contains gerund (word ending in -ing followed by space) or explicit "use when"
  return /\b\w+ing\s/.test(lower) || lower.includes('use when') || lower.includes('not when');
}

/**
 * Detect cycles in a dependency graph using DFS.
 * Returns array of cycle descriptions (strings), empty if acyclic.
 *
 * @param {Map<string, string[]>} graph - slug → list of dependency slugs
 * @returns {string[]} Cycle descriptions
 * @example
 * detectCycles(new Map([['a', ['b']], ['b', ['a']]]))
 * // → ['a → b → a']
 */
function detectCycles(graph) {
  const cycles = /** @type {string[]} */ ([]);
  const visited = new Set();
  const onStack = new Set();
  const path = /** @type {string[]} */ ([]);

  /**
   * @param {string} node
   */
  function dfs(node) {
    if (onStack.has(node)) {
      // Found a cycle — extract the cycle portion of path
      const idx = path.indexOf(node);
      cycles.push([...path.slice(idx), node].join(' → '));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    onStack.add(node);
    path.push(node);

    for (const dep of graph.get(node) ?? []) {
      dfs(dep);
    }

    path.pop();
    onStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node);
  }

  return cycles;
}

/**
 * Collect all NN-*\/SKILL.md files under ROOT.
 *
 * @returns {Promise<Array<{ dir: string, file: string, slug: string }>>}
 * @example
 * const skills = await collectSkillFiles();
 * // → [{ dir: '/path/01-operating-system', file: '/path/01-operating-system/SKILL.md', slug: '01-operating-system' }]
 */
async function collectSkillFiles() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    if (e.isDirectory() && /^\d{2}-/.test(e.name)) {
      const dir = join(ROOT, e.name);
      const file = join(dir, 'SKILL.md');
      if (existsSync(file)) {
        results.push({ dir, file, slug: e.name });
      }
    }
  }
  return results;
}

/**
 * Collect all rules\/*.md files under ROOT.
 *
 * @returns {Promise<string[]>} Absolute paths
 * @example
 * const rules = await collectRuleFiles();
 * // → ['/path/rules/always.md', ...]
 */
async function collectRuleFiles() {
  const rulesDir = join(ROOT, 'rules');
  const entries = await readdir(rulesDir, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => join(rulesDir, e.name));
}

/**
 * Check 1: description-template
 * Flags files whose description frontmatter does not state what+when.
 *
 * @param {string} file - Absolute path to the markdown file
 * @param {string} content - File contents
 * @returns {Finding|null}
 */
function checkDescriptionTemplate(file, content) {
  const { data } = parseFrontmatter(content);
  const desc = typeof data['description'] === 'string' ? data['description'] : '';
  if (!hasWhatWhen(desc)) {
    return {
      file: file.replace(ROOT + '/', ''),
      check: 'description-template',
      severity: 'MEDIUM',
      message: desc
        ? `Description "${desc.slice(0, 80)}…" lacks gerund phrase or "Use when/Not when" clause`
        : 'Missing description frontmatter',
    };
  }
  return null;
}

/**
 * Check 2: dependency-DAG
 * Builds graph from depends_on frontmatter across all files, detects cycles.
 *
 * @param {Array<{ file: string, content: string, slug: string }>} items
 * @returns {Finding[]}
 */
function checkDependencyDAG(items) {
  /** @type {Map<string, string[]>} */
  const graph = new Map();
  let hasDeps = false;

  for (const { slug, content } of items) {
    const { data } = parseFrontmatter(content);
    const deps = Array.isArray(data['depends_on']) ? /** @type {string[]} */ (data['depends_on']) : [];
    if (deps.length > 0) {
      hasDeps = true;
      graph.set(slug, deps);
    } else {
      graph.set(slug, []);
    }
  }

  if (!hasDeps) {
    return []; // reported separately as "0 declared dependencies — DAG empty (ok)"
  }

  const cycles = detectCycles(graph);
  return cycles.map(cycle => ({
    file: '(dependency-DAG)',
    check: 'dependency-DAG',
    severity: /** @type {'HIGH'} */ ('HIGH'),
    message: `Cycle detected: ${cycle}`,
  }));
}

/**
 * Check 3: eval-presence
 * Flags NN-* skill dirs with no evals\/ subdirectory and no __eval__.json.
 *
 * @param {{ dir: string, slug: string }} skill
 * @returns {Promise<Finding|null>}
 */
async function checkEvalPresence({ dir, slug }) {
  const evalsDir = join(dir, 'evals');
  const evalJson = join(dir, '__eval__.json');
  const hasEvalsDir = existsSync(evalsDir);
  const hasEvalJson = existsSync(evalJson);
  if (!hasEvalsDir && !hasEvalJson) {
    return {
      file: `${slug}/SKILL.md`,
      check: 'eval-presence',
      severity: 'MEDIUM',
      message: `No evals/ dir or __eval__.json found — skill cannot reach "stable" per skill-authoring-contract`,
    };
  }
  return null;
}

async function main() {
  const findings = /** @type {Finding[]} */ ([]);

  // --- Collect files ---
  const skillFiles = await collectSkillFiles();
  const ruleFiles = await collectRuleFiles();

  // --- Load contents ---
  const allItems = /** @type {Array<{ file: string, content: string, slug: string }>} */ ([]);

  for (const { dir, file, slug } of skillFiles) {
    const content = await readFile(file, 'utf8');
    allItems.push({ file, content, slug });
  }
  for (const file of ruleFiles) {
    const content = await readFile(file, 'utf8');
    const slug = 'rules/' + basename(file, '.md');
    allItems.push({ file, content, slug });
  }

  // --- Check 1: description-template (all files) ---
  let descFlagCount = 0;
  for (const { file, content } of allItems) {
    const f = checkDescriptionTemplate(file, content);
    if (f) {
      findings.push(f);
      descFlagCount++;
    }
  }

  // --- Check 2: dependency-DAG (all files collectively) ---
  const dagFindings = checkDependencyDAG(allItems);
  findings.push(...dagFindings);

  // Summarize DAG state
  const hasDeps = allItems.some(({ content }) => {
    const { data } = parseFrontmatter(content);
    return Array.isArray(data['depends_on']) && data['depends_on'].length > 0;
  });

  // --- Check 3: eval-presence (skill dirs only) ---
  let evalFlagCount = 0;
  for (const skill of skillFiles) {
    const f = await checkEvalPresence(skill);
    if (f) {
      findings.push(f);
      evalFlagCount++;
    }
  }

  // --- Output ---
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;

  if (JSON_MODE) {
    const summary = {
      totalFiles: allItems.length,
      skillDirs: skillFiles.length,
      ruleFiles: ruleFiles.length,
      dagStatus: hasDeps
        ? (dagFindings.length === 0 ? 'acyclic' : 'CYCLE_DETECTED')
        : '0 declared dependencies — DAG empty (ok)',
      findings: {
        HIGH: highCount,
        MEDIUM: mediumCount,
        total: findings.length,
      },
      items: findings,
    };
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    process.stdout.write(`audit-skill-authoring — ${allItems.length} files (${skillFiles.length} skills + ${ruleFiles.length} rules)\n`);
    process.stdout.write(`\n[DAG] ${hasDeps ? (dagFindings.length === 0 ? 'Acyclic — no cycles detected' : `${dagFindings.length} CYCLE(S) detected`) : '0 declared dependencies — DAG empty (ok)'}\n`);
    process.stdout.write(`\n[description-template] ${descFlagCount} file(s) flagged (MEDIUM)\n`);
    process.stdout.write(`[eval-presence] ${evalFlagCount}/${skillFiles.length} skill dir(s) missing evals (MEDIUM)\n`);
    process.stdout.write(`\nSummary: HIGH=${highCount} MEDIUM=${mediumCount} TOTAL=${findings.length}\n`);

    if (findings.length > 0) {
      process.stdout.write('\n--- Findings ---\n');
      for (const f of findings) {
        process.stdout.write(`[${f.severity}] ${f.check} | ${f.file}\n  ${f.message}\n`);
      }
    }
  }

  if (CI_MODE && highCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
