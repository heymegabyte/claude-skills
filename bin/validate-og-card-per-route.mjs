#!/usr/bin/env node
/**
 * validate-og-card-per-route.mjs — INFO MODE stub.
 *
 * Rule: Per-route OG 1200×630 branded card (≤100KB).
 * Reference: ~/.agentskills/always.md / per-route-metadata.md
 *
 * Contract: read `process.argv[2]` as a dist/ directory and `process.argv[3]`
 * as an optional `_iteration_log.json` path. Emit a single structured JSON
 * line to stdout describing pass/warn, exit 0 always (info mode).
 *
 * Flip `STRICT = true` once the underlying generator ships clean across all
 * benchmark sites (megabyte-labs, njsk, nyfb, vito's, lonemountainglobal).
 */
const STRICT = false;
const NAME = "validate-og-card-per-route";
const RULE_REF = "always.md / per-route-metadata";
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
