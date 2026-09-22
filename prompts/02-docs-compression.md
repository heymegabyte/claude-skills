# Docs Compression

## Trigger phrases

- "compress docs"
- "clean up docs"
- "docs are too verbose"
- "reduce documentation size"
- "cut the noise in docs"

## When to use

- When documentation files have grown beyond 80 lines and contain repeated or narrative content
- When onboarding docs include history or context that is no longer relevant
- Before context-sensitive operations where large docs consume token budget
- After merging multiple rounds of edits that left redundant sections

## When not to use

- For API reference docs (keep exhaustive, compress only examples)
- For legal/provenance docs (LICENSE, CONTRIBUTORS, security policy)
- For user-facing README that non-technical stakeholders read
- For docs that are already under 80 lines and well-structured

## Full reusable prompt

```
Compress the documentation in this repo. The goal is to reduce token count while preserving ALL decisions, commands, warnings, and TODOs.

## Rules of compression

### PRESERVE (never remove or shorten)
- Every decision with rationale
- Every CLI command and its flags
- Every WARNING, CAUTION, or NOTE
- Every TODO, FIXME, HACK, or WORKAROUND
- Every configuration block (JSON, YAML, TOML)
- Every error code, exit code, or return value
- Every link to external resources
- Every template or example block
- Every version number and date
- Every security-relevant instruction

### REMOVE (safe to delete)
- Stale narrative — "first we tried X, then we switched to Y" when Y is the only current approach
- Repeated explanations — the same concept explained in 3 different places (keep the best one, drop the rest)
- Over-explanation — "this means that X does Y" when X → Y is obvious from the command or type
- Introduction paragraphs — "In this document we will explore..." — replace with one-line summary
- Transition phrases — "As we discussed above", "Now that we understand X" — delete entirely
- Gratuitous formatting — extra blank lines, decorative separators, redundant headings
- Outdated alternatives — "You can also use Z (deprecated)" — remove the deprecated path

### REWRITE (compress style)
- Bullet lists of plain text → table where ≥2 columns add information
- Multi-sentence explanations → one sentence, imperative mood
- Verbatim command output → description of what it does, not the raw output
- "In order to X, you need to Y" → "To X, Y"

## Output format

For each file compressed, report:
- `file.md`: N lines → M lines (N% reduction)
- Key deletions (what was removed)
- Any decisions that were preserved

Process every `.md` file in the repo that is not under node_modules, .git, or .claude/worktrees.
```

## Expected outputs

- Per-file compression report (lines before → after, percent reduction)
- Summary of total token savings
- Optional: `docs/deprecated/` archive for removed content worth keeping

## Verification checklist

- [ ] Every decision, command, warning, and TODO from original is present in compressed version
- [ ] No links broken (verify each URL still resolves)
- [ ] Compression saved at least 30% of total markdown token count
- [ ] All compressed files still parse correctly as markdown
- [ ] No functional content was lost — ask a peer to spot-check key docs

## Related skills

- `docs-compression`
- `prompt-library-curator`
- `self-improve`

## Last updated

2026-06-30
