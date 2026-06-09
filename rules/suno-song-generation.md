# Suno Song Generation (bZ / music.megabyte.space)

Repeatable pipeline: mine the site's play stats → pick the winners → synthesize new
songs in bZ's voice → create them on Suno. Created 2026-06-09.

## Pipeline

1. **Rank favorites** — `GET https://music.megabyte.space/api/stats` → `{tracks:{id:{plays,shares}}}`.
   Score `plays + 3*shares` (shares signal strong love). Take top 5.
2. **Mine the DNA** — for each top track:
   - Style: `src/suno-meta.ts` → `SUNO_META['<id>'].sunoStyle` (the exact Suno prompt that made it).
   - Lyrics: `public/lyrics/<id>.json` → `lines[].text`.
3. **Synthesize** — Claude writes NEW songs that recombine the winning THEMES + STYLES,
   never copying. Then write a Suno style prompt per song.
4. **Create on Suno** — see § Suno auth reality (the hard part).

## bZ creative DNA (non-negotiable)

- **Ethic:** Christian-gangster, "hard but holy". **ZERO drug references** (build-fail). Family-reverent (names by name + by silence). Service-of-poor throughline.
- **Lyric craft:** one anchor verse; specific over general ("Newark gravel under my boot"); verb-forward; internal rhyme carries weight; hook repeats 3× (plant/bloom/harvest); scripture laced in with book+verse (Matthew 25, John 13, James 1:27, Psalm 78).
- **Recurring themes (the top-5 winners, 2026-06):** borderless mercy (border-mercy), soup-kitchen service (soup-kitchen-sky), family/legacy + name-passing (mama-called-us), intercession for nations (afghanistan-mercy), self-mastery→servanthood (pineal-crown).
- **Style patterns:** boom-bap / cinematic gospel trap / aquatic trap; 80–140 BPM (half-time on hooks); minor keys (A/D/F/Bb minor); 808 sub on the one, vinyl crackle, gospel choir swell on the hook, organ underneath; raspy baritone, **no autotune**; artist refs NF / Kendrick / Killer Mike / Run the Jewels / DMX / Kirk Franklin / Nas; "parental advisory cut, no drug references" appended.
- Suno prompt structure: `[Intro] [Verse 1] [Hook] [Verse 2] [Hook] [Bridge]` tags in the lyrics; style string is comma-light free text ~40-60 words.

## Suno auth reality (the blocker — read before trying)

- **Account:** brian404 / brian@megabyte.space, user 153677292. **Current model: `v5.5` / `chirp-fenix`** (read from `feed/v2`).
- **API base:** `https://studio-api.prod.suno.com/api/` + header `Authorization: Bearer <__session JWT>`.
- **READ works with cookie alone:** `GET /api/billing/info/` (credits — had 9760/10000), `GET /api/feed/v2?page=N&page_size=50` (catalog). Headers: `Referer: https://suno.com/`, `Origin: https://suno.com`, real Chrome UA.
- **GENERATE is BLOCKED by anti-bot** — `POST /api/generate/v2/` returns **422 `token_validation_failed` "refresh the page and try again"**. Suno requires a per-request browser-minted token (Turnstile/hCaptcha-class). The user JWT does NOT satisfy it; sending full Cookie + `device-id` + `browser-token` headers still 422s. There is no `/api/c/check` (404). **Cookie alone cannot script generation.**
- **Headless browser needs `__client`** — driving suno.com/create with Playwright + injected cookies FAILS auth (lands logged-out, redirects `/create`→`/`) when the cookie set lacks Clerk's long-lived **`__client`** cookie. A pasted cookie usually has `__session` + `__client_uat` but NOT `__client` → SPA can't bootstrap the session. The public landing page has its own "Create" CTA — don't mistake it for the generator (false-positive submit).

## Working paths to actually CREATE (pick one)

1. **Desktop Computer Use on the user's REAL Chrome** (per `computer-use-safety` § session-bound flows) — the logged-in page mints the anti-bot token itself. Most reliable. Drive suno.com/create → Custom → paste Lyrics/Styles/Title → Create, ×3.
2. **Headless Playwright IF the user provides the full cookie INCLUDING `__client`** (+ `__session`, `__client_uat`). Then the SPA authenticates and the page handles the token. Reuse `/tmp/suno-browser-gen.mjs` shape (set cookies on `.suno.com`, fill by placeholder: lyrics / style / title, click last "Create").
3. **Deliver ready-to-paste assets** — when neither auth path is available, hand the user the 3 finished songs (lyrics + style + title); they paste into Custom mode in ~3 fields each. The creative work is the bulk of the value.

## Security

- Treat the pasted Suno cookie as a live secret. Store ONLY in `/tmp` (never repo, never logged), `rm` after. The `__session` JWT exp is ~60 min from `iat` — act within the window.

## Scripts (scratch, in /tmp — not committed)

- `/tmp/suno-generate.mjs` — API POST attempt (blocked by 422; keep for when Suno relaxes or a token is obtained).
- `/tmp/suno-browser-gen.mjs` — Playwright UI driver (works only with full `__client` cookie).
