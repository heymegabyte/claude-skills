---
description: Audit whether user-visible changes in the current session have matching CHANGELOG.md entries; report MISSING with suggested lines; --fix auto-appends
argument-hint: [--fix] [--base <ref>] [--changelog <path>]
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Audit CHANGELOG.md coverage for every user-visible file changed since the last release, per [[customer-facing-changelog]].

**Purpose** — shipped features without changelog entries erode user trust one silent change at a time. This command catches the gap before commit or deploy.

**When to use** — before committing user-facing work; as part of the deploy gate; after a multi-agent build session touches components or routes; on demand.

**Inputs**

- `--fix` — auto-append missing CHANGELOG.md lines (asks for confirmation before writing)
- `--base <ref>` — compare against this ref instead of `main` (e.g. `--base HEAD~3`)
- `--changelog <path>` — path to CHANGELOG.md; defaults to `./CHANGELOG.md`

---

## Step 1 — Identify changed files

Run:

```sh
git diff --name-only <base>...HEAD
```

where `<base>` is `--base` arg or `main`.

If the working tree has uncommitted changes, also include:

```sh
git diff --name-only HEAD
```

Deduplicate. This is the full changed-file list.

---

## Step 2 — Categorize: user-facing vs internal

Classify each changed file:

**User-facing** (changelog entry REQUIRED):

- `src/components/**` — UI components
- `src/web/routes/**` — page routes
- `src/web/pages/**` — page files
- `src/pages/**` — alternative page dir
- `apps/**/src/app/features/**` — Angular feature modules
- `apps/**/src/app/pages/**` — Angular page components
- `public/**` (excluding `public/fonts/**` and `public/icons/**` — those are invisible to users)
- `content/**` — CMS content, blog posts, docs
- `worker/routes/**` — API endpoints (user-visible behavior)
- `CHANGELOG.md` itself — always user-facing, never flag as missing

**Internal** (no changelog entry needed):

- `lib/**`, `src/lib/**` — internal utilities
- `scripts/**` — build/deploy scripts
- `config/**`, `*.config.*` — tooling config
- `e2e/**`, `**/*.spec.ts`, `**/*.test.ts` — tests
- `**/__mocks__/**` — test mocks
- `.github/**`, `.claude/**`, `hooks/**` — CI and agent config
- `*.md` files outside `content/` (except `CHANGELOG.md`)

Emit a two-column categorization table:

```
CHANGED FILES
═════════════

User-facing (require changelog):
  src/components/ExportButton.tsx
  worker/routes/reports.ts
  public/images/hero-v2.png

Internal (no changelog needed):
  lib/utils/format.ts
  scripts/deploy.sh
  e2e/export.spec.ts
```

---

## Step 3 — Check CHANGELOG.md coverage

Read the CHANGELOG.md file (at `--changelog` path or `./CHANGELOG.md`).

If the file does not exist, treat ALL user-facing files as missing coverage.

For each user-facing file:

1. Extract the "noun" from the file path — the basename without extension (e.g. `ExportButton`, `reports`, `hero-v2`).
2. Also extract the parent segment for compound names (e.g. `features/csv-export` → `csv-export`).
3. Search CHANGELOG.md for any entry since the last `## YYYY-MM-DD` heading that:
   - Contains the noun (case-insensitive), OR
   - Contains a synonym (heuristic: `snake_case → space-separated`, `PascalCase → words`), OR
   - References the route or endpoint path (e.g. `/api/v2/reports`).
4. If NO match found → mark as **MISSING**.

---

## Step 4 — Report MISSING entries

For each MISSING file, emit:

```
MISSING CHANGELOG ENTRIES
═════════════════════════

  src/components/ExportButton.tsx
  → Suggested entry:
    - **New:** You can now export any report to CSV directly from the toolbar.

  worker/routes/reports.ts
  → Suggested entry:
    - **Changed:** Report data now loads in real time — no more stale numbers on refresh.

  public/images/hero-v2.png
  → Suggested entry:
    - **Changed:** The homepage hero has a fresh look that's sharper on high-DPI screens.

Run with --fix to append these lines to CHANGELOG.md automatically.
```

Suggestion voice rules (per [[customer-facing-changelog]]):

- Open with "You can now…" for `New:` / "The <noun> now…" or "X loads faster…" for `Changed:`.
- 1–2 sentences max. Outcome-language — what the user gains, not what code changed.
- Infer prefix tag from file type: new component → `New:`, route change → `Changed:` or `Fixed:`, image → `Changed:`.
- Never use dev jargon ("refactor", "PR", "feat:", "BREAKING CHANGE", "hotfix").

If ALL user-facing files have matching entries:

```
✓ CHANGELOG.md is current — all user-visible changes have entries.
```

---

## Step 5 — --fix: auto-append to CHANGELOG.md (with confirmation)

If `--fix` is passed and there are MISSING entries:

1. Show the user the exact lines that will be appended:

```
Will prepend to CHANGELOG.md under today's date heading (## 2026-06-18):

  - **New:** You can now export any report to CSV directly from the toolbar.
  - **Changed:** Report data now loads in real time — no more stale numbers on refresh.
  - **Changed:** The homepage hero has a fresh look that's sharper on high-DPI screens.

Confirm? (y/n):
```

2. On `y` (or `CLAUDE_CHANGELOG_AUTOFIX=1` env var):
   - If today's `## YYYY-MM-DD` heading already exists in CHANGELOG.md, insert lines immediately after it.
   - If it does not exist, prepend the heading + lines at the top of the file (below any frontmatter).
   - Respect the 5-entries-per-date rule: if the heading already has 5+ entries, group additional fixes under `- Multiple improvements and bug fixes.`

3. Emit: `CHANGELOG.md updated — N entries added under ## YYYY-MM-DD`

4. On `n`, emit: `Skipped. Add entries manually or re-run with --fix.`

---

## Step 6 — Summary gate

Exit summary:

```
CHANGELOG CHECK SUMMARY
  User-facing files:    7
  With coverage:        5
  MISSING entries:      2  ← run with --fix to resolve

Gate: FAIL — commit blocked until CHANGELOG.md is updated.
      Run /customer-changelog-check --fix   OR   set CLAUDE_CHANGELOG_BYPASS=1 to override.
```

If all covered:

```
CHANGELOG CHECK SUMMARY
  User-facing files:    7
  With coverage:        7
  MISSING entries:      0

Gate: PASS ✓
```

---

**Verification** — After `--fix`, grep to confirm entries landed:

```sh
head -20 CHANGELOG.md   # confirm today's heading + new entries at top
```

**See**

- `rules/customer-facing-changelog.md` — format, trigger conditions, solo-builder rationale
- `rules/feature-flags.md` — flag promotion to `stage='stable'` = automatic changelog trigger
- `rules/drift-detection.md` — shipped feature without changelog entry is drift; fix in-turn
- `/drift-check` — broader drift audit that catches changelog gaps alongside other signals
