---
name: "media-file-document-supervisor"
priority: 3
pack: "media"
triggers:
  - "upload"
  - "pdf"
  - "image upload"
paths:
  - "*"
---

# Media + File + Document Supervisor

Uploads are validated, size-capped, type-restricted, compressed, and tenant-safe. OCR output is untrusted. The media arm of the supervisor system.

## When this fires

- Any file/image upload surface
- Any gallery / lightbox / PDF generation / OCR import

## Tooling

- **Uppy** — upload orchestration (resumable, multi-source, progress)
- **compressor.js** — client-side image compression before upload
- **cropper.js** — image cropping
- **pdf-lib** — PDF creation/editing (reports, exports, proposals, invoices, site packets)
- **Tesseract.js** — OCR (output is UNTRUSTED — Zod-validate + sanitize per `validation-error-handling-supervisor`)
- **PhotoSwipe** — galleries / lightboxes where real media galleries exist
- **postal-mime** — inbound email parsing
- **web-push** — push payloads (pairs with `notifications-email-webhooks-supervisor`)
- **dayjs** — timestamps/formatting

## Rules

- **Validate every upload** — MIME type + extension + magic-byte sniff, never trust the client filename
- **Enforce size limits** + **allowed file types** at the boundary (reject early, friendly error)
- **Compress** images where useful (compressor.js) + **crop** where useful (cropper.js)
- **Generate previews** (thumbnails) on ingest
- **pdf-lib** for any PDF generation/edit — never a paid PDF service
- **OCR output is untrusted** — treat Tesseract.js text as user input: Zod-parse, sanitize, never eval/render-raw
- **Tenant-safe** — every asset path is org/tenant-scoped; storage behind the `StoragePort` adapter per `cloudflare-hostable-supervisor` (R2 default)
- Strip EXIF/GPS from user images unless explicitly needed
