# Multi-Harness Portability

Source: obra/superpowers multi-harness pattern

Brian's plugin currently ships Claude Code only (`.claude-plugin/`). This rule documents when and how to add companion manifests for other AI harnesses without fragmenting the source of truth.

---

## When to add multi-harness support

**Do it when:**

- A paying client or partner uses a different harness (Cursor, Codex, Kimi, opencode)
- A skill reaches "stable, 100%" and the additional reach justifies ongoing sync cost
- A skill is domain-agnostic (e.g., `finance-domain.md`, `compliance-os.md`) — not Claude-specific

**Skip it when:**

- The skill uses Claude-specific features (CLAUDE.md loading, PreToolUse hooks, agent spawning)
- The skill references `~/.claude/` paths directly
- You're still iterating — wait for stable

**Cost model:** Each new harness = ~15 min one-time setup + ~5 min/skill ongoing sync. At 18 skills, adding 3 harnesses = 2.5h one-time + 27 min per skill update. Only worth it past ~10 stable skills with multi-harness audience.

---

## Directory structure and manifests

- `.claude-plugin/plugin.json` is always present — Claude Code is the canonical harness.
- Each additional harness gets its own folder: `.cursor/rules/` (`.mdc` files), `.codex-plugin/plugin.json`, `.kimi-plugin/plugin.json`, `.opencode/config.json`.
- `rules/` is harness-neutral — shared across all harnesses.
- Codex does not support hooks or dynamic routing; export only harness-neutral rules.
- Kimi manifest mirrors Claude Code with `locale`/`fallback_locale` additions.

See `reference/multi-harness-portability.md` for all manifest files and the Cursor export script.

---

## Sync strategy

- **Single source of truth:** `SKILL.md` files in numbered dirs + `rules/` dir. Never edit `.cursor/rules/*.mdc` or `.codex-plugin/` directly.
- **Sync trigger:** Any edit to a SKILL.md or `rules/*.md` → run `npm run sync-harnesses` (or `bin/sync-all-harnesses.sh`).
- **CI gate:** `lefthook.yml` `pre-push` command runs `bin/check-harness-sync.sh`; fails if manifests are out of sync.

See `reference/multi-harness-portability.md` for the sync script and lefthook config.

---

## Trade-offs

| Factor | Claude-only | Multi-harness |
|---|---|---|
| Maintenance cost | Low | +5 min/skill/update |
| Reach | ~1 harness | 3-5 harnesses |
| Hook support | Full | Claude-only |
| Router/activation | Full | Static only (Cursor/Codex/Kimi) |
| Agent spawning | Full | None (Claude-only feature) |
| Recommended at | Always | ≥10 stable skills + multi-harness clients |

**Rule:** Claude-first, always. Multi-harness as graduation, not default.

---

## Cross-links

- `.claude-plugin/` — current canonical manifest
- `rules/drift-detection.md` — harness manifest drift = drift, fixed same turn
- `bin/sync-desktop-skills.py` — Claude desktop sync (already wired)
- `rules/prompt-as-training-signal.md` — when a client asks for Cursor support, add the harness same turn
