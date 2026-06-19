---
name: "cf-rag-vectorize-pattern"
priority: 2
pack: "architecture"
triggers:
  - "rag"
  - "vectorize"
  - "embedding"
  - "semantic search"
  - "knowledge base"
paths:
  - "**/vectorize/**"
  - "**/embeddings/**"
  - "**/rag/**"
---

# CF RAG — Workers AI + Vectorize + D1 + Workflows

Reference RAG pipeline on Cloudflare-native primitives. No LangChain, no Pinecone, no Supabase pgvector. Just Workers AI for embeddings, Vectorize for storage/query, D1 for raw text + metadata, Workflows for durable ingestion.

Source: `kristianfreeman/cloudflare-retrieval-augmented-generation-example` (★135). See `[[cloudflare-lock-in-is-leverage]]`.

## When to use

- Need semantic search over a corpus (docs, blog posts, support tickets, transcripts)
- Need grounded LLM responses citing your corpus
- Already on CF — don't drag in Pinecone/Supabase if you don't have to

## Pattern A: Ingestion as a Workflow — atomic steps

```ts
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';

export class RAGWorkflow extends WorkflowEntrypoint<Env, { text: string }> {
  async run(event: WorkflowEvent<{ text: string }>, step: WorkflowStep) {
    const { text } = event.payload;

    // Step 1 — persist raw text in D1 (idempotent via INSERT RETURNING)
    const record = await step.do('create database record', async () => {
      const { results } = await this.env.DATABASE.prepare(
        'INSERT INTO notes (text) VALUES (?) RETURNING *'
      ).bind(text).run<Note>();
      return results[0];
    });

    // Step 2 — embed (768-dim for bge-base-en-v1.5)
    const embedding = await step.do('generate embedding', async () => {
      const e = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', { text });
      if (!e.data[0]) throw new Error('Failed to generate vector embedding');
      return e.data[0]; // number[]
    });

    // Step 3 — upsert to Vectorize keyed by D1 row id
    await step.do('insert vector', async () =>
      this.env.VECTOR_INDEX.upsert([{ id: record.id.toString(), values: embedding }])
    );
  }
}
```

**Why Workflows here**: if embedding fails (Workers AI hiccup), step 1 is NOT re-run — D1 row already exists. Each `step.do()` is independently retried with exponential backoff.

## Pattern B: Query — Vectorize → D1 join

```ts
app.get('/search', async (c) => {
  const question = c.req.query('q')!;

  const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: question });
  const vectorQuery = await c.env.VECTOR_INDEX.query(embeddings.data[0], { topK: 3 });

  const ids = vectorQuery.matches.map(m => m.id);
  const { results } = await c.env.DATABASE
    .prepare(`SELECT * FROM notes WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all<Note>();

  return c.json({ notes: results, scores: vectorQuery.matches.map(m => m.score) });
});
```

Vectorize stores ONLY embedding vectors. D1 stores the actual text. Join by ID at query time.

## Pattern C: Grounded answer — RAG prompt with Anthropic via AI Gateway

```ts
const systemPrompt = 'Use the provided context, if relevant. If you cannot answer from context, say so.';
const contextMessage = notes.length
  ? `Context:\n${notes.map((n, i) => `[${i+1}] ${n.text}`).join('\n')}`
  : '';

// Anthropic primary via AI Gateway (cached, observable)
const anthropic = new Anthropic({
  apiKey: c.env.ANTHROPIC_API_KEY,
  baseURL: `https://gateway.ai.cloudflare.com/v1/${c.env.CF_ACCOUNT_ID}/my-gateway/anthropic`,
});

await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  system: [systemPrompt, contextMessage].filter(Boolean).join('\n'),
  messages: [{ role: 'user', content: question }],
});

// Workers AI fallback (free, on-net):
// await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: [...] });
```

Per `[[opus-quota-fallback]]` — fall back to Workers AI Llama if Anthropic quota exhausted.

## Pattern D: Paired delete — never orphan vectors

```ts
app.delete('/notes/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DATABASE.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
  await c.env.VECTOR_INDEX.deleteByIds([id]); // orphan vectors silently pollute future queries
  return c.json({ deleted: id });
});
```

## wrangler.jsonc — full RAG bindings

```jsonc
{
  "ai": { "binding": "AI" },
  "vectorize": [{ "binding": "VECTOR_INDEX", "index_name": "myproject-semantic" }],
  "d1_databases": [{ "binding": "DATABASE", "database_name": "myproject", "database_id": "..." }],
  "workflows": [{ "name": "rag-workflow", "binding": "RAG_WORKFLOW", "class_name": "RAGWorkflow" }]
}
```

## Vectorize index — create with correct dimensions

```sh
# bge-base-en-v1.5 is 768 dimensions, cosine is appropriate
wrangler vectorize create myproject-semantic --dimensions=768 --metric=cosine
```

Mismatched dimensions = silent insertion failure. Always match the embedding model exactly.

## Anti-patterns

- ❌ `@langchain/textsplitters` — adds bundle weight; for simple chunking, inline a 20-line splitter
- ❌ Direct Anthropic SDK without AI Gateway — lose caching + observability + cost reduction (30-80% per `[[model-routing]]`)
- ❌ Index name encoding dimensions (`tutorial-index-768`) — use semantic names like `myproject-semantic`
- ❌ Storing text in Vectorize metadata — use D1 for text, Vectorize for vectors only

## Cross-link

- `[[cloudflare-lock-in-is-leverage]]` — Vectorize > Pinecone
- `[[model-routing]]` — AI Gateway routing
- `[[opus-quota-fallback]]` — Workers AI Llama fallback
- `[[zod-everywhere]]` — Zod schemas at every boundary
- `cf-workflows-pattern` (this dir) — pattern reused
- `cf-agents-do-pattern` (this dir) — agents can call RAG queries via tools
