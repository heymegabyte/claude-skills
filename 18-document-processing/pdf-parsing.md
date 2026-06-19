# PDF Parsing on Cloudflare Workers

Source: anthropics/skills pdf parsing pattern

Extract text and tables from uploaded PDFs for RAG ingestion, search indexing, or structured data extraction.

---

## Method A: pdf-parse (pure JS, Worker-compatible)

Best for: text extraction from digital PDFs (not scanned images).

### Install

```bash
npm install pdf-parse
```

### Worker code

```typescript
import pdfParse from "pdf-parse";

export interface ParsedPDF {
  text: string;
  pages: number;
  metadata: Record<string, string>;
  chunks: TextChunk[];
}

export interface TextChunk {
  page: number;
  text: string;
  tokens: number; // estimated (chars / 4)
}

export async function parsePDF(buffer: ArrayBuffer): Promise<ParsedPDF> {
  const data = await pdfParse(Buffer.from(buffer));

  const rawText = data.text;
  const pages = data.numpages;

  // Split into chunks for RAG (max ~500 tokens each)
  const chunks = chunkText(rawText, pages, 2000); // 2000 chars ≈ 500 tokens

  return {
    text: rawText,
    pages,
    metadata: data.info ?? {},
    chunks,
  };
}

function chunkText(text: string, totalPages: number, maxChars: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  const paragraphs = text.split(/\n\n+/);

  let current = "";
  let pageEstimate = 1;

  for (const para of paragraphs) {
    if ((current + para).length > maxChars && current.length > 0) {
      chunks.push({
        page: pageEstimate,
        text: current.trim(),
        tokens: Math.ceil(current.length / 4),
      });
      current = "";
      pageEstimate = Math.min(pageEstimate + 1, totalPages);
    }
    current += para + "\n\n";
  }

  if (current.trim()) {
    chunks.push({ page: pageEstimate, text: current.trim(), tokens: Math.ceil(current.length / 4) });
  }

  return chunks;
}
```

---

## Method B: Workers AI Llama Vision (scanned PDFs / images)

Best for: scanned documents, forms, handwritten content.

```typescript
export async function parsePDFWithVision(
  env: Env,
  imageBuffer: ArrayBuffer, // Convert PDF page to image first
): Promise<string> {
  const response = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: [...new Uint8Array(imageBuffer)] },
          { type: "text", text: "Extract all text from this document. Preserve structure. Output plain text only." },
        ],
      },
    ],
    max_tokens: 2048,
  });

  return (response as { response: string }).response;
}
```

---

## RAG ingestion pipeline

Full pipeline: upload → parse → chunk → embed → store in Vectorize.

```typescript
import { Vectorize } from "@cloudflare/workers-types";

export interface Env {
  R2: R2Bucket;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  DB: D1Database;
}

export async function ingestDocument(
  env: Env,
  file: File,
  documentId: string,
  metadata: { title: string; source: string; userId: string },
): Promise<{ chunks: number; vectors: number }> {
  // 1. Parse
  const buffer = await file.arrayBuffer();
  const parsed = await parsePDF(buffer);

  // 2. Store original in R2
  await env.R2.put(`documents/${documentId}/original.pdf`, buffer, {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: metadata,
  });

  // 3. Embed each chunk
  const vectors: VectorizeVector[] = [];

  for (const [i, chunk] of parsed.chunks.entries()) {
    const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: chunk.text,
    });

    vectors.push({
      id: `${documentId}-chunk-${i}`,
      values: (embedding as { data: number[][] }).data[0],
      metadata: {
        documentId,
        chunkIndex: i,
        page: chunk.page,
        text: chunk.text.slice(0, 500), // Store preview in metadata
        ...metadata,
      },
    });
  }

  // 4. Upsert into Vectorize
  await env.VECTORIZE.upsert(vectors);

  // 5. Record in D1
  await env.DB.prepare(
    `INSERT OR REPLACE INTO documents (id, title, source, user_id, chunks, pages, ingested_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(documentId, metadata.title, metadata.source, metadata.userId, parsed.chunks.length, parsed.pages, new Date().toISOString())
    .run();

  return { chunks: parsed.chunks.length, vectors: vectors.length };
}
```

### D1 schema

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  user_id TEXT NOT NULL,
  chunks INTEGER NOT NULL DEFAULT 0,
  pages INTEGER NOT NULL DEFAULT 0,
  ingested_at TEXT NOT NULL,
  INDEX idx_documents_user (user_id)
);
```

### Query (RAG retrieval)

```typescript
export async function queryDocuments(
  env: Env,
  query: string,
  userId: string,
  topK = 5,
): Promise<Array<{ text: string; score: number; documentId: string; page: number }>> {
  // Embed query
  const embedding = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: query });
  const queryVector = (embedding as { data: number[][] }).data[0];

  // Search Vectorize
  const results = await env.VECTORIZE.query(queryVector, {
    topK,
    filter: { userId },
    returnMetadata: "all",
  });

  return results.matches.map((m) => ({
    text: (m.metadata?.text as string) ?? "",
    score: m.score,
    documentId: (m.metadata?.documentId as string) ?? "",
    page: (m.metadata?.page as number) ?? 0,
  }));
}
```

---

## Worker compatibility notes

- `pdf-parse` depends on `Buffer` — available in Workers via CF compatibility flags
- Add `compatibility_flags = ["nodejs_compat"]` to `wrangler.toml`
- Large PDFs (>10MB): upload to R2 first via presigned PUT, then process async via Queue + Workflow
- Vectorize limit: 1536 dimensions (bge-base-en-v1.5 = 768 dims — ✓ compatible)
