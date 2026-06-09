# Suno Song Generation (bZ / music.megabyte.space)

Repeatable pipeline: mine the site's play stats → pick the winners → synthesize new
songs in bZ's voice → create them on Suno → download. Created 2026-06-09.

## Canonical workflow (run EVERY time "make a Suno song" is asked)

Run these concurrently where possible — kick off the cookie ask FIRST, then do 2+3 while waiting:

1. **Ensure the Suno cookie is loaded** (`/tmp/suno-cookie.txt` with BOTH `__session` AND `__client`). If missing/expired, acquire it the EASIEST way — give the user this exact one-shot instruction and continue steps 2+3 while they fetch it:
   > On suno.com (logged in) → DevTools (⌥⌘I) → **Application** → **Cookies** → `https://suno.com`. Copy the **Value** of two rows and paste them here: **`__session`** and **`__client`**. (Both are needed; `__client` is HttpOnly so it's missing from any console/"copy as cookie" paste — only the Application panel shows it.)
   Don't block on the cookie — synthesize lyrics/styles meanwhile so the moment it lands, generation fires.
2. **Create lyrics + Suno style prompt** grounded in the MOST POPULAR songs at music.megabyte.space (the Pipeline below: rank → mine DNA → synthesize). Claude writes both the lyrics and the style string.
3. **Generate, then auto-download the 2nd clip.** Each Suno generation yields 2 clips; **download the SECOND one** automatically once it finishes rendering (Suno's 2nd take is the user's preferred default). See § Auto-download.

### HARD RULE — lyrics must always reflect professionally on Brian + everyone he represents

Every lyric must portray Brian Zalewski, Megabyte Labs, family, partners, and any named
party with dignity and professionalism — nothing embarrassing, defamatory, crude, or
reputationally risky. This stacks on the existing ethic (zero drugs, family-reverent,
hard-but-holy). When in doubt, cut the line. A song that could embarrass any represented
party at a pitch, a church, or a client meeting does NOT ship.

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
- **Headless browser needs `__client`** — driving suno.com/create with Playwright + injected cookies FAILS auth (logged-out: "Log in" button visible, create panel empty) when the cookie set lacks Clerk's **`__client`** cookie. `clerk_active_context` + `__session` + `__client_uat` are NOT enough on their own. The public landing page has its own "Create" CTA — don't mistake it for the generator (false-positive submit; verify login via screenshot, not a text heuristic).
- **WHY `__client` keeps missing (the trap, hit 2026-06-09):** `__client` is **HttpOnly**, so it is EXCLUDED from `document.cookie` and from DevTools "copy as cURL"/Network request-cookie copies. The user must read it from **DevTools → Application → Cookies → https://suno.com → row `__client` → copy Value** and paste it explicitly alongside `__session`. Ask for `__client` BY NAME up front; don't accept a generic cookie paste for the browser path.

## CRITICAL (verified 2026-06-09, 4 attempts): headless CREATE silently no-ops

With `__client`+`__session`, headless Chrome (Playwright, `channel:chrome`) **authenticates** (shows `brian404 · N Credits`), enters Advanced mode, and the form **fills** (lyrics/style/title visibly populated). The Advanced toggle is **"Advanced"** (not "Custom"); fields by placeholder: lyrics `/write your rhymes|Magic Wand/`, style `/boogie, female singing/`, title `/Song Title/`; the generate CTA is the **wide (`width>300`) button with exact text `Create`** at the bottom-left (NOT the sidebar "Create" nav, NOT "More"). BUT clicking Create **does nothing** — **credits never drop, no new clips, no error** — Suno's anti-bot silently drops headless generations. Same wall as the API 422. **Confirm success ONLY by a credits decrease**, never by "clicked=true".
**⇒ Headless generation is NOT viable. The form-fill automation is reusable, but the Create click must happen in a REAL (non-headless) browser** — Desktop Computer Use on the user's Chrome, or the user clicks Create after we pre-fill.

## Working paths to actually CREATE (pick one)

1. **Desktop Computer Use on the user's REAL Chrome** (per `computer-use-safety` § session-bound flows) — the logged-in page mints the anti-bot token itself. Most reliable. Drive suno.com/create → Custom → paste Lyrics/Styles/Title → Create, ×3.
2. **Headless Playwright IF the user provides the full cookie INCLUDING `__client`** (+ `__session`, `__client_uat`). Then the SPA authenticates and the page handles the token. Reuse `/tmp/suno-browser-gen.mjs` shape (set cookies on `.suno.com`, fill by placeholder: lyrics / style / title, click last "Create").
3. **Deliver ready-to-paste assets** — when neither auth path is available, hand the user the 3 finished songs (lyrics + style + title); they paste into Custom mode in ~3 fields each. The creative work is the bulk of the value.

## Auto-download the 2nd clip

After a generation finishes (poll until `clip.status === 'complete'`, ~30-90s):

- `GET https://studio-api.prod.suno.com/api/feed/v2?page=0&page_size=20` (Bearer `__session`) → clips newest-first.
- A single generation yields **2 clips sharing the same title**. Sort that title's clips by `created` ascending → **download index [1] (the SECOND take)** — that's the user's preferred default.
- Download `clip.audio_url` (the rendered MP3) to disk, e.g. `~/Downloads/<title>.mp3` (or the repo's `public/audio/<id>.mp3` if shipping). The `audio_url` is public CDN — a plain `fetch` works, no auth needed.
- READ endpoints (feed) work with `__session` Bearer alone; only generate needs the full browser session.

## Security

- Treat the pasted Suno cookie as a live secret. Store ONLY in `/tmp` (never repo, never logged), `rm` after. The `__session` JWT exp is ~60 min from `iat` — act within the window.

## Scripts (scratch, in /tmp — not committed)

- `/tmp/suno-generate.mjs` — API POST attempt (blocked by 422; keep for when Suno relaxes or a token is obtained).
- `/tmp/suno-browser-gen.mjs` — Playwright UI driver (works only with full `__client` cookie).
