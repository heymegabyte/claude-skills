# Skills System Changelog

## 2026-06-08 — Q2-2026 AI/MCP rules upgrade + lint baseline

### AI/API/MCP rule updates (vendor-doc primary sources)
- `rules/model-routing.md` — add Opus 4.8 flagship section; same $5/$25 per MTok pricing as 4.7 (Anthropic models overview). Keeps 4.7/4.6 as fallback chain.
- `rules/prompt-cache.md` — add `anthropic-beta: token-efficient-tools-2025-02-19` header for Sonnet 4.6 tool-use loops; ~14% output-token cut.
- `rules/auto-meta-work.md` — extend § AI Gateway with per-request `cacheKey` + `cacheTtl`, `patchLog()` for online eval scoring, and `queueRequest: true` async batch for Workers AI bulk inference.
- `rules/ai-agent-security.md` — add Llama Guard 3-8B (`@cf/meta/llama-guard-3-8b`) as gateway-side prompt-injection classifier middleware on `/ai/*` routes.
- `rules/contract-first-ai.md` — add AutoRAG / AI Search escape hatch for managed-RAG-over-R2 when bespoke Vectorize pipeline isn't justified.

### Lint baseline restored
- Add `.markdownlint.jsonc` (relaxed Brian-voice config: MD013/MD025/MD033/MD036/MD041 off; siblings_only headers).
- Add `.markdownlintignore` to exclude state dirs (backups, sessions, projects, paste-cache).
- markdownlint-cli2 `--fix` autofix pass over `rules/*.md` + `commands/*.md` (blanks-around-headings + blanks-around-lists). Residual MD040/MD050/MD060 style-only nits left for next pass.
- `bin/check-required-keys.sh` — add `# shellcheck source=/dev/null` directives for dynamic `source` calls (SC1090).
- brew installed: `shellcheck`, `shfmt`, `yamllint`, `actionlint` for subsequent passes.

### Verified
- All 5 edited rule files Read pre-Edit (no blind overwrites).
- Markdownlint autofix preserved Brian-voice bullet patterns + frontmatter intact.
- shellcheck residual: SC2034 unused-var warnings in `bin/provision-analytics.sh` + `scripts/discover-secrets.sh` left untouched (intentional declarations for sourced contexts).

## 2026-04-24 — v8.0.0 Site Generation Skill

### New Skill: 15-site-generation
- End-to-end AI website generation pipeline extracted from projectsites.dev
- 6 submodules: research-pipeline, media-acquisition, build-prompts, quality-gates, domain-features, template-system
- Supports 15+ business types: local business, SaaS, portfolio, non-profit, government
- Single Claude Code prompt architecture with pre-digested research context
- 12+ API media sourcing strategy (Unsplash, Pexels, Pixabay, Foursquare, Yelp, Google CSE, GPT Image, Ideogram, etc.)
- GPT-4o visual inspection loop with 10-dimension quality scoring
- Category-specific features: restaurant menus, salon booking, medical compliance, non-profit donations, SaaS pricing
- Container architecture: CF Workers Containers with pre-baked skills + template + upload script
- Router updated with site generation task routing and file hints
- Wired orphan refs: heartbeat-polling→05, pre-digested-builds→06, image-profiling→12
- Total: 15 categories, 103 reference docs, 18 agents

## 2026-04-24 — v7.2.1 Cross-Platform Ecosystem

### Platform Variants (32+ total)
- Added 5 modern format directories: `.cursor/rules/` (MDC), `.windsurf/rules/` (trigger frontmatter), `.augment/rules/` (type frontmatter), `.github/instructions/` (applyTo), `.openhands/microagents/`
- Total 32 platform variants auto-generated on push to master (includes Devin + Goose)
- Previous: Roo Code, Continue.dev, Trae, Tabnine, Kilo, Replit variants added in v7.2.0

### CI/CD
- Auto-publish to npm, JSR, GitHub Releases, Continue Hub, GitHub Skills on tag push
- Auto-version-sync: plugin.json + marketplace.json now sync from package.json in CI
- Actions upgraded v4→v6 (Node.js 20 deprecation avoidance)

### Packaging
- All 32 platform variants included in npm + JSR packages
- bin/ scripts + .claude-plugin/ included in distribution
- npm badge + JSR badge added to README

### README
- Complete cross-platform support table (24 variants with file paths and format notes)
- Install methods: Claude plugin, npm, JSR, Codex, manual
- Fixed doc count 93→94
- Updated description: "32+ AI coding tools" (was "Claude Code")

### Community
- Submitted to 9 awesome-list repos for discoverability
- PR template with quality checklist + auto-labeling by file path

## 2026-04-23 — v7.0 Comprehensive Linting + CI

### Linting
- Comprehensive linting pipeline: validate-skills.sh with frontmatter, link, router/profile cross-reference, and SKILL.md size checks
- Pre-commit: trailing whitespace, EOF, merge conflict, large files, secret detection

### Publishing
- 5-target publish pipeline: npm, JSR, GitHub Releases, Continue Hub, GitHub Skills
- Codex .agents/skills/ directory auto-generated from SKILL.md files

### Content
- llms.txt + llms-full.txt for LLM discovery (links to all 94 docs + 18 agents)
- AGENTS.md for Linux Foundation AAIF standard compliance

## 2026-04-20 — v5.1 14-Category Re-Architecture

### Architecture
- Consolidated 57 skills into 14 parent categories with submodule files
- 44 child skills moved as .md files into parent folders, zero data loss
- Deleted stale: system-audit/, system-redesign/, .emdash/, migration scripts

### Meta Files
- _router.md v2 (submodule routing, always-load-all-14)
- MASTER_PROMPT.md v5.1, SKILL_PROFILES.md, QUICK_REF.md, CONVENTIONS.md updated

### ChatGPT Data Integration
- Processed 3,102 conversations (428MB): tech, feedback, product, personal, design, AI workflow
- Created 3 new memory files, updated 8 existing with quantified data
- Updated rules (brian-preferences, copy-writing, code-style) and skills (05, 09, 10)

### Token Efficiency
- Rules: 344→280 lines. Skills: 57→14 discovered (reduced auto-discovery overhead)

## 2026-04-18 — v4.4 Self-Improving System

- Added continuous skill maintenance (per-prompt, per-5-prompts, per-project)
- Added MEMORY.md pending updates accumulation + batch-apply
- Added self-healing, CLAUDE.md/MEMORY.md auto-enhancement
- Added source freshness verification, contradiction detection, skill telemetry
- Added cross-project learning, pre-flight checklist, time budgets
- Enhanced _router.md, SKILL_PROFILES.md, CONVENTIONS.md, QUICK_REF.md

## 2026-04-19 — v4.3 Final Optimization

- Merged 5 overlapping skills. Created _router, CONVENTIONS, QUICK_REF, SKILL_PROFILES, llms.txt
- Added scripts/discover-secrets.sh, self-improvement/research protocols
- Scanned GitHub starred repos. 53→49 skills, ~12,200 lines

## 2026-04-19 — v4.2 Psychology and Integration

- Created Wisdom skill (30 Laws of UX, Cialdini, Kahneman)
- Created MCP Integrations skill (16 servers, secrets discovery)
- Enhanced 9 skills with psychology, mapped 181 secrets, verified 50+ keys

## 2026-04-19 — v4.1 Product Completeness

- Created skills 31-50 + 28-30. Added Flesch, Yoast, keyword APIs. 14→53 skills

## 2026-04-18 — v4.0 Initial Architecture

- Restructured from 24 flat (v3) to 14 numbered categories
- YAML frontmatter, MASTER_PROMPT.md, media templates, archived v3
