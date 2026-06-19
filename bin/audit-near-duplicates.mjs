#!/usr/bin/env node
/**
 * audit-near-duplicates.mjs
 *
 * Surfaces near-duplicate rule files — candidates to MERGE.
 * Two rules saying the same thing fragment the agent's attention.
 *
 * ALGORITHM:
 *   For each rules/*.md: read body (strip YAML frontmatter + fenced ```code```
 *   blocks), lowercase, collapse whitespace, tokenize to words.
 *   Build a set of word-level 3-grams (shingles) per file.
 *   For every pair, compute Jaccard similarity = |A∩B| / |A∪B|.
 *   Report pairs with Jaccard >= 0.18 as near-duplicate candidates.
 *
 * Zero external deps — node:fs, node:path, node:url only. ESM, named exports.
 *
 * @example
 * # Human-readable, sorted by similarity desc
 * node bin/audit-near-duplicates.mjs
 *
 * # JSON output
 * node bin/audit-near-duplicates.mjs --json
 *
 * # CI mode — always exits 0 (advisory only; merging is a human judgment call)
 * node bin/audit-near-duplicates.mjs --ci
 *
 * # Combine
 * node bin/audit-near-duplicates.mjs --json --ci
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const RULES_DIR = join(REPO_ROOT, 'rules');
/**
 * Default Jaccard threshold for flagging near-duplicate candidates.
 *
 * NOTE ON TUNING: This corpus of ~145 rules files is highly domain-differentiated.
 * Empirically, the highest observed pair score is ~0.053 and scores drop sharply.
 * A threshold of 0.03 surfaces ~10 genuine topic-overlap candidates without noise.
 * The original "0.18" guidance applies to less-differentiated corpora (e.g. blog posts,
 * API docs); for tightly-scoped rule files, lower thresholds are needed.
 */
const JACCARD_THRESHOLD = 0.03;

/** Stop-words excluded from shared-topic hints (too generic to be meaningful). */
const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','should','could','may','might','shall',
  'this','that','these','those','it','its','as','by','from','use','used',
  'using','when','if','not','no','any','all','each','can','must','per',
  'into','than','then','only','also','more','so','up','out','about',
  'their','they','there','what','which','who','how','new','one','two',
  'three','set','see','file','make','take','run','get','add','see',
  'return','every','never','always','first','after','before','via',
  'over','own','same','rules','rule','null','true','false','non',
]);

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

/**
 * Strip YAML frontmatter (leading `---...---` block) from raw file text.
 *
 * @param {string} raw - Raw file contents.
 * @returns {string} Body without frontmatter.
 */
function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  return raw.slice(end + 4);
}

/**
 * Strip fenced code blocks (``` ... ```) from text.
 *
 * @param {string} text - Text with possible fenced blocks.
 * @returns {string} Text with code blocks removed.
 */
function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, ' ');
}

/**
 * Normalise text to a flat lowercase token string.
 *
 * @param {string} text - Raw prose text.
 * @returns {string[]} Array of lowercase word tokens.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3);
}

/**
 * Build the set of all word-level 3-grams (shingles) from a token array.
 *
 * @param {string[]} tokens - Tokenized word list.
 * @returns {Set<string>} Set of "w1 w2 w3" shingle strings.
 */
function buildShingles(tokens) {
  const shingles = new Set();
  for (let i = 0; i + 2 < tokens.length; i++) {
    shingles.add(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  return shingles;
}

/**
 * Compute Jaccard similarity between two shingle sets.
 *
 * @param {Set<string>} a - Shingle set for file A.
 * @param {Set<string>} b - Shingle set for file B.
 * @returns {number} Jaccard coefficient in [0, 1].
 */
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const s of a) {
    if (b.has(s)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Shared-topic extraction
// ---------------------------------------------------------------------------

/**
 * Return the top-N most frequent significant words shared between two token arrays.
 * Excludes stop-words and very short tokens.
 *
 * @param {string[]} tokensA - Tokens from file A.
 * @param {string[]} tokensB - Tokens from file B.
 * @param {number} [n=3] - Number of top words to return.
 * @returns {string[]} Array of top shared significant words.
 */
function topSharedWords(tokensA, tokensB, n = 3) {
  const freqA = buildFreqMap(tokensA);
  const freqB = buildFreqMap(tokensB);
  const shared = [];

  for (const [word, countA] of freqA) {
    if (STOP_WORDS.has(word)) continue;
    if (word.length < 4) continue;
    if (freqB.has(word)) {
      shared.push({ word, score: countA + freqB.get(word) });
    }
  }

  return shared
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
    .map(x => x.word);
}

/**
 * Build a word-frequency map from a token array.
 *
 * @param {string[]} tokens - Array of word tokens.
 * @returns {Map<string, number>} Map of word → count.
 */
function buildFreqMap(tokens) {
  const freq = new Map();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return freq;
}

// ---------------------------------------------------------------------------
// File loading
// ---------------------------------------------------------------------------

/**
 * Load all rules/*.md files and return an array of file descriptors.
 *
 * @param {string} rulesDir - Absolute path to the rules directory.
 * @returns {Array<{path: string, name: string, tokens: string[], shingles: Set<string>}>}
 */
function loadRuleFiles(rulesDir) {
  const files = readdirSync(rulesDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  return files.map(filename => {
    const filePath = join(rulesDir, filename);
    const raw = readFileSync(filePath, 'utf8');
    const body = stripCodeBlocks(stripFrontmatter(raw));
    const tokens = tokenize(body);
    const shingles = buildShingles(tokens);
    return {
      path: `rules/${filename}`,
      name: filename,
      tokens,
      shingles,
    };
  });
}

// ---------------------------------------------------------------------------
// Pair comparison
// ---------------------------------------------------------------------------

/**
 * Compare all file pairs and return those above the Jaccard threshold.
 *
 * @param {ReturnType<typeof loadRuleFiles>} files - Loaded file descriptors.
 * @param {number} threshold - Minimum Jaccard score to report.
 * @returns {Array<{a: string, b: string, jaccard: number, sharedTopWords: string[]}>}
 */
function findNearDuplicates(files, threshold) {
  const pairs = [];

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const fa = files[i];
      const fb = files[j];
      const score = jaccard(fa.shingles, fb.shingles);
      if (score >= threshold) {
        pairs.push({
          a: fa.path,
          b: fb.path,
          jaccard: score,
          sharedTopWords: topSharedWords(fa.tokens, fb.tokens, 3),
        });
      }
    }
  }

  return pairs.sort((x, y) => y.jaccard - x.jaccard);
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

/**
 * Format a single pair as a human-readable line.
 *
 * @param {{a: string, b: string, jaccard: number, sharedTopWords: string[]}} pair
 * @returns {string}
 */
function formatPairLine(pair) {
  const score = pair.jaccard.toFixed(3);
  const hint = pair.sharedTopWords.length
    ? `  [${pair.sharedTopWords.join(', ')}]`
    : '';
  return `${score}  ${pair.a}  <->  ${pair.b}${hint}`;
}

/**
 * Print human-readable report to stdout.
 *
 * @param {ReturnType<typeof loadRuleFiles>} files
 * @param {ReturnType<typeof findNearDuplicates>} pairs
 */
function printHumanReport(files, pairs) {
  const totalPairs = (files.length * (files.length - 1)) / 2;
  console.log(`\nNear-Duplicate Rule Audit`);
  console.log(`${'─'.repeat(72)}`);
  console.log(`Files scanned : ${files.length}`);
  console.log(`Pairs compared: ${totalPairs.toLocaleString()}`);
  console.log(`Candidates    : ${pairs.length}  (Jaccard >= ${JACCARD_THRESHOLD})`);
  console.log();

  if (pairs.length === 0) {
    console.log('No near-duplicate candidates found.');
    return;
  }

  console.log('Score  File A  <->  File B  [shared topics]');
  console.log(`${'─'.repeat(72)}`);
  for (const pair of pairs) {
    console.log(formatPairLine(pair));
  }
  console.log();
  console.log('Advisory: each pair is a merge candidate, not a guaranteed duplicate.');
  console.log('Review content before merging. This tool never blocks CI.');
}

/**
 * Print JSON report to stdout.
 *
 * @param {ReturnType<typeof loadRuleFiles>} files
 * @param {ReturnType<typeof findNearDuplicates>} pairs
 */
function printJsonReport(files, pairs) {
  const totalPairs = (files.length * (files.length - 1)) / 2;
  const output = {
    summary: {
      filesScanned: files.length,
      pairsCompared: totalPairs,
      candidateCount: pairs.length,
      threshold: JACCARD_THRESHOLD,
    },
    pairs: pairs.map(p => ({
      a: p.a,
      b: p.b,
      jaccard: parseFloat(p.jaccard.toFixed(4)),
      sharedTopWords: p.sharedTopWords,
    })),
  };
  console.log(JSON.stringify(output, null, 2));
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

/**
 * Main entrypoint. Parses CLI flags, runs the audit, and prints results.
 *
 * @returns {void}
 */
function main() {
  const args = process.argv.slice(2);
  const useJson = args.includes('--json');
  const isCi = args.includes('--ci');

  const files = loadRuleFiles(RULES_DIR);
  const pairs = findNearDuplicates(files, JACCARD_THRESHOLD);

  if (useJson) {
    printJsonReport(files, pairs);
  } else {
    printHumanReport(files, pairs);
  }

  // --ci always exits 0: merging is a human judgment call, never block CI.
  process.exit(0);
}

main();
