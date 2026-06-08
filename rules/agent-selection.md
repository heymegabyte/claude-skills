# Agent Selection & Diversity (***SUPREME — every parallel / multi-agent run***)

Every parallel fan-out MUST assign each work unit to the most-specialized agent that can own it — never default a swarm to generic `general-purpose` workers. Generic-worker overuse causes weak specialization, duplicated effort, and shallow reviews; this rule kills that at decomposition time and again at the final-review gate.

## Anti-generic mandate
- NEVER spawn a generic `general-purpose` agent when a registered specialist can reasonably own the task.
- `general-purpose` is allowed ONLY when the task genuinely fits no specialist AND no registered agent maps — and that MUST be justified in the Rejected-agent note.
- Even when `general-purpose` is the chosen runtime, it ALWAYS carries a specialist brief (role + scope + non-goals + verification). Bare generic = build fail.
- Three identical-shaped briefs across runs ⇒ promote to a new reusable agent def per [[prompt-as-training-signal]].

## Classify before spawning
Every parallel run first classifies each work unit by:
- **Domain** — frontend · backend · worker-runtime · data · auth/billing · AI-dev · infra
- **Artifact type** — architecture decision · implementation · test · review · content · config
- **Risk level** — autonomous · review-recommended · approval-required · blocked ([[autonomous-engineering]])
- **Impacted files** — exact paths the agent owns + what it must NOT touch
- **Required verification** — typecheck · vitest · Playwright · axe · Lighthouse · drift-detection
- **Required integrations** — CF bindings · Stripe · PostHog · Sentry · Resend · MCPs
- **User-facing vs internal** — gates UX/visual/a11y/SEO reviewers
- **Altitude** — architectural vs implementation vs review (drives the model per [[model-routing]])

## Agent taxonomy

### Architecture (map to `architect` / `meta-orchestrator` + CF/Angular/Hono/Zod brief)
| Archetype | Purpose · triggers · non-goals · inputs · outputs · verification · maps-to |
|---|---|
| cloudflare-architect | CF-primitive selection (Workers/D1/R2/KV/DO/Queues) · new edge surface · NOT impl · brief+constraints · ADR+binding plan · drift-detection · `architect`+CF brief |
| angular-ssr-architect | Angular21+Nx+SSR-on-Workers shape · new app/feature shell · NOT styling · brief+routes · route+hydration plan · typecheck · `architect`+Angular brief |
| saas-platform-architect | tenancy/entitlements/flags topology · new SaaS area · NOT UI · brief+pricing · platform ADR · drift-detection · `architect`+brief |
| multi-tenant-systems-architect | isolation + RBAC boundaries · cross-tenant data · NOT auth-impl · schemas · isolation plan · review · `meta-orchestrator`+brief |
| api-contract-architect | Hono+Zod+OpenAPI contracts · new endpoint family · NOT handlers · entities · typed contract · zod-validate · `architect`+Hono/Zod brief ([[contract-first-ai]]) |
| database-data-modeler | D1/Neon schema + migrations · new tables · NOT seeding · entities · migration+ERD · migration dry-run · `architect`/`migration-agent`+brief |

### Implementation (mostly `general-purpose + specialist brief` — these MUST get briefs, never bare generic)
| Archetype | Purpose · triggers · non-goals · inputs · outputs · verification · maps-to |
|---|---|
| frontend-feature-builder | Angular/React feature UI · new user surface · NOT API · contract+design · component+spec · Playwright · `general-purpose`+brief |
| backend-api-builder | Hono handlers + services · new endpoint · NOT schema design · contract · handler+unit · vitest · `general-purpose`+brief |
| worker-runtime-builder | Worker/DO/Queue/Workflow code · edge runtime work · NOT UI · binding plan · runtime+test · typecheck · `general-purpose`+brief |
| integration-builder | Stripe/Resend/PostHog/MCP wiring · external service · NOT core logic · keys+contract · adapter+test · vitest · `general-purpose`+brief |
| forms-and-automation-builder | Zod forms + Turnstile + jobs · new form/automation · NOT design · schema · form+validation · Playwright · `general-purpose`+brief |
| auth-billing-builder | Clerk/Stripe Link flows · auth/billing surface · NOT pricing policy · contract · flow+test · E2E+approval · `general-purpose`+brief |
| dashboard-builder | admin/data dashboards · new admin view · NOT data model · contract · view+spec · Playwright · `general-purpose`+brief |

### Quality
| Archetype | Purpose · triggers · non-goals · inputs · outputs · verification · maps-to |
|---|---|
| playwright-e2e-verifier | homepage-first E2E · any feature · NOT impl fixes · feature · specs+run · green suite · `test-writer` |
| vitest-unit-verifier | unit coverage · new function · NOT E2E · code · tests+coverage · thresholds · `test-writer` |
| zod-contract-verifier | runtime contract parity · new schema · NOT impl · schemas · parity tests · validate · `general-purpose`+brief ([[contract-first-ai]]) |
| accessibility-reviewer | axe 6bp + WCAG 2.2 · UI surface · NOT redesign · pages · violations+fixes · axe 0 · `accessibility-auditor` |
| performance-reviewer | CWV + bundle + INP · route · NOT features · routes · budget report · Lighthouse · `performance-profiler` |
| security-reviewer | OWASP + secrets + CSP · risky surface · NOT features · diff · findings · scan · `security-reviewer` |
| observability-reviewer | Sentry/PostHog/trace coverage · new feature · NOT infra · code · gap report · trace check · `general-purpose`+brief |
| dead-code-removal-agent | unused exports/deps · post-build · NOT behavior change · tree · removals · knip+typecheck · `code-simplifier` |

### Product / Design
| Archetype | Purpose · triggers · non-goals · inputs · outputs · verification · maps-to |
|---|---|
| ux-flow-designer | flow + friction audit · new journey · NOT code · brief · flow spec · review · `general-purpose`+brief |
| visual-polish-designer | cinematic visual QA · UI surface · NOT copy · screenshots · score+fixes · AI-vision ≥8 · `visual-qa` |
| conversion-copywriter | CTA + hero copy · marketing surface · NOT code · brief · copy · anti-slop grep · `content-writer` |
| seo-metadata-specialist | title/meta/JSON-LD/OG · any route · NOT body copy · route · meta+schema · Rich Results · `seo-auditor` |
| content-structure-specialist | IA + FAQ + headings · content page · NOT design · brief · structure · readability · `content-writer` |
| animation-motion-specialist | View Transitions + scroll motion · hero/section · NOT logic · design · motion+reduced-motion gate · AI-vision · `visual-qa`+brief |

### AI-development (`general-purpose + brief`, citing the pattern rules)
| Archetype | Purpose · triggers · non-goals · inputs · outputs · verification · maps-to |
|---|---|
| prompt-systems-architect | prompt registry + templates · new AI surface · NOT model choice · brief · prompt+version · eval run · `general-purpose`+brief ([[prompt-as-training-signal]]) |
| agentskills-maintainer | rule/skill authoring + dedup · reusable lesson · NOT product code · gradient · rule edit · format lint · `general-purpose`+brief |
| evals-designer | eval suites for AI features · new AI capability · NOT impl · spec · eval set · eval pass · `general-purpose`+brief ([[evals]]) |
| drift-detection-agent | architecture/contract drift · pre-feature scan · NOT fixes-only · tree · drift report · `validate:features` · `general-purpose`+brief ([[drift-detection]]) |
| tool-api-designer | tool/MCP surface as API · new tool · NOT runtime · entities · typed tool def · schema check · `general-purpose`+brief ([[tool-design-as-api]]) |
| sandbox-execution-agent | isolated code-exec runs · untrusted/preview code · NOT prod · code · sandbox result · isolation check · `general-purpose`+brief ([[sandbox-execution]]) |
| self-improvement-reviewer | "did the system improve?" · post-run · NOT product · run log · global edits · rule lint · `general-purpose`+brief ([[prompt-as-training-signal]]) |

### Final review
| Archetype | Purpose · triggers · non-goals · inputs · outputs · verification · maps-to |
|---|---|
| final-integration-reviewer | full-brief completeness · every run · NOT new features · diff · gap list · checklist · `completeness-checker` |
| agent-diversity-reviewer | owns the gate below · every parallel run · NOT impl · spawn log · diversity verdict · table · `general-purpose`+brief |
| risk-and-approval-reviewer | risk-tier + approval gate · any risky action · NOT execution · diff · risk verdict · taxonomy · `general-purpose`+brief ([[autonomous-engineering]]) |
| release-readiness-reviewer | deploy + prod-E2E gate · pre-deploy · NOT features · build · go/no-go · prod E2E · `deploy-verifier` |

## Assignment table (REQUIRED every parallel run)
Emit this table BEFORE spawning any agents:

| Agent | Purpose | Scope | Non-goals | Deliverable | Verification |
|---|---|---|---|---|---|
| <agent> | <one line> | <files owned> | <what NOT to touch> | <artifact> | <gate> |

**Rejected-agent note** (always present): `Specialists considered but not spawned: <Agent> / <Reason not needed>`.

Fan-out WIDTH for test-writing + feature/test-impl batches (sweet spot 3-4, hard ceiling 6, batch beyond 6) is governed by [[parallel-subagent-economy]]; this rule still assigns WHICH specialist owns each unit. Spawned specialists run on the standing `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` default — EXCEPT security/architect/visual-qa/payment reviewers, which pass an explicit `model: opus` so the Sonnet default never silently downgrades a sensitive review.

## Agent Diversity Review gate (KEYSTONE — runs in final review)
The `agent-diversity-reviewer` MUST verify: too many generic workers? each role distinct? a specialist missing? work duplicated across agents? any vague output? did reviewers collectively cover architecture + code-quality + tests + UX + security + observability? a new reusable agent needed? should an existing def be split / merged / renamed / deprecated? did this run leave the system better for the next run?

Required table (verbatim):

| Review Question | Result | Action Taken |
|---|---|---|
| Were specialist agents used instead of generic workers? | | |
| Was any agent missing? | | |
| Did any agent overlap too much? | | |
| Should a new reusable agent be created? | | |
| Should any global skill or command be updated? | | |

If any answer suggests improvement, update the global files (`~/.claude` / `~/.agentskills`) IMMEDIATELY in the same turn per [[prompt-as-training-signal]] — never defer.

## Structured agent report format
Every spawned agent returns:

```
## Agent Report: <name>
- Mission: <one line>
- Files inspected: <paths>
- Files changed: <paths>
- Decisions: <key calls + rationale>
- Verification performed: <commands + results>
- Risks: <residual risk + tier>
- Recommended follow-up: <next action or "none">
- Should this become a reusable global improvement? <yes/no + what>
```

Reviewer agents add:
- **Pass/fail:** `PASS | FAIL | PASS WITH WARNINGS`
- **Blocking issues:** <list or none>
- **Non-blocking improvements:** <list or none>
- **Global config improvements recommended:** <rule/skill/agent edit or none>

## Preference guardrails
Every spawned specialist inherits Brian's stack ([[brian-preferences]]):
- Cloudflare-first; Angular SSR / Hono / TypeScript; Zod everywhere at boundaries.
- Playwright E2E from the homepage outward; contract-first structured outputs.
- plan → execute → verify → repair; no stubs, no placeholders.
- Strong docs — TypeDoc / JSDoc on exports + markdown diagrams.
- PostHog · Sentry · Stripe Link · Nx · Vitest · ESLint · Prettier · Stylelint wired by default.
- Human approval only before huge / irreversible actions ([[autonomous-engineering]] approval gate).

## Reference incident (***2026-05-28 — agent-diversity OS upgrade***)
Parallel runs were defaulting too many work units to generic `general-purpose` workers — weak specialization, duplicated effort, shallow reviews — fixed by this specialist-first taxonomy + the mandatory diversity gate.

## See
- [[parallel-subagent-economy]] — default fan-out width (sweet spot 3-4, hard ceiling 6) + Sonnet specialists for the two heavy batch workloads (test-writing, feature/test impl)
- [[monitor-orchestration]] — the fan-out shell this rule assigns agents within
- [[autonomous-engineering]] — risk-tier + approval gate every assignment respects
- [[full-autonomy]] — the unrestricted-tool grant specialists operate under
- [[model-routing]] — altitude → model mapping for each spawned agent
- [[drift-detection]] — drift-detection-agent gate runs in-turn
- [[verification-loop]] — the deploy + prod-E2E gate release-readiness owns
- [[prompt-as-training-signal]] — diversity-review improvements fold back same-turn
- [[contract-first-ai]] — api-contract / zod-contract agents enforce typed contracts
- [[evals]] — evals-designer authors AI-feature eval suites
- [[brian-preferences]] — the stack + approval guardrails every specialist inherits
