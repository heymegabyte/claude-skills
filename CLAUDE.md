# Emdash Skills v7.2

15-category skill system (01-OS→15-SiteGen) with 103 reference docs, 18 agents, 32 platform variants. Used by Claude Code, Cursor, Codex, OpenHands, Windsurf, Goose, Devin, and others.

## Loading
`01-operating-system` loads EVERY prompt. Route via `_router.md` Category Map + Task Routing + File Hints. Load smallest useful subset — never preload all. Deterministic order: 01→02→...→14 (prompt cache optimization, 5min TTL).

## Structure
`{NN}-{name}/SKILL.md` — skill definition with frontmatter (version, model, effort, paths). `{NN}-{name}/{ref}.md` — reference docs loaded on demand. `agents/{name}.md` — agent definitions with frontmatter (model, permissionMode, skills, memory, isolation). `CONVENTIONS.md` — shared constants: stack versions, domains, deploy commands, starter templates, security headers. `SKILL_PROFILES.md` — domain→profile mapping (Marketing|SaaS|Micro-SaaS|Nonprofit|API|DevTool|Internal).

## Agents (18)
architect|code-simplifier|completeness-checker|computer-use-operator|deploy-verifier|security-reviewer|seo-auditor|test-writer|visual-qa|dependency-auditor|meta-orchestrator|migration-agent|content-writer|performance-profiler|incident-responder|accessibility-auditor|cost-estimator|changelog-generator

Sync: `scripts/sync_agents.py` keeps `agents/` ↔ `~/.claude/agents/` identical. Run after any agent edit.

## Platform Variants
`.claude-plugin/` (Claude Code plugin format) | `.cursor/` | `.windsurf/` | `.codex/` | `.openhands/` | `.goose/` | `.devin/` | `.bolt/` | `.continue/` | `.roo/` | `.trae/` | `.void/` | `.kilo/` | `.kiro/` | `.junie/` | `.tabnine/` | `.augment/` | `.aiassistant/` | `.amazonq/` | `.agents/` | `.emdash/`

## File Format
Dense paragraphs, abbreviations, `→` and `|` separators. No prose wrappers, no markdown tables for simple mappings. Match sibling density. See `CONTRIBUTING.md`.

## Stack
CF Workers+Hono | Angular 21+Ionic+PrimeNG | D1/Neon | Drizzle v1+Zod | Clerk | Stripe | Inngest v4 | Resend | Bun 1.3 | Playwright v1.59 | PostHog+Sentry+GA4/GTM

## Versioning
Skills: semver in SKILL.md frontmatter. Agents: synced via script. CHANGELOG.md tracks all changes. Deprecations documented inline with sunset dates.
