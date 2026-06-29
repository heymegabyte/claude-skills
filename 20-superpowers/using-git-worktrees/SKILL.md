---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback
---

# Using Git Worktrees

Ensure work runs in an isolated workspace. Detect existing isolation first, then prefer the harness's native worktree tool, then fall back to `git worktree`. Never fight the harness.

Pairs with `[[main-only-branch]]` — `main` always committed, worktrees for isolation. The harness ships native worktree tools (`EnterWorktree`/`ExitWorktree`); use them over raw git.

Announce: "Using the using-git-worktrees skill to set up an isolated workspace."

## Step 0 — detect existing isolation

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` is ALSO true in a submodule. Guard: `git rev-parse --show-superproject-working-tree` returns a path → you're in a submodule, treat as a normal repo.
- `GIT_DIR != GIT_COMMON` (not submodule) → already in a linked worktree. Skip to Step 2; do NOT nest another. Report the path + branch (note if detached HEAD — branch creation deferred to finish time).
- `GIT_DIR == GIT_COMMON` → normal checkout. If no worktree preference is declared in instructions, ask consent before creating one; honor a declared preference silently; if declined, work in place → Step 2.

## Step 1 — create the workspace

1. **Native `EnterWorktree` tool (the default)** — call it first, always. It owns placement, branch, and cleanup; passing `name` creates, passing `path` switches into an existing one. On exit, `ExitWorktree` with `action: "remove"` or `"keep"`. Never mix with raw `git worktree add` — that creates phantom state the native tool can't see.
2. **Git fallback (only if no native tool):**
   - Directory priority: declared instruction preference > existing `.worktrees/` (wins over `worktrees/`) > default `.worktrees/`.
   - Verify ignored before creating: `git check-ignore -q .worktrees`. If not ignored, add to `.gitignore` + commit first — else worktree contents get tracked.
   - `git worktree add "$LOCATION/$BRANCH_NAME" -b "$BRANCH_NAME" && cd "$_"`.
   - Permission/sandbox denial on add → tell the user, work in place, run setup + baseline there.

## Step 2 — setup + baseline

- Auto-detect and install: `package.json`→`npm install`, `Cargo.toml`→`cargo build`, `requirements.txt`→`pip install -r`, `pyproject.toml`→`poetry install`, `go.mod`→`go mod download`.
- Run the project test suite to confirm a clean baseline. Tests fail → report + ask before proceeding (can't tell new bugs from pre-existing). Tests pass → report ready: path, test count, feature.

## See

- `[[main-only-branch]]` — worktrees for isolation, main always committed
- `finishing-a-development-branch` — merge/PR/cleanup when work is done

<!-- budget: ~43 -->
