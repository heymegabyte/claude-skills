# Main-Only Branch

`main` (or `master`) is committed to always. Always. Period. No long-lived dev branches, no release branches, no `develop` branch, no feature branches that live longer than a single agent session. Worktrees handle isolation when parallel work needs it. The commit IS the unit of progress; `main` IS the source of truth.

Pairs with `ai-seniority` § auto-merge — agent diffs that clear the gates land on `main` directly. No PR queue, no merge ceremony.

## The doctrine
- **`main` is the only long-lived branch.** Commits go straight to `main` once they pass the gates per `verification-loop` + `ai-seniority` auto-merge contract.
- **No dev branches.** No `develop`, no `staging`, no `release/v1.2`. No mobile-team-cuts-a-release-branch ceremony per `no-staging-doctrine`.
- **Worktrees > branches for parallel work.** When multiple agents need isolation, spawn worktrees per `full-autonomy` § sub-agent isolation (`isolation: "worktree"` on Agent calls). Worktrees give independent working copies without the merge-ceremony cost of long-lived branches.
- **Conventional commits IS the PR description.** `feat(scope): summary` + 1-3 body lines explaining the why. The changelog-generator agent + auto-generated GitHub Releases handle the rest. No multi-paragraph PR descriptions.
- **Commit + push the same turn.** Side repos (agentskills, saas-starter, plugins, tools, template repo) auto-commit + push to main per `brian-preferences` § Git policy. Emdash projects commit freely; Brian pushes from frontend/PR per his own policy — that's the one carve-out from this rule.

## Worktree pattern (parallel work without branches)
- Agent A working on `libs/features/donations_engine/` + Agent B working on `libs/features/voice_agent/` = two worktrees, both branched from `main`, both auto-merge to `main` when their gates pass.
- Conflict resolution: rebase the later worktree onto the merged-first one. No merge commits, linear history.
- Worktree cleanup is automatic when the agent produces no changes; when changes land, the worktree merges + the branch ref deletes.

## What this kills
- ❌ "Let's open a PR and tag the team for review" — there's no team. The gates ARE the review per `ai-seniority`.
- ❌ `git flow init` and the `develop` → `release/*` → `main` ceremony.
- ❌ "Feature branch for the dashboard rewrite" living three weeks. Worktree it, ship in passes per `06-build-and-slice-loop`.
- ❌ Squash-merge ceremony — conventional commits + linear history.
- ❌ Rebase wars — worktrees prevent the conflict surface that triggers them.
- ❌ Multi-paragraph PR descriptions explaining WHAT changed — the commits explain WHAT, the CHANGELOG explains WHY for downstream consumers.

## What this preserves
- **`autonomous-engineering` approval gates** still apply — destructive/customer-impacting changes still pause for Brian even when going straight to `main`.
- **`verification-loop` deploy + prod-E2E mandate** still fires post-merge to `main`. Auto-deploy after auto-merge per `no-staging-doctrine`.
- **GitHub Releases + CHANGELOG** still get generated — by the changelog-generator agent on every release tag, not by hand.

## See
- `solo-builder-doctrine` — umbrella
- `ai-seniority` — auto-merge gate that makes main-only safe
- `verification-loop` — post-merge prod-E2E mandate
- `no-staging-doctrine` — `main` IS prod for purposes of the rollback playbook
- `full-autonomy` § sub-agent isolation — worktree pattern
- `brian-preferences` § Git policy — side repos auto-push, emdash projects user-pushed (the one carve-out)
- `06-build-and-slice-loop` — vertical-slice shipping cadence
