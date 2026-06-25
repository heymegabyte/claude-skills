# reference/ — dynamically-sourced technical detail (NOT router-loaded)

The skill-router indexes only `rules/*.md` and `*/SKILL.md`. Files here are **invisible to the router** — they cost ZERO context tokens until an agent explicitly `Read`s one. This is file-level progressive disclosure per `[[instruction-compression-playbook]]`.

## What lives here

- Full implementation code (Hono handlers, sig-verification, idempotency, schemas) that a rule references but doesn't need inline.
- Long worked examples, RFC-format templates, exhaustive option tables.
- Anything that is **HOW** (implementation) rather than **WHAT** (the business/technical requirement).

## What does NOT live here

- Business requirements, thresholds, gates, vendor/version choices, brand values — those stay in the rule (the AI must know them without a second read).
- Short snippets that ARE the spec (a required header value, a legally-required field) — keep inline in the rule.

## Contract

- A rule keeps the requirement + a plain-path pointer: `` See `reference/<topic>.md` for the full implementation. `` (plain path, NOT a `[[crosslink]]` — crosslinks are for router-loaded rules only).
- The AI reads the reference file on demand when implementing that surface.
- **Path resolution:** `reference/<x>.md` is relative to the plugin root (`~/.agentskills/reference/<x>.md`, symlinked from `~/.claude/plugins/heymegabyte-claude-skills/`). The main agent resolves it directly. **When spawning a sub-agent** that must read a reference file, pass the ABSOLUTE path `~/.agentskills/reference/<x>.md` in its brief — a fresh sub-agent's cwd is usually a project dir, where the relative path won't resolve (per `[[parallel-subagent-economy]]` fresh-context rule).
- Reference filenames mirror the owning rule: `rules/webhook-receiver-architecture.md` → `reference/webhook-receiver-architecture.md`.
