---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch a reviewer subagent on completed work. Feed it crafted context (description + requirements + git range) — never your session history. Keeps the reviewer on the work product and preserves your own context.

**Review early, review often.**

Brian's stack already ships a purpose-built `code-reviewer` agent + the **Agent Diversity Review gate** (`[[agent-selection]]`). Prefer the named agent over a bare `general-purpose` spawn; this skill is the request protocol that complements both.

## When to request

Mandatory:

1. Before merge to main
2. After each task in subagent-driven development
3. After completing a major feature

Optional: when stuck (fresh eyes), before a refactor (baseline), after a complex bugfix.

## How to request

1. Get SHAs — `BASE_SHA=$(git rev-parse origin/main)`, `HEAD_SHA=$(git rev-parse HEAD)`.
2. Spawn the `code-reviewer` agent (or `general-purpose` filling [code-reviewer.md](code-reviewer.md)).
3. Fill placeholders: `{DESCRIPTION}` (what you built), `{PLAN_OR_REQUIREMENTS}` (what it should do), `{BASE_SHA}`, `{HEAD_SHA}`.

## Act on feedback

1. Fix Critical immediately; fix Important before proceeding.
2. Note Minor for later.
3. Push back with technical reasoning if the reviewer is wrong — see `[[receiving-code-review]]`.

## Never

- Skip review because "it's simple".
- Ignore Critical, or proceed with unfixed Important.
- Argue with valid technical feedback.
