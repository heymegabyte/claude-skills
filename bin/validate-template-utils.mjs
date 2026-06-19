#!/usr/bin/env node
/**
 * validate-template-utils.mjs — Production validator for template/utils/ conventions.
 *
 * Enforces `rules/template-utility-conventions.md`. Run in CI and pre-commit.
 *
 * Usage:
 *   node bin/validate-template-utils.mjs          # print violations, exit 0
 *   node bin/validate-template-utils.mjs --ci     # exit 1 on any violation
 *
 * Checks per file:
 *   [V1] Has `if (import.meta.vitest)` co-located test block
 *   [V2] No external imports beyond node:, cloudflare:, zod (zod = warn only)
 *   [V3] Has frontmatter JSDoc with @module
 *   [V4] Every exported function/const/class has JSDoc with @example
 *   [V5] No process.env.* references (Workers-incompat)
 *   [V6] No require(...) calls (ESM only)
 *   [V7] No bare `throw new Error(` (must use typed subclass)
 *   [V8] No default exports (named exports only)
 *
 * Self-contained: zero npm deps, only node:* modules.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const UTILS_DIR = join(__dirname, "..", "template", "utils");
const CI_MODE = process.argv.includes("--ci");

// ---------------------------------------------------------------------------
// Violation types
// ---------------------------------------------------------------------------

/** @typedef {{ file: string, line: number|null, id: string, message: string, level: 'error'|'warn' }} Violation */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find 1-based line numbers of all matches of a regex in source.
 *
 * @param {string} src - File source text.
 * @param {RegExp} re  - Pattern to search (global flag recommended).
 * @returns {number[]} Sorted array of line numbers.
 */
function findLines(src, re) {
  const lines = src.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) hits.push(i + 1);
  }
  return hits;
}

/**
 * Return the 1-based line number of the first match, or null if none.
 *
 * @param {string} src - File source text.
 * @param {RegExp} re  - Search pattern.
 * @returns {number|null}
 */
function firstLine(src, re) {
  const hits = findLines(src, re);
  return hits.length > 0 ? hits[0] : null;
}

// ---------------------------------------------------------------------------
// Per-file checks
// ---------------------------------------------------------------------------

/**
 * Run all convention checks against a single source file.
 *
 * @param {string} file - Basename of the file.
 * @param {string} src  - Full source text.
 * @returns {Violation[]} List of violations found.
 */
function checkFile(file, src) {
  /** @type {Violation[]} */
  const violations = [];

  /**
   * @param {string} id
   * @param {string} message
   * @param {number|null} line
   * @param {'error'|'warn'} level
   */
  const fail = (id, message, line = null, level = "error") => {
    violations.push({ file, line, id, message, level });
  };

  // [V1] Co-located vitest block
  if (!src.includes("import.meta.vitest")) {
    fail("V1", "missing `if (import.meta.vitest)` co-located test block");
  }

  // [V2] External imports — allow node:, cloudflare:, zod
  const importLines = src.split("\n");
  for (let i = 0; i < importLines.length; i++) {
    const line = importLines[i];
    // Match import statements
    const importMatch = line.match(/^\s*import\s+(type\s+)?.*\s+from\s+["']([^"']+)["']/);
    if (!importMatch) continue;
    const specifier = importMatch[2];
    if (specifier.startsWith("node:") || specifier.startsWith("cloudflare:")) continue;
    if (specifier.startsWith(".")) continue; // relative — ok
    if (specifier === "zod" || specifier.startsWith("zod/")) {
      fail(
        "V2",
        `zod import detected — acceptable if essential, but prefer zero-dep approach`,
        i + 1,
        "warn",
      );
      continue;
    }
    fail("V2", `external import not allowed: "${specifier}"`, i + 1);
  }

  // [V3] Frontmatter JSDoc with @module
  if (!src.includes("@module")) {
    fail("V3", "file-level JSDoc missing `@module` tag in frontmatter");
  }

  // [V4] Every exported function/const/class/type has a @example JSDoc
  // Strategy: find export declarations and look backward for @example in the preceding JSDoc block.
  const srcLines = src.split("\n");
  const exportRe = /^export\s+(async\s+)?(function|const|class|type|interface)\s+(\w+)/;
  for (let i = 0; i < srcLines.length; i++) {
    const m = srcLines[i].match(exportRe);
    if (!m) continue;
    const exportedName = m[3];

    // Skip type/interface — @example not required for pure type exports
    if (m[2] === "type" || m[2] === "interface") continue;

    // Search backward for a JSDoc block starting with /**
    let hasExample = false;
    let inJsdoc = false;
    for (let j = i - 1; j >= Math.max(0, i - 30); j--) {
      const l = srcLines[j].trim();
      if (l === "*/") {
        inJsdoc = true;
      }
      if (inJsdoc && l.startsWith("* @example")) {
        hasExample = true;
        break;
      }
      if (l.startsWith("/**")) {
        break; // reached start of JSDoc — stop scanning
      }
    }

    if (!hasExample) {
      fail(
        "V4",
        `exported \`${exportedName}\` is missing a JSDoc \`@example\` block`,
        i + 1,
      );
    }
  }

  // [V5] process.env.* references (Workers-incompat)
  // Allow inside import.meta.vitest blocks — check for process.env outside test guard
  // Simple heuristic: flag any process.env.UPPERCASE outside a vitest block
  const vitestStart = src.indexOf("if (import.meta.vitest)");
  const outsideVitest = vitestStart >= 0 ? src.slice(0, vitestStart) : src;
  const processEnvRe = /process\.env\.[A-Z_]+/g;
  let envMatch;
  while ((envMatch = processEnvRe.exec(outsideVitest)) !== null) {
    const lineNum = outsideVitest.slice(0, envMatch.index).split("\n").length;
    fail("V5", `direct \`process.env.*\` access — pass env as a typed parameter instead`, lineNum);
  }

  // [V6] require(...) calls — ESM only
  const requireLines = findLines(src, /\brequire\s*\(/);
  for (const lineNum of requireLines) {
    fail("V6", "`require()` call detected — use ESM `import` only", lineNum);
  }

  // [V7] Bare `throw new Error(` — must use typed subclass
  const bareErrorLines = findLines(src, /throw\s+new\s+Error\s*\(/);
  for (const lineNum of bareErrorLines) {
    fail("V7", "bare `throw new Error(` — declare and use a typed Error subclass", lineNum);
  }

  // [V8] Default exports
  const defaultExportLine = firstLine(src, /^export\s+default\s+/);
  if (defaultExportLine !== null) {
    fail("V8", "`export default` detected — use named exports only", defaultExportLine);
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let allFiles;
  try {
    allFiles = await readdir(UTILS_DIR);
  } catch {
    console.error(`ERROR: Cannot read ${UTILS_DIR} — does template/utils/ exist?`);
    process.exit(CI_MODE ? 1 : 0);
    return;
  }

  // Exclude test files and barrel index
  const utilFiles = allFiles.filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "index.ts",
  );

  if (utilFiles.length === 0) {
    console.log("No utility files found in template/utils/ — nothing to validate.");
    return;
  }

  /** @type {Violation[]} */
  const allViolations = [];

  for (const file of utilFiles) {
    const filePath = join(UTILS_DIR, file);
    const src = await readFile(filePath, "utf8");
    const violations = checkFile(file, src);
    allViolations.push(...violations);
  }

  // Group by file and print
  const errors = allViolations.filter((v) => v.level === "error");
  const warnings = allViolations.filter((v) => v.level === "warn");

  if (allViolations.length === 0) {
    console.log(`✓ ${utilFiles.length} utility file(s) passed all conventions.`);
    return;
  }

  // Print errors
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):\n`);
    for (const v of errors) {
      const loc = v.line != null ? `${v.file}:${v.line}` : v.file;
      console.error(`  [${v.id}] ${loc} — ${v.message}`);
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn(`\n${warnings.length} warning(s):\n`);
    for (const v of warnings) {
      const loc = v.line != null ? `${v.file}:${v.line}` : v.file;
      console.warn(`  [${v.id}] ${loc} — ${v.message}`);
    }
  }

  console.log(
    `\nScanned ${utilFiles.length} file(s): ${errors.length} error(s), ${warnings.length} warning(s).`,
  );

  if (CI_MODE && errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
