# Prompt Index

This directory is the canonical prompt library — self-contained, copy-pasteable prompts for common agent workflows. Each prompt is designed to be invoked manually or piped into a sub-agent.

## How to use

- Copy the full prompt from `## Full reusable prompt` section and paste into a new conversation / sub-agent.
- Update this index when adding or removing prompts.
- Keep prompts between 40–80 lines. Self-contained means zero external references.

---

## Prompts

| # | File | Triggers | Purpose |
|---|------|----------|---------|
| 01 | `01-repo-philosophy-sync.md` | "sync the repo", "update repo to match", "align repo with philosophy" | Sync global doctrine into a repo — read changed doctrine, scan for gaps, update docs/configs/tests |
| 02 | `02-docs-compression.md` | "compress docs", "clean up docs", "docs are too verbose" | Compress documentation while preserving decisions, commands, warnings, TODOs |
| 03 | `03-markdown-todo-sweep.md` | "find all TODOs", "sweep for unchecked", "what's deferred" | Find all TODOs/FIXMEs/unchecked boxes in markdown files |
| 04 | `04-prompt-distiller.md` | "extract this into a prompt", "make this a saved prompt", "distill these instructions" | Extract repeated instructions into better, reusable prompts |
| 05 | `05-architecture-drift-audit.md` | "check for drift", "audit architecture", "compare docs to code" | Audit repo vs declared architecture — compare docs to code |
| 06 | `06-test-repair-loop.md` | "fix the tests", "repair CI", "tests are failing" | TDD-based repair cycle — failing tests to green |
| 07 | `07-research-to-stack-decision.md` | "research the best", "evaluate X vs Y", "make a stack decision" | Convert research into repo doctrine — evaluate and decide |
| 08 | `08-repo-cleanup-pass.md` | "clean up the repo", "remove stale patterns", "consolidate decisions" | General repo cleanup — stale patterns, orphaned configs, consolidation |
| 09 | `09-skill-retrospective.md` | "review my skills", "what skills need updating", "skill audit" | Run a skill retrospective — audit health, gaps, and drift |
| 10 | `10-release-readiness-review.md` | "is this ready to ship", "release readiness", "pre-launch review" | Pre-release checklist — verify everything before shipping |

---

## Maintenance

- **Add a prompt**: create `<NN>-<kebab-name>.md`, add entry to this index, update `## Prompts` table.
- **Remove a prompt**: archive the file to `.archive/`, remove entry from index.
- **Update a prompt**: edit the file, update `## Last updated` date, keep format.
- **All prompts must**: have a title, trigger phrases, when-to-use/when-not-to-use, full reusable prompt, expected outputs, verification checklist, related skills, and last-updated date.

## Last updated

2026-06-30
