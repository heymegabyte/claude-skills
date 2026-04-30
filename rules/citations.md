# Citations & Sources (***UNIVERSAL — EVERY QUANTITATIVE CLAIM***)
Every %, N, $, ratio, comparison, time-claim, "X% of users" must cite source inline `(Author, Year)` + entry in `references` array (APA 7th ed). No exceptions. Unsourced numbers = AI slop = rejected at build.
Banned phrases (replace with cited fact OR delete): "studies show|research suggests|most users|industry-leading|trusted by|proven|widely-recognized|leading provider|cutting-edge research|recent studies|experts agree|countless|numerous|many|some|often|typically|generally"
Source hierarchy (use highest available): peer-reviewed (Nature, JAMA, ACM, IEEE)>.gov/.edu (CDC, BLS, NIST, NIH)>primary data (10-K filings, company reports, official APIs)>established industry research (Gartner, Forrester, Pew, Statista)>Wikipedia ONLY to find the primary source it cites.
Forbidden sources: AI-summary articles (LLM cannot cite itself), content farms, blog regurgitations, "according to a study" without naming study, social media posts, undated sources.
APA 7th ed inline: `(Smith, 2024)` | `Smith (2024)` | `(Smith & Lee, 2024)` | `(Smith et al., 2024)` 3+ authors | `(World Health Organization, 2023)` org-author | `(Smith, 2024, p. 47)` page-specific.
APA 7th ed reference list entry: `Smith, J. (2024). Title in sentence case. Journal Name, 12(3), 45-67. https://doi.org/10.xxxx/xxxxx`. Web: `Author, A. (Year, Month Day). Title. Site Name. URL`. Org: `Org Name. (Year). Report title. URL`.
Confidence rule: 2+ corroborating cites=high(>=0.85)|single source=medium(0.70)|self-cite/anecdote=low(<0.50, must flag in `_brand.json.warnings[]` or equivalent).
Build gate (***BUILD-BREAKING***): grep dist/ HTML for `\d+%`, `\$\d+[MBK]`, `\d+x (faster|more|times)`, `\d+ users`, `\d+ customers`, `since \d{4}` — any unsourced match=fail. Implement in `validate-citations.js` alongside `validate-urls.js`.
Schema.org: Article/BlogPosting/FAQPage/Claim JSON-LD MUST include `citation: CreativeWork[]` array per source. Boosts AI search inclusion 16%→54% (Brewer, 2024).
Render: `<Citation refId="ref-1">claim text</Citation>` → superscript link to footer `<ReferencesList />`. Mandatory on every page with quantitative content. APA bibliography hanging indent.
Conf<T> pattern (skill 15): every confidence-tracked field gets `apa_citation: string` + `source_url: string`. `_citations.json` accompanies `_research.json` with the full reference list per `refId`.
Idea-engine (skill 14): `_evidence.json` accompanies every proposed idea. Confidence>=0.8 requires 2+ APA-cited sources. Unsourced ideas auto-rejected by self-critique filter.
Copy-writing exception: brand voice claims ("Sharp. Punchy.") don't need cites — only quantitative/comparative claims do. Hero headlines stay sharp; bibliography lives in body+footer.
See: 15 research-pipeline.md (Conf<T>+_citations.json), 15 template-system.md (Citation/ReferencesList), 15 quality-gates.md (build-break), 14 SKILL.md (evidence pipeline), copy-writing.md (banned list).
