#!/usr/bin/env node
/**
 * validate-fail-mode.mjs — enforces fail-fast-build-fail-soft-prod rule.
 *
 * Rule: auth + payment paths MUST throw 401/403, never safeParse. Per
 *       rules/fail-fast-build-fail-soft-prod.md §"The one exception".
 *
 * Usage:
 *   node validate-fail-mode.mjs [--fix] [--dry-run] [--ci] [--root=<dir>]
 *
 * Flags:
 *   --fix       Auto-rewrite safeParse → parse in auth/payment files (with prompt)
 *   --dry-run   Print what would change; never write files
 *   --ci        Machine-readable NDJSON to stdout; human summary to stderr
 *   --root=DIR  Project root (default: cwd)
 *
 * Exit codes:
 *   0  No violations (or all fixed)
 *   1  Violations found
 *   2  Internal error
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { createInterface } from 'node:readline';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FIX     = args.includes('--fix');
const DRY_RUN = args.includes('--dry-run');
const CI      = args.includes('--ci');
const rootArg = args.find(a => a.startsWith('--root='));
const ROOT    = rootArg ? rootArg.slice(7) : process.cwd();

// ─── Output helpers ───────────────────────────────────────────────────────────

function ndjson(obj) {
  process.stdout.write(JSON.stringify({ ...obj, ts: new Date().toISOString() }) + '\n');
}

function err(msg) {
  process.stderr.write(`${msg}\n`);
}

function pass(msg) {
  if (!CI) err(`  ✓ ${msg}`);
}

function fail(msg) {
  if (!CI) err(`  ✗ ${msg}`);
}

function banner(msg) {
  if (!CI) err(`\n${msg}\n${'─'.repeat(62)}`);
}

// ─── Filesystem helpers ───────────────────────────────────────────────────────

const TS_EXTS = new Set(['.ts', '.tsx']);

/** Recursively collect TypeScript files under a directory. */
function walkTs(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTs(full));
    } else if (TS_EXTS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// ─── File collection ──────────────────────────────────────────────────────────

/**
 * Returns true for worker files whose name signals auth or payment concern.
 * Matches: src/worker\/**\/auth*.ts, src/worker\/**\/payment*.ts,
 *          workers\/**\/auth*.ts, workers\/**\/payment*.ts,
 *          apps\/*\/src\/**\/auth*.ts, apps\/*\/src\/**\/payment*.ts
 */
function isAuthPaymentWorker(filepath) {
  const rel = relative(ROOT, filepath).replace(/\\/g, '/');
  return /(?:src\/worker|workers|apps\/[^/]+\/src)\/.+\/(?:auth|payment)[^/]*\.[jt]sx?$/.test(rel);
}

function collectTargetFiles() {
  const seen = new Set();
  const files = [];

  function add(f) {
    if (!seen.has(f)) { seen.add(f); files.push(f); }
  }

  // Direct auth/payment directories
  for (const dir of ['src/auth', 'src/payments']) {
    walkTs(join(ROOT, dir)).forEach(add);
  }

  // Worker files whose basename starts with auth/payment
  for (const workerDir of ['src/worker', 'workers']) {
    walkTs(join(ROOT, workerDir)).filter(isAuthPaymentWorker).forEach(add);
  }

  // App source directories matching auth/payment file names
  const appsDir = join(ROOT, 'apps');
  if (existsSync(appsDir)) {
    for (const app of readdirSync(appsDir, { withFileTypes: true })) {
      if (!app.isDirectory()) continue;
      walkTs(join(appsDir, app.name, 'src')).filter(isAuthPaymentWorker).forEach(add);
    }
  }

  return files;
}

// ─── Violation patterns ───────────────────────────────────────────────────────

/**
 * Auth/payment files must THROW (401/403), never safeParse.
 * Per rule: "An auth failure that 'degrades' to letting the user in is a security incident."
 */
const VIOLATIONS = [
  {
    id: 'safeParse-in-security-path',
    label: 'safeParse() in auth/payment path — use parse() + throw 401/403 instead',
    // Matches: .safeParse(  ?.safeParse(  zod.safeParse(  schema.safeParse(
    regex: /(?:\?\.\s*|[\w$]+\s*\.\s*)safeParse\s*\(/g,
  },
  {
    id: 'catch-swallows-auth-with-200',
    label: 'try/catch returning 200 in auth/payment — security bypass risk',
    // Single-line approximation: try { ... } catch ... return ... 200
    // Multiline covered by 's' flag
    regex: /try\s*\{[^{}]*\}\s*catch[^{}]*\{[^{}]*\breturn\b[^;]*\b200\b[^}]*\}/gs,
  },
];

function scanFile(filepath) {
  let src;
  try {
    src = readFileSync(filepath, 'utf8');
  } catch {
    return { violations: [], src: null };
  }

  const lines = src.split('\n');
  const violations = [];

  for (const { id, label, regex } of VIOLATIONS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(src)) !== null) {
      const lineNo = src.slice(0, match.index).split('\n').length;
      violations.push({
        id,
        label,
        line: lineNo,
        text: lines[lineNo - 1]?.trim() ?? '',
        matchText: match[0],
      });
    }
  }

  return { violations, src };
}

// ─── Fix logic ────────────────────────────────────────────────────────────────

function applyFix(src) {
  return src
    .replace(/\?\.\s*safeParse\s*\(/g, '.parse(')   // ?.safeParse( → .parse(
    .replace(/\bsafeParse\s*\(/g, 'parse(');          // .safeParse( → .parse(
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
  banner('validate-fail-mode  ·  fail-fast-build-fail-soft-prod');

  const targetFiles = collectTargetFiles();

  if (targetFiles.length === 0) {
    const msg = {
      validator: 'validate-fail-mode',
      status: 'skipped',
      message: 'No auth/payment files found',
      root: ROOT,
    };
    if (CI) ndjson(msg);
    else err('[skip] No auth/payment source files found under ' + ROOT);
    process.exit(0);
  }

  if (!CI) err(`Scanning ${targetFiles.length} auth/payment file(s) under ${ROOT}…\n`);

  const allViolations = []; // { filepath, rel, violation }

  for (const filepath of targetFiles) {
    const rel = relative(ROOT, filepath);
    const { violations } = scanFile(filepath);

    if (violations.length === 0) {
      pass(rel);
      continue;
    }

    for (const v of violations) {
      const record = { file: rel, line: v.line, id: v.id, label: v.label, text: v.text };
      allViolations.push({ filepath, ...record });
      if (CI) {
        ndjson({ validator: 'validate-fail-mode', status: 'violation', ...record });
      } else {
        fail(`${rel}:${v.line}  [${v.id}]`);
        err(`       ${v.label}`);
        err(`       ${v.text}`);
        err('');
      }
    }
  }

  if (allViolations.length === 0) {
    const msg = {
      validator: 'validate-fail-mode',
      status: 'pass',
      files_scanned: targetFiles.length,
      violations: 0,
    };
    if (CI) ndjson(msg);
    else err(`\n[pass] All ${targetFiles.length} file(s) clean.`);
    process.exit(0);
  }

  // Summary
  const summaryMsg = {
    validator: 'validate-fail-mode',
    status: 'fail',
    files_scanned: targetFiles.length,
    violations: allViolations.length,
  };
  if (CI) ndjson(summaryMsg);
  else err(`[FAIL] ${allViolations.length} violation(s) in ${new Set(allViolations.map(v => v.file)).size} file(s).`);

  // --dry-run: list what would change, exit 1
  if (DRY_RUN) {
    const byFile = Map.groupBy(allViolations, v => v.filepath);
    for (const [filepath, vs] of byFile) {
      const rel = relative(ROOT, filepath);
      const record = { validator: 'validate-fail-mode', action: 'dry-run-would-fix', file: rel, occurrences: vs.length };
      if (CI) ndjson(record);
      else err(`  [dry-run] Would rewrite ${vs.length} safeParse → parse in ${rel}`);
    }
    process.exit(1);
  }

  // --fix: rewrite files
  if (FIX) {
    const confirmed = CI
      ? true
      : await promptConfirm(`\nAuto-rewrite safeParse → parse in ${new Set(allViolations.map(v => v.filepath)).size} file(s)?`);

    if (!confirmed) {
      err('[aborted] No files modified.');
      process.exit(1);
    }

    const uniqueFiles = [...new Set(allViolations.map(v => v.filepath))];
    for (const filepath of uniqueFiles) {
      const { src } = scanFile(filepath);
      if (!src) continue;
      const fixed = applyFix(src);
      if (fixed === src) continue;
      writeFileSync(filepath, fixed, 'utf8');
      const rel = relative(ROOT, filepath);
      const record = { validator: 'validate-fail-mode', status: 'fixed', file: rel };
      if (CI) ndjson(record);
      else err(`  [fixed] ${rel}`);
    }

    if (CI) ndjson({ validator: 'validate-fail-mode', status: 'fix-complete' });
    else err('\n[done] Fix applied. Re-run to verify.');
    process.exit(0);
  }

  process.exit(1);
}

main().catch(e => {
  process.stderr.write(`[error] ${e.stack ?? e.message}\n`);
  process.exit(2);
});
