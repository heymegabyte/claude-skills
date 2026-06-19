---
description: Batch-run all LLM eval cases in tools/evals/cases/*.json; aggregate pass/fail, cost, regression vs last run; exit nonzero in CI mode
argument-hint: [--ci] [--slug <slug>] [--tag <tag>] [--judge-model <model>]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Run the full eval suite per [[evals]] + [[contract-first-ai]]. Every AI-heavy feature ships with evals the same day; this command runs them all.

**Purpose** — surface regression before it reaches prod; keep eval history for prompt-version diffing.

**When to use** — before merging any prompt change; after a model swap; in CI via `--ci` flag; on demand to check eval health.

**Inputs**

- `--ci` — exit code 1 on any FAIL or composite regression > 0.5; suppress interactive output
- `--slug <slug>` — run only cases matching this slug
- `--tag <tag>` — run only cases with this tag in their `tags[]` array
- `--judge-model <model>` — override judge model (default: `claude-haiku-4-5-20251001`)

---

## Step 1 — Locate eval cases

Glob `tools/evals/cases/*.json` from the current project root. If the directory does not exist, exit cleanly with: `No eval cases found at tools/evals/cases/ — skipping.` (exit 0 even in `--ci` mode; absence of cases is not a failure).

Apply `--slug` and `--tag` filters if provided. Load and Zod-validate each case file against the `EvalCaseSchema` from `07-quality-and-verification/llm-evals.md`. Any case that fails schema validation is immediately flagged as FAIL with reason `schema_invalid` — do not skip it silently.

---

## Step 2 — Load prior run for regression baseline

Read the most recent file from `tools/evals/runs/` (sorted by filename timestamp, descending). This is the regression baseline. If no prior run exists, set baseline to `{}` and note "first run — no regression check".

Prior run format (NDJSON): one JSON object per line with fields `{caseId, composite, verdict, ranAt}`.

---

## Step 3 — Run each case through the scorer pipeline (cheapest-first)

For each case, run tiers in order:

**Tier 1 — Exact-match (free, always run)**
Check `expected.contains_all`, `expected.max_chars`, `expected.regex` per the `exactMatch` scorer in `07-quality-and-verification/llm-evals.md`. If any check fails, record `exact_failures[]` and mark the case FAIL immediately — skip Tier 3 (saves cost).

**Tier 2 — Semantic similarity (Workers AI embeddings, free)**
Run only if the case has `expected.reference_answer` field. Use `@cf/baai/bge-base-en-v1.5` cosine similarity, threshold 0.82. Skip gracefully if no CF AI binding is available in the current execution context (local Node run without Workers env).

**Tier 3 — LLM-as-judge (Haiku ~$0.002/call)**
Run the G-eval pattern from `07-quality-and-verification/llm-evals.md`: judge generates evaluation steps from `scoring_rubric`, then scores 0-5 per dimension. Composite = mean of dimension scores. Compare against `thresholds.composite_min` and `thresholds.per_dimension_min`.

Override judge model via `--judge-model` arg. Default: `claude-haiku-4-5-20251001`. Never use Opus for judging — cost is 25× higher than Haiku for no measurable calibration gain.

Run all cases in parallel via `Promise.all` — never serial.

---

## Step 4 — Regression check

For each case that has a prior run baseline:

- If current `composite` < prior `composite` - 0.5 → mark **REGRESSION** (composite dropped by >0.5 points)
- If prior verdict was PASS and current is FAIL → mark **REGRESSION**
- If case is new (no prior entry) → mark **NEW** (must pass to be acceptable, but not a regression)

---

## Step 5 — Emit NDJSON run record

Write `tools/evals/runs/{ISO8601-timestamp}.ndjson` — one line per case result:

```json
{"caseId":"summarize-donor-brief-001","slug":"summarize-donor-brief","prompt_version":"v2.1","model_under_test":"@cf/meta/llama-3.1-8b-instruct","verdict":"PASS","scores":{"factual_accuracy":5,"conciseness":5,"tone":4,"instruction_following":5},"composite":4.75,"exact_failures":[],"regression":false,"reasoning":"All required terms present; output concise; clean tone.","cost_usd":0.002,"ranAt":"2026-06-18T09:00:00.000Z"}
```

Append only — never overwrite existing run files. The run history is the regression signal.

Do NOT commit `tools/evals/runs/*.ndjson` to git — these are local CI artifacts. Confirm `.gitignore` has `tools/evals/runs/` before writing. If the entry is missing, add it.

---

## Step 6 — Aggregate and surface report

Emit a summary block:

```
Eval Run — 2026-06-18T09:00:00Z
────────────────────────────────
Cases:       12 total   (8 PASS · 2 FAIL · 2 NEW-PASS)
Regressions: 1          (summarize-donor-brief-001: composite 4.75→3.9)
Cost:        Tier 1 $0.00 · Tier 2 $0.00 · Tier 3 $0.024 · total $0.024

FAIL items:
  ✗ extract-intent-002 [exact] — Missing required term: "Newark"
  ✗ classify-urgency-003 [judge] — composite 3.2 < threshold 4.0
    Reasoning: "Urgency classification missed the deadline signal in para 3."

REGRESSION:
  ↓ summarize-donor-brief-001 — composite 4.75 → 3.9 (delta −0.85)
    Prompt version: v2.1 (prior: v2.0) — rubric change likely cause
```

In `--ci` mode: suppress the decorative output, emit only FAIL and REGRESSION lines to stdout, exit code 1.

---

## Step 7 — Surface FAIL diffs

For each FAIL case, emit a structured diff block showing:

- Expected vs actual for exact-match failures (show the missing term in context)
- Prior composite vs current composite for regressions
- Judge reasoning verbatim (it is the most actionable signal)

---

## Step 8 — CI guard checklist

In `--ci` mode, also verify:

1. Every file under `src/worker/ai/*.ts` has a matching `tools/evals/cases/<basename>.json` — if missing, exit 1 with `MISSING eval case for <slug>`.
2. Every case with `prompt_version` changed from the prior run baseline must have a NEW case ID (not mutated in-place) — mutation destroys regression history.
3. No case has `composite_min: 5.0` — flag as misconfigured (too brittle).

---

**Verification** — After the run, confirm the NDJSON was written: `ls -la tools/evals/runs/` should show today's file. Confirm case count matches the glob result.

**Cost model** — A 20-case Haiku-judge suite costs ~$0.04. 50 CI runs/day = ~$2/day. Prompt-cache the rubric text (add `cache_control: {type: "ephemeral"}` to the system block) to cut repeat runs by ~90%.

**See**

- `07-quality-and-verification/llm-evals.md` — full scorer implementations, Zod schemas, runner code
- `rules/evals.md` — doctrine (three-tier grading, CI discipline)
- `rules/contract-first-ai.md` — Zod at every AI boundary
- `[[evals]]` — rule reference
- `.github/workflows/validate-manifests.yml` — CI gate that invokes this command with `--ci`
