#!/usr/bin/env node
/**
 * validate-data-residency.mjs — data residency / jurisdiction validator.
 *
 * Rule: every D1 database and R2 bucket in wrangler.toml / wrangler.jsonc MUST
 *       declare a jurisdiction matching the project's declared default.
 *       Absence of --jurisdiction is a one-way compliance door.
 *       Per rules/data-residency-by-default.md.
 *
 * Usage:
 *   node validate-data-residency.mjs [--fix] [--dry-run] [--ci] [--root=<dir>]
 *                                    [--jurisdiction=eu|us]
 *
 * Flags:
 *   --fix                Insert missing jurisdiction lines (with prompt)
 *   --dry-run            Print what would change; never write files
 *   --ci                 Machine-readable NDJSON to stdout; human summary to stderr
 *   --root=DIR           Project root (default: cwd)
 *   --jurisdiction=eu|us Override: treat this as required jurisdiction (default: eu)
 *
 * Config file: <root>/.claude/data-residency.json
 *   { "default": "eu" | "us" | "skip" }
 *   "skip"  = project is explicitly US-only; validator exits 0 with a note.
 *
 * Exit codes:
 *   0  All bindings have correct jurisdiction (or project is skip)
 *   1  Missing or incorrect jurisdiction
 *   2  Internal error / wrangler config not found
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createInterface } from 'node:readline';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function argVal(name) {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
}

const FIX        = args.includes('--fix');
const DRY_RUN    = args.includes('--dry-run');
const CI         = args.includes('--ci');
const rootArg    = argVal('root');
const ROOT       = rootArg ?? process.cwd();
const JX_OVERRIDE = argVal('jurisdiction'); // 'eu' | 'us' | null

// ─── Output helpers ───────────────────────────────────────────────────────────

function ndjson(obj) {
  process.stdout.write(JSON.stringify({ ...obj, ts: new Date().toISOString() }) + '\n');
}

function out(msg) {
  if (!CI) process.stderr.write(`${msg}\n`);
}

function banner(msg) {
  if (!CI) out(`\n${msg}\n${'─'.repeat(62)}`);
}

// ─── Config ───────────────────────────────────────────────────────────────────

/** Read <root>/.claude/data-residency.json if it exists. */
function readProjectConfig() {
  const cfgPath = join(ROOT, '.claude', 'data-residency.json');
  if (!existsSync(cfgPath)) return null;
  try {
    return JSON.parse(readFileSync(cfgPath, 'utf8'));
  } catch {
    return null;
  }
}

/** Resolve required jurisdiction: CLI override > project config > 'eu' (safe default). */
function resolveRequiredJurisdiction(projectCfg) {
  if (JX_OVERRIDE) return JX_OVERRIDE;
  if (projectCfg?.default) return projectCfg.default;
  return 'eu'; // The rule: default EU — it's the stricter regime
}

// ─── Wrangler config parsing ──────────────────────────────────────────────────

/** Find wrangler config in project root. Returns { path, format } or null. */
function findWranglerConfig() {
  for (const name of ['wrangler.toml', 'wrangler.jsonc', 'wrangler.json']) {
    const p = join(ROOT, name);
    if (existsSync(p)) return { path: p, format: name.endsWith('.toml') ? 'toml' : 'json' };
  }
  return null;
}

/**
 * Minimal TOML parser for wrangler.toml [[section]] blocks.
 * Only handles the subset we need: [[d1_databases]] / [[r2_buckets]] arrays
 * with simple key = "value" assignments. Does not handle nested tables.
 */
function parseTomlBindings(src) {
  const d1 = [];
  const r2 = [];

  // Split into [[...]] sections
  // Each section starts with [[header]] and ends before the next [[header]] or EOF
  const sectionRe = /^\s*\[\[(\w+)\]\]\s*$/gm;
  const sections = [];
  let match;

  while ((match = sectionRe.exec(src)) !== null) {
    sections.push({ type: match[1], startIndex: match.index, startLine: src.slice(0, match.index).split('\n').length });
  }

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const end = i + 1 < sections.length ? sections[i + 1].startIndex : src.length;
    const block = src.slice(s.startIndex, end);

    if (s.type !== 'd1_databases' && s.type !== 'r2_buckets') continue;

    // Parse key = "value" pairs from block
    const kvRe = /^\s*(\w+)\s*=\s*"([^"]*)"\s*$/gm;
    const props = {};
    let kvMatch;
    while ((kvMatch = kvRe.exec(block)) !== null) {
      props[kvMatch[1]] = { value: kvMatch[2], blockOffset: kvMatch.index, lineInBlock: block.slice(0, kvMatch.index).split('\n').length };
    }

    const entry = {
      type: s.type,
      headerLine: s.startLine,
      binding: props.binding?.value ?? null,
      name: props.database_name?.value ?? props.bucket_name?.value ?? null,
      jurisdiction: props.jurisdiction?.value ?? null,
      jurisdictionLine: props.jurisdiction ? s.startLine + props.jurisdiction.lineInBlock - 1 : null,
      blockSrc: block,
      blockStart: s.startIndex,
      blockEnd: end,
    };

    if (s.type === 'd1_databases') d1.push(entry);
    else r2.push(entry);
  }

  return { d1, r2 };
}

/** Best-effort JSON/JSONC extractor for d1_databases / r2_buckets arrays. */
function parseJsonBindings(src) {
  // Strip line comments for JSONC
  const stripped = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  let obj;
  try {
    obj = JSON.parse(stripped);
  } catch {
    return { d1: [], r2: [] };
  }

  const d1 = (obj.d1_databases ?? []).map(b => ({
    type: 'd1_databases',
    binding: b.binding ?? null,
    name: b.database_name ?? null,
    jurisdiction: b.jurisdiction ?? null,
  }));
  const r2 = (obj.r2_buckets ?? []).map(b => ({
    type: 'r2_buckets',
    binding: b.binding ?? null,
    name: b.bucket_name ?? null,
    jurisdiction: b.jurisdiction ?? null,
  }));
  return { d1, r2 };
}

// ─── Violation detection ──────────────────────────────────────────────────────

function checkBindings(bindings, required) {
  const violations = [];
  for (const b of bindings) {
    if (!b.jurisdiction) {
      violations.push({
        id: 'missing-jurisdiction',
        label: `Missing jurisdiction on ${b.type} binding "${b.binding ?? b.name}" — add jurisdiction = "${required}"`,
        binding: b.binding ?? b.name,
        type: b.type,
        required,
        found: null,
        headerLine: b.headerLine ?? null,
      });
    } else if (b.jurisdiction !== required) {
      violations.push({
        id: 'wrong-jurisdiction',
        label: `Incorrect jurisdiction "${b.jurisdiction}" on ${b.type} binding "${b.binding ?? b.name}" — expected "${required}"`,
        binding: b.binding ?? b.name,
        type: b.type,
        required,
        found: b.jurisdiction,
        headerLine: b.headerLine ?? null,
      });
    }
  }
  return violations;
}

// ─── Fix logic (TOML only) ────────────────────────────────────────────────────

/**
 * Insert `jurisdiction = "<jx>"` after the last key=value line in each
 * violating [[d1_databases]] / [[r2_buckets]] block.
 * Works on TOML source only.
 */
function applyTomlFix(src, d1, r2, required) {
  const allBindings = [...d1, ...r2];
  // Sort by blockEnd descending so we can splice from the end without invalidating offsets
  const violating = allBindings
    .filter(b => !b.jurisdiction)
    .sort((a, b) => b.blockEnd - a.blockEnd);

  let fixed = src;
  for (const b of violating) {
    const block = b.blockSrc;
    // Find last key=value line in block (excluding the [[header]])
    const kvLines = block.split('\n');
    let insertAt = -1;
    for (let i = kvLines.length - 1; i >= 0; i--) {
      if (/^\s*\w+\s*=/.test(kvLines[i])) { insertAt = i; break; }
    }

    if (insertAt === -1) continue; // no key=value found; skip

    // Rebuild block with jurisdiction line inserted after the last kv line
    kvLines.splice(insertAt + 1, 0, `jurisdiction = "${required}"`);
    const newBlock = kvLines.join('\n');

    fixed = fixed.slice(0, b.blockStart) + newBlock + fixed.slice(b.blockEnd);
  }

  return fixed;
}

async function promptConfirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question(`${question} [y/N] `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  banner('validate-data-residency  ·  data-residency-by-default');

  // Load project config
  const projectCfg = readProjectConfig();
  const required = resolveRequiredJurisdiction(projectCfg);

  // "skip" = project is explicitly US-only and has opted out
  if (required === 'skip') {
    const msg = { validator: 'validate-data-residency', status: 'skipped', reason: 'data-residency.json declares skip (US-only project)', root: ROOT };
    if (CI) ndjson(msg);
    else out('[skip] Project declared US-only (data-residency.json → skip). No jurisdiction check performed.');
    process.exit(0);
  }

  out(`  Required jurisdiction: ${required}`);
  out(`  Source: ${JX_OVERRIDE ? 'CLI override' : projectCfg ? '.claude/data-residency.json' : 'default (eu)'}`);

  // Find wrangler config
  const wrangler = findWranglerConfig();
  if (!wrangler) {
    const msg = {
      validator: 'validate-data-residency',
      status: 'skipped',
      reason: 'No wrangler.toml / wrangler.jsonc / wrangler.json found in project root',
      root: ROOT,
    };
    if (CI) ndjson(msg);
    else out('[skip] No wrangler config found. Is this a Cloudflare Workers project?');
    process.exit(0);
  }

  const wranglerRel = relative(ROOT, wrangler.path);
  out(`  Wrangler config: ${wranglerRel}\n`);

  const src = readFileSync(wrangler.path, 'utf8');
  const { d1, r2 } = wrangler.format === 'toml'
    ? parseTomlBindings(src)
    : parseJsonBindings(src);

  const totalBindings = d1.length + r2.length;
  out(`  Found ${d1.length} D1 binding(s), ${r2.length} R2 bucket(s)`);

  if (totalBindings === 0) {
    const msg = { validator: 'validate-data-residency', status: 'pass', message: 'No D1/R2 bindings found — nothing to check', bindings: 0 };
    if (CI) ndjson(msg);
    else out('\n[pass] No D1 or R2 bindings found. Nothing to validate.');
    process.exit(0);
  }

  const violations = [
    ...checkBindings(d1, required),
    ...checkBindings(r2, required),
  ];

  if (violations.length === 0) {
    const msg = { validator: 'validate-data-residency', status: 'pass', bindings: totalBindings, jurisdiction: required };
    if (CI) ndjson(msg);
    else out(`\n[pass] All ${totalBindings} binding(s) have jurisdiction = "${required}".`);
    process.exit(0);
  }

  // Report violations
  out('');
  for (const v of violations) {
    const record = {
      validator: 'validate-data-residency',
      status: 'violation',
      id: v.id,
      binding: v.binding,
      type: v.type,
      required: v.required,
      found: v.found,
      file: wranglerRel,
      line: v.headerLine ?? null,
      label: v.label,
    };
    if (CI) ndjson(record);
    else {
      const lineRef = v.headerLine ? `:${v.headerLine}` : '';
      out(`  [${v.id}] ${wranglerRel}${lineRef}  [${v.type}] ${v.binding ?? 'unnamed'}`);
      out(`    ${v.label}`);
      out('');
    }
  }

  const summary = {
    validator: 'validate-data-residency',
    status: 'fail',
    violations: violations.length,
    bindings: totalBindings,
    required,
    file: wranglerRel,
  };
  if (CI) ndjson(summary);
  else out(`[FAIL] ${violations.length} violation(s). Every D1/R2 binding needs jurisdiction = "${required}".`);

  // JSONC/JSON: no auto-fix (structural rewrite is risky without a full parser)
  if (wrangler.format !== 'toml' && (FIX || DRY_RUN)) {
    out('\n[note] --fix / --dry-run only supported for wrangler.toml. Edit wrangler.jsonc manually.');
    process.exit(1);
  }

  if (DRY_RUN) {
    for (const v of violations) {
      const record = { validator: 'validate-data-residency', action: 'dry-run-would-fix', binding: v.binding, type: v.type };
      if (CI) ndjson(record);
      else out(`  [dry-run] Would insert jurisdiction = "${required}" for ${v.type} binding "${v.binding ?? 'unnamed'}"`);
    }
    process.exit(1);
  }

  if (FIX) {
    const missingOnly = violations.filter(v => v.id === 'missing-jurisdiction');
    const wrongJx = violations.filter(v => v.id === 'wrong-jurisdiction');

    if (wrongJx.length > 0 && !CI) {
      out(`\n[warn] ${wrongJx.length} binding(s) have a different jurisdiction set. --fix only inserts missing lines.`);
      out('       Manual correction required for wrong-jurisdiction violations.');
    }

    if (missingOnly.length === 0) {
      out('[info] No missing-jurisdiction violations to auto-fix (all are wrong-jurisdiction — fix manually).');
      process.exit(1);
    }

    const confirmed = CI
      ? true
      : await promptConfirm(`\nInsert jurisdiction = "${required}" for ${missingOnly.length} binding(s) in ${wranglerRel}?`);

    if (!confirmed) {
      out('[aborted] No files modified.');
      process.exit(1);
    }

    const fixedSrc = applyTomlFix(src, d1, r2, required);
    if (fixedSrc === src) {
      out('[info] No changes needed (applyFix was a no-op — verify manually).');
    } else {
      writeFileSync(wrangler.path, fixedSrc, 'utf8');
      const record = { validator: 'validate-data-residency', status: 'fixed', file: wranglerRel, bindings_fixed: missingOnly.length };
      if (CI) ndjson(record);
      else out(`\n[fixed] Inserted jurisdiction = "${required}" in ${missingOnly.length} binding(s) in ${wranglerRel}.`);
    }

    // Exit 1 if wrong-jurisdiction violations remain
    if (wrongJx.length > 0) {
      out(`[warn] ${wrongJx.length} wrong-jurisdiction violation(s) still require manual correction.`);
      process.exit(1);
    }
    process.exit(0);
  }

  process.exit(1);
}

main().catch(e => {
  process.stderr.write(`[error] ${e.stack ?? e.message}\n`);
  process.exit(2);
});
