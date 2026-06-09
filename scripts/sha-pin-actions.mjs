#!/usr/bin/env node
/**
 * sha-pin-actions.mjs — supply-chain hardening helper.
 *
 * Per rules/ai-agent-security.md § Supply chain — "Pin GitHub Actions to a commit
 * SHA, not a tag (tags get re-pointed)".
 *
 * Modes:
 *   (default) — pin all `uses: owner/repo@vX` tag-refs to `@<sha> # vX`
 *   --bump    — re-resolve `# vX` tag comments on already-pinned refs, update SHA if drifted
 *   --check   — exit 1 if any unpinned tag-refs found; for CI gate use
 *   --dry-run — preview without writing
 *
 * Usage:
 *   node scripts/sha-pin-actions.mjs .github/workflows/*.yml
 *   node scripts/sha-pin-actions.mjs --check .github/workflows/*.yml
 *   node scripts/sha-pin-actions.mjs --bump .github/workflows/*.yml
 *   node scripts/sha-pin-actions.mjs --dry-run --bump .github/workflows/*.yml
 *
 * Requires: gh CLI authenticated (`gh auth status`).
 *
 * Exits: 0 = all good, 1 = unpinned refs (--check mode) OR SHA resolution failed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { exit } from 'node:process';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const bump = args.includes('--bump');
const check = args.includes('--check');
const files = args.filter((a) => !a.startsWith('--'));

if (files.length === 0) {
  console.error('Usage: node scripts/sha-pin-actions.mjs [--check|--bump] [--dry-run] <workflow.yml> [...]');
  exit(1);
}

const TAG_REF_RE = /(uses:\s+)([\w-]+\/[\w-]+)@(v[0-9]+(?:\.[0-9]+)*)\b(?!\s*#)/g;
const PINNED_REF_RE = /(uses:\s+)([\w-]+\/[\w-]+)@([a-f0-9]{40})\s+#\s+(v[0-9]+(?:\.[0-9]+)*)\b/g;
const cache = new Map();

function resolveSha(ownerRepo, tag) {
  const key = `${ownerRepo}@${tag}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const sha = execSync(
      `gh api repos/${ownerRepo}/git/refs/tags/${tag} --jq '.object.sha'`,
      { encoding: 'utf8' },
    ).trim();
    if (!sha || sha === 'null' || sha.length < 40) throw new Error(`bad SHA: ${sha}`);
    cache.set(key, sha);
    return sha;
  } catch (e) {
    console.error(`✗ failed to resolve ${key}: ${e.message}`);
    return null;
  }
}

let totalPinned = 0;
let totalBumped = 0;
let totalAlready = 0;
let totalUnpinned = 0;
let failed = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const tagMatches = [...content.matchAll(TAG_REF_RE)];

  // --check mode: count unpinned refs, never write
  if (check) {
    if (tagMatches.length > 0) {
      for (const m of tagMatches) {
        const [, , ownerRepo, tag] = m;
        console.error(`  ✗ ${file}: unpinned ${ownerRepo}@${tag}`);
        totalUnpinned++;
      }
    } else {
      console.error(`  · ${file}: clean`);
    }
    continue;
  }

  let next = content;

  // Default + --bump: pin any plain tag refs
  if (tagMatches.length === 0 && !bump) {
    console.error(`  · ${file}: already pinned (no tag refs)`);
    totalAlready++;
    continue;
  }
  for (const m of tagMatches) {
    const [full, prefix, ownerRepo, tag] = m;
    const sha = resolveSha(ownerRepo, tag);
    if (!sha) { failed = true; continue; }
    next = next.replace(full, `${prefix}${ownerRepo}@${sha} # ${tag}`);
    console.error(`  ✓ ${file}: ${ownerRepo}@${tag} → ${sha.slice(0, 8)}… # ${tag}`);
    totalPinned++;
  }

  // --bump mode: re-resolve already-pinned tag comments, update if drifted
  if (bump) {
    const pinnedMatches = [...next.matchAll(PINNED_REF_RE)];
    for (const m of pinnedMatches) {
      const [full, prefix, ownerRepo, currentSha, tag] = m;
      const latestSha = resolveSha(ownerRepo, tag);
      if (!latestSha) { failed = true; continue; }
      if (latestSha === currentSha) continue;
      next = next.replace(full, `${prefix}${ownerRepo}@${latestSha} # ${tag}`);
      console.error(`  ⤴ ${file}: ${ownerRepo}@${tag} ${currentSha.slice(0,8)} → ${latestSha.slice(0,8)}`);
      totalBumped++;
    }
  }

  if (next !== content) {
    if (dryRun) console.error(`  (dry-run) would write ${file}`);
    else writeFileSync(file, next);
  }
}

if (check) {
  console.error(`\n  Check: ${totalUnpinned} unpinned tag ref(s) found`);
  exit(totalUnpinned > 0 ? 1 : 0);
}

const parts = [`${totalPinned} pinned`];
if (bump) parts.push(`${totalBumped} bumped`);
parts.push(`${totalAlready} already pinned`);
console.error(`\n  Summary: ${parts.join(', ')}${failed ? ', some failed' : ''}`);
exit(failed ? 1 : 0);
