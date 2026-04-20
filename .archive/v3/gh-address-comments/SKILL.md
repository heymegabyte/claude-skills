---
name: gh-address-comments
description: "Address review comments on GitHub PRs using gh CLI. Fetches all comments, summarizes required fixes, applies selected changes, runs tests, and pushes. Handles auth issues, rate limits, and thread resolution automatically."
metadata:
  short-description: Address PR review comments systematically
---

# PR Comment Handler

Systematically address review comments on the open GitHub PR for the current branch.

## Prerequisites

```bash
# Verify gh is authenticated
gh auth status
# If not: gh auth login (select GitHub.com, HTTPS, browser)
```

## Workflow

### 1. Find the PR and fetch all comments

```bash
# Get current branch's PR
gh pr view --json number,title,url,reviewDecision,comments,reviews

# Fetch all review threads
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate
```

### 2. Categorize and summarize

For each comment/thread, determine:
- **Blocking** — requested changes that must be addressed before merge
- **Suggestion** — optional improvements (apply if quick, skip if complex)
- **Nitpick** — style/formatting (batch-fix all at once)
- **Question** — needs a reply, not a code change
- **Resolved** — already addressed, just needs thread resolution

Present numbered list to user:
```
1. [BLOCKING] src/auth.ts:42 — "Add rate limiting to login endpoint"
2. [SUGGESTION] src/api.ts:15 — "Consider using Zod for validation"
3. [NITPICK] src/utils.ts:8 — "Rename `fn` to `formatName`"
4. [QUESTION] README.md:20 — "Why not use D1 instead of KV?"
```

### 3. Apply fixes

For each selected comment:
1. Read the file at the mentioned line
2. Understand the reviewer's intent
3. Make the change
4. Run `npx tsc --noEmit` to verify no type errors
5. Run tests if they exist
6. Resolve the thread via API if possible

### 4. Push and respond

```bash
git add -A
git commit -m "Address PR review comments

- [list each fix]

Co-Authored-By: Claude Code <noreply@anthropic.com>"
git push
```

### 5. Reply to questions

For comment threads that are questions (not code changes):
```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments/{id}/replies \
  -f body="[your response]"
```

## Common Patterns

**Reviewer asks for tests:** Write them immediately. Don't push back.
**Reviewer asks for docs:** Add JSDoc/TypeDoc. Don't argue.
**Reviewer suggests refactor:** If < 5 min, do it. If > 5 min, reply explaining the tradeoff.
**Rate limit hit:** Wait 60s and retry. If persistent, ask user to re-authenticate.

## Quick Reference

```bash
# List all open PRs
gh pr list

# View PR diff
gh pr diff

# Check CI status
gh pr checks

# Merge after approval
gh pr merge --squash --delete-branch
```
