---
name: "notebooklm-pipeline"
description: "Per-site podcast (two-host audio overview) + infographic gallery + explainer video — built from research corpus, embedded on /about (podcast+infographic) + / homepage BTF (video). RSS feed + Apple Podcasts/Spotify submission + JSON-LD."
updated: "2026-05-02"
---

# NotebookLM Pipeline

Every site ships 3 NotebookLM-style artifacts auto-generated from `_research.json` + `_pdf_facts.json` + `_corpus.json`: (1) two-host **audio podcast** rendered on `/about` + listed at `/podcast.xml` RSS, (2) **infographic gallery** (≥3 panels: data chart + branded panel + hero illustration) rendered on `/about`, (3) **explainer video** (60-90s talking-head OR 8s hero loop) rendered BTF (second screen) on `/` homepage. Pipeline runs in Phase 0 alongside Media Slot Manifest enumeration so artifacts exist BEFORE Phase 1 page builds reference them. Total cost ceiling ~$3/site (podcast $0.40 + infographic $0.60 + video $1.50 + hosting+TTS overhead $0.50). Daily spend tracked in `_notebooklm_daily.json` against `NOTEBOOKLM_DAILY_BUDGET` (default $300/day = ~100 sites).

## Artifact Manifest (`_notebooklm.json` — Phase 0 step 2)

Mirrors `_media_slots.json` shape so the same fail-CLOSED auto-regenerate pattern applies. Schema:
```json
{
  "podcast": {
    "title": "<Brand>: <One-Sentence Pitch>",
    "subtitle": "Two-host audio overview generated from research corpus",
    "duration_target_sec": 1800,
    "duration_actual_sec": null,
    "host_a": { "name": "Sage", "voice_id": "21m00Tcm4TlvDq8ikWAM", "persona": "skeptical journalist" },
    "host_b": { "name": "River", "voice_id": "AZnzlk1XvdvUeBnXmlld", "persona": "curious enthusiast" },
    "transcript_url": "<R2>/podcast/transcript.json",
    "audio_url": "<R2>/podcast/episode-01.mp3",
    "cover_url": "<R2>/podcast/cover-3000.jpg",
    "rss_guid": null,
    "filled_by": null,
    "filled_score": null,
    "regen_attempts": 0,
    "provider_chain": ["elevenlabs-studio", "autocontent-api", "notebooklm-py-headless", "fallback-skip-with-warning"]
  },
  "infographic": {
    "panels": [
      { "panel_id": "data-chart", "type": "vega-lite", "topic_intent": "...", "data_source": "_research.json.stats", "svg_url": null, "filled_score": null },
      { "panel_id": "process-flow", "type": "recraft-svg", "topic_intent": "...", "prompt": "...", "svg_url": null, "filled_score": null },
      { "panel_id": "hero-illustration", "type": "gpt-image-2", "topic_intent": "...", "prompt": "...", "png_url": null, "filled_score": null }
    ],
    "filled_panels": 0,
    "regen_attempts": 0
  },
  "explainer_video": {
    "duration_sec": 75,
    "format": "talking-head",
    "script": "...",
    "captions_vtt_url": null,
    "video_url": null,
    "cf_stream_uid": null,
    "poster_url": null,
    "filled_score": null,
    "regen_attempts": 0,
    "provider_chain": ["heygen-avatar-iv", "synthesia", "tavus", "veo-3.1-fast-fallback-loop", "skip-with-warning"]
  },
  "video_description": {
    "title": "<60 chars>",
    "description": "<400-2000 chars, paragraph 1 = quotable 40-60 word answer block>",
    "chapters": [{ "label": "Intro", "start_sec": 0 }, { "label": "Problem", "start_sec": 12 }, ...],
    "tags": ["..."],
    "transcript_url": "<R2>/video/transcript.vtt"
  }
}
```

## Audio Podcast — Two-Host Overview (***PRIMARY: ElevenLabs Studio***)

**Provider order:** (1) **ElevenLabs Studio Create Podcast** (`POST /v1/studio/podcasts` with `mode:"conversation"`, two voice IDs, source text = condensed research brief 8-15K chars) — production REST API, deterministic, no browser automation, ships finished MP3 + transcript JSON. ~$0.30/episode at 30 min. (2) **AutoContent API** ($39/mo unlimited, NotebookLM-format mimicry) when ElevenLabs quota exhausted. (3) **`teng-lin/notebooklm-py`** wrapper (Python lib, browser-automated NotebookLM consumer) ONLY in CF Container with feature flag `NOTEBOOKLM_BROWSER=1` — used for true NotebookLM-format match when client demands "made in NotebookLM" as marketing claim. (4) Skip-with-warning if all 3 fail, surface in dashboard for manual upload. NEVER block deploy on podcast — it's enrichment, not infrastructure.

**Source brief construction (Phase 0 step 2a):** gpt-4o-mini condenses `_research.json` + top-N pages of `_corpus.json` + `_pdf_facts.json` into 8-15K-char Markdown briefing — must include: brand mission, top 3 services/products, key stats (with citations per rules/citations.md), founder quote when available, 3-5 customer pain points, competitive differentiator. Saved to `_podcast_source.md` for human review + future re-runs.

**Voice selection:** default voice IDs from `~/.claude/.env` `ELEVENLABS_VOICE_HOST_A=21m00Tcm4TlvDq8ikWAM` (Rachel) + `ELEVENLABS_VOICE_HOST_B=AZnzlk1XvdvUeBnXmlld` (Domi). Override per-site via `_brand.json.podcast.voices[]` when client supplies brand voices. NEVER use the same voice for both hosts (defeats the conversation format).

**ElevenLabs API call:**
```ts
const r = await fetch("https://api.elevenlabs.io/v1/studio/podcasts", {
  method: "POST",
  headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    model_id: "eleven_turbo_v2_5",
    mode: { type: "conversation", conversation: { host_voice_id: voiceA, guest_voice_id: voiceB } },
    source: { type: "text", text: briefMd },
    duration_scale: "default",  // ~25-35 min from 10K-char source
    callback_url: `${env.PUBLIC_URL}/api/podcast-webhook`
  })
});
const { project_id } = await r.json();
// Poll GET /v1/studio/projects/{project_id} until status=converted, then download audio_url
```

**Output assets per episode:** `episode-NN.mp3` (96kbps stereo VBR, ≤1MB/min) | `transcript.json` (ElevenLabs-provided word-timing JSON) | `transcript.vtt` (derived for `<audio>` track) | `cover-3000.jpg` (3000×3000 JPEG, Apple-required, branded card via Satori with brand palette + logo + episode title) | `chapters.json` (auto-extracted from transcript via gpt-4o-mini topical-segmentation pass).

**`/about` page embed (template ships `<PodcastPlayer>`):**
```tsx
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
export function PodcastPlayer({ src, transcriptUrl, captionsVtt }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const p = new Plyr(ref.current, {
      controls: ['play','progress','current-time','duration','mute','volume','settings','captions','download'],
      settings: ['speed','captions'],
      speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] }
    });
    return () => p.destroy();
  }, []);
  return (
    <figure data-podcast>
      <audio ref={ref} controls preload="metadata" crossOrigin="anonymous">
        <source src={src} type="audio/mpeg" />
        <track kind="captions" src={captionsVtt} srcLang="en" label="English" default />
      </audio>
      <figcaption>Listen to the {brand.name} audio overview · <a href={transcriptUrl}>Read transcript</a></figcaption>
    </figure>
  );
}
```

**Transcript on-page (mandatory for SEO + accessibility):** full transcript rendered below the player as collapsed `<details><summary>Full transcript</summary>...</details>` — search engines + AI search crawlers index the text, screen-reader users get the content, mobile users save scroll. `<details>` `[open]` on desktop ≥1280px via CSS `@media (min-width:1280px) { details[data-podcast-transcript] { open:open } }` (use the JS `details.open=true` if pure-CSS unsupported).

**RSS feed `/podcast.xml` (Hono route):**
```ts
app.get('/podcast.xml', async (c) => {
  const episodes = await c.env.D1.prepare("SELECT * FROM podcast_episodes WHERE published=1 ORDER BY published_at DESC").all();
  const xml = renderRss({
    title: brand.name + " Podcast",
    link: brand.url,
    description: brand.tagline,
    image: `${brand.url}/podcast/cover-3000.jpg`,
    author: brand.founder || brand.name,
    email: brand.contact_email,
    category: brand.podcast_category || "Technology",
    episodes: episodes.results
  });
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.body(xml);
});
```

RSS template (iTunes + podcast namespace 1.0):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>{{title}}</title><link>{{link}}</link><description>{{description}}</description>
    <language>en-us</language><copyright>© {{year}} {{author}}</copyright>
    <itunes:author>{{author}}</itunes:author>
    <itunes:owner><itunes:name>{{author}}</itunes:name><itunes:email>{{email}}</itunes:email></itunes:owner>
    <itunes:image href="{{image}}"/>
    <itunes:category text="{{category}}"/>
    <itunes:explicit>false</itunes:explicit><itunes:type>episodic</itunes:type>
    <podcast:guid>{{channelGuid}}</podcast:guid>
    {{#each episodes}}
    <item>
      <title>{{title}}</title>
      <guid isPermaLink="false">{{rss_guid}}</guid>
      <pubDate>{{rfc822 published_at}}</pubDate>
      <enclosure url="{{audio_url}}" length="{{audio_bytes}}" type="audio/mpeg"/>
      <itunes:duration>{{duration_sec}}</itunes:duration>
      <itunes:episode>{{episode_number}}</itunes:episode>
      <itunes:image href="{{cover_url}}"/>
      <description><![CDATA[{{description_html}}]]></description>
      <content:encoded><![CDATA[{{transcript_html}}]]></content:encoded>
      <podcast:transcript url="{{transcript_url}}" type="application/json"/>
      <podcast:chapters url="{{chapters_url}}" type="application/json+chapters"/>
    </item>
    {{/each}}
  </channel>
</rss>
```

**Dual JSON-LD on `/about` (mandatory):**
```json
[
  {"@context":"https://schema.org","@type":"PodcastSeries","name":"<Brand> Podcast","url":"<URL>/about","webFeed":"<URL>/podcast.xml","image":"<URL>/podcast/cover-3000.jpg","author":{"@type":"Person","name":"<Founder>"}},
  {"@context":"https://schema.org","@type":"PodcastEpisode","name":"<Episode Title>","url":"<URL>/podcast/episode-01","datePublished":"<ISO>","duration":"PT47M23S","description":"<150-200 char>","associatedMedia":{"@type":"MediaObject","contentUrl":"<URL>/podcast/episode-01.mp3","encodingFormat":"audio/mpeg"},"partOfSeries":{"@type":"PodcastSeries","name":"<Brand> Podcast","url":"<URL>/about","webFeed":"<URL>/podcast.xml"},"transcript":{"@type":"CreativeWork","text":"<full transcript>","url":"<URL>/podcast/episode-01/transcript"}}
]
```

**Submission automation (post-deploy):** First-episode auto-submit to (a) Apple Podcasts Connect via `https://podcastsconnect.apple.com/api/v1/podcasts` (requires `APPLE_PODCAST_KEY_ID` + `APPLE_PODCAST_PRIVATE_KEY` JWT auth — manage at https://podcastsconnect.apple.com/access), (b) Spotify for Podcasters via web UI (no API — manual), (c) Google Podcasts deprecated 2024 → submit to YouTube Music podcast directory instead, (d) Podcast Index `https://podcastindex.org/add` (free, instant), (e) Amazon Music Podcasters `https://podcasters.amazon.com`. Document each submission in `_podcast_directories.json` with submission timestamp + directory URL + status. Brian receives email summary via Resend after first episode goes live.

## Infographic Gallery (≥3 Panels — `/about` Below Podcast)

Three-panel minimum mandatory; can scale to 6-9 panels for content-heavy sites (research orgs, B2B SaaS with deep product docs).

**Panel sources (priority order per panel type):**
1. **Data chart panel** (mandatory — 1 of 3 minimum): **Vega-Lite + Puppeteer** SVG render — free, deterministic, version-controlled. Source data from `_research.json.stats[]` + cited per rules/citations.md. Vega-Lite spec template:
   ```json
   {"$schema":"https://vega.github.io/schema/vega-lite/v5.json","width":1200,"height":675,"background":"#060610","title":{"text":"Impact in Numbers","color":"#FFF","fontSize":42},"data":{"values":[{"category":"Volunteers","value":847},{"category":"Meals Served","value":52000}]},"mark":{"type":"bar","color":"#00E5FF"},"encoding":{"x":{"field":"category","type":"nominal","axis":{"labelColor":"#FFF","titleColor":"#FFF"}},"y":{"field":"value","type":"quantitative","axis":{"labelColor":"#FFF","titleColor":"#FFF"}}}}
   ```
   Render via `npx vl2svg spec.json out.svg` then optimize via SVGO. Falls back to `vl2png` for raster sharing previews.
2. **Process / flow panel** (recommended): **Recraft v3 API** SVG generation — best programmatic SVG output with text rendering accuracy, brand-palette-aware. `POST https://external.api.recraft.ai/v1/images/generations` with `style:"vector_illustration"` + `model:"recraftv3"` + per-slot prompt naming brand palette + composition + topic. ~$0.04/SVG.
3. **Hero illustration panel** (recommended): **GPT Image 2** (`gpt-image-2` via OpenAI Images API) — ~99% character-level text accuracy in 2026, best for illustrations needing brand-text legibility. Per-slot prompt with all 6 mandatory fields (skill 12 SKILL.md "Per-Slot Prompt Mandatory Fields"). ~$0.06/image at 1536×1024.
4. **Napkin AI API** (`api.napkin.ai`) when both Recraft + GPT-Image saturated for the slot — produces SVG/PNG/PDF infographics from text prompt, $39/mo unlimited. Best for concept-explainer panels (org charts, comparison tables, timelines).

**Per-panel slot record (slots into `_notebooklm.json.infographic.panels[]`):** identical 6-field prompt structure as DALL-E slot manifest (page topic + brand palette + composition + subject specificity + technical specs + negative prompt). Validator `validate-infographic-on-about.mjs` greps for ≥3 `<svg>` OR `<img>` inside `[data-infographic-gallery]` on `/about`.

**Render on `/about` (template ships `<InfographicGallery>`):**
```tsx
export function InfographicGallery({ panels }: Props) {
  return (
    <section data-infographic-gallery aria-label="Visual highlights">
      <h2>By the Numbers</h2>
      <div className="infographic-grid">
        {panels.map((p, i) => (
          <figure key={p.panel_id} data-zoomable data-gallery="infographic" data-caption-title={p.title} data-caption-description={p.description}>
            {p.svg_url ? <object type="image/svg+xml" data={p.svg_url} aria-label={p.title} /> : <img src={p.png_url} alt={p.title} loading={i===0 ? "eager" : "lazy"} />}
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
```

Lightbox grouping inherits `data-gallery="infographic"` per always.md "Every multi-image section" rule. Captions mandatory per same rule.

## Explainer Video — Homepage BTF (Second Screen)

**Provider order:**
1. **HeyGen API** (`https://api.heygen.com/v2/video/generate`) — production winner for talking-head explainer. ~$1/min standard avatars, $4/min Avatar IV 1080p personalized. 60-90 second target ($1.50-$6/site). Custom-branded backgrounds + intro/outro animations. API docs https://docs.heygen.com.
2. **Synthesia API** (`https://api.synthesia.io/v2/videos`) — fallback, ~$0.80-1.20/min. 140+ avatars + 120+ languages.
3. **Tavus API** ($59/mo subscription + per-min credits) — when client has founder photo+voice samples for personalized digital twin. Best for high-touch B2B SaaS.
4. **Veo 3.1 Fast** ($0.15/sec, 8 sec/clip) — fallback to a CINEMATIC HERO LOOP (no narration, MP4 background) when talking-head budget exceeded or brand prefers atmospheric over instructional.
5. **Sora 2** ($0.10/sec 720p, 25s hard cap) deprecates Sept 24, 2026 — evaluate replacements (likely Sora 3 by then).

**Script generation (Phase 0 step 2c):** gpt-4o synthesizes 75-second script from `_podcast_source.md` summary (reuses the brief) — Hook (10s) → Problem (15s) → Solution (30s) → Proof (10s) → CTA (10s). Saved to `_video_script.md`. Script feeds HeyGen `script` field directly.

**HeyGen API call:**
```ts
const r = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: { "X-Api-Key": env.HEYGEN_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    video_inputs: [{
      character: { type: "avatar", avatar_id: env.HEYGEN_AVATAR_ID || "Daisy-inskirt-20220818", scale: 1.0, avatar_style: "normal" },
      voice: { type: "text", input_text: scriptMd, voice_id: env.HEYGEN_VOICE_ID || "1bd001e7e50f421d891986aad5158bc8" },
      background: { type: "color", value: brand.colors.primary }
    }],
    dimension: { width: 1920, height: 1080 },
    aspect_ratio: "16:9",
    callback_id: siteId
  })
});
const { video_id } = await r.json();
// Poll GET /v1/video_status.get?video_id={video_id} until status=completed
// Download video_url + caption_url
```

**Cloudflare Stream upload + embed:**
```ts
// Server-side upload
const upload = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/stream/copy`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.CF_STREAM_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ url: heygenVideoUrl, meta: { name: `${brand.name} Explainer` }, requireSignedURLs: false, allowedOrigins: [brand.host] })
});
const { result: { uid } } = await upload.json();
// Save uid to _notebooklm.json.explainer_video.cf_stream_uid
```

```tsx
// Homepage BTF (template ships <ExplainerVideo>)
export function ExplainerVideo({ uid, posterUrl, captionsVtt }: Props) {
  return (
    <section data-section="explainer-btf" aria-label="Product explainer video">
      <h2>See it in 75 seconds</h2>
      <figure data-video-explainer>
        <stream
          src={uid}
          controls
          preload="metadata"
          poster={posterUrl}
          primary-color="#00E5FF"
          defaultTextTrack="en"
        ></stream>
        <figcaption>{video.title} · <a href={`/video/${uid}/transcript`}>Read transcript</a></figcaption>
      </figure>
    </section>
  );
}
// In root index.html: <script src="https://embed.cloudflarestream.com/embed/sdk.latest.js"></script>
```

**BTF placement = second screen** (immediately after hero, BEFORE features/services). Validator `validate-explainer-video-btf.mjs` asserts the `[data-section="explainer-btf"]` element appears as the 2nd `<section>` in `<main>` on `/`. Hero loop video (when used) does NOT count — it's hero, not BTF.

**JSON-LD `VideoObject` (mandatory on `/`):**
```json
{
  "@context":"https://schema.org",
  "@type":"VideoObject",
  "name":"<Brand> Explainer",
  "description":"<150-200 char quotable answer block>",
  "thumbnailUrl":"<R2>/video/poster.jpg",
  "contentUrl":"https://customer-<UID>.cloudflarestream.com/<UID>/downloads/default.mp4",
  "embedUrl":"https://iframe.videodelivery.net/<UID>",
  "uploadDate":"<ISO>",
  "duration":"PT1M15S",
  "transcript":"<full transcript text>",
  "hasPart": [
    {"@type":"Clip","name":"Hook","startOffset":0,"endOffset":10,"url":"...#t=0"},
    {"@type":"Clip","name":"Problem","startOffset":10,"endOffset":25,"url":"...#t=10"},
    {"@type":"Clip","name":"Solution","startOffset":25,"endOffset":55,"url":"...#t=25"},
    {"@type":"Clip","name":"Proof","startOffset":55,"endOffset":65,"url":"...#t=55"},
    {"@type":"Clip","name":"CTA","startOffset":65,"endOffset":75,"url":"...#t=65"}
  ]
}
```

**Video description (the third NotebookLM artifact):** the `_notebooklm.json.video_description` block becomes (a) Cloudflare Stream `meta.name` + `meta.description`, (b) YouTube/Vimeo upload metadata when cross-posted, (c) the `description` + `transcript` fields in `VideoObject` JSON-LD, (d) the `<figcaption>` + collapsed `<details>` transcript on `/` page. Description paragraph 1 MUST be a 40-60 word quotable answer block (per rules/copy-writing.md "GEO/AI search").

## Phase 0 Integration (Where the Pipeline Hooks In)

Step 1: enumerate Media Slot Manifest (`_media_slots.json`) per skill 15 media-acquisition.
Step 2: enumerate NotebookLM Manifest (`_notebooklm.json`) **in parallel** — same Phase 0 pre-build batch. Both load from `_research.json` + `_pdf_facts.json` + `_corpus.json` so dependencies match.
Step 3 (parallel batch): kick off ElevenLabs Studio podcast (~3 min wait), HeyGen video (~5 min wait), Vega-Lite/Recraft/GPT-Image-2 infographic panels (~30 sec each). Webhooks update `_notebooklm.json` filled fields when artifacts complete.
Step 4: while artifacts cook, Phase 1 page builders proceed — `/about` + `/` reference `_notebooklm.json` URLs (placeholder loaders if not yet filled, swapped in deploy-time when ready).
Step 5: pre-deploy gate waits for ALL `_notebooklm.json` artifacts OR exhausted-with-warning state — never block infinitely.

## Cost Tracking + Budget Ceiling

`_notebooklm_daily.json` schema: `{"date":"2026-05-02","spend_usd":47.20,"sites":{"site-id-1":{"podcast":0.30,"infographic":0.18,"video":1.50,"hosting":0.05}}}`. Daily ceiling `NOTEBOOKLM_DAILY_BUDGET` (default $300 = ~100 sites). Exhaustion → fall back to: video → Veo 3.1 Fast 8s loop ($1.20→$0.80) | infographic → Vega-Lite only (free) | podcast → defer to next day, skip with warning. NEVER block site deploy on NotebookLM artifacts — they're enrichment.

## API Keys Required

`ELEVENLABS_API_KEY` — manage at https://elevenlabs.io/app/settings/api-keys.
`HEYGEN_API_KEY` — manage at https://app.heygen.com/settings/api.
`HEYGEN_AVATAR_ID`, `HEYGEN_VOICE_ID` — pick at https://app.heygen.com/avatars + https://app.heygen.com/voices.
`SYNTHESIA_API_KEY` (fallback) — https://app.synthesia.io/account/integrations.
`TAVUS_API_KEY` (premium) — https://platform.tavus.io/api-keys.
`RECRAFT_API_KEY` — https://www.recraft.ai/profile/api.
`OPENAI_API_KEY` (already present, gpt-image-2 + gpt-4o for scripts).
`CF_STREAM_TOKEN` + `CF_ACCOUNT_ID` (already present in build pipeline).
`APPLE_PODCAST_KEY_ID` + `APPLE_PODCAST_PRIVATE_KEY` (Apple Podcasts Connect submission, JWT auth) — generate at https://podcastsconnect.apple.com/access.
`AUTOCONTENT_API_KEY` (fallback) — https://autocontentapi.com/account.
`NAPKIN_API_KEY` (panel fallback) — https://www.napkin.ai/account/api.

All loaded via `get-secret KEY` or sourced from `${CLAUDE_ENV_FILE}` per CLAUDE.md secrets pattern.

## Quality Gates (cross-ref skill 15 quality-gates.md)

`validate-podcast-on-about.mjs` — Phase 1 post-build: asserts `/about` HTML contains `<audio>` with `[src*=".mp3"]` AND PodcastSeries+PodcastEpisode JSON-LD blocks AND inline transcript text ≥500 chars. Failures: `podcast.missing` | `podcast.no_jsonld` | `podcast.no_transcript`.
`validate-infographic-on-about.mjs` — asserts `[data-infographic-gallery]` on `/about` contains ≥3 `<svg>|<object[type="image/svg+xml"]>|<img>` children, each with caption attrs. Failures: `infographic.missing` | `infographic.fewer_than_three` | `infographic.caption_missing`.
`validate-explainer-video-btf.mjs` — asserts `[data-section="explainer-btf"]` is 2nd `<section>` of `<main>` on `/` AND contains `<stream>` element with valid CF Stream UID AND VideoObject JSON-LD with `hasPart` chapters array. Failures: `video.missing` | `video.not_btf` | `video.no_jsonld` | `video.no_chapters`.
`validate-podcast-rss.mjs` — asserts `/podcast.xml` returns 200 with valid RSS 2.0 + iTunes namespace + ≥1 `<item>` element with `<enclosure type="audio/mpeg">`. Failures: `rss.missing` | `rss.invalid` | `rss.no_episodes`.

All four wired into `build_validators.ts` between R2 upload and `published` status. Initial deploy in `report` mode, flip to `strict` once template ships clean.

## Reference incidents

Pipeline-introduced rule (no historical incident yet — proactive 2026-05-02). First production run on next site build will inform refinements. Memory entry `feedback_notebooklm_pipeline.md` tracks the rationale + Brian's stated requirement for the artifact set.
