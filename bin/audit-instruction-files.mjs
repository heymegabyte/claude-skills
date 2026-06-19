#!/usr/bin/env node
/**
 * audit-instruction-files.mjs
 *
 * Audits AI-instruction Markdown files under rules/ (sibling of bin/) for three classes
 * of quality violations: token/size budget, hedge language (EARS lint), and filler phrases.
 *
 * Zero external dependencies — uses only node:fs, node:path, node:url.
 *
 * @example
 * # Human-readable report
 * node bin/audit-instruction-files.mjs
 *
 * # JSON output
 * node bin/audit-instruction-files.mjs --json
 *
 * # CI mode — exits 1 on HIGH violations or files >500 lines
 * node bin/audit-instruction-files.mjs --ci
 *
 * # Combine flags
 * node bin/audit-instruction-files.mjs --json --ci
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const RULES_DIR = join(REPO_ROOT, 'rules');

/** Files (basename) excluded from all checks. */
const EXCLUDED_BASENAMES = new Set(['principles-incident-log.md']);

/** Path segments that cause exclusion when present. */
const EXCLUDED_PATH_SEGMENTS = ['/_archived/'];

/** Prose line threshold (excluding code blocks) that triggers HIGH budget flag. */
const PROSE_LINE_LIMIT = 200;

/** Total line threshold that triggers HIGH budget flag. */
const TOTAL_LINE_LIMIT = 500;

/** Hedge words — word-boundary, case-insensitive → MEDIUM confidence. */
const HEDGE_PATTERNS = [
  /\bshould\b/i,
  /\btry to\b/i,
  /\bideally\b/i,
  /\bwhere possible\b/i,
  /\bas appropriate\b/i,
  /\bas needed\b/i,
  /\bif possible\b/i,
  /\bmight want to\b/i,
];

/** Filler phrases — case-insensitive substring → HIGH confidence. */
const FILLER_PHRASES = [
  'please',
  'make sure',
  'be careful',
  'remember to',
  'in order to',
  'it is important to',
  'note that',
  'as a reminder',
];

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Recursively collects all .md files under a directory.
 *
 * @param {string} dir - Absolute directory path to walk.
 * @returns {string[]} Sorted list of absolute file paths.
 */
function collectMarkdownFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

/**
 * Returns true when a file should be skipped based on exclusion rules.
 *
 * @param {string} absPath - Absolute path to the file.
 * @returns {boolean}
 */
function isExcluded(absPath) {
  if (EXCLUDED_BASENAMES.has(basename(absPath))) return true;
  const normalized = absPath.replace(/\\/g, '/');
  return EXCLUDED_PATH_SEGMENTS.some(seg => normalized.includes(seg));
}

// ---------------------------------------------------------------------------
// Code-block fence tracking
// ---------------------------------------------------------------------------

/**
 * Given the lines of a file, returns a boolean array indicating whether each
 * line index is inside a fenced code block (``` ... ```).
 *
 * @param {string[]} lines
 * @returns {boolean[]}
 */
function buildCodeMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        mask[i] = true; // fence opener is code
      } else {
        inCode = false;
        mask[i] = true; // fence closer is code
      }
    } else {
      mask[i] = inCode;
    }
  }
  return mask;
}

// ---------------------------------------------------------------------------
// CHECK 1 — Token/size budget
// ---------------------------------------------------------------------------

/**
 * Analyzes a single file for size/token violations.
 *
 * @param {string} absPath
 * @param {string[]} lines
 * @param {boolean[]} codeMask
 * @returns {{ file: string, lines: number, estTokens: number, codeLines: number, proseLines: number, flagged: boolean }}
 */
function checkBudget(absPath, lines, codeMask) {
  const rel = relative(REPO_ROOT, absPath);
  const totalLines = lines.length;
  const charCount = lines.join('\n').length;
  const estTokens = Math.ceil(charCount / 4);

  let codeLines = 0;
  let proseLines = 0;
  for (let i = 0; i < lines.length; i++) {
    if (codeMask[i]) {
      codeLines++;
    } else {
      proseLines++;
    }
  }

  const flagged = proseLines > PROSE_LINE_LIMIT || totalLines > TOTAL_LINE_LIMIT;
  return { file: rel, lines: totalLines, estTokens, codeLines, proseLines, flagged };
}

// ---------------------------------------------------------------------------
// CHECK 2 — EARS / hedge linter
// ---------------------------------------------------------------------------

/**
 * Scans non-code lines for hedge words.
 *
 * @param {string} absPath
 * @param {string[]} lines
 * @param {boolean[]} codeMask
 * @returns {Array<{ file: string, line: number, text: string, word: string, confidence: 'MEDIUM' }>}
 */
function checkHedges(absPath, lines, codeMask) {
  const rel = relative(REPO_ROOT, absPath);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (codeMask[i]) continue;
    const text = lines[i];
    for (const pattern of HEDGE_PATTERNS) {
      const match = pattern.exec(text);
      if (match) {
        hits.push({ file: rel, line: i + 1, text, word: match[0], confidence: 'MEDIUM' });
        break; // one hit per line per file pass
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// CHECK 3 — Filler blocklist
// ---------------------------------------------------------------------------

/**
 * Scans non-code lines for filler phrases.
 *
 * @param {string} absPath
 * @param {string[]} lines
 * @param {boolean[]} codeMask
 * @returns {Array<{ file: string, line: number, text: string, phrase: string, confidence: 'HIGH' }>}
 */
function checkFiller(absPath, lines, codeMask) {
  const rel = relative(REPO_ROOT, absPath);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (codeMask[i]) continue;
    const lower = lines[i].toLowerCase();
    for (const phrase of FILLER_PHRASES) {
      if (lower.includes(phrase)) {
        hits.push({ file: rel, line: i + 1, text: lines[i], phrase, confidence: 'HIGH' });
        break; // one hit per line per file pass
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Human-readable report
// ---------------------------------------------------------------------------

/**
 * Prints the grouped human-readable audit report to stdout.
 *
 * @param {{ budget: object[], hedges: object[], filler: object[], summary: object }} report
 */
function printHumanReport(report) {
  const { budget, hedges, filler, summary } = report;

  console.log('\n=== CHECK 1 — Token/Size Budget ===');
  const flaggedBudget = budget.filter(r => r.flagged);
  if (flaggedBudget.length === 0) {
    console.log('  (no violations)');
  } else {
    for (const r of flaggedBudget) {
      console.log(`  HIGH  ${r.file}`);
      console.log(`        lines=${r.lines}  prose=${r.proseLines}  code=${r.codeLines}  ~${r.estTokens} tokens`);
    }
  }

  console.log('\n=== CHECK 2 — Hedge Language (EARS lint) ===');
  if (hedges.length === 0) {
    console.log('  (no violations)');
  } else {
    let lastFile = '';
    for (const h of hedges) {
      if (h.file !== lastFile) {
        console.log(`\n  ${h.file}`);
        lastFile = h.file;
      }
      const snippet = h.text.trim().slice(0, 100);
      console.log(`    MEDIUM  L${h.line}  [${h.word}]  ${snippet}`);
    }
  }

  console.log('\n=== CHECK 3 — Filler Phrases ===');
  if (filler.length === 0) {
    console.log('  (no violations)');
  } else {
    let lastFile = '';
    for (const f of filler) {
      if (f.file !== lastFile) {
        console.log(`\n  ${f.file}`);
        lastFile = f.file;
      }
      const snippet = f.text.trim().slice(0, 100);
      console.log(`    HIGH    L${f.line}  ["${f.phrase}"]  ${snippet}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Files scanned : ${summary.filesScanned}`);
  console.log(`  Files excluded: ${summary.filesExcluded}`);
  console.log(`  Budget HIGH   : ${summary.budgetHigh}  (prose >${PROSE_LINE_LIMIT} lines OR total >${TOTAL_LINE_LIMIT} lines)`);
  console.log(`  Hedge MEDIUM  : ${summary.hedgeCount}  (advisory — hedge words)`);
  console.log(`  Filler HIGH   : ${summary.fillerCount}  (filler phrases — CI-blocking)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point. Parses flags, runs all three checks, emits output, exits.
 */
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const ciMode = args.includes('--ci');

  // Collect files
  const allFiles = collectMarkdownFiles(RULES_DIR);
  const included = allFiles.filter(f => !isExcluded(f));
  const excluded = allFiles.filter(f => isExcluded(f));

  const budgetResults = [];
  const hedgeResults = [];
  const fillerResults = [];

  for (const absPath of included) {
    const raw = readFileSync(absPath, 'utf8');
    const lines = raw.split('\n');
    const codeMask = buildCodeMask(lines);

    budgetResults.push(checkBudget(absPath, lines, codeMask));
    hedgeResults.push(...checkHedges(absPath, lines, codeMask));
    fillerResults.push(...checkFiller(absPath, lines, codeMask));
  }

  const budgetHigh = budgetResults.filter(r => r.flagged).length;
  const summary = {
    filesScanned: included.length,
    filesExcluded: excluded.length,
    budgetHigh,
    hedgeCount: hedgeResults.length,
    fillerCount: fillerResults.length,
  };

  const report = { summary, budget: budgetResults, hedges: hedgeResults, filler: fillerResults };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report);
  }

  if (ciMode) {
    const hasHighViolations = fillerResults.length > 0 || budgetHigh > 0;
    process.exit(hasHighViolations ? 1 : 0);
  }
}

main();
