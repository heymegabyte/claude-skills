#!/usr/bin/env node
/**
 * agent-quality-tracker.mjs
 *
 * Reads agent run log entries and produces an aggregate quality report:
 * per-agent task count, avg tokens, correction rate, and recommended model.
 *
 * Usage:
 *   node bin/agent-quality-tracker.mjs [--input <path>]
 *
 * Default input: /tmp/agent-run-log.ndjson (placeholder for pipeline integration)
 *
 * Input format (NDJSON, one entry per line):
 *   {"agent":"test-writer","model":"sonnet","effort":"high","tokensIn":42000,"tokensOut":8000,"corrected":false,"task":"E2E for login flow"}
 *
 * Output: formatted table to stdout.
 */

import { readFileSync, existsSync } from 'node:fs';
import { argv, exit } from 'node:process';

const INPUT_DEFAULT = '/tmp/agent-run-log.ndjson';

function parseArgs() {
  const idx = argv.indexOf('--input');
  const path = idx !== -1 && argv[idx + 1] ? argv[idx + 1] : INPUT_DEFAULT;
  return { path };
}

function loadEntries(path) {
  if (!existsSync(path)) {
    console.error(`agent-quality-tracker: no input at ${path}`);
    console.error(`Create an NDJSON file with entries like:`);
    console.error(`  {"agent":"test-writer","model":"sonnet","effort":"high","tokensIn":42000,"tokensOut":8000,"corrected":false,"task":"E2E for login flow"}`);
    exit(1);
  }
  const raw = readFileSync(path, 'utf8').trim();
  if (!raw) {
    console.error(`agent-quality-tracker: empty input at ${path}`);
    exit(1);
  }
  return raw.split('\n').filter(Boolean).map((line, i) => {
    try {
      return JSON.parse(line);
    } catch {
      console.error(`agent-quality-tracker: invalid JSON on line ${i + 1}: ${line}`);
      exit(1);
    }
  });
}

function modelMap() {
  // Map short names to full model IDs
  return {
    haiku: 'claude-haiku-4-5',
    sonnet: 'claude-sonnet-4-6',
    opus: 'claude-opus-4-7',
  };
}

function buildReport(entries) {
  const agents = {};

  for (const e of entries) {
    const name = e.agent || 'unknown';
    if (!agents[name]) {
      agents[name] = { runs: [], tokensInSum: 0, tokensOutSum: 0, corrections: 0 };
    }
    agents[name].runs.push(e);
    agents[name].tokensInSum += e.tokensIn || 0;
    agents[name].tokensOutSum += e.tokensOut || 0;
    if (e.corrected) agents[name].corrections += 1;
  }

  const results = Object.entries(agents).map(([name, data]) => {
    const count = data.runs.length;
    const avgTokens = count > 0 ? Math.round((data.tokensInSum + data.tokensOutSum) / count) : 0;
    const correctionRate = count > 0 ? (data.corrections / count) : 0;

    // Heuristic: recommend model based on correction rate + token usage
    let recommended = 'sonnet';
    let reasoning = '';
    if (correctionRate > 0.25) {
      recommended = 'opus';
      reasoning = `High correction rate (${(correctionRate * 100).toFixed(0)}%) — upgrade to opus`;
    } else if (correctionRate < 0.05 && avgTokens < 20000) {
      recommended = 'haiku';
      reasoning = `Low corrections + low token count — can downgrade to haiku`;
    } else {
      reasoning = `Stable pattern — keep at sonnet`;
    }

    return {
      agent: name,
      count,
      avgTokens,
      correctionRate,
      recommended,
      reasoning,
    };
  });

  results.sort((a, b) => b.count - a.count);
  return results;
}

function printReport(report) {
  console.log();
  console.log('Agent Quality Report');
  console.log('='.repeat(72));
  console.log();
  console.log('Agent'.padEnd(24) + 'Runs'.padEnd(6) + 'AvgTok'.padEnd(10) + 'Corr%'.padEnd(8) + 'Rec. Model'.padEnd(18) + 'Reasoning');
  console.log('-'.repeat(72));

  for (const r of report) {
    const corrPct = (r.correctionRate * 100).toFixed(1) + '%';
    console.log(
      r.agent.padEnd(24) +
      String(r.count).padEnd(6) +
      String(r.avgTokens).padEnd(10) +
      corrPct.padEnd(8) +
      r.recommended.padEnd(18) +
      r.reasoning
    );
  }

  console.log();
  const totalRuns = report.reduce((s, r) => s + r.count, 0);
  const totalCorrections = report.reduce((s, r) => s + r.correctionRate * r.count, 0);
  const overallRate = totalRuns > 0 ? (totalCorrections / totalRuns * 100).toFixed(1) : '0.0';
  console.log(`Total runs: ${totalRuns}  |  Overall correction rate: ${overallRate}%`);
  console.log();

  // Recommendations summary
  const toUpgrade = report.filter(r => r.recommended === 'opus');
  const toDowngrade = report.filter(r => r.recommended === 'haiku');
  if (toUpgrade.length) {
    console.log(`Upgrade targets: ${toUpgrade.map(r => r.agent).join(', ')}`);
  }
  if (toDowngrade.length) {
    console.log(`Downgrade candidates: ${toDowngrade.map(r => r.agent).join(', ')}`);
  }
  console.log();
}

function main() {
  const { path } = parseArgs();
  const entries = loadEntries(path);
  const report = buildReport(entries);
  printReport(report);
}

main();
