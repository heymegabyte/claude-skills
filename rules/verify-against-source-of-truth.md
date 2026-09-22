# Verify Against Source of Truth (Data Reconciliation)

Render-integrity verification is BLIND to wrong-data. A surface that loads cleanly — 200, 0 console errors, 0 failed requests, axe-clean, a screenshot that looks fine — can still display the WRONG data (an empty state while real records exist, or a stale/different count). Every prior check only proved *"the UI renders what its endpoint returns"* — never *"the endpoint returns what the AUTHORITATIVE STORE actually contains."* Close that gap: reconcile display-vs-store, not just render-vs-endpoint.

Cross-links: `[[verification-loop]]` `[[response-key-mismatch-lying-empty]]` `[[swallowed-sql-error-masks-schema-drift-as-404]]` `[[fail-fast-build-fail-soft-prod]]` `[[drift-detection]]`

## The blind spot (how the class slips through)

- **Empty renders cleanly.** "No traffic yet" / "0 results" / "not available" passes EVERY render-integrity gate. A screenshot of an honest-looking empty state scores fine on AI-vision. Nothing distinguishes *honestly-empty* (0 real records) from *lying-empty* (records exist, UI reads the wrong source).
- **Single-source verification is self-referential.** Checking "does the UI show what the endpoint returns" never asks "does the STORE contain records the UI should be showing but isn't." A wrong-source bug is a mismatch between the write-store and the read-source — structurally invisible to a one-source check.
- **200 + empty reads as "working."** A `200 {items:[]}` from the WRONG endpoint isn't broken — it's the wrong endpoint. All the health gates stay green.
- **Reference incident (projectsites, 2026-08-06):** `/admin/analytics` showed "never had any traffic" for a site with **109 real pageviews** in D1 `visitor_events` — the UI read CF-zone `httpRequestsAdaptiveGroups`-per-host (empty for `*.projectsites.dev` subdomains). Survived ~30 render-integrity fires; a prior memory even concluded the empty was "honest 0-traffic." Only a human with ground truth ("I just visited it") caught it.

## The discipline — reconcile every data surface

For every surface that DISPLAYS stored data, verification MUST cross-check two independent things:

1. **Ground truth** — query the AUTHORITATIVE STORE directly (D1 table / Tinybird / R2 / Stripe) for the real account: does it have records for this concept? (`SELECT COUNT(*) … WHERE org_id = <real user>`).
2. **Display** — call the surface's endpoint AS THE REAL USER (real session, real browser if the API is bot-challenged) and extract what it shows.
3. **Flag divergence** — `groundTruth > 0 && display == 0` → **LYING-EMPTY**. `groundTruth != display` (counts differ) → **WRONG-SOURCE / STALE**. `groundTruth == 0 && display == 0` → honest-empty (fine).

A surface is "verified populated" ONLY when its display reconciles with its store — never on render-integrity alone.

## The causal test (strongest finder for "I did X, it's not shown")

For trackable surfaces (pageviews, submissions, events, orders): perform the action → assert the STORE records it → assert the DISPLAY surfaces it. This catches the exact "I visited the site and it says no traffic" class that static reconciliation of a quiet account can miss.

## Build the reconciler as a reusable tool, not a one-off

- A ground-truth data sweep (`SELECT COUNT(*)` per concept for the real account) is the objective "which surfaces MUST show data" map — run it FIRST; it tells you where to look.
- A display reconciler logs in as the real user (in a real browser when the API 403s headless bot calls — `page.evaluate(fetch + Bearer)`), hits each surface, and diffs against ground truth.
- Reference impl: projectsites `e2e/admin-verify/reconcile-surfaces.mjs` — reconciled 9 admin data surfaces; found analytics was the sole divergence (7 others clean). Keep it and re-run each verification pass.

## Anti-patterns

- Concluding an empty state is "honest 0-traffic / correct empty" from the SAME source the UI reads — always confirm against the authoritative store.
- Marking a section "verified, populated" on a green render + a screenshot, without a ground-truth count behind it.
- Trusting a `200` as "the data is right" — a wrong-source endpoint returns 200.
- Verifying with a test-org account that has no data (everything honestly-empty → nothing to reconcile) when the real user's account is where the data + the bug live.
