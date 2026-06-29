---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

Integrate finished work: verify → detect environment → choose integration → execute → clean up.

Under `[[no-staging-doctrine]]` + `[[main-only-branch]]` the default is **merge to `main` + auto-push** — diffs clearing all gates auto-merge. Don't offer "keep the branch as-is, handle it later"; finish the work this turn. PR only when a human review is explicitly wanted.

Announce: "Using the finishing-a-development-branch skill to complete this work."

## Step 1 — gate before integrating

- Run the project test suite. Failures block — show them, fix first, do NOT integrate broken code.
- Full deploy + prod-E2E gate is `[[verification-loop]]` — local green ≠ done.

## Step 2 — detect environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

- `GIT_DIR == GIT_COMMON` → normal repo, no worktree cleanup.
- `GIT_DIR != GIT_COMMON`, named branch → worktree, provenance-based cleanup (Step 4).
- Detached HEAD → externally managed; no local-merge, no cleanup (push-as-branch or discard only).
- Base branch: `git merge-base HEAD main || git merge-base HEAD master`, or confirm with the user.

## Step 3 — integrate

- **Merge to base (default).** `cd` to main repo root first (CWD safety), merge, re-run tests on the merged result, then Step 4 cleanup, then `git branch -d`. Always auto-push the merged base.

  ```bash
  MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel); cd "$MAIN_ROOT"
  git checkout <base> && git pull && git merge <feature> && <test cmd> && git push
  ```

- **PR (review wanted).** `git push -u origin <feature>`. Do NOT clean up the worktree — it's needed to iterate on feedback.
- **Discard (abandon).** Require a typed `discard` confirmation listing branch + commits + worktree path. Then `cd` to main root, Step 4 cleanup, `git branch -D <feature>`.

## Step 4 — cleanup (merge + discard only; PR preserves the worktree)

```bash
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

- Normal repo (`GIT_DIR == GIT_COMMON`) → nothing to remove.
- Worktree under `.worktrees/` or `worktrees/` → we own it. From main root (never from inside the worktree): `git worktree remove "$WORKTREE_PATH" && git worktree prune`.
- Anywhere else → harness-owned; use its exit tool (`ExitWorktree`) or leave in place. Never remove a worktree you didn't create.

## Ordering invariants (why the sequence is fixed)

- Merge BEFORE removing the worktree — `git branch -d` fails while a worktree references the branch.
- `cd` to main root BEFORE `git worktree remove` — fails silently when CWD is inside the target.
- `git worktree prune` after removal self-heals stale registrations.

## See

- `[[no-staging-doctrine]]` · `[[main-only-branch]]` · `[[verification-loop]]`
- `using-git-worktrees` — the isolation setup this finishes
