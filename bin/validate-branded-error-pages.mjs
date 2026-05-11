#!/usr/bin/env node
/**
 * validate-branded-error-pages.mjs — INFO MODE stub.
 *
 * Rule: Branded 404 + 500 pages with brand palette + mascot.
 * Reference: ~/.agentskills/15/build-breaking-rules.md
 *
 * Contract: read `process.argv[2]` as a dist/ directory and `process.argv[3]`
 * as an optional `_iteration_log.json` path. Emit a single structured JSON
 * line to stdout describing pass/warn, exit 0 always (info mode).
 *
 * Flip `STRICT = true` once the underlying generator ships clean across all
 * benchmark sites (megabyte-labs, njsk, nyfb, vito's, lonemountainglobal).
 */
const STRICT = false;
const NAME = "validate-branded-error-pages";
const RULE_REF = "15/build-breaking-rules";
const distDir = process.argv[2] || process.env.DIST_DIR || 'dist';
const iterLog = process.argv[3] || process.env.ITER_LOG || '';

const payload = {
  validator: NAME,
  rule_ref: RULE_REF,
  mode: STRICT ? 'strict' : 'info',
  dist_dir: distDir,
  iteration_log: iterLog || null,
  status: 'stub',
  message: "Stub validator — TODO: implement detection logic.",
  ts: new Date().toISOString(),
};
process.stdout.write(JSON.stringify(payload) + '\n');
process.exit(0);
