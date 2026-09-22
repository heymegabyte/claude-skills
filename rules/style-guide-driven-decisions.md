# Style-Guide-Driven Decisions

Architecture, structure, naming, and tooling decisions cite an established, published style
guide or convention — never ad-hoc taste. When a reputable guide covers the decision, follow it
and NAME it in the artifact that records the decision. "Because it felt right" is not a rationale;
"per <named guide>" is.

Cross-links: `[[code-style]]` `[[stack-selector]]` `[[naming-no-transient-prefixes]]` `[[inverted-abstraction-pyramid]]` `[[drift-detection]]` `[[documentation-as-code]]` `[[one-way-two-way-doors]]`

## The mandate

- Before deciding repo layout / module boundaries / naming / lint / formatting / commit style /
  API shape / directory structure, find the authoritative published convention and follow it.
- Name the source in the recording artifact (commit body, ADR, PR, code comment): `per <guide>`.
  An undocumented structural choice is drift per `[[drift-detection]]` — fix on sight.
- Deviate only with a written reason (one-way-door self-argument per `[[one-way-two-way-doors]]`).
  Deviation without rationale is the anti-pattern this rule exists to kill.

## Canonical guides by decision class

- **Monorepo layout** — every deployable app under `apps/`, shared code under `packages/`/`libs/`
  (Nx, Turborepo, pnpm-workspaces conventions). No deployable app at the repo root once a
  monorepo exists.
- **TypeScript / JS** — Google TypeScript Style Guide + `[[code-style]]`.
- **Angular** — the official Angular Style Guide + `[[code-style]]` § Angular.
- **Commits** — Conventional Commits + gitmoji per `[[lint-doctrine]]`.
- **REST / HTTP** — the framework's official guide + `[[hono-api]]`; Google API Design Guide for
  resource naming.
- **CSS** — the platform baseline + `[[code-style]]` § CSS.
- **Accessibility** — WCAG 2.2 AA. Never a homegrown a11y bar.
- **Python** — PEP 8 via Ruff.
- **Bash** — Google Shell Style Guide + ShellCheck / shfmt.

## How to apply

1. Name the decision class (layout / naming / lint / API / a11y / …).
2. Pull the authoritative guide: official docs > widely-adopted community standard > framework
   example. Use Context7 / WebSearch when unsure of the current version.
3. Follow it; cite it in the recording artifact.
4. Two guides conflict → prefer the one closest to the stack's official source; record why.

## Anti-patterns

- Inventing a bespoke folder structure when a monorepo convention exists.
- Ad-hoc naming / formatting "to taste" when a published guide covers it.
- Deviating from a standard with no written rationale.
- Recording a structural decision with no cited source.
