---
name: "grammar-audit"
description: "Final LLM-powered grammar/clarity pass after copy generation. Fixes typos, agreement, tense, capitalization, Oxford comma WITHOUT rewriting or removing information. Outputs a diff, not a rewrite."
updated: "2026-05-01"
---

# Grammar Audit (***FINAL COPY PASS — EVERY SITE, EVERY BUILD***)

After all copy is generated (hero, body, blog, FAQ, microcopy, legal), run `grammar-audit.mjs` (GPT Image 2 vision-mini, concurrency 5-8) to fix mechanical errors WITHOUT rewriting. The pass is a corrective filter, not a creative rewrite.

## Mandate (NON-NEGOTIABLE)

### Fix

- Typos
- Spelling
- Subject-verb agreement
- Tense consistency
- Pronoun agreement
- Apostrophes / possessives
- Hyphens vs en / em dashes
- Capitalization (proper nouns, titles, sentence case)
- Oxford comma consistency (apply Oxford by default — flip site-wide if voice rejects it)
- Quotation mark direction
- Spacing (single space after period)
- Numbers (≥10 numeric, <10 spelled — except dates / times / money)
- a vs an before vowel sounds
- than vs then
- who vs whom (when natural)
- its vs it's
- their / there / they're
- affect vs effect

### NEVER

- Rewrite for style
- Shorten
- Lengthen
- Change meaning
- Remove content
- Replace banned-word with synonym (anti-slop is skill 09's job, not grammar's)
- Rephrase voice
- Add / remove information
- Reformat structure
- Translate idioms

## Output Shape

```json
{
  "edits": [
    { "file": "src/data/blog-posts.ts", "before": "She recieved her PHD in 2019,", "after": "She received her PhD in 2019,", "reason": "spelling+capitalization" },
    { "file": "src/pages/about.tsx", "before": "...colleagues, mentors and students.", "after": "...colleagues, mentors, and students.", "reason": "oxford-comma" }
  ]
}
```

Apply edits in-place via `Edit` tool calls. Idempotent — re-running on already-corrected copy produces empty `edits[]`.

## Run Conditions

1. After `clean_content` blog import (skill 15) and after `enhance-blog-posts.mjs`
2. After main page copy generation (homepage, about, services, contact, FAQ)
3. After legal page copy (privacy, terms, accessibility, cookies)
4. Before `gorgeous-loop` final pass (skill 06)
5. Re-run on demand via `node scripts/grammar-audit.mjs --only=<file>`

## Concurrency + Cost

- GPT Image 2 vision-mini at ~$0.15/1M input + $0.60/1M output
- Per site — ~50K input tokens (all copy concatenated) + ~5K output (diff only) = ~$0.01/site
- Concurrency 5-8 against the API
- CLI — `--only=path`, `--limit=N`, `--dry-run`

## Scope Boundaries (***WHAT IT NEVER TOUCHES***)

- Direct quotes (preserve verbatim — author voice)
- Named-entity spelling (verified against `_research.json`)
- Brand names
- Technical jargon (verified against `_research.json.industry_terms`)
- Code blocks
- URLs
- Email addresses
- Phone numbers
- Dates
- Money figures
- Proper nouns flagged in `_research.json.entities[]`

## Hard Gate

After grammar pass — re-run `gate` script. If grammar pass introduced any error caught by other gates (link 404, citation regex match, banned-word match), revert that specific edit and flag in `audit_logs`. Grammar pass is corrective — it never breaks other gates.

## Voice Preservation

Author voice is sacred. Never normalize "ain't" → "is not" if voice is colloquial. Never remove rhetorical fragments. Never add "that" when omitted intentionally ("She knew [that] he'd come."). The audit asks — "Did the author intend this?" → if yes, leave alone.

## Reference Anchors

- Strunk & White (1959) for clarity baseline
- Chicago Manual of Style 17th ed for capitalization / comma
- APA 7th for academic citations
- AP Stylebook for journalism

**Default:** Chicago for body copy, AP for blog / news, APA for citations (`rules/citations.md`).
