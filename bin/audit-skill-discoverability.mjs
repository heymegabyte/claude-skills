#!/usr/bin/env node
/**
 * audit-skill-discoverability.mjs
 *
 * Audits rules/*.md and [0-9][0-9]-*\/SKILL.md files for weak discoverability:
 * missing or thin triggers, trigger names that echo the file name, and missing
 * one-line summaries. Files with no frontmatter at all are skipped silently.
 * Files with `paths: ["*"]` are always-loaded and legitimately need no triggers.
 *
 * @example
 * node bin/audit-skill-discoverability.mjs
 * node bin/audit-skill-discoverability.mjs --json
 * node bin/audit-skill-discoverability.mjs --ci   # exits 1 only on HIGH findings
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// YAML frontmatter parser (no external deps — handles the subset used here)
// ---------------------------------------------------------------------------

/**
 * Parse a YAML block (the content between the opening and closing ---).
 * Handles: scalar strings (quoted/unquoted), lists (block style - item), and
 * nested mappings (one level deep for metadata/compatibility blocks).
 * Returns null when the input is empty or not parseable.
 *
 * @param {string} yamlText - Raw YAML text (without the --- delimiters).
 * @returns {Record<string, unknown> | null}
 */
function parseYamlSubset(yamlText) {
  if (!yamlText.trim()) return null;
  const lines = yamlText.split('\n');
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Skip blank / comment lines
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    // Top-level key: value
    const topMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)/);
    if (!topMatch) { i++; continue; }

    const key = topMatch[1];
    const rest = topMatch[2].trim();

    // Inline list: key: [a, b]
    if (rest.startsWith('[')) {
      const inner = rest.replace(/^\[/, '').replace(/\].*$/, '');
      result[key] = inner
        ? inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        : [];
      i++;
      continue;
    }

    // Quoted / unquoted scalar
    if (rest) {
      result[key] = rest.replace(/^['"]|['"]$/g, '');
      i++;
      continue;
    }

    // Empty value — could be start of a block list or mapping
    i++;
    const children = [];
    const mapping = {};
    let hasListItems = false;
    let hasMappingItems = false;

    while (i < lines.length) {
      const child = lines[i];
      if (!child.match(/^\s/)) break; // back to top-level
      if (!child.trim() || child.trim().startsWith('#')) { i++; continue; }

      // Block list item: "  - value"
      const listMatch = child.match(/^\s+- (.+)/);
      if (listMatch) {
        children.push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
        hasListItems = true;
        i++;
        continue;
      }

      // Nested mapping: "  key: value"
      const nestedMatch = child.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)/);
      if (nestedMatch) {
        mapping[nestedMatch[1]] = nestedMatch[2].trim().replace(/^['"]|['"]$/g, '');
        hasMappingItems = true;
        i++;
        continue;
      }

      i++;
    }

    if (hasListItems) {
      result[key] = children;
    } else if (hasMappingItems) {
      result[key] = mapping;
    } else {
      result[key] = null;
    }
  }

  return result;
}

/**
 * Extract YAML frontmatter and body from a Markdown file.
 * Returns null for both fields when no frontmatter is present.
 *
 * @param {string} filePath - Absolute path to the .md file.
 * @returns {{ frontmatter: Record<string, unknown> | null, body: string }}
 */
function parseMdFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---')) return { frontmatter: null, body: raw };

  // Find closing ---
  const closeIdx = raw.indexOf('\n---', 3);
  if (closeIdx === -1) return { frontmatter: null, body: raw };

  const yamlText = raw.slice(3, closeIdx);
  const body = raw.slice(closeIdx + 4); // skip '\n---'
  const frontmatter = parseYamlSubset(yamlText);
  return { frontmatter, body };
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Collect all target files: rules/*.md + [0-9][0-9]-*\/SKILL.md.
 *
 * @returns {string[]} Sorted absolute paths.
 */
function collectTargetFiles() {
  const files = [];

  // rules/*.md
  const rulesDir = join(REPO_ROOT, 'rules');
  if (existsSync(rulesDir)) {
    for (const entry of readdirSync(rulesDir)) {
      if (entry.endsWith('.md')) {
        files.push(join(rulesDir, entry));
      }
    }
  }

  // [0-9][0-9]-*/SKILL.md
  for (const entry of readdirSync(REPO_ROOT)) {
    if (/^\d{2}-/.test(entry)) {
      const skillPath = join(REPO_ROOT, entry, 'SKILL.md');
      if (existsSync(skillPath)) {
        files.push(skillPath);
      }
    }
  }

  return files.sort();
}

// ---------------------------------------------------------------------------
// Body parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract the one-line summary from a Markdown body.
 * The summary is the first non-empty, non-H1, non-blockquote line after the
 * H1 title — stopping at the first `##` heading.
 *
 * @param {string} body - Everything after the frontmatter block.
 * @returns {string} The summary sentence, or '' if none found.
 */
function extractBodySummary(body) {
  const lines = body.split('\n');
  let pastH1 = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      pastH1 = true;
      continue;
    }

    if (!pastH1) continue;

    // Stop at next heading
    if (trimmed.startsWith('## ')) break;

    // Skip blockquote lines (pure formatting, not summary content)
    if (trimmed.startsWith('>')) continue;

    return trimmed;
  }

  return '';
}

// ---------------------------------------------------------------------------
// Check helpers
// ---------------------------------------------------------------------------

/**
 * Return true when paths contains the literal string "*" — the always-load sentinel.
 *
 * @param {unknown} paths - Value of the `paths` frontmatter field.
 * @returns {boolean}
 */
function isAlwaysLoad(paths) {
  if (!Array.isArray(paths)) return false;
  return paths.some(p => p === '*');
}

/**
 * Return true when every trigger string is just the stem of the file name
 * or a substring of it — meaning it adds no distinct user-phrasing.
 *
 * @param {string[]} triggers
 * @param {string} filePath
 * @returns {boolean}
 */
function triggersEchoFileName(triggers, filePath) {
  if (!triggers.length) return false;
  const stem = basename(filePath, '.md').toLowerCase().replace(/[-_]/g, '');
  return triggers.every(t => {
    const tNorm = t.toLowerCase().replace(/[-_\s]/g, '');
    // trigger is a substring of the file stem, or the file stem contains the trigger
    return stem.includes(tNorm) || tNorm.includes(stem);
  });
}

// ---------------------------------------------------------------------------
// Core audit logic
// ---------------------------------------------------------------------------

/**
 * @typedef {{ file: string, kind: string, confidence: 'HIGH' | 'MEDIUM' | 'LOW', detail: string }} Finding
 */

/**
 * Audit a single file and return zero or more findings.
 *
 * @param {string} filePath - Absolute path to the .md file.
 * @returns {Finding[]}
 */
function auditFile(filePath) {
  const { frontmatter, body } = parseMdFile(filePath);

  // No frontmatter → skip silently per spec
  if (!frontmatter) return [];

  const findings = [];
  const relPath = filePath.replace(REPO_ROOT + '/', '');

  const triggers = Array.isArray(frontmatter.triggers) ? frontmatter.triggers : null;
  const paths = frontmatter.paths;
  const alwaysLoad = isAlwaysLoad(paths);

  // --- no-triggers (HIGH) ---
  // Has frontmatter but triggers is missing or empty, AND not an always-load rule.
  const hasTriggers = triggers !== null && triggers.length > 0;
  if (!alwaysLoad && !hasTriggers) {
    findings.push({
      file: relPath,
      kind: 'no-triggers',
      confidence: 'HIGH',
      detail: triggers === null
        ? '`triggers:` key absent from frontmatter'
        : '`triggers:` is present but empty ([])',
    });
  }

  // --- thin-triggers (MEDIUM) ---
  // Non-always-load with exactly 1 trigger.
  if (!alwaysLoad && hasTriggers && triggers.length === 1) {
    findings.push({
      file: relPath,
      kind: 'thin-triggers',
      confidence: 'MEDIUM',
      detail: `Only 1 trigger: "${triggers[0]}" — add synonyms or rephrasings so user intent maps reliably`,
    });
  }

  // --- trigger-equals-name (MEDIUM) ---
  // Every trigger is just the file name or a substring of it.
  if (!alwaysLoad && hasTriggers && triggersEchoFileName(triggers, filePath)) {
    findings.push({
      file: relPath,
      kind: 'trigger-equals-name',
      confidence: 'MEDIUM',
      detail: `All triggers [${triggers.map(t => `"${t}"`).join(', ')}] merely echo the file name — add distinct user-phrasing`,
    });
  }

  // --- no-summary (MEDIUM) ---
  // No descriptive sentence between H1 and the first ## heading.
  const summary = extractBodySummary(body);
  if (!summary) {
    findings.push({
      file: relPath,
      kind: 'no-summary',
      confidence: 'MEDIUM',
      detail: 'No descriptive sentence found between H1 title and first ## heading',
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Report formatters
// ---------------------------------------------------------------------------

const KIND_ORDER = ['no-triggers', 'thin-triggers', 'trigger-equals-name', 'no-summary'];

/**
 * Print a human-readable grouped report to stdout.
 *
 * @param {Finding[]} findings
 * @param {number} scanned
 */
function printHumanReport(findings, scanned) {
  const byKind = /** @type {Record<string, Finding[]>} */ ({});
  for (const f of findings) {
    (byKind[f.kind] ??= []).push(f);
  }

  const kindLabels = {
    'no-triggers':         'no-triggers         [HIGH]   — no routing triggers (not always-load)',
    'thin-triggers':       'thin-triggers        [MEDIUM] — only 1 trigger phrase',
    'trigger-equals-name': 'trigger-equals-name  [MEDIUM] — trigger only echoes file name',
    'no-summary':          'no-summary           [MEDIUM] — no one-line description in body',
  };

  let anyFindings = false;
  for (const kind of KIND_ORDER) {
    const group = byKind[kind];
    if (!group || !group.length) continue;
    anyFindings = true;
    console.log(`\n## ${kindLabels[kind] ?? kind} (${group.length})\n`);
    for (const f of group) {
      console.log(`  ${f.file}`);
      console.log(`    ${f.detail}`);
    }
  }

  if (!anyFindings) {
    console.log('\nAll files pass discoverability checks.');
  }

  console.log('\n---');
  console.log(`Files scanned : ${scanned}`);
  console.log(`Flagged total : ${findings.length}`);
  for (const kind of KIND_ORDER) {
    const count = (byKind[kind] ?? []).length;
    if (count) console.log(`  ${kind.padEnd(24)}: ${count}`);
  }
}

/**
 * Emit JSON output to stdout.
 *
 * @param {Finding[]} findings
 * @param {number} scanned
 */
function printJsonReport(findings, scanned) {
  const countByKind = /** @type {Record<string, number>} */ ({});
  for (const f of findings) countByKind[f.kind] = (countByKind[f.kind] ?? 0) + 1;

  const output = {
    summary: {
      scanned,
      flagged: findings.length,
      byKind: countByKind,
    },
    findings,
  };
  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Main — parse CLI flags, run audit, emit report, exit.
 */
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const ciMode = args.includes('--ci');

  const files = collectTargetFiles();
  const allFindings = /** @type {Finding[]} */ ([]);

  for (const filePath of files) {
    allFindings.push(...auditFile(filePath));
  }

  if (jsonMode) {
    printJsonReport(allFindings, files.length);
  } else {
    printHumanReport(allFindings, files.length);
  }

  if (ciMode) {
    const hasHigh = allFindings.some(f => f.confidence === 'HIGH');
    process.exit(hasHigh ? 1 : 0);
  }
}

main();
