#!/usr/bin/env node
/**
 * seed-validators.mjs — emits 21+ info-mode validator stubs into ~/.agentskills/bin/.
 * Each stub logs a structured JSON line + exits 0 (NEVER fails the build).
 * Flip to strict mode by setting `STRICT_MODE = true` per validator once the
 * underlying rule has shipped clean across all benchmark sites.
 */
import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET_DIR = __dirname; // ~/.agentskills/bin

/** @type {{name:string, summary:string, ruleRef:string}[]} */
const VALIDATORS = [
  { name: 'validate-ideogram-cadence',     summary: 'Ideogram slot cadence: ≥4 foundation + ≥2 incremental.',     ruleRef: '12/build-breaking-rules' },
  { name: 'validate-media-density',        summary: '17-source multimedia fan-out + ≥3 media per section.',      ruleRef: '12/build-breaking-rules' },
  { name: 'validate-google-image-corpus',  summary: 'Google CSE image corpus ≥10 license-filtered queries.',      ruleRef: '12/build-breaking-rules' },
  { name: 'validate-podcast-presence',     summary: 'NotebookLM podcast + Podcast Index discovery + RSS feed.',   ruleRef: '12/build-breaking-rules' },
  { name: 'validate-atf-video',            summary: 'ATF hero video Sora-primary+Veo-parallel+stock-fallback.',   ruleRef: '12/build-breaking-rules' },
  { name: 'validate-credits-page',         summary: '/credits or /colophon with per-asset attribution.',          ruleRef: '12/build-breaking-rules' },
  { name: 'validate-logo-triad',           summary: 'Logo triad: horizontal+square+monogram variants.',           ruleRef: '12/build-breaking-rules' },
  { name: 'validate-favicon-set',          summary: 'real-favicongenerator 9-file set complete.',                 ruleRef: '15/build-breaking-rules' },
  { name: 'validate-og-card-per-route',    summary: 'Per-route OG 1200×630 branded card (≤100KB).',               ruleRef: 'always.md / per-route-metadata' },
  { name: 'validate-hero-poster',          summary: 'Hero poster frame: Ideogram cinematic, dims ≥1920×1080.',    ruleRef: '12/build-breaking-rules' },
  { name: 'validate-chapter-plates',       summary: 'Chapter / section plates (numbered glyphs, pattern tiles).', ruleRef: '12/build-breaking-rules' },
  { name: 'validate-blog-headers',         summary: 'Per-post blog header art generated from post topic.',        ruleRef: '12/build-breaking-rules' },
  { name: 'validate-branded-error-pages',  summary: 'Branded 404 + 500 pages with brand palette + mascot.',       ruleRef: '15/build-breaking-rules' },
  { name: 'validate-pwa-splashes',         summary: 'PWA splash screens for 6 device sizes.',                     ruleRef: 'pwa-checklist' },
  { name: 'validate-tier-badges',          summary: 'Plan / tier badges rendered via Ideogram.',                  ruleRef: '12/build-breaking-rules' },
  { name: 'validate-chapter-glyphs',       summary: 'Numbered chapter glyphs match section count.',               ruleRef: '12/build-breaking-rules' },
  { name: 'validate-pattern-tile',         summary: 'Tileable brand pattern (≥256×256 seamless).',                ruleRef: '12/build-breaking-rules' },
  { name: 'validate-stat-numerals',        summary: 'Custom stat numeral art (1-2 hero stats per page).',         ruleRef: '12/build-breaking-rules' },
  { name: 'validate-share-quote-cards',    summary: 'Share-quote cards: ≥3 quote cards across blog posts.',       ruleRef: '12/build-breaking-rules' },
  { name: 'validate-iteration-stamp',      summary: 'Iteration stamp watermark in footer (build N badge).',       ruleRef: '12/build-breaking-rules' },
  { name: 'validate-progressive-media',    summary: 'Progressive rebuild: ≥10 new media per iteration.',          ruleRef: '12/build-breaking-rules' },
  { name: 'validate-delight-moments',      summary: 'Delight moments floor min(iter+1, 6) per build.',            ruleRef: 'creativity-doctrine' },
];

function stubSource({ name, summary, ruleRef }) {
  return `#!/usr/bin/env node
/**
 * ${name}.mjs — INFO MODE stub.
 *
 * Rule: ${summary}
 * Reference: ~/.agentskills/${ruleRef}.md
 *
 * Contract: read \`process.argv[2]\` as a dist/ directory and \`process.argv[3]\`
 * as an optional \`_iteration_log.json\` path. Emit a single structured JSON
 * line to stdout describing pass/warn, exit 0 always (info mode).
 *
 * Flip \`STRICT = true\` once the underlying generator ships clean across all
 * benchmark sites (megabyte-labs, njsk, nyfb, vito's, lonemountainglobal).
 */
const STRICT = false;
const NAME = ${JSON.stringify(name)};
const RULE_REF = ${JSON.stringify(ruleRef)};
const distDir = process.argv[2] || process.env.DIST_DIR || 'dist';
const iterLog = process.argv[3] || process.env.ITER_LOG || '';

const payload = {
  validator: NAME,
  rule_ref: RULE_REF,
  mode: STRICT ? 'strict' : 'info',
  dist_dir: distDir,
  iteration_log: iterLog || null,
  status: 'stub',
  message: ${JSON.stringify('Stub validator — TODO: implement detection logic.')},
  ts: new Date().toISOString(),
};
process.stdout.write(JSON.stringify(payload) + '\\n');
process.exit(0);
`;
}

let written = 0;
let skipped = 0;
if (!existsSync(TARGET_DIR)) mkdirSync(TARGET_DIR, { recursive: true });

for (const v of VALIDATORS) {
  const path = join(TARGET_DIR, `${v.name}.mjs`);
  if (existsSync(path)) {
    skipped += 1;
    continue;
  }
  writeFileSync(path, stubSource(v), 'utf8');
  chmodSync(path, 0o755);
  written += 1;
}

console.log(JSON.stringify({
  seeded: written,
  skipped_existing: skipped,
  total: VALIDATORS.length,
  target_dir: TARGET_DIR,
}, null, 2));
