---
name: "document-processing"
description: "PDF/DOCX/XLSX/PPTX generation and parsing on Cloudflare Workers. Covers CF Browser Rendering → PDF, pdf-lib Worker-native generation, docx/exceljs output, pptxgenjs slides, and RAG-ready text extraction. Use cases: donor annual reports, SaaS invoices, tax receipts, financial reports, grant applications. Source: anthropics/skills pdf/docx/pptx/xlsx patterns."
when_to_use: "Any request involving document output (invoice, report, receipt, export) or document input (parse a PDF, extract tables, RAG ingestion from uploaded docs)."
effort: "high"
model: "inherit"
priority: 5
pack: "documents"
stage: stable
triggers:
  - "PDF"
  - "invoice"
  - "receipt"
  - "annual report"
  - "DOCX"
  - "XLSX"
  - "spreadsheet"
  - "PPTX"
  - "slide deck"
  - "parse document"
  - "extract text"
  - "RAG ingestion"
paths:
  - "src/worker/**"
  - "apps/**"
  - "workers/**"
---

# 18 — Document Processing

Worker-native document I/O. All generation runs at the edge — no Lambda, no container, no third-party conversion SaaS.

## Sub-modules

- `pdf-generation.md` — CF Browser Rendering → PDF + pdf-lib fallback
- `pdf-parsing.md` — text + table extraction for RAG ingestion
- `docx-xlsx.md` — DOCX (docx library) + XLSX (exceljs) generation in Workers
- `pptx-generation.md` — PPTX via pptxgenjs in Workers

## Decision tree

```
Need document output?
├── PDF (invoice / receipt / report)
│   ├── Complex layout (HTML → PDF) → CF Browser Rendering
│   └── Programmatic (no layout) → pdf-lib in Worker
├── DOCX / XLSX (data export / mail merge)
│   ├── DOCX → docx library (pure JS, Worker-compat)
│   └── XLSX → exceljs (no canvas dep, Worker-compat)
└── PPTX (slide deck / pitch deck)
    └── pptxgenjs (Worker-compat, no native deps)

Need document input (RAG)?
├── PDF text → pdf-parse (pure JS) or Workers AI document extraction
└── Tables → structured JSON → D1 or Vectorize
```

## Cloudflare primitives used

- `CF Browser Rendering` — puppeteer-compatible Workers binding for HTML → PDF
- `R2` — store and serve generated documents
- `D1` — job state + document metadata
- `Workers AI` — optional OCR for scanned PDFs (Llama Vision)
- `Queues` — async generation jobs (large reports)

## Use case map

| Use case | Format | Method |
|---|---|---|
| SaaS invoice | PDF | pdf-lib → R2 |
| Tax receipt (nonprofit) | PDF | CF Browser Rendering → R2 |
| Donor annual report | PDF | CF Browser Rendering (full layout) |
| Financial export | XLSX | exceljs → R2 |
| Grant application | DOCX | docx → R2 |
| Board slide deck | PPTX | pptxgenjs → R2 |
| RAG: donor docs | Text | pdf-parse → Vectorize |

## Cross-links

- `rules/cloudflare-lock-in-is-leverage.md` — CF Browser Rendering over puppeteer SaaS
- `rules/feature-flags.md` — gate new doc types behind flag before GA
- `13-observability-and-growth/` — track document generation events in PostHog
- `08-deploy-and-runtime-verification/` — smoke-test R2 presigned URL after deploy
