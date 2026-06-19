#!/usr/bin/env node
/**
 * audit-crosslink-graph.mjs
 *
 * Builds the [[slug]] cross-link graph over rules/ (resolving slugs the same
 * way bin/audit-crosslinks.mjs does). Computes a PageRank-style inbound score
 * (20 iterations, damping 0.85) and reports:
 *
 *   - Top 15 hub rules by score (promotion-to-always-load candidates)
 *   - Every rule with 0 inbound AND 0 outbound links (isolated — deletion candidates)
 *
 * Flags:
 *   --json   Emit { hubs: [...], isolated: [...] } to stdout instead of human report
 *   --ci     Always exit 0 (advisory — never breaks CI)
 *
 * Zero external deps — uses only node:fs, node:path, node:url.
 *
 * @example
 * node bin/audit-crosslink-graph.mjs
 * node bin/audit-crosslink-graph.mjs --json
 * node bin/audit-crosslink-graph.mjs --ci
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const CI_MODE = args.includes('--ci');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const RULES_DIR = join(ROOT, 'rules');
const COMMANDS_DIR = join(ROOT, 'commands');
const SKILLS_DIR = join(ROOT, 'skills');

// ---------------------------------------------------------------------------
// File discovery (mirrors audit-crosslinks.mjs)
// ---------------------------------------------------------------------------

/**
 * Collect all .md files under a directory (non-recursive, files only).
 *
 * @param {string} dir - Absolute directory path.
 * @returns {string[]} Sorted basenames (without path).
 * @example
 * collectMdStems('/rules') // → ['always', 'drift-detection', ...]
 */
function collectMdStems(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => e.name.replace(/\.md$/, ''))
    .sort();
}

/**
 * Build the Set of top-level directory names under the repo root.
 *
 * @returns {Set<string>} Directory base names.
 * @example
 * buildTopLevelDirSet() // → Set { '01-operating-system', 'bin', ... }
 */
function buildTopLevelDirSet() {
  const dirs = new Set();
  for (const e of readdirSync(ROOT, { withFileTypes: true })) {
    if (e.isDirectory()) dirs.add(e.name);
  }
  return dirs;
}

/**
 * Build the Set of skill directory names under skills/.
 *
 * @returns {Set<string>} Skill directory names.
 * @example
 * buildSkillsDirSet() // → Set { 'superpowers', 'stripe', ... }
 */
function buildSkillsDirSet() {
  if (!existsSync(SKILLS_DIR)) return new Set();
  return new Set(
    readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
  );
}

/**
 * Build a Set of .md stems inside every numbered skill directory (e.g. 05-architecture-and-stack).
 *
 * @param {Set<string>} topLevelDirs - Set from buildTopLevelDirSet().
 * @returns {Set<string>} All .md stems found inside numbered dirs.
 * @example
 * buildNumberedDirMdStems(topLevelDirs) // → Set { 'hono-api', ... }
 */
function buildNumberedDirMdStems(topLevelDirs) {
  const stems = new Set();
  for (const dir of topLevelDirs) {
    if (!/^\d+-/.test(dir)) continue;
    const dirPath = join(ROOT, dir);
    try {
      for (const e of readdirSync(dirPath, { withFileTypes: true })) {
        if (e.isFile() && e.name.endsWith('.md')) stems.add(e.name.replace(/\.md$/, ''));
      }
    } catch { /* skip */ }
  }
  return stems;
}

// ---------------------------------------------------------------------------
// Slug resolution (mirrors audit-crosslinks.mjs resolveSlug exactly)
// ---------------------------------------------------------------------------

/**
 * Resolve a [[slug]] to a canonical node ID (the slug itself if it resolves).
 * Returns null when the slug cannot be resolved to any known file or directory.
 *
 * @param {string} slug - Raw slug from [[slug]] link.
 * @param {Set<string>} topLevelDirs
 * @param {Set<string>} skillsDirs
 * @param {Set<string>} numberedDirMdStems
 * @returns {string|null} Canonical node ID or null.
 * @example
 * resolveSlug('drift-detection', ...) // → 'drift-detection'
 * resolveSlug('nonexistent', ...)     // → null
 */
function resolveSlug(slug, topLevelDirs, skillsDirs, numberedDirMdStems) {
  if (!slug) return null;

  if (existsSync(join(RULES_DIR, `${slug}.md`))) return slug;
  if (existsSync(join(COMMANDS_DIR, `${slug}.md`))) return slug;

  if (topLevelDirs.has(slug)) return slug;
  for (const dir of topLevelDirs) {
    if (/^\d+-/.test(dir) && dir.replace(/^\d+-/, '') === slug) return slug;
  }

  if (skillsDirs.has(slug)) return slug;
  if (existsSync(join(SKILLS_DIR, slug, 'SKILL.md'))) return slug;

  if (topLevelDirs.has(slug) && existsSync(join(ROOT, slug, 'SKILL.md'))) return slug;
  for (const dir of topLevelDirs) {
    if (/^\d+-/.test(dir) && dir.replace(/^\d+-/, '') === slug) {
      if (existsSync(join(ROOT, dir, 'SKILL.md'))) return slug;
    }
  }

  if (numberedDirMdStems.has(slug)) return slug;
  return null;
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

/**
 * Pre-process [[slug]] syntax: strip backtick wrapping and #anchor suffixes.
 *
 * @param {string} raw - Raw slug text from regex capture.
 * @returns {string} Cleaned slug.
 * @example
 * normaliseSlug('`drift-detection`') // → 'drift-detection'
 * normaliseSlug('drift-detection#step-2') // → 'drift-detection'
 */
function normaliseSlug(raw) {
  let s = raw.trim().replace(/^`+|`+$/g, '');
  const hashIdx = s.indexOf('#');
  if (hashIdx !== -1) s = s.slice(0, hashIdx);
  return s.trim().replace(/^`+|`+$/g, '');
}

/**
 * Extract all resolvable [[slug]] targets from a markdown file's text,
 * skipping fenced code blocks and inline code spans.
 *
 * @param {string} text - Raw file text.
 * @param {Set<string>} topLevelDirs
 * @param {Set<string>} skillsDirs
 * @param {Set<string>} numberedDirMdStems
 * @returns {string[]} Resolved canonical node IDs (may contain duplicates).
 * @example
 * extractLinks('See [[drift-detection]].', ...) // → ['drift-detection']
 */
function extractLinks(text, topLevelDirs, skillsDirs, numberedDirMdStems) {
  const lines = text.split('\n');
  const targets = [];
  let inFence = false;
  const LINK_RE = /\[\[([^\]]+)\]\]/g;

  for (const line of lines) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    // Strip inline code spans before scanning
    const stripped = line.replace(/`[^`]*`/g, '');
    let m;
    while ((m = LINK_RE.exec(stripped)) !== null) {
      const slug = normaliseSlug(m[1]);
      const resolved = resolveSlug(slug, topLevelDirs, skillsDirs, numberedDirMdStems);
      if (resolved) targets.push(resolved);
    }
    LINK_RE.lastIndex = 0;
  }
  return targets;
}

// ---------------------------------------------------------------------------
// Graph build
// ---------------------------------------------------------------------------

/**
 * Build the directed edge list and node set from rules/*.md source files.
 *
 * @param {Set<string>} topLevelDirs
 * @param {Set<string>} skillsDirs
 * @param {Set<string>} numberedDirMdStems
 * @returns {{ nodes: Set<string>, edges: Array<{from: string, to: string}>, sourceNodes: Set<string> }}
 * @example
 * buildGraph(tld, sd, ndm) // → { nodes, edges, sourceNodes }
 */
function buildGraph(topLevelDirs, skillsDirs, numberedDirMdStems) {
  const nodes = new Set();
  const edges = [];
  const sourceNodes = new Set();

  const ruleStems = collectMdStems(RULES_DIR);
  for (const stem of ruleStems) nodes.add(stem);

  for (const stem of ruleStems) {
    const text = readFileSync(join(RULES_DIR, `${stem}.md`), 'utf8');
    const targets = extractLinks(text, topLevelDirs, skillsDirs, numberedDirMdStems);
    if (targets.length) sourceNodes.add(stem);
    for (const t of targets) {
      nodes.add(t);
      edges.push({ from: stem, to: t });
    }
  }

  return { nodes, edges, sourceNodes };
}

// ---------------------------------------------------------------------------
// PageRank
// ---------------------------------------------------------------------------

/**
 * Compute a simple PageRank score for each node.
 * rank_i = (1 - d) + d * sum_j( rank_j / outDegree_j ) for all j linking to i
 * Runs 20 iterations with damping d = 0.85.
 *
 * @param {Set<string>} nodes - All node IDs.
 * @param {Array<{from: string, to: string}>} edges - Directed edges.
 * @returns {Map<string, number>} Node ID → score.
 * @example
 * pageRank(nodes, edges) // → Map { 'drift-detection' => 1.42, ... }
 */
function pageRank(nodes, edges) {
  const DAMPING = 0.85;
  const ITERS = 20;
  const N = nodes.size;
  const nodeArr = [...nodes];

  // Initial rank
  const rank = new Map(nodeArr.map(n => [n, 1 / N]));

  // Precompute out-degree per source
  const outDeg = new Map(nodeArr.map(n => [n, 0]));
  for (const { from } of edges) outDeg.set(from, (outDeg.get(from) || 0) + 1);

  // Build inbound adjacency: to → [from, ...]
  const inbound = new Map(nodeArr.map(n => [n, []]));
  for (const { from, to } of edges) {
    if (!inbound.has(to)) inbound.set(to, []);
    inbound.get(to).push(from);
  }

  for (let iter = 0; iter < ITERS; iter++) {
    const newRank = new Map();
    for (const n of nodeArr) {
      const inboundSum = (inbound.get(n) || []).reduce((acc, src) => {
        const od = outDeg.get(src) || 1;
        return acc + (rank.get(src) || 0) / od;
      }, 0);
      newRank.set(n, (1 - DAMPING) / N + DAMPING * inboundSum);
    }
    for (const [k, v] of newRank) rank.set(k, v);
  }

  return rank;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point — builds graph, runs PageRank, reports hubs and isolated nodes.
 *
 * @returns {void}
 * @example
 * main() // → prints report or JSON to stdout
 */
function main() {
  const topLevelDirs = buildTopLevelDirSet();
  const skillsDirs = buildSkillsDirSet();
  const numberedDirMdStems = buildNumberedDirMdStems(topLevelDirs);

  const { nodes, edges, sourceNodes } = buildGraph(topLevelDirs, skillsDirs, numberedDirMdStems);

  const scores = pageRank(nodes, edges);

  // Compute inbound / outbound counts per rule stem (rules/*.md only)
  const ruleStems = new Set(collectMdStems(RULES_DIR));

  const inboundCount = new Map([...ruleStems].map(s => [s, 0]));
  const outboundCount = new Map([...ruleStems].map(s => [s, 0]));

  for (const { from, to } of edges) {
    if (ruleStems.has(to)) inboundCount.set(to, (inboundCount.get(to) || 0) + 1);
    if (ruleStems.has(from)) outboundCount.set(from, (outboundCount.get(from) || 0) + 1);
  }

  // Top 15 hubs among rule stems, by PageRank score (descending)
  const hubs = [...ruleStems]
    .map(s => ({ slug: s, score: scores.get(s) || 0, inbound: inboundCount.get(s) || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  // Isolated rules: 0 inbound AND 0 outbound
  const isolated = [...ruleStems]
    .filter(s => (inboundCount.get(s) || 0) === 0 && (outboundCount.get(s) || 0) === 0)
    .sort();

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({
      hubs: hubs.map(h => ({ slug: h.slug, score: +h.score.toFixed(4), inbound: h.inbound })),
      isolated,
    }, null, 2) + '\n');
  } else {
    console.log('');
    console.log('## Cross-link Graph Report');
    console.log('');
    console.log(`Nodes: ${nodes.size} | Edges: ${edges.length} | Rules scanned: ${ruleStems.size}`);
    console.log('');

    console.log('### Top 15 Hub Rules (promotion-to-always-load candidates)');
    console.log('');
    console.log('| Rank | Slug | PageRank Score | Inbound Links |');
    console.log('|---|---|---|---|');
    hubs.forEach((h, i) => {
      console.log(`| ${i + 1} | \`${h.slug}\` | ${h.score.toFixed(4)} | ${h.inbound} |`);
    });
    console.log('');

    console.log(`### Isolated Rules (0 inbound + 0 outbound) — ${isolated.length} deletion candidates`);
    console.log('');
    if (isolated.length === 0) {
      console.log('None — all rules are connected.');
    } else {
      for (const s of isolated) console.log(`- \`${s}\``);
    }
    console.log('');
  }

  process.exit(CI_MODE ? 0 : 0);
}

main();
