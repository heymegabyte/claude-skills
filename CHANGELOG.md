# Skills System Changelog

## 2026-04-18 — v4.4 Self-Improving System Architecture

### Self-Improvement Loop (skill 01)
- Added continuous skill maintenance protocol (per-prompt, per-5-prompts, per-project)
- Added MEMORY.md `## Pending Skill Updates` accumulation and batch-apply workflow
- Added self-healing section (auto-fix deploy failures, missing keys, test failures)
- Added CLAUDE.md/MEMORY.md auto-enhancement triggers

### Idea Engine Evolution (skill 14)
- Added source freshness verification (web-search for NNGroup, web.dev, OWASP updates)
- Added contradiction detection (when new research invalidates skill content)
- Added skill usage telemetry and heatmap tracking
- Added merge candidate detection for always-paired skills
- Added never-triggered skill archival protocol

### Context Management (skill 30)
- Added token budget awareness section
- Added deduplication rules (canonical locations for shared patterns)
- Added incremental context loading protocol

### Cross-Project Learning (skill 04)
- Added MEMORY.md scanning across recent projects for reusable patterns
- Added standard MEMORY.md template with consistent sections
- Added preference drift detection across projects

### Planning Enhancements (skill 03)
- Added pre-flight checklist (10-point verification before any build)
- Added time budget allocation table for typical builds

### Routing and Profiles
- Enhanced _router.md with cost estimation, anti-patterns, decision tree
- Enhanced SKILL_PROFILES.md with quick-match domain patterns and Micro-SaaS profile
- Added profile selection decision tree

### Helper Files
- Enhanced CONVENTIONS.md with breakpoints, JSON-LD templates, Hono starter, failure patterns, git conventions
- Enhanced QUICK_REF.md with decision shortcuts, common mistakes, emergency playbook, report template

### System Documentation
- Enhanced README.md with self-improvement loop description and optimal loading order

---

## 2026-04-19 — v4.3 Final Optimization
- Merged 5 overlapping skills: 21→12, 22→09, 23→05, 25→13, 31-admin→46
- Created _router.md (deterministic skill routing)
- Created CONVENTIONS.md (shared constants, eliminates repetition)
- Created QUICK_REF.md (one-page cheat sheet)
- Created SKILL_PROFILES.md (5 project-type routing profiles)
- Created llms.txt (machine-readable index)
- Created scripts/discover-secrets.sh (runtime secret discovery)
- Added self-improvement protocol to skill 01
- Added self-research protocol to skill 14
- Scanned GitHub starred repos for stack recommendations
- Total: 53 → 49 skills, ~12,200 lines

## 2026-04-19 — v4.2 Psychology and Integration Pass
- Created skill 51 (Wisdom and Human Psychology) with 30 Laws of UX, Cialdini, Kahneman
- Created skill 52 (MCP and Cloud Integrations) with 16 MCP servers, secrets discovery
- Enhanced 9 skills with behavioral psychology (01, 03, 06, 09, 10, 18, 22, 34, 36)
- Added projectsites.dev brand strategy to 8 skills
- Mapped 181 chezmoi secrets, verified 50+ decryptable API keys
- User-enhanced: skills 07, 10, 17, 18, 20, 23, 36, 51 with research from NNGroup, web.dev, YC, Smashing

## 2026-04-19 — v4.1 Product Completeness Pass
- Created skills 31-50 (error pages, forms, blog, launch, CI/CD, onboarding, search, health, changelog, backup, feedback, i18n, AI chat, Drizzle, webhooks, admin, shortcuts, empty states, notifications, Coolify)
- Created skills 28-30 (SEO/Keywords, Documentation Hygiene, AI-Native Coding)
- Added Flesch readability enforcement, Yoast SEO checklist, keyword research APIs
- Added install.doctor README template with aqua dividers
- Total: 14 → 53 skills

## 2026-04-18 — v4.0 Initial Architecture
- Restructured from 24 flat skills (v3) to 14 numbered categories
- Added proper YAML frontmatter to all skills
- Created MASTER_PROMPT.md
- Created media generation prompt templates
- Archived all v3 skills to .archive/v3/

## Pre-v4 (v3)
- 24 flat skills in .agentskills/
- No frontmatter, no routing, no profiles
- base-layer, beyond-the-prompt, always-deploy-and-test as foundation
