# Quality Thresholds
Readability: Flesch>=60, sentences<=25 words, paragraphs<=150 words
Performance: LCP<=2.5s (4-phase: TTFB→load delay→load time→render delay), CLS<=0.1, INP<=200ms (3-phase: input delay→processing→presentation delay). Worker CPU<=50ms p99.
Budgets: JS<=200KB gz total/route, no single chunk>250KB gz (code-split React.lazy+manualChunks), CSS<=50KB gz, fonts<=100KB woff2 preload, images<=500KB total, largest image<=200KB. PNG>200KB→re-encode WebP/JPEG before upload. og-image 1200×630 <=100KB BRANDED CARD (not raw photo). apple-touch-icon 180×180 mandatory.
A11y: axe-core 0 violations, Lighthouse>=95, contrast>=4.5:1, target size>=24px (WCAG 2.2 2.5.8), focus appearance visible (2.4.11)
Code: functions<=50 lines, cyclomatic<=10, params<=3
Security: HSTS|CSP (nonce-based strict)|X-Content-Type-Options|X-Frame-Options|Referrer-Policy|Permissions-Policy|COOP|COEP|CORP. Remove: X-XSS-Protection|Expect-CT|HPKP.
SEO strict: title 50-60 chars HARD, meta desc 120-156 chars HARD, keyphrase 0.5-3%, 4+ JSON-LD blocks per page (WebSite+Org+WebPage+BreadcrumbList min), exactly 1 H1 in HTML shell (prerender, NOT script-injected), every internal asset ref resolves to real file in build output, sitemap.xml every <url> has <lastmod>, canonical uses custom hostname when primary_hostname set, color-scheme meta present.
Animation: transform/opacity only, prefers-reduced-motion on all, will-change sparingly, scroll-driven off main thread
CSS: cascade layers(@layer reset,base,components,utilities), container queries for components, :has() for parent selection, native nesting
