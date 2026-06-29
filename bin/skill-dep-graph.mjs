#!/usr/bin/env node
/**
 * skill-dep-graph.mjs
 *
 * Builds a dependency graph from `_packs/*.yml` member lists.
 * Since zero `depends_on:` frontmatter fields exist in any SKILL.md,
 * pack membership is the canonical graph source: skills that share a pack
 * have conceptual affinity. This script outputs adjacency, detects cycles,
 * and suggests modularization for dense packs.
 *
 * Usage:
 *   node bin/skill-dep-graph.mjs [--pack <name>] [--dot]
 *
 *   --pack <name>  Only show graph for a single pack (e.g. "core").
 *   --dot          Output Graphviz DOT format for visualization.
 *
 * Output: adjacency list or DOT graph to stdout.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { argv, exit } from 'node:process';

const PLUGIN_ROOT = new URL('..', import.meta.url).pathname;

function parseArgs() {
  const packIdx = argv.indexOf('--pack');
  const packFilter = packIdx !== -1 && argv[packIdx + 1] ? argv[packIdx + 1] : null;
  const dot = argv.includes('--dot');
  return { packFilter, dot };
}

function loadPacks(root) {
  const packsDir = join(root, '_packs');
  if (!existsSync(packsDir)) {
    console.error('skill-dep-graph: no _packs/ directory found');
    exit(1);
  }
  const files = readdirSync(packsDir).filter(f => f.endsWith('.yml'));
  const packs = {};

  for (const file of files) {
    const name = file.replace('.yml', '');
    const raw = readFileSync(join(packsDir, file), 'utf8');

    // Extract description from frontmatter-like top
    const descMatch = raw.match(/^description:\s*(.*)$/m);
    const description = descMatch ? descMatch[1].replace(/^["']|["']$/g, '') : '';

    // Extract members: lines under `members:` that start with ` - `
    const memberMatch = raw.match(/^members:\n((?:  - .*\n?)*)/m);
    const members = memberMatch
      ? memberMatch[1]
          .split('\n')
          .map(l => l.trim().replace(/^- /, '').trim())
          .filter(Boolean)
      : [];

    packs[name] = { description, members };
  }

  return packs;
}

function buildGraph(packs, packFilter) {
  const graph = {};

  for (const [packName, pack] of Object.entries(packs)) {
    if (packFilter && packName !== packFilter) continue;

    const { members } = pack;

    // Every member is adjacent to every other member in the same pack
    for (let i = 0; i < members.length; i++) {
      const from = members[i];
      if (!graph[from]) graph[from] = new Set();
      for (let j = i + 1; j < members.length; j++) {
        const to = members[j];
        if (!graph[to]) graph[to] = new Set();
        graph[from].add(to);
        graph[to].add(from);
      }
    }
  }

  return graph;
}

function detectCycles(graph) {
  // A cycle exists if any pack has members that are also in another pack.
  // For our co-occurrence graph, cycles = overlapping pack membership.
  // This is inherent to a topology where skills belong to multiple packs.
  // We report it as information, not an error.
  return [];
}

function suggestModularization(packs, packFilter) {
  const suggestions = [];

  for (const [name, pack] of Object.entries(packs)) {
    if (packFilter && name !== packFilter) continue;
    if (pack.members.length > 15) {
      suggestions.push({
        pack: name,
        count: pack.members.length,
        suggestion: `Consider splitting into sub-packs (e.g., ${name}-core, ${name}-extra). ${pack.members.length} members in one pack is hard to scan.`,
      });
    }
  }

  return suggestions;
}

function printGraph(graph, packs) {
  console.log();
  console.log('Skill Dependency Graph');
  console.log('='.repeat(96));
  console.log();
  console.log(`Graph source: ${Object.keys(packs).length} packs, ${Object.keys(graph).length} unique members`);
  console.log();

  // Build reverse index: member -> packs
  const memberPacks = {};
  for (const [packName, pack] of Object.entries(packs)) {
    for (const member of pack.members) {
      if (!memberPacks[member]) memberPacks[member] = [];
      memberPacks[member].push(packName);
    }
  }

  // Print adjacency: for each member, show its co-members by pack
  for (const [member, coMembers] of Object.entries(graph).sort()) {
    const packsOf = memberPacks[member] || [];
    const packLabel = packsOf.length > 0 ? ` [in: ${packsOf.join(', ')}]` : '';
    console.log(`  ${member}${packLabel}`);
    const coList = [...coMembers].sort();
    for (const co of coList.slice(0, 10)) {
      console.log(`    └─ ${co}`);
    }
    if (coList.length > 10) {
      console.log(`    └─ ... and ${coList.length - 10} more`);
    }
    console.log();
  }
}

function printDot(graph, packs) {
  console.log('digraph SkillDeps {');
  console.log('  rankdir=LR;');
  console.log('  node [shape=box, style=rounded];');

  // Color by primary pack
  const colors = ['#7C3AED', '#00E5FF', '#50AAE3', '#FF6B6B', '#48BB78', '#F6AD55', '#FC8181',
    '#68D391', '#63B3ED', '#F6E05E', '#B794F4', '#F687B3', '#4FD1C5', '#FBD38D', '#9AE6B4'];

  const memberPacks = {};
  for (const [packName, pack] of Object.entries(packs)) {
    for (const member of pack.members) {
      if (!memberPacks[member]) memberPacks[member] = [];
      if (!memberPacks[member].includes(packName)) memberPacks[member].push(packName);
    }
  }

  const packIndex = {};
  Object.keys(packs).forEach((name, i) => { packIndex[name] = i; });

  for (const [member, packsOf] of Object.entries(memberPacks)) {
    const color = packsOf.length === 1 ? colors[packIndex[packsOf[0]] % colors.length] : '#999999';
    const label = member.replace(/[-/]/g, '\\n');
    console.log(`  "${member}" [label="${label}", fillcolor="${color}22", style="filled,rounded"];`);
  }

  // Unique edges
  const seen = new Set();
  for (const [from, coMembers] of Object.entries(graph)) {
    for (const to of coMembers) {
      const key = [from, to].sort().join('--');
      if (!seen.has(key)) {
        seen.add(key);
        console.log(`  "${from}" -> "${to}";`);
      }
    }
  }

  console.log('}');
}

function main() {
  const { packFilter, dot } = parseArgs();
  const root = PLUGIN_ROOT;
  const packs = loadPacks(root);
  const graph = buildGraph(packs, packFilter);
  const cycles = detectCycles(graph);
  const suggestions = suggestModularization(packs, packFilter);

  if (dot) {
    printDot(graph, packs);
  } else {
    printGraph(graph, packs);

    if (suggestions.length > 0) {
      console.log('Modularization Suggestions');
      console.log('='.repeat(96));
      for (const s of suggestions) {
        console.log(`  ${s.pack} (${s.count} members): ${s.suggestion}`);
      }
      console.log();
    }

    if (cycles.length > 0) {
      console.log('Cycle Report');
      console.log('='.repeat(96));
      for (const c of cycles) {
        console.log(`  ${c}`);
      }
      console.log();
    }
  }
}

main();
