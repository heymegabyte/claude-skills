# SKILL.md Authoring Spec

Pattern from anthropics/skills (`spec/agent-skills-spec.md`). Authoritative reference for contributors.

---

## Frontmatter fields

```yaml
---
name: my-skill                      # REQUIRED. Lowercase a-z, 0-9, hyphens. Max 64 chars.
                                    # Must match parent directory name exactly.
description: |                      # REQUIRED. Max 1024 chars.
  What it does. When to invoke it.  # Lead with trigger condition for agent discovery.
  Include specific keywords.
license: MIT                        # OPTIONAL. License name or bundled file reference.
compatibility: Requires Node 22+    # OPTIONAL. Max 500 chars. Env constraints (wrangler, CF, Python).
metadata:                           # OPTIONAL. Arbitrary KV map.
  internal: true                    # Hides from /menu picker + skills find. See rules/internal-skill-discovery.md.
  version: "1.0"
  author: example-org
allowed-tools: Read Grep Bash(git:*) # OPTIONAL. Space-separated pre-approved tools. Experimental.
---
```

### Field rules

| Field | Required | Constraints |
|---|---|---|
| `name` | Yes | `^[a-z0-9][a-z0-9-]*[a-z0-9]$`, max 64, matches dir name |
| `description` | Yes | max 1024, non-empty, trigger-first |
| `license` | No | license name (MIT, Apache-2.0, Rutgers) |
| `compatibility` | No | max 500, e.g. "Requires wrangler 3.90+" |
| `metadata` | No | KV map; use `internal: true` for infra skills |
| `allowed-tools` | No | space-separated; supports `Bash(cmd:*)` glob form |

---

## `allowed-tools` glob format

```yaml
allowed-tools: Read Glob Grep Bash(git:*) Bash(npm:audit) mcp__playwright__*
```

- Space-separated, no quotes
- `Bash(cmd:*)` scopes to commands starting with `cmd`
- `mcp__server__*` covers all tools from that MCP server
- Experimental — support varies by Claude Code version

---

## Body conventions

- **≤500 lines** total. Move bulk reference material to `references/REFERENCE.md`.
- **≤200 lines recommended** for skill body. Under 100 lines = zero cognitive overhead.
- **Progressive disclosure** (3 tiers):
  1. Metadata (~100 tokens) — `name` + `description` loaded at startup for all skills
  2. Instructions (<5000 tokens) — full body loaded on invocation
  3. Resources — `scripts/`, `references/`, `assets/` loaded on demand

- **Trigger-first description** — first sentence must answer "when do I invoke this?" not "what does this do?"
  - BAD: "This skill processes PDF documents using Python."
  - GOOD: "Use when reading, extracting, or merging PDF files."

- **Cross-link siblings** with `[[rule-name]]` or `[[skill-name]]` backlinks, never copy-paste.

- **No duplicated doctrine** — if CLAUDE.md already defines the behavior, reference it, don't repeat it.

---

## Naming conventions

| Context | Convention |
|---|---|
| Skill directory | `kebab-case`, matches `name` frontmatter |
| File inside skill | `kebab-case.md`, `kebab-case.py`, `kebab-case.sh` |
| Sub-resource files | `references/REFERENCE.md`, `scripts/extract.py` |
| Agent definition | `agents/kebab-case.md` |
| Command definition | `commands/kebab-case.md` |

---

## Optional directory structure

```
my-skill/
├── SKILL.md              # Required — frontmatter + body
├── scripts/              # Python/Bash/JS helpers invoked by the skill
│   └── extract.py
├── references/           # Long reference docs, domain tables, forms
│   └── REFERENCE.md
└── assets/               # Templates, images, static data
```

Keep references ONE level deep. Never chain: `references/sub/deep/file.md`.

---

## `<SUBAGENT-STOP>` guard

Meta-skills (session-recap, self-improve, drift-check, dashboard-cockpit) MUST include at the very top of their body:

```markdown
<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. -->
<SUBAGENT-STOP/>
```

Source: obra/superpowers `using-superpowers` skill. Prevents meta-skill activation in spawned subagent contexts.

---

## Quality bar

- Description must be trigger-first and keyword-rich (agents discover by description, not name).
- Body under 500 lines — if longer, extract to `references/`.
- Every agent-facing skill must have at least one example invocation or output format.
- No TODO/FIXME/placeholder in body (allowed in source code per `todos-allowed` rule, not skill docs).
- Cite source repos for patterns borrowed (`Source: obra/superpowers`).

---

## See

- `template/SKILL.md` — starter scaffold for new skills
- `rules/internal-skill-discovery.md` — `metadata.internal` pattern
- `rules/repo-folder-hygiene.md` — ≤10 items per folder
- anthropics/skills `spec/agent-skills-spec.md` — official upstream spec
