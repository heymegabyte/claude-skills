#!/usr/bin/env node
/**
 * audit-contradictions.mjs — lexical contradiction-candidate finder over rules/.
 *
 * Advisory only — no LLM. Heuristic: extract imperative lines from each rule file,
 * then find pairs across DIFFERENT files where one asserts "always/must/prefer/use X"
 * and another asserts the negation ("never/avoid/ban/forbidden X" or "always/must Y"
 * where Y is an antonym of X) on lines sharing ≥2 significant nouns/tokens.
 *
 * Antonym pairs checked: always↔never, use↔avoid, prefer↔ban, required↔forbidden,
 *                        must↔must not, include↔exclude, enable↔disable, add↔remove.
 *
 * Results are MEDIUM confidence (heuristic — needs human confirmation).
 *
 * @example
 *   node bin/audit-contradictions.mjs
 *   node bin/audit-contradictions.mjs --json
 *   node bin/audit-contradictions.mjs --ci   # exits 0 (advisory)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const RULES_DIR = join(ROOT, 'rules');

const JSON_FLAG = process.argv.includes('--json');
// --ci exits 0 regardless (advisory)

// ── constants ─────────────────────────────────────────────────────────────────

/**
 * Antonym pairs: [positiveTerms[], negativeTerms[]]
 * A line containing a positive term is "asserting"; one with a negative term is "negating".
 * We look for pairs where asserting + negating lines share ≥2 significant nouns.
 * @type {Array<[string[], string[]]>}
 */
const ANTONYM_PAIRS = [
  [['always', 'must', 'required', 'require', 'mandatory'], ['never', 'must not', 'forbidden', 'prohibited', 'do not']],
  [['use', 'prefer', 'reach for', 'default to', 'use only'], ['avoid', 'ban', 'do not use', 'never use', 'prohibited', 'no ']],
  [['enable', 'turn on', 'activate'], ['disable', 'turn off', 'deactivate', 'do not enable']],
  [['include', 'add', 'ship with', 'include always'], ['exclude', 'remove', 'omit', 'do not include', 'never include']],
  [['allow', 'permitted', 'ok to'], ['disallow', 'not permitted', 'not allowed', 'never allow']],
];

/**
 * Stop words to exclude from significant-noun extraction.
 * @type {Set<string>}
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'then', 'than', 'that', 'this', 'these', 'those',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'each', 'any', 'all', 'more',
  'most', 'other', 'some', 'such', 'only', 'same', 'also', 'just', 'when', 'where',
  'while', 'if', 'as', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their',
  'every', 'always', 'never', 'use', 'avoid', 'prefer', 'ban', 'include', 'exclude',
  'enable', 'disable', 'allow', 'disallow', 'required', 'forbidden', 'must', 'via',
]);

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Read file safely.
 * @param {string} p
 * @returns {string}
 */
function safeRead(p) {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}

/**
 * Strip YAML frontmatter from a markdown file.
 * @param {string} content
 * @returns {string}
 */
function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\r?\n/, '');
}

/**
 * Extract "imperative" lines from markdown body.
 * An imperative line: starts with a list marker or heading, contains a strong
 * directive keyword (always/never/must/avoid/prefer/use/forbidden/never use/do not),
 * AND is NOT a pure cross-reference line (e.g. "See: foo → bar → baz").
 * @param {string} content
 * @returns {Array<{lineNum:number, text:string}>}
 */
function extractImperativeLines(content) {
  const lines = content.split('\n');
  // Strong directive: the keyword must appear as a directive, not just a citation
  const imperativeRe = /\b(always|never(?! a )|must(?! be \w+ed to)|avoid\b|prefer\b|require\b|required\b|mandatory|forbidden|prohibited|disallow|do not\b|never use|must not|ban\b)\b/i;
  // Skip lines that are purely cross-reference catalogs (lots of → or backtick paths)
  const crossRefRe = /(?:→|`[\w./-]+`.*`[\w./-]+`|rules\/\w+.*rules\/\w+|See:.*→)/;

  const results = [];
  lines.forEach((raw, idx) => {
    const text = raw.replace(/^[\s>*#-]+/, '').trim();
    if (text.length < 15) return;
    if (crossRefRe.test(text)) return;  // skip cross-reference catalog lines
    if (imperativeRe.test(text)) {
      results.push({ lineNum: idx + 1, text });
    }
  });
  return results;
}

/**
 * Classify a line as positive assertion, negative assertion, or neutral.
 * Returns 'positive' | 'negative' | 'neutral'.
 * @param {string} text
 * @returns {'positive'|'negative'|'neutral'}
 */
function classify(text) {
  const lower = text.toLowerCase();

  // Negative markers (must match before positive to catch "must not", "never use")
  const negativeRe = /\b(never|must not|do not|avoid|ban|forbidden|prohibited|disallow|exclude|disable|not allowed|not permitted)\b/i;
  if (negativeRe.test(lower)) return 'negative';

  const positiveRe = /\b(always|must(?! not)|required|mandatory|prefer|use\b|enable|include|allow(?! not)|reach for|default to)\b/i;
  if (positiveRe.test(lower)) return 'positive';

  return 'neutral';
}

/**
 * Extract significant nouns/tokens (words ≥4 chars, not stop words, not markdown syntax).
 * @param {string} text
 * @returns {Set<string>}
 */
function significantNouns(text) {
  const words = text
    .toLowerCase()
    .replace(/[`*_#\[\](){}|>]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .split(/\W+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Count intersection size of two Sets.
 * @param {Set<string>} a
 * @param {Set<string>} b
 * @returns {number}
 */
function intersectionSize(a, b) {
  let count = 0;
  for (const v of a) { if (b.has(v)) count++; }
  return count;
}

// ── collect rules ─────────────────────────────────────────────────────────────

if (!existsSync(RULES_DIR)) {
  console.error('rules/ directory not found at', RULES_DIR);
  process.exit(0);
}

let ruleFiles;
try {
  ruleFiles = readdirSync(RULES_DIR, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => join(RULES_DIR, e.name));
} catch {
  ruleFiles = [];
}

/**
 * @type {Array<{file:string, shortName:string, lines:Array<{lineNum:number, text:string, cls:'positive'|'negative'|'neutral', nouns:Set<string>}>}>}
 */
const ruleData = ruleFiles.map(f => {
  const raw = safeRead(f);
  const body = stripFrontmatter(raw);
  const imperatives = extractImperativeLines(body);
  const lines = imperatives
    .map(l => ({
      ...l,
      cls: classify(l.text),
      nouns: significantNouns(l.text),
    }))
    .filter(l => l.cls !== 'neutral');
  return { file: f, shortName: basename(f), lines };
}).filter(r => r.lines.length > 0);

// ── find contradiction candidates ─────────────────────────────────────────────

/**
 * @type {Array<{fileA:string, lineA:number, textA:string, fileB:string, lineB:number, textB:string, shared:string[], confidence:'MEDIUM'}>}
 */
const candidates = [];

for (let i = 0; i < ruleData.length; i++) {
  for (let j = i + 1; j < ruleData.length; j++) {
    const A = ruleData[i];
    const B = ruleData[j];

    for (const la of A.lines) {
      for (const lb of B.lines) {
        // Must be opposing classification
        if (la.cls === lb.cls) continue;

        const shared = [];
        for (const n of la.nouns) {
          if (lb.nouns.has(n)) shared.push(n);
        }
        if (shared.length < 2) continue;

        candidates.push({
          fileA: A.shortName,
          lineA: la.lineNum,
          textA: la.text.slice(0, 120),
          fileB: B.shortName,
          lineB: lb.lineNum,
          textB: lb.text.slice(0, 120),
          shared,
          confidence: 'MEDIUM',
        });
      }
    }
  }
}

// Deduplicate: same file-pair + overlapping shared nouns
const seen = new Set();
const deduped = candidates.filter(c => {
  const key = `${c.fileA}:${c.lineA}::${c.fileB}:${c.lineB}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Sort by shared noun count descending (strongest signal first)
deduped.sort((a, b) => b.shared.length - a.shared.length);

// ── output ────────────────────────────────────────────────────────────────────

if (JSON_FLAG) {
  process.stdout.write(JSON.stringify({
    generated: new Date().toISOString(),
    totalCandidates: deduped.length,
    candidates: deduped,
  }, null, 2) + '\n');
} else {
  const total = deduped.length;
  console.log(`\n── Contradiction Audit (advisory, MEDIUM confidence) ─────────────────`);
  console.log(`Total candidate pairs: ${total}`);
  console.log(`Rules scanned: ${ruleData.length} files (${ruleFiles.length} total in rules/)\n`);

  if (total === 0) {
    console.log('No contradiction candidates found.');
  } else {
    const top = deduped.slice(0, 10);
    top.forEach((c, i) => {
      console.log(`── #${i + 1} (shared nouns: ${c.shared.join(', ')})`);
      console.log(`   [A] ${c.fileA}:${c.lineA}`);
      console.log(`       "${c.textA}"`);
      console.log(`   [B] ${c.fileB}:${c.lineB}`);
      console.log(`       "${c.textB}"`);
      console.log('');
    });

    if (total > 10) {
      console.log(`… and ${total - 10} more. Run with --json to see all.\n`);
    }
  }

  console.log('Confidence: MEDIUM (lexical heuristic — human review required before acting)\n');
}

// --ci exits 0: advisory findings do not block CI
process.exit(0);
