#!/usr/bin/env node
/**
 * bin/memory-manager.mjs — Unified memory system: 4-tier pyramid, confidence
 * scoring with time decay, learned forgetting, memory-aware retrieval.
 *
 * Usage:
 *   node memory-manager.mjs store <tier> <data>     Store a memory entry
 *   node memory-manager.mjs retrieve <query> [limit]  Search across tiers
 *   node memory-manager.mjs promote <id>             Promote to next tier
 *   node memory-manager.mjs decay                    Run decay pass (age all entries)
 *   node memory-manager.mjs prune [aggressiveness]   Prune low-confidence entries
 *   node memory-manager.mjs stats                    Show memory health
 *   node memory-manager.mjs consolidate              Run sleep/dream cycle
 *
 * Tiers:
 *   L1 (episodic)  — raw traces, 30-day TTL, auto-promote every 10 episodes
 *   L2 (semantic)  — abstracted facts, permanent, consolidate every 50 entries
 *   L3 (procedural)— skills/rules/agents, versioned, prune stale every 100 uses
 *   L4 (identity)  — kernel docs, permanent, manual review only
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_ROOT = join(__dirname, '..', '..', '..', '..', 'agent-memory');
const EPISODIC_DIR = join(MEMORY_ROOT, 'episodes');
const SEMANTIC_DIR = join(MEMORY_ROOT, 'semantic');
const PROCEDURAL_DIR = join(MEMORY_ROOT, 'procedural');
const ARCHIVE_DIR = join(MEMORY_ROOT, '_archived');
const METRICS_DIR = join(MEMORY_ROOT, '_metrics');
const LESSONS_FILE = join(MEMORY_ROOT, 'lessons.ndjson');

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} MemoryEntry
 * @property {string} id - Unique hash
 * @property {'L1'|'L2'|'L3'|'L4'} tier
 * @property {'fact'|'pattern'|'lesson'|'rule'|'skill'|'agent'|'episode'} kind
 * @property {string} text - Content
 * @property {number} confidence - 0.0 to 1.0
 * @property {number} successCount - Times this memory led to a good outcome
 * @property {number} failureCount - Times this memory was wrong
 * @property {number} accessCount - Times this memory was retrieved
 * @property {number} createdAt - Unix timestamp
 * @property {number} updatedAt - Unix timestamp
 * @property {number} lastAccessedAt - Unix timestamp
 * @property {string[]} tags
 * @property {string|null} supersededBy - ID of memory that replaced this
 * @property {string|null} source - Session ID or 'auto-promoted'
 */

// ── Confidence scoring ───────────────────────────────────────────────────────

/**
 * Calculate confidence with time decay.
 * Formula: base × log(1+success) × recency_decay
 * recency_decay: 1.0 at t=0, decays to 0.2 over 90 days
 */
function calculateConfidence(entry) {
  const base = entry.baseConfidence ?? 0.3;
  const successBonus = Math.max(0.1, Math.log(1 + (entry.successCount || 0)));
  const failurePenalty = 1 / (1 + (entry.failureCount || 0));

  const ageDays = (Date.now() - (entry.updatedAt || entry.createdAt)) / (1000 * 60 * 60 * 24);
  const recencyDecay = Math.max(0.2, 1.0 - (ageDays / 90) * 0.8);

  return Math.min(1.0, Math.max(0.0, base * successBonus * failurePenalty * recencyDecay));
}

function usageScore(entry) {
  const accessWeight = Math.min(1, (entry.accessCount || 0) / 10);
  const successRate = (entry.successCount || 0) / Math.max(1, (entry.successCount || 0) + (entry.failureCount || 0));
  return accessWeight * 0.5 + successRate * 0.5;
}

// ── Storage ──────────────────────────────────────────────────────────────────

function tierPath(tier) {
  switch (tier) {
    case 'L1': return EPISODIC_DIR;
    case 'L2': return SEMANTIC_DIR;
    case 'L3': return PROCEDURAL_DIR;
    case 'L4': return join(MEMORY_ROOT, '..', '..', 'plugins', 'heymegabyte-claude-skills');
    default: return EPISODIC_DIR;
  }
}

function writeEntry(entry) {
  const dir = tierPath(entry.tier);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${entry.id}.json`);
  writeFileSync(path, JSON.stringify(entry, null, 2));
}

function readEntry(id, tier) {
  const dir = tierPath(tier);
  const path = join(dir, `${id}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readAllEntries(tier) {
  const dir = tierPath(tier);
  if (!existsSync(dir)) return [];
  const entries = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    try {
      entries.push(JSON.parse(readFileSync(join(dir, file), 'utf-8')));
    } catch { /* skip corrupt */ }
  }
  return entries;
}

// ── Commands ─────────────────────────────────────────────────────────────────

function storeMemory(tier, data) {
  const id = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 12);
  const now = Date.now();
  const existing = readEntry(id, tier);

  const entry = {
    id,
    tier,
    kind: data.kind || 'fact',
    text: data.text || '',
    confidence: existing ? calculateConfidence(existing) : (data.baseConfidence || 0.3),
    baseConfidence: data.baseConfidence || 0.3,
    successCount: (existing?.successCount || 0) + (data.success ? 1 : 0),
    failureCount: (existing?.failureCount || 0) + (data.failure ? 1 : 0),
    accessCount: (existing?.accessCount || 0) + 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastAccessedAt: now,
    tags: data.tags || [],
    supersededBy: data.supersededBy || existing?.supersededBy || null,
    source: data.source || 'manual',
  };

  entry.confidence = calculateConfidence(entry);
  writeEntry(entry);
  return entry;
}

function retrieveMemory(query, limit = 10) {
  const results = [];
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  for (const tier of ['L2', 'L3', 'L1']) {
    const entries = readAllEntries(tier);
    for (const entry of entries) {
      if (entry.supersededBy) continue;
      let score = 0;
      const searchText = `${entry.text} ${entry.tags.join(' ')}`.toLowerCase();
      for (const token of tokens) {
        if (searchText.includes(token)) score += 1;
        if (entry.tags.some(t => t.toLowerCase().includes(token))) score += 2;
      }
      if (score > 0) {
        score *= entry.confidence;
        score *= usageScore(entry);
        results.push({ entry, score, tier });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function promoteMemory(id, fromTier) {
  const tiers = ['L1', 'L2', 'L3', 'L4'];
  const fromIdx = tiers.indexOf(fromTier);
  if (fromIdx < 0 || fromIdx >= tiers.length - 1) return null;

  const entry = readEntry(id, fromTier);
  if (!entry) return null;

  const newTier = tiers[fromIdx + 1];
  entry.tier = newTier;
  entry.confidence = Math.min(1.0, entry.confidence + 0.2);
  entry.updatedAt = Date.now();

  // Write to new tier
  writeEntry(entry);

  // Archive old tier copy
  const oldPath = join(tierPath(fromTier), `${id}.json`);
  if (existsSync(oldPath)) {
    const archivePath = join(ARCHIVE_DIR, `${fromTier}_${id}.json`);
    mkdirSync(ARCHIVE_DIR, { recursive: true });
    renameSync(oldPath, archivePath);
  }

  return entry;
}

function decayMemories() {
  const stats = { decayed: 0, archived: 0, promoted: 0 };

  for (const tier of ['L1', 'L2', 'L3']) {
    const entries = readAllEntries(tier);
    for (const entry of entries) {
      const newConfidence = calculateConfidence(entry);
      if (Math.abs(newConfidence - entry.confidence) > 0.01) {
        entry.confidence = newConfidence;
        entry.updatedAt = Date.now();
        writeEntry(entry);
        stats.decayed++;
      }

      // Auto-archive L1 entries >30 days old with confidence <0.1
      const ageDays = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
      if (tier === 'L1' && ageDays > 30 && entry.confidence < 0.15) {
        const oldPath = join(EPISODIC_DIR, `${entry.id}.json`);
        if (existsSync(oldPath)) {
          renameSync(oldPath, join(ARCHIVE_DIR, `expired_${entry.id}.json`));
          stats.archived++;
        }
      }

      // Auto-promote L1 entries with confidence >0.7 and ≥5 successes
      if (tier === 'L1' && entry.confidence > 0.7 && entry.successCount >= 5 && entry.accessCount >= 3) {
        promoteMemory(entry.id, 'L1');
        stats.promoted++;
      }
    }
  }

  return stats;
}

function pruneMemories(aggressiveness = 0.5) {
  const stats = { pruned: 0, archived: 0 };

  for (const tier of ['L1', 'L2']) {
    const entries = readAllEntries(tier);
    // Sort by (confidence × usage) ascending
    entries.sort((a, b) => (a.confidence * usageScore(a)) - (b.confidence * usageScore(b)));
    const cutoff = Math.floor(entries.length * aggressiveness * 0.2); // prune bottom 20% × aggressiveness

    for (let i = 0; i < Math.min(cutoff, entries.length); i++) {
      const entry = entries[i];
      const ageDays = (Date.now() - entry.lastAccessedAt) / (1000 * 60 * 60 * 24);
      if (ageDays > 60 && entry.accessCount < 3) {
        const oldPath = join(tierPath(tier), `${entry.id}.json`);
        if (existsSync(oldPath)) {
          renameSync(oldPath, join(ARCHIVE_DIR, `pruned_${entry.id}.json`));
          stats.pruned++;
        }
      }
    }
  }

  return stats;
}

function consolidateCycle() {
  console.error('[memory] Starting sleep/dream consolidation cycle...');
  const startTime = Date.now();

  // SWS Phase: Curate
  const decayStats = decayMemories();
  console.error(`[memory] SWS: ${decayStats.decayed} decayed, ${decayStats.archived} archived, ${decayStats.promoted} promoted`);

  // REM Phase: Abstract — find clusters in L1 and create L2 summaries
  let abstractsCreated = 0;
  const l1Entries = readAllEntries('L1').filter(e => !e.supersededBy);
  if (l1Entries.length >= 10) {
    // Group by kind + tags
    const clusters = {};
    for (const entry of l1Entries) {
      const key = `${entry.kind}:${entry.tags.slice(0, 3).sort().join(',')}`;
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(entry);
    }

    let abstractsCreated = 0;
    for (const [key, cluster] of Object.entries(clusters)) {
      if (cluster.length < 3) continue; // need at least 3 to abstract
      const summary = cluster.map(e => e.text).join('; ');
      storeMemory('L2', {
        kind: 'pattern',
        text: `Abstracted from ${cluster.length} episodes (${key}): ${summary.slice(0, 500)}`,
        baseConfidence: Math.min(0.6, cluster.reduce((s, e) => s + e.confidence, 0) / cluster.length),
        tags: cluster[0].tags,
        source: 'sleep-cycle-rem',
      });
      abstractsCreated++;
    }
    console.error(`[memory] REM: ${abstractsCreated} abstracts created from ${l1Entries.length} L1 entries`);
  }

  // Consolidation Phase: Connect — merge near-duplicate L2 entries
  const l2Entries = readAllEntries('L2').filter(e => !e.supersededBy);
  let merges = 0;
  for (let i = 0; i < l2Entries.length; i++) {
    for (let j = i + 1; j < l2Entries.length; j++) {
      const a = l2Entries[i];
      const b = l2Entries[j];
      const overlap = a.tags.filter(t => b.tags.includes(t)).length / Math.max(1, a.tags.length + b.tags.length);
      if (overlap > 0.7) {
        // Merge b into a
        a.text = `${a.text}; ${b.text}`.slice(0, 1000);
        a.successCount += b.successCount;
        a.accessCount += b.accessCount;
        a.confidence = Math.max(a.confidence, b.confidence);
        a.updatedAt = Date.now();
        b.supersededBy = a.id;
        writeEntry(a);
        writeEntry(b);
        merges++;
      }
    }
  }
  console.error(`[memory] Consolidation: ${merges} merges`);

  // Compaction Phase: Summarize verbose entries
  let compacted = 0;
  for (const entry of readAllEntries('L2')) {
    if (entry.text.length > 800) {
      entry.text = entry.text.slice(0, 500) + `... (compacted ${new Date().toISOString().slice(0, 10)}, was ${entry.text.length} chars)`;
      entry.updatedAt = Date.now();
      writeEntry(entry);
      compacted++;
    }
  }
  console.error(`[memory] Compaction: ${compacted} entries compacted`);

  // Prune low-value entries
  const pruneStats = pruneMemories(0.3);
  console.error(`[memory] Prune: ${pruneStats.pruned} pruned, ${pruneStats.archived} archived`);

  const duration = Date.now() - startTime;
  console.error(`[memory] Consolidation complete in ${duration}ms`);

  // Update metrics
  mkdirSync(METRICS_DIR, { recursive: true });
  const metrics = {
    lastConsolidation: new Date().toISOString(),
    duration,
    l1Count: readAllEntries('L1').length,
    l2Count: readAllEntries('L2').length,
    l3Count: readAllEntries('L3').length,
    decays: decayStats,
    abstracts: abstractsCreated,
    merges,
    compacted,
    prunes: pruneStats,
  };
  writeFileSync(join(METRICS_DIR, 'last-consolidation.json'), JSON.stringify(metrics, null, 2));

  return metrics;
}

function showStats() {
  return {
    l1Count: readAllEntries('L1').length,
    l2Count: readAllEntries('L2').length,
    l3Count: readAllEntries('L3').length,
    archivedCount: existsSync(ARCHIVE_DIR) ? readdirSync(ARCHIVE_DIR).length : 0,
    lessonsCount: existsSync(LESSONS_FILE) ? readFileSync(LESSONS_FILE, 'utf-8').split('\n').filter(Boolean).length : 0,
    lastConsolidation: existsSync(join(METRICS_DIR, 'last-consolidation.json'))
      ? JSON.parse(readFileSync(join(METRICS_DIR, 'last-consolidation.json'), 'utf-8'))
      : null,
    avgConfidenceL1: averageConfidence('L1'),
    avgConfidenceL2: averageConfidence('L2'),
  };
}

function averageConfidence(tier) {
  const entries = readAllEntries(tier).filter(e => !e.supersededBy);
  if (entries.length === 0) return 0;
  return entries.reduce((s, e) => s + e.confidence, 0) / entries.length;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const [,, command, ...args] = process.argv;

try {
  switch (command) {
    case 'store': {
      const [tier, ...rest] = args;
      const data = JSON.parse(rest.join(' '));
      const entry = storeMemory(tier, data);
      console.log(JSON.stringify(entry, null, 2));
      break;
    }
    case 'retrieve': {
      const [query, limitStr] = args;
      const results = retrieveMemory(query, parseInt(limitStr) || 10);
      for (const r of results) {
        console.log(`[${r.tier}] conf=${r.entry.confidence.toFixed(2)} score=${r.score.toFixed(2)}: ${r.entry.text.slice(0, 200)}`);
      }
      break;
    }
    case 'promote': {
      const [id, fromTier] = args;
      const result = promoteMemory(id, fromTier);
      console.log(result ? `Promoted ${id} to ${result.tier}` : `Not found: ${id}`);
      break;
    }
    case 'decay':
      console.log(JSON.stringify(decayMemories(), null, 2));
      break;
    case 'prune': {
      const agg = parseFloat(args[0]) || 0.5;
      console.log(JSON.stringify(pruneMemories(agg), null, 2));
      break;
    }
    case 'consolidate':
      console.log(JSON.stringify(consolidateCycle(), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(showStats(), null, 2));
      break;
    default:
      console.log('Usage: memory-manager.mjs {store|retrieve|promote|decay|prune|consolidate|stats} [args]');
  }
} catch (err) {
  console.error(`[memory-manager] error: ${err.message}`);
  process.exit(1);
}
