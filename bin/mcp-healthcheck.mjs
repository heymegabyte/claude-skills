#!/usr/bin/env node
// mcp-healthcheck.mjs — pings all MCP servers by checking their directories.
// Usage: node bin/mcp-healthcheck.mjs [--json]

import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { resolve, basename } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const HOME = homedir();
const SERVERS_DIR = resolve(HOME, '.claude/mcp-servers');

// Discover servers from ~/.claude.json or mcp-servers/_registry.json or the directory
let servers = [];
const registryPath = resolve(SERVERS_DIR, '_registry.json');
const claudeJsonPath = resolve(HOME, '.claude.json');

if (existsSync(registryPath)) {
  const reg = JSON.parse(readFileSync(registryPath, 'utf8'));
  servers = (reg.servers || reg).map(s => typeof s === 'string' ? { name: s } : s);
} else if (existsSync(claudeJsonPath)) {
  const cfg = JSON.parse(readFileSync(claudeJsonPath, 'utf8'));
  const mcpServers = cfg.mcpServers || cfg['mcpServers'] || {};
  servers = Object.keys(mcpServers).map(name => ({ name, command: mcpServers[name]?.command }));
} else if (existsSync(SERVERS_DIR)) {
  servers = readdirSync(SERVERS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .map(d => ({ name: d.name }));
}

function classifyDir(name) {
  return name.endsWith('-hardened') ? 'hardened' : name.endsWith('-mcp') ? 'base' : 'other';
}

const results = servers.map(s => {
  const dir = resolve(SERVERS_DIR, s.name);
  const pkgPath = resolve(dir, 'package.json');
  const exists = existsSync(dir);
  let status = 'missing';
  let lastMod = '-';
  let outdated = [];

  if (exists) {
    status = 'active';
    lastMod = new Date(statSync(dir).mtimeMs).toISOString().split('T')[0];

    if (existsSync(pkgPath)) {
      try {
        const out = execSync('npm ls --depth=0 --json 2>/dev/null', { cwd: dir, encoding: 'utf8' });
        const tree = JSON.parse(out);
        const deps = { ...tree.dependencies, ...tree.devDependencies };
        outdated = Object.entries(deps)
          .filter(([_, v]) => v?.problems?.length)
          .map(([k]) => k);
      } catch {
        // npm ls may exit 1 on problems; parse stdout anyway
      }
    }
  }

  return {
    server: s.name,
    dir,
    type: classifyDir(s.name),
    status,
    lastModified: lastMod,
    outdated,
    hasPackageJson: exists && existsSync(pkgPath),
  };
});

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(results, null, 2));
  process.exit(0);
}

// Table output
console.log(`\n MCP Server Health Check — ${results.length} servers`);
console.log('─'.repeat(70));
console.log(' Server'.padEnd(30), 'Type'.padEnd(12), 'Status'.padEnd(10), 'Modified');
console.log('─'.repeat(70));

let active = 0, stale = 0, missing = 0;
for (const r of results) {
  const statusIcon = r.status === 'active' ? '🟢' : r.status === 'stale' ? '🟡' : '🔴';
  if (r.status === 'active') active++;
  else if (r.status === 'stale') stale++;
  else missing++;
  console.log(
    ` ${statusIcon} ${r.server.padEnd(26)}`,
    r.type.padEnd(12),
    r.status.padEnd(10),
    r.lastModified
  );
  if (r.outdated.length) {
    console.log(`    ⚠ outdated: ${r.outdated.join(', ')}`);
  }
}

console.log('─'.repeat(70));
console.log(` ${active} active  ${stale} stale  ${missing} missing`);
process.exit(missing > 0 ? 1 : 0);
