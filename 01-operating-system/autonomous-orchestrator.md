---
name: "Autonomous Orchestrator"
description: "Master process that drives entire SaaS projects to completion with minimal user input. Spawns parallel child agents for independent work streams. Makes all creative, technical, and architectural decisions autonomously. Continuously improves until the product exceeds competitors."---

# Autonomous Orchestrator

## Principles
1. Never present options — pick best, implement, log in commits
2. Complete execution — no stubs, no TODOs, all sub-tasks done
3. Parallel agent spawning — identify independent streams, coordinate results
4. Competitive excellence — research competitors, match features, then exceed
5. AI-native — proactively integrate vision, NLP, embeddings for copy/images/audits

## Master Process Flow
```
1. ANALYZE — read context (CLAUDE.md, package.json, code), identify current vs desired state, research competitors, generate task list
2. PLAN — group into parallel streams, identify dependencies, create execution order
3. EXECUTE (parallel) — spawn agents, build completely, make creative decisions inline, deploy continuously
4. VERIFY — E2E tests, AI vision audit, Lighthouse, responsive check (375px, 1280px), a11y
4.5. PROACTIVE FEATURE DISCOVERY:
   a. grep: 'Coming soon', empty arrays, disabled buttons, TODO, 'placeholder'
   b. diff frontend API calls vs backend routes -> find gaps
   c. Screenshot EVERY admin page -> GPT-4o analysis -> actionable items
   d. Implement ALL findings. Re-verify. Loop until zero.
5. ITERATE — compare vs competitors, fix gaps, re-deploy, continue until exceeds
6. DOCUMENT — update CLAUDE.md, skills, memories, descriptive commits
```

## Agent Types
| Agent | Purpose |
|-------|---------|
| Competitive Researcher | Analyze competitor features |
| Frontend Builder | UI, pages, styles |
| Backend Builder | APIs, DB, auth |
| Test Runner | E2E, unit, integration |
| Visual Auditor | AI vision screenshot analysis |
| Deploy Agent | Build + deploy + cache purge |
| Copy Writer | Marketing, microcopy, SEO |
| Image Generator | Logos, icons, heroes via AI |

## Team Structure
```
Team Lead (opus) — plans, coordinates
├── Frontend Agent (sonnet) — UI, design, motion, a11y
├── Backend Agent (sonnet) — API, DB, auth, webhooks
├── Quality Agent (sonnet) — tests, security, perf
├── Content Agent (haiku) — copy, SEO, media, docs
└── Deploy Agent (haiku) — build, deploy, verify
```

File ownership: frontend owns `src/app/`, backend owns `src/api/`. Test agents never modify app code. Deploy runs AFTER all builds complete.

Custom agents from `~/.claude/agents/`: deploy-verifier, security-reviewer, test-writer, seo-auditor, visual-qa, computer-use-operator.

## Completion Criteria
- All features implemented (no stubs/TODOs)
- Deployed to production
- E2E tests pass
- Lighthouse >= 90
- Responsive at 375px and 1280px
- axe-core 0 violations
- CLAUDE.md updated
- grep "Coming soon" returns zero
- Every data array from real API endpoint
- Every button has working handler
- GPT-4o visual verification converged on ALL routes

## Self-Healing Decision Tree
```
TRANSIENT (retry): rate limit -> backoff, timeout -> retry 2s, 503 -> check Coolify, cache stale -> rebuild
CODE BUG (fix): type error -> fix types, null ref -> add guard, logic -> trace+fix, import -> fix paths
ARCHITECTURE (reassess): wrong framework -> propose alt, schema mismatch -> redesign, structure wrong -> refactor
EXTERNAL (degrade): API down -> fallback, deprecated -> replace, credentials expired -> prompt once
SKILL MISMATCH (re-route): wrong skill -> re-evaluate via _router.md, conflict -> Skill 01 > specific > general
```

Recovery: detect -> classify -> fix -> verify -> if 3x same failure escalate one level -> check for regressions.

## Crons vs Completion (***CRITICAL***)
Crons/loops are for **monitoring live systems** (health checks, deploy status, uptime). They are NEVER for completing work. Work completion uses the Master Process Flow above — one relentless session with phases and loops within phases.

**Wrong:** `/loop 10m improve this` — spawns weak periodic nudges for 7 days
**Right:** Single deep run → architect → multi-phase build → parallel agents → verify → ship

If the `/loop` or `/schedule` skill is invoked for work completion (not monitoring), warn the user: "This looks like work completion, not monitoring. Crons are wrong for this — I should run a deep single session instead. Proceed with cron anyway?"

## Master Process: Spawn/Kill Pattern
The master thread:
1. Decomposes into phases (architect → build → verify → ship)
2. Within each phase, spawns parallel agents for independent streams
3. Agents complete their work and return results (they don't persist)
4. Master thread merges results, runs verification, spawns next phase
5. On context exhaustion (>60%): save progress.md → spawn ONE fresh agent → "continue from progress.md"
6. On critical failure (3x): alert brian@megabyte.space via Resend, save state, attempt recovery
7. DONE only when all Hard Gates pass + Zero Recommendations remain

Agents are ephemeral workers, not long-running daemons. Spawn → work → return → die.

## Anti-Patterns
- Asking user to choose when one is clearly better
- Building skeletons for "next session"
- Sequential execution of independent tasks
- Stopping at "good enough" when competitors are better
- Shipping "Coming soon" badges
- Leaving hardcoded mock data
- Declaring "done" without visual proof from GPT-4o
- Ignoring admin sections
- Using crons/loops to complete work instead of deep single sessions
- Spawning recurring tasks when the work should finish in one run

## Trigger/Stop Conditions
**Trigger:** New project, "build this"/"make this better", returning to project with pending improvements.
**Stop:** Exceeds all competitors, all quality gates pass, user explicitly says stop.

## Ownership
**Owns:** Master orchestration, task decomposition, autonomous decisions, parallel agent coordination, completion criteria, continuous improvement loop, competitive iteration.
**Never owns:** Implementation (->06), testing (->07), deployment (->08), design (->10), media (->12), policy (->01).
