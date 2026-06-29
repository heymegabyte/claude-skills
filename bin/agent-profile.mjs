#!/usr/bin/env node
/**
 * agent-profile.mjs
 *
 * Reads a project's fingerprint (package.json, wrangler.toml, angular.json, etc.)
 * and emits the recommended agent set for that project, per SKILL_PROFILES.md.
 *
 * Profiles:
 *   saas           — all 20 agents
 *   marketing-site — skip migration-agent, cost-estimator, incident-responder
 *   library-cli    — skip seo-auditor, visual-qa, deploy-verifier
 *
 * Usage:
 *   node bin/agent-profile.mjs [--project-type <type>] [path]
 *
 * If --project-type is provided, use it directly.
 * If omitted, auto-detect from files in the given path (default: cwd).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, cwd, exit } from 'node:process';

// ── All 20 agents ──────────────────────────────────────────────────────────

const ALL_AGENTS = [
  'architect',
  'code-simplifier',
  'completeness-checker',
  'computer-use-operator',
  'content-writer',
  'cost-estimator',
  'deploy-verifier',
  'dependency-auditor',
  'incident-responder',
  'media-orchestrator',
  'meta-orchestrator',
  'migration-agent',
  'motion-choreographer',
  'performance-profiler',
  'security-reviewer',
  'seo-auditor',
  'test-writer',
  'visual-qa',
  'accessibility-auditor',
  'changelog-generator',
];

// ── Profiles ───────────────────────────────────────────────────────────────

const PROFILES = {
  saas: {
    label: 'SaaS / Web App',
    agents: ALL_AGENTS,
  },
  'marketing-site': {
    label: 'Marketing Site',
    agents: ALL_AGENTS.filter(a =>
      !['migration-agent', 'cost-estimator', 'incident-responder'].includes(a)
    ),
  },
  'library-cli': {
    label: 'Library / CLI Tool',
    agents: ALL_AGENTS.filter(a =>
      !['seo-auditor', 'visual-qa', 'deploy-verifier'].includes(a)
    ),
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function parseArgs() {
  const typeIdx = argv.indexOf('--project-type');
  const explicitType = typeIdx !== -1 && argv[typeIdx + 1] ? argv[typeIdx + 1] : null;
  const dir = resolve(argv[argv.length - 1] || cwd());
  return { explicitType, dir };
}

function hasFile(dir, name) {
  return existsSync(join(dir, name));
}

function hasDep(pkg, name) {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

function autoDetect(dir) {
  const hasPkg = hasFile(dir, 'package.json');
  const hasWrangler = hasFile(dir, 'wrangler.toml');
  const hasAngular = hasFile(dir, 'angular.json');
  const hasNext = hasFile(dir, 'next.config.js') || hasFile(dir, 'next.config.mjs') || hasFile(dir, 'next.config.ts');
  const hasVite = hasFile(dir, 'vite.config.ts') || hasFile(dir, 'vite.config.js');

  let pkg = {};
  if (hasPkg) {
    try {
      pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    } catch { /* ignore */ }
  }

  const hasCliBin = !!(pkg.bin);
  const hasSsr = hasNext || hasAngular || hasDep(pkg, '@tanstack/react-router');

  // Heuristic:
  // - Has `bin` in package.json + no web deps → library-cli
  // - Has wrangler.toml + Vite + no SSR → marketing-site (CF Pages static)
  // - Has SSR framework + DB ORM → saas
  // - Has Angular → saas (enterprise app)
  // - Has `express` or `hono` dep → saas
  // - Default: marketing-site

  if (hasCliBin && !hasSsr && !hasVite) {
    return 'library-cli';
  }
  if (hasWrangler && !hasSsr) {
    return 'marketing-site';
  }
  if (hasAngular || hasSsr || hasDep(pkg, 'hono') || hasDep(pkg, 'express') || hasDep(pkg, 'drizzle-orm')) {
    return 'saas';
  }
  if (hasDep(pkg, 'inngest') || hasDep(pkg, '@clerk/nextjs') || hasDep(pkg, 'next-auth')) {
    return 'saas';
  }

  return 'marketing-site'; // safest default
}

function printProfile(profileKey) {
  const profile = PROFILES[profileKey];
  if (!profile) {
    console.error(`agent-profile: unknown project type "${profileKey}". Valid: ${Object.keys(PROFILES).join(', ')}`);
    exit(1);
  }

  console.log();
  console.log(`Agent Profile: ${profile.label}`);
  console.log('='.repeat(60));
  console.log();
  console.log(`${profile.agents.length} agents recommended`);
  console.log();

  for (const agent of profile.agents) {
    console.log(`  ${agent}`);
  }
  console.log();
}

function main() {
  const { explicitType, dir } = parseArgs();

  if (explicitType) {
    printProfile(explicitType);
    return;
  }

  const detected = autoDetect(dir);
  console.error(`agent-profile: auto-detected "${detected}" from ${dir}`);
  printProfile(detected);
}

main();
