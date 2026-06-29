# Emdash OS — Open Source Marketplace Plan

Package the emdash core as a Claude Code marketplace plugin under MIT license.

## What ships

| Component | Source | Notes |
|---|---|---|
| **5 skill packs** (idea #34) | `01-operating-system` … `05-deploy-verify` | Core loop skills |
| **Agent library** (idea #13) | `agents/` directory | All 20 specialist agents |
| **Hook infrastructure** (ideas #1-10) | `hooks/*.py` | Pre/Post/Stop/Session hooks |
| **Command library** | `commands/*.md` | Slash commands for daily workflow |
| **Rule library** | `rules/` (public subset) | Cross-project conventions |

## What stays private

- `rules/brian-preferences.md`, `rules/brian-voc-data.md`, `rules/finance-domain.md` — personal specificity
- `project-memories/` — per-project context
- `secrets/` — any credential-adjacent files
- Any rule that references `blzalewski`, `megabyte.space`, or personal API keys

## License & naming

- **Name:** `emdash-os`
- **License:** MIT
- **Marketplace entry:** `plugin.json` at root following `.claude-plugin/marketplace.json` format: name, description, tags (`os`, `workflow`, `deploy`, `testing`, `agents`), author, icon, screenshots.
- **Repository:** `github.com/HeyMegabyte/emdash-os`

## Launch checklist

1. Clean install on a fresh Claude Code workspace — `git clone` + `Claude: Install from Folder`
2. Every gate green (`doctor.mjs` passes all 7 checks)
3. `mcp-healthcheck.mjs` — all referenced MCP servers resolvable
4. README with 5-minute quickstart: "install → `/init` → `/architect` → write code → `/verify`"
5. Broadcast: push to GitHub, publish to npm (`@heymegabyte/emdash-os`), submit to Claude Directory

## Maintenance

- Update the public subset on each plugin release — private rules stay in `~/.claude/plugins/heymegabyte-claude-skills/`, not in the repo
- `bin/strip-private.mjs` — strips private rules from release build before publish
- CHANGELOG tracks which public components changed each version
