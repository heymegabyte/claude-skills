---
name: "AI Technology Integration"
description: "Latest AI APIs, models, and techniques for building AI-native products. GPT-4o vision for visual QA, Workers AI for edge inference, embeddings for RAG, structured outputs, image/video generation, speech, and the visual TDD loop."
allowed-tools: "Bash, Read, Write, Edit, mcp__playwright__*"
---

# AI Technology Integration

## Visual TDD Loop (MANDATORY every deploy)
```
Build -> Deploy -> Screenshot (6 breakpoints) -> GPT-4o Vision -> Fix Issues -> Redeploy -> Repeat until 0 issues
```

**Quick (inline):** Playwright screenshot + GPT-4o structured analysis via API
**Automated:** `/Users/apple/.agentskills/scripts/visual-tdd-loop.sh https://example.com 5`
**Single image:** `/Users/apple/.agentskills/scripts/gpt4o-vision-analyze.sh screenshot.png`

Run after: every deploy, CSS/layout changes, new pages, UI PRs, competitive analysis.
Acceptance: all 6 breakpoints clean, zero critical/high issues, max 5 iterations.

## Model Selection
| Task | Model | Cost | Latency |
|------|-------|------|---------|
| Visual QA | GPT-4o | ~$0.01/img | 2-5s |
| Code gen | Claude Opus 4.6 | Included | - |
| Logo | Ideogram v3 | ~$0.03 | 5-10s |
| Hero/scene image | gpt-image-1 | ~$0.04 | 10-20s |
| Hero video (4s) | Sora | ~$0.10 | 30-60s |
| Alt text | Workers AI (llama-3.2-11b-vision) | Free | <1s |
| Embeddings | Workers AI (bge-base-en-v1.5) | Free | <100ms |
| Translation | Workers AI (m2m100-1.2b) | Free | <1s |
| Summaries | Workers AI (llama-3.1-8b) | Free | <1s |
| Speech-to-text | Deepgram Nova-2 | $0.0043/min | Real-time |
| Web search | Firecrawl (self-hosted) | Free | 1-3s |

### API Keys (in rare-chefs/.env.local)
OPENAI_API_KEY, ANTHROPIC_API_KEY, IDEOGRAM_API_KEY, REPLICATE_API_TOKEN, CLOUDFLARE_API_TOKEN

## Workers AI Patterns
```typescript
// Text: await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [...] });
// Vision: await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { image: bytes, prompt: '...' });
// Embeddings: await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [...] });
// Translation: await env.AI.run('@cf/meta/m2m100-1.2b', { text, source_lang, target_lang });
```

Wrangler: `[ai] binding = "AI"` + `[[vectorize]] binding = "VECTORIZE_INDEX" index_name = "site-content"`

## GPT-4o Structured Outputs
```typescript
response_format: { type: 'json_schema', json_schema: { name: 'visual_qa', schema: {
  properties: { score: { type: 'number' }, issues: { type: 'array', items: { properties: {
    severity: { enum: ['critical','high','medium','low'] }, element: {}, description: {}, fix: {} } } }, summary: {} }
} } }
```

## Image Generation

**Logo (Ideogram):** `"Minimalist logo for [BRAND], cyan (#00E5FF) on black (#060610), clean geometric, no text, vector style"` — V_3, 1:1, DESIGN style
**Hero (GPT Image):** `"Dark atmospheric hero, abstract geometric, cyan light on deep black, premium tech, 21:9"` — gpt-image-1, 1536x1024, high
**OG (1200x630):** Generate 1536x1024 then resize with CF Image Resizing

**Critique Loop:** Generate -> GPT-4o rate 1-10 -> if <8 remix with improved prompt -> max 3 iterations

## RAG Architecture (Cloudflare)
```typescript
// 1. Embed query
const queryEmbed = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
// 2. Search Vectorize
const results = await env.VECTORIZE_INDEX.query(queryEmbed.data[0].values, { topK: 5, filter: { tenantId } });
// 3. Build context from chunks
const context = results.matches.map(m => m.metadata.text).join('\n\n');
// 4. Generate with context
await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [{ role: 'system', content: `Answer from:\n${context}` }, { role: 'user', content: query }] });
```

## AI Integration Points
07 Quality (visual TDD), 08 Deploy (post-deploy vision), 09 Brand (copy/tone), 10 Design (critique), 12 Media (gen+critique), 14 Idea Engine (research), 20 A11y (alt text), 28 SEO (keywords/meta), 37 Search (RAG), 42 i18n (translation), 43 AI Chat (RAG bot)

## Ownership
**Owns:** AI model selection, Visual TDD loop, image/video generation, Workers AI patterns, RAG architecture, structured outputs, cost optimization.
**Never owns:** Deployment (->08), testing framework (->07), media pipeline (->12), brand strategy (->09).
