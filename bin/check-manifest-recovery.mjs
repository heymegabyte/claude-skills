#!/usr/bin/env node
/**
 * check-manifest-recovery.mjs — guarantee the website-build manifest can RECOVER
 * every website-essential rule that the router drops for budget.
 *
 * The router budget (~48K) is maxed on a site prompt: ~33 rules load, ~61 DROP. The
 * design tolerates this ONLY because `website-build-manifest` survives truncation
 * (strongest triggers → top-of-pack) and its recovery index cross-links every rule a
 * complete build needs — so the main thread pulls each dropped detail on demand.
 *
 * That design has ONE failure mode: a website-essential rule that is (a) dropped for
 * budget AND (b) NOT referenced in the manifest → silently unrecoverable. This bug
 * recurred three fires running (Jun-2026): analytics (`production-observability-default-on`),
 * then the CF infra LAW (`projectsites-cloudflare-first`), then `ai-agent-security` —
 * each pack:core (loads broadly, outranked + dropped on site routes) and each missing
 * from the index. This gate blocks the recurrence: every must-recover rule below MUST
 * be `[[referenced]]` in the manifest, and every website-build pack member too.
 *
 * Static (reads files only, no live skills.db) → CI-safe.
 *
 * @example
 * node bin/check-manifest-recovery.mjs        // report
 * node bin/check-manifest-recovery.mjs --ci   // exit 1 if any must-recover rule is unreferenced
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CI = process.argv.includes('--ci');
const MANIFEST = 'rules/website-build-manifest.md';

// Cross-pack rules a complete site needs but that are pack:core (NOT website-build),
// so they drop for budget on site routes. Each MUST be recoverable from the manifest.
// Add a row when a new pack:core rule becomes website-essential.
const MUST_RECOVER = [
  'projectsites-cloudflare-first', // CF infra LAW (allowed infra, hot path, Hyperdrive, capability manifest)
  'production-observability-default-on', // analytics instrumentation (skill 16 §6)
  'ai-agent-security', // when Phase-4 AI-native spiral ships chat/tool-calls/agents
  'feature-flags', // every new feature behind a flag (Hard Gate)
  'email-deliverability', // every-form deliverability gate
];

function packMembers() {
  const yml = readFileSync(join(ROOT, '_packs/website-build.yml'), 'utf8');
  return yml
    .split('\n')
    .filter((l) => /^\s+-\s/.test(l))
    .map((l) => l.replace(/^\s+-\s*/, '').trim().replace(/^rules\//, ''))
    .filter((m) => m !== 'website-build-manifest'); // self-reference not required
}

const manifest = readFileSync(join(ROOT, MANIFEST), 'utf8');
const referenced = (name) => manifest.includes(`[[${name}]]`);

const missingEssential = MUST_RECOVER.filter((r) => !referenced(r));
const missingMembers = packMembers().filter((m) => !referenced(m));

const bad = [...missingEssential.map((r) => ['must-recover', r]), ...missingMembers.map((m) => ['pack-member', m])];

console.log('=== manifest-recovery (every dropped website-essential rule must be recoverable) ===');
console.log(`  ${MUST_RECOVER.length} must-recover + ${packMembers().length} pack members · ${bad.length === 0 ? '✓ all referenced' : `✗ ${bad.length} unrecoverable`}`);
for (const [kind, name] of bad) console.error(`  ✗ [${kind}] [[${name}]] not referenced in ${MANIFEST} — dropped for budget AND unrecoverable`);
if (bad.length) console.error('\n  Add a `[[name]]` cross-link to the manifest recovery index (## Full rule set / ## Architecture).');

if (CI && bad.length) process.exit(1);
