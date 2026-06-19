---
description: Audit the rules/ directory for missing foundational principles; output gap list with priority and justification
argument-hint: [path-to-rules, optional — defaults to ./rules]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Run a principle-gap audit against the current `rules/` directory per [[prompt-as-training-signal]].

**When to use** — before a rules sprint; when a bug surfaces that should have been covered; after merging a major skill; on demand.

**Inputs** — `$ARGUMENTS` (optional path; defaults to `./rules`, then `~/.claude/plugins/heymegabyte-claude-skills/rules`).

---

## Step 1 — Load the audit template

- Read `rules/principles-incident-log.md`; extract every principle title + `[[cross-links]]` as the known-captured set.
- Glob `rules/*.md`; extract frontmatter `name:` + `##` section headers → principle index.

---

## Step 2 — Compare against the canonical checklist

Score each item: **present** (≥1 rule with ≥200 words substantive guidance) / **partial** (mentioned but no standalone treatment; treat as missing) / **missing**.

### Checklist of ~30 foundational principles

**Decision-making**

1. One-way vs two-way doors — reversibility classification before every architectural decision (Bezos)
2. Disagree-and-commit — surface dissent BEFORE a decision; execute fully after
3. Working backwards — write the press release / user outcome first; code second
4. Two-pizza team sizing — solo builder has a 1-pizza complexity budget

**Reliability / SRE**

5. Error budget — monthly error budget per service; consuming it triggers velocity freeze
6. Toil elimination — manual, repetitive, automatable tasks tracked; eliminated before exceeding 50% of working time
7. Blast radius minimization — scope every change to the smallest possible failure domain
8. Fail fast in build, fail soft in prod — `zod.parse()` in CI; `safeParse()` + graceful degradation in prod

**Performance / hardware**

9. Hardware-aware programming — cache-first, batch-first, dedup-first at every I/O layer (V8 isolate budget, 10 DNS lookup SPF limit, KV batching)
10. TTFR as north-star UX metric — LCP ≤2.0s cold-cache throttled 3G drives all frontend decisions
11. Sync UI, async backing — optimistic UI + `ctx.waitUntil()` truth; idempotency keys on every mutation

**Data / state**

12. State is the enemy — Workers are stateless; persistent state belongs in DOs / D1 / KV / R2, never module scope
13. Data residency by default — create D1/R2/DOs with `--jurisdiction eu` unless explicitly US-only; jurisdiction is a one-way door
14. Backwards-compatibility removal cadence — deprecated APIs / columns get a 2-sprint TTL; dead code is drift

**Observability**

15. Production observability default-on — PostHog + OTLP + Sentry ship from line 1 of every Worker, not retrofitted
16. Structured logging — every `console.log` is `{level, traceId, workerId, ...}` JSON; no free-text logs

**Cost / economics**

17. Cost-per-request accountability — napkin math inline before every I/O-heavy feature; $0.001/req ceiling for free-tier
18. Vendor risk tiering — every third-party classified load-bearing vs replaceable; rotation cadence + documented replacement plan

**Security**

19. Least privilege by default — API tokens scoped to minimum resources; CF token per Worker, not global
20. Secret rotation discipline — every secret has a rotation cadence in the registry; automated reminder 14d before due
21. Supply-chain integrity — `npm audit` + Snyk + `package-lock.json` pinned SHA every CI run; no `latest` in prod deps

**AI / evals**

22. Contract-first AI — every AI output through a Zod schema before reaching application logic; never trust raw model text
23. Evals before tuning — write failing eval cases BEFORE touching a prompt; gate CI on score
24. LLM-as-judge calibration — judge model must differ from generation model; Haiku judge, human spot-check 10% monthly

**Documentation / knowledge**

25. Documentation-as-code — ARCHITECTURE.md + ADRs in-repo, updated in same commit as code they describe
26. Customer-facing changelog discipline — one user-outcome line per shipped change at `/changelog`; written on ship, not sprint close
27. Inverted abstraction pyramid — thin shared middleware (≤200 lines); deep specialized feature modules

**Process / culture**

28. Rituals eliminated — no backlog grooming, postmortems for solo incidents, or design committees; captured in [[solo-builder-doctrine]]
29. Prompt-as-training-signal — every re-prompt is a gradient; lesson extracted and written to durable layer same turn
30. Refund automation — Stripe/Square dispute auto-accept under $25; no manual refund queue for a solo builder

---

## Step 3 — Emit the gap report

```
| # | Principle | Status | Priority | Justification |
|---|-----------|--------|----------|---------------|
| 5 | Error budget | MISSING | Y | SRE baseline; absence means no velocity freeze trigger when reliability degrades |
...
```

- Priority **Y**: (a) a real current-stack failure mode is directly prevented, OR (b) in `rules/principles-incident-log.md` top-5, OR (c) load-bearing for ≥3 other rules via cross-links.
- Priority **N**: abstractly useful but no concrete solo-CF failure mode prevented today.

---

## Step 4 — Recommend extraction targets

For every **MISSING + Priority Y** item:

- Suggest filename: `rules/<kebab-principle-name>.md`
- List top 3 `[[cross-links]]` it should carry
- State which existing rule it sits nearest to

Do NOT create files — this audit is read-only. To extract, run `/self-improve` citing this output.

---

**Verification** — Run `grep -l "<principle keyword>" rules/*.md` before marking any item MISSING.

**Output length** — emit all rows (PRESENT + MISSING); PRESENT rows confirm coverage.

---

## Step 5 — Milestone snapshot and drift detection (optional)

Runs only when `$ARGUMENTS` contains `--milestone=<label>`.

### 5a — Write the baseline snapshot

Serialize the result table as JSON to:

```
rules/audit-baselines/<label>-<YYYY-MM-DD>.json
```

```json
{
  "label": "30-30",
  "date": "2026-06-18",
  "principles": [
    { "id": 1, "name": "One-way vs two-way doors", "status": "present" },
    { "id": 5, "name": "Error budget", "status": "missing" }
  ]
}
```

Create `rules/audit-baselines/` if absent.

### 5b — Drift report vs prior baseline

If `rules/audit-baselines/` has ≥1 `.json` file:

1. Load the most recent baseline (sort filenames descending, take first).
2. Compare each principle's `status` prior vs current.
3. Emit drift table:

```
| # | Principle | Prior | Current | Change |
|---|-----------|-------|---------|--------|
| 5 | Error budget | missing | present | + GAINED |
| 16 | Structured logging | present | missing | - LOST |
```

4. Summarize: "N principles gained, M principles lost since baseline `<prior-label>` on `<prior-date>`."
5. Flag each **LOST** principle at the top of the drift table: "Previously covered; verify the rule file was not deleted."

### 5c — No baseline yet

If `rules/audit-baselines/` is empty or missing AND `--milestone` was passed, create the first snapshot and note: "First baseline created — no prior baseline to diff against."

---

**See**

- `rules/principles-incident-log.md` — seed for the known-already-captured set
- `[[prompt-as-training-signal]]` — why recurring principle audits matter
- `[[drift-detection]]` — principle gaps are a class of doc drift
- `/self-improve` — command to act on gaps found by this audit
