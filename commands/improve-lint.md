---
name: improve-lint
description: Run the AI-augmented lint self-improvement loop on the current project. Scans `.lint-history/` for recurring violation patterns (≥3 hits in 30d window), drafts a Claude-ready prompt to author a new semgrep rule for the top candidate, and surfaces the proposal under `.lint-history/proposals/<ts>.md`. Non-blocking analysis. See rules/lint-doctrine.md § Self-improving.
argument-hint: "[project-dir]"
user-invocable: true
---

# /improve-lint

Closes the self-improvement loop on the project's lint output. Captures patterns that recur, surfaces them as draft semgrep rule candidates for codification.

## What it does

1. Scans `.lint-history/*.log` from the last 30 days
2. Clusters violations by rule-id (ESLint / sonarjs / semgrep / unicorn / @typescript-eslint / etc.)
3. For patterns with ≥3 hits in the window, writes a proposal to `.lint-history/proposals/proposal-<ts>.md`
4. The proposal contains a Claude-ready prompt that drafts the YAML rule + cross-link narrative

## Output shape

```text
▸ Scanning lint history (last 30d)
  ✓ N log file(s) in window
▸ Clustering violations by rule-id
  · 6x unicorn/prefer-node-protocol
  · 6x @typescript-eslint/no-explicit-any
▸ Drafting proposal(s)
  ✓ Proposal written: .lint-history/proposals/proposal-<ts>.md
```

## After proposal lands

1. Read the proposal
2. Paste the Claude-ready prompt into a new conversation (or invoke `claude` inline)
3. AI drafts the semgrep YAML at `~/.agentskills/templates/lint-stack/semgrep-custom/<topic>.yml`
4. Cross-link from owning domain rule (`code-style.md`, `rxjs-first-angular.md`, etc.)
5. Append a row to `rules/lint-doctrine.md` § "Codified incidents"
6. Commit + push agentskills (auto per `main-only-branch` + `brian-preferences` git policy)
7. Distribute: next `install-lint-stack.sh` pulls the new rule into every project

## Invocation

```bash
bash ~/.agentskills/bin/lint-auto-improve.sh             # current dir
bash ~/.agentskills/bin/lint-auto-improve.sh /path/to/X  # named dir
# OR via npm script (added by install-lint-stack)
npm run lint:improve
```

## See

- `rules/lint-doctrine.md` § Self-improving
- `templates/lint-stack/semgrep-custom/`
- `rules/prompt-as-training-signal.md` §6
