#!/usr/bin/env node
// doctor.mjs — comprehensive plugin health check. Green/red dashboard.
// Usage: node bin/doctor.mjs [--json] [--quiet]

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const HOME = homedir();
const PASS = '✅';
const FAIL = '❌';
const results = [];

function check(name, pass, detail) {
  results.push({ name, pass, detail });
  const icon = pass ? PASS : FAIL;
  if (!process.argv.includes('--quiet')) console.log(` ${icon} ${name} — ${detail}`);
}

// 1. Hook wiring
function hookGroupsHaveExistingPath(groups) {
  if (!Array.isArray(groups)) return false;
  return groups.some(group => {
    if (!group || !Array.isArray(group.hooks)) return false;
    return group.hooks.some(entry => {
      const cmd = entry && entry.command;
      if (typeof cmd !== 'string') return false;
      return cmd.split(' ').some(part => existsSync(part.replace(/^~/, HOME).replace(/^\$HOME\b/, HOME)));
    });
  });
}

try {
  const settings = JSON.parse(readFileSync(resolve(HOME, '.claude/settings.json'), 'utf8'));
  const hooks = settings.hooks || {};
  const hookNames = Object.keys(hooks);
  const existing = hookNames.filter(h => hookGroupsHaveExistingPath(hooks[h]));
  check('Hook wiring', hookNames.length === existing.length,
    `${existing.length}/${hookNames.length} hooks executable`);
} catch (e) {
  check('Hook wiring', false, `settings.json error: ${e.message}`);
}

// 2. Update status
const lastUpdate = resolve(HOME, '.claude/.last-update-result.json');
if (existsSync(lastUpdate)) {
  try {
    const u = JSON.parse(readFileSync(lastUpdate, 'utf8'));
    const age = (Date.now() - new Date(u.timestamp || u.updatedAt || Date.now()).getTime()) / 86400000;
    check('Update status', age < 7, `${Math.round(age)}d since last plugin update`);
  } catch {
    check('Update status', false, 'unparseable .last-update-result.json');
  }
} else {
  check('Update status', false, 'no .last-update-result.json — never updated?');
}

// 3. Disk usage
const cacheDir = resolve(HOME, '.claude/cache');
const hookLog = resolve(ROOT, 'hook-logs');
const sessionDir = resolve(HOME, '.claude/projects');
try {
  const cacheSize = existsSync(cacheDir) ? statSync(cacheDir).size : 0;
  const hookLogSize = existsSync(hookLog) ? statSync(hookLog).size : 0;
  const sessionCount = existsSync(sessionDir) ? readdirSync(sessionDir).length : 0;
  check('Disk usage', true,
    `cache ${(cacheSize / 1024).toFixed(0)}KB, logs ${(hookLogSize / 1024).toFixed(0)}KB, ${sessionCount} sessions`);
} catch (e) {
  check('Disk usage', false, e.message);
}

// 4. Skills.db
const skillsDb = resolve(HOME, '.claude/skills.db');
if (existsSync(skillsDb)) {
  const age = (Date.now() - statSync(skillsDb).mtimeMs) / 86400000;
  check('Skills.db', age < 7, `${Math.round(age)}d since last sync`);
} else {
  check('Skills.db', false, 'skills.db missing');
}

// 5. Settings integrity
let integrityOk = true;
try {
  const s = JSON.parse(readFileSync(resolve(HOME, '.claude/settings.json'), 'utf8'));
  for (const h of Object.keys(s.hooks || {})) {
    if (!hookGroupsHaveExistingPath(s.hooks[h])) { integrityOk = false; break; }
  }
  check('Settings integrity', integrityOk, 'all hook references resolve');
} catch {
  check('Settings integrity', false, 'settings.json parse error');
}

// 6. Crosslinks
try {
  execSync('node ' + resolve(ROOT, 'bin/audit-crosslinks.mjs --ci 2>&1'), { encoding: 'utf8' });
  check('Crosslinks', true, 'audit-crosslinks passed');
} catch (e) {
  const lines = e.stdout?.split('\n').filter(l => l.includes('FAIL') || l.includes('UNRESOLVED'));
  check('Crosslinks', false, `${lines?.length || '?'} broken links`);
}

// 7. Git status
const pluginDir = resolve(HOME, '.claude/plugins/heymegabyte-claude-skills');
if (existsSync(pluginDir)) {
  try {
    const status = execSync('git status --porcelain', { cwd: pluginDir, encoding: 'utf8' }).trim();
    check('Git status', !status, status ? `${status.split('\n').length} uncommitted files` : 'clean');
  } catch {
    check('Git status', false, 'not a git repo');
  }
} else {
  check('Git status', false, 'plugin dir missing');
}

// Summary
const passed = results.filter(r => r.pass).length;
const total = results.length;
const line = '━'.repeat(50);
console.log(`\n${line}`);
console.log(` ${PASS} ${passed}/${total} checks passed`);
if (passed < total) {
  results.filter(r => !r.pass).forEach(r => console.log(`   ${FAIL} ${r.name}`));
}
process.exit(passed === total ? 0 : 1);
