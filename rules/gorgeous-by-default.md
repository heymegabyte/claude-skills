# Gorgeous By Default (***SUPREME — every element, every surface, every project***)

Nothing ships plain. Every element a user can see gets a deliberate, beautiful, animated treatment — never the framework default, never raw text where a designed component belongs. Two non-negotiable halves: (1) **enumerable values render as pills, never comma-joined text**, and (2) **every interactive + decorative element is gorgeous, animated, and transitions at `0.333s`**.

## Half 1 — Enumerable values are ALWAYS pills (never `join(', ')`)

Any set of discrete, enumerable values rendered to the screen MUST be a row of styled pills / chips / badges — one per value. Comma-joining them into a sentence (`roles.join(', ')`, `tags.join(' · ')`, `"admin, donor, volunteer"`) is a build-fail-class mistake: it reads as raw data, not designed UI.

### What this covers (each value = its own pill)
- **Roles / permissions** — `admin · donor · super_admin · volunteer` → 4 pills
- **Tags / categories / topics / keywords**
- **Statuses / states** (`active`, `pending`, `paused`) — color-coded per state
- **Locales / languages** (`en · es · pt · ht`)
- **Services / programs / amenities offered**
- **Skills / interests / badges / achievements**
- **Filters currently applied** (removable pills with an `×`)
- **Any `string[]` shown to a user** — if it's an array, it's pills

### Pill contract (every pill)
- One pill per array item — `array.map(...)`, never `array.join(...)`
- Rounded-full, padded (`px-3 py-1`), small-but-legible type, `font-medium`
- Brand-token background + contrast-safe text per [[text-contrast]] (dark pill → light text; light pill → dark text)
- State-aware color where the value implies state (success/warn/danger/neutral)
- `0.333s` transition on hover/focus + a subtle lift or glow ([[gorgeous-by-default]] Half 2)
- Staggered entrance animation when the row first renders (per-pill delay) — reduced-motion-safe
- Accessible: the group has an `aria-label` (e.g. "Roles"); if pills are interactive they're real `<button>`/`<a>` with focus rings; if purely informational, a `<ul>`/`<li>` or `role="list"`
- Empty state is its own pill or a designed "None yet" affordance — never a bare word

### Anti-pattern (the exact mistake this rule kills)
```tsx
// ❌ raw CSV text — reads as a database dump
roles: {user.roles.join(', ')}

// ✅ one gorgeous pill per role
<ul aria-label="Roles" className="flex flex-wrap gap-2">
  {user.roles.map((r, i) => (
    <li key={r} style={{ animationDelay: `${i * 60}ms` }}
        className="pill-enter rounded-full bg-maroon-100 px-3 py-1 text-sm font-medium text-maroon-900
                   transition-all duration-[333ms] hover:-translate-y-0.5 hover:bg-maroon-200 hover:shadow-md">
      {ROLE_LABEL[r] ?? r}
    </li>
  ))}
</ul>
```

## Half 2 — Everything gorgeous, animated, `0.333s`

Every element a user sees gets a deliberate, beautiful treatment. "Functional but plain" is incomplete per the user-level Progressively-Gorgeous UI Mandate — this rule operationalizes the per-element bar.

### The `0.333s` standard
- Default transition duration is **`0.333s`** (`duration-[333ms]` / `transition: ... 0.333s`) for hover, focus, enter, color, transform — unless a faster micro-interaction (≤150ms tap feedback) or a slower cinematic reveal is deliberately chosen
- Every interactive element declares a `transition` — no instant state jumps
- Pair every transition with `prefers-reduced-motion: reduce` honoring (snap to final state; never hide content)

### Per-element gorgeous checklist (apply to every element you render)
- **Transition** — `0.333s` on all state changes (hover/focus/active/enter)
- **Hover affordance** — lift (`-translate-y-0.5`), glow (`shadow-md`), or tint shift
- **Focus-visible ring** — brand-color ring ≥3:1, never the UA default outline
- **Entrance** — fade + 16px rise on first paint (`appReveal`/`@starting-style`), staggered for groups
- **Rounded + padded** — no flush, hard-edged framework defaults
- **Brand tokens** — never a hardcoded hex; OKLCH brand vars per [[text-contrast]]
- **Tabular-nums** on any number; rolling counters on stats per [[cinematic-ui-patterns]]
- **Reduced-motion + contrast-safe** — every animation gated; every text/element pair WCAG AA

### Where this applies
- Pills, chips, badges, tags, cards, buttons, links, inputs, toggles, avatars, stat blocks, list rows, table cells, nav items, modals, toasts, empty states, dividers, section headers — **every element**, not just the hero
- Admin + dashboard surfaces too — internal ≠ ugly. The /account, /admin, /me surfaces get the same gorgeous bar as marketing pages

## Self-critique (before shipping any element)
1. Is any `string[]` rendered as joined text? → convert to pills
2. Does every interactive element transition at `0.333s`? → add it
3. Does it have a hover affordance + focus-visible ring? → add them
4. Is it reduced-motion-safe + contrast-safe? → gate + fix
5. Would Brian call it gorgeous, not just functional? → if no, iterate

## Reference incident (***2026-06-08 — njsk.org /account roles***)
The `/account` page rendered `roles: {user.roles.join(', ')}` → the plain string `"roles: admin, donor, super_admin, volunteer"`. Brian: *"the 'roles: admin, donor, super_admin, volunteer' text should have been 4 pills instead — always apply gorgeous styles to every element. Make everything absolutely gorgeous + beautiful + stunning + animated + transition 0.333s."* Fix: 4 animated, staggered, contrast-safe role pills + this rule so every enumerable value set becomes pills and every element meets the `0.333s` gorgeous bar across every future project.

## See
- [[cinematic-ui-patterns]] — `<app-rolling-counter>` + `appReveal` + the standing every-stat-animates rule (this rule is the every-element generalization)
- [[proactive-improvements]] — "just feels right" per-element polish; this rule sets the floor (pills + `0.333s`)
- [[supreme-polish]] — the 100-ideas audit measures against this per-element bar
- [[spartan-ui-design-system]] — Angular pill/badge composition on the same contract
- [[text-contrast]] — every pill's bg/text pair is contrast-safe (dark→light, light→dark)
- [[brian-preferences]] — Progressively-Gorgeous UI Mandate (user-level); never ship "functional but plain"
- [[prompt-as-training-signal]] §2 ("always ___") + §6 (explicit meta-instruction) — the prompt shape that birthed this rule
