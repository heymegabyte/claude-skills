---
name: "principles-incident-log"
priority: 2
pack: "core"
triggers:
  - "missed principles"
  - "principles incident log"
  - "foundational gaps"
  - "missing rules"
  - "principle audit"
paths:
  - "concern:observability"
---

# Principles Incident Log

Audit of principles absent from Brian's plugin as of 2026-06-18 — and the incidents that surfaced each gap. These are not edge cases — they are load-bearing engineering habits whose absence produces predictable failure modes. Each entry: principle + 2-3 sentence rationale + `[[cross-links]]` + ship-as-standalone-rule verdict + reference incident where applicable.

---

## 1. One-Way vs Two-Way Doors (Reversibility-First Decision Making)

Before ANY architectural decision, classify it: **two-way door** (reversible within a sprint — schema add, new feature flag, new route) or **one-way door** (irreversible or painful to undo — DB engine switch, auth provider migration, public API surface, GDPR data model). Two-way doors ship autonomously; one-way doors get a 5-minute written self-argument before proceeding. The cost of slowing down on two-way doors is wasted caution; the cost of not slowing down on one-way doors is weeks of repair.

Concretely: adding a D1 column is two-way. Dropping one is one-way. Picking Clerk over Auth0 is one-way (migration cost). Picking a new Workers route pattern is two-way.

- **[[autonomous-engineering]]** — approval tiers already exist; this principle names the underlying reason
- **[[no-staging-doctrine]]** — prod-only means one-way door mistakes hurt real users immediately
- **[[drift-detection]]** — one-way doors that weren't recognized become the hardest drift to unwind
- Ship as standalone rule? **Y**

---

## 2. State Is the Enemy — Push to DOs or Eliminate

Stateful code in Workers is the #1 source of scaling and correctness bugs. Every `let` at module scope, every in-memory cache, every request-context accumulator that leaks across requests is a bug waiting to manifest under concurrency. The rule: if something must persist across requests, it lives in a Durable Object, D1, KV, or R2 — never in Worker memory. If it doesn't need to persist, eliminate it entirely (compute on demand, cache at the CDN layer).

Durable Objects are the correct primitive for per-tenant state, websocket sessions, rate limiters, and distributed locks — not Redis, not a singleton Worker. Workers are stateless functions; treat them that way.

- **[[cloudflare-lock-in-is-leverage]]** — DOs are the CF primitive for stateful edge computation
- **[[cf-agents-do-pattern]]** — established DO pattern for agent sessions
- **[[cf-do-rate-limiter]]** — rate limiting as a stateless-first DO pattern
- **[[zod-everywhere]]** — stateless = all state shape validated at every boundary
- Ship as standalone rule? **Y**

---

## 3. Production Observability Default-On (Every Worker Ships Telemetry from Line 1)

The only acceptable moment to add observability is BEFORE the first deploy. Retrofitting PostHog, OTLP traces, and Sentry to an existing Worker costs 4–8× more than including them in the initial scaffold. Every new Worker (marketing, API, cron, queue consumer) ships with: `posthog.capture` on every significant action, `console.log` structured JSON with `{level, traceId, workerId}`, OTLP trace spans via `workers-tracing-otlp`, and Sentry `@sentry/cloudflare` for unhandled exceptions.

Observability is not a feature you add when something breaks. It is the minimum viable product.

- **[[workers-tracing-otlp]]** — OTLP trace setup for Workers
- **[[analytics-configuration]]** — PostHog init patterns
- **[[sentry-alert-rules]]** — Sentry error thresholds
- **[[feature-flags]]** — flags without observability on the flag evaluation path are blind
- Ship as standalone rule? **Y**

---

## 4. Cost-Per-Request Accountability

Every feature carries an explicit cost estimate before it ships: D1 reads/writes per request, KV ops, R2 GETs, Durable Object activations, AI Gateway tokens, Inngest/Workflows steps. Total ≤ $0.001/request for free-tier features; document the ceiling for paid features. When a new background job, AI call, or queue consumer is added, the cost reasoning is written inline as a comment: `// ~$0.002/run × 10k/day = ~$20/month`.

No feature ships without someone having done the napkin math. CF free tier is generous but not infinite — a naive cron that queries D1 on every request can exhaust the free tier in hours.

- **[[cloudflare-lock-in-is-leverage]]** — CF billing model (req-based, not server-based)
- **[[solo-builder-doctrine]]** — solo builder; no FinOps team to catch runaway spend
- **[[background-jobs-and-workflows]]** — Inngest/Workflows step billing model
- **[[cf-2026-updates]]** — pricing updates as of 2026
- Ship as standalone rule? **Y**

---

## 5. Fail Fast in Build, Fail Soft in Prod

Different error philosophies per environment. In **build/CI**: throw hard, fail loudly, block the deploy on any schema mismatch, type error, lint violation, or failing test. In **production**: never throw a 500 to a user when a 200 with a graceful degradation is possible. Cache stale data rather than erroring; show a disabled UI element rather than crashing the page; queue a failed job for retry rather than surfacing the stack trace.

Concretely: `zod.parse()` in build/test scripts; `zod.safeParse()` with fallback in production request handlers. `throw` in Vitest; `return new Response('Degraded', {status: 200, headers: {'X-Degraded': '1'}})` in Workers when a non-critical service is down.

- **[[error-recovery]]** — recovery patterns and retry logic
- **[[zod-everywhere]]** — `parse` vs `safeParse` distinction
- **[[verification-loop]]** — build-time failure gates
- **[[no-staging-doctrine]]** — prod is the only env, so prod error policy matters more
- Ship as standalone rule? **Y**

---

## 6. Sync UI, Async Backing (Optimistic UI + Queue Truth)

The UI always responds immediately. The backing store catches up asynchronously. When a user clicks "Save", the UI optimistically updates and returns 200; the actual D1 write, queue publish, or Inngest event fires in `ctx.waitUntil()`. If the background work fails, it retries — the user is never made to wait for it.

This pattern eliminates the perceived latency of D1 writes (20–80ms) and queue publishes (10–30ms) from the critical path. It also means every mutating action needs an idempotency key (UUID from the client) to survive retries safely.

- **[[background-jobs-and-workflows]]** — Inngest retry patterns
- **[[hono-api]]** — `ctx.waitUntil()` pattern in Hono handlers
- **[[fetch-defaults]]** — idempotency key header convention
- **[[event-sourced-build-progress]]** — event sourcing as the truth layer
- Ship as standalone rule? **Y**

---

## 7. Vendor Risk Tiering (Load-Bearing vs Replaceable)

Every third-party service is classified: **load-bearing** (CF, Clerk, Stripe, Resend — replacing any requires a multi-week migration) or **replaceable** (PostHog, Sentry, Upstash — equivalent alternatives exist, migration is days). Load-bearing vendors get: contract review, documented replacement plan in `ARCHITECTURE.md`, secret rotation schedule ≤90 days, and no single-point-of-failure usage (always wrap in an abstraction layer). Replaceable vendors get none of that overhead.

CF lock-in is the declared exception: CF primitives are load-bearing BY DESIGN (`cloudflare-lock-in-is-leverage`). All other load-bearing dependencies need justification.

- **[[cloudflare-lock-in-is-leverage]]** — intentional lock-in doctrine
- **[[mcp-server-registry]]** — MCP server tier classification mirrors this pattern
- **[[secret-provisioning]]** — rotation cadence per vendor tier
- **[[payments-routing]]** — Stripe vs Square routing logic (both are load-bearing; never mix patterns)
- Ship as standalone rule? **Y**

---

## 8. TTFR (Time-to-First-Render) as North-Star UX Metric

Every frontend change is measured against one number: time from navigation start to first contentful paint on a cold cache, throttled 3G, mid-range Android. Target: LCP ≤ 2.0s (cinematic), FCP ≤ 1.2s. This single metric forces pre-rendering (SSG/SSR), eliminates client-side data waterfalls, demands asset budgets, and makes image optimization non-optional.

When TTFR is the north star, "we'll optimize later" becomes impossible — because "later" is after the ship gate.

- **[[gorgeous-by-default]]** — INP ≤ 100ms (cinematic) pairs with TTFR
- **[[frontend-stack]]** — SSR/SSG mandatory specifically because of TTFR
- **[[quality-metrics]]** — Lighthouse perf ≥75 hard gate (should be ≥90)
- **[[e2e-tdd-organization]]** — Playwright measures TTFR in CI via `page.metrics()`
- Ship as standalone rule? **Y**

---

## 9. Customer-Facing Changelog Discipline

Every change visible to a user — new feature, behavior change, deprecation, pricing update — gets one line in a customer-readable changelog at `/changelog` (or `CHANGELOG.md` for OSS). This is not the git commit log. It is written for the user: "You can now export to CSV from any report." Not "feat: add csv_export endpoint." Format: date + 1–2 sentence user-outcome statement + optional screenshot. Publish on ship, not on sprint close.

Solo builder advantage: no committee review for changelog entries. Write it as you ship it.

- **[[todos-are-roadmap]]** — TODOs feed into upcoming changelog entries
- **[[feature-flags]]** — `stage='stable'` promotion triggers the changelog entry
- **[[solo-rituals-eliminated]]** — no "release notes ceremony" — just a line on ship
- **[[prompt-as-training-signal]]** — user re-prompting on a shipped feature = changelog entry that was missing
- Ship as standalone rule? **Y**

---

## 10. Backwards-Compatibility Removal Cadence

Solo-builder advantage: aggressive API/schema cleanup is possible without a customer deprecation cycle. Rule: deprecated APIs, old schema columns, legacy flag keys, and removed feature code get a 2-sprint TTL (typically 2 weeks). After 2 sprints: hard delete, never linger. Lingering dead code is tech debt compounding at 10%/sprint.

Document removals in the changelog (`**Breaking:**` prefix). If a CF Worker route is removed, add a redirect to the new path for 30 days, then drop it. Never maintain two versions of the same thing indefinitely.

- **[[solo-builder-doctrine]]** — solo = no legacy customer migration support burden
- **[[drift-detection]]** — dead code is drift; remove on detection
- **[[main-only-branch]]** — main-only means no "keep alive on legacy branch" escape hatch
- **[[feature-flags]]** — `stage='stable', rollout=100` for 30+ days = removal candidate
- Ship as standalone rule? **Y**

---

## 11. Hardware-Aware Programming (Cache/Batch/Dedup at Every Layer)

CF Workers run on V8 isolates with cold-start penalty on first activation (~5ms) and shared CPU budget across isolates. Every data-fetching pattern must be cache-first: D1 reads behind KV cache (60s TTL), PostHog events batched in `ctx.waitUntil()`, R2 reads behind CF Cache API, AI Gateway calls deduplicated by request hash. Never make the same fetch twice in one request lifecycle.

Three questions before every I/O call: (1) Can this be cached? (2) Can this be batched with adjacent calls? (3) Can this be deduped (same key requested twice in same request)?

- **[[fetch-defaults]]** — fetch wrapper with cache headers and dedup
- **[[prompt-cache]]** — AI call caching at the AI Gateway layer
- **[[cloudflare-lock-in-is-leverage]]** — CF Cache API as the caching primitive
- **[[hono-api]]** — KV cache pattern in Hono middleware
- Ship as standalone rule? **Y**

---

## 12. Documentation-as-Code (Prose Docs in Source, Versioned with the Code)

Architecture decisions, API contracts, and migration guides live in the repo alongside the code that implements them — not in Notion, not in a separate wiki, not in Slack threads. Format: `ARCHITECTURE.md` (overall system), `docs/decisions/NNN-title.md` (ADRs for one-way door decisions), inline JSDoc for exported functions, and `worker/feature-flags.ts` carries its own README block at the top.

When the code changes, the doc changes in the same commit. Docs that drift from code are worse than no docs — they actively mislead.

- **[[feature-module-architecture]]** — each module carries its own `README.md`
- **[[context-spillover]]** — sibling docs get sweep when context is loaded
- **[[prompt-as-training-signal]]** — "how does X work?" re-prompt = undocumented system
- **[[repo-folder-hygiene]]** — one canonical doc per doc class, not scattered across root
- Ship as standalone rule? **Y**

---

## 13. Refund Automation (Stripe/Square Dispute + Refund Rules)

Every payment integration ships with automated refund and dispute handling from day one. Stripe: configure Radar rules for auto-refund on high-risk charges; wire `charge.dispute.created` webhook to auto-accept disputes under $25 (cheaper than fighting them); auto-refund within 30 days of purchase on cancellation (Stripe Billing `cancel_at_period_end` + proration). Square: `DISPUTE_CREATED` webhook with same auto-accept threshold.

No manual refund process. Solo builder cannot staff a refund queue. Automate or absorb the dispute loss.

- **[[stripe-billing]]** — Stripe subscription lifecycle + proration
- **[[square-payments]]** — Square dispute webhook pattern
- **[[payments-routing]]** — which payment processor for which use case
- **[[hono-api]]** — webhook handler patterns
- Ship as standalone rule? **Y**

---

## 14. Data Residency / Sovereignty by Default

Every new D1 database, R2 bucket, and Durable Object namespace is created with `--jurisdiction eu` flag unless the workload is explicitly US-only. Default to EU because it is the stricter jurisdiction — a US customer's data in EU is fine; an EU customer's data in US is a GDPR violation. This is a one-way door: migrating data across jurisdictions after the fact is painful.

For Workers themselves: use `smart_placement = {mode = "off"}` to pin to a specific region when jurisdiction matters; let CF default when it doesn't.

- **[[enterprise-multi-tenancy]]** — per-tenant D1 with jurisdiction flag
- **[[cloudflare-lock-in-is-leverage]]** — D1/R2 jurisdiction as a CF primitive
- **[[autonomous-engineering]]** — jurisdiction is an `approval-required` decision, never autonomous
- **[[no-staging-doctrine]]** — prod-only means jurisdiction mistake is immediately a compliance incident
- Ship as standalone rule? **Y**

---

## 15. Inverted Abstraction Pyramid (Shallow Common, Deep Specialized)

Resist premature generalization. The abstraction layer for "all Workers" should be thin (shared auth middleware, error handler, CORS headers — ≤200 lines). The abstraction for a specific feature module should be deep (Zod schemas, typed service class, multiple query builders). The opposite — a thick generic layer that tries to handle everything — produces the most inscrutable bugs and the hardest-to-extend code.

Concretely: `worker/middleware/auth.ts` stays thin and generic. `worker/features/billing/stripe-webhooks.ts` can be 500 lines of deeply specific code. Never invert this — don't make the billing handler generic to reuse in auth.

- **[[feature-module-architecture]]** — module boundaries enforce the pyramid naturally
- **[[hono-api]]** — Hono middleware chain = the shallow layer
- **[[zod-everywhere]]** — Zod schemas are deep in each module, not a shared mega-schema
- **[[code-style]]** — file-per-concern convention supports the pyramid
- Ship as standalone rule? **Y**

---

## Summary: Top 5 Highest-Impact Missing Principles

1. **Production Observability Default-On (#3)** — the most operationally painful gap. Workers ship dark daily; by the time something breaks, there is no trace.
2. **State Is the Enemy (#2)** — Workers-specific correctness hazard. Stateful module scope causes cache-poisoning bugs that only appear under concurrency.
3. **Fail Fast in Build, Fail Soft in Prod (#5)** — currently the error strategy is inconsistent. `zod.parse()` in prod handlers will crash real users on unexpected API shapes.
4. **One-Way vs Two-Way Doors (#1)** — the `autonomous-engineering` tiers exist, but the underlying mental model is absent. Decisions are made at the wrong speed without it.
5. **Data Residency by Default (#14)** — one missed `--jurisdiction eu` on a D1 create is a GDPR incident. Default EU costs nothing and prevents everything.

## Standalone Rule Candidates (All 15 Are Y)

All 15 principles above are marked **Y** for extraction into standalone rule files. Priority order for follow-up extraction:

1. `production-observability-default-on.md`
2. `state-is-the-enemy.md`
3. `fail-fast-build-fail-soft-prod.md`
4. `one-way-two-way-doors.md`
5. `data-residency-by-default.md`
6. `sync-ui-async-backing.md`
7. `cost-per-request-accountability.md`
8. `ttfr-north-star.md`
9. `vendor-risk-tiering.md`
10. `customer-facing-changelog.md`
11. `backwards-compatibility-removal-cadence.md`
12. `hardware-aware-programming.md`
13. `documentation-as-code.md`
14. `refund-automation.md`
15. `inverted-abstraction-pyramid.md`

---

## 16. (Previously absent — now wired)

_(Slot reserved for next audit pass.)_

---

## 17. Hook-Event Name Validation

Claude Code's hook event names are a **closed enum**. The complete valid set is:

```
SessionStart | UserPromptSubmit | PreToolUse | PostToolUse | Stop | Notification
```

`PreCommit`, `PostMerge`, `PostCommit`, `PrePush`, `PreDeploy`, and `PostDeploy` **do not
exist**. A hook wired under one of these names loads without error but **never fires** —
the failure is silent and has no stack trace. The only signal is that the hook simply
doesn't run when expected.

**The canonical pattern for git commit interception** is `PreToolUse` with matcher
`Bash(git commit*)`. This fires before Claude executes any `git commit` shell command,
which is precisely when changelog enforcement, ticket linking, and conventional-commit
validation should run.

**Reference incident (2026-06-18):** During a loop iteration, an agent attempted to wire
`customer-changelog-precommit.py` under a `PreCommit` event. The hook loaded silently but
never fired. The error was caught in-situ and corrected to `PreToolUse` +
`Bash(git commit*)`. The hook now fires on every commit. The lesson was extracted to
`rules/bash-matcher-guardrails.md` the same session it was discovered.

**Validation steps before wiring any hook:**

1. Confirm the event name is in the closed enum above.
2. If intercepting a shell command, use `PreToolUse` + `Bash(<command glob>*)`.
3. Test by running the triggering action and confirming the hook's side-effect fires.
4. Check `~/.claude/settings.json` with `jq '.hooks | keys'` to audit wired events.

- **[[bash-matcher-guardrails]]** — full matcher syntax, wired matchers, all anti-patterns; the standalone extraction of THIS principle
- **[[ai-agent-security]]** — agent-level enforcement; hooks are the deterministic enforcement layer
- **[[autonomous-engineering]]** — hooks > rules > skills > prompts hierarchy
- Ship as standalone rule? **Y — already extracted as `rules/bash-matcher-guardrails.md`**

---

## 18. Router Drift Auto-Reconciliation

`_router.md` is the live routing map Claude uses to resolve which skill handles a given task. Without enforcement, new skill files accumulate without ever being registered — they become invisible to routing even though they exist on disk. Manual reconciliation via `/audit-router --fix` is reactive and depends on human memory. The hook from this principle makes reconciliation **continuous**: every SKILL.md or submodule `.md` write triggers an immediate check against `_router.md` and registers the slug automatically.

The root failure mode is accumulation lag: orphans don't break anything today, but routing degrades silently as the skill library grows. A 51-orphan backlog took ~1 month to accumulate with zero stale entries — meaning the map was never wrong, just perpetually incomplete.

**Reference incident (2026-06-18):** `/audit-router --fix` found 51 orphan skills (0 stale). All 51 were registered in a single pass. PostToolUse hook `router-reconcile-on-skill-write.py` was wired the same turn to prevent recurrence. Matcher: `Write|Edit|MultiEdit` on paths matching `heymegabyte-claude-skills/[0-9]+-*/**.md`.

**The hook (wired 2026-06-18):**

- File: `~/.claude/hooks/router-reconcile-on-skill-write.py`
- Event: `PostToolUse`, matcher: `Write|Edit|MultiEdit`
- Logic: parse modified path → extract category dir + slug → check `_router.md` for backtick-wrapped slug → if absent, append to the category line
- Override: `CLAUDE_ROUTER_RECONCILE_DISABLE=1` for batch operations
- stderr output: `router-reconcile: registered orphan {slug} in {dir}` or `router-reconcile: no action needed`

- **[[audit-router]]** — the `/audit-router --fix` command this hook automates; run on demand for full sweep
- **[[bash-matcher-guardrails]]** — hook event names, matcher syntax, and `PostToolUse` wiring patterns
- **[[drift-detection]]** — router orphans are a class of doc drift fixed by this hook
- Ship as standalone rule? **Y — extracted as `rules/router-drift-auto-reconciliation.md`**

---

## 19. Agent Connection-Drop Resilience

Agent briefs that write multiple files MUST write them in **separate `Write` tool calls
in priority order** so partial work survives mid-response failures. Each `Write` call is
atomic and durable at the filesystem level — once it returns success, the file exists
on disk regardless of what happens after. A connection drop, timeout, or stream
truncation after a `Write` call cannot un-write the file.

The failure mode this prevents: spending many tool_uses on research/reads before writing
any file, then losing the connection before the first write. The retry agent starts at
zero despite significant compute spent. Structuring writes as "file 1 first, file 2
second, file 3 third" means a mid-run failure leaves the retry agent with partial
progress — not a blank slate.

**Reference incident (2026-06-18, Task #32):** A three-file agent brief spent 16
tool_uses on research before writing any file. The connection dropped on tool_use #16.
Zero files were written. The retry succeeded in 2 tool calls: `Write` file 1, `Write`
file 2. The lesson: write the highest-priority file first, before optional reads or
analysis. The first `Write` should fire as early as possible in the agent's lifecycle.

**Brief-template phrasing to bake in:**
> "Write file 1 first via `Write` tool. Then write file 2. If the connection drops,
> file 1 is preserved — the retry agent picks up from file 2."

**Anti-patterns:**

- `MultiEdit` all files in one call (all-or-nothing; drop = 0 files written)
- Research loop → batch write at end (drop during research = 0 files written)
- Waiting for tests/verification before writing the source file

- **[[monitor-orchestration]]** — agent brief dispatch; this rule governs write order within each dispatched brief
- **[[parallel-subagent-economy]]** — sub-agents should write primary deliverable first; fleet-wide write batching is the same failure mode at scale
- **[[error-recovery]]** — recovery patterns after failures; this rule structures work so recovery is incremental
- Ship as standalone rule? **Y — extracted as `rules/agent-resilience-discipline.md`**

---

## 20. Working Backwards (Press Release Before Code)

Write the user-outcome description first. Code second. Before any feature that adds a
user-visible surface (new route, command, dashboard widget, public API endpoint), write
a 1-page Amazon-style press release: headline + problem + solution + founder quote +
customer quote + CTA. If you can't write an exciting press release, the feature is
mis-scoped — and you caught that at prose cost, not implementation cost.

The Bezos quote in full: "If a press release won't excite your customers, rethink the
feature — don't implement it." The forcing function is the value: articulating
customer outcome BEFORE implementation catches over-engineering (adding infrastructure
the user won't notice) and under-shipping (building the primitive without the surface).

**Reference incident (2026-06-18):** Audit baseline `30-30-saturated-2026-06-18.json`
revealed 29/30 principles present. Principle #3 ("Working backwards") was the sole gap
in a 30-principle checklist audit. The rule was written the same session the gap was
discovered. Milestone baseline `30-30-true-saturated-2026-06-18.json` confirms 30/30.

- **[[02-goal-and-brief]]** — product-level thesis is the press release for the whole product
- **[[14-independent-idea-engine]]** — press release is the filter between idea and task
- **[[autonomous-engineering]]** — approval tiers govern whether to ship; press release governs what to ship
- **[[one-way-two-way-doors]]** — mandatory before one-way door feature decisions
- **[[customer-facing-changelog]]** — solution section of press release becomes the changelog entry
- Ship as standalone rule? **Y — extracted as `rules/working-backwards.md`**

---

## 21. Root-Cause Validator Findings Before Applying Fixes

When an automated validator surfaces findings, the FIRST question is **"is the validator
correct?"** — not "how do I make the finding go away?" Apply `[[verification-loop]]` rigor
to the validator itself before treating its output as source-of-truth. A validator that
produces false positives under certain code patterns will cause you to modify source code
that was correct, adding noise, dead code, or regressions in the name of "fixing" it.

Concretely: before touching a source file based on a validator error, check whether (a)
the flagged code is actually reachable, (b) the validator's detection regex or AST pattern
handles the pattern correctly, and (c) the "fix" changes observable behavior or only
appeases the tool.

**Reference incident (2026-06-18 / Task #61).** `bin/validate-mcp-tools.mjs` reported
1,134 orphaned handlers in github-mcp. The recommended fix would have wrapped each in
additional `if (false)` guards — adding dead code on top of already-pruned dead code.
Diagnosis: the handlers were ALREADY inside `if (false)` guard blocks; the validator's
regex matched `request.params.name === "..."` without checking whether the surrounding
context was dead code. Fix went into the validator (two-pass scan that skips lines
containing `if (false`), not the source. Result: 1,134 false-positive violations → 0 with
the corrected validator, and github-mcp source was never touched.

- **[[verification-loop]]** — inspect → plan → implement → validate → repair; validate the validator the same way you validate code
- **[[error-recovery]]** — first hypothesis is not always correct; false-positive detections are a class of incorrect hypothesis
- **[[drift-detection]]** — a validator that fires false positives creates drift pressure toward incorrect "fixes"
- **[[autonomous-engineering]]** — fixing source based on unvalidated tooling output is approval-tier "review-recommended" at minimum
- Ship as standalone rule? **Y — `rules/root-cause-validator-findings.md`**
