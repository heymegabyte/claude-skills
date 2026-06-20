#!/usr/bin/env node
/**
 * audit-rule-metadata.mjs
 *
 * Audits rules/*.md and [0-9][0-9]-*\/SKILL.md for three advisory issues:
 *
 *   missing-moscow  — no [MUST] / [SHOULD] / [COULD] tag anywhere in the file.
 *                     MEDIUM (advisory) — optional priority weighting, not a bug.
 *
 *   non-gerund-name — frontmatter `name:` does not end with a gerund or common
 *                     noun-activity form (words ending -ing, -tion, -sion, -ity,
 *                     or known short-noun patterns). MEDIUM advisory only.
 *
 *   no-summary      — no descriptive sentence between H1 title and first ##
 *                     heading (or first > blockquote). MEDIUM advisory.
 *
 * Files with no frontmatter at all are skipped silently.
 *
 * Flags:
 *   --json   emit a structured JSON summary
 *   --ci     exit 0 always (all findings are advisory); JSON includes exit code field
 *
 * @example
 * node bin/audit-rule-metadata.mjs
 * node bin/audit-rule-metadata.mjs --json
 * node bin/audit-rule-metadata.mjs --ci
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const JSON_MODE = process.argv.includes('--json');
const CI_MODE = process.argv.includes('--ci');

// ---------------------------------------------------------------------------
// Minimal YAML frontmatter parser (no external deps)
// Handles scalars, block lists, and one-level nested mappings.
// ---------------------------------------------------------------------------

/**
 * Parse a YAML block between --- delimiters.
 *
 * @param {string} yamlText - Raw YAML (without delimiter lines).
 * @returns {Record<string, unknown> | null}
 *
 * @example
 * parseYamlSubset('name: "foo"\npriority: 2') // => { name: 'foo', priority: '2' }
 */
function parseYamlSubset(yamlText) {
  if (!yamlText.trim()) return null;
  const lines = yamlText.split('\n');
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    const topMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)/);
    if (!topMatch) { i++; continue; }

    const key = topMatch[1];
    const rest = topMatch[2].trim();

    if (rest.startsWith('[')) {
      const inner = rest.replace(/^\[/, '').replace(/\].*$/, '');
      result[key] = inner
        ? inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        : [];
      i++;
      continue;
    }

    if (rest) {
      result[key] = rest.replace(/^['"]|['"]$/g, '');
      i++;
      continue;
    }

    i++;
    const children = [];
    const mapping = {};
    let hasListItems = false;
    let hasMappingItems = false;

    while (i < lines.length) {
      const child = lines[i];
      if (!child.match(/^\s/)) break;
      if (!child.trim() || child.trim().startsWith('#')) { i++; continue; }

      const listMatch = child.match(/^\s+- (.+)/);
      if (listMatch) {
        children.push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
        hasListItems = true;
        i++;
        continue;
      }

      const nestedMatch = child.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)/);
      if (nestedMatch) {
        mapping[nestedMatch[1]] = nestedMatch[2].trim().replace(/^['"]|['"]$/g, '');
        hasMappingItems = true;
        i++;
        continue;
      }

      i++;
    }

    result[key] = hasListItems ? children : hasMappingItems ? mapping : null;
  }

  return result;
}

/**
 * Parse a Markdown file into frontmatter object + body string.
 *
 * @param {string} filePath - Absolute path.
 * @returns {{ frontmatter: Record<string, unknown> | null, body: string, raw: string }}
 *
 * @example
 * const { frontmatter, body } = parseMdFile('/some/rule.md');
 */
function parseMdFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---')) return { frontmatter: null, body: raw, raw };
  const closeIdx = raw.indexOf('\n---', 3);
  if (closeIdx === -1) return { frontmatter: null, body: raw, raw };
  const yamlText = raw.slice(3, closeIdx);
  const body = raw.slice(closeIdx + 4);
  return { frontmatter: parseYamlSubset(yamlText), body, raw };
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Collect all target Markdown files: rules/*.md + [0-9][0-9]-*\/SKILL.md.
 *
 * @returns {string[]} Sorted absolute paths.
 *
 * @example
 * collectTargetFiles().length // => ~164
 */
function collectTargetFiles() {
  const files = [];

  const rulesDir = join(REPO_ROOT, 'rules');
  if (existsSync(rulesDir)) {
    for (const entry of readdirSync(rulesDir)) {
      if (entry.endsWith('.md')) files.push(join(rulesDir, entry));
    }
  }

  for (const entry of readdirSync(REPO_ROOT)) {
    if (/^\d{2}-/.test(entry)) {
      const skillPath = join(REPO_ROOT, entry, 'SKILL.md');
      if (existsSync(skillPath)) files.push(skillPath);
    }
  }

  return files.sort();
}

// ---------------------------------------------------------------------------
// Check: missing MoSCoW tag
// ---------------------------------------------------------------------------

/** Regex matching any MoSCoW tag in any form used in this repo. */
const MOSCOW_RE = /\[(MUST|SHOULD|COULD)\]/i;

/**
 * Return true when the file contains no MoSCoW priority tag.
 *
 * @param {string} raw - Full file text.
 * @returns {boolean}
 *
 * @example
 * isMissingMoscow('[MUST] ship before Monday') // => false
 * isMissingMoscow('Deploy the site') // => true
 */
function isMissingMoscow(raw) {
  return !MOSCOW_RE.test(raw);
}

// ---------------------------------------------------------------------------
// Check: non-gerund skill name
// ---------------------------------------------------------------------------

/**
 * Known acceptable suffix patterns for skill `name:` values.
 * Matches gerunds (-ing), nominalizations (-tion/-sion/-ity/-ance/-ence/-ment),
 * plus a shortlist of accepted short nouns used in this repo.
 */
const GERUND_SUFFIXES = [
  /ing$/,        // building, routing, caching
  /tion$/,       // verification, generation
  /sion$/,       // provision, extension
  /ity$/,        // autonomy, security
  /ance$/,       // performance, compliance
  /ence$/,       // reference, resilience
  /ment$/,       // management, deployment
  /ics$/,        // metrics
  /ics-$/,
  /ine$/,        // doctrine
  /loop$/,       // build-and-slice-loop
  /system$/,     // motion-and-interaction-system, design-system
  /doctrine$/,
  /engine$/,     // independent-idea-engine
  /cadence$/,    // backwards-compatibility-removal-cadence
  /style$/,      // code-style
  /brief$/,      // goal-and-brief
  /memory$/,     // preference-and-memory
  /defaults$/,   // fetch-defaults
  /recovery$/,   // error-recovery
  /polish$/,     // supreme-polish
  /research$/,   // planning-and-research
];

/**
 * Return true when the skill name does NOT match any accepted gerund/noun pattern.
 * Advisory only — MEDIUM confidence.
 *
 * @param {string} name - The value of frontmatter `name:`.
 * @returns {boolean}
 *
 * @example
 * isNonGerundName('site-generation') // => false (ends in -tion)
 * isNonGerundName('foo') // => true
 */
function isNonGerundName(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  for (const re of GERUND_SUFFIXES) {
    if (re.test(lower)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Check: no-summary (reuse pattern from audit-skill-discoverability)
// ---------------------------------------------------------------------------

/**
 * Return true when there is no descriptive sentence between the H1 title and the
 * first ## heading or > blockquote in the file body.
 *
 * @param {string} body - Text after the frontmatter block.
 * @returns {boolean}
 *
 * @example
 * hasNoSummary('# Title\n\n## Section\n') // => true
 * hasNoSummary('# Title\n\nA sentence here.\n\n## Section\n') // => false
 */
function hasNoSummary(body) {
  const lines = body.split('\n');
  let pastH1 = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('# ')) { pastH1 = true; continue; }
    if (!pastH1) continue;
    if (trimmed.startsWith('## ') || trimmed.startsWith('> ')) return true;
    // Non-empty, non-heading, non-blockquote line — this is the summary
    return false;
  }

  return true; // never found H1 or found H1 with nothing after
}

// ---------------------------------------------------------------------------
// Main audit loop
// ---------------------------------------------------------------------------

/**
 * Run all three checks over every target file.
 *
 * @returns {{ findings: Finding[], summary: Summary }}
 *
 * @typedef {{ file: string, kind: string, confidence: string, detail: string }} Finding
 * @typedef {{ scanned: number, flagged: number, byKind: Record<string, number> }} Summary
 *
 * @example
 * const { summary } = audit();
 * console.log(summary.scanned); // => ~164
 */
function audit() {
  const files = collectTargetFiles();
  /** @type {Finding[]} */
  const findings = [];

  for (const absPath of files) {
    const { frontmatter, body, raw } = parseMdFile(absPath);
    if (!frontmatter) continue; // skip files with no frontmatter

    const file = relative(REPO_ROOT, absPath);

    // 1. Missing MoSCoW tag — ADVISORY (MEDIUM), not a bug. MoSCoW tags are a
    // nice-to-have (roadmap idea #17); most rules read fine without them. HIGH
    // here was cry-wolf (158 findings drowned the real HIGHs) per
    // validator-precision-discipline. Downgraded to MEDIUM so HIGH means actionable.
    if (isMissingMoscow(raw)) {
      findings.push({
        file,
        kind: 'missing-moscow',
        confidence: 'MEDIUM',
        detail: 'No [MUST] / [SHOULD] / [COULD] tag — optional priority weighting (advisory, not required)',
      });
    }

    // 2. Non-gerund skill name (advisory)
    const name = typeof frontmatter['name'] === 'string' ? frontmatter['name'] : '';
    if (name && isNonGerundName(name)) {
      findings.push({
        file,
        kind: 'non-gerund-name',
        confidence: 'MEDIUM',
        detail: `Skill name "${name}" does not end with a gerund or recognized activity-noun suffix — consider renaming for discoverability`,
      });
    }

    // 3. No-summary
    if (hasNoSummary(body)) {
      findings.push({
        file,
        kind: 'no-summary',
        confidence: 'MEDIUM',
        detail: 'No descriptive sentence found between H1 title and first ## heading',
      });
    }
  }

  const byKind = /** @type {Record<string, number>} */ ({});
  for (const f of findings) {
    byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
  }

  return {
    findings,
    summary: {
      scanned: files.length,
      flagged: findings.length,
      byKind,
    },
  };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const { findings, summary } = audit();

if (JSON_MODE) {
  process.stdout.write(JSON.stringify({ summary, findings }, null, 2) + '\n');
} else {
  const byFile = /** @type {Record<string, Finding[]>} */ ({});
  for (const f of findings) {
    (byFile[f.file] ??= []).push(f);
  }

  for (const [file, list] of Object.entries(byFile).sort()) {
    console.log(`\n${file}`);
    for (const f of list) {
      console.log(`  [${f.confidence}] ${f.kind}: ${f.detail}`);
    }
  }

  console.log(`\n--- summary ---`);
  console.log(`scanned : ${summary.scanned}`);
  console.log(`flagged : ${summary.flagged}`);
  for (const [kind, count] of Object.entries(summary.byKind)) {
    console.log(`  ${kind}: ${count}`);
  }
}

// --ci exits 0 always (all findings are advisory)
if (!CI_MODE) {
  process.exit(0);
} else {
  process.exit(0);
}
