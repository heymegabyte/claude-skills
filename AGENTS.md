# Emdash Skills — Agent Instructions

This repository contains 14 skill categories and 94 reference docs for autonomous product building.

## Stack
CF Workers + Hono | Angular 21 + Ionic 8 + PrimeNG 21 | D1/Neon | Drizzle v1 | Clerk | Stripe | Inngest | Resend | Bun | Playwright v1.59+ | PostHog | Sentry

## Usage
Load skills on demand via the skill router (`_router.md`). Each category has a `SKILL.md` with submodules listed in frontmatter.

## Key Files
- `CONVENTIONS.md` — shared constants, patterns, stack config
- `_router.md` — routes prompts to smallest useful skill subset
- `SKILL_PROFILES.md` — default bundles by product type (SaaS, API, Marketing, etc.)
- `llms.txt` — LLM-optimized index of all skills

## For AI Coding Tools
This repo is compatible with the agentskills.io open standard. Skills work in Claude Code, OpenAI Codex, Cursor, GitHub Copilot, VS Code, Gemini CLI, and 30+ other tools.

Install: `claude plugin install megabytespace/claude-skills`
Codex: Clone into `~/.codex/skills/` or `.agents/skills/`
npm: `npm i @megabytespace/claude-skills`
