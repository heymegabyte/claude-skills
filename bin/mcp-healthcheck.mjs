#!/usr/bin/env node
// mcp-healthcheck.mjs — pings every MCP server by checking its command/URL from ~/.claude.json.
// Usage: node bin/mcp-healthcheck.mjs [--json]

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';

const HOME = homedir();
const CLAUDE_JSON = `${HOME}/.claude.json`;

// --- helpers ---

function checkCommand(cmd) {
  // For npx commands, check if npx itself is available
  if (cmd === 'npx') {
    try {
      execSync('which npx', { encoding: 'utf8', stdio: 'pipe' });
      // npx resolves on first use — we can validate npm can see the package
      return true;
    } catch {
      return false;
    }
  }
  // For bash -lc wrapped commands, check the inner command
  if (cmd === 'bash') return true;
  // Standard which check
  try {
    execSync(`which "${cmd}" 2>/dev/null`, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function checkHttpUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    // HTTP MCP endpoints return 200/405 even without proper auth
    return res.ok || res.status === 405 || res.status === 400;
  } catch {
    return false;
  }
}

function checkNpxPackage(pkg) {
  try {
    // Light check: see if npm can resolve the package entry point
    execSync(`npx --yes --quiet "${pkg}" --version 2>/dev/null || true`, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}

function getNpxPackage(args) {
  if (!args || args.length === 0) return null;
  // The first non-flag arg after npx is usually the package name
  for (const a of args) {
    if (!a.startsWith('-') && !a.startsWith('--')) return a;
  }
  return null;
}

// --- main ---

let cfg;
try {
  cfg = JSON.parse(readFileSync(CLAUDE_JSON, 'utf8'));
} catch {
  console.error('Cannot read ~/.claude.json');
  process.exit(1);
}

const mcpServers = cfg.mcpServers || {};
const names = Object.keys(mcpServers).sort();

// Run checks and collect results (HTTP checks in parallel)
const httpChecks = [];
const results = [];

for (const name of names) {
  const s = mcpServers[name];
  const type = s?.type || 'stdio';
  const command = s?.command || '';
  const args = s?.args || [];
  const url = s?.url || '';

  if (type === 'http' && url) {
    httpChecks.push(
      checkHttpUrl(url).then(ok => ({
        server: name,
        type: 'http',
        command,
        url,
        status: ok ? 'ACTIVE' : 'UNREACHABLE',
        detail: ok ? `HTTP reachable` : `HTTP ${url} unreachable`,
      }))
    );
  } else if (command) {
    const pkg = getNpxPackage(command === 'npx' ? args : [command]);
    let status, detail;

    if (command === 'npx' && pkg) {
      const ok = checkNpxPackage(pkg);
      status = ok ? 'ACTIVE' : 'UNREACHABLE';
      detail = ok ? `npx package ${pkg} resolvable` : `npx package ${pkg} not resolvable`;
    } else if (checkCommand(command)) {
      status = 'ACTIVE';
      detail = `Command "${command}" found in PATH`;
    } else {
      status = 'UNREACHABLE';
      detail = `Command "${command}" not found in PATH`;
    }

    results.push({ server: name, type: 'stdio', command, args, status, detail });
  } else {
    results.push({ server: name, type: 'unknown', status: 'UNKNOWN', detail: 'No command or URL configured' });
  }
}

// Wait for HTTP checks
const httpResults = await Promise.all(httpChecks);
results.push(...httpResults);

// Sort by name
results.sort((a, b) => a.server.localeCompare(b.server));

// --- output ---

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(results, null, 2));
  process.exit(0);
}

console.log(`\n MCP Server Health Check — ${results.length} servers from ~/.claude.json`);
console.log('─'.repeat(90));
console.log(' Server'.padEnd(26), 'Type'.padEnd(10), 'Status'.padEnd(14), 'Detail');
console.log('─'.repeat(90));

let active = 0, unreachable = 0, unknown = 0;
for (const r of results) {
  const icon = r.status === 'ACTIVE' ? '🟢' : r.status === 'UNREACHABLE' ? '🔴' : '⚪';
  if (r.status === 'ACTIVE') active++;
  else if (r.status === 'UNREACHABLE') unreachable++;
  else unknown++;

  console.log(
    ` ${icon} ${r.server.padEnd(24)}`,
    r.type.padEnd(10),
    r.status.padEnd(14),
    r.detail
  );
}

console.log('─'.repeat(90));
console.log(` ${active} ACTIVE  ${unreachable} UNREACHABLE  ${unknown} UNKNOWN`);
process.exit(unreachable > 0 ? 1 : 0);
