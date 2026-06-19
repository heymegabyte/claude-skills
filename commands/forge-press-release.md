---
name: forge-press-release
description: Scaffold an Amazon-style working-backwards press release for any feature, in Brian's voice. Outputs to docs/decisions/PR-{slug}.md and prints to stdout.
---

# /forge-press-release <one-sentence-feature-description>

Writes a 1-page Amazon-style press release (PR/FAQ lite) in Brian's terse, punchy brand voice.
Mirrors the working-backwards method: customer value first, implementation last.

## Usage

```
/forge-press-release "AI-powered invoice matching that auto-reconciles bank feeds with zero manual entry"
```

## Logic

1. Parse `<one-sentence-feature-description>` from args.
2. Derive a URL-safe slug from the first 5 significant words.
3. Ensure `docs/decisions/` exists (create alongside any existing ADRs).
4. Render the press release using the template below — fill every section with real copy
   inferred from the description; zero placeholders, zero bracket-fill.
5. Write to `docs/decisions/PR-<slug>.md`.
6. Print the rendered file to stdout.

## Voice rules (per `[[copy-writing]]`)

- Terse, sharp-punchy, anti-slop. Brian's voice: direct, confident, slightly irreverent.
- Headline: ≤10 words, present tense, customer benefit in the subject.
- Subheadline: one crisp amplifying clause.
- Body paragraphs: 2-4 sentences each. No passive voice. No "leveraging", "synergy", "seamless".
- Quotes: real-sounding, not corporate. Brian quote = founder candor. Customer quote = specific outcome, not vague praise.
- CTA: action verb + what the reader does next.

## Output template

```markdown
# PR: <Headline — ≤10 words, present-tense customer benefit>

**<Subheadline — one clause amplifying the headline>**

---

## Summary

<2-3 sentences. What shipped, who it's for, the single biggest outcome. Journalist-ready.>

## Problem

<2-3 sentences. The before state. Real pain, real cost. No hypotheticals.>

## Solution

<3-4 sentences. What it does, how it works at a high level. Feature-specific. No buzzwords.>

## Founder Quote

> "<Brian's candid take — why this matters, what surprised him, what he'd tell a founder friend.>"
> — Brian Zalewski, Megabyte Labs

## Customer Quote

> "<Specific outcome a real user would say. Named role (e.g., "Bookkeeper at a 12-person agency").>"
> — <Role>, <Company type>

## Call to Action

<One sentence. What to do right now: visit URL / enable flag / sign up / schedule demo.>

---

*This press release was written before a single line of code. If you can't describe the customer
value in plain English, you're not ready to build it.*
```

## Execution script

```bash
DESCRIPTION="$*"

if [[ -z "$DESCRIPTION" ]]; then
  echo "Usage: /forge-press-release <one-sentence-feature-description>"
  exit 1
fi

# Derive slug: first 5 significant words, lowercased, hyphenated
SLUG=$(echo "$DESCRIPTION" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-z0-9 ]//g' \
  | awk '{for(i=1;i<=NF&&i<=5;i++) printf $i"-"; print ""}' \
  | sed 's/-$//')

OUTDIR="docs/decisions"
OUTFILE="${OUTDIR}/PR-${SLUG}.md"

mkdir -p "$OUTDIR"

echo "Generating press release for: $DESCRIPTION"
echo "Output: $OUTFILE"
echo "Slug: $SLUG"
echo ""
echo "→ Fill every section with real copy. No placeholders. Ship this doc before writing code."
```

## ADR alignment

Place this PR doc alongside any `ADR-*.md` files in `docs/decisions/`.
The naming convention `PR-<slug>.md` keeps PRs visually distinct from ADRs.
Link the PR from the ADR that implements it: `> Preceded by: [PR-<slug>](./PR-<slug>.md)`.
