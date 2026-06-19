#!/usr/bin/env node
/**
 * audit-all.mjs — umbrella advisory audit dashboard.
 *
 * Runs every advisory audit script in the repo and prints a ONE-LINE summary
 * per script: `name: N findings (H/M/L)`. Resilient — if a script lacks
 * --json support, errors, or produces non-JSON, it prints
 * `name: (skipped: <reason>)` and continues. Never crashes.
 *
 * Flags:
 *   --json   Emit a machine-readable dashboard object to stdout instead of
 *            the human table. Format:
 *            { rows: [{ name, total, high, medium, low, status }], totals: {...} }
 *   --ci     Always exit 0 (purely informational — never blocks CI).
 *
 * Zero external deps — uses only node:child_process, node:path, node:url.
 *
 * @example
 * node bin/audit-all.mjs
 * node bin/audit-all.mjs --json
 * node bin/audit-all.mjs --ci
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Paths + CLI flags
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = __dirname;

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
// --ci is acknowledged; we always exit 0 regardless (see bottom)

/**
 * The ordered list of advisory audit scripts to run.
 * Each entry carries the filename and a label for display.
 * @type {Array<{ script: string, label: string }>}
 */
const AUDITS = [
  { script: 'audit-crosslink-graph.mjs',      label: 'crosslink-graph' },
  { script: 'audit-mcp-fleet.mjs',            label: 'mcp-fleet' },
  { script: 'audit-rule-metadata.mjs',        label: 'rule-metadata' },
  { script: 'audit-skill-authoring.mjs',      label: 'skill-authoring' },
  { script: 'skill-health-report.mjs',        label: 'skill-health' },
  { script: 'audit-contradictions.mjs',       label: 'contradictions' },
  { script: 'audit-near-duplicates.mjs',      label: 'near-duplicates' },
  { script: 'audit-trigger-collisions.mjs',   label: 'trigger-collisions' },
  { script: 'audit-skill-discoverability.mjs', label: 'skill-discoverability' },
  { script: 'audit-path-scope.mjs',            label: 'path-scope' },
];

// ---------------------------------------------------------------------------
// JSON extraction helpers — each script has a different shape
// ---------------------------------------------------------------------------

/**
 * Extract finding counts { total, high, medium, low } from a parsed JSON
 * object returned by a specific audit script.
 *
 * @param {string} label - The script's label (used to branch on shape).
 * @param {unknown} data - Parsed JSON from the script's --json output.
 * @returns {{ total: number, high: number, medium: number, low: number }}
 *
 * @example
 * extractCounts('mcp-fleet', { summary: { findings_by_confidence: { HIGH: 2, MEDIUM: 3, LOW: 1 } } })
 * // → { total: 6, high: 2, medium: 3, low: 1 }
 */
function extractCounts(label, data) {
  if (!data || typeof data !== 'object') return { total: 0, high: 0, medium: 0, low: 0 };

  const d = /** @type {Record<string, unknown>} */ (data);

  switch (label) {

    // { hubs: [...], isolated: [...] }
    // No H/M/L buckets — isolated count is the advisory signal
    case 'crosslink-graph': {
      const isolated = Array.isArray(d['isolated']) ? d['isolated'].length : 0;
      return { total: isolated, high: 0, medium: isolated, low: 0 };
    }

    // { summary: { findings_by_confidence: { HIGH, MEDIUM, LOW } }, findings: [] }
    case 'mcp-fleet': {
      const sum = (d['summary'] ?? {});
      const conf = (/** @type {Record<string,unknown>} */ (sum))['findings_by_confidence'] ?? {};
      const c = /** @type {Record<string, number>} */ (conf);
      const h = Number(c['HIGH'] ?? 0);
      const m = Number(c['MEDIUM'] ?? 0);
      const l = Number(c['LOW'] ?? 0);
      return { total: h + m + l, high: h, medium: m, low: l };
    }

    // { summary: { scanned, flagged, byKind }, findings: [{ confidence }] }
    case 'rule-metadata': {
      const findings = Array.isArray(d['findings']) ? d['findings'] : [];
      const h = findings.filter(f => /** @type {Record<string,unknown>} */ (f)['confidence'] === 'HIGH').length;
      const m = findings.filter(f => /** @type {Record<string,unknown>} */ (f)['confidence'] === 'MEDIUM').length;
      const lo = findings.filter(f => /** @type {Record<string,unknown>} */ (f)['confidence'] === 'LOW').length;
      return { total: findings.length, high: h, medium: m, low: lo };
    }

    // { findings: { HIGH, MEDIUM, total }, items: [...] }
    case 'skill-authoring': {
      const fObj = (d['findings'] ?? {});
      const fo = /** @type {Record<string, number>} */ (fObj);
      const h = Number(fo['HIGH'] ?? 0);
      const m = Number(fo['MEDIUM'] ?? 0);
      const tot = Number(fo['total'] ?? h + m);
      return { total: tot, high: h, medium: m, low: 0 };
    }

    // { skills: [...], reviewCandidates: [...] }
    // No H/M/L: reviewCandidates is the advisory metric
    case 'skill-health': {
      const rc = Array.isArray(d['reviewCandidates']) ? d['reviewCandidates'].length : 0;
      return { total: rc, high: 0, medium: rc, low: 0 };
    }

    // { totalCandidates, candidates: [...] }  — all MEDIUM
    case 'contradictions': {
      const tot = Number(d['totalCandidates'] ?? 0);
      return { total: tot, high: 0, medium: tot, low: 0 };
    }

    // { summary: { candidateCount, ... }, pairs: [...] }
    case 'near-duplicates': {
      const sum = (d['summary'] ?? {});
      const tot = Number(/** @type {Record<string,unknown>} */ (sum)['candidateCount'] ?? 0);
      return { total: tot, high: 0, medium: tot, low: 0 };
    }

    // { summary: { collisionCount, highCollisions, ... }, collisions: [...] }
    case 'trigger-collisions': {
      const sum = (d['summary'] ?? {});
      const s = /** @type {Record<string,number>} */ (sum);
      const h = Number(s['highCollisions'] ?? 0);
      const tot = Number(s['collisionCount'] ?? 0);
      const m = tot - h;
      return { total: tot, high: h, medium: m < 0 ? 0 : m, low: 0 };
    }

    // { summary: { scanned, flagged, byKind }, findings: [{ confidence }] }
    case 'skill-discoverability': {
      const findings = Array.isArray(d['findings']) ? d['findings'] : [];
      const h = findings.filter(f => /** @type {Record<string,unknown>} */ (f)['confidence'] === 'HIGH').length;
      const m = findings.filter(f => /** @type {Record<string,unknown>} */ (f)['confidence'] === 'MEDIUM').length;
      const lo = findings.filter(f => /** @type {Record<string,unknown>} */ (f)['confidence'] === 'LOW').length;
      return { total: findings.length, high: h, medium: m, low: lo };
    }

    default:
      return { total: 0, high: 0, medium: 0, low: 0 };
  }
}

// ---------------------------------------------------------------------------
// Run one audit script
// ---------------------------------------------------------------------------

/**
 * @typedef {{ name: string, total: number, high: number, medium: number, low: number, status: 'ok' | 'skipped', skipReason?: string }} AuditRow
 */

/**
 * Run a single audit script with --json and return a parsed row.
 * Never throws — errors are captured as skipped rows.
 *
 * @param {{ script: string, label: string }} entry
 * @returns {AuditRow}
 *
 * @example
 * runAudit({ script: 'audit-contradictions.mjs', label: 'contradictions' })
 * // → { name: 'contradictions', total: 5, high: 0, medium: 5, low: 0, status: 'ok' }
 */
function runAudit({ script, label }) {
  const scriptPath = join(BIN_DIR, script);

  // Write stdout to a temp file to avoid pipe-buffer truncation on large outputs
  // (Node v26 pipe buffering caps at ~64KB when parent can't consume fast enough).
  const tmpFile = join(tmpdir(), `audit-all-${randomBytes(8).toString('hex')}.json`);
  let stdout;
  try {
    const fd = openSync(tmpFile, 'w');
    execFileSync('node', [scriptPath, '--json'], {
      stdio: ['ignore', fd, 'pipe'],
      timeout: 30_000,
    });
    // fd is closed automatically when the child exits (Node passes it directly)
    stdout = readFileSync(tmpFile, 'utf8');
  } catch (err) {
    // Try reading partial output before giving up
    try { stdout = readFileSync(tmpFile, 'utf8'); } catch { stdout = ''; }
    if (!stdout) {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      const reason =
        err instanceof Error
          ? err.message.split('\n')[0].slice(0, 120)
          : String(err).slice(0, 120);
      return { name: label, total: 0, high: 0, medium: 0, low: 0, status: 'skipped', skipReason: `exec error: ${reason}` };
    }
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return { name: label, total: 0, high: 0, medium: 0, low: 0, status: 'skipped', skipReason: 'non-JSON output' };
  }

  const counts = extractCounts(label, parsed);
  return { name: label, ...counts, status: 'ok' };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point — runs all audits and prints the dashboard.
 *
 * @returns {void}
 *
 * @example
 * main()
 * // prints:
 * // ── Advisory Audit Dashboard ─────────────────────────────────────────────
 * //   crosslink-graph        :   3 findings (H:0 M:3 L:0)
 * //   ...
 * //   TOTAL                  :  42 findings (H:2 M:38 L:2)
 */
function main() {
  /** @type {AuditRow[]} */
  const rows = AUDITS.map(entry => runAudit(entry));

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total;
      acc.high += r.high;
      acc.medium += r.medium;
      acc.low += r.low;
      return acc;
    },
    { total: 0, high: 0, medium: 0, low: 0 },
  );

  if (JSON_MODE) {
    process.stdout.write(
      JSON.stringify({ rows, totals }, null, 2) + '\n',
    );
  } else {
    const WIDTH = 28;
    const pad = (s, w) => String(s).padEnd(w);

    console.log('\n── Advisory Audit Dashboard ─────────────────────────────────────────────');
    for (const r of rows) {
      if (r.status === 'skipped') {
        console.log(`  ${pad(r.name, WIDTH)}: (skipped: ${r.skipReason ?? 'unknown'})`);
      } else {
        console.log(
          `  ${pad(r.name, WIDTH)}: ${String(r.total).padStart(4)} findings (H:${r.high} M:${r.medium} L:${r.low})`,
        );
      }
    }
    console.log(`  ${'─'.repeat(WIDTH + 2)}`);
    console.log(
      `  ${pad('TOTAL', WIDTH)}: ${String(totals.total).padStart(4)} findings (H:${totals.high} M:${totals.medium} L:${totals.low})`,
    );
    console.log('');
  }

  // Always exit 0 — purely informational, never blocks CI
  process.exit(0);
}

main();
