#!/usr/bin/env node
/**
 * validate-mcp-tools.mjs — static validator for forged MCP server source files.
 *
 * Parses every mcp-servers/<name>-mcp/mcp-server/src/index.ts WITHOUT executing it.
 * Checks tool declarations for quality gates: description, Zod schema, real handler,
 * no forge stubs, and missing @dangerous annotations on destructive tools.
 *
 * Usage:
 *   node validate-mcp-tools.mjs [--ci] [--server=<name>] [--root=<dir>]
 *
 * Flags:
 *   --ci              NDJSON to stdout; human summary to stderr; exit 1 on violations
 *   --server=NAME     Validate only this server (e.g. resend, stripe)
 *   --root=DIR        Plugin root (default: directory two levels above this script)
 *
 * Exit codes:
 *   0   All servers clean
 *   1   One or more violations found
 *   2   Internal error (bad CLI args, no servers found)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function argVal(name) {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
}

const CI         = args.includes('--ci');
const SERVER_ARG = argVal('server');
const ROOT_ARG   = argVal('root');

const SCRIPT_DIR  = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = ROOT_ARG ? resolve(ROOT_ARG) : resolve(SCRIPT_DIR, '..');
const MCP_BASE    = join(PLUGIN_ROOT, 'mcp-servers');

// ─── Output helpers ───────────────────────────────────────────────────────────

const ts = () => new Date().toISOString();

function out(msg) {
  if (!CI) process.stderr.write(`${msg}\n`);
}

function ndjson(obj) {
  if (CI) process.stdout.write(JSON.stringify({ ts: ts(), ...obj }) + '\n');
}

function die(msg, code = 2) {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(code);
}

// ─── Destructive tool name patterns ──────────────────────────────────────────

const DESTRUCTIVE_RE = /\b(delete_|cancel_|void_|refund_|remove_|destroy_|purge_|revoke_|deactivate_)/i;

// ─── Forge-stub markers (generated but not implemented) ───────────────────────

const STUB_MARKERS = [
  /\/\/ TODO/i,
  /throw new Error\(['"]not implemented['"]\)/i,
  /throw new Error\(['"]TODO['"]\)/i,
  /NOT_IMPLEMENTED/,
  /stub: true/,
];

// ─── Zod passthrough anti-pattern ─────────────────────────────────────────────

const PASSTHROUGH_RE = /\.passthrough\(\)/;

// ─── Tool declaration patterns ────────────────────────────────────────────────
//
// The forged MCP servers use two patterns:
//
// Pattern A (SDK server.tool()):
//   server.tool('tool-name', 'description', ZodSchema, async (input) => { ... })
//
// Pattern B (ListTools + CallTools setRequestHandler):
//   tools: [{ name: 'tool-name', description: '...', inputSchema: {...} }]
//   + case 'tool-name': handler
//
// We detect both by scanning the source text with regexes — no AST needed.

/**
 * Extract all tool names from a ListTools handler block.
 *
 * Accepts three syntactic styles so the validator handles both JSON-style
 * and TS-literal (unquoted-key) object notation:
 *   "name": "tool-name"   — JSON-quoted key + double-quoted value (original)
 *   "name": 'tool-name'   — JSON-quoted key + single-quoted value
 *   name: 'tool-name'     — TS unquoted key + single-quoted value
 *   name: "tool-name"     — TS unquoted key + double-quoted value
 */
function extractListToolsNames(src) {
  const names = new Set();
  // Matches all four syntactic variants for the "name" property.
  // Group 1 = the tool name string (no surrounding quotes).
  const re = /(?:"name"|name)\s*:\s*(?:"([^"]+)"|'([^']+)')/g;
  // Only look inside the ListTools handler block.
  const listBlock = src.match(/setRequestHandler\(ListToolsRequestSchema[\s\S]*?\}\)\s*\)\s*;/);
  const region = listBlock ? listBlock[0] : src;
  let m;
  while ((m = re.exec(region)) !== null) {
    names.add(m[1] ?? m[2]);
  }
  return names;
}

/**
 * Extract description for each tool name from the ListTools block.
 *
 * Accepts all four name/description syntactic variants (JSON-quoted key,
 * TS unquoted key, single-quoted value, double-quoted value).
 */
function extractDescriptions(src) {
  const map = {};
  // name-capture group: m[1] (double-quoted) or m[2] (single-quoted)
  // desc-capture group: m[3] (double-quoted) or m[4] (single-quoted)
  const re = /(?:"name"|name)\s*:\s*(?:"([^"]+)"|'([^']+)')[^}]*?(?:"description"|description)\s*:\s*(?:"([^"]*)"|'([^']*)')/gs;
  let m;
  while ((m = re.exec(src)) !== null) {
    const toolName = m[1] ?? m[2];
    const desc     = m[3] ?? m[4] ?? '';
    map[toolName] = desc;
  }
  return map;
}

/**
 * Extract case branches from the CallTools handler block.
 * Each case corresponds to a handled tool.
 */
function extractHandledCases(src) {
  const allNames = new Set();
  // Match: case 'tool-name': OR if (request.params.name === 'tool-name')
  const caseRe = /case\s+['"]([^'"]+)['"]\s*:/g;
  const ifRe   = /request\.params\.name\s*===\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = caseRe.exec(src)) !== null) allNames.add(m[1]);
  while ((m = ifRe.exec(src)) !== null)   allNames.add(m[1]);

  // Build a live-handler set by scanning line-by-line and skipping any line that
  // contains `if (false` — those are dead-code pruned guards and must not be counted
  // as active handlers (doing so produces false orphaned-handler violations).
  const liveNames = new Set();
  for (const line of src.split('\n')) {
    if (/if\s*\(\s*false/.test(line)) continue;
    const lm = line.match(/request\.params\.name\s*===\s*['"]([^'"]+)['"]/);
    if (lm) liveNames.add(lm[1]);
    const cm = line.match(/case\s+['"]([^'"]+)['"]\s*:/);
    if (cm) liveNames.add(cm[1]);
  }

  // Return only names that have at least one live (non-pruned) occurrence.
  const names = new Set();
  for (const n of allNames) {
    if (liveNames.has(n)) names.add(n);
  }
  return names;
}

/**
 * Extract server.tool() declarations (SDK McpServer pattern).
 * server.tool('name', 'description', Schema, handler)
 */
function extractSdkTools(src) {
  const tools = [];
  const re = /server\.tool\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*([\w.]+)\s*,\s*(async\s*\(|function)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    tools.push({ name: m[1], description: m[2], schemaExpr: m[3], hasHandler: true });
  }
  return tools;
}

/**
 * Derive the PascalCase schema name from a tool name.
 * Handles kebab-case, snake_case, and slash-separated paths (GitHub-style).
 * e.g. "issues/list" → "IssuesList", "post-emails" → "PostEmails"
 */
function toPascal(toolName) {
  return toolName
    .split(/[-_/]/)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');
}

/**
 * Check whether a Zod schema exists for a given tool name.
 *
 * Accepts both module-public and module-private declarations:
 *   export const <PascalName>InputSchema = z.  (exported — original)
 *          const <PascalName>InputSchema = z.  (module-private — equally valid)
 *
 * Both patterns are sound; the `export` modifier only affects external
 * visibility, not the schema's correctness or usage within the file.
 */
function hasZodSchema(src, toolName) {
  const pascal = toPascal(toolName);
  // Allow optional "export " prefix so module-private `const` schemas pass.
  const schemaRe = new RegExp(`(?:export\\s+)?const\\s+${pascal}InputSchema\\s*=\\s*z\\.`);
  return schemaRe.test(src);
}

/**
 * Check whether the schema for a tool uses .passthrough() (forbidden).
 */
function schemaUsesPassthrough(src, toolName) {
  const pascal = toPascal(toolName);
  // Probe both export and non-export declarations.
  const exportIdx  = src.indexOf(`export const ${pascal}InputSchema`);
  const privateIdx = src.indexOf(`const ${pascal}InputSchema`);
  const schemaStart = exportIdx !== -1 ? exportIdx
                    : privateIdx !== -1 ? privateIdx
                    : -1;
  if (schemaStart === -1) return false;
  const schemaChunk = src.slice(schemaStart, schemaStart + 300);
  return PASSTHROUGH_RE.test(schemaChunk);
}

/**
 * Check whether the handler for a tool contains stub markers.
 * Looks at the case branch or SDK handler for TODO / throw-not-implemented.
 */
function handlerIsStub(src, toolName) {
  // Find the case block for this tool
  const caseRe = new RegExp(`case\\s+['"]${toolName.replace(/[-]/g, '[-]')}['"]\\s*:[\\s\\S]{0,800}?(?=case\\s+|default\\s*:|\\}\\s*\\})`, 'i');
  const block = src.match(caseRe);
  const region = block ? block[0] : '';
  return STUB_MARKERS.some(re => re.test(region));
}

/**
 * Check for @dangerous JSDoc on a destructive tool.
 */
function hasDangerousAnnotation(src, toolName) {
  // Look for @dangerous within 400 chars before the tool's case/declaration
  const idx = src.indexOf(`"${toolName}"`);
  if (idx === -1) return false;
  const before = src.slice(Math.max(0, idx - 400), idx);
  return /@dangerous/.test(before);
}

// ─── Validate one server ──────────────────────────────────────────────────────

function validateServer(serverDir) {
  const serverName = basename(serverDir);
  const srcPath = join(serverDir, 'mcp-server', 'src', 'index.ts');

  if (!existsSync(srcPath)) {
    return {
      server:     serverName,
      skipped:    true,
      reason:     'no src/index.ts',
      violations: [],
    };
  }

  const src = readFileSync(srcPath, 'utf8');

  // Determine pattern: SDK server.tool() vs setRequestHandler pattern
  const usesSetRequestHandler = src.includes('setRequestHandler(ListToolsRequestSchema');
  const usesSdkTool           = src.includes('server.tool(');

  const violations = [];

  if (usesSetRequestHandler) {
    const toolNames    = extractListToolsNames(src);
    const descriptions = extractDescriptions(src);
    const handled      = extractHandledCases(src);

    for (const name of toolNames) {
      // 1. Description non-empty
      const desc = descriptions[name] ?? '';
      if (!desc.trim()) {
        violations.push({ tool: name, kind: 'missing-description', detail: 'tool has empty description in ListTools' });
      }

      // 2. Zod schema present
      if (!hasZodSchema(src, name)) {
        violations.push({ tool: name, kind: 'missing-zod-schema', detail: `no export const ${toPascal(name)}InputSchema found` });
      } else if (schemaUsesPassthrough(src, name)) {
        violations.push({ tool: name, kind: 'schema-passthrough', detail: '.passthrough() is forbidden — use .strict()' });
      }

      // 3. Handler present (not unhandled)
      if (!handled.has(name)) {
        violations.push({ tool: name, kind: 'unhandled-tool', detail: 'tool appears in ListTools but has no case branch in CallTools handler' });
      } else if (handlerIsStub(src, name)) {
        violations.push({ tool: name, kind: 'stub-handler', detail: 'handler contains TODO or throw-not-implemented' });
      }

      // 4. Destructive tools need @dangerous
      if (DESTRUCTIVE_RE.test(name) && !hasDangerousAnnotation(src, name)) {
        violations.push({ tool: name, kind: 'missing-dangerous-annotation', detail: `destructive tool '${name}' lacks /** @dangerous */ JSDoc` });
      }
    }

    // 5. Check for tools in CallTools that are NOT in ListTools (orphaned handlers)
    for (const name of handled) {
      if (!toolNames.has(name)) {
        violations.push({ tool: name, kind: 'orphaned-handler', detail: 'tool has a case branch but is not listed in ListTools' });
      }
    }

  } else if (usesSdkTool) {
    const sdkTools = extractSdkTools(src);

    for (const t of sdkTools) {
      if (!t.description.trim()) {
        violations.push({ tool: t.name, kind: 'missing-description', detail: 'second arg to server.tool() is empty' });
      }
      if (!t.schemaExpr || t.schemaExpr === 'undefined') {
        violations.push({ tool: t.name, kind: 'missing-zod-schema', detail: 'no Zod schema expression passed as third arg' });
      }
      if (!t.hasHandler) {
        violations.push({ tool: t.name, kind: 'missing-handler', detail: 'no handler function detected after schema arg' });
      }
      if (DESTRUCTIVE_RE.test(t.name) && !hasDangerousAnnotation(src, t.name)) {
        violations.push({ tool: t.name, kind: 'missing-dangerous-annotation', detail: `destructive tool '${t.name}' lacks /** @dangerous */ JSDoc` });
      }
    }

    if (sdkTools.length === 0) {
      violations.push({ tool: '*', kind: 'no-tools-found', detail: 'no server.tool() declarations found — possibly different pattern; manual review required' });
    }

  } else {
    violations.push({ tool: '*', kind: 'unknown-pattern', detail: 'neither setRequestHandler(ListToolsRequestSchema nor server.tool() found in src/index.ts' });
  }

  // 6. Global stub scan (catch stubs not tied to a specific tool)
  for (const marker of STUB_MARKERS) {
    if (marker.test(src)) {
      const alreadyFlagged = violations.some(v => v.kind === 'stub-handler');
      if (!alreadyFlagged) {
        violations.push({ tool: '*', kind: 'global-stub', detail: `source contains stub marker: ${marker}` });
      }
      break;
    }
  }

  return { server: serverName, skipped: false, violations };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (!existsSync(MCP_BASE)) {
  die(`mcp-servers dir not found: ${MCP_BASE}`);
}

let serverDirs = readdirSync(MCP_BASE, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.endsWith('-mcp'))
  .map(d => join(MCP_BASE, d.name))
  .sort();

if (SERVER_ARG) {
  serverDirs = serverDirs.filter(d => basename(d) === `${SERVER_ARG}-mcp` || basename(d) === SERVER_ARG);
  if (serverDirs.length === 0) die(`No server found matching '${SERVER_ARG}'`);
}

if (serverDirs.length === 0) die('No *-mcp directories found');

out(`\nMCP Tool Surface Validator — ${ts()}`);
out('═'.repeat(50));

let totalViolations = 0;
let totalSkipped    = 0;
let totalClean      = 0;

for (const serverDir of serverDirs) {
  const result = validateServer(serverDir);

  ndjson({ event: 'server-result', server: result.server, skipped: result.skipped, violations: result.violations });

  if (result.skipped) {
    totalSkipped++;
    out(`  SKIP  ${result.server} — ${result.reason}`);
    continue;
  }

  if (result.violations.length === 0) {
    totalClean++;
    out(`  ✓  ${result.server}`);
  } else {
    totalViolations += result.violations.length;
    out(`  ✗  ${result.server}  (${result.violations.length} violation${result.violations.length === 1 ? '' : 's'})`);
    for (const v of result.violations) {
      out(`       [${v.kind}] ${v.tool !== '*' ? v.tool + ' — ' : ''}${v.detail}`);
      ndjson({ event: 'violation', server: result.server, ...v });
    }
  }
}

out('');
out(`SUMMARY  ${serverDirs.length} servers checked · ${totalClean} clean · ${totalSkipped} skipped · ${totalViolations} violation(s)`);

if (totalViolations > 0) {
  out(`STATUS   FAIL`);
  ndjson({ event: 'summary', servers: serverDirs.length, clean: totalClean, skipped: totalSkipped, violations: totalViolations, exit: 1 });
  process.exit(1);
} else {
  out(`STATUS   PASS`);
  ndjson({ event: 'summary', servers: serverDirs.length, clean: totalClean, skipped: totalSkipped, violations: 0, exit: 0 });
  process.exit(0);
}
