# Multi-Harness Portability — implementation reference

Sourced on demand by rules/multi-harness-portability.md.

---

## Directory structure

```
heymegabyte-claude-skills/           ← source of truth (this repo)
├── .claude-plugin/                  ← Claude Code manifest (always present)
│   ├── plugin.json
│   └── skills/                     ← symlinks or copies of SKILL.md files
├── .cursor/                         ← Cursor harness
│   └── rules/                      ← .mdc files (one per skill)
├── .codex-plugin/                   ← OpenAI Codex harness (experimental)
│   └── plugin.json
├── .kimi-plugin/                    ← Kimi harness (China market)
│   └── plugin.json
└── .opencode/                       ← opencode harness (open source CLI)
    └── config.json

Rules dir (harness-neutral):
└── rules/                           ← all .md rule files — shared across all harnesses
```

---

## `plugin.json` variants per harness

### Claude Code (`.claude-plugin/plugin.json`) — current

```json
{
  "name": "heymegabyte-claude-skills",
  "version": "6.1.0",
  "description": "Emdash OS v6.1 — Brian Zalewski / Megabyte Labs",
  "skills": [
    { "path": "../01-operating-system/SKILL.md", "id": "operating-system" },
    { "path": "../17-non-engineering-verticals/SKILL.md", "id": "non-engineering-verticals" },
    { "path": "../18-document-processing/SKILL.md", "id": "document-processing" }
  ],
  "hooks": {
    "preToolUse": ["../hooks/skill-security-auditor.py", "../hooks/config-protection.py"]
  }
}
```

### Cursor (`.cursor/rules/<skill-name>.mdc`)

Cursor uses `.mdc` files — Markdown with optional YAML frontmatter. Each SKILL.md becomes one `.mdc` file with an added `globs` field.

```
---
description: "Finance domain — SaaS metrics, unit economics, pricing strategy."
globs: ["**/*.ts", "**/*.md", "**/ROADMAP*"]
alwaysApply: false
---

[content of finance-domain.md]
```

Generation script: `bin/export-cursor-rules.sh`

```bash
#!/usr/bin/env bash
# Exports SKILL.md files as Cursor .mdc rules
mkdir -p .cursor/rules
for dir in [0-9][0-9]-*/; do
  skill="${dir%/}"
  src="$dir/SKILL.md"
  dest=".cursor/rules/${skill}.mdc"
  [[ -f "$src" ]] && cp "$src" "$dest"
done
echo "Exported $(ls .cursor/rules/*.mdc 2>/dev/null | wc -l) Cursor rules"
```

### OpenAI Codex (`.codex-plugin/plugin.json`)

Codex does not support hooks or dynamic routing — export only harness-neutral rules.

```json
{
  "name": "heymegabyte-skills",
  "version": "6.1.0",
  "instructions": "Load rules/ directory. Each .md file is a standing instruction.",
  "files": [
    "rules/always.md",
    "rules/autonomous-engineering.md",
    "rules/feature-flags.md",
    "17-non-engineering-verticals/finance-domain.md",
    "17-non-engineering-verticals/compliance-os.md"
  ]
}
```

### opencode (`.opencode/config.json`)

```json
{
  "instructions": ["rules/always.md", "rules/code-style.md"],
  "skills": [
    { "path": "17-non-engineering-verticals/SKILL.md" },
    { "path": "18-document-processing/SKILL.md" }
  ]
}
```

### Kimi (`.kimi-plugin/plugin.json`)

Kimi plugin format mirrors Claude Code with localization additions.

```json
{
  "name": "heymegabyte-skills",
  "locale": "zh-CN",
  "fallback_locale": "en",
  "skills": [
    { "path": "../17-non-engineering-verticals/SKILL.md", "id": "non-engineering-verticals" }
  ]
}
```

---

## Sync scripts

Single source of truth: `SKILL.md` files in numbered dirs + `rules/` dir. Never edit `.cursor/rules/*.mdc` or `.codex-plugin/` directly.

`bin/sync-all-harnesses.sh` — run after any SKILL.md or rules/*.md edit:

```bash
#!/usr/bin/env bash
# bin/sync-all-harnesses.sh
set -euo pipefail

echo "Syncing harnesses..."
bash bin/export-cursor-rules.sh
# Future: bash bin/export-codex.sh
# Future: bash bin/export-opencode.sh
echo "Done."
```

CI gate via `lefthook.yml`:

```yaml
pre-push:
  commands:
    harness-sync-check:
      run: bash bin/check-harness-sync.sh
      fail_text: "Harness manifests out of sync — run npm run sync-harnesses"
```
