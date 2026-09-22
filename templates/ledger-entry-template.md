```json
{
  "timestamp": "2026-06-30T00:00:00Z",
  "trigger_phrase": "the exact prompt or action that triggered this",
  "classification": "skill | rule | prompt | template | deprecate | experiment",
  "destination": ".agentskills/<type>/<name>.<ext> | <rules-path> | <project-path>",
  "files_changed": [
    "<path/to/file1>",
    "<path/to/file2>"
  ],
  "why": "The problem this solves. What was the gap, friction, or repeated mistake?",
  "why_not_overfit": "Why this belongs at the agent-skills layer and not in project CLAUDE.md, a one-off script, or training.",
  "repo_sync": {
    "updated_in_repo": true,
    "repo_path": "<path within the synced git repo>",
    "git_revision": "<sha or null if not yet committed>"
  },
  "verification": "How to confirm this entry works as intended. Concrete steps or assertion.",
  "follow_up_risk": "What could break if the linked artifact drifts, or when this entry should be revisited.",
  "retrospective_marker": "Added as part of <arc-name> arc (<YYYY-MM-DD>)."
}
```

## Fields reference

| Field | Required | Description |
|---|---|---|
| `timestamp` | Yes | ISO 8601 with timezone. When the decision was executed, not discussed. |
| `trigger_phrase` | Yes | The exact prompt or command that caused this. Enables grep-based recall. |
| `classification` | Yes | One of: `skill`, `rule`, `prompt`, `template`, `deprecate`, `experiment`. Determines archive routing. |
| `destination` | Yes | Where the artifact lives. Full relative path from the agentskills root. |
| `files_changed` | Yes | All files touched as part of this entry — artifact, test, companion edits. Minimum 1. |
| `why` | Yes | The concrete problem. If you can't state the problem in 2 sentences, you haven't understood it yet. |
| `why_not_overfit` | Yes | Justify the layer choice. Revisit this at next review — if the justification weakens, consider moving the artifact closer to the project. |
| `repo_sync` | Yes | Every skill/rule/prompt must sync into a repo. This field tracks which repo, where, and at what ref. |
| `verification` | Yes | Concrete steps to confirm the artifact works. "Run the skill against project X" not "verify it works." |
| `follow_up_risk` | Yes | What could go wrong. If you can't identify a risk, you haven't looked hard enough. |
| `retrospective_marker` | Yes | Links this entry to the arc that created it. Facilitates post-arc retrospection. |

## Authoring rules

1. Every LEDGER entry is valid JSON. Lint with `jq .` before commit.
2. One entry per artifact. If a single prompt creates two skills, that's two entries.
3. `files_changed` includes test files, companion edits, and the artifact itself. Never leave this array empty.
4. `why_not_overfit` is the MOST important field. If you write "this is a universal pattern," prove it — list the projects that have needed it.
5. Entry is written at the same time as the artifact, not after. Two operations, same turn.
6. When deprecating a prior entry, the deprecating entry's `files_changed` includes the file being deprecated. The deprecated entry gets its own `{"superseded_by": "<timestamp of superseding entry>"}` annotation appended.
7. Timestamps are lexicographically sortable. Use ISO 8601 UTC.
