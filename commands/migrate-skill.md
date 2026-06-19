---
description: Generic skill-version migration — works for hardened/v2/experimental→stable promotions across MCP servers, skills, hooks, commands. Mirrors /migrate-to-hardened with broader detection.
argument-hint: <skill-name> [--dry-run] [--rollback]
allowed-tools: Bash, Read, Edit, Write, Glob
model: claude-sonnet-4-6
---

# Migrate skill version

Generalize the unhardened→hardened cutover pattern (see /migrate-to-hardened) to ANY skill upgrade. Detects migration type by directory naming convention, runs build + smoke-test + register + archive, supports --dry-run preview + --rollback reversal.

## Detection

Scan `~/.claude/plugins/heymegabyte-claude-skills/` for siblings matching one of:

| Pattern | Migration type |
|---|---|
| `<name>-hardened-mcp/` next to `<name>-mcp/` | hardening promotion |
| `<name>-v2/` next to `<name>/` | major version bump |
| `<name>/` with `metadata.stage: stable` next to one with `metadata.stage: experimental` | promotion |
| `<name>-next/` next to `<name>/` | preview → current |

If none detected, exit with usage.

## 7-step flow (forward migration)

1. Verify the NEW version directory exists; bail if missing
2. Build: if `package.json` → `npm install && npm run build`; if `Cargo.toml` → `cargo build --release`; else just verify file existence
3. Smoke-test by skill type:
   - MCP server: spawn + send `tools/list` JSON-RPC, expect non-empty result within 5s
   - Slash command: render markdown (no-op smoke)
   - Hook: dry-run with sample stdin
   - Template util: `node --check`
4. Interface comparison: parse OLD + NEW surface (tool list / command frontmatter / hook exports). Warn on REMOVED interfaces (breaking change for consumers)
5. Register: patch the right config file
   - MCP server → `~/.claude.json` mcpServers entry path swap
   - Hook → `~/.claude/settings.json` hooks block path swap
   - Slash command → no-op (auto-discovered)
   - Skill → no-op (auto-discovered)
6. Archive old: `mv <old-path> <old-path>.archived-{timestamp}`
7. Print confirmation + rollback command

## Flags

- `--dry-run`: print 7-step plan with absolute paths; no writes
- `--rollback`: reverse everything (un-archive + restore registration + remove new entry from config + remove new dir)
- (no flag): run forward migration with user confirmation prompt before destructive steps

## Composition

`/migrate-to-hardened <name>` is equivalent to `/migrate-skill <name>-hardened`. Use the more specific command when the migration is specifically a hardening; use this generic command for v2/stable/preview transitions.

## Rollback safety

Every archived directory keeps a timestamp suffix so multiple rollbacks coexist without overwriting. `~/.claude.json` and `~/.claude/settings.json` get a `.bak-{timestamp}` copy before any write.

## See also

- `commands/migrate-to-hardened.md` — specialization for hardening
- `rules/no-staging-doctrine.md` — instant rollback is the only acceptable safety net
- `rules/main-only-branch.md` — same instant-rollback principle applied to migrations
- `rules/agent-resilience-discipline.md` — file-by-file write ordering survives connection drops
