#!/usr/bin/env node
/**
 * audit-crosslinks.mjs
 *
 * Scans every `rules/*.md`, `commands/*.md`, and numbered-skill SKILL.md files
 * for wiki-style cross-links of the form `[[slug]]` and reports any that cannot
 * be resolved to an existing file or directory.
 *
 * Resolution order for a normalised `<slug>` (repo root = parent of bin/):
 *   1. `rules/<slug>.md` exists
 *   2. `commands/<slug>.md` exists
 *   3. A top-level directory whose name equals `<slug>` OR matches `<NN>-<slug>`
 *      (e.g. `06-build-and-slice-loop` resolves `[[build-and-slice-loop]]`)
 *   4. `skills/<slug>/` directory exists OR `skills/<slug>/SKILL.md` exists
 *   5. `<slug>/SKILL.md` exists (any top-level directory named `<slug>`)
 *
 * Slug pre-processing before resolution:
 *   - Strip surrounding backticks (`` `[[slug]]` ``)
 *   - Strip `#anchor` suffix
 *   - Trim whitespace
 *   - Strip surrounding backticks AGAIN after anchor strip (edge cases)
 *
 * Skips `[[slug]]` occurrences that appear:
 *   - Inside fenced ```code``` blocks
 *   - Inside inline-code backtick spans (`` `...[[slug]]...` ``)
 *
 * Zero external dependencies — uses only node:fs, node:path, node:url.
 *
 * @example
 * # Human-readable grouped report
 * node bin/audit-crosslinks.mjs
 *
 * # JSON output
 * node bin/audit-crosslinks.mjs --json
 *
 * # CI mode — exits 1 if any broken link found, else 0
 * node bin/audit-crosslinks.mjs --ci
 *
 * # Combine flags
 * node bin/audit-crosslinks.mjs --json --ci
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const RULES_DIR = join(REPO_ROOT, 'rules');
const COMMANDS_DIR = join(REPO_ROOT, 'commands');
const SKILLS_DIR = join(REPO_ROOT, 'skills');

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

/**
 * Recursively collects all .md files under a directory.
 *
 * @param {string} dir - Absolute directory path to walk.
 * @returns {string[]} Sorted list of absolute file paths.
 * @example
 * collectMarkdownFiles('/path/to/rules')
 * // → ['/path/to/rules/always.md', '/path/to/rules/drift-detection.md', ...]
 */
function collectMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];
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

// ---------------------------------------------------------------------------
// Index building
// ---------------------------------------------------------------------------

/**
 * Builds a Set of top-level directory names under the repo root.
 *
 * @returns {Set<string>} Set of directory base names.
 * @example
 * buildTopLevelDirSet()
 * // → Set { '01-operating-system', 'bin', 'rules', 'skills', ... }
 */
function buildTopLevelDirSet() {
  const dirs = new Set();
  for (const entry of readdirSync(REPO_ROOT, { withFileTypes: true })) {
    if (entry.isDirectory()) dirs.add(entry.name);
  }
  return dirs;
}

/**
 * Builds a Set of skill sub-directory names under `skills/`.
 *
 * @returns {Set<string>} e.g. Set { 'bitwarden', 'github', 'resend', ... }
 */
function buildSkillsDirSet() {
  const dirs = new Set();
  if (!existsSync(SKILLS_DIR)) return dirs;
  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) dirs.add(entry.name);
  }
  return dirs;
}

/**
 * Builds a Set of `.md` file stems found inside every top-level numbered
 * skill directory matching pattern "[0-9][0-9]-<rest>".
 *
 * For example, 05-architecture-and-stack/background-jobs-and-workflows.md
 * contributes the stem "background-jobs-and-workflows" to the Set.
 *
 * Only scans one level deep (direct children of each numbered dir).
 *
 * @returns {Set<string>} Set of md stems from numbered skill dirs.
 * @example
 * buildNumberedDirMdStemsSet()
 * // → Set { 'background-jobs-and-workflows', 'stripe-billing', ... }
 */
function buildNumberedDirMdStemsSet() {
  const stems = new Set();
  for (const entry of readdirSync(REPO_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^\d+-/.test(entry.name)) continue;
    const dirPath = join(REPO_ROOT, entry.name);
    for (const child of readdirSync(dirPath, { withFileTypes: true })) {
      if (child.isFile() && child.name.endsWith('.md')) {
        stems.add(child.name.slice(0, -3)); // strip .md suffix
      }
    }
  }
  return stems;
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
 * @example
 * buildFencedCodeMask(['prose', '```', 'code', '```', 'more prose'])
 * // → [false, true, true, true, false]
 */
function buildFencedCodeMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        mask[i] = true;
      } else {
        inCode = false;
        mask[i] = true;
      }
    } else {
      mask[i] = inCode;
    }
  }
  return mask;
}

/**
 * Strips all inline-code spans (`` `...` ``) from a line so that `[[slug]]`
 * occurrences inside them are not scanned.
 *
 * Uses a simple greedy approach: removes everything between matched backtick
 * pairs. Double-backtick spans (``` `` ``` ) are handled first.
 *
 * @param {string} line
 * @returns {string} Line with inline-code spans replaced by spaces.
 * @example
 * stripInlineCode('See `[[ref]]` for details')
 * // → 'See              for details'
 */
function stripInlineCode(line) {
  // Strip double-backtick spans first (`` ... ``)
  let result = line.replace(/``[^`]*``/g, m => ' '.repeat(m.length));
  // Strip single-backtick spans
  result = result.replace(/`[^`]*`/g, m => ' '.repeat(m.length));
  return result;
}

// ---------------------------------------------------------------------------
// Slug normalisation
// ---------------------------------------------------------------------------

/**
 * Normalises a raw slug extracted from `[[...]]` before resolution:
 *   - Strips surrounding backticks
 *   - Strips `#anchor` suffix
 *   - Trims whitespace
 *
 * @param {string} raw - The text captured between `[[` and `]]`.
 * @returns {string} Normalised slug ready for resolution.
 * @example
 * normaliseSlug('`drift-detection`')      // → 'drift-detection'
 * normaliseSlug('verification-loop#ci')  // → 'verification-loop'
 * normaliseSlug('  always  ')            // → 'always'
 */
function normaliseSlug(raw) {
  let s = raw.trim();
  // Strip surrounding backticks
  s = s.replace(/^`+|`+$/g, '');
  // Strip #anchor
  const hashIdx = s.indexOf('#');
  if (hashIdx !== -1) s = s.slice(0, hashIdx);
  // Strip backticks again (edge case: `slug#anchor` → `slug`)
  s = s.replace(/^`+|`+$/g, '');
  return s.trim();
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a normalised slug against the repository structure using six
 * strategies (first match wins):
 *
 *   1. `rules/<slug>.md`
 *   2. `commands/<slug>.md`
 *   3. Top-level dir named exactly `<slug>`, OR named `<NN>-<slug>`
 *   4. `skills/<slug>/` directory, OR `skills/<slug>/SKILL.md`
 *   5. `<slug>/SKILL.md` (top-level directory named `<slug>`)
 *   6. "<slug>.md" exists as a direct child of any numbered skill dir (NN-name)
 *      e.g. 05-architecture-and-stack/background-jobs-and-workflows.md
 *
 * @param {string} slug - Normalised slug.
 * @param {Set<string>} topLevelDirs - All top-level directory names.
 * @param {Set<string>} skillsDirs - Directory names under skills/.
 * @param {Set<string>} numberedDirMdStems - .md stems from numbered skill dirs.
 * @returns {boolean} True if the slug resolves.
 * @example
 * resolveSlug('drift-detection', topLevelDirs, skillsDirs, numberedDirMdStems)   // → true
 * resolveSlug('audit-doctrine', topLevelDirs, skillsDirs, numberedDirMdStems)    // → true (commands/)
 * resolveSlug('nonexistent', topLevelDirs, skillsDirs, numberedDirMdStems)       // → false
 */
function resolveSlug(slug, topLevelDirs, skillsDirs, numberedDirMdStems) {
  if (!slug) return false;

  // Strategy 1 — rules/<slug>.md
  if (existsSync(join(RULES_DIR, `${slug}.md`))) return true;

  // Strategy 2 — commands/<slug>.md
  if (existsSync(join(COMMANDS_DIR, `${slug}.md`))) return true;

  // Strategy 3 — top-level directory:
  //   a) exact name match (e.g. [[bin]], [[skills]])
  //   b) <NN>-<slug> pattern (e.g. [[build-and-slice-loop]] → 06-build-and-slice-loop)
  if (topLevelDirs.has(slug)) return true;
  for (const dir of topLevelDirs) {
    // Match NN-<slug> where NN is one or more digits
    if (/^\d+-/.test(dir) && dir.replace(/^\d+-/, '') === slug) return true;
  }

  // Strategy 4 — skills/<slug>/ directory or skills/<slug>/SKILL.md
  if (skillsDirs.has(slug)) return true;
  if (existsSync(join(SKILLS_DIR, slug, 'SKILL.md'))) return true;

  // Strategy 5 — <slug>/SKILL.md (top-level directory named slug)
  if (topLevelDirs.has(slug) && existsSync(join(REPO_ROOT, slug, 'SKILL.md'))) return true;
  // Also check numbered dirs for SKILL.md (slug matches the part after NN-)
  for (const dir of topLevelDirs) {
    if (/^\d+-/.test(dir) && dir.replace(/^\d+-/, '') === slug) {
      if (existsSync(join(REPO_ROOT, dir, 'SKILL.md'))) return true;
    }
  }

  // Strategy 6 — <slug>.md exists inside any [0-9][0-9]-*/ numbered skill dir
  if (numberedDirMdStems.has(slug)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Link extraction
// ---------------------------------------------------------------------------

/**
 * Extracts all broken `[[slug]]` cross-link occurrences from a file's lines,
 * skipping lines inside fenced code blocks and stripping inline-code spans
 * before scanning.
 *
 * @param {string} absPath - Absolute path to the file.
 * @param {string[]} lines - File content split on `\n`.
 * @param {boolean[]} fencedMask - Per-line fenced-code-block mask.
 * @param {Set<string>} topLevelDirs
 * @param {Set<string>} skillsDirs
 * @param {Set<string>} numberedDirMdStems
 * @returns {Array<{ file: string, line: number, slug: string, confidence: 'HIGH' }>}
 *   Only entries where the slug does NOT resolve (broken links).
 * @example
 * // Given a file with '- See [[nonexistent]] for details' on line 5
 * extractBrokenLinks('/rules/foo.md', lines, fencedMask, topLevelDirs, skillsDirs, numberedDirMdStems)
 * // → [{ file: 'rules/foo.md', line: 5, slug: 'nonexistent', confidence: 'HIGH' }]
 */
function extractBrokenLinks(absPath, lines, fencedMask, topLevelDirs, skillsDirs, numberedDirMdStems) {
  const rel = relative(REPO_ROOT, absPath);
  const broken = [];
  const LINK_RE = /\[\[([^\]]+)\]\]/g;

  for (let i = 0; i < lines.length; i++) {
    if (fencedMask[i]) continue;
    // Strip inline-code spans before scanning so [[slug]] inside backticks is ignored
    const line = stripInlineCode(lines[i]);
    let match;
    LINK_RE.lastIndex = 0;
    while ((match = LINK_RE.exec(line)) !== null) {
      const slug = normaliseSlug(match[1]);
      if (!slug) continue;
      if (!resolveSlug(slug, topLevelDirs, skillsDirs, numberedDirMdStems)) {
        broken.push({ file: rel, line: i + 1, slug, confidence: 'HIGH' });
      }
    }
  }
  return broken;
}

// ---------------------------------------------------------------------------
// Human-readable report
// ---------------------------------------------------------------------------

/**
 * Prints the grouped human-readable broken-link report to stdout.
 *
 * @param {{ summary: object, broken: object[] }} report
 * @param {{ totalLinks: number }} extras
 */
function printHumanReport(report, extras) {
  const { summary, broken } = report;
  const { totalLinks } = extras;

  console.log('\n=== Cross-Link Audit ===\n');

  if (broken.length === 0) {
    console.log('  ✓ No broken links found.');
  } else {
    // Group by file
    /** @type {Map<string, object[]>} */
    const byFile = new Map();
    for (const b of broken) {
      if (!byFile.has(b.file)) byFile.set(b.file, []);
      byFile.get(b.file).push(b);
    }

    for (const [file, hits] of byFile) {
      console.log(`  ${file}`);
      for (const h of hits) {
        console.log(`    HIGH    L${h.line}  [[${h.slug}]]`);
      }
    }
  }

  // Distinct broken slugs
  const distinctSlugs = [...new Set(broken.map(b => b.slug))].sort();
  if (distinctSlugs.length > 0) {
    console.log('\n--- Distinct broken slugs ---');
    for (const slug of distinctSlugs) {
      const refs = broken.filter(b => b.slug === slug).map(b => `${b.file}:${b.line}`);
      console.log(`  [[${slug}]]  missing  (${refs.length} reference${refs.length === 1 ? '' : 's'})`);
      for (const r of refs.slice(0, 5)) {
        console.log(`    ↳ ${r}`);
      }
      if (refs.length > 5) console.log(`    ↳ … and ${refs.length - 5} more`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Files scanned  : ${summary.filesScanned}`);
  console.log(`  Total links    : ${totalLinks}`);
  console.log(`  Broken links   : ${summary.brokenCount}  (HIGH — distinct slugs: ${distinctSlugs.length})`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point. Parses flags, scans all rules/*.md (and commands/*.md) for
 * [[slug]] links, reports broken ones, and exits.
 */
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const ciMode = args.includes('--ci');

  const topLevelDirs = buildTopLevelDirSet();
  const skillsDirs = buildSkillsDirSet();
  const numberedDirMdStems = buildNumberedDirMdStemsSet();

  // Collect all .md files to scan: rules/ + commands/
  const allFiles = [
    ...collectMarkdownFiles(RULES_DIR),
    ...collectMarkdownFiles(COMMANDS_DIR),
  ];

  const allBroken = [];
  let totalLinks = 0;

  for (const absPath of allFiles) {
    const raw = readFileSync(absPath, 'utf8');
    const lines = raw.split('\n');
    const fencedMask = buildFencedCodeMask(lines);

    // Count all links (including resolved) for summary
    for (let i = 0; i < lines.length; i++) {
      if (fencedMask[i]) continue;
      const scanned = stripInlineCode(lines[i]);
      const matches = scanned.match(/\[\[[^\]]+\]\]/g);
      if (matches) totalLinks += matches.length;
    }

    const broken = extractBrokenLinks(absPath, lines, fencedMask, topLevelDirs, skillsDirs, numberedDirMdStems);
    allBroken.push(...broken);
  }

  const distinctSlugs = [...new Set(allBroken.map(b => b.slug))].sort();

  const summary = {
    filesScanned: allFiles.length,
    totalLinks,
    brokenCount: allBroken.length,
    distinctBrokenSlugCount: distinctSlugs.length,
    distinctBrokenSlugs: distinctSlugs,
  };

  const report = { summary, broken: allBroken };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport(report, { totalLinks });
  }

  if (ciMode) {
    process.exit(allBroken.length > 0 ? 1 : 0);
  }
}

main();
