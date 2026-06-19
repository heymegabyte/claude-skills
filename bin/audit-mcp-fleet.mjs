#!/usr/bin/env node
/**
 * audit-mcp-fleet.mjs
 *
 * Four-check audit across all mcp-servers/\*\/ in the agentskills repo.
 *
 * Checks:
 *   1. registry-consistency  — disk servers vs ~/.claude/mcp-registry.json entries
 *   2. eval-coverage         — golden eval JSON file count per server (flag <3, HIGH for hardened)
 *   3. isError-semantics     — detect Resend-class bug: success-path `return { content: [...] }`
 *                              not preceded by a `res.ok` / `!res.ok` / `isError` guard
 *                              in the same handler block (MEDIUM — heuristic)
 *   4. base-vs-hardened      — list base servers that have a hardened twin (archival candidates)
 *
 * Flags carry { server, kind, confidence, detail }.
 *
 * Flags:
 *   --json   Emit structured { summary, findings: [] } to stdout
 *   --ci     Exit 1 only on HIGH-confidence findings
 *
 * @example
 * node bin/audit-mcp-fleet.mjs
 * node bin/audit-mcp-fleet.mjs --json
 * node bin/audit-mcp-fleet.mjs --ci
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve paths ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const MCP_SERVERS_DIR = join(REPO_ROOT, 'mcp-servers');
const REGISTRY_PATH = join(process.env.HOME ?? '/Users/Apple', '.claude', 'mcp-registry.json');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const CI_MODE = args.includes('--ci');

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Return sorted list of directory names under a given path.
 * @param {string} dirPath - Directory to list.
 * @returns {Promise<string[]>} Array of subdirectory names.
 */
async function listDirs(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Recursively collect all .json files under a directory.
 * @param {string} dirPath - Root to walk.
 * @returns {Promise<string[]>} Absolute paths of JSON files found.
 */
async function findJsonFiles(dirPath) {
  const results = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...(await findJsonFiles(full)));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(full);
      }
    }
  } catch {
    // ignore unreadable dirs
  }
  return results;
}

/**
 * Collect all .ts files under a directory (non-recursive past src/).
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
async function findTsFiles(dirPath) {
  const results = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        results.push(...(await findTsFiles(full)));
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        results.push(full);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

// ── isError heuristic scanner ─────────────────────────────────────────────────

/**
 * Scan a TypeScript source for Resend-class isError bug.
 *
 * The bug: a `return { content: [...] }` (success path, no isError:true) that is NOT
 * preceded by an `if (!res.ok)` / `res.ok` / `isError` guard within the same handler
 * block (within 5 lines above the return).
 *
 * Returns the count of suspicious return sites found.
 *
 * @param {string} filePath - Absolute path to the .ts file.
 * @returns {Promise<number>} Count of suspicious unguarded success returns.
 */
async function scanIsErrorBug(filePath) {
  let src;
  try {
    src = await readFile(filePath, 'utf8');
  } catch {
    return 0;
  }

  const lines = src.split('\n');
  let suspicious = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match success-path return: `return { content: [` without isError on same line
    if (
      /return\s*\{\s*content\s*:\s*\[/.test(line) &&
      !/isError/.test(line)
    ) {
      // Look back up to 5 lines for a res.ok / !res.ok / isError guard
      const lookback = Math.max(0, i - 5);
      const windowLines = lines.slice(lookback, i);
      const windowText = windowLines.join('\n');
      const hasGuard = /res\.ok|!res\.ok|isError/.test(windowText);
      if (!hasGuard) {
        suspicious++;
      }
    }
  }

  return suspicious;
}

// ── Check 1: Registry consistency ────────────────────────────────────────────

/**
 * Compare disk servers against a registry file (if present).
 * @param {string[]} diskServers - Server names found on disk.
 * @returns {Promise<import('./types').Finding[]>} Findings array.
 */
async function checkRegistryConsistency(diskServers) {
  /** @type {Array<{server:string,kind:string,confidence:string,detail:string}>} */
  const findings = [];

  if (!existsSync(REGISTRY_PATH)) {
    findings.push({
      server: '_fleet',
      kind: 'no-registry',
      confidence: 'MEDIUM',
      detail: `No registry found at ${REGISTRY_PATH}. Recommend creating mcp-servers/_registry.json as source of truth.`,
    });
    return findings;
  }

  let registry;
  try {
    const raw = await readFile(REGISTRY_PATH, 'utf8');
    registry = JSON.parse(raw);
  } catch (err) {
    findings.push({
      server: '_fleet',
      kind: 'registry-parse-error',
      confidence: 'HIGH',
      detail: `Could not parse registry at ${REGISTRY_PATH}: ${String(err)}`,
    });
    return findings;
  }

  // Registry keys may be server names or contain them
  const registryKeys = new Set(
    Array.isArray(registry)
      ? registry.map(e => e.name ?? e.id ?? String(e))
      : Object.keys(registry),
  );

  const diskSet = new Set(diskServers);

  // Servers on disk but NOT in registry
  for (const name of diskServers) {
    if (!registryKeys.has(name)) {
      findings.push({
        server: name,
        kind: 'unregistered-server',
        confidence: 'MEDIUM',
        detail: `Server "${name}" exists on disk but has no entry in mcp-registry.json.`,
      });
    }
  }

  // Registry entries with no disk dir
  for (const key of registryKeys) {
    if (!diskSet.has(key)) {
      findings.push({
        server: key,
        kind: 'orphaned-registry-entry',
        confidence: 'MEDIUM',
        detail: `Registry entry "${key}" has no corresponding directory under mcp-servers/.`,
      });
    }
  }

  return findings;
}

// ── Check 2: Eval coverage ───────────────────────────────────────────────────

/**
 * Flag servers with fewer than 3 golden eval JSON files.
 * Hardened servers get HIGH confidence; base servers get MEDIUM.
 *
 * @param {string[]} serverNames - All server directory names.
 * @returns {Promise<{findings: Array, counts: Record<string,number>}>}
 */
async function checkEvalCoverage(serverNames) {
  /** @type {Array<{server:string,kind:string,confidence:string,detail:string}>} */
  const findings = [];
  /** @type {Record<string, number>} */
  const counts = {};

  for (const name of serverNames) {
    const evalsDir = join(MCP_SERVERS_DIR, name, 'evals');
    const jsonFiles = await findJsonFiles(evalsDir);
    counts[name] = jsonFiles.length;

    if (jsonFiles.length < 3) {
      const isHardened = name.endsWith('-hardened-mcp');
      findings.push({
        server: name,
        kind: 'low-eval-coverage',
        confidence: isHardened ? 'HIGH' : 'MEDIUM',
        detail: `${jsonFiles.length} eval JSON file(s) found (need ≥3). ${isHardened ? 'Hardened server should be stable.' : 'Add golden tests to cover happy + error paths.'}`,
      });
    }
  }

  return { findings, counts };
}

// ── Check 3: isError semantics ───────────────────────────────────────────────

/**
 * Grep each server's TS source for the Resend-class isError bug.
 *
 * @param {string[]} serverNames
 * @returns {Promise<Array<{server:string,kind:string,confidence:string,detail:string}>>}
 */
async function checkIsErrorSemantics(serverNames) {
  /** @type {Array<{server:string,kind:string,confidence:string,detail:string}>} */
  const findings = [];

  for (const name of serverNames) {
    const srcDir = join(MCP_SERVERS_DIR, name, 'mcp-server', 'src');
    if (!existsSync(srcDir)) continue;

    const tsFiles = await findTsFiles(srcDir);
    let totalSuspicious = 0;
    const suspiciousFiles = [];

    for (const file of tsFiles) {
      const count = await scanIsErrorBug(file);
      if (count > 0) {
        totalSuspicious += count;
        suspiciousFiles.push(`${file.replace(MCP_SERVERS_DIR + '/', '')} (${count} site${count > 1 ? 's' : ''})`);
      }
    }

    if (totalSuspicious > 0) {
      findings.push({
        server: name,
        kind: 'missing-is-error-guard',
        confidence: 'MEDIUM',
        detail: `${totalSuspicious} unguarded success-path return(s) detected — possible Resend-class isError bug. Files: ${suspiciousFiles.join(', ')}`,
      });
    }
  }

  return findings;
}

// ── Check 4: Base vs hardened pairs ──────────────────────────────────────────

/**
 * Identify base servers that have a hardened twin (archival candidates).
 * Also flag hardened servers with no base twin (informational).
 *
 * @param {string[]} serverNames
 * @returns {{findings: Array, archivalCandidates: string[], hardenedWithoutBase: string[]}}
 */
function checkBaseVsHardened(serverNames) {
  /** @type {Array<{server:string,kind:string,confidence:string,detail:string}>} */
  const findings = [];

  const hardenedSet = new Set(serverNames.filter(n => n.endsWith('-hardened-mcp')));
  const baseSet = new Set(serverNames.filter(n => !n.endsWith('-hardened-mcp')));

  /** @type {string[]} */
  const archivalCandidates = [];
  /** @type {string[]} */
  const hardenedWithoutBase = [];

  for (const base of baseSet) {
    // Derive the expected hardened name: e.g. stripe-mcp → stripe-hardened-mcp
    const stem = base.replace(/-mcp$/, '');
    const hardened = `${stem}-hardened-mcp`;
    if (hardenedSet.has(hardened)) {
      archivalCandidates.push(base);
      findings.push({
        server: base,
        kind: 'superseded-by-hardened',
        confidence: 'MEDIUM',
        detail: `"${base}" has a hardened twin "${hardened}" — consider archiving the base version.`,
      });
    }
  }

  for (const h of hardenedSet) {
    const stem = h.replace(/-hardened-mcp$/, '');
    const base = `${stem}-mcp`;
    if (!baseSet.has(base)) {
      hardenedWithoutBase.push(h);
      findings.push({
        server: h,
        kind: 'hardened-without-base',
        confidence: 'LOW',
        detail: `"${h}" has no base twin "${base}" on disk — check if base was already removed.`,
      });
    }
  }

  return { findings, archivalCandidates, hardenedWithoutBase };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const serverNames = await listDirs(MCP_SERVERS_DIR);

  if (serverNames.length === 0) {
    const msg = `No server directories found under ${MCP_SERVERS_DIR}`;
    if (JSON_MODE) {
      process.stdout.write(JSON.stringify({ summary: { error: msg }, findings: [] }, null, 2) + '\n');
    } else {
      console.error(msg);
    }
    process.exit(1);
  }

  // Run all four checks
  const [
    registryFindings,
    { findings: evalFindings, counts: evalCounts },
    isErrorFindings,
    { findings: pairFindings, archivalCandidates, hardenedWithoutBase },
  ] = await Promise.all([
    checkRegistryConsistency(serverNames),
    checkEvalCoverage(serverNames),
    checkIsErrorSemantics(serverNames),
    Promise.resolve(checkBaseVsHardened(serverNames)),
  ]);

  const allFindings = [
    ...registryFindings,
    ...evalFindings,
    ...isErrorFindings,
    ...pairFindings,
  ];

  const highCount = allFindings.filter(f => f.confidence === 'HIGH').length;
  const mediumCount = allFindings.filter(f => f.confidence === 'MEDIUM').length;
  const lowCount = allFindings.filter(f => f.confidence === 'LOW').length;

  // Low-eval servers (for report)
  const lowEvalServers = serverNames.filter(n => (evalCounts[n] ?? 0) < 3);

  const summary = {
    servers_on_disk: serverNames.length,
    checks: {
      registry_consistency: registryFindings.length,
      eval_coverage: evalFindings.length,
      is_error_semantics: isErrorFindings.length,
      base_vs_hardened: pairFindings.length,
    },
    findings_by_confidence: { HIGH: highCount, MEDIUM: mediumCount, LOW: lowCount },
    archival_candidates: archivalCandidates,
    low_eval_servers: lowEvalServers,
    eval_counts: evalCounts,
  };

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify({ summary, findings: allFindings }, null, 2) + '\n');
  } else {
    // Human-readable output
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(' MCP Fleet Audit');
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`\nServers on disk: ${serverNames.length}`);
    console.log(serverNames.map(n => `  · ${n}`).join('\n'));

    console.log('\n── Check 1: Registry Consistency ──');
    if (registryFindings.length === 0) {
      console.log('  ✓ No registry issues');
    } else {
      for (const f of registryFindings) {
        console.log(`  [${f.confidence}] ${f.kind}: ${f.detail}`);
      }
    }

    console.log('\n── Check 2: Eval Coverage ──');
    for (const [name, count] of Object.entries(evalCounts).sort()) {
      const flag = count < 3 ? ' ⚠' : '';
      console.log(`  ${name}: ${count} eval JSON file(s)${flag}`);
    }
    if (lowEvalServers.length > 0) {
      console.log(`\n  Servers with <3 evals (${lowEvalServers.length}):`);
      for (const name of lowEvalServers) {
        const isHardened = name.endsWith('-hardened-mcp');
        console.log(`    [${isHardened ? 'HIGH' : 'MEDIUM'}] ${name}: ${evalCounts[name] ?? 0} file(s)`);
      }
    }

    console.log('\n── Check 3: isError Semantics ──');
    if (isErrorFindings.length === 0) {
      console.log('  ✓ No Resend-class isError bugs detected');
    } else {
      for (const f of isErrorFindings) {
        console.log(`  [${f.confidence}] ${f.server}: ${f.detail}`);
      }
    }

    console.log('\n── Check 4: Base vs Hardened ──');
    if (archivalCandidates.length > 0) {
      console.log(`  Base servers superseded by a hardened twin (archival candidates):`);
      for (const name of archivalCandidates) {
        console.log(`    · ${name}`);
      }
    }
    if (hardenedWithoutBase.length > 0) {
      console.log(`  Hardened servers with no base twin:`);
      for (const name of hardenedWithoutBase) {
        console.log(`    · ${name}`);
      }
    }
    if (archivalCandidates.length === 0 && hardenedWithoutBase.length === 0) {
      console.log('  ✓ All pairs balanced');
    }

    console.log('\n── Summary ──');
    console.log(`  Total findings: ${allFindings.length}  (HIGH: ${highCount}, MEDIUM: ${mediumCount}, LOW: ${lowCount})`);
    console.log(`  Registry: ${registryFindings.length} finding(s)`);
    console.log(`  Eval coverage: ${evalFindings.length} server(s) with <3 evals`);
    console.log(`  isError semantics: ${isErrorFindings.length} suspicious server(s)`);
    console.log(`  Base/hardened pairs: ${archivalCandidates.length} archival candidate(s)\n`);
  }

  // --ci exits 1 only on HIGH findings
  if (CI_MODE && highCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('audit-mcp-fleet: fatal error:', err);
  process.exit(1);
});
