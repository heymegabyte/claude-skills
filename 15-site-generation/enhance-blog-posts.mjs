#!/usr/bin/env node
/**
 * Editorial enhancement pass for src/data/blog-posts.ts.
 *
 * For every post, calls GPT-4o-mini with:
 *   - the post's current blocks
 *   - a catalog of every OTHER post (for interlinking)
 *   - the site's section routes (for cross-page interlinking)
 *   - contact hyperlink rules
 *
 * GPT returns enhanced blocks where:
 *   - typos / grammar / awkward phrasing are corrected
 *   - direct quotes are preserved verbatim
 *   - facts, names, dates, organizations are preserved
 *   - 1-3 *natural* interlinks to other posts are inserted using markdown
 *     `[label](/blog/<slug>)` syntax — only when topically relevant
 *   - 1-2 interlinks to site sections (/donate, /volunteer, /services,
 *     /we-need, /mass-schedule, /about, /team, /contact) are inserted
 *   - volunteer@njsoupkitchen.org -> [...](mailto:...)
 *   - info@njsoupkitchen.org -> [...](mailto:...)
 *   - (973) 623-0822 -> [...](tel:+19736230822)
 *
 * Idempotent: re-running re-enhances. Safe to run multiple times — the
 * model is at temperature 0.15 and the prompt forbids changing facts or
 * adding new content.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/enhance-blog-posts.mjs
 *   OPENAI_API_KEY=sk-... node scripts/enhance-blog-posts.mjs --only=federal-reserve-bank-2025
 *   OPENAI_API_KEY=sk-... node scripts/enhance-blog-posts.mjs --limit=10
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'src/data/blog-posts.ts');

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Set OPENAI_API_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith('--only='));
const onlySlug = onlyArg ? onlyArg.slice('--only='.length) : null;
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.slice('--limit='.length), 10) : Infinity;
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
const concurrency = concurrencyArg ? parseInt(concurrencyArg.slice('--concurrency='.length), 10) : 5;

const SITE_SECTIONS = [
  { path: '/about', label: 'our story', topic: 'history, mission, founding by Msgr. John P. Hourihan' },
  { path: '/services', label: 'our services', topic: 'mens dining hall, womens & childrens center, health clinic' },
  { path: '/team', label: 'the team', topic: 'staff, volunteers, leadership' },
  { path: '/volunteer', label: 'volunteer with us', topic: 'volunteering, group sign-ups, corporate teams' },
  { path: '/donate', label: 'donate today', topic: 'donations, financial support, $15 feeds one for a week' },
  { path: '/we-need', label: "what we need", topic: 'in-kind donations, coffee, canned goods, hygiene kits' },
  { path: '/mass-schedule', label: 'mass schedule', topic: 'Catholic worship, daily mass, sign-language interpretation' },
  { path: '/contact', label: 'contact us', topic: 'phone, email, directions to 22 Mulberry Street, Newark NJ' },
  { path: '/faq', label: 'frequently asked questions', topic: 'eligibility, hours, how to help' },
];

function parsePosts(src) {
  const m = src.match(/export const blogPosts:\s*BlogPost\[\]\s*=\s*/);
  if (!m) throw new Error('blogPosts export not found');
  const start = m.index + m[0].length;
  let depth = 0;
  let inStr = null;
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === inStr) inStr = null;
    } else if (c === '"' || c === "'" || c === '`') inStr = c;
    else if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) {
        return {
          prefix: src.slice(0, start),
          arrLiteral: src.slice(start, i + 1),
          suffix: src.slice(i + 1),
        };
      }
    }
    i++;
  }
  throw new Error('unterminated array');
}

const evalArr = (lit) => new Function(`"use strict"; return (${lit});`)();

function serialize(posts) {
  const I = '  ';
  const out = ['['];
  for (const post of posts) {
    out.push(`${I}{`);
    out.push(`${I}${I}slug: ${JSON.stringify(post.slug)},`);
    out.push(`${I}${I}title: ${JSON.stringify(post.title)},`);
    out.push(`${I}${I}date: ${JSON.stringify(post.date)},`);
    out.push(`${I}${I}author: ${JSON.stringify(post.author)},`);
    out.push(`${I}${I}excerpt: ${JSON.stringify(post.excerpt)},`);
    out.push(`${I}${I}keywords: [`);
    for (const k of post.keywords || []) out.push(`${I}${I}${I}${JSON.stringify(k)},`);
    out.push(`${I}${I}],`);
    out.push(`${I}${I}content: [`);
    for (const p of post.content) out.push(`${I}${I}${I}${JSON.stringify(p)},`);
    out.push(`${I}${I}],`);
    out.push(`${I}${I}blocks: [`);
    for (const b of post.blocks || [])
      out.push(`${I}${I}${I}{ type: ${JSON.stringify(b.type)}, text: ${JSON.stringify(b.text)} },`);
    out.push(`${I}${I}],`);
    out.push(`${I}${I}images: [`);
    for (const img of post.images) out.push(`${I}${I}${I}${JSON.stringify(img)},`);
    out.push(`${I}${I}],`);
    out.push(`${I}},`);
  }
  out.push(']');
  return out.join('\n');
}

const SYSTEM_PROMPT = `You are a senior editor for a faith-based non-profit soup kitchen blog (St. John's Soup Kitchen, Newark NJ — feeding the hungry since 1982). Your job: take a post's existing content blocks and produce a polished, professionally edited version with natural interlinking.

Editorial rules (NON-NEGOTIABLE):
- Preserve every direct quote verbatim. A direct quote is anything inside "...", '...', curly quotes, or attributed with words like "said", "told us", "says".
- Preserve all proper nouns, dates, organization names, dollar amounts, and factual claims. Do NOT invent.
- Fix typos, missing spaces, broken hyphenation, awkward punctuation, dangling modifiers, run-on sentences, comma splices, subject-verb disagreement.
- Tighten wordy passages. Cut filler. Replace AI-slop verbs (leverage, utilize, foster, empower, harness, elevate, bolster, spearhead, delve into) with plain ones.
- Improve flow: vary sentence length, use active voice, lead paragraphs with a hook, end with momentum.
- Tone: warm, dignified, factual, generous, never preachy. Sound like a thoughtful parishioner writing for neighbors.
- Maintain the existing block structure (same number of blocks, same types) UNLESS combining adjacent paragraphs improves readability — then you may merge or split blocks, but keep total count within ±2.

Interlinking rules (REQUIRED — every post must add 2-5 inline links):
- Insert markdown-style links inline within block text: [link text](/path)
- Link 1-3 times to OTHER blog posts when topically relevant: [text](/blog/<slug>) — pick from the catalog provided
- Link 1-2 times to site sections — examples: [donate](/donate), [volunteer](/volunteer), [men's dining hall](/services#mens-dining-hall), [our team](/team), [what we need](/we-need), [mass schedule](/mass-schedule), [our story](/about), [contact us](/contact), [FAQ](/faq)
- Link text must read naturally — never "click here", never "read more". The label IS part of the sentence.
- Never link the same anchor twice in one block. Spread links across multiple blocks.
- If the post already mentions another post's subject (e.g. PSEG, Felician University, Federal Reserve Bank), link to that post.

Contact hyperlinking (REQUIRED whenever these strings appear in a block):
- volunteer@njsoupkitchen.org → [volunteer@njsoupkitchen.org](mailto:volunteer@njsoupkitchen.org)
- info@njsoupkitchen.org → [info@njsoupkitchen.org](mailto:info@njsoupkitchen.org)
- (973) 623-0822 OR 973-623-0822 OR 9736230822 → [(973) 623-0822](tel:+19736230822)
- 22 Mulberry Street (the address) → [22 Mulberry Street](/contact)

Output JSON only:
{
  "blocks": [{"type":"lead|heading|paragraph|quote|callout","text":"..."}],
  "excerpt": "120-180 char editorial summary, no truncation marks",
  "keywords": ["3-7 SEO keywords"]
}

Block types:
  "lead": one short, punchy opening (~25-50 words) — the hook. Exactly one per post.
  "heading": short subhead (3-7 words) above a thematic group. Use only when 3+ paragraphs benefit from grouping.
  "paragraph": body text — interlinks live here.
  "quote": pull-quote sentence taken verbatim from the body — copy don't move.
  "callout": single-sentence emphasis on a key fact, stat, or invitation (e.g. "Want to help? [Volunteer with us](/volunteer)." "Every Tuesday at 7:00 AM.").

Aim for: 1 lead, 0-2 headings, 3-8 paragraphs, 0-1 quote, 0-1 callout.`;

async function enhancePost(post, otherPostsCatalog) {
  const currentBlocks = (post.blocks && post.blocks.length ? post.blocks : post.content.map((t, i) => ({ type: i === 0 ? 'lead' : 'paragraph', text: t })));

  const sectionsText = SITE_SECTIONS.map((s) => `  ${s.path} — ${s.topic}`).join('\n');
  const catalogText = otherPostsCatalog.map((p) => `  /blog/${p.slug} — ${p.title}: ${p.excerpt}`).join('\n');

  const user = `Post being edited:
  title: ${post.title}
  slug: ${post.slug}
  date: ${post.date}

Current blocks:
${currentBlocks.map((b, i) => `  [${i}] (${b.type}) ${b.text}`).join('\n')}

Site sections you may link to:
${sectionsText}

Other posts in the catalog (link to topically relevant ones):
${catalogText}

Return enhanced blocks now. Insert markdown links inline. Preserve quotes and facts verbatim. Aim for 2-5 total interlinks across the whole post.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.15,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  if (!parsed || !Array.isArray(parsed.blocks) || !parsed.blocks.length) {
    throw new Error('invalid response shape');
  }
  return {
    blocks: parsed.blocks
      .filter((b) => b && typeof b.type === 'string' && typeof b.text === 'string')
      .filter((b) => ['lead', 'heading', 'paragraph', 'quote', 'callout'].includes(b.type))
      .map((b) => ({ type: b.type, text: String(b.text).trim() }))
      .filter((b) => b.text),
    excerpt: typeof parsed.excerpt === 'string' && parsed.excerpt.trim() ? parsed.excerpt.trim() : post.excerpt,
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
      : (post.keywords || []),
  };
}

function buildCatalog(posts, exceptSlug) {
  return posts
    .filter((p) => p.slug !== exceptSlug)
    .map((p) => ({ slug: p.slug, title: p.title, excerpt: (p.excerpt || '').slice(0, 140) }));
}

async function pool(items, n, work) {
  const queue = [...items];
  let done = 0;
  const results = new Array(items.length);
  async function worker() {
    while (queue.length) {
      const idx = items.length - queue.length;
      const item = queue.shift();
      try {
        results[idx] = await work(item, idx);
      } catch (e) {
        console.warn(`  FAIL ${item.slug}: ${e.message}`);
        results[idx] = { error: e.message, slug: item.slug };
      }
      done++;
      if (done % 5 === 0 || done === items.length) console.log(`  ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

async function main() {
  const src = await readFile(DATA_FILE, 'utf8');
  const { prefix, arrLiteral, suffix } = parsePosts(src);
  const posts = evalArr(arrLiteral);
  console.log(`Loaded ${posts.length} posts.`);

  const targets = onlySlug
    ? posts.filter((p) => p.slug === onlySlug)
    : posts.slice(0, limit === Infinity ? posts.length : limit);

  if (!targets.length) {
    console.error(onlySlug ? `No post matches slug "${onlySlug}"` : 'No posts to enhance');
    process.exit(1);
  }
  console.log(`Enhancing ${targets.length} posts (concurrency=${concurrency})...`);

  let succeeded = 0;
  let failed = 0;

  const updates = await pool(targets, concurrency, async (post) => {
    const catalog = buildCatalog(posts, post.slug);
    const enhanced = await enhancePost(post, catalog);
    return { slug: post.slug, ...enhanced };
  });

  for (const u of updates) {
    if (u.error) {
      failed++;
      continue;
    }
    const post = posts.find((p) => p.slug === u.slug);
    if (!post) continue;
    post.blocks = u.blocks;
    if (u.excerpt) post.excerpt = u.excerpt;
    if (u.keywords && u.keywords.length) post.keywords = u.keywords;
    succeeded++;
  }

  await writeFile(DATA_FILE, prefix + serialize(posts) + suffix, 'utf8');

  console.log(`\nDone. Enhanced ${succeeded}/${targets.length}. Failed: ${failed}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
