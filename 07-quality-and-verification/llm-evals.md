---
name: "LLM Eval Harness"
description: "Golden-test eval harness for AI-heavy features. Covers when to write evals, golden-test JSON schema, scorers (exact-match / semantic-similarity via Workers AI embeddings / LLM-as-judge), CI gate, Vitest snapshot regression, prompt versioning. Full TypeScript implementation. Fires when any feature has AI-generated output that must stay correct across prompt edits or model swaps."
updated: "2026-06-18"
priority: 2
pack: "ai"
triggers:
  - "eval"
  - "golden test"
  - "regression"
  - "llm quality"
  - "ai-heavy"
  - "prompt version"
  - "semantic similarity"
paths:
  - "tools/evals/**"
  - "src/worker/ai/**"
  - "src/worker/routes/**"
  - "evals/**"
---

# LLM Eval Harness

AI-heavy code ships with evals the same day. Evals are to AI output what Vitest is to pure logic — not optional hygiene, not a later phase. Write the golden test BEFORE tuning the prompt. Watch the score move. Gate CI on composite-score regression. This is `[[evals]]` + `[[contract-first-ai]]` applied end-to-end.

Source authority: modelcontextprotocol.io, Anthropic evals documentation, `rules/evals.md`.

## When to write evals (mandatory trigger list)

Write at least one eval case when correctness depends on model output:

- Summarization, extraction, classification, intent-detection
- Copy generation (landing pages, emails, descriptions)
- Code generation agents (any route under `src/worker/ai/`)
- RAG retrieval quality (answer grounded in retrieved context)
- Tool-call selection (does the model pick the right tool from a schema?)
- Structured-output conformance (does the JSON match the Zod schema every time?)
- Judgment calls (slop detection, design critique, a11y rubric scoring)

No AI-heavy feature merges without a `tools/evals/<slug>.cases.ts` and a passing `pnpm evals --slug <slug>` run recorded in CI.

---

## Golden-test JSON format

Every case lives in `tools/evals/cases/<slug>.json` and is loaded by the runner at startup.
The runner also accepts inline `EvalCase[]` arrays from TypeScript for programmatic suites.

```json
{
  "id": "summarize-donor-brief-001",
  "slug": "summarize-donor-brief",
  "prompt_version": "v2.1",
  "model_under_test": "@cf/meta/llama-3.1-8b-instruct",
  "input": {
    "system": "You are a nonprofit brief summarizer. Return 2 sentences max.",
    "user": "Donors gave $142,000 in Q1 2026 toward the Newark Soup Kitchen expansion..."
  },
  "expected": {
    "contains_all": ["$142,000", "Q1 2026", "Newark"],
    "max_chars": 400,
    "tone_rubric": "professional, factual, no fluff, no superlatives"
  },
  "scoring_rubric": {
    "factual_accuracy": "All dollar figures and dates from input appear in output verbatim. 0=missing, 5=all present.",
    "conciseness": "Output <= 400 chars. 0=over limit, 5=within.",
    "tone": "No AI slop words (leverage, unleash, seamlessly). 0=present, 5=clean.",
    "instruction_following": "Exactly 2 sentences. 0=wrong count, 5=correct."
  },
  "thresholds": {
    "per_dimension_min": 3,
    "composite_min": 4.0
  },
  "tags": ["summarization", "donor", "nonprofit"]
}
```

### Field spec

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Globally unique. `<slug>-NNN` pattern. |
| `slug` | yes | Maps to `tools/evals/results/<slug>.ndjson`. |
| `prompt_version` | yes | Bump on every rubric or system-prompt change. |
| `model_under_test` | yes | Workers AI model string OR `claude-haiku-4-5` etc. |
| `input` | yes | Exact prompt fed to the model. Reproducible. |
| `expected` | yes | Deterministic checks run BEFORE LLM judge. |
| `scoring_rubric` | yes | Named dimensions with 0-5 scale definition. |
| `thresholds` | yes | `per_dimension_min` + `composite_min`. |
| `tags` | no | For `pnpm evals --tag <t>` filtering. |

---

## Scorer types (cheapest-first pipeline)

### Tier 1 — Exact-match (free, instant, run always)

```typescript
// tools/evals/scorers/exact-match.ts
import { z } from 'zod';

const ExpectedSchema = z.object({
  contains_all: z.array(z.string()).optional(),
  max_chars: z.number().optional(),
  regex: z.string().optional(),
});

export interface ExactResult {
  passed: boolean;
  failures: string[];
}

export function exactMatch(output: string, expected: z.infer<typeof ExpectedSchema>): ExactResult {
  const parsed = ExpectedSchema.parse(expected);
  const failures: string[] = [];

  if (parsed.contains_all) {
    for (const term of parsed.contains_all) {
      if (!output.includes(term)) failures.push(`Missing required term: "${term}"`);
    }
  }
  if (parsed.max_chars && output.length > parsed.max_chars) {
    failures.push(`Output ${output.length} chars exceeds limit of ${parsed.max_chars}`);
  }
  if (parsed.regex && !new RegExp(parsed.regex).test(output)) {
    failures.push(`Output does not match required pattern: ${parsed.regex}`);
  }

  return { passed: failures.length === 0, failures };
}
```

### Tier 2 — Semantic similarity via Workers AI embeddings

Uses `@cf/baai/bge-base-en-v1.5` (free, <100ms). Cosine similarity between model output and a reference answer. Threshold 0.82 = same semantic content, different wording.

```typescript
// tools/evals/scorers/semantic-similarity.ts
import { z } from 'zod';

const EmbeddingResponseSchema = z.object({
  data: z.array(z.object({ values: z.array(z.number()) })),
});

export interface SemanticResult {
  similarity: number; // 0-1
  passed: boolean;
  threshold: number;
}

function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i]!, 0);
  const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  return magA === 0 || magB === 0 ? 0 : dot / (magA * magB);
}

export async function semanticSimilarity(
  output: string,
  reference: string,
  env: { AI: Ai }, // CF Workers AI binding
  threshold = 0.82,
): Promise<SemanticResult> {
  const raw = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [output, reference],
  });
  const parsed = EmbeddingResponseSchema.parse(raw);
  const [outEmbed, refEmbed] = parsed.data.map((d) => d.values);
  const similarity = cosine(outEmbed!, refEmbed!);
  return { similarity, passed: similarity >= threshold, threshold };
}
```

### Tier 3 — LLM-as-judge with rubric (Haiku, ~$0.002/call)

G-eval pattern: judge first generates evaluation steps from the rubric, then applies them.
Use `claude-haiku-4-5` for cost; escalate to `claude-sonnet-4-6` when rubric is nuanced.

```typescript
// tools/evals/scorers/llm-judge.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic();

const JudgeResponseSchema = z.object({
  scores: z.record(z.number().min(0).max(5)),
  composite: z.number().min(0).max(5),
  reasoning: z.string(),
});

export type JudgeResult = z.infer<typeof JudgeResponseSchema> & {
  passed: boolean;
  cost_usd: number;
};

export async function llmJudge(
  output: string,
  rubric: Record<string, string>,
  thresholds: { per_dimension_min: number; composite_min: number },
  judgeModel = 'claude-haiku-4-5-20251001',
): Promise<JudgeResult> {
  const rubricText = Object.entries(rubric)
    .map(([dim, desc]) => `- ${dim} (0-5): ${desc}`)
    .join('\n');

  const response = await client.messages.create({
    model: judgeModel,
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `You are a calibrated evaluator. Score the OUTPUT on each dimension 0-5.
Respond ONLY with valid JSON matching: { scores: { <dim>: <0-5> }, composite: <avg>, reasoning: "<brief>" }

RUBRIC:
${rubricText}

OUTPUT:
${output}`,
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  const parsed = JudgeResponseSchema.parse(JSON.parse(text));
  const cost =
    ((response.usage.input_tokens * 0.25 + response.usage.output_tokens * 1.25) / 1_000_000);

  const dimsFailed = Object.values(parsed.scores).some(
    (s) => s < thresholds.per_dimension_min,
  );
  const passed = !dimsFailed && parsed.composite >= thresholds.composite_min;

  return { ...parsed, passed, cost_usd: cost };
}
```

---

## Full eval runner

```typescript
// tools/evals/run.ts
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { exactMatch } from './scorers/exact-match';
import { llmJudge } from './scorers/llm-judge';

// ── Zod schemas ─────────────────────────────────────────────────────────────

const EvalCaseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  prompt_version: z.string(),
  model_under_test: z.string(),
  input: z.object({
    system: z.string().optional(),
    user: z.string(),
  }),
  expected: z.record(z.unknown()).optional(),
  scoring_rubric: z.record(z.string()),
  thresholds: z.object({
    per_dimension_min: z.number(),
    composite_min: z.number(),
  }),
  tags: z.array(z.string()).optional(),
});

const EvalResultSchema = z.object({
  caseId: z.string(),
  slug: z.string(),
  prompt_version: z.string(),
  model_under_test: z.string(),
  verdict: z.enum(['PASS', 'FAIL']),
  scores: z.record(z.number()),
  composite: z.number(),
  exact_failures: z.array(z.string()),
  reasoning: z.string(),
  cost_usd: z.number(),
  ranAt: z.string(),
});

export type EvalCase = z.infer<typeof EvalCaseSchema>;
export type EvalResult = z.infer<typeof EvalResultSchema>;

// ── model call stub (swap for CF Workers AI or Anthropic SDK) ───────────────

async function callModel(cas: EvalCase): Promise<string> {
  // In a Worker: return await env.AI.run(cas.model_under_test, { messages: [...] }).response
  // In CI (Node): call Anthropic SDK or CF REST API
  // This stub keeps the runner transport-agnostic.
  throw new Error(`callModel not bound — wire up AI transport for ${cas.model_under_test}`);
}

// ── runner ───────────────────────────────────────────────────────────────────

export async function runCase(cas: EvalCase, modelOutput: string): Promise<EvalResult> {
  // Tier 1: exact-match (free)
  const exact = cas.expected ? exactMatch(modelOutput, cas.expected as Parameters<typeof exactMatch>[1]) : { passed: true, failures: [] };

  // Tier 3: LLM judge (skipped if exact already failed badly)
  const judge = await llmJudge(modelOutput, cas.scoring_rubric, cas.thresholds);

  const verdict = exact.passed && judge.passed ? 'PASS' : 'FAIL';

  const result = EvalResultSchema.parse({
    caseId: cas.id,
    slug: cas.slug,
    prompt_version: cas.prompt_version,
    model_under_test: cas.model_under_test,
    verdict,
    scores: judge.scores,
    composite: judge.composite,
    exact_failures: exact.failures,
    reasoning: judge.reasoning,
    cost_usd: judge.cost_usd,
    ranAt: new Date().toISOString(),
  });

  // Append to regression history (never overwrite)
  const dir = join('tools/evals/results');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, `${cas.slug}.ndjson`), JSON.stringify(result) + '\n');

  return result;
}

export async function runSuite(cases: EvalCase[], modelOutputMap: Record<string, string>): Promise<EvalResult[]> {
  return Promise.all(cases.map((c) => runCase(c, modelOutputMap[c.id] ?? '')));
}
```

---

## Vitest integration + snapshot regression

```typescript
// tools/evals/evals.test.ts
import { describe, it, expect } from 'vitest';
import { runCase, type EvalCase } from './run';
import goldenCases from './cases/summarize-donor-brief.json';
import { callModelForTest } from './__test-helpers__/model-stub';

// Snapshot regression: records composite score per case on main branch.
// CI fails if any case regresses by > 0.5 composite points.

describe('Donor Brief Summarizer Evals', () => {
  for (const raw of goldenCases as EvalCase[]) {
    it(`[${raw.id}] passes all scorers`, async () => {
      const output = await callModelForTest(raw);
      const result = await runCase(raw, output);

      // Hard pass/fail assertion
      expect(result.verdict, `Failure — ${result.exact_failures.join('; ')} | ${result.reasoning}`).toBe('PASS');

      // Snapshot: composite score must not regress vs recorded baseline
      expect(result.composite).toMatchSnapshot();
    }, 60_000);
  }
});
```

`package.json` scripts:

```json
{
  "scripts": {
    "evals": "tsx tools/evals/run.ts",
    "evals:ci": "vitest run tools/evals/ --reporter=verbose",
    "evals:watch": "vitest tools/evals/",
    "evals:slug": "tsx tools/evals/run.ts --slug"
  }
}
```

CI step (`.github/workflows/ci.yml`):

```yaml
- name: Run LLM evals
  run: pnpm evals:ci
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Any eval `FAIL` or snapshot regression > 0.5 = build fail. No exceptions.

---

## Prompt versioning

- Bump `prompt_version` on EVERY change to: system prompt text, rubric wording, model swap, schema change.
- Format: `v<major>.<minor>` — minor for rubric tweaks, major for schema breaks.
- NDJSON history preserves all versions; diff score distributions across versions with a simple `jq` query:

```bash
# Compare composite scores for v2.0 vs v2.1 on the donor-brief slug
jq -s 'group_by(.prompt_version) | map({version: .[0].prompt_version, avg_composite: (map(.composite) | add/length)})' \
  tools/evals/results/summarize-donor-brief.ndjson
```

- Add `snapshot_baseline` tag to the first case in a new prompt version to anchor the Vitest snapshot baseline.

---

## CI gate rules

- Every AI-heavy route in `src/worker/routes/` or `src/worker/ai/` must have a matching `tools/evals/cases/<slug>.json` — CI checks existence with:

```bash
for f in src/worker/ai/*.ts; do
  slug=$(basename "$f" .ts)
  if [[ ! -f "tools/evals/cases/${slug}.json" ]]; then
    echo "MISSING eval case for ${slug}" && exit 1
  fi
done
```

- Composite score regression beyond `−0.5` vs prior Vitest snapshot = build fail.
- New evals (no prior snapshot) must pass on first run to merge.
- Evals run in parallel via `Promise.all`; never serial.
- Never commit `tools/evals/results/*.ndjson` to git — add to `.gitignore`. History is environment-local; CI starts fresh each run and the snapshot captures the reference score.

---

## Cost model

| Scorer | Cost/call | When |
|---|---|---|
| Exact-match | Free | Always, Tier 1 preflight |
| Workers AI embeddings | Free | Semantic similarity check |
| Haiku 4.5 judge | ~$0.002 | Rubric scoring, Tier 3 |
| Sonnet 4.6 judge | ~$0.015 | Nuanced rubrics only |

A 20-case suite with Haiku judges = ~$0.04. Run 50×/day in CI = ~$2.00/day. Prompt-cache the rubric (90% off cached input) at scale. Never use Opus for judges — Haiku calibrated against periodic human labels is sufficient and 25× cheaper.

---

## Anti-patterns

- Never judge output with the same model that generated it — blind spot.
- Never overwrite `*.ndjson` results — append only, history is the regression signal.
- Never set `composite_min: 5.0` — too brittle for real model variance; 4.0-4.5 is right.
- Never skip Tier 1 exact-match (free and catches the obvious failures first).
- Never conflate evals with E2E — evals = generation quality, E2E = runtime behavior.
- Don't gate on per-dimension 5/5 — use composite + floor per dimension.

## See

- `rules/evals.md` — doctrine (three-tier grading, CI ↔ prod discipline)
- `rules/contract-first-ai.md` — Zod at every AI boundary
- `07-quality-and-verification/eval-driven-development.md` — Haiku LLM-as-judge pattern
- `05-architecture-and-stack/ai-technology-integration.md` — Workers AI model catalog
- `[[evals]]` — rule reference
- `[[contract-first-ai]]` — every eval result Zod-validated
