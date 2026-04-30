---
name: "build-prompts"
description: "Master prompt template for single Claude Code site build. Covers foundation, brand, content, SEO, animations, accessibility, responsive, self-check, and inspect/fix loop."
updated: "2026-04-24"
---

# Build Prompts

The container runs ONE comprehensive Claude Code prompt. This prompt encompasses all build phases. The prompt is dynamically assembled from form data + research results. Claude Code reads pre-written context files (`_research.json`, `_brand.json`, `_assets.json`, etc.) and customizes the pre-installed template.

## njsk.org Quality Bar (***THE FLOOR***)

Reference build: `~/emdash-projects/njsk.org` (live https://njsk-org.manhattan.workers.dev/). Every one-line prompt must produce a site at this level. Full gap analysis: `~/emdash-projects/projectsites.dev/apps/project-sites/NJSK_LESSONS.md`.

**Mandatory inclusions in every generated site:**

1. **Motion kit (9 utilities, ALL gated by `prefers-reduced-motion`):**
   - `.hero-rise > *:nth-child(n)` — stepped 80/240/400/560ms delays, translateY(12px)→0 + blur(4px)→0 + opacity 0→1, 0.7s cubic-bezier(0.22,1,0.36,1) both
   - `.text-sheen` — `linear-gradient(110deg, currentColor 40%, var(--brand-200) 50%, currentColor 60%)` background-clip:text, 3s infinite shimmer
   - `.heading-underline::after` — 4px gradient bar that scaleX 0→1 on `.reveal-visible` toggle, 0.6s ease
   - `.card-lift:hover` — translateY(-4px) scale(1.01) + shadow lift, 0.3s ease
   - `.link-wipe::after` — width 0→100% via transform:scaleX, 0.4s ease
   - `.float-bob` — translateY(-3px)↔(0px), 3s ease-in-out infinite alternate
   - `.badge-pop` — scale(0.9→1) opacity 0→1, 0.3s spring
   - `.scroll-progress` — `position:fixed top:0 height:3px`, scaleX driven by `@supports (animation-timeline: scroll())`
   - `.reveal[data-reveal]` paired with IntersectionObserver toggling `.reveal-visible`; children stagger via `--i` custom prop

2. **Stylized hand-drawn SVG map (NEVER Google Maps iframe).** Inline 500–800px wide SVG with brand-colored streets, landmark blocks, business pin. Below map: `Get Directions →` link to `https://www.google.com/maps/dir/?api=1&destination={url-encoded-address}` target=_blank. Reference pattern: `~/emdash-projects/njsk.org/src/components/stylized-map.tsx`. Iframes are slow, ugly, and leak data to Google.

3. **Lightbox (document-level click listener):** Auto-open any `<img>` ≥200×200 not inside `a|button|header|footer|[data-no-zoom]`. Render via `createPortal(modal, document.body)`. Body-scroll-lock: `body.style.position='fixed'; body.style.top='-${scrollY}px'; body.style.width='100%'; body.style.overflow='hidden'`. Use `100dvh` not `100vh`. Arrow keys + Escape + counter `{n}/{total}` + caption from `alt`. Auto-mark eligible imgs with `cursor:zoom-in` via `setInterval(markZoomable, 1500)`. Reference: `~/emdash-projects/njsk.org/src/components/lightbox.tsx`.

4. **WCAG 2.2 AA (NOT 2.1):** 24×24px min targets (2.5.8). Focus appearance `outline:2px solid var(--brand-500); outline-offset:2px` (2.4.11). Focus-not-obscured (2.4.12). Consistent help (3.2.6). Redundant entry (3.3.7). Skip-link to `#main` first element in body.

5. **Two Google Fonts when `formality≥0.6`:** serif heading (Fraunces/Playfair/DM Serif) + sans body (Inter/DM Sans). Single sans for casual. preconnect+preload. Font-loaded gate: `<style>html:not(.fonts-loaded) body{opacity:0}</style>` + `document.fonts.ready.then(()=>document.documentElement.classList.add('fonts-loaded'))`.

6. **11-stop palette `--brand-50…--brand-950`** via OKLCH lightness ramp from `brand_json.colors.primary`. Surfaces 50/100, text/accents 600/700/800, dark hero overlays 900/950.

7. **Drop-cap on first paragraph:** `.lead::first-letter{float:left;font-size:4em;line-height:0.9;padding:0.1em 0.1em 0 0;font-family:var(--font-heading);color:var(--brand-700)}`.

8. **≥4 JSON-LD blocks:** Organization + LocalBusiness + WebSite + (FAQPage if FAQ present) + (BreadcrumbList if multi-page).

9. **Banned-word grep — regenerate if any occurrence:** `revolutionize|leverage|seamless|robust|cutting-edge|world-class|empower|game-changing|unleash|supercharge|harness|foster|bolster|paradigm|holistic|ecosystem|next-generation|best-in-class|turnkey|synergy|disrupt|elevate|streamline|cornerstone|pivotal|myriad|plethora|transform|reimagine|redefine|transcend|boundless`. Each occurrence -0.1 to professionalism+brand_consistency.

10. **Ken-Burns slow-zoom on every hero bg image:** `transform: scale(1.0→1.08)` 8s alternate.

11. **md5 image dedup before render** — never ship same hash twice. Source-code refs use FULL canonical filenames.

12. **Editorial typed-blocks for imported corpora:** Run any imported content (Squarespace export, scraped CMS, manual paste) through `clean_content` prompt FIRST. Output: `{ posts: [{ title, slug, excerpt(120-180ch), keywords[4-8], blocks: [{type:"lead|heading|paragraph|quote|callout", text, level?}], publishedAt, image }], related_map: {slug:[siblingSlugs]} }`. Strip Squarespace residue. NEVER alter direct quotes, names, dates, or factual claims.

13. **Multi-page expansion when `complexity≥mid`:** Run `generate_routes` prompt to plan 5–14 routes. Internal-link graph: every page → 3–5 contextual anchors with VARIED anchor text. BreadcrumbList JSON-LD on every non-home route. Sitemap.xml with priority+changefreq+lastmod per route.

**Pipeline order (`apps/project-sites/src/workflows/site-generation.ts`):**
```
import → strip_cms_residue → ai_block_typing(lead/heading/paragraph/quote/callout)
→ md5_image_dedup → keyword_extract → excerpt_120_180 → related_score
→ generate_routes(if mid+) → generate_website → score_website
→ structural_validator(local grep for motion classes, JSON-LD count, banned words)
→ regen_if_below_0.6 → publish
```

Runtime prompts registered in `apps/project-sites/src/services/ai_workflows.ts`:
- `generate_website@2` — full motion kit + lightbox + stylized SVG map + WCAG 2.2 AA
- `score_website@1` — 10-dim scoring including motion + typography + banned_words_found[]
- `clean_content@1` — typed-block editorial pass
- `generate_routes@1` — multi-page router for complexity≥mid

## Master Prompt Template

```
# Build a Stunning Website for {{businessName}}

Read ALL _ prefixed files in this directory for context:
- _research.json — business profile, hours, phone, address, reviews, geo
- _brand.json — colors, fonts, personality, logo URL
- _scraped_content.json — content from existing website (if available)
- _assets.json — manifest of all images in assets/ folder
- _image_profiles.json — GPT-4o analysis of each image
- _videos.json — YouTube/video URLs and metadata
- _places.json — Google Places enrichment data
- _form_data.json — user-submitted form data
- _domain_features.json — category-specific requirements

Read ~/.agentskills/15-site-generation/ for full methodology.
Cross-reference skills: 09 (brand extraction, copy rules), 10 (design system, local business patterns), 11 (animation, prefers-reduced-motion), 12 (media orchestration, image generation), 07 (quality verification, accessibility), 13 (analytics auto-provision, local conversion tracking).

## Your Mission
Transform this Vite+React+Tailwind+shadcn/ui project into the most gorgeous website
this business has ever had. Start from the pre-installed template in ~/template.
Every image in assets/ MUST appear on the site. Every fact must come from research data.

## Phase 1: Foundation (generates 90% of the site)

### Brand Configuration (***PRIMARY COLOR RETRIEVAL — skill 09***)
- Read _brand.json — colors are pre-extracted from logo/website/assets by research pipeline
- Set CSS custom properties in globals.css: --color-primary, --color-secondary, --color-accent, --color-background, --color-foreground from _brand.json.colors
- Map to tailwind.config.ts: primary→_brand.json.colors.primary.value, secondary→colors.secondary.value, accent→colors.accent.value
- Background color: derived from primary (darkened 80-90% lightness in OKLCH), NOT hardcoded
- Use brand fonts from _brand.json.fonts (fallback: Inter body, system-ui heading)
- Logo from assets/logo.* in EVERY page header
- NEVER hardcode hex colors — always reference _brand.json or CSS custom properties
- NEVER guess colors from business category — the njsk.org burgundy incident

### Logo Extraction (***MANDATORY — NEVER SKIP***)
- Phase 0 research pipeline MUST extract the official logo from the existing website
- Extraction order: (1) <img> in <header>/<nav> with "logo" in src/alt/class (2) og:image meta tag (3) site banner/hero image with org name (4) favicon/apple-touch-icon (5) Squarespace/WordPress theme logo selectors
- Download logo image to assets/logo.{ext} — preserve original format (WebP/PNG/SVG preferred)
- Generate sized variants: logo-header.png (max 200px height for nav), logo.png (full size for OG/hero), logo-favicon.ico (32x32+16x16)
- If original is WebP: convert to PNG via sips/sharp/imagemagick for broad compatibility
- Logo MUST appear in: header nav (every page), footer, OG image, JSON-LD logo field, favicon
- NEVER substitute SVG placeholder icons for the real logo — the njsk.org soup-bowl-SVG incident
- If no logo found on website: check Google Places photos, social media profile images, Brandfetch API, logo.dev API — exhaust ALL sources before generating one
- Logo colors inform brand palette extraction: dominant color→primary, secondary accent→secondary

### Pages (***match original site structure — NEVER reduce page count***)
- Homepage: hero with brand image + gradient overlay, selling points grid, about preview, testimonials, FAQ, CTA
- About: 2000+ words, verifiable facts from research, team section if data exists. Include sub-pages: mission, vision, how-we-do-it, founder history
- Services/Menu/Features: detailed grid with images, pricing if available. Each service gets full description — not a 2-sentence summary
- Contact: form (if email found), Google Maps embed (if geo), social links (verified only), full NAP, mailing address
- Blog (***MANDATORY if original site has one***): migrate ALL blog/news/updates from _scraped_content.json — individual route per post with full content, listing page with date+author+excerpt, pagination if 10+ posts. Blog content is SEO equity and community engagement proof — never discard it. Each post gets its own route, not just a listing card
- FAQ: if original site has FAQ, create dedicated FAQ page with accordion UI and FAQPage schema
- Team/Staff: if original site lists team members, create team page with names, roles, department groupings
- Donation page (non-profit/church): one-time + monthly toggle, default to MONTHLY. Suggested amounts from category. Stripe integration or link to existing platform
- Category-specific pages: mass schedule (church), menu (restaurant), pricing (salon), specialties (medical), practice areas (legal) — scrape and recreate ALL of these
- "We Need" / wishlist pages (non-profit): donation item lists, drop-off info, seasonal needs
- Additional pages: create a page for EVERY distinct page in _scraped_content.json. Content-rich originals get rebuilt as full pages. Thin pages may be merged but MUST get 301 redirects
- Nav must include ALL pages — never hide pages that exist on the original site. If nav gets crowded, use dropdown menus

### Page Enrichment Patterns (***AUTO-APPLY ON FIRST BUILD***)
These patterns must be applied automatically — not as a follow-up. Every page should ship with these features on the first prompt.

**Video Heroes:** Every major page gets a `<video autoPlay muted loop playsInline>` background behind the hero section at 20% opacity with a gradient overlay. Source: download 2-3 Pexels videos (SD 640x360, ~600KB each) matching the business type. Search Pexels for "{business_type}" + "volunteer" + "community meal" etc. Store in `public/videos/`. Fallback: photo hero with gradient if no video available. Use `aria-hidden="true"` on video elements.

**Contact Forms (***WHEREVER EMAIL IS MENTIONED***):** Any page that tells users to "email X" or "call to get started" MUST include an inline contact form pointing to that email via the projectsites.dev contact API or Resend. The form replaces the friction of copy-pasting an email. Fields: name, email, message (minimum). For volunteer pages: add organization and group size fields. For donation inquiries: add amount range. Always include Turnstile invisible widget. Show fallback email/phone below the form.

**Partner/Client Logo Strips:** When the site mentions corporate partners, sponsors, or collaborators by name, download their logos and display a grayscale logo strip with hover-to-color effect (`grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all`). Major corporations (Fortune 500) have logos on logo.wine, Wikimedia Commons, or companieslogo.com. Smaller orgs: extract from their website headers. Store in `public/images/partners/`. Consistent height (h-12 sm:h-16), object-contain, max-w-[160px].

**Full-Width Maps:** Any page showing a physical address (especially church/schedule pages, contact pages) should include a full-width Google Maps embed — not just a sidebar map. Use `width="100%" height="450"` with no border, outside any max-width container. The map IS the visual for location pages.

**Photo Galleries:** Pages with 4+ related images should include a grid gallery section. Use `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4` with `aspect-square object-cover rounded-lg`. Volunteer pages should show a "Volunteers in Action" gallery reusing blog post images. Services pages should show partner photos in a grid under Community Partnerships.

**Contextual CTAs:** Every page ends with a relevant CTA section. Services→"Need a Meal?" + directions. About→"Join Our Mission" + donate/volunteer. Blog→"Support Our Mission" + donate/volunteer. Volunteer→"Can't Volunteer?" + donate. Match the CTA to what makes sense for the page topic.

**Donation Forms (***MONTHLY-FIRST, LIVE VALIDATION***):** Donation pages default to monthly recurring at $100/mo. Monthly/one-time toggle at top (monthly pre-selected). Presets: $50, $100, $250, $500. $100 selected by default. Monthly preset amounts→Stripe Payment Links (redirect with `prefilled_email`). One-time/custom→PaymentIntent flow via API. Live validation: validate on blur, re-validate on change after first blur. Green checkmark icons for valid fields, red borders+messages for invalid. Summary bar shows amount+frequency before submit. "Secured by Stripe" trust badge below button. Partner logo strips use `flex flex-wrap justify-center` (NOT grid) to ensure horizontal centering regardless of item count.

**Donation Page Structure (***TWO-PANE + RICH SALES APPEAL***):** Donate pages are NEVER just a form. Layout: `grid lg:grid-cols-2 gap-12` — left pane: form (sticky on scroll); right pane: sales appeal stack. Right pane required sections (in order): (1) hero appeal photo + bold headline (e.g. "500 hungry neighbors walk through our doors every day") + emotional paragraph with one bolded clincher; (2) **Goal Progress Bar** — `$X of $Y/month` with animated fill bar, supporter count, dollars-to-go, and one italic line explaining what hitting the goal unlocks. Pick a realistic monthly goal ($10K is good default for small non-profits); (3) **Where Your Money Goes** — 4 horizontal bars showing program % allocation with one-line note each (food/supplies/clinic/operations); (4) **Impact Tiers** — table of dollar amounts → outcomes ("$100 = one week of breakfasts for 70 neighbors"). Below the two-pane: testimonials (3 cards with quote/author/role — donor + corporate volunteer + former guest), FAQ (`<details>` accordions, 6-8 questions covering tax-deductibility, cancel-anytime, % to programs, payment security, alt giving methods, employer matching, tribute gifts), trust badges grid (501c3 verified+EIN, Stripe secured, % to programs, years operating), final urgency CTA section ("Tomorrow morning, 500 people will show up hungry") that scrolls back to form. Hero h1 must include EIN/501(c)(3) tagline. Reference benchmark: donate.megabyte.space.

**Homepage Interlinking (***LINK EVERY MAIN PAGE WITH PREVIEW CONTENT***):** Homepage cannot just dump hero+CTA. Required sections in order: (1) hero with photo/video; (2) **Impact Stats Bar** — 4 hero numbers on dark background (meals/years/days/zero-questions); (3) Mission preview → links to /about + /team; (4) Services preview — 3 cards with photos + descriptions linking to /services and sub-anchors; (5) **"Three Ways to Help"** card grid with icons → /donate, /volunteer, /we-need; (6) Blog preview — 3 latest posts with photos linking to /blog and individual posts; (7) Partner logos strip; (8) **Faith/Mass Schedule + Visit Us** two-column section linking to /mass-schedule and /contact; (9) Final donate CTA. Every main nav route must be reachable via at least one homepage preview card with image + descriptive copy. The homepage is a hub, not a brochure.

**Footer Logos on Dark Backgrounds:** Header logos render naturally on white. Footer logos on maroon/dark backgrounds need `opacity-80 mix-blend-screen` (translucent, lets red bleed through warmly) — NOT `brightness-0 invert` (harsh stark white). Test against actual background color before declaring done.

**Full-Featured Site-Wide Image Lightbox (***EVERY PHOTO ZOOMABLE — BUILD-BREAKING IF MISSING***):** Every site ships `src/components/lightbox.tsx` mounted once in `Layout` after `<Footer />`. Document-level click handler opens portal modal `bg-black/95 backdrop-blur-xl`, centered `<img object-contain max-h-[90vh] max-w-[95vw]>`, smooth fade+scale enter (`@starting-style` opacity:0 scale:.96 → opacity:1 scale:1, 220ms cubic-bezier(.2,.8,.2,1)). Required UI: top-right close (44×44 WCAG 2.5.8, `bg-white/10 hover:bg-white/20`), bottom figcaption from alt text + index counter `n / total`, prev/next arrow buttons (44×44, hidden when single image), bottom thumbnail strip (`grid-flow-col` scrollable, current highlighted) when 4+ images, top-right zoom toggle (1×↔2×, click again pans). Gallery awareness: clicking any zoomable img collects ALL `[data-zoomable]` images in the same `[data-gallery="<id>"]` ancestor (or all on page if no gallery wrapper) into the navigation set — every gallery section MUST wrap with `<div data-gallery="services-photos">`. Keyboard: `Esc` close, `←/→` prev/next, `Home/End` first/last, `Space`/`Enter` toggle zoom, `Tab` cycles only within modal (focus-trap on close button, prev, next, zoom toggle). Touch: swipe left/right (Pointer Events, ≥40px threshold) prev/next, pinch-zoom via CSS `touch-action:pinch-zoom` while zoomed, double-tap zoom toggle. Preload neighbors: when index changes, set `<link rel="preload" as="image">` for `n-1` + `n+1`. Body scroll locked via `overflow:hidden` + `padding-right` for scrollbar comp; restore on close. Auto-mark zoomable: on mount + MutationObserver on `main`, walk `main img`, set `cursor:zoom-in` + `data-zoomable="true"` if not excluded. Exclusions (NEVER zoom): `header`, `footer`, inside `<a>`, inside `<button>`, ancestor `[data-no-zoom]`, ancestor `[data-no-lightbox]`, naturalWidth<200px OR naturalHeight<200px, role="presentation". A11y: `role="dialog"`, `aria-modal="true"`, `aria-label="Image viewer"`, `aria-live="polite"` on counter, alt text mirrored to figcaption. Reduced motion: `prefers-reduced-motion:reduce` disables scale animation, keeps fade only. Each major image group on the site (services grid, gallery, team, blog hero, testimonials with photos, before/after) MUST be wrapped in `data-gallery="<unique-id>"` so navigation cycles within the meaningful set, not the whole page.

**Team Page Photos (***DOWNLOAD HEADSHOTS, FALLBACK TO INITIALS***):** Team pages render real photos, not initials-only avatars. Phase 0 research must scrape `<our-team|/team|/staff|/about>` page and capture every headshot URL. Download to `public/images/team/{first-name}.{ext}` (preserve original format — JPG/PNG/WebP). Team data model: `{ name, role, photo?: string }` — `photo` optional so missing-source members render initials fallback. Photo avatar: `w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md` with `<img object-cover>` and `group-hover:scale-105` zoom hint. Initials fallback: same dimensions, `bg-maroon-200`, two-letter initials skipping `Rev.`/`Sr.`/etc prefixes. Hero subhead nudges interaction: "Click any photo to zoom in." Photos auto-pick up site-wide Lightbox.

**The njsk.org enrichment incident:** The first build shipped pages with plain text heroes, no contact forms (just "email us" text), no partner logos (just name-drops), and sidebar-only maps. All of these should have been first-build features, not follow-up additions.

### Content Migration (***NEVER DISCARD CONTENT***)
The original site's content is the business's accumulated SEO equity and institutional knowledge. Treat it as sacred.
- Migrate ALL text content from _scraped_content.json — rewrite for quality but preserve substance
- Every blog post, news article, update → individual page at matching URL path
- Team bios, service descriptions, FAQ answers, event archives → all migrated
- Only discard: broken markup, "test" pages, truly empty pages, exact duplicates
- When combining thin pages: content merges into a richer page, old URLs get 301s
- Word count of new site should MATCH OR EXCEED original (not 50% — 100%+)

### URL Slug Hygiene (***ALWAYS CLEAN — NEVER COPY CMS GARBAGE***)
Original CMS paths often contain garbage suffixes, numeric IDs, or folder artifacts (e.g. `/the-mens-dining-hall-1`, `/volunteer-1`, `/new-folder-1`). NEVER use these as primary routes.
- Clean the slug: strip trailing numbers added by CMS (`-1`, `-2`), remove articles (`the-`), remove `new-folder-*` artifacts
- `/the-mens-dining-hall-1` → primary route: `/services/mens-dining-hall`, redirect from original path
- `/volunteer-1` → primary route: `/volunteer`, redirect from original path
- `/new-folder-1` → primary route: `/services`, redirect from original path
- Sub-services get nested routes: `/services/health-clinic`, `/services/womens-center`
- Use a Redirect component (navigate with replace:true) for SPA client-side 301 equivalents
- Original ugly paths MUST still resolve via redirect — never 404 on a previously-indexed URL

### URL Preservation (***NON-NEGOTIABLE***)
Parse _scraped_content.json for all original URL paths. Every original URL must resolve:
- Same path → actual page (preferred): `/about-us` → About page at `/about-us`
- Different path → 301 redirect: if original `/our-team` merges into `/about`, add redirect
- Blog posts: preserve exact slug `/blog/2024/summer-event` → same route
- Generate `public/_redirects` file in Cloudflare Pages format:
  ```
  # Cloudflare Pages _redirects format: FROM TO STATUS
  /old-about-us /about 301
  /our-team /about#team 301
  /news/2023/post-title /blog/post-title 301
  /services/old-service /services#old-service 301
  ```
  One redirect per line. `FROM` is the original path, `TO` is the new path, `STATUS` is 301 (permanent). For SPAs with client-side routing, also add a catch-all `/* /index.html 200` as the LAST line (Cloudflare Pages SPA fallback). Redirects are evaluated top-to-bottom, first match wins.
- Validate: every URL from original sitemap.xml returns 200 or 301 — never 404
- Build gate: compare original sitemap URLs vs new sitemap + redirects, fail if any URL unaccounted

### Media Acquisition (***MANDATORY — RUNS IN ALL BUILD MODES***)
Media enrichment is NOT optional. Whether running in container, via prompt, or in manual Claude Code session — media acquisition MUST happen. A site with no images is not a site. Read ~/.agentskills/15-site-generation/media-acquisition.md for full strategy.

**The njsk.org text-only-site incident:** The first build shipped a site with ZERO images because media acquisition was treated as a Phase 0 container-only step. It is a HARD GATE for ALL builds.

**Manual/prompt build media steps (***FIRST PROMPT — BEFORE ANY CODE***):**
1. **Extract images from original site:** WebFetch every page, extract ALL img src URLs. Download each to public/images/. njsk.org had at least: banner logo, food service photos (IMG_3035.jpg), kitchen photos (Resized-20180809-114452.jpeg), plus Squarespace gallery images. EVERY image on the original site MUST be downloaded and used.
2. **Google image search:** Search "{business_name} {city}" for 10-15 relevant photos. Use WebFetch to find image URLs from Google CSE or direct search.
3. **Stock photo APIs:** If API keys available (UNSPLASH_ACCESS_KEY, PEXELS_API_KEY), query for business-type-specific photos. Download 5-10 to public/images/.
4. **AI image generation:** If OPENAI_API_KEY available, generate 3-5 originals via GPT Image 1.5 (hero background, service illustrations, atmospheric textures). If not available, use CSS gradients with brand colors as hero backgrounds — but NEVER ship pages with no visual content at all.
5. **Video embeds:** Search YouTube for "{business_name}" — embed any official videos. Search Pexels for business-type B-roll.
6. **Image placement:** Hero section MUST have a background image or photo. Every service card needs an image. About page needs at least 2 photos. Blog posts with photos on original site must have those photos. Gallery/photo section if 5+ images available.
7. **Hard gate:** Count images in public/images/ or equivalent. If <10 unique images → build is NOT complete. If <5 → build has NOT started media acquisition.

**For non-profit/church sites specifically:** Extract volunteer group photos from blog posts (these are often the most emotionally compelling images), download event photos, kitchen/dining hall interior shots. These organizations rely on emotional connection — text-only sites kill donations.

### Per-Page Image Extraction (***MANDATORY — EVERY PAGE GETS ITS IMAGES***)
Images are not a site-wide pool — they belong to specific pages. When scraping the original site, associate EVERY image with the page it appeared on. This is critical for blog posts, service pages, and event recaps where photos are the primary content.

**Process:**
1. **Scrape every page individually:** For each page in _scraped_content.json or original sitemap, WebFetch the page and extract ALL `<img>` src URLs from the page body (not nav/footer chrome)
2. **Download with page association:** Save images to `public/images/{section}/{slug}-{index}.jpg` (e.g., `public/images/blog/federal-reserve-bank-1.jpg`, `public/images/services/dining-hall-1.jpg`). Maintain a mapping of page→image paths
3. **Data model integration:** Every page's data structure MUST include an `images: string[]` field with local paths. Blog posts: `blogPosts[].images`. Services: `services[].images`. Team members: `team[].photo`. This is NOT optional metadata — it's a required field
4. **Featured image:** First image in the array (`images[0]`) is the featured/hero image — displayed in listing cards, OG tags, and page hero sections
5. **Gallery rendering:** Pages with 2+ images render a photo grid/gallery below the primary content. Use `grid-cols-1 sm:grid-cols-2` with `object-cover aspect-[4/3]` for consistent presentation
6. **CMS URL patterns:** Squarespace uses `images.squarespace-cdn.com/content/v1/{site-id}/{hash}/{filename}`. WordPress uses `wp-content/uploads/{year}/{month}/{filename}`. Wix uses `static.wixstatic.com/media/{hash}`. Always download and host locally — never hotlink to CMS CDN (the original site may go offline)
7. **Hard gate:** Every blog post that had images on the original site MUST have images on the new site. Every service page that had photos MUST have photos. Zero-image blog posts on a site where other posts have images = build incomplete

**The njsk.org blog image incident:** Blog posts were migrated as text-only even though every post on njsk.org had 1-19 associated photos (volunteer group photos, event shots, donation images). These photos ARE the content for a non-profit blog — without them, posts are meaningless stubs.

### Image Dedupe via 301 (***NEVER DELETE WITHOUT REDIRECTING — UPDATE EVERY REFERENCE***)
When a build downloads CMS images, the same asset frequently appears under multiple filenames (Squarespace serves the same hero as `assetUrl` AND inside `body` HTML). Naive dedupe by md5 hash + delete breaks every reference still pointing at the deleted path — internal links, OG images, sitemap entries, external backlinks, search-engine-indexed URLs. **Always 301 the deleted twin to the kept canonical, never just `rm`.**
- **Workflow:** (1) hash every image in `public/images/{section}/` by md5 (2) for each duplicate, pick the canonical (shorter/more-descriptive filename, or `*-1.jpg` over `*-body-N.jpg`) (3) delete the twin file (4) emit `{deleted-url: canonical-url}` to a redirect map compiled into the worker (5) the worker `Response.redirect(target, 301)` on every request matching a deleted path
- **Reference script (proven on njsk.org):** `~/.agentskills/15-site-generation/build-image-redirects.mjs` — walks `git log --reverse --name-status` to find every image deletion on the branch, recovers each blob via `git show {commit}~1:{path}`, hashes against current files, emits `src/data/image-redirects.ts` (Worker bundle) + `public/_image-redirects.json` (debug). Output: 478/502 mapped on njsk.org rebuild
- **Worker integration:** Top of `fetch()` handler — `const target = imageRedirects[url.pathname]; if (target) return Response.redirect(new URL(target, url).toString(), 301);` BEFORE `env.ASSETS.fetch()`. Add a 404 short-circuit for `/images/{section}/*` so unmapped misses don't waterfall into SPA fallback
- **Source-code reference hygiene (***UPDATE EVERY REFERENCE — NEVER LEAVE ALIASES***):** When images are renamed/deleted, grep every `.tsx/.ts/.html/.md` for the old filename and update to the canonical. Short aliases like `pseg-1.jpg`, `barbara-cary-1.jpg`, `fed-volunteers-1.jpg` are fragile — always reference the full descriptive filename (`pseg-feb-2023-1.jpg`, `introducing-barbara-cary-1.jpg`, `federal-reserve-bank-volunteers-1.jpg`). Hard gate: `node scripts/scan-assets.mjs` on production must report ZERO 404s on `/images/*` requests. Any 404 = build incomplete
- **The njsk.org dedupe incident:** First dedupe pass deleted 502 duplicate images by md5 hash but left 9 home/services/volunteer/we-need pages referencing the deleted short-alias filenames — every page rendered with broken image icons. Fix required (a) building the 301 redirect map post-hoc from git history (b) rewriting every page-source `.tsx` to use canonical filenames (c) the parallel asset scan to catch the residual 404s. **The rule going forward: dedupe + redirect + reference-update happen in one atomic commit, never separately.**

### Per-Route SEO Meta (***EVERY ROUTE GETS UNIQUE TITLE / DESC / KEYPHRASE / CANONICAL / JSON-LD***)
SPAs default to one shared `<title>` and `<meta>` set across every route — Yoast/Lighthouse/Search Console all flag this as duplicate-content. Every public route MUST have unique meta keyed off the pathname, with a researched keyphrase that the page genuinely deserves to rank for.
- **Data file:** `src/data/page-meta.ts` exports a `PageMeta` map keyed by route. Each entry: `title` (50-60 chars, keyphrase-first), `description` (120-156 chars, keyphrase + value prop + CTA), `keyphrase` (researched, in-the-field, low-competition), `canonical` (full https URL), optional `ogImage` (1200×630), optional `jsonLd[]` (Organization/Service/BlogPosting/BreadcrumbList/FAQPage as appropriate)
- **Component:** `src/components/page-head.tsx` is a side-effect-only React component returning `null`. It hooks `useLocation()` and on every pathname change runs `applyMeta(meta)` which: sets `document.title`, upserts `<meta name|property>` for description/keywords/og:*/twitter:*, upserts `<link rel="canonical">`, removes prior `<script data-page-jsonld>` and re-injects the route's JSON-LD blocks. Mounted ONCE at the top of `<App>`, outside `<Routes>`
- **Blog post dynamic meta:** Don't pre-bake meta for every blog slug into `page-meta.ts` — derive at runtime from `blogPosts.find(p => p.slug === slug)`. Title = `{post.title.slice(0,47)}… | {Site} {Location}` clipped to 70 chars. Description = `post.excerpt.slice(0,156)`. Keyphrase = `post.keywords?.[0] ?? siteDefaultKeyphrase`. JSON-LD: BlogPosting + BreadcrumbList
- **Keyphrase research (***INTENT-FIRST, NOT KEYWORD-STUFFING***):** For each route, ask: what would a genuine user type into Google to land here? `/donate` → "donate to {city} soup kitchen" (intent: I want to give). `/mass-schedule` → "Catholic Mass {city} NJ" (intent: I want to attend). `/services/health-clinic` → "free health clinic {city}" (intent: I need care). Avoid generic "best/top/leading" — use specific locality + service combinations
- **Hard gate:** Every route in `App.tsx` MUST have a corresponding entry in `page-meta.ts` (or be derivable from data, like blog posts). Missing entry = `getMeta(pathname)` returns null = generic fallback meta = build incomplete. CI: `grep -oE 'path="[^"]+"' src/app.tsx | sort -u` cross-checked against `page-meta.ts` keys
- **The njsk.org meta incident:** First build had a single static `<title>` and `<meta>` block in `index.html` — every route on the deployed SPA showed identical Google snippets. Fix was the `PageHead` + `page-meta.ts` pattern above; now every route shows a unique researched keyphrase + title + description in search results

### Font-Flash Mitigation (***FOUT/FOIT MUST NEVER FLASH WRONG FONT***)
Web fonts loading from Google Fonts/CDN cause a visible Flash Of Unstyled Text (FOUT) — body renders in fallback font, snaps to brand font ~200-800ms later, jarring layout shift. Mitigation runs in `index.html` before the React bundle, costs ~1KB, gracefully fades the page in once `document.fonts.ready` resolves.
- **Recipe (drop into `<head>` of `index.html`):**
  ```html
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family={Font}..." />
  <link href="https://fonts.googleapis.com/css2?family={Font}..." rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
  <style>
    html { background: #ffffff; }
    html:not(.fonts-loaded) body { opacity: 0; }
    html.fonts-loaded body {
      opacity: 1;
      animation: page-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes page-in { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
    @media (prefers-reduced-motion: reduce) { html.fonts-loaded body { animation: none } }
  </style>
  <script>
    (function(){var html=document.documentElement,done=false;function reveal(){if(done)return;done=true;html.classList.add('fonts-loaded')}
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(reveal); setTimeout(reveal,1200)})();
  </script>
  ```
  The `setTimeout(reveal, 1200)` is a safety net — if `document.fonts.ready` never resolves (slow network, font CDN down), reveal at 1.2s anyway so the page never stays invisible
- **Animate.css for in-page motion:** Use `animate__animated animate__fadeInUp animate__faster` etc. on hero sections, content cards, and route transitions. Glitch-free because animate.css uses transform/opacity only (GPU-composited, no layout thrash). All transitions gated on `prefers-reduced-motion: reduce`
- **Hard gate:** Page-load video: capture first 1500ms with Playwright `recordVideo`. AI vision must NOT see a font-snap event (text shifts width/baseline mid-load). If snap is visible, preload directive missing or `<style>` block not blocking initial render

### Hero Image Context (***NEVER GENERIC — MATCH PAGE INTENT***)
Hero backgrounds carry semantic weight. A food video on a Mass-schedule page or a generic stock-photo hero on a Health-Clinic page reads as careless. Every hero MUST visually align with the page's specific topic, not just the site's overall vibe.
- **Audit pass:** For each route, ask: does the hero image/video literally depict what this page is about? `/donate` → volunteers-serving-meals (the impact). `/mass-schedule` → stained-glass church interior (worship). `/services/health-clinic` → medical-care imagery (not food). `/we-need` → pantry/donation-stock (not soup kitchen line)
- **Source priority:** (1) original-site photos that match the page topic (2) blog post photos from the same topic cluster (3) stock photos from Pexels/Unsplash with `topic` query (`unsplash.com/s/photos/{topic}` → first non-people-faced result, license-free) (4) AI generation as last resort
- **Hard gate:** Visual QA pass — AI vision scores each hero on `image_matches_page_topic` (0-10). Any hero <8/10 flagged for replacement. Score 6 example: food-prep video on /mass-schedule (food is on-brand for the org but off-topic for the page). Score 9 example: stained-glass-window photo on /mass-schedule
- **The njsk.org Mass-schedule incident:** Hero used `/videos/volunteers-serving.mp4` because it was the only available video — semantically wrong (the page is about Sunday Catholic worship, not the kitchen). Fix: downloaded a stained-glass church interior from Unsplash, applied ken-burns slow-zoom, dropped opacity to 40% with maroon gradient overlay. Now the hero matches what the page is actually about

### Parallel Verification Scan (***POST-DEPLOY GATE — ZERO 404s + ZERO CONSOLE ERRORS***)
Manual click-through testing misses 80%+ of broken assets, console errors, and CSP violations because they fire only on specific routes/breakpoints/timings. Every deploy MUST run a parallel headless scan that captures every console error/warning and every failed network request across every route.
- **Reference script:** `scripts/scan-assets.mjs` (Playwright + chromium, concurrency 6) — for each public route + sample of blog routes, opens a fresh context, attaches listeners for `console`, `pageerror`, `requestfailed`, and `response` (status >=400), navigates with `waitUntil:'networkidle'`, returns `{route, errors[], warnings[], failed[]}`. Sort + print per-route, end with summary, `process.exit(1)` if any errors or failures
- **Bash sweep complement:** `scripts/check-routes.sh` — `curl -sk -o /dev/null -w "%{http_code}"` every route + every blog slug, print non-200s. Faster than Playwright (no browser), catches Worker-level 404s/redirects but not console errors
- **Empty-config widgets (***NEVER SHIP WITH EMPTY data-sitekey OR PLACEHOLDER URLS***):** A `<div class="cf-turnstile" data-sitekey="">` produces a console error on every page render. Same for empty Stripe public keys, empty Resend tokens, empty PostHog snippets. Pattern: gate the widget render on the env var being set — `{import.meta.env.VITE_TURNSTILE_SITEKEY ? <div className="cf-turnstile" data-sitekey={...} /> : null}`. The script tag in `<head>` is fine to leave (loads silently); only the widget div with empty key produces the error
- **Hard gate:** Both scripts run as the LAST step of every deploy verification. `scan-assets.mjs` exit code 0 + `check-routes.sh` reporting 0 non-200s = deploy verified. Any error = open the worker logs / fix the broken reference / redeploy / re-scan. Never mark a deploy "done" without the green scan
- **The njsk.org scan incident:** Initial deploy passed the bash route-sweep (every route returned 200) but the Playwright scan revealed 72 console errors across services/volunteer/we-need pages — broken `<img>` references to short-alias filenames, plus Turnstile empty-sitekey errors. The bash sweep alone would have shipped a broken site; only the parallel Playwright scan caught the asset 404s. **Both scans now run on every deploy.**

### Full Blog Archive Crawl (***MANDATORY — 100% COVERAGE OR BUILD FAILS***)
The /blog index on most CMSes (Squarespace, WordPress, Wix, Ghost) paginates. Stopping at page 1 = silently dropping 50–90% of the archive. The original site's blog is a multi-year corpus of partner spotlights, event recaps, donation announcements, and obituaries — every post is irreplaceable institutional history. **Coverage threshold: 100%, not "most".**

**Squarespace canonical method (***ALWAYS USE THIS FIRST FOR SQUARESPACE — JSON API***):**
The HTML pagination on Squarespace silently drops posts when "Load More" or themed pagination has bugs. The JSON endpoint is the source of truth — every post in the database appears here regardless of theme.
- Endpoint: `GET https://{domain}/blog?format=json&offset=0` returns the first batch as JSON: `{ items: [...], pagination: { nextPage: bool, nextPageOffset: number } }`
- Loop: start with `offset=0`, fetch, append `items` to a Map keyed by `item.id` (dedup), set `offset = items[items.length-1].publishOn` (a millisecond epoch), repeat until `items.length === 0` OR `pagination.nextPage === false`
- Each item has: `id`, `urlId`, `fullUrl`, `title`, `body` (HTML), `excerpt`, `assetUrl` (hero image), `publishOn` (ms), `tags[]`, `categories[]`. `body` HTML contains `<img src|data-src|data-image="...">` — extract every src. CDN urls accept `?format=2500w` for high-res variants
- Verification: count items vs sitemap.xml `/blog/*` URLs vs manually clicking "Older Posts" link until last page. All three counts MUST match. If sitemap says 129 and JSON returned 129, you're done. If they disagree, retry with delays (Squarespace rate-limits at >2 req/sec)
- Reference script (proven on njsk.org): see `~/.agentskills/15-site-generation/squarespace-full-crawl.mjs` template

**Other CMS patterns (***SAME 100% COVERAGE RULE***):**
- **WordPress:** `/wp-json/wp/v2/posts?per_page=100&page=N` — REST API with explicit `X-WP-Total` and `X-WP-TotalPages` response headers. Frontend pagination (`/page/N/`) is fallback only.
- **Ghost:** `/ghost/api/content/posts/?key={contentKey}&limit=all` — single-shot API returns the entire archive when `limit=all`. Front-end pagination is unnecessary.
- **Wix:** No public API — must crawl HTML pagination. Use Playwright (not WebFetch) because Wix relies on JS-rendered "Load More" buttons.
- **RSS as backup:** `/blog/rss`, `/feed.xml`, `/atom.xml` — typically include 100+ posts. Useful for cross-checking but body content is excerpt-only, not full HTML; never use RSS as the SOLE source.
- **Sitemap as ground truth:** Parse `/sitemap.xml` for ALL `<url>` entries matching `/blog/*` (or `/news/*`, `/updates/*`, etc). The sitemap count is the floor — your crawl must equal or exceed it.
- **Manual end-page check (***ALWAYS — FINAL VERIFICATION***):** Open the live site, navigate to /blog, click "Older Posts" repeatedly until the button disappears. The URL of the very last post is your canary — `grep` your generated `blogPosts[]` for that slug. If it's missing, the crawl is incomplete. *(The njsk.org cause: the user manually clicked Older through 13 pages and discovered `/blog/faith-lutheran-new-providence` from Dec 2018 was missing — 100% coverage gate caught what 80% threshold did not.)*

**Per-post deep fetch (***INDEX EXCERPT IS NOT ENOUGH***):**
- The JSON API `body` field is the complete HTML; the `excerpt` is truncated. Extract paragraphs from `body`, not `excerpt`
- Convert `body` HTML to markdown-style content array: replace `<a href="X">Y</a>` with `[Y](X)`, decode entities (`&rsquo;` → `'`, `&mdash;` → `—`, etc.), split on `</p>` boundaries, filter empty
- Capture EVERY `<img src|data-src|data-image="...">` from `body`, plus the top-level `assetUrl` (hero). Download all to `public/images/blog/{slug}-{1|body-N}.jpg`
- Preserve original publish date (`publishOn` ms → `formatDate()`), author (`authorId` → resolve via `/blog?format=json` `authors` array)

**Slug hygiene at scale (***MANDATORY — 100% UNIQUE, ZERO CMS GARBAGE***):**
- Squarespace `urlId` is often a 30-char random hash for posts published before slugs were required (e.g. `zm2ilyi6ur54dz6kerktqt0kipj7on`). NEVER use these — derive a clean slug from the title
- Multiple posts can share the same `urlId` across different years (e.g. annual "PSEG" or "Thanksgiving" partner days). Disambiguate by date suffix: `pseg-summer-2023`, `pseg-feb-2023`, `thanksgiving-2019`, `thanksgiving-2024`
- Maintain a `slugOverrides` table for known-bad CMS slugs and a `datedSlugDisambig` table for collisions — both live in the generator script, version-controlled
- Hard gate: `awk '/^    slug:/{print $2}' blog-posts.ts | sort | uniq -d` must return EMPTY. Any duplicate = build fails

**Hard gates (***ALL MUST PASS BEFORE BUILD COMPLETES***):**
1. `blogPosts.length` === sitemap.xml `/blog/*` count (100%, not 80%, not "most")
2. Manual end-page slug present in `blogPosts[]` (grep for it)
3. Every post has `images[]` populated if the original had any images (zero-image post on a site where peers have images = incomplete migration)
4. Zero duplicate slugs across the array
5. Pagination wired into `/blog` page (12-per-page default), every `/blog?page=N` resolves
6. TypeScript compiles cleanly (`tsc --noEmit`)

- **The njsk.org archive incident:** First build crawled only the visible /blog page and shipped with 15 posts. Walking `?offset=` pagination revealed 75+ additional posts. Second build crawled JSON API and shipped 26 curated posts but discarded the rest as "old". User clicked "Older Posts" through 13 pages on the live site and found `/blog/faith-lutheran-new-providence` (Dec 2018) — proof the gate was still wrong. Final build: full 129-post import via JSON API + 1027 images + per-post pagination — and this rule rewritten to make 100% coverage non-negotiable. **The "manual click Older Posts to last page" check is now a permanent step in the verification loop.**

### Inline Interlinking (***EVERY PAGE — TEXT IS LINK OPPORTUNITY***)
Plain prose with zero internal links wastes SEO equity and user navigation. Every page MUST treat body text as a network of contextual cross-links to other pages and posts. This is non-negotiable for content-heavy non-profit and local-business sites.
- **Per-page minimum:** 4–8 inline links in body copy on every page (not counting nav/footer/CTA buttons). Hero subtitle, mission/about paragraphs, FAQ answers, blog post body, and footer CTA blocks all get inline links.
- **Link targets per page type:** About → /services (each sub-program with anchor), /team, /volunteer, /donate, /blog, /contact. Services → /team (staff names link to bios), /volunteer, /donate, /we-need, /blog. Blog post → 3–5 sibling posts, /donate, /volunteer, /services anchor, /team. FAQ answers → corresponding deep pages. Contact → /volunteer, /donate, /mass-schedule, /we-need.
- **Markdown link parser for string-array content:** When blog/FAQ/static content is stored as `string[]`, use a `renderInline()` helper that parses `[label](href)` syntax and emits React Router `<Link>` for internal hrefs (`/path`) and `<a target="_blank" rel="noopener">` for external (`http://`, `https://`, `mailto:`, `tel:`). Pattern: `/\[([^\]]+)\]\(([^)]+)\)/g`. Single component, used everywhere prose has links.
- **Style consistency:** All inline links use one shared className: `text-{brand}-800 font-medium underline decoration-{brand}-300 underline-offset-2 hover:text-{brand}-600 hover:decoration-{brand}-600 transition-colors`. Never style inline links per-page — define once.
- **Anchor links to sub-sections:** `/services#mens-dining-hall`, `/services#womens-center`, `/services#health-clinic` — services page IDs every program section. Cross-page links target specific anchors, not just the page top.
- **Related-posts algorithm:** Every blog post page gets a "Related Stories" 3-card grid. Tag-keyword scoring: define `RELATED_TAG_KEYWORDS` map (e.g., `volunteer: ['volunteer','team','cooking','serving']`, `partner: ['donation','corporate','church','school']`), score each candidate post by tag overlap with current post, sort by score desc + date desc, slice top 3.
- **CTA section per page:** Every non-conversion page ends with a "Three ways to help today" or "Support our mission" block linking /donate, /volunteer, /we-need (or equivalent for the business type) — not just one CTA button.
- **Hard gate:** Run `grep -c '<Link to=' src/pages/{page}.tsx` for each page. Pages with <4 inline `<Link>` instances are flagged as under-linked. Hero/footer chrome doesn't count — only body content links.

### Stylized Google Maps (***EVERY LOCATION-AWARE SITE — NEVER RAW IFRAME***)
Default Google Maps embeds clash with brand colors and look generic. Every customer-facing map MUST be stylized to match the brand and overlaid with a branded address card. No external Maps JS API key required — pure CSS filter on the iframe.
- **CSS filter recipe:** Apply to iframe `style.filter`. Maroon/red theme: `grayscale(100%) sepia(40%) hue-rotate(310deg) saturate(180%) contrast(95%) brightness(96%)`. Blue theme: `grayscale(100%) sepia(60%) hue-rotate(180deg) saturate(150%)`. Green theme: `grayscale(100%) sepia(60%) hue-rotate(70deg) saturate(140%)`. Tweak hue-rotate by 30° increments to nudge toward brand primary.
- **Brand-tinted overlay:** Iframe sits in a `relative overflow-hidden` container with rounded corners and shadow. Address card absolutely positioned `bottom-4 left-4` (or `bottom-6 left-6` on desktop) using `bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-{brand}-100 p-5`.
- **Address card content:** Brand-colored pin icon (40×40 rounded square with brand-800 background, white SVG pin), business name in heading font, full address as `<address>` element, "Get directions →" external link to `https://www.google.com/maps/dir/?api=1&destination={url-encoded-address}`.
- **Reusable component:** Build a single `<StylizedMap title? height? className? />` component used on /contact, /location, /mass-schedule, footer maps, and any pSEO location pages. Don't duplicate the iframe + filter + overlay across pages.
- **Lightbox protection:** Add `data-no-zoom="true"` to iframe so site-wide image lightbox click-handler skips it.
- **Hard gate:** No raw `<iframe src="https://www.google.com/maps">` on any page. All map embeds route through the stylized component. Visual QA: AI vision must confirm map is brand-tinted, not default green/blue Google colors.

### Footer Logo Color Inversion (***ImageMagick alpha-channel recipe***)
Most logos are designed for white backgrounds (dark text/marks on white). Footers are usually dark — placing a white-bg logo on a dark footer creates a glaring white rectangle. The fix is alpha-channel extraction + colorize, NOT `mix-blend-screen` (which leaves halos and breaks against gradients).
- **The recipe (works for any single-color-on-white logo):**
  ```bash
  magick logo.png \
    \( +clone -alpha off -colorspace gray -level 0%,90% -negate \) \
    -alpha off -compose CopyOpacity -composite \
    -fill white -colorize 100 \
    logo-footer.png
  ```
  How it works: `+clone -alpha off -colorspace gray` makes a grayscale copy of the original. `-level 0%,90% -negate` produces an alpha mask where dark pixels (text/marks) become opaque white and white background becomes transparent black. `-compose CopyOpacity -composite` applies that mask as the alpha channel of the original. `-fill white -colorize 100` paints all visible pixels pure white, leaving alpha intact.
- **Color variants:** Replace `-fill white -colorize 100` with `-fill "#FFD700" -colorize 100` for gold, etc. The shape comes from alpha; the fill gives the new color.
- **Output:** Save as PNG (preserves alpha). Generate two sizes: full (1920+ wide) and small (400px wide for retina/footer). Place in `public/logo-footer.png` + `public/logo-footer-small.png`.
- **Verification (before shipping):** Composite the result onto the actual footer color to confirm visibility:
  ```bash
  magick -size 600x200 xc:"#3a0a18" logo-footer.png -gravity center -composite verify.png
  open verify.png
  ```
  If the logo is invisible or cut off, the alpha mask is wrong — re-run with `-level 0%,80%` or adjust threshold.
- **Common failure modes:** (1) Output appears solid maroon = alpha was applied inversely; the recipe above already corrects this. (2) Output is fully transparent = alpha was zeroed everywhere; check that input logo actually has dark marks on white (run `magick identify -verbose logo.png | grep -i mean` — mean should be near white if the bg is white). (3) Halos/edges visible at small sizes = `-level` threshold too aggressive; lower the upper bound from 90% to 70%.
- **Why not mix-blend-screen:** CSS blend modes work on rendered pixels but interact unpredictably with backdrop filters, browser rendering quirks on Safari, and partial-opacity gradient backgrounds. They also can't be used in OG share images, email headers, or PDF exports. ImageMagick produces a real PNG with a real alpha channel — works everywhere.

### Design System (***skill 10 — MANDATORY***)
Read ~/.agentskills/10-experience-and-design-system/SKILL.md for full design system.
Apply ALL patterns from "Local Business Design Patterns (SITE GENERATION)" section.

- Dark-first: dark base color from _brand.json (fallback: extracted from logo/site), brand-appropriate overrides via OKLCH
- Typography: clamp() fluid scale (1rem→1.125rem body, 2.5rem→4rem hero), brand heading font or fallback
- Cascade layers: @layer reset, base, components, utilities — native CSS nesting, no preprocessor
- Container queries for component-responsive cards (not just viewport breakpoints)
- 10+ @keyframes: fadeInUp, slideIn, scaleIn, shimmer, float, pulse, gradientShift, borderGlow, parallax, typewriter
- Glassmorphism cards: bg-white/5 backdrop-blur-md border border-white/10
- Gradient text on key headings: bg-clip-text text-transparent bg-gradient-to-r
- 25+ inline SVG decorative elements (geometric shapes, section dividers)
- IntersectionObserver on every section for scroll-triggered animations
- Staggered animation delays on card grids (0.1s between each)
- Anti-slop check: grep for banned words before build (see skill 09 copy-rules)
- Apple Test: "Would Apple ship this?" If no → redesign before deploy

### Sourced Facts (***NON-NEGOTIABLE — rules/citations.md***)
Every quantitative claim (%, N, $, ratio, comparison, year-claim, "X% of users") MUST cite a source inline using APA 7th ed format. Read `_citations.json` for full bibliography keyed by `refId`.
- Wrap claim with `<Citation refId="ref-1">claim text</Citation>` — renders inline superscript link
- Add `<ReferencesList />` to every page footer that contains cited claims (auto-renders from `_citations.json`)
- For hero/section stats use `<SourcedStat value={...} label={...} refId="ref-N" />` — animated number with citation badge
- Source hierarchy: peer-reviewed (Nature, JAMA, ACM, IEEE) > .gov/.edu (CDC, BLS, NIST) > primary data (10-K, official APIs) > industry research (Gartner, Forrester, Pew, Statista). Wikipedia ONLY to find the primary source it cites.
- Banned phrases (replace with cited fact OR delete): "studies show|research suggests|most users|industry-leading|trusted by|proven|widely-recognized|recent studies|experts agree|countless|numerous|many|often|typically"
- JSON-LD: Article/BlogPosting/FAQPage/Claim schemas MUST include `citation: CreativeWork[]` array. Boosts AI search citation inclusion 16%→54% (Brewer, 2024).
- Build gate: `node /home/cuser/validate-citations.js dist/` greps for unsourced `\d+%|\$\d+[MBK]|\d+x|\d+ users|since \d{4}` patterns. Any unmatched numeric → fail. Fix or remove the claim.
- Anecdotes and brand voice ("We're sharp.") don't need cites — only quantitative/comparative claims do. Hero headlines stay clean; citations live in body copy + ReferencesList.

### Content Rules (***PRESERVE EVERYTHING***)
- Word count must MATCH OR EXCEED original site (never less content than before)
- 5000+ words minimum real content (from research + scraped content) — most rebuilds will far exceed this
- Migrate ALL substantive text from _scraped_content.json — rewrite for quality, preserve substance
- Blog posts, news articles, event recaps → individual pages with original publish dates
- Every claim factually accurate from _research.json
- Address links → Google Maps: https://www.google.com/maps/dir/?api=1&destination={{encoded_address}}
- Phone → tel: links | Email → mailto: links
- NO lorem ipsum | NO placeholder text | NO TODO stubs
- Primary keyword "{{businessType}} in {{city}}" in H1, title, meta, first paragraph

### Images (***CRITICAL***)
- USE EVERY IMAGE in assets/ — check _image_profiles.json for placement suggestions
- Hero: assets/hero-* or highest quality_score image as background with gradient overlay
- Gallery: full-width slider/carousel with ALL images
- Service cards: relevant images matched by suggested_placement
- No external image URLs (hotlinking blocked)
- All images: lazy loading (except hero), width/height attributes, descriptive alt text

### Image Optimization Pipeline (***NON-NEGOTIABLE — skill 12***)
Every image in assets/ MUST be processed before build:
1. Generate responsive variants: 320w, 640w, 1280w, 1920w (skip if source narrower)
2. Convert to WebP (quality 80) + AVIF (quality 70) for each variant
3. Generate PNG fallback at 1280w for legacy browsers
4. Generate 20px blur placeholder (base64 WebP) per image
5. Extract dominant color per image for CSS placeholder
6. Store all variants alongside originals in assets/

Use `<ResponsiveImage>` component from `src/components/local/ResponsiveImage`:
```html
<ResponsiveImage src="assets/hero.jpg" alt="Business exterior" eager />
```
Renders `<picture>` with AVIF→WebP→fallback, srcset 320-1920w, blur placeholder.

Hero image: `eager` + `fetchpriority="high"` + preload link in `<head>`.
All other images: `loading="lazy"` + `decoding="async"`.
Max single optimized image: 200KB. Total page images: <500KB.
Original PNG/JPG kept as source, never served to browser.

### Interactions
- Every button: hover (scale + glow), active (press), focus (ring)
- Every link: hover (color change + underline animation)
- Every card: hover (lift + shadow + border glow)
- Smooth scroll on ALL anchor links (scrollIntoView({ behavior: 'smooth' }), never #href)
- Mobile hamburger menu with slide-in animation
- Back-to-top button with fade-in on scroll

### SEO (complete implementation)
- <title> under 60 chars: "{{primaryKeyword}} | {{businessName}}"
- <meta description> under 160 chars with keyword + CTA
- <link rel="canonical" href="https://{{slug}}.projectsites.dev{{path}}">
- JSON-LD LocalBusiness with ALL available structured data
- FAQPage schema on FAQ section
- BreadcrumbList schema on sub-pages
- Open Graph + Twitter Card meta tags
- robots.txt + sitemap.xml with all pages
- Internal linking: every page links to 2+ other pages
- Image alt text contains relevant keywords

### Conditional Features
{{#if business_email}}
- Contact form POSTing to https://projectsites.dev/api/contact-form/{{slug}}
- Fields: name (required), email (required, validated), phone (optional), service dropdown (from _domain_features.json services), message (required, 500 char max)
- Turnstile invisible widget (data-appearance="interaction-only") on submit
- Success: green checkmark animation + "We'll respond within 24 hours" + fade to thank-you state
- Error: inline field validation (red border + helper text), network error toast with retry
- Zod schema validation client-side before submit
- Accessible: aria-describedby on all fields, focus ring, label association, error announcements via aria-live
{{else}}
- "Get in Touch" section with phone (tel: link), address (Maps link), social links (verified only), full NAP
- Click-to-call button styled as primary CTA on mobile
{{/if}}

{{#if lat_lng}}
- Google Maps embed: <iframe src="https://www.google.com/maps/embed/v1/place?key={{GOOGLE_MAPS_KEY}}&q={{lat}},{{lng}}&maptype=roadmap" width="100%" height="400" style="border:0;border-radius:12px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade">
- "Get Directions" button → https://www.google.com/maps/dir/?api=1&destination={{encoded_address}}
- Address card with opening hours (from _places.json) beside map
- Dark map style via &style=feature:all|element:geometry|color:0x1a1a2e (brand-matched)
- Mobile: map collapses to 250px with "Expand Map" tap target
{{/if}}

{{#if google_rating}}
- Hero trust badge: "{{rating}}/5 stars from {{review_count}} reviews" with animated star SVGs (fill animation on scroll)
- Dedicated testimonials section: 3 real review quotes in glassmorphism cards with reviewer initial avatar, star rating, relative date
- JSON-LD aggregateRating on LocalBusiness schema
- Review carousel on mobile (swipe gesture), grid on desktop
{{/if}}

{{#if videos}}
- Video hero section: YouTube embed with custom play button overlay (brand-colored), lazy iframe load on click (performance)
- Video gallery: thumbnail grid, lightbox playback, category tabs if >3 videos
- Pexels B-roll: muted autoplay background loops (max 2MB each, poster frame)
{{/if}}

### Multimedia Enhancement (***ALWAYS***)
- Hero: parallax background with gradient overlay (brand primary → transparent), floating geometric SVG accents
- Gallery: masonry grid with lightbox (Dialog component), image count badge, swipe on mobile
- Before/after slider (if applicable): CSS clip-path with drag handle for service showcases
- Testimonial cards: quote marks SVG, reviewer photo/initial, animated border glow on hover
- Stats counter: animated number counting (IntersectionObserver triggered), with unit labels
- Trust badges section: payment icons, certifications, "Serving {{city}} since {{year}}" with verified year

### Offline Mode (***EVERY SITE — service worker***)
Service worker (`public/sw.js`) pre-installed in template. Caches:
- App shell: index.html, CSS, JS bundles, manifest, fonts
- Images: cache-first, max 200 items (all gallery/hero/service images)
- HTML pages: network-first with cache fallback
- EXCLUDES: analytics scripts (posthog, gtag, gtm)

Registration in main.tsx (production only, skips dev).
Critical for: rural businesses with poor connectivity, in-store kiosk displays, repeat visitors.
After site build, verify: disconnect network → refresh → site loads from cache.

### Local Conversion Components (***ALWAYS FOR LOCAL BUSINESS***)
- NAPFooter: schema.org microdata, tel:/mailto:/Maps links, hours with today highlighted, social icons
- ReviewCTA: star-gate (>=4→Google review link, <3→private feedback), QR code
- QuickActions: mobile-only 2x2 grid (Call, Directions, Book, Menu), 48px touch targets
- StickyPhoneCTA: mobile fixed bottom bar, hides when footer visible
- SpeedDial: floating action button, expands to show phone/email/directions/booking
- EmergencyBanner: auto-shows after business hours with emergency phone number
- BookingEmbed: Calendly/Acuity/Square iframe OR custom booking form
- BeforeAfterSlider: CSS clip-path drag comparison (contractors, salons, dental)

### Schema Generation (***NON-NEGOTIABLE***)
Import `generateLocalBusinessSchema` from `src/components/local/LocalSchemaGenerator`.
Pass `_research.json` data → outputs complete JSON-LD with: @type, name, PostalAddress, telephone, geo, openingHoursSpecification, image, sameAs, aggregateRating, priceRange, areaServed, hasMenu (restaurant), paymentAccepted, knowsAbout.
Also generate: FAQPage schema on FAQ sections, BreadcrumbList on sub-pages.
Validate: Google Rich Results Test before deploy.

### Service Area Pages (pSEO — IF service-area business)
{{#if area_served}}
- Generate `/service-area/{city}` for each city in _research.json.operations.areaServed
- Each page: unique H1 "{service} in {city}", localized intro paragraph, embedded map centered on city
- Link all service area pages from footer and sitemap.xml
- JSON-LD areaServed array matches generated pages
{{/if}}

### GBP Review Deep Link
- "Leave a Review" button: `https://search.google.com/local/writereview?placeid={{place_id}}`
- Place in: thank-you state after form submit, contact page, ReviewCTA component
- QR code SVG in assets/review-qr.svg for print materials

### Print Stylesheet
Add to index.css:
```css
@media print {
  header, footer, .sticky-cta, .speed-dial, nav, .back-to-top { display: none; }
  body { background: white; color: black; font-size: 12pt; }
  a[href]::after { content: " (" attr(href) ")"; font-size: 0.8em; }
  img { max-width: 100%; }
}
```

### PWA Manifest
Generate `public/site.webmanifest`:
```json
{
  "name": "{{businessName}}",
  "short_name": "{{shortName}}",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "{{brand_primary}}",
  "background_color": "{{brand_background}}",
  "icons": [
    {"src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"}
  ]
}
```
Add `<link rel="manifest" href="/site.webmanifest">` to index.html.

### SMS Deep Links
Alongside every `tel:` link, add `sms:` link option. Track as `sms_click` event.
Mobile: show both "Call" and "Text" buttons side by side.

### Competitor Comparison Page (IF competitor data exists)
{{#if competitors}}
- Generate `/why-choose-us` page from _research.json.competitors[]
- H1: "Why Choose {{businessName}} Over the Competition"
- Comparison table: features, rating, reviews, years in business
- Every comparison factual from research data
- JSON-LD: no schema needed, pure content play
{{/if}}

### FAQ Auto-Generation from Reviews
Mine _research.json.trust.reviews[] for recurring themes/questions.
Generate 8-12 FAQ items with FAQPage schema. Real customer language = better AI citation.
Place on dedicated /faq page AND inline on relevant service pages.

### Weather-Aware Hero (outdoor businesses only)
{{#if outdoor_business}}
- Fetch weather from _research.json.operations.geo via free weather API
- Swap hero messaging based on conditions: rain→"Rainy season? Book your {service}" | snow→"Snow removal available" | heat→"Beat the heat with {service}"
- Fallback: standard hero if API unavailable
{{/if}}

### Domain-Specific Features
Read _domain_features.json and implement ALL listed features for this business category.

## Phase 2: Build + Inspect + Fix

After customizing all files:
1. Run `npm run build` — fix ANY errors
2. Run `node /home/cuser/validate-urls.js` — compare _scraped_content.json.original_urls against new sitemap + _redirects. Fail if any URL unaccounted.
3. Run `node /home/cuser/validate-citations.js dist/` — grep for unsourced numeric claims. Fail if any `\d+%|\$\d+[MBK]|\d+x|\d+ users|since \d{4}` lacks a `<Citation refId="...">` wrapper resolving to `_citations.json`.
4. Run `node /home/cuser/inspect.js dist/index.html` — read the GPT-4o critique
4. Fix ALL issues scoring below 8/10 in the critique
5. Run `npm run build` again — verify zero errors
6. If inspect score < 8: repeat fix+build (max 3 iterations)

## Phase 3: Polish Pass

Review the entire site one more time:
1. Every section has a dark or brand-colored background? No plain white sections.
2. Every button/link has hover + active + focus styles?
3. Smooth scroll on all same-page links?
4. All Lucide icon imports are valid names?
5. Mobile responsive at 375px? No horizontal overflow?
6. Copyright year is current?
7. Logo in every page header?
8. Footer has Privacy Policy + Terms links?
9. No console.log statements?
10. All URLs use HTTPS?
11. Fonts have preconnect hints?
12. Contact form only if business email exists?
13. Social links only to verified URLs?

## Phase 4: Upload to R2

After successful build, run: `node /home/cuser/upload-to-r2.mjs`
This uploads all dist/ files to R2 at sites/{{slug}}/{{version}}/.
```

## Prompt Assembly Logic

The Worker builds this prompt dynamically:
1. Read form data (business name, address, category, notes, uploaded files)
2. Inject research results into template variables
3. Select domain features from _domain_features.json
4. Conditional blocks expand based on available data (email, geo, rating, videos)
5. Write assembled prompt to `_prompt.txt` in build directory

## Inspect Script Integration

`/home/cuser/inspect.js` — pre-baked in Docker image. Takes HTML file path, sends first 14KB to GPT-4o with "senior Stripe web designer" persona. Scores 1-10 across: color contrast, typography, layout/spacing, animations, images, mobile, brand consistency, visual polish. Returns `{ score, issues[], recommendations[] }` as JSON to stdout. 25s timeout. Requires `OPENAI_API_KEY`.

## Prompt Evolution

Every successful build → analyze output quality. Patterns that improve quality get folded into this prompt template. Criticism from users → generalized into rules added to quality-gates.md. The prompt chain gets better with every iteration.

## Blog Import & Editorial Pipeline (***NON-NEGOTIABLE***)

Any time the build imports long-form blog content (Squarespace, WordPress, Medium, custom CMS), a two-stage pipeline runs:

**Stage 1 — Cleanup (`clean-blog-corpus.mjs` pattern):** strip CMS residue (Squarespace `#block-yui_*`, `.sqs-*`, `.margin-wrapper`, raw `<style>` blocks), AI-restructure flat HTML into typed blocks (`lead | heading | paragraph | quote | callout`), generate SEO keywords + 120-180-char excerpt per post, deduplicate images by md5 hash, delete orphan media with `--delete-orphans`. Direct quotes preserved verbatim. Names/dates/facts never rewritten.

**Stage 2 — Editorial pass (`enhance-blog-posts.mjs` — see reference script in this skill dir):** GPT-4o-mini editorial pass over every cleaned post. Mandates:

1. **Grammar/spelling/professional tone** — fix without altering author voice or factual content.
2. **Quote preservation** — anything in `quote` blocks or `"..."` strings stays verbatim.
3. **Interlinking** — inject 2-5 contextual `[label](/path)` markdown links per post: other blog posts (`/blog/{slug}`) AND site sections (`/about`, `/services`, `/team`, `/volunteer`, `/donate`, `/we-need`, `/contact`, `/faq`, plus any domain-specific pages). Pass the full slug list and section list into the system prompt so the model picks relevant anchors.
4. **Contact hyperlinks** — wherever these strings appear in body copy, wrap them as anchors:
   - `volunteer@{org}` → `mailto:volunteer@{org}`
   - `info@{org}` / generic email → `mailto:{email}`
   - `(NNN) NNN-NNNN` phone numbers → `tel:+{e164}`
   - Full street address → `/contact`
5. **Block-typed JSON output** — model must return the same `{ type, text }` block array shape, never raw HTML or markdown blob.
6. **Renderer support** — body renderer must handle inline markdown links via a `renderInline` regex (`/\[([^\]]+)\]\(([^)]+)\)/g`) that splits text into `<a>` + plain spans. Without this, links render as raw `[label](/path)` strings.

**Operations:** concurrency 5-8 against OpenAI (`OPENAI_API_KEY` env). CLI flags: `--only=slug` (single post), `--limit=N` (truncate corpus), `--concurrency=N`. Idempotent — re-running on already-enhanced posts produces near-identical output. Failures surface per-slug (`console.warn(\`FAIL ${slug}: ${err}\`)`) — never silently swallow.

**Hard gate:** after enhancement, every post must have ≥2 outbound interlinks, and there must be zero raw occurrences of the org's contact strings (email, phone, address) without an anchor wrapper. Run a regex sweep on the serialized `blog-posts.ts` to enforce.

**Reference implementation:** `/Users/apple/.agentskills/15-site-generation/enhance-blog-posts.mjs` (copied from njsk.org build, 2026-04-30). Adapt SITE_SECTIONS array + contact hyperlink table per project. Keep the system prompt's "preserve quotes verbatim" clause unchanged.
