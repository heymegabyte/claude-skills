---
name: "forms-editors-content-supervisor"
priority: 3
pack: "content"
triggers:
  - "form"
  - "editor"
  - "monaco"
  - "tiptap"
paths:
  - "*"
---

# Forms + Editors + Content Supervisor

Schema-driven forms and migratable, versioned editor state. Reactive Forms + NGX Formly for input; Monaco/Shiki/Lexical/GrapesJS for editing; every saved state is Zod-validated JSON, never an opaque blob. The forms/editors arm of the supervisor system.

## When this fires

- Any form beyond a trivial single field
- Any code / config / prompt / template / rich-text / visual editing surface
- Any content-management feature

## Forms

- **Angular Reactive Forms** — typed `FormGroup<T>`, never template-driven
- **NGX Formly** — schema-driven forms where form count/complexity justifies it; derive the Formly schema from Zod via `zod-to-json-schema`
- **Zod** — validates form output client-side AND the server re-validates per `validation-error-handling-supervisor`
- Loading / empty / error / success states on every form per `angular-large-app-supervisor`

## Editor doctrine (three-mode site editor)

- **Code view** — Monaco Editor + Shiki highlight for code / config / template / prompt editing (preserve or create)
- **Preview view** — live responsive preview (preserve or create)
- **Visual view** — GrapesJS drag-and-drop UI editor (add as the third mode)
- **Rich text** — Lexical for polished prose editing
- **CMS** — Payload CMS only where true content management is a product feature
- **Blockly** — only where a blocks / visual-logic surface genuinely fits

## Editor state contract

- Store editor state as **versioned JSON** where practical (schema version field)
- **Zod-validate** saved state on every read/write — no opaque, un-migratable blobs
- Support **draft / publish** lifecycle + **undo/redo** where practical + **import/export**
- Support **responsive previews** + inline **accessibility checks**
- Migration path defined for every state-shape bump

## Tooling

- **Monaco Editor** + **Shiki** — code/config/prompt/template editing + highlight
- **Lexical** — rich text
- **GrapesJS** — visual/drag-and-drop editor view
- **Payload CMS** — content management where it's a real feature
- **Blockly** — visual logic only when it fits
- **pdf-lib** — PDF generation/edit (reports, exports, proposals, invoices, site packets) — see `media-file-document-supervisor`
