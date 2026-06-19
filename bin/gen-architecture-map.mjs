#!/usr/bin/env node
/**
 * gen-architecture-map.mjs
 *
 * Generates docs/ARCHITECTURE.md — an auto-generated, regenerate-on-demand map
 * of the heymegabyte-claude-skills plugin so a new agent groks it in one read.
 *
 * Sections: Packs, Skills, Rules (grouped by pack), Commands, Agents, Validators,
 * Hooks, MCP Servers.
 *
 * Zero external deps — uses only node:fs, node:path, node:url.
 *
 * @example
 * node bin/gen-architecture-map.mjs
 * # → writes docs/ARCHITECTURE.md
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const RULES_DIR = join(ROOT, 'rules');
const COMMANDS_DIR = join(ROOT, 'commands');
const AGENTS_DIR = join(ROOT, 'agents');
const PACKS_DIR = join(ROOT, '_packs');
const MCP_DIR = join(ROOT, 'mcp-servers');
const HOOKS_DIR = join('/Users/Apple/.claude/hooks');
const DOCS_DIR = join(ROOT, 'docs');
const OUT_FILE = join(DOCS_DIR, 'ARCHITECTURE.md');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read file text safely, returning '' on error.
 *
 * @param {string} p - Absolute file path.
 * @returns {string} File contents or empty string.
 * @example
 * safeRead('/nonexistent') // → ''
 */
function safeRead(p) {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}

/**
 * Extract the value of a YAML frontmatter key from a Markdown file's text.
 *
 * @param {string} text - Raw file text.
 * @param {string} key - Frontmatter key name.
 * @returns {string} Trimmed value, or '' if not found.
 * @example
 * extractFrontmatter('---\nname: foo\n---', 'name') // → 'foo'
 */
function extractFrontmatter(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return m ? m[1].trim() : '';
}

/**
 * Read the first meaningful comment line from a script file (JSDoc or shell #).
 *
 * @param {string} filePath - Absolute path to the script.
 * @returns {string} One-line purpose string.
 * @example
 * extractPurpose('/bin/foo.mjs') // → 'Auto-generates skills from OpenAPI specs.'
 */
function mdSafe(s) {
  // Escape bracket pairs so globs like [0-9][0-9] in a comment don't parse as
  // markdown reference links (MD052) when embedded in the generated doc.
  return s.replace(/\.$/, '').trim().replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function extractPurpose(filePath) {
  const lines = safeRead(filePath).split('\n');
  // Try JSDoc style: look for a line starting with ' * ' after the opening /**
  let inBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith('/**')) { inBlock = true; continue; }
    if (inBlock) {
      const m = line.match(/^\s*\*\s+([A-Z].+)/);
      if (m) return mdSafe(m[1]);
      if (line.trim() === '*/') break;
    }
  }
  // Shell-style: first non-shebang # comment line
  for (const line of lines) {
    if (line.startsWith('#!')) continue;
    const m = line.match(/^#\s+([A-Z].+)/);
    if (m) return m[1].replace(/\.$/, '').trim();
  }
  return '(no description)';
}

/**
 * List direct children of a directory by extension.
 *
 * @param {string} dir - Directory path.
 * @param {string} ext - Extension including dot (e.g. '.md').
 * @returns {string[]} Sorted basenames.
 * @example
 * listByExt('/rules', '.md') // → ['always.md', 'drift-detection.md', ...]
 */
function listByExt(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .sort();
}

/**
 * List immediate subdirectories of a directory.
 *
 * @param {string} dir - Directory path.
 * @returns {string[]} Sorted subdirectory names.
 * @example
 * listSubdirs('/mcp-servers') // → ['bitwarden-hardened-mcp', 'bitwarden-mcp', ...]
 */
function listSubdirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

/**
 * Build the Packs section from _packs/*.yml.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildPacksSection() // → '## Packs\n\n...'
 */
function buildPacksSection() {
  const lines = ['## Packs', ''];
  const packFiles = listByExt(PACKS_DIR, '.yml').filter(f => f !== 'README.md');
  lines.push(`${packFiles.length} packs defined in \`_packs/\`.`, '');
  lines.push('| Pack | Description | Members |');
  lines.push('|---|---|---|');
  for (const f of packFiles) {
    const text = safeRead(join(PACKS_DIR, f));
    const name = extractFrontmatter(text, 'name') || f.replace('.yml', '');
    const desc = extractFrontmatter(text, 'description');
    const memberCount = (text.match(/^  - /gm) || []).length;
    lines.push(`| \`${name}\` | ${desc.split('.')[0] || '—'} | ${memberCount} |`);
  }
  return lines.join('\n');
}

/**
 * Build the Skills section from numbered 01-NN-* dirs.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildSkillsSection() // → '## Skills\n\n...'
 */
function buildSkillsSection() {
  const lines = ['## Skills', ''];
  const skillDirs = readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d{2}-/.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  lines.push(`${skillDirs.length} numbered skill directories.`, '');
  lines.push('| # | Directory | Name | Ref Docs |');
  lines.push('|---|---|---|---|');
  for (const e of skillDirs) {
    const num = e.name.match(/^(\d{2})/)[1];
    const skillPath = join(ROOT, e.name);
    const skillText = safeRead(join(skillPath, 'SKILL.md'));
    const name = extractFrontmatter(skillText, 'name') || e.name;
    const refDocs = listByExt(skillPath, '.md').filter(f => f !== 'SKILL.md').length;
    lines.push(`| ${num} | \`${e.name}/\` | ${name} | ${refDocs} |`);
  }
  return lines.join('\n');
}

/**
 * Build the Rules section, grouped by pack membership.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildRulesSection() // → '## Rules\n\n...'
 */
function buildRulesSection() {
  const lines = ['## Rules', ''];
  const ruleFiles = listByExt(RULES_DIR, '.md');
  // Exclude subdirs (audit-baselines)
  const validRules = ruleFiles.filter(f => {
    try { return !readdirSync(RULES_DIR, { withFileTypes: true })
      .find(e => e.isDirectory() && e.name === f.replace('.md', '')); }
    catch { return true; }
  });
  lines.push(`${validRules.length} rules in \`rules/\`.`, '');

  // Build pack → members map
  const packMap = new Map();
  const allPacked = new Set();
  if (existsSync(PACKS_DIR)) {
    for (const pf of listByExt(PACKS_DIR, '.yml')) {
      const text = safeRead(join(PACKS_DIR, pf));
      const packName = extractFrontmatter(text, 'name') || pf.replace('.yml', '');
      const members = [];
      for (const line of text.split('\n')) {
        const m = line.match(/^\s{2,4}-\s+rules\/(.+)/);
        if (m) {
          members.push(m[1]);
          allPacked.add(m[1]);
        }
      }
      if (members.length) packMap.set(packName, members);
    }
  }

  const unpacked = validRules.filter(f => {
    const stem = f.replace('.md', '');
    return !allPacked.has(stem) && !allPacked.has(f);
  });

  for (const [pack, members] of [...packMap.entries()].sort()) {
    lines.push(`### Pack: ${pack}`, '');
    for (const m of members) {
      const exists = existsSync(join(RULES_DIR, `${m}.md`)) || existsSync(join(RULES_DIR, m));
      if (exists) lines.push(`- \`${m}\``);
    }
    lines.push('');
  }

  if (unpacked.length) {
    lines.push('### Unpacked rules', '');
    for (const f of unpacked) {
      lines.push(`- \`${f.replace('.md', '')}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build the Commands section.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildCommandsSection() // → '## Commands\n\n...'
 */
function buildCommandsSection() {
  const lines = ['## Commands', ''];
  const cmds = listByExt(COMMANDS_DIR, '.md');
  lines.push(`${cmds.length} slash commands in \`commands/\`.`, '');
  for (const f of cmds) {
    const text = safeRead(join(COMMANDS_DIR, f));
    const desc = extractFrontmatter(text, 'description');
    const name = f.replace('.md', '');
    if (desc) lines.push(`- \`/${name}\` — ${desc}`);
    else lines.push(`- \`/${name}\``);
  }
  return lines.join('\n');
}

/**
 * Build the Agents section.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildAgentsSection() // → '## Agents\n\n...'
 */
function buildAgentsSection() {
  const lines = ['## Agents', ''];
  const agentFiles = listByExt(AGENTS_DIR, '.md');
  lines.push(`${agentFiles.length} specialist agents in \`agents/\`.`, '');
  for (const f of agentFiles) {
    const text = safeRead(join(AGENTS_DIR, f));
    const desc = extractFrontmatter(text, 'description');
    const name = f.replace('.md', '');
    if (desc) lines.push(`- \`${name}\` — ${desc.split('.')[0]}`);
    else lines.push(`- \`${name}\``);
  }
  return lines.join('\n');
}

/**
 * Build the Validators section from bin/*.mjs and bin/*.sh.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildValidatorsSection() // → '## Validators\n\n...'
 */
function buildValidatorsSection() {
  const lines = ['## Validators', ''];
  const binDir = join(ROOT, 'bin');
  if (!existsSync(binDir)) {
    lines.push('No validators found.', '');
    return lines.join('\n');
  }
  const validators = readdirSync(binDir)
    .filter(f => (f.endsWith('.mjs') || f.endsWith('.sh')) && !f.startsWith('__'))
    .sort();
  lines.push(`${validators.length} scripts in \`bin/\` (validators + build tools).`, '');
  for (const f of validators) {
    const purpose = extractPurpose(join(binDir, f));
    lines.push(`- \`bin/${f}\` — ${purpose}`);
  }
  return lines.join('\n');
}

/**
 * Build the Hooks section from ~/.claude/hooks/*.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildHooksSection() // → '## Hooks\n\n...'
 */
function buildHooksSection() {
  const lines = ['## Hooks', ''];
  if (!existsSync(HOOKS_DIR)) {
    lines.push('Hooks directory not found at `~/.claude/hooks/`.', '');
    return lines.join('\n');
  }
  const hooks = readdirSync(HOOKS_DIR)
    .filter(f => f.endsWith('.py') || f.endsWith('.sh'))
    .sort();
  lines.push(`${hooks.length} hooks wired in \`~/.claude/hooks/\`.`, '');
  for (const f of hooks) {
    const purpose = extractPurpose(join(HOOKS_DIR, f));
    lines.push(`- \`${f}\` — ${purpose}`);
  }
  return lines.join('\n');
}

/**
 * Build the MCP Servers section, grouped as base vs hardened.
 *
 * @returns {string} Markdown section text.
 * @example
 * buildMcpSection() // → '## MCP Servers\n\n...'
 */
function buildMcpSection() {
  const lines = ['## MCP Servers', ''];
  const servers = listSubdirs(MCP_DIR);
  const base = servers.filter(s => !s.endsWith('-hardened-mcp'));
  const hardened = servers.filter(s => s.endsWith('-hardened-mcp'));
  lines.push(`${servers.length} MCP servers in \`mcp-servers/\` (${base.length} base + ${hardened.length} hardened).`, '');

  lines.push('### Base servers', '');
  for (const s of base) lines.push(`- \`${s}/\``);
  lines.push('');

  lines.push('### Hardened servers', '');
  for (const s of hardened) lines.push(`- \`${s}/\``);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Generate docs/ARCHITECTURE.md and write it to disk.
 *
 * @returns {void}
 * @example
 * main() // → writes docs/ARCHITECTURE.md
 */
function main() {
  if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });

  const sections = [
    '<!-- AUTO-GENERATED by bin/gen-architecture-map.mjs — do not edit by hand. -->',
    '',
    '# Plugin Architecture Map',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'A one-read orientation guide for new agents and contributors.',
    '',
    '---',
    '',
    buildPacksSection(),
    '',
    '---',
    '',
    buildSkillsSection(),
    '',
    '---',
    '',
    buildRulesSection(),
    '',
    '---',
    '',
    buildCommandsSection(),
    '',
    '---',
    '',
    buildAgentsSection(),
    '',
    '---',
    '',
    buildValidatorsSection(),
    '',
    '---',
    '',
    buildHooksSection(),
    '',
    '---',
    '',
    buildMcpSection(),
  ];

  const content = sections.join('\n').replace(/\n{3,}/g, '\n\n');
  writeFileSync(OUT_FILE, content, 'utf8');
  console.log(`Wrote ${OUT_FILE} (${content.split('\n').length} lines)`);
}

main();
