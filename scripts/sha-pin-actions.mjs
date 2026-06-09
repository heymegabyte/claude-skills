#!/usr/bin/env node
/**
 * sha-pin-actions.mjs — supply-chain hardening helper.
 *
 * Reads GitHub Actions workflow files, finds every `uses: owner/repo@vX` tag-ref,
 * resolves the SHA via GitHub API, and rewrites the file in-place with:
 *   uses: owner/repo@<sha> # vX
 *
 * Per rules/ai-agent-security.md § Supply chain — "Pin GitHub Actions to a commit
 * SHA, not a tag (tags get re-pointed)".
 *
 * Usage:
 *   node scripts/sha-pin-actions.mjs .github/workflows/*.yml
 *   node scripts/sha-pin-actions.mjs --dry-run .github/workflows/publish.yml
 *
 * Requires: gh CLI authenticated (`gh auth status`).
 *
 * Exits: 0 = pinned (or already pinned), 1 = SHA resolution failed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { exit } from 'node:process';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const files = args.filter((a) => !a.startsWith('--'));

if (files.length === 0) {
  console.error('Usage: node scripts/sha-pin-actions.mjs [--dry-run] <workflow.yml> [...]');
  exit(1);
}

const TAG_REF_RE = /(uses:\s+)([\w-]+\/[\w-]+)@(v[0-9]+(?:\.[0-9]+)*)\b(?!\s*#)/g;
const cache = new Map();

function resolveSha(owner_repo, tag) {
  const key = `${owner_repo}@${tag}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const sha = execSync(
      `gh api repos/${owner_repo}/git/refs/tags/${tag} --jq '.object.sha'`,
      { encoding: 'utf8' },
    ).trim();
    if (!sha || sha === 'null' || sha.length < 40) {
      throw new Error(`bad SHA: ${sha}`);
    }
    cache.set(key, sha);
    return sha;
  } catch (e) {
    console.error(`✗ failed to resolve ${key}: ${e.message}`);
    return null;
  }
}

let totalPinned = 0;
let totalAlready = 0;
let failed = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const matches = [...content.matchAll(TAG_REF_RE)];
  if (matches.length === 0) {
    console.error(`  · ${file}: already pinned (no tag refs)`);
    totalAlready++;
    continue;
  }
  let next = content;
  for (const m of matches) {
    const [full, prefix, ownerRepo, tag] = m;
    const sha = resolveSha(ownerRepo, tag);
    if (!sha) {
      failed = true;
      continue;
    }
    const replacement = `${prefix}${ownerRepo}@${sha} # ${tag}`;
    next = next.replace(full, replacement);
    console.error(`  ✓ ${file}: ${ownerRepo}@${tag} → ${sha.slice(0, 8)}… # ${tag}`);
    totalPinned++;
  }
  if (next !== content) {
    if (dryRun) {
      console.error(`  (dry-run) would write ${file}`);
    } else {
      writeFileSync(file, next);
    }
  }
}

console.error(`\n  Summary: ${totalPinned} pinned, ${totalAlready} already pinned${failed ? ', some failed' : ''}`);
exit(failed ? 1 : 0);
