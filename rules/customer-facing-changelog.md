---
name: "customer-facing-changelog"
priority: 2
pack: "core"
triggers:
  - "changelog"
  - "release notes"
  - "what's new"
  - "whats new"
  - "customer changelog"
  - "CHANGELOG"
  - "ship announcement"
  - "feature announcement"
paths:
  - "CHANGELOG.md"
  - "src/web/pages/changelog*"
  - "apps/**/changelog*"
  - "public/changelog*"
  - "worker/routes/changelog*"
---

# Customer-Facing Changelog Discipline

Every change **visible to a user** — new feature, behavior change, deprecation, pricing update — gets one line in a customer-readable changelog. Publish on ship, not on sprint close.

This is NOT the git commit log. It is written for the person using the product.

## Format

```
## YYYY-MM-DD

- **New:** You can now export any report to CSV from the toolbar. [screenshot]
- **Changed:** The dashboard loads 2× faster on mobile thanks to pre-rendered HTML.
- **Breaking:** `/api/v1/notes` is removed. Use `/api/v2/notes` — same params, richer response.
- **Fixed:** Duplicate emails on signup are now caught before confirmation is sent.
```

Rules:

- Date heading `## YYYY-MM-DD` groups same-day entries
- Prefix tag: `New:` / `Changed:` / `Fixed:` / `Breaking:` / `Deprecated:`
- 1–2 sentences, user-outcome language: "You can now…", "X loads faster…", not "feat: add csv_export"
- Optional screenshot path for `New:` entries that change a UI surface: `[screenshot](/changelog/screenshots/2026-06-18-csv-export.png)`
- `Breaking:` prefix mandatory when a public API, URL, or data format changes

## Where to publish

- **OSS / CLI tools** — `CHANGELOG.md` at repo root, kept in git
- **Web apps** — `/changelog` route rendered from `CHANGELOG.md` or a D1-backed API; same file, different surface
- **Marketing sites** — `/changelog` static page (vite-ssg or SSG route), updated on deploy

## Trigger: when to write an entry

Write an entry the **same turn** you ship any of:

- A new UI surface the user can interact with
- A new API endpoint or a breaking change to an existing one
- A behavior change (different default, new validation, changed error message)
- A deprecation (even if the old thing still works)
- A pricing or plan change
- A bug fix that users reported or would notice

Do NOT write an entry for:

- Internal refactors with no user-visible change
- Dependency version bumps with no behavioral change
- Test or CI changes
- Comment/doc edits

## Feature flags → changelog trigger

When a flag moves to `stage='stable'` at `rollout_percent=100`, that is the changelog trigger:

```ts
// worker/admin/feature-flags.ts — on stage promotion
if (newStage === 'stable' && newRollout === 100) {
  await appendChangelog(env, {
    date: new Date().toISOString().slice(0, 10),
    prefix: 'New',
    text: flag.description, // use the flag's user-facing description
  })
}
```

Per `feature-flags`, every flag row carries a `description` written in user-outcome language — that description IS the changelog entry.

## Solo builder advantage

No committee review. Write it as you ship it. A changelog entry takes 90 seconds. The absence of one costs trust every time a user notices a change they weren't told about.

## `CHANGELOG.md` maintenance rules

- Newest entries at the **top** (reverse chronological)
- Max **5 entries per date heading** — if more, group minor fixes under `- Multiple bug fixes and performance improvements`
- Archive entries older than 12 months to `docs/changelog-archive/YYYY.md` to keep the live file scannable
- Never delete `Breaking:` entries — they live in the archive forever

## Example `/changelog` route (Hono)

```ts
// worker/routes/changelog.ts
import { Hono } from 'hono'
import { marked } from 'marked'

const app = new Hono<{ Bindings: Env }>()

app.get('/changelog', async (c) => {
  // Serve CHANGELOG.md from R2 or embed at build time
  const raw = await c.env.CHANGELOG_BUCKET.get('CHANGELOG.md')
  const html = raw ? marked(await raw.text()) : '<p>No changelog yet.</p>'
  return c.html(`<!doctype html><html><body>${html}</body></html>`)
})
```

Or ship as a static SSG page (vite-ssg / TanStack):

```tsx
// src/web/pages/changelog.tsx
import changelogRaw from '../../../CHANGELOG.md?raw'
import { marked } from 'marked'

export default function ChangelogPage() {
  return <article dangerouslySetInnerHTML={{ __html: marked(changelogRaw) }} />
}
```

## Cross-links

- **[[todos-are-roadmap]]** — TODO items that ship become changelog entries
- **[[feature-flags]]** — `stage='stable'` promotion = changelog trigger
- **[[solo-rituals-eliminated]]** — no release notes ceremony; write the entry inline when shipping
- **[[prompt-as-training-signal]]** — user asking "what changed?" = missing changelog entry; write it immediately
- **[[drift-detection]]** — shipped feature without a changelog entry is drift; add it in-turn
