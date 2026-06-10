---
name: "Eval-Driven Development"
description: "LLM-as-judge pattern for automated quality evaluation. Generate output → score with Haiku → pass/fail threshold. Eval types: code quality, copy quality, design fidelity, SEO compliance. ~$0.002/eval (Haiku 4.5). Vitest integration."
updated: "2026-04-23"
---

# Eval-Driven Development

## Core Pattern

```
Generate output → Send to LLM judge (Haiku) → Score 1-10 → Pass if ≥ threshold → Fail with reasoning
```

Cost: ~$0.002/eval with `claude-haiku-4-5` ($1/$5 per MTok). Run hundreds of evals for pennies. Treat evals like tests — they run in CI, they block merges, they catch regressions.

## Eval Runner

```typescript
// evals/eval-runner.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface EvalResult {
  name: string;
  score: number;
  passed: boolean;
  reasoning: string;
  cost: number;
}

interface EvalCase {
  name: string;
  input: string;
  rubric: string;
  threshold: number; // 1-10, minimum passing score
}

async function runEval(evalCase: EvalCase): Promise<EvalResult> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are an evaluator. Score the following output 1-10 based on the rubric.

RUBRIC: ${evalCase.rubric}

OUTPUT TO EVALUATE:
${evalCase.input}

Respond in JSON: { "score": <1-10>, "reasoning": "<why>" }`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);
  const cost = (response.usage.input_tokens * 0.25 + response.usage.output_tokens * 1.25) / 1_000_000;

  return {
    name: evalCase.name,
    score: parsed.score,
    passed: parsed.score >= evalCase.threshold,
    reasoning: parsed.reasoning,
    cost,
  };
}

async function runEvalSuite(cases: EvalCase[]): Promise<EvalResult[]> {
  return Promise.all(cases.map(runEval));
}

export { runEval, runEvalSuite, type EvalCase, type EvalResult };
```

## Eval Types

### Code Quality Eval

```typescript
const codeQualityEval: EvalCase = {
  name: 'code-quality',
  input: readFileSync('src/api/routes.ts', 'utf-8'),
  threshold: 7,
  rubric: `Score this TypeScript code:
- Functions under 50 lines (2pts)
- No any types (2pts)
- Error handling present (2pts)
- Zod validation on inputs (2pts)
- Clean naming, no abbreviations (2pts)
Deduct 1pt per violation. 10 = perfect, 1 = unusable.`,
};
```

### Copy Quality Eval

```typescript
const copyQualityEval: EvalCase = {
  name: 'copy-quality',
  input: extractPageCopy('src/app/pages/home.html'),
  threshold: 8,
  rubric: `Score this website copy:
- No AI slop words: leverage, utilize, unleash, discover, seamlessly (2pts)
- Headlines 4-8 words (1pt)
- Descriptions under 160 chars (1pt)
- Active voice throughout (1pt)
- Specific numbers, not vague claims (1pt)
- Flesch readability >= 60 (1pt)
- Sharp, punchy, irreverent tone (2pts)
- Clear CTA with action verb (1pt)
10 = perfect brand voice, 1 = generic AI output.`,
};
```

### Design Fidelity Eval

```typescript
// Uses base64 screenshot — works with vision-capable models
const designFidelityEval: EvalCase = {
  name: 'design-fidelity',
  input: `[Screenshot attached separately via vision API]`,
  threshold: 8,
  rubric: `Score this website screenshot:
- Dark theme with #060610 background (2pts)
- Cyan (#00E5FF) accent visible (1pt)
- Bold typography hierarchy (1pt)
- No gray placeholder boxes (1pt)
- Professional, not AI-generated look (2pts)
- Consistent spacing rhythm (1pt)
- Clear visual hierarchy (1pt)
- Mobile-responsive layout (1pt)
10 = Apple-quality, 1 = default Bootstrap.`,
};
```

### SEO Compliance Eval

```typescript
const seoComplianceEval: EvalCase = {
  name: 'seo-compliance',
  input: extractHTMLHead('src/app/pages/home.html'),
  threshold: 9,
  rubric: `Score this page's SEO setup:
- Title 50-60 chars with keyphrase (2pts)
- Meta description 120-156 chars (1pt)
- Exactly one H1 tag (1pt)
- Canonical URL present (1pt)
- OG image 1200x630 specified (1pt)
- JSON-LD structured data (1pt)
- 2+ internal links (1pt)
- 1+ outbound authority link (1pt)
- Alt text on all images (1pt)
10 = Yoast green, 1 = no SEO at all.`,
};
```

## Vitest Integration

```typescript
// evals/quality.eval.test.ts
import { describe, it, expect } from 'vitest';
import { runEval, type EvalCase } from './eval-runner';

describe('Quality Evals', () => {
  it('Homepage copy passes brand voice eval', async () => {
    const result = await runEval(copyQualityEval);
    expect(result.passed, `Score: ${result.score}/10 — ${result.reasoning}`).toBe(true);
  }, 30_000);

  it('API routes pass code quality eval', async () => {
    const result = await runEval(codeQualityEval);
    expect(result.passed, `Score: ${result.score}/10 — ${result.reasoning}`).toBe(true);
  }, 30_000);

  it('SEO metadata passes compliance eval', async () => {
    const result = await runEval(seoComplianceEval);
    expect(result.passed, `Score: ${result.score}/10 — ${result.reasoning}`).toBe(true);
  }, 30_000);
});
```

## Package.json

```json
{
  "scripts": {
    "test:evals": "vitest run evals/ --reporter=verbose",
    "test:evals:watch": "vitest evals/"
  }
}
```

## Cost Model

- Haiku 4.5: $1/MTok input, $5/MTok output (verified 2026-05-28 per Anthropic pricing docs; 4× the legacy Haiku 3.5 rate this section used to quote)
- Typical eval: ~800 input + ~200 output tokens = ~$0.0018/eval
- Suite of 20 evals = ~$0.036
- Run 100×/day = ~$3.60/day
- Still cheaper than one hour debugging a regression — and prompt-caching the rubric (90% off cached input) drops the input share by ~80% at scale

## Best Practices

- **Deterministic rubrics** — numeric criteria, not vibes
- **Threshold tuning** — start at 7, tighten as quality improves
- **Eval versioning** — bump version when rubric changes to avoid false regressions
- **Multi-judge** — run 3 evals, take median for flaky-prone checks
- **Baseline capture** — record scores on main branch, fail PR if score drops

## Anti-Patterns

- Never use GPT Image 2 vision for evals (10x cost, marginally better)
- Don't judge your own output with the same model that generated it
- Don't skip reasoning field (can't debug failures)
- Don't set threshold at 10 (too brittle)
- Don't run evals synchronously (parallelize with `Promise.all`)
