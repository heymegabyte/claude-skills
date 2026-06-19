#!/usr/bin/env node
/**
 * check-compression-regression.mjs
 *
 * Lock in compression gains — fail when a rules/*.md file grows significantly
 * vs git HEAD without an explicit justification marker.
 *
 * Protects the compression arc from silent re-bloat.
 *
 * @example
 *   node bin/check-compression-regression.mjs            # human-readable report
 *   node bin/check-compression-regression.mjs --json     # machine-readable JSON
 *   node bin/check-compression-regression.mjs --ci       # exits 1 on any violation
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Growth threshold — violation if file grows by MORE than this percent. */
const GROWTH_THRESHOLD_PCT = 20;

/** Marker strings that justify a growth — either heading or HTML comment. */
const JUSTIFICATION_MARKERS = ['## Why this grew', '<!-- grow-ok -->'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Count newline-delimited lines in a string.
 *
 * @param {string} text - Raw file content.
 * @returns {number} Line count (minimum 1 for a non-empty file).
 */
function countLines(text) {
  if (!text) return 0;
  return text.split('\n').length;
}

/**
 * Retrieve the line count of a file at git HEAD.
 * Returns null if the file is untracked (new) or if git is unavailable.
 *
 * @param {string} repoRoot - Absolute path to the repo root.
 * @param {string} relPath - Relative path from repo root (e.g. "rules/foo.md").
 * @returns {number|null} Line count at HEAD, or null when no baseline exists.
 */
function headLineCount(repoRoot, relPath) {
  try {
    const content = execFileSync('git', ['show', `HEAD:${relPath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return countLines(content);
  } catch {
    // File is new (not in HEAD) or git unavailable — skip gracefully.
    return null;
  }
}

/**
 * Check whether a file's current content contains a growth-justification marker.
 *
 * @param {string} content - Current on-disk file content.
 * @returns {boolean} True when at least one justification marker is present.
 */
function hasJustificationMarker(content) {
  return JUSTIFICATION_MARKERS.some((marker) => content.includes(marker));
}

/**
 * Calculate growth percentage, rounded to one decimal place.
 *
 * @param {number} headLines - Line count at git HEAD.
 * @param {number} currentLines - Current on-disk line count.
 * @returns {number} Growth percentage (positive = grew, negative = shrank).
 */
function growthPct(headLines, currentLines) {
  if (headLines === 0) return 0;
  return Math.round(((currentLines - headLines) / headLines) * 1000) / 10;
}

// ---------------------------------------------------------------------------
// Core audit
// ---------------------------------------------------------------------------

/**
 * Run the compression-regression check over rules/*.md.
 *
 * @param {string} repoRoot - Absolute path to the repo root directory.
 * @returns {{ summary: object, violations: object[] }} Audit result.
 */
function runAudit(repoRoot) {
  const rulesDir = join(repoRoot, 'rules');
  let files;

  try {
    files = readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
  } catch {
    return {
      summary: {
        filesChecked: 0,
        filesWithBaseline: 0,
        violationCount: 0,
        rulesDir,
        error: 'Could not read rules/ directory',
      },
      violations: [],
    };
  }

  let filesWithBaseline = 0;
  const violations = [];

  for (const filename of files) {
    const relPath = `rules/${filename}`;
    const absPath = join(rulesDir, filename);

    // Read current on-disk content.
    let currentContent;
    try {
      currentContent = readFileSync(absPath, 'utf8');
    } catch {
      continue; // Unreadable — skip.
    }
    const currentLines = countLines(currentContent);

    // Get HEAD baseline.
    const headLines = headLineCount(repoRoot, relPath);
    if (headLines === null) {
      // New file — no baseline, skip.
      continue;
    }
    filesWithBaseline++;

    const pct = growthPct(headLines, currentLines);

    if (pct > GROWTH_THRESHOLD_PCT && !hasJustificationMarker(currentContent)) {
      violations.push({
        file: relPath,
        headLines,
        currentLines,
        growthPct: pct,
        confidence: 'HIGH',
      });
    }
  }

  return {
    summary: {
      filesChecked: files.length,
      filesWithBaseline,
      violationCount: violations.length,
      thresholdPct: GROWTH_THRESHOLD_PCT,
      rulesDir,
    },
    violations,
  };
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

/**
 * Render a human-readable report to stdout.
 *
 * @param {{ summary: object, violations: object[] }} result - Audit result.
 */
function printHuman(result) {
  const { summary, violations } = result;

  console.log('\nCompression Regression Check\n' + '─'.repeat(40));
  console.log(`Rules dir      : ${summary.rulesDir}`);
  console.log(`Files checked  : ${summary.filesChecked}`);
  console.log(`With baseline  : ${summary.filesWithBaseline}`);
  console.log(`Threshold      : >${summary.thresholdPct}% growth`);
  console.log(`Violations     : ${summary.violationCount}`);

  if (summary.error) {
    console.log(`\nERROR: ${summary.error}`);
    return;
  }

  if (violations.length === 0) {
    console.log('\n✓ No compression regressions detected.');
    return;
  }

  console.log('\nVIOLATIONS:\n');
  for (const v of violations) {
    console.log(`  FAIL  ${v.file}`);
    console.log(`        HEAD: ${v.headLines} lines  →  now: ${v.currentLines} lines  (+${v.growthPct}%)`);
    console.log(`        Fix : add "## Why this grew" section or <!-- grow-ok --> comment`);
    console.log();
  }
}

/**
 * Render JSON output to stdout.
 *
 * @param {{ summary: object, violations: object[] }} result - Audit result.
 */
function printJson(result) {
  console.log(JSON.stringify(result, null, 2));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const isJson = args.includes('--json');
const isCi = args.includes('--ci');

const result = runAudit(repoRoot);

if (isJson) {
  printJson(result);
} else {
  printHuman(result);
}

if (isCi && result.violations.length > 0) {
  process.exit(1);
}
