# Frontmatter Schema for SKILL.md Files

Every skill file must have YAML frontmatter with these fields:

## Required Fields

```yaml
---
name: "Human-readable skill name"
description: "What this skill does, when to use it, key capabilities. This is what Claude matches against prompts for auto-invocation. Make it specific and action-oriented."
---
```

## Optional Fields (Recommended for Full Skills)

```yaml
---
name: "..."
description: "..."
layer: kernel | product-compiler | capability-pack | release-pipeline
pack: null | commerce | content | intelligence | ux | infra | social | automation | wisdom
canonical-owner-of:
  - "concept-name-1"
  - "concept-name-2"
activates-when:
  task-types: [build, fix, refactor, launch, research, test, deploy, design]
  file-patterns: ["src/api/*", "*.spec.ts"]
  profiles: [saas, marketing-site, nonprofit, api-service, dev-tool, micro-saas, all]
  signals: ["user mentions payments", "stripe in package.json"]
dependencies: ["01", "05"]
produces:
  - "artifact-name.md"
  - "config-file.toml"
conflicts-with: []
always-load: true | false
user-invocable: true | false
context: fork | null
model: opus | sonnet | haiku | null
allowed-tools: "Bash Read Glob Grep mcp__playwright__*"
---
```

## Field Definitions

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Display name for the skill |
| `description` | string | Auto-invocation matching text. Write as: "Use when X. Does Y. Produces Z." |
| `layer` | enum | Which architectural layer this skill belongs to |
| `pack` | enum/null | Capability pack grouping for batch loading |
| `canonical-owner-of` | string[] | Concepts this skill DEFINES. No other skill may re-define these. |
| `activates-when` | object | Structured triggers for metadata-driven routing |
| `dependencies` | string[] | Skill IDs that must be loaded before this one |
| `produces` | string[] | Artifacts this skill generates during execution |
| `conflicts-with` | string[] | Skills that should not be loaded alongside this one |
| `always-load` | boolean | Whether this skill is in the always-active set |
| `user-invocable` | boolean | Whether users can manually invoke via /skill-name |
| `context` | string/null | "fork" runs in isolated subagent context |
| `model` | string/null | Preferred model tier for this skill's work |
| `allowed-tools` | string | Pre-approved tools when this skill is active |

## Rules

1. **`canonical-owner-of` must be globally unique** — if two skills claim the same concept, that's a conflict to resolve
2. **`description` is the most important field** — it controls auto-invocation accuracy. Write it to match the prompts that should trigger this skill.
3. **`always-load: true` skills** form the kernel + core compiler set (~26 skills). Use sparingly.
4. **`context: fork` skills** run in subagents and don't pollute the main context. Use for: heavy verification, deployment, competitive research.
5. **`model: haiku`** for cheap tasks (docs, changelog, uptime checks). Saves tokens.
6. **`model: opus`** for complex reasoning (security review, architecture, visual QA).

## Migration Guide

Old frontmatter fields to REMOVE (not recognized by Claude Code):
- `icon` (emoji decorations)
- `priority` (use `always-load` instead)
- `version` (use git for versioning)
- `triggers` (use `activates-when` structured format instead)
