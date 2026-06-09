---
name: "bolt-artifact-protocol"
description: "Bolt-style XML envelope protocol for projectsites.dev generator. Multi-file artifact emission, ordering rules, plan-first discipline, action types, runtime execution semantics."
updated: "2026-04-30"
---

# Bolt Artifact Protocol

## Why This Replaces Single-HTML Output

- Legacy generator (Llama 3.1 70B → 16K-token single inline HTML, "Under 80KB total") cannot produce multi-page, media-rich, blog-bearing sites
- **Symptoms**: missing blog, missing favicons, missing logo, single-page collapse, gradient hero placeholders
- **Root cause**: no protocol for emitting >1 file, no template inheritance, no plan-first discipline
- Bolt's `<boltArtifact>` envelope is the right shape — single XML container with ordered sequence of file-write + shell actions
- Proven in production at bolt.new since 2024, adopted by v0/Lovable/Replit with minor variants
- Runtime parses artifact, writes each file, runs each shell, in order. Cloud Build / Workers / `wrangler deploy` at end

## Envelope Shape

```xml
<boltArtifact id="site-{slug}" title="{Business Name} site">
  <boltAction type="file" filePath="PLAN.md">…plan markdown…</boltAction>
  <boltAction type="file" filePath="package.json">…json…</boltAction>
  <boltAction type="file" filePath="src/index.css">…css…</boltAction>
  <boltAction type="file" filePath="src/components/Layout.tsx">…tsx…</boltAction>
  …
  <boltAction type="shell">npm install &amp;&amp; npm run build</boltAction>
</boltArtifact>
```

**One artifact per generation.** No nested artifacts, no multiple top-level artifacts, no prose outside the envelope.

## Action Types

- **`file`** — `filePath` required (repo-relative), body = full file contents, effect = overwrite or create file at path
- **`shell`** — `filePath` omitted, body = one-line command, runs in workspace root, must succeed (non-zero exit fails build)

No other action types. No `start`, no `import`, no `web` (Bolt has those, projectsites.dev doesn't need them — the runtime always runs `npm install && npm run build` at the end).

## Ordering Rules (***NON-NEGOTIABLE***)

Runtime writes files in document order, then runs shell actions in document order. Order must obey dependency chains:

1. **`PLAN.md` first** — 200-token plan block: route tree, design-token diff vs template, media count, file count. Forces plan-first discipline.
2. **`package.json` + `tailwind.config` + `vite.config` + `tsconfig`** — config layer first so `npm install` resolves.
3. **`public/` static assets** — favicons, manifest, robots, sitemap, og-image. Image binaries handled by `scripts/generate-favicons.mjs` shell action — artifact emits script, not binary.
4. **`src/index.css`** — design tokens before any component imports.
5. **`src/types/`** — shared types before components.
6. **`src/lib/`** + **`src/utils/`** — utilities before components.
7. **`src/components/`** — UI primitives before pages.
8. **`src/data/`** — `blog-posts.ts`, `services.ts`, etc. before pages.
9. **`src/pages/`** — pages last, after everything they import.
10. **`src/App.tsx` + `src/main.tsx`** — router + entry after all routes.
11. **shell actions** — `npm install && node scripts/generate-favicons.mjs && npm run build && node scripts/validate-assets.mjs dist`.

Violating order = build fails on missing import.

## Plan-First Discipline (***FIRST ACTION ALWAYS***)

First `<boltAction>` MUST be `filePath="PLAN.md"` containing:

```markdown
# Plan
- Route tree: /, /about, /services, /contact, /blog, /blog/:slug, /privacy, /terms (+ {domain extras})
- Tokens: brand-50…950 OKLCH from logo, font-heading={font}, font-body={font}, mode={dark|light|auto}
- Media manifest: {N} images consumed ({M} hero variants, {S} section, {V} service, {B} blog hero)
- Blog posts: {N} typed-block entries (avg {avg} blocks/post)
- Files written: {N}
- Vite chunks: react-vendor, lightbox, motion, route-{name}
- Validators: validate-assets.mjs, validate-meta.mjs, validate-citations.mjs, validate-h1.mjs
```

Forcing plan as a real file (not comment, not chat message) means it's auditable post-build, version-controlled, visible to next iteration.

## Runtime Semantics

projectsites.dev workflow consumes the artifact:

```typescript
// src/workflows/site-generation.ts (after rewire)
const artifact = parseArtifact(claudeResponse);
const workdir = await cloneTemplate('megabytespace/template.projectsites.dev');
for (const action of artifact.actions) {
  if (action.type === 'file') {
    await writeFile(join(workdir, action.filePath), action.body);
  } else if (action.type === 'shell') {
    await runShell(action.body, { cwd: workdir });
  }
}
const dist = join(workdir, 'dist');
await uploadToR2(dist, slug);
await wranglerDeploy(slug);
```

Container with: Node 20+, Bun 1.x optional, ImageMagick (favicon fallback), pdftoppm (PDF preview), git, curl, jq.

## Anti-Patterns

- Emitting prose before the artifact ("I'll create a beautiful site for you…")
- Emitting markdown fences around the artifact
- Emitting multiple top-level artifacts
- Files referenced in imports but not emitted (gives Vite "module not found")
- Pages emitted before components they import
- Skipping `PLAN.md`
- Using shell actions to write files — use `type="file"` actions; shell is for `npm install`, build commands, validators
- Embedding binary image data in `<boltAction>` bodies — emit a `scripts/generate-*.mjs` script that produces them at build time

## Comparison to Adjacent Protocols

- **Bolt.new** — `<boltArtifact>` + `<boltAction>`. Mature, predictable, plan-first, ordered.
- **v0** — `<CodeProject>` block, file inside. Proprietary, less suited to multi-file.
- **Lovable** — `lov-write`, `lov-add-dependency`. Tool-call style, harder to stream.
- **Replit** — `<replitArtifact><replitAction>`. Same shape as Bolt, naming differs.
- **Claude Code Tool Use** — individual `Write` tool calls. Works in IDE, doesn't fit a generation API.

Picked Bolt's shape because:

1. Widely understood by Claude from training data
2. Streamable token-by-token (file content streams while next file's metadata buffers)
3. Verifiable (parser can reject malformed envelopes before any file write)
4. Plan-first by convention

## Validation

Before executing artifact, runtime parses + validates:

```typescript
function validateArtifact(artifact: BoltArtifact): string[] {
  const errors: string[] = [];
  if (artifact.actions[0]?.filePath !== 'PLAN.md') errors.push('First action must be PLAN.md');
  const requiredFiles = [
    'package.json', 'tailwind.config.js', 'vite.config.ts', 'index.html',
    'src/index.css', 'src/main.tsx', 'src/App.tsx',
    'src/components/Layout.tsx', 'src/components/Lightbox.tsx',
    'src/pages/Home.tsx',
    'public/robots.txt', 'public/sitemap.xml', 'public/site.webmanifest',
  ];
  for (const f of requiredFiles) {
    if (!artifact.actions.find((a) => a.filePath === f)) errors.push(`Missing required file: ${f}`);
  }
  if (!artifact.actions.find((a) => a.type === 'shell' && /npm.+build/.test(a.body))) {
    errors.push('Missing build shell action');
  }
  return errors;
}
```

Failed validation → re-prompt Claude with error list. Max 2 retries.

## Streaming Considerations

When using Anthropic streaming API:

- Stream `text_delta` events into a parser emitting `boltAction-start`, `boltAction-body-delta`, `boltAction-end` events
- Write file as soon as `boltAction-end` fires (don't buffer entire artifact)
- Lets user see file-by-file progress in projectsites.dev dashboard
- `npm install` shell action starts as soon as `package.json` finishes streaming

## Cost & Throughput

- Claude Opus 4.8 at $5/MTok input, $25/MTok output (same as 4.7/4.6; Fast Mode $10/$50, down from 4.7's $30/$150). Verified 2026-05-28 per Anthropic pricing docs.
- Typical site artifact: ~80K output tokens (40 files × 2K avg) = $6/site
- Parallel generation (concurrent businesses) bounded only by Anthropic rate limits + container capacity
- Llama 3.1 70B baseline was ~$0.30/site → upgrade pays for itself when conversion lift > 5% of LTV

## See Also

- `~/.agentskills/15-site-generation/SKILL.md` — pipeline overview
- `~/.agentskills/15-site-generation/template-system.md` — template clone semantics
- `~/.agentskills/15-site-generation/quality-gates.md` — post-build validators
- `~/.agentskills/15-site-generation/validate-assets.mjs` — asset existence gate
- `github.com/megabytespace/template.projectsites.dev` — template source
