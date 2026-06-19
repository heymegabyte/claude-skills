#!/usr/bin/env node
/**
 * audit-trigger-collisions.mjs
 *
 * Detect trigger-phrase collisions across rule + skill frontmatter that cause
 * unpredictable skill routing. A collision is any normalized trigger phrase
 * declared by ≥2 different files.
 *
 * Scans:
 *   - rules/*.md  (YAML frontmatter)
 *   - [0-9][0-9]-*\/SKILL.md  (numbered skill dirs)
 *
 * @example
 *   # Human-readable report (default)
 *   node bin/audit-trigger-collisions.mjs
 *
 *   # JSON output
 *   node bin/audit-trigger-collisions.mjs --json
 *
 *   # CI mode — exits 1 only on HIGH collisions
 *   node bin/audit-trigger-collisions.mjs --ci
 *
 * @module audit-trigger-collisions
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const RULES_DIR = join(ROOT, 'rules');

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

/**
 * Parse the process.argv flags into a flags object.
 *
 * @returns {{ json: boolean, ci: boolean }}
 */
function parseFlags() {
  const args = process.argv.slice(2);
  return {
    json: args.includes('--json'),
    ci: args.includes('--ci'),
  };
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (zero external deps)
// ---------------------------------------------------------------------------

/**
 * Extract the raw YAML frontmatter string from a Markdown file's content.
 * Returns null if the file has no opening `---` block.
 *
 * @param {string} content - Full file content.
 * @returns {string | null} Raw YAML text between the first two `---` delimiters.
 *
 * @example
 * extractFrontmatterText('---\nname: foo\n---\nbody')
 * // → 'name: foo\n'
 */
function extractFrontmatterText(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  return content.slice(4, end); // skip opening '---\n'
}

/**
 * Parse a `triggers:` list from raw YAML frontmatter text.
 * Handles both `- "value"` (double-quoted), `- 'value'` (single-quoted),
 * and `- value` (bare) forms. Also handles `triggers: []` (empty inline list).
 *
 * @param {string} yaml - Raw YAML frontmatter text.
 * @returns {string[]} List of raw trigger strings (not yet normalized).
 *
 * @example
 * parseTriggersFromYaml('triggers:\n  - "foo"\n  - bar\n')
 * // → ['foo', 'bar']
 */
function parseTriggersFromYaml(yaml) {
  // Find the triggers: key
  const triggerLineMatch = yaml.match(/^triggers:\s*(.*)$/m);
  if (!triggerLineMatch) return [];

  const inlineValue = triggerLineMatch[1].trim();

  // triggers: [] — explicitly empty
  if (inlineValue === '[]') return [];

  // triggers: ["a", "b"] — inline list (rare but possible)
  if (inlineValue.startsWith('[') && inlineValue.endsWith(']')) {
    const inner = inlineValue.slice(1, -1);
    return inner
      .split(',')
      .map(stripQuotes)
      .filter(Boolean);
  }

  // triggers: followed by indented list items
  // Collect lines that follow the triggers: key and are indented list items
  const triggerKeyIndex = yaml.indexOf(triggerLineMatch[0]);
  const afterTriggerKey = yaml.slice(triggerKeyIndex + triggerLineMatch[0].length);

  const triggers = [];
  const lines = afterTriggerKey.split('\n');
  for (const line of lines) {
    // Stop when we hit a new top-level key (no leading space, not empty, not a list item)
    if (line.length > 0 && line[0] !== ' ' && line[0] !== '\t' && !line.startsWith('-')) {
      break;
    }
    const listItemMatch = line.match(/^\s+-\s+(.+)$/);
    if (listItemMatch) {
      const val = stripQuotes(listItemMatch[1].trim());
      if (val) triggers.push(val);
    }
  }
  return triggers;
}

/**
 * Parse the `name:` field from raw YAML frontmatter text.
 *
 * @param {string} yaml - Raw YAML frontmatter text.
 * @returns {string | null} The name value, or null if absent.
 *
 * @example
 * parseNameFromYaml('name: "my-skill"\n')
 * // → 'my-skill'
 */
function parseNameFromYaml(yaml) {
  const m = yaml.match(/^name:\s*(.+)$/m);
  if (!m) return null;
  return stripQuotes(m[1].trim());
}

/**
 * Strip surrounding single or double quotes from a string.
 *
 * @param {string} s - Input string, possibly quoted.
 * @returns {string} The string without surrounding quotes.
 *
 * @example
 * stripQuotes('"hello"')  // → 'hello'
 * stripQuotes("'world'")  // → 'world'
 * stripQuotes('plain')    // → 'plain'
 */
function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Normalize a trigger phrase for collision comparison.
 * Trims whitespace and lowercases.
 *
 * @param {string} trigger - Raw trigger string.
 * @returns {string} Normalized trigger.
 *
 * @example
 * normalizeTrigger('  Architecture  ')
 * // → 'architecture'
 */
function normalizeTrigger(trigger) {
  return trigger.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Collect all candidate files to scan:
 *   1. rules/*.md
 *   2. [0-9][0-9]-*\/SKILL.md (numbered skill dirs at repo root)
 *
 * @returns {string[]} Absolute file paths.
 */
function collectFiles() {
  const files = [];

  // 1. rules/*.md
  if (existsSync(RULES_DIR)) {
    const rulesEntries = readdirSync(RULES_DIR, { withFileTypes: true });
    for (const entry of rulesEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(join(RULES_DIR, entry.name));
      }
    }
  }

  // 2. Numbered skill dirs: [0-9][0-9]-*/SKILL.md
  const rootEntries = readdirSync(ROOT, { withFileTypes: true });
  const numberedDirRe = /^\d{2}-/;
  for (const entry of rootEntries) {
    if (entry.isDirectory() && numberedDirRe.test(entry.name)) {
      const skillFile = join(ROOT, entry.name, 'SKILL.md');
      if (existsSync(skillFile)) {
        files.push(skillFile);
      }
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FileRecord
 * @property {string} filePath - Absolute path.
 * @property {string} relPath - Path relative to repo root (for display).
 * @property {string | null} name - Parsed `name:` from frontmatter.
 * @property {string[]} triggers - Normalized trigger phrases.
 */

/**
 * @typedef {Object} Collision
 * @property {string} trigger - The normalized trigger phrase.
 * @property {string[]} files - Relative file paths declaring this trigger.
 * @property {'HIGH' | 'MEDIUM'} confidence
 *   HIGH = exact-string duplicate across ≥2 files.
 *   MEDIUM = reserved for future fuzzy matching (not currently emitted).
 */

/**
 * Parse all files and return an array of FileRecords. Skips files with no
 * frontmatter or no triggers list silently.
 *
 * @param {string[]} files - Absolute paths to scan.
 * @returns {FileRecord[]}
 */
function parseFiles(files) {
  const records = [];
  for (const filePath of files) {
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      // Unreadable — skip silently
      continue;
    }
    const yaml = extractFrontmatterText(content);
    if (!yaml) continue;

    const rawTriggers = parseTriggersFromYaml(yaml);
    if (rawTriggers.length === 0) continue;

    const triggers = rawTriggers.map(normalizeTrigger).filter(Boolean);
    const name = parseNameFromYaml(yaml);
    const relPath = relative(ROOT, filePath);

    records.push({ filePath, relPath, name, triggers });
  }
  return records;
}

/**
 * Build an inverted index: normalized trigger → [relPath, ...].
 *
 * @param {FileRecord[]} records
 * @returns {Map<string, string[]>} trigger → list of relPaths
 */
function buildInvertedIndex(records) {
  /** @type {Map<string, string[]>} */
  const index = new Map();
  for (const record of records) {
    for (const trigger of record.triggers) {
      const existing = index.get(trigger) ?? [];
      existing.push(record.relPath);
      index.set(trigger, existing);
    }
  }
  return index;
}

/**
 * Extract collisions from the inverted index.
 * A collision = trigger declared by ≥2 DIFFERENT files.
 * Confidence is always HIGH for exact-string duplicates.
 *
 * @param {Map<string, string[]>} index
 * @returns {Collision[]} Sorted by file count desc, then alphabetically.
 */
function findCollisions(index) {
  /** @type {Collision[]} */
  const collisions = [];
  for (const [trigger, files] of index.entries()) {
    const uniqueFiles = [...new Set(files)];
    if (uniqueFiles.length >= 2) {
      collisions.push({
        trigger,
        files: uniqueFiles,
        confidence: 'HIGH',
      });
    }
  }
  // Sort: most files first, then alphabetically
  collisions.sort((a, b) => {
    const diff = b.files.length - a.files.length;
    if (diff !== 0) return diff;
    return a.trigger.localeCompare(b.trigger);
  });
  return collisions;
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

/**
 * Print a human-readable collision report to stdout.
 *
 * @param {number} totalFiles - Files scanned (with frontmatter + triggers).
 * @param {number} totalScanned - Total files discovered before filtering.
 * @param {number} distinctTriggers - Count of unique normalized triggers.
 * @param {Collision[]} collisions
 * @returns {void}
 */
function printHumanReport(totalScanned, totalFiles, distinctTriggers, collisions) {
  const hasCollisions = collisions.length > 0;
  console.log('');
  console.log('=== audit-trigger-collisions ===');
  console.log('');
  console.log(`Files discovered : ${totalScanned}`);
  console.log(`Files with triggers: ${totalFiles}`);
  console.log(`Distinct triggers  : ${distinctTriggers}`);
  console.log(`Collisions         : ${collisions.length}`);
  console.log('');

  if (!hasCollisions) {
    console.log('No collisions found. Routing is unambiguous.');
    return;
  }

  console.log('--- COLLISIONS ---');
  console.log('');
  for (const col of collisions) {
    console.log(`Trigger : "${col.trigger}"  [${col.confidence}]`);
    console.log(`Files   : (${col.files.length})`);
    for (const f of col.files) {
      console.log(`  - ${f}`);
    }
    console.log('');
  }
}

/**
 * Print a JSON report to stdout.
 *
 * @param {number} totalScanned
 * @param {number} totalWithTriggers
 * @param {number} distinctTriggers
 * @param {Collision[]} collisions
 * @returns {void}
 */
function printJsonReport(totalScanned, totalWithTriggers, distinctTriggers, collisions) {
  const out = {
    summary: {
      filesDiscovered: totalScanned,
      filesWithTriggers: totalWithTriggers,
      distinctTriggers,
      collisionCount: collisions.length,
      highCollisions: collisions.filter(c => c.confidence === 'HIGH').length,
    },
    collisions,
  };
  console.log(JSON.stringify(out, null, 2));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Main entry point. Orchestrates file discovery, parsing, collision detection,
 * and output selection.
 *
 * @returns {void}
 */
function main() {
  const flags = parseFlags();

  const allFiles = collectFiles();
  const records = parseFiles(allFiles);
  const index = buildInvertedIndex(records);
  const collisions = findCollisions(index);

  const totalScanned = allFiles.length;
  const totalWithTriggers = records.length;
  const distinctTriggers = index.size;
  const highCollisions = collisions.filter(c => c.confidence === 'HIGH');

  if (flags.json) {
    printJsonReport(totalScanned, totalWithTriggers, distinctTriggers, collisions);
  } else {
    printHumanReport(totalScanned, totalWithTriggers, distinctTriggers, collisions);
  }

  if (flags.ci) {
    // Per validator-precision-discipline: exit 1 ONLY on HIGH confidence collisions.
    process.exit(highCollisions.length > 0 ? 1 : 0);
  }
}

main();
