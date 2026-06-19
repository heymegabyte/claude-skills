#!/usr/bin/env node
/**
 * gc-claude-home.mjs — garbage-collect bloat in ~/.claude.
 *
 * Targets the unbounded-growth dirs found during the 2026-06-19 audit:
 *   - file-history/  (was 263M / 11k files) — keep last RETAIN_DAYS, cap at MAX_MB
 *   - backups/ + _agentskills-backups/ — keep last KEEP_BACKUPS newest each
 * Reports cache/ + paste-cache/ sizes (informational; they self-evict).
 *
 * Dry-run by default (lists what WOULD be freed). Pass --apply to delete.
 * Never touches: settings.json, CLAUDE.md, hooks/, plugins/, projects/, sessions/.
 *
 * @example
 * node bin/gc-claude-home.mjs            // dry-run report
 * node bin/gc-claude-home.mjs --apply    // actually delete
 */
import { readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const RETAIN_DAYS = 30;
const MAX_MB = 100;
const KEEP_BACKUPS = 20;
const APPLY = process.argv.includes('--apply');
const CLAUDE = join(homedir(), '.claude');
const now = Date.now();

/** @returns {number} bytes freed (or that would be freed). */
function gcFileHistory() {
  const dir = join(CLAUDE, 'file-history');
  if (!existsSync(dir)) return 0;
  const entries = walk(dir).sort((a, b) => b.mtime - a.mtime);
  const cutoff = now - RETAIN_DAYS * 86_400_000;
  let kept = 0;
  let freed = 0;
  let removed = 0;
  for (const e of entries) {
    const overAge = e.mtime < cutoff;
    const overCap = kept > MAX_MB * 1_048_576;
    if (overAge || overCap) {
      freed += e.size;
      removed++;
      if (APPLY) rmSync(e.path, { force: true });
    } else {
      kept += e.size;
    }
  }
  console.log(`file-history: ${removed} files ${APPLY ? 'removed' : 'removable'}, ${mb(freed)} freed, ${mb(kept)} kept`);
  return freed;
}

/** @returns {number} bytes freed. */
function gcBackups(name) {
  const dir = join(CLAUDE, name);
  if (!existsSync(dir)) return 0;
  const items = readdirSync(dir).map(f => ({ path: join(dir, f), ...safeStat(join(dir, f)) }))
    .filter(x => x.mtime).sort((a, b) => b.mtime - a.mtime);
  let freed = 0;
  let removed = 0;
  for (const x of items.slice(KEEP_BACKUPS)) {
    freed += x.size;
    removed++;
    if (APPLY) rmSync(x.path, { recursive: true, force: true });
  }
  console.log(`${name}: ${removed} old ${APPLY ? 'removed' : 'removable'} (keep ${KEEP_BACKUPS} newest), ${mb(freed)} freed`);
  return freed;
}

function reportSize(name) {
  const dir = join(CLAUDE, name);
  if (!existsSync(dir)) return;
  const total = walk(dir).reduce((s, e) => s + e.size, 0);
  console.log(`${name}: ${mb(total)} (informational — self-evicting)`);
}

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p));
    else { const s = safeStat(p); if (s.mtime) out.push({ path: p, ...s }); }
  }
  return out;
}

function safeStat(p) {
  try { const s = statSync(p); return { size: s.size, mtime: s.mtimeMs }; }
  catch { return { size: 0, mtime: 0 }; }
}

const mb = (b) => `${(b / 1_048_576).toFixed(1)}MB`;

console.log(APPLY ? '=== GC ~/.claude (APPLYING) ===' : '=== GC ~/.claude (DRY-RUN — pass --apply to delete) ===');
let total = 0;
total += gcFileHistory();
total += gcBackups('backups');
total += gcBackups('_agentskills-backups');
reportSize('cache');
reportSize('paste-cache');
console.log(`TOTAL ${APPLY ? 'freed' : 'freeable'}: ${mb(total)}`);
