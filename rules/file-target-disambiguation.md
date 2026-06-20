---
name: file-target-disambiguation
priority: 2
pack: core
triggers:
  - "where does this file go"
  - "should I put this in the plugin"
  - "CI workflow"
  - "github/workflows"
  - "wrangler.toml"
  - "which repo"
  - "agent-generated file"
paths:
  - "~/.claude/plugins/heymegabyte-claude-skills/**"
  - ".github/workflows/**"
  - "wrangler.toml"
  - "package.json"
---

# File Target Disambiguation

When an agent or skill generates a file, it must land in the RIGHT repo. Two targets exist:

1. **Plugin repo** — `~/.claude/plugins/heymegabyte-claude-skills/` — skills, rules, shared tooling
2. **Consuming project** — the repo Brian is currently working in — stack config, app code, tests

Shipping a file to the wrong target is silent breakage: CI workflows in the plugin never run;
project-specific config in the plugin pollutes every project.

---

## Files that belong in the PLUGIN repo

These are useful across EVERY Brian project. Ship them here once; all projects inherit.

- `skills/<name>/SKILL.md` — skill definitions
- `rules/*.md` — universal principles and doctrine
- `agents/*.md` — specialist agent definitions
- `commands/*.md` — slash command definitions
- `hooks/*.py` / `hooks/*.sh` — session hooks wired via `~/.claude/settings.json`
- `template/` — reusable starter templates (copied INTO projects, never run in-place)
- `.claude-plugin/` — plugin manifest and metadata
- `bin/` scripts that are **plugin-shipped tools** (forge, audit, sync) — tools that operate ON the plugin or skills system itself

---

## Files that belong in the CONSUMING PROJECT

These are specific to a single project's stack or runtime. Ship them to the project root.

- `.github/workflows/*.yml` — CI/CD pipelines run by GitHub Actions in that project's repo
- `wrangler.toml` — Cloudflare Workers config (project-bound; each Worker has its own)
- `package.json` patches — dependency additions or script entries
- `src/` — application code: components, routes, workers, services
- `e2e/` — Playwright specs for that project's live URL
- `tools/evals/cases/` — eval cases for that project's AI features
- `drizzle/` — schema migrations scoped to that project's D1 database
- `.env.example` — env var template for project contributors
- `public/` — static assets served by that project

---

## Explicitly ambiguous (decide case-by-case)

| File class | Rule |
|---|---|
| `bin/` scripts | Plugin-shipped tools → plugin. Project-specific one-off scripts (seed, migrate, deploy) → project. Ask: "Would another project ever run this?" |
| `CHANGELOG.md` | Plugin has its own; consuming projects have their own. Write to whoever just changed. |
| `template/` content | Lives in `plugin/template/` as the SOURCE. Copied into projects during scaffold — the copy is the project's file. Never edit the copy, edit the template. |
| `README.md` | Plugin root README describes the plugin. Project README describes the project. |
| `tsconfig.json` | Project-specific. Never in plugin unless it IS the plugin's own build config. |

---

## Decision rule (one sentence)

> **If this file would be useful in EVERY Brian project, ship to the plugin. If it is specific to a single project's stack, config, or runtime URL, ship to that project.**

---

## Anti-patterns

- **Shipping CI workflows to the plugin** — `.github/workflows/ci.yml` in the plugin repo never runs; GitHub Actions only runs workflows in the repo being pushed to. This is the canonical failure case from Task #40.
- **Shipping `wrangler.toml` to the plugin** — each Worker has its own account ID, route bindings, D1 database IDs. A shared one is always wrong.
- **Shipping project `src/` components to the plugin** — app components have no meaning outside their project.
- **Shipping plugin `rules/` to a project's `.claude/rules/`** — rules should live in the plugin and be inherited globally; duplicating them in project-level `.claude/` creates drift.

---

## Verification (before writing a generated file)

1. Ask: "Does this file reference a specific domain, Worker name, D1 database ID, or repo URL?" → project.
2. Ask: "Would removing this file break a project's build or deploy?" → project.
3. Ask: "Is this a principle, doctrine, command, or skill?" → plugin.
4. Ask: "Does this file run ON the plugin machinery (forge, sync, audit)?" → plugin `bin/`.

---

## See

- `drift-detection` — wrong-target files are drift; fix in-turn
- `repo-folder-hygiene` — keep plugin root ≤10 items; project pollution grows that count
- `context-spillover` — while context is loaded, sweep siblings for same mistake
- `prompt-as-training-signal` — Task #40 surfaced this gap; documented here same turn
