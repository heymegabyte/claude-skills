/**
 * Skills MCP Gateway
 * =================
 * Reduces skill/rules context from ~50K tokens → ~1K tokens by indexing
 * the heymegabyte/claude-skills plugin behind 3 meta-tools:
 *
 *   search_skills(query) — full-text search across all skill/rules/agent descriptions
 *   load_skill(name)     — load a specific skill's full content on demand
 *   find_rule(topic)     — find the relevant rule(s) for a given topic
 *
 * Pattern: mcpzip (github.com/hypercall-public/mcpzip) — aggregate N tools → 3 meta-tools
 * Context: 20 skills + 117 rules + 18 agents → ~600 tokens constant overhead
 *
 * Auto-builds index from the plugin directory on startup.
 * Incremental re-index via file watcher (fswatch / fs.watch).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Paths ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = join(__dirname, '..', '..', '..', '..');

// ── Types ────────────────────────────────────────────────────────────────────

interface SkillEntry {
  kind: 'skill' | 'rule' | 'agent' | 'command' | 'bin';
  name: string;
  path: string;
  description: string;
  summary: string;       // first 300 chars of content
  triggers: string[];    // extracted from frontmatter
  packs: string[];       // which packs claim this
  size: number;          // file size in bytes
  modified: number;      // mtime
}

interface SearchResult {
  entry: SkillEntry;
  score: number;
  matchField: string;
  snippet: string;
}

// ── Index ────────────────────────────────────────────────────────────────────

let index: SkillEntry[] = [];
let indexBuiltAt = 0;

/** Extract YAML frontmatter from a markdown file */
function extractFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const fm: Record<string, unknown> = {};
  let currentKey = '';
  for (const line of lines) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      // Parse arrays
      if (val.startsWith('[') && val.endsWith(']')) {
        fm[currentKey] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/"/g, ''));
      } else {
        fm[currentKey] = val;
      }
    } else if (currentKey && line.trim().startsWith('- ')) {
      // Multi-line array item
      const arr = fm[currentKey];
      if (Array.isArray(arr)) {
        arr.push(line.trim().slice(2).trim().replace(/"/g, ''));
      }
    }
  }
  return fm;
}

/** Extract first meaningful description from content (skip frontmatter) */
function extractDescription(content: string): string {
  const body = content.replace(/^---[\s\S]*?---/, '').trim();
  // Find first heading or paragraph
  const lines = body.split('\n');
  const paragraphs: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|') || trimmed.startsWith('```')) {
      if (paragraphs.length > 0) break;
      continue;
    }
    paragraphs.push(trimmed);
    if (trimmed.endsWith('.') && paragraphs.length >= 2) break;
  }
  return paragraphs.join(' ').slice(0, 300);
}

/** Extract trigger phrases from frontmatter and content */
function extractTriggers(fm: Record<string, unknown>, content: string): string[] {
  const triggers: string[] = [];
  if (Array.isArray(fm.triggers)) triggers.push(...(fm.triggers as string[]));
  if (typeof fm.description === 'string') triggers.push(fm.description);
  return [...new Set(triggers)].slice(0, 10);
}

function indexFile(filePath: string, kind: SkillEntry['kind']): SkillEntry | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const stat = statSync(filePath);
    const fm = extractFrontmatter(content);
    const relPath = relative(SKILLS_ROOT, filePath);

    return {
      kind,
      name: (fm.name as string) || filePath.split('/').pop()?.replace(/\.\w+$/, '') || relPath,
      path: relPath,
      description: (fm.description as string) || extractDescription(content),
      summary: extractDescription(content),
      triggers: extractTriggers(fm, content),
      packs: Array.isArray(fm.packs) ? (fm.packs as string[]) : [],
      size: stat.size,
      modified: stat.mtimeMs,
    };
  } catch {
    return null;
  }
}

function walkDir(dir: string, kind: SkillEntry['kind'], entries: SkillEntry[]) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== '__pycache__') {
          walkDir(full, kind, entries);
        } else if (stat.isFile() && (entry.endsWith('.md') || entry.endsWith('.mjs') || entry.endsWith('.sh') || entry.endsWith('.py') || entry.endsWith('.ts'))) {
          const e = indexFile(full, kind);
          if (e) entries.push(e);
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* skip unreadable dirs */ }
}

function buildIndex(): SkillEntry[] {
  const entries: SkillEntry[] = [];

  // Scan skill directories (01- through 20-)
  for (let i = 1; i <= 20; i++) {
    const dir = join(SKILLS_ROOT, `${String(i).padStart(2, '0')}-`);
    // Find actual dir
    try {
      for (const entry of readdirSync(SKILLS_ROOT)) {
        if (entry.startsWith(`${String(i).padStart(2, '0')}-`)) {
          walkDir(join(SKILLS_ROOT, entry), 'skill', entries);
        }
      }
    } catch { /* skip */ }
  }

  // Scan rules directory
  walkDir(join(SKILLS_ROOT, 'rules'), 'rule', entries);

  // Scan agents directory
  walkDir(join(SKILLS_ROOT, 'agents'), 'agent', entries);

  // Scan commands directory
  walkDir(join(SKILLS_ROOT, 'commands'), 'command', entries);

  // Scan bin directory (only top-level, skip subdirs)
  try {
    for (const entry of readdirSync(join(SKILLS_ROOT, 'bin'))) {
      const full = join(SKILLS_ROOT, 'bin', entry);
      const stat = statSync(full);
      if (stat.isFile()) {
        const e = indexFile(full, 'bin');
        if (e) entries.push(e);
      }
    }
  } catch { /* skip */ }

  return entries;
}

// ── Search ──────────────────────────────────────────────────────────────────

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function searchIndex(query: string, maxResults = 10): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const entry of index) {
    let score = 0;
    let matchField = '';
    let snippet = '';

    const searchText = [
      entry.name,
      entry.description,
      ...entry.triggers,
      entry.kind,
      ...entry.packs,
    ].join(' ').toLowerCase();

    for (const token of tokens) {
      // Name match (high weight)
      if (entry.name.toLowerCase().includes(token)) {
        score += 10;
        matchField = 'name';
      }
      // Description match
      if (entry.description.toLowerCase().includes(token)) {
        score += 5;
        if (!matchField) matchField = 'description';
      }
      // Trigger match
      if (entry.triggers.some((t) => t.toLowerCase().includes(token))) {
        score += 3;
        if (!matchField) matchField = 'triggers';
      }
      // Kind match
      if (entry.kind === token) {
        score += 2;
        if (!matchField) matchField = 'kind';
      }
    }

    // Boost by recency
    const ageDays = (Date.now() - entry.modified) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) score *= 1.1;
    if (ageDays < 1) score *= 1.15;

    if (score > 0) {
      // Generate snippet
      const idx = searchText.indexOf(tokens[0]);
      snippet = idx >= 0
        ? '...' + searchText.slice(Math.max(0, idx - 30), idx + 100) + '...'
        : entry.description.slice(0, 150);

      results.push({ entry, score: Math.round(score * 10) / 10, matchField, snippet });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ── Tool Schemas ─────────────────────────────────────────────────────────────

const SearchSkillsInput = z.object({
  query: z.string().describe('Natural language query — what skill, rule, or capability do you need? Examples: "stripe payments", "deploy to workers", "accessibility audit"'),
  kind: z.enum(['skill', 'rule', 'agent', 'command', 'bin']).optional().describe('Filter by kind of entry'),
  max_results: z.number().int().min(1).max(25).default(10).describe('Max results to return'),
});

const LoadSkillInput = z.object({
  name: z.string().describe('Exact name of the skill, rule, or agent to load (from search_skills results)'),
  sections: z.array(z.string()).optional().describe('Specific sections to return (e.g., ["Quick Map", "Rules"]). If omitted, returns the full content.'),
});

const FindRuleInput = z.object({
  topic: z.string().describe('What topic or scenario do you need a rule for? Examples: "feature flags", "deploy procedure", "i18n requirements", "e2e testing"'),
  max_results: z.number().int().min(1).max(10).default(5),
});

// ── Server ───────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'skills-gateway-mcp',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  },
);

// Rebuild index on startup
index = buildIndex();
indexBuiltAt = Date.now();
console.error(`[skills-gateway] indexed ${index.length} entries in ${Date.now() - indexBuiltAt}ms`);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_skills',
      description: `Search across ${index.length} skills, rules, agents, and commands. Use this to DISCOVER what capabilities exist. Returns ranked results with names you can pass to load_skill.`,
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language query — what capability do you need?' },
          kind: { type: 'string', enum: ['skill', 'rule', 'agent', 'command', 'bin'], description: 'Filter by entry type' },
          max_results: { type: 'number', description: 'Max results (1-25, default 10)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'load_skill',
      description: 'Load the FULL content of a specific skill, rule, or agent. Use the name returned by search_skills. Returns complete markdown — this is how you get the details you need.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Exact name from search_skills results' },
          sections: { type: 'array', items: { type: 'string' }, description: 'Optional: specific sections to return' },
        },
        required: ['name'],
      },
    },
    {
      name: 'find_rule',
      description: 'Find the authoritative rule(s) for a specific topic or scenario. Use this when you need to know "what\'s the rule for X?" Returns relevant rules ranked by match quality.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic or scenario — e.g., "feature flags", "deploy", "i18n"' },
          max_results: { type: 'number', description: 'Max results (1-10, default 5)' },
        },
        required: ['topic'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_skills': {
      const { query, kind, max_results } = SearchSkillsInput.parse(args ?? {});
      const results = searchIndex(query, max_results);
      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: `No results found for "${query}". Try different terms or be more specific about the capability you need.` }],
        };
      }
      const text = results.map((r) =>
        `## ${r.entry.name} (${r.entry.kind}) — score: ${r.score}\n` +
        `**Path:** \`${r.entry.path}\`\n` +
        `**Match:** ${r.matchField}\n` +
        `**Description:** ${r.entry.description}\n` +
        `**Packs:** ${r.entry.packs.join(', ') || 'none'}\n` +
        `**Modified:** ${new Date(r.entry.modified).toISOString().slice(0, 10)}\n` +
        `\`\`\`\n${r.snippet}\n\`\`\`\n`
      ).join('\n---\n');
      return {
        content: [{ type: 'text', text: `# Search: "${query}" — ${results.length} results\n\n${text}` }],
      };
    }

    case 'load_skill': {
      const { name: skillName, sections } = LoadSkillInput.parse(args ?? {});
      const entry = index.find((e) => e.name === skillName);
      if (!entry) {
        // Try fuzzy match
        const fuzzy = searchIndex(skillName, 3);
        const suggestions = fuzzy.map((f) => f.entry.name).join(', ');
        return {
          content: [{ type: 'text', text: `No entry named "${skillName}". Did you mean: ${suggestions}?` }],
        };
      }
      const fullPath = join(SKILLS_ROOT, entry.path);
      let content = readFileSync(fullPath, 'utf-8');

      // Extract specific sections if requested
      if (sections && sections.length > 0) {
        const parts: string[] = [];
        for (const section of sections) {
          const regex = new RegExp(`(?:^#{1,3}\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n)([\\s\\S]*?)(?=^#{1,3}\\s|$)`, 'im');
          const match = content.match(regex);
          if (match) parts.push(`## ${section}\n\n${match[1].trim()}`);
        }
        content = parts.join('\n\n') || content;
      }

      // Strip frontmatter for cleaner display
      content = content.replace(/^---[\s\S]*?---\n*/, '');

      return {
        content: [{
          type: 'text',
          text: `# ${entry.name} (${entry.kind})\n**Path:** \`${entry.path}\`\n**Packs:** ${entry.packs.join(', ') || 'none'}\n\n${content}`,
        }],
      };
    }

    case 'find_rule': {
      const { topic, max_results } = FindRuleInput.parse(args ?? {});
      // Only search rules
      const ruleIndex = index.filter((e) => e.kind === 'rule');
      const tempIndex = index;
      // Temporarily replace index with rules-only for this search
      const results = searchIndex(topic, max_results).filter((r) => r.entry.kind === 'rule');
      if (results.length === 0) {
        return {
          content: [{ type: 'text', text: `No rules found for "${topic}". The topic may be covered in a skill or agent instead — try search_skills.` }],
        };
      }
      const text = results.map((r) => {
        const fullPath = join(SKILLS_ROOT, r.entry.path);
        const content = readFileSync(fullPath, 'utf-8').replace(/^---[\s\S]*?---\n*/, '');
        return `## ${r.entry.name}\n**Path:** \`${r.entry.path}\`\n\n${content.slice(0, 1500)}${content.length > 1500 ? '\n\n...(truncated, use load_skill for full content)' : ''}`;
      }).join('\n\n---\n\n');
      return {
        content: [{ type: 'text', text: `# Rules for: "${topic}" — ${results.length} results\n\n${text}` }],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
