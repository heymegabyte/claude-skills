#!/usr/bin/env node
/**
 * validate-ttfr.mjs — TTFR North Star validator.
 *
 * Rule: LCP ≤ 2000ms, FCP ≤ 1200ms on cold-cache throttled 3G.
 *       Per rules/ttfr-north-star.md.
 *
 * Usage:
 *   node validate-ttfr.mjs --url=https://example.com [options]
 *
 * Flags:
 *   --url=URL           (required) Production URL to audit
 *   --breakpoint=N      Viewport width: 375|390|768|1024|1280|1920 (default: 375)
 *   --lcp=N             LCP threshold ms (default: 2000)
 *   --fcp=N             FCP threshold ms (default: 1200)
 *   --dry-run           Resolve deps only; skip Lighthouse run
 *   --ci                Machine-readable NDJSON to stdout
 *   --history=DIR       Dir for NDJSON run history (default: tools/ttfr/runs)
 *
 * Exit codes:
 *   0  All thresholds pass
 *   1  Threshold violation or regression vs prior run
 *   2  Missing dependency or internal error
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function argVal(name) {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
}

const URL_ARG      = argVal('url');
const BP_ARG       = parseInt(argVal('breakpoint') ?? '375', 10);
const LCP_LIMIT    = parseInt(argVal('lcp') ?? '2000', 10);
const FCP_LIMIT    = parseInt(argVal('fcp') ?? '1200', 10);
const DRY_RUN      = args.includes('--dry-run');
const CI           = args.includes('--ci');
const HISTORY_DIR  = argVal('history') ?? join(process.cwd(), 'tools', 'ttfr', 'runs');

const VALID_BPS = new Set([375, 390, 768, 1024, 1280, 1920]);

// ─── Output helpers ───────────────────────────────────────────────────────────

function ndjson(obj) {
  process.stdout.write(JSON.stringify({ ...obj, ts: new Date().toISOString() }) + '\n');
}

function out(msg) {
  if (!CI) process.stderr.write(`${msg}\n`);
}

function banner(msg) {
  if (!CI) out(`\n${msg}\n${'─'.repeat(62)}`);
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateArgs() {
  if (!URL_ARG) {
    process.stderr.write('[error] --url=<url> is required\n');
    process.stderr.write('Usage: node validate-ttfr.mjs --url=https://example.com [--breakpoint=375]\n');
    process.exit(2);
  }
  if (!VALID_BPS.has(BP_ARG)) {
    process.stderr.write(`[error] --breakpoint must be one of: ${[...VALID_BPS].join('|')}\n`);
    process.exit(2);
  }
}

// ─── Dependency check ─────────────────────────────────────────────────────────

async function requireDeps() {
  try {
    const { default: chromeLauncher } = await import('chrome-launcher');
    const { default: lighthouse } = await import('lighthouse');
    return { chromeLauncher, lighthouse };
  } catch {
    process.stderr.write(
      '[error] Missing optional dependencies. Install them first:\n' +
      '  npm i -D lighthouse chrome-launcher\n' +
      'Then re-run validate-ttfr.\n'
    );
    process.exit(2);
  }
}

// ─── Lighthouse run ───────────────────────────────────────────────────────────

/**
 * Maps our breakpoint to a Lighthouse-compatible screen emulation.
 * Lighthouse's "mobile" preset covers 375/390. We override width for others.
 */
function screenConfig(bp) {
  const mobile = bp <= 480;
  return {
    mobile,
    width: bp,
    height: mobile ? 812 : 900,
    deviceScaleFactor: mobile ? 2 : 1,
    disabled: false,
  };
}

/**
 * 3G throttling preset (matches Lighthouse's "slow-4g" / devtools 3G preset).
 * downloadThroughput: 1.5 Mbps, uploadThroughput: 750 kbps, latency: 100ms
 */
const THROTTLING_3G = {
  rttMs: 100,
  throughputKbps: 1.5 * 1024,     // 1536 kbps down
  uploadThroughputKbps: 750,
  cpuSlowdownMultiplier: 6,        // mid-range Android
  requestLatencyMs: 0,
  downloadThroughputKbps: 1.5 * 1024,
};

async function runLighthouse(url, bp, chromeLauncher, lighthouse) {
  out(`Launching Chrome for ${url} at ${bp}px viewport…`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  let result;
  try {
    const screen = screenConfig(bp);
    result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyAudits: [
        'first-contentful-paint',
        'largest-contentful-paint',
        'cumulative-layout-shift',
        'interactive',
        'speed-index',
      ],
      settings: {
        throttlingMethod: 'simulate',
        throttling: THROTTLING_3G,
        emulatedFormFactor: screen.mobile ? 'mobile' : 'desktop',
        screenEmulation: screen,
        disableStorageReset: false,   // cold cache
      },
    }, { extends: 'lighthouse:default' });
  } finally {
    await chrome.kill();
  }

  return result;
}

// ─── Metric extraction ────────────────────────────────────────────────────────

function extractMetrics(lhResult) {
  const audits = lhResult?.lhr?.audits ?? {};

  function ms(auditId) {
    const a = audits[auditId];
    if (!a) return null;
    // numericValue is in ms for time-based audits
    return typeof a.numericValue === 'number' ? Math.round(a.numericValue) : null;
  }

  return {
    lcp: ms('largest-contentful-paint'),
    fcp: ms('first-contentful-paint'),
    cls: audits['cumulative-layout-shift']?.numericValue ?? null,
    tti: ms('interactive'),
    score: lhResult?.lhr?.categories?.performance?.score ?? null,
  };
}

// ─── History ──────────────────────────────────────────────────────────────────

function ensureHistoryDir() {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function loadPriorRun(url, bp) {
  if (!existsSync(HISTORY_DIR)) return null;
  const files = readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.ndjson'))
    .sort()
    .reverse(); // newest first

  for (const f of files) {
    try {
      const lines = readFileSync(join(HISTORY_DIR, f), 'utf8').trim().split('\n');
      for (const line of lines.reverse()) {
        const record = JSON.parse(line);
        if (record.url === url && record.breakpoint === bp && record.status === 'pass') {
          return record;
        }
      }
    } catch {
      // corrupt file — skip
    }
  }
  return null;
}

function saveRun(record) {
  ensureHistoryDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${timestamp}.ndjson`;
  const filepath = join(HISTORY_DIR, filename);
  writeFileSync(filepath, JSON.stringify(record) + '\n', 'utf8');
  return filepath;
}

// ─── Threshold check ─────────────────────────────────────────────────────────

function checkThresholds(metrics, prior) {
  const results = [];

  function check(name, value, limit, priorValue) {
    if (value === null) {
      results.push({ name, status: 'unknown', value: null, limit, message: 'Metric not available from Lighthouse' });
      return;
    }
    const passes = value <= limit;
    const regression = prior && priorValue !== null && value > priorValue * 1.05; // >5% worse = regression
    results.push({
      name,
      status: passes ? (regression ? 'regression' : 'pass') : 'fail',
      value,
      limit,
      prior: priorValue ?? null,
      regression: regression && passes, // passes threshold but regressed vs prior
    });
  }

  check('LCP', metrics.lcp, LCP_LIMIT, prior?.metrics?.lcp ?? null);
  check('FCP', metrics.fcp, FCP_LIMIT, prior?.metrics?.fcp ?? null);

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  validateArgs();
  banner('validate-ttfr  ·  TTFR North Star (LCP/FCP cold-cache 3G)');

  out(`  URL:        ${URL_ARG}`);
  out(`  Breakpoint: ${BP_ARG}px`);
  out(`  Thresholds: LCP ≤ ${LCP_LIMIT}ms  FCP ≤ ${FCP_LIMIT}ms`);
  out(`  History:    ${HISTORY_DIR}`);

  if (DRY_RUN) {
    out('\n[dry-run] Dependency check only — skipping Lighthouse run.');
    await requireDeps();
    out('[dry-run] Dependencies present. Pass.');
    if (CI) ndjson({ validator: 'validate-ttfr', status: 'dry-run', url: URL_ARG, breakpoint: BP_ARG });
    process.exit(0);
  }

  const { chromeLauncher, lighthouse } = await requireDeps();

  out('\nRunning Lighthouse (throttled 3G, cold cache)…');
  let lhResult;
  try {
    lhResult = await runLighthouse(URL_ARG, BP_ARG, chromeLauncher, lighthouse);
  } catch (e) {
    process.stderr.write(`[error] Lighthouse failed: ${e.message}\n`);
    process.exit(2);
  }

  const metrics = extractMetrics(lhResult);
  out(`\n  LCP:   ${metrics.lcp ?? 'n/a'}ms  (limit ${LCP_LIMIT}ms)`);
  out(`  FCP:   ${metrics.fcp ?? 'n/a'}ms  (limit ${FCP_LIMIT}ms)`);
  out(`  CLS:   ${metrics.cls !== null ? metrics.cls.toFixed(3) : 'n/a'}  (target ≤0.05)`);
  out(`  Score: ${metrics.score !== null ? Math.round(metrics.score * 100) : 'n/a'}`);

  const prior = loadPriorRun(URL_ARG, BP_ARG);
  if (prior) {
    out(`\n  Prior run: ${prior.ts}  LCP ${prior.metrics?.lcp ?? 'n/a'}ms  FCP ${prior.metrics?.fcp ?? 'n/a'}ms`);
  }

  const checks = checkThresholds(metrics, prior);
  const overallPass = checks.every(c => c.status === 'pass' || c.status === 'unknown');
  const hasRegression = checks.some(c => c.status === 'regression');
  const hasFail = checks.some(c => c.status === 'fail');

  out('');
  for (const c of checks) {
    const icon = c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : c.status === 'regression' ? '⚠' : '?';
    const note = c.regression ? ` (regression vs prior ${c.prior}ms)` : '';
    out(`  ${icon} ${c.name}: ${c.value ?? 'n/a'}ms${note}`);
  }

  const runRecord = {
    validator: 'validate-ttfr',
    url: URL_ARG,
    breakpoint: BP_ARG,
    metrics,
    checks,
    status: hasFail ? 'fail' : hasRegression ? 'regression' : 'pass',
    ts: new Date().toISOString(),
  };

  // Always persist the run to history
  const savedPath = saveRun(runRecord);
  out(`\n  Run saved: ${savedPath}`);

  if (CI) ndjson(runRecord);

  if (hasFail || hasRegression) {
    const failChecks = checks.filter(c => c.status === 'fail' || c.status === 'regression');
    for (const c of failChecks) {
      if (CI) ndjson({ validator: 'validate-ttfr', status: c.status, metric: c.name, value: c.value, limit: c.limit, url: URL_ARG });
    }
    if (!CI) {
      process.stderr.write(`\n[FAIL] ${failChecks.length} threshold violation(s). See thresholds above.\n`);
      if (hasRegression) {
        process.stderr.write('[warn] Regression detected: metric worsened >5% vs prior passing run.\n');
      }
    }
    process.exit(1);
  }

  if (!CI) process.stderr.write(`\n[pass] All TTFR thresholds met at ${BP_ARG}px.\n`);
  process.exit(0);
}

main().catch(e => {
  process.stderr.write(`[error] ${e.stack ?? e.message}\n`);
  process.exit(2);
});
