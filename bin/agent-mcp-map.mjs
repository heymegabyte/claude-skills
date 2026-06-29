#!/usr/bin/env node
// agent-mcp-map.mjs — maps every agent's mcp__ tool references to MCP server names.
// Usage: node bin/agent-mcp-map.mjs [--json]

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = resolve(__dirname, '..', 'agents');
const CLAUDE_JSON = resolve(homedir(), '.claude.json');

// --- helpers ---

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const fm = {};
  let currentKey = null;
  for (const line of lines) {
    if (/^[a-zA-Z][a-zA-Z0-9_-]*:\s/.test(line)) {
      const idx = line.indexOf(':');
      currentKey = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (val.startsWith('[')) {
        try { val = JSON.parse(val); } catch { /* keep as string */ }
      }
      fm[currentKey] = val;
    } else if (currentKey && /^\s+[-]/.test(line) && Array.isArray(fm[currentKey])) {
      fm[currentKey].push(line.trim().replace(/^-\s*/, ''));
    } else if (currentKey && typeof fm[currentKey] === 'string' && line.trim()) {
      // continuations handled by just keeping first line
    }
  }
  return fm;
}

function extractMcpRefs(toolsField) {
  if (!toolsField) return [];
  const toolsStr = Array.isArray(toolsField) ? toolsField.join(', ') : String(toolsField);
  const refs = toolsStr.match(/mcp__([a-zA-Z0-9_-]+)__/g);
  if (!refs) return [];
  return [...new Set(refs.map(r => r.match(/mcp__([a-zA-Z0-9_-]+)__/)[1]))];
}

// --- main ---

const claudeCfg = JSON.parse(readFileSync(CLAUDE_JSON, 'utf8'));
const mcpServers = claudeCfg.mcpServers || {};
const serverNames = Object.keys(mcpServers);

const agentFiles = readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && f !== 'BACKGROUND-OUTPUT.md')
  .sort();

const rows = [];

for (const file of agentFiles) {
  const content = readFileSync(resolve(AGENTS_DIR, file), 'utf8');
  const fm = parseFrontmatter(content);
  const agentName = fm.name || file.replace(/\.md$/, '');
  const refs = extractMcpRefs(fm.tools);
  // Also check mcpServers field
  const mcpServerField = fm.mcpServers;
  if (mcpServerField) {
    const servers = Array.isArray(mcpServerField) ? mcpServerField : [mcpServerField];
    for (const s of servers) {
      const clean = s.replace(/^["']|["']$/g, '');
      if (!refs.includes(clean)) refs.push(clean);
    }
  }

  for (const ref of refs) {
    // Look for the MCP server key in claude.json
    const matched = serverNames.filter(n => n === ref || n.startsWith(ref) || ref.startsWith(n));
    let resolved = null;
    let status = 'MISSING';

    if (matched.length === 1) {
      resolved = matched[0];
      status = resolved === ref ? 'MATCH' : 'MISMATCH';
    } else if (matched.length > 1) {
      resolved = matched.join(', ');
      status = 'AMBIGUOUS';
    }

    rows.push({
      agent: agentName,
      file,
      mcpRef: `mcp__${ref}__*`,
      resolvedServer: resolved || '-',
      status,
    });
  }
}

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(rows, null, 2));
  process.exit(0);
}

// Table output
console.log(`\n Agent ↔ MCP Server Map — ${rows.length} references from ${agentFiles.length} agents`);
console.log('─'.repeat(90));
console.log(' Agent'.padEnd(22), 'MCP Ref'.padEnd(28), 'Resolved Server'.padEnd(20), 'Status');
console.log('─'.repeat(90));

let match = 0, mismatch = 0, missing = 0, ambiguous = 0;
for (const r of rows) {
  let icon = '🟢';
  if (r.status === 'MISMATCH') { icon = '🟡'; mismatch++; }
  else if (r.status === 'MISSING') { icon = '🔴'; missing++; }
  else if (r.status === 'AMBIGUOUS') { icon = '🔵'; ambiguous++; }
  else match++;

  console.log(
    ` ${icon} ${r.agent.padEnd(20)}`,
    r.mcpRef.padEnd(28),
    r.resolvedServer.padEnd(20),
    r.status
  );
}

console.log('─'.repeat(90));
console.log(` ${match} MATCH  ${mismatch} MISMATCH  ${missing} MISSING  ${ambiguous} AMBIGUOUS`);

if (missing > 0) process.exit(1);
