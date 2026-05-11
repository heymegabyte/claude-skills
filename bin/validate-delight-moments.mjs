#!/usr/bin/env node
/**
 * validate-delight-moments.mjs — INFO MODE stub.
 *
 * Rule: Delight moments floor min(iter+1, 6) per build.
 * Reference: ~/.agentskills/creativity-doctrine.md
 *
 * Contract: read `process.argv[2]` as a dist/ directory and `process.argv[3]`
 * as an optional `_iteration_log.json` path. Emit a single structured JSON
 * line to stdout describing pass/warn, exit 0 always (info mode).
 *
 * Flip `STRICT = true` once the underlying generator ships clean across all
 * benchmark sites (megabyte-labs, njsk, nyfb, vito's, lonemountainglobal).
 */
const STRICT = false;
const NAME = "validate-delight-moments";
const RULE_REF = "creativity-doctrine";
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
