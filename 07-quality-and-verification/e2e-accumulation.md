---
name: "E2E Test Accumulation"
version: "2.0.0"
updated: "2026-04-23"
description: "Append-only parallel journey chunks. Each feature = new spec file ≤30s. Cross-page nav via clicks. 100% feature coverage matrix. Never delete tests. Playwright v1.56 Healer auto-fixes broken tests."
---

# E2E Accumulation

## Rules
Tests append-only, never deleted. Removed features→skip+comment. Each feature area = own spec file (`e2e/journeys/{feature}.spec.ts`). All files run parallel (4 workers). Each ≤30s — split at navigation boundary when exceeded. Cross-page nav via UI clicks within each chunk, never `page.goto()` for internal routes. Shared `loginAsTestUser(page)` helper logs in via clicks. New feature = new file, existing files untouched.

## Structure
```
e2e/journeys/
  discovery.spec.ts  — homepage, nav, footer, SEO, a11y
  auth.spec.ts       — signup, login, logout, profile, session
  crud.spec.ts       — create, edit, list, delete core entity
  billing.spec.ts    — pricing, checkout, subscription status
  {feature}.spec.ts  — login → navigate via clicks → test → ≤30s
e2e/helpers/
  auth.ts            — loginAsTestUser(page), shared across chunks
```

## Config
`fullyParallel:true|workers:4|timeout:30000|retries:1|projects:[chromium,mobile]`

## Coverage Matrix (in SPEC.md)
Every feature row must have: journey chunk, edge case spec, error states, mobile viewport. No feature ships without all four. completeness-checker agent verifies.

## Math
10 features × 30s ÷ 4 workers = ~75s total. Scales linearly with features, not time.
