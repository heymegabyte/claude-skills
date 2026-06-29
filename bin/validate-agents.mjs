#!/usr/bin/env node
// validate-agents.mjs — validates every agent frontmatter for correctness.
// Exit 1 on any ERROR-level violation.
// Usage: node bin/validate-agents.mjs [--json]

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = resolve(__dirname, '..', 'agents');
const CLAUDE_JSON = resolve(homedir(), '.claude.json');

const MODEL_EFFORT_MAP = {
  'claude-haiku-4-5': ['low'],
  'claude-sonnet-4-6': ['medium'],
  'claude-opus-4-8': ['high', 'xhigh'],
  'claude-opus-4-8[1m]': ['high', 'xhigh'],
};

const REQUIRED_FIELDS = ['name', 'description', 'model', 'tools'];

// --- helpers ---

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  let currentKey = null;
  const lines = match[1].split('\n');
  for (const line of lines) {
    if (/^[a-zA-Z][a-zA-Z0-9_-]*:\s/.test(line)) {
      const idx = line.indexOf(':');
      currentKey = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (val.startsWith('[')) {
        try { val = JSON.parse(val); } catch { /* keep string */ }
      }
      fm[currentKey] = val;
    } else if (currentKey && /^\s+[-]/.test(line) && Array.isArray(fm[currentKey])) {
      fm[currentKey].push(line.trim().replace(/^-\s*/, ''));
    } else if (currentKey && typeof fm[currentKey] === 'string' && line.trim() && !line.startsWith(' ')) {
      // continuation lines for multi-line values — skip, we only care about first-line values
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

const claudeCfg = JSON.parse(readFileSync(CLAUDE_JSON, 'utf8'));
const mcpServers = claudeCfg.mcpServers || {};
const serverNames = Object.keys(mcpServers);

function resolveMcp(ref) {
  const matched = serverNames.filter(n => n === ref || n.startsWith(ref) || ref.startsWith(n));
  if (matched.length === 0) return 'MISSING';
  if (matched.length === 1) return matched[0] === ref ? 'MATCH' : 'MISMATCH';
  return 'AMBIGUOUS';
}

const VIOLATIONS = [];
function error(agent, field, msg) { VIOLATIONS.push({ severity: 'ERROR', agent, field, message: msg }); }
function warn(agent, field, msg) { VIOLATIONS.push({ severity: 'WARN', agent, field, message: msg }); }

// --- main ---

const agentFiles = readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && f !== 'BACKGROUND-OUTPUT.md')
  .sort();

for (const file of agentFiles) {
  const content = readFileSync(resolve(AGENTS_DIR, file), 'utf8');
  const fm = parseFrontmatter(content);
  const agentName = fm.name || file.replace(/\.md$/, '');

  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!fm[field] || (typeof fm[field] === 'string' && !fm[field].trim())) {
      error(agentName, field, `Missing required field "${field}"`);
    }
  }

  // 2. model/effort consistency
  const model = typeof fm.model === 'string' ? fm.model.replace(/^["']|["']$/g, '').replace(/\[1m\]$/, '') : fm.model;
  const effort = fm.effort;

  if (model && effort) {
    const allowedEfforts = MODEL_EFFORT_MAP[model];
    if (allowedEfforts && !allowedEfforts.includes(effort)) {
      warn(agentName, 'effort', `Model "${model}" expects effort ${allowedEfforts.join('/')}, got "${effort}"`);
    }
  }

  // Check fallback effort consistency too
  const fbModel = typeof fm.fallback_model === 'string' ? fm.fallback_model.replace(/^["']|["']$/g, '') : fm.fallback_model;
  const fbEffort = fm.fallback_effort || fm.effort_fallback;
  if (fbModel && fbEffort) {
    const allowedEfforts = MODEL_EFFORT_MAP[fbModel];
    if (allowedEfforts && !allowedEfforts.includes(fbEffort)) {
      warn(agentName, 'fallback_effort', `Fallback model "${fbModel}" expects effort ${allowedEfforts.join('/')}, got "${fbEffort}"`);
    }
  }

  // 3. Tool references resolve
  if (fm.tools) {
    const refs = extractMcpRefs(fm.tools);
    for (const ref of refs) {
      const status = resolveMcp(ref);
      if (status === 'MISSING') {
        warn(agentName, 'tools', `MCP ref "mcp__${ref}__*" does not match any configured MCP server`);
      } else if (status === 'MISMATCH') {
        warn(agentName, 'tools', `MCP ref "mcp__${ref}__*" may be a different name (closest: ${serverNames.filter(n => n.includes(ref) || ref.includes(n)).join(', ')})`);
      }
    }

    const mcpServerField = fm.mcpServers;
    if (mcpServerField) {
      const servers = Array.isArray(mcpServerField) ? mcpServerField : [mcpServerField];
      for (const s of servers) {
        const clean = String(s).replace(/^["']|["']$/g, '');
        if (!serverNames.includes(clean)) {
          warn(agentName, 'mcpServers', `MCP server "${clean}" not found in ~/.claude.json mcpServers`);
        }
      }
    }
  }

  // 4. context: fork
  if (!fm.context || String(fm.context) !== 'fork') {
    warn(agentName, 'context', `Expected context: fork, got "${fm.context || '(missing)'}"`);
  }

  // 5. maxTurns present
  if (fm.maxTurns === undefined || fm.maxTurns === null) {
    warn(agentName, 'maxTurns', 'Missing maxTurns field');
  } else {
    const turns = parseInt(String(fm.maxTurns), 10);
    if (isNaN(turns) || turns < 1) {
      error(agentName, 'maxTurns', `maxTurns must be a positive integer, got "${fm.maxTurns}"`);
    }
  }
}

// --- output ---

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify({ violations: VIOLATIONS, total: VIOLATIONS.length, errors: VIOLATIONS.filter(v => v.severity === 'ERROR').length, warnings: VIOLATIONS.filter(v => v.severity === 'WARN').length }, null, 2));
  process.exit(VIOLATIONS.some(v => v.severity === 'ERROR') ? 1 : 0);
}

const errors = VIOLATIONS.filter(v => v.severity === 'ERROR');
const warnings = VIOLATIONS.filter(v => v.severity === 'WARN');

console.log(`\n Agent Validation — ${agentFiles.length} agents checked`);
console.log(` ${errors.length} ERRORS  ${warnings.length} WARNINGS`);
console.log('─'.repeat(70));

for (const v of VIOLATIONS) {
  const icon = v.severity === 'ERROR' ? '🔴' : '🟡';
  console.log(` ${icon} [${v.severity}] ${v.agent} :: ${v.field} — ${v.message}`);
}

if (VIOLATIONS.length === 0) {
  console.log(' All agents pass validation.');
}

process.exit(errors.length > 0 ? 1 : 0);
