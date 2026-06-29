---
name: internal-skill-discovery
description: Internal Skill Discovery
pack: "core"
priority: 3
triggers:
  - "skill listing"
  - "internal skill"
  - "metadata.internal"
paths:
  - "rules/internal-skill-discovery.md"
last_reviewed: 2026-06-28
superseded_by: null
---

<!-- TOKEN_MARKER: ~1.2k tokens -->

# Internal Skill Discovery

Pattern from vercel-labs/skills (`npx skills` CLI) — hides infrastructure skills from public discovery menus without removing them from the runtime.

## The `metadata.internal: true` flag

```yaml
---
name: operating-system
metadata:
  internal: true
---
```

- Skills with `metadata.internal: true` are **loaded** every session but **hidden** from `/` skill-picker menus and `skills find` interactive search.
- Visible only when `INSTALL_INTERNAL_SKILLS=1` env var is set — e.g. for plugin development.
- Use for: OS-layer skills, bootstrap skills, infra-only skills that should never be user-invoked directly.

## Which skills should be internal

Mark internal when ALL of:

- The skill is loaded automatically (e.g. `priority: 1`, `triggers: []`, `paths: ["*"]`)
- User invoking it directly would be confusing or redundant
- It is infrastructure — not a user-facing feature or workflow

Current internal skills in this plugin:

- `01-operating-system` — supreme policy, loaded every prompt

## Env override

```bash
INSTALL_INTERNAL_SKILLS=1 npx skills find   # shows internal skills in results
```

## Source

Pattern: vercel-labs/skills (`SKILL.md` frontmatter, `metadata.internal: true`, `INSTALL_INTERNAL_SKILLS` env var).

## See

- `01-operating-system/SKILL.md` — only current internal skill
- `spec/SKILL.md` — full frontmatter schema including `metadata` field
- `rules/repo-folder-hygiene.md` — keep skill count scannable (≤10 per folder)
