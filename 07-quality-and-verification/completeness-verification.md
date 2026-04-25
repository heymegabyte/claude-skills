---
name: "Completeness Verification"
version: "2.0.0"
updated: "2026-04-23"
description: "AI-powered visual inspection loop across every page/breakpoint/state until GPT-4o finds zero issues. Done detector that prevents premature completion. 5-pass protocol."
related: visual-inspection-loop.md (3-round per-page), ui-completeness-sweep.md (pre-done placeholder detection)
---

# Completeness Verification Loop

**A project is NOT complete until vision AI examines every page and finds nothing to improve.**

## The Loop (max 3 iterations, $5 budget cap)
```
REPEAT {
  1. Enumerate all routes
  2. For each route:
     a. Playwright MCP a11y tree snapshot (FREE — preferred for functional/a11y)
     b. axe-core scan (FREE — catches 57% of WCAG issues)
     c. Screenshot at 2 key breakpoints (375, 1280) — detail:low (85 tokens)
     d. GPT-4o vision ONLY for aesthetic issues a11y tree can't catch
     e. Parse recommendations -> actionable items
  3. Implement ALL recommendations
  4. Re-check changed pages (a11y tree first, vision only if aesthetic)
  5. New issues -> CONTINUE. Zero issues -> mark VERIFIED.
} UNTIL all routes VERIFIED OR 3 iterations complete OR $5 spent
```

**Cost discipline:** a11y tree is FREE and catches layout/functional/a11y issues. GPT-4o vision ONLY for: color harmony, visual hierarchy, brand consistency, "does it look good?" — things pixels reveal that DOM can't. Never send 6 breakpoints to GPT-4o when 2 (mobile+desktop) suffice for aesthetic checks.

## Vision Analysis Prompt
Categories: LAYOUT, TYPOGRAPHY, COLOR, CONTENT, INTERACTION, ACCESSIBILITY, POLISH, COMPLETENESS
Per issue: Category, Severity (critical/major/minor/cosmetic), Location, Fix (specific CSS/HTML)
Production ready: `{"status": "verified", "issues": []}`
Needs work: `{"status": "needs_fixes", "issues": [...]}`

## Provider Priority
1. Playwright MCP a11y tree (FREE — functional, a11y, layout structure)
2. axe-core via Playwright (FREE — WCAG violations)
3. OpenAI GPT-4o detail:low (aesthetic-only, $0.01/shot — 2 breakpoints max)
4. Anthropic Claude vision (fallback when GPT-4o fails/rate-limited)
Vision is the LAST resort, not the first. A11y tree catches 80% of issues at zero cost.

## Breakpoints
```typescript
const BREAKPOINTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Landscape', width: 1024, height: 768 },
  { name: 'Laptop', width: 1280, height: 720 },
  { name: 'Desktop', width: 1920, height: 1080 },
];
```

## Convergence Criteria
1. Every route screenshotted at all 6 breakpoints
2. GPT-4o returns `"verified"` for EVERY screenshot
3. All E2E tests pass
4. No new issues in last complete iteration
5. Human reviewer hasn't flagged additional issues
6. **Zero Recommendations Gate:** When asked "How can I improve this more?" AI genuinely has no recommendations. If it does -> implement -> re-verify -> re-ask. Loop stops when AI's critical judgment says "genuinely complete."

## 5-Pass Verification Protocol (ALL must pass)

### Pass 1: Functional
Every route 200, forms submit correctly, interactive elements respond, API returns valid Zod shape, E2E green.

### Pass 2: Visual
AI screenshot critique at 1280+375px finds zero layout issues, no overflow/overlap, typography hierarchy clear, brand consistent. Passes "agency test."

### Pass 3: Content
Zero placeholder text (Lorem/TBD/TODO/"coming soon"/sample data), copy specific to product, microcopy complete (labels, empty states, errors, tooltips), alt text on all images, Flesch >= 60.

### Pass 4: Technical
Lighthouse Perf >= 90, LCP <2.5s, INP <200ms, CLS <0.1, SEO (title+meta+H1+canonical+JSON-LD+OG), a11y (skip link, ARIA, focus rings, 4.5:1, axe-core clean), security (CSP, Zod, no eval/innerHTML).

### Pass 5: Business & Psychology
Serves actual user need, clear conversion path (CTA visible, value above fold), Peak-End Rule satisfied, social proof present, ethical persuasion only.

**Failure protocol:** Fix -> re-deploy -> re-run failed pass + all subsequent passes. Never skip.

## Cost (***HARD CAP $5***)
A11y tree + axe-core: FREE. GPT-4o vision (2 breakpoints × detail:low): ~$0.02/route/iteration.
Max 3 iterations. 10 routes × 2bp × $0.02 × 3 = ~$1.20. Budget ceiling: $5 absolute max.
Previous uncapped approach ($24/run) burned $100 in 9 hours — NEVER again.

## Trigger Conditions
User says "verify"/"check everything"/"is it done?", after deploy, after design changes affecting multiple pages.

## Anti-Patterns
- DO NOT skip breakpoints
- DO NOT mark verified without GPT-4o analysis
- DO NOT implement fixes without re-verifying
- DO NOT use GPT-4o for code generation (Claude for that)
- DO NOT stop because "it's probably fine"
