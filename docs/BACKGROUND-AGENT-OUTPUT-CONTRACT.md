# Background Agent Output Contract

This document defines the standard output contract for background agents spawned by the meta-orchestrator or any plugin skill.

## Output directory

Every background agent MUST write its final output as a Markdown file to:

```
$CLAUDE_PLUGIN_DATA/agent-output/<agent-name>-<iso-timestamp>.md
```

- `$CLAUDE_PLUGIN_DATA` — defaults to `~/.claude/plugins/heymegabyte-claude-skills/data/` if unset.
- `<agent-name>` — the agent's slug (e.g. `deploy-verifier`, `seo-auditor`).
- `<iso-timestamp>` — ISO 8601 with `T` and `Z`, no spaces, no colons (e.g. `2026-06-28T143022Z`).

## Output format

Each output file follows this structure:

```markdown
# <agent-name> — <iso-timestamp>

## Task

One-line description of what was requested.

## Summary

2–5 sentences covering what was done, key findings, and any blockers.

## Results

- **Result 1**: description with evidence
- **Result 2**: description with evidence
- ...

## Artifacts

- `<path/to/generated/file>` — purpose of the file
- `<pull-request-url>` — if a PR was created

## Recommendations

Optional list of follow-up actions or suggestions for the main thread.

## Status

PASS | FAIL | PARTIAL
```

## SessionStart hook behavior

The SessionStart hook MUST check for unread output files:

1. List `$CLAUDE_PLUGIN_DATA/agent-output/*.md` sorted by modification time (newest first).
2. For any file not yet read (tracked via a `.read_stamp` file or `$CLAUDE_PLUGIN_DATA/agent-output/.read-stamp`), prepend a system reminder:

   > Unread agent output available: `<path>`

3. The user or main thread reads the file on demand.

## Cleanup

- Output files are retained indefinitely for audit — never delete automatically.
- The user or a periodic cron may archive files older than 90 days to `agent-output/archive/`.

## Example output file

```markdown
# deploy-verifier — 2026-06-28T143022Z

## Task

Verify example.com after deploy.

## Summary

All checks passed. Site loads in 1.2s, axe reports 0 violations, all 6 breakpoints clean.

## Results

- Page loads: 200 OK in 1.2s
- Console errors: 0
- Visual: clean at 375/390/768/1024/1280/1920
- Accessibility: 0 axe violations
- SEO: title (58 chars), meta (142 chars), OG tags present, canonical set
- Performance: LCP 1.4s, CLS 0.03, INP 48ms

## Artifacts

- `e2e/screenshots/deploy-verifier/2026-06-28/` — all breakpoint screenshots

## Status

PASS
```
