---
description: Generate a Project Requirements Plan (PRP) — research-driven, ULTRATHINK-gated, confidence-scored implementation blueprint
argument-hint: <feature-name-or-path-to-brief>
allowed-tools: Read, Bash, Glob, Grep, WebFetch, WebSearch, Agent, Write, Edit
model: claude-opus-4-7
---

ULTRATHINK before responding. The user wants a PRP (Project Requirements Plan) for: $ARGUMENTS

## Phase 1 — Research (parallel agents)

Spawn parallel research agents per `[[monitor-orchestration]]` § Parallel-agent playbook:

- **codebase-explorer** — `grep`/`glob` existing patterns related to the feature; identify reusable seams
- **convention-extractor** — extract project conventions from `CLAUDE.md`, `rules/`, recent commits (`git log --oneline -50`)
- **competitor-scanner** — WebFetch 3-5 similar features in well-known CF/Hono/Drizzle projects
- **doc-fetcher** — Use Context7 or WebFetch to pull current library docs (Hono, Drizzle, shadcn/ui, CF Workers AI, etc.)

Fold their outputs into `PRPs/{feature-slug}.md` with these sections:

```markdown
# PRP: {feature}
## Confidence: X/10 (10 = ready to execute one-shot; <7 = needs more research)

## Goal
1-paragraph user-outcome description.

## Why (business value)
- Bullet 1
- Bullet 2

## What (concrete deliverables)
- File: `apps/web/src/...` — what changes
- Route: `POST /api/...` — what it does

## Context
### Existing patterns (from codebase)
- `apps/web/src/foo.ts:42` — reuse this shape
- `rules/hono-api.md` — adhere to this convention

### External libraries
- `@hono/zod-openapi` — schema-first API (link to docs)
- `drizzle-orm/d1` — D1 adapter (link)

### Gotchas (researched)
- Cloudflare Workers limits: 128MB memory, 30s CPU on standard plan
- D1 batch limit: 100 statements
- Vectorize index dimensions must match embedding model exactly

## Implementation blueprint
### Files to create
- `apps/web/src/feature/foo.ts`
- `e2e/feature/foo.spec.ts` (Playwright — written FIRST per `[[verification-loop]]`)

### Files to modify
- `apps/web/src/router.ts` — add route

### Validation gates (in order)
1. **TDD**: `e2e/feature/foo.spec.ts` written + failing
2. **Implement**: minimum code to make spec pass
3. **Typecheck**: `tsc --noEmit` clean
4. **Lint**: `oxlint && eslint --fix` clean
5. **Deploy**: `wrangler deploy` to PROD
6. **Prod E2E**: `npx playwright test --config=playwright.prod.config.ts`
7. **AI vision QA**: ≥9/10 per `[[always]]` § new-section
8. **A11y**: axe-core 0 violations at 6 breakpoints

## Anti-patterns to avoid
- Don't add new packages without a real demand
- Don't introduce a new state library / framework / auth flow without explicit user ask
- Don't hand-roll auth — use Clerk or Better Auth per `[[code-style]]`
- Don't `page.goto()` for internal nav in E2E — click through UI

## Score breakdown
- Codebase research coverage: X/10
- External library currency: X/10
- Gotchas surfaced: X/10
- Validation gates concrete: X/10
- **Overall**: X/10

If overall < 7, this PRP needs more research before `/execute-prp` should fire.
```

## Phase 2 — Output

Write the PRP to `PRPs/{slug}.md` (create `PRPs/` dir if missing). Then return:

1. Path to the PRP file
2. Confidence score
3. Top 3 risks the executor should know
4. Suggested next command: `/execute-prp PRPs/{slug}.md` (or "re-research" if score <7)

## See also

- `[[monitor-orchestration]]` — parallel-agent fan-out for research
- `[[verification-loop]]` — deploy + prod-E2E mandate
- `[[always]]` — every page/site/form requirements
- `[[autonomous-engineering]]` — when to ship vs ask
- `[[brian-preferences]]` — pick ONE, never options, just do it
