# PPTX Generation on Cloudflare Workers

Source: anthropics/skills pptx pattern + pptxgenjs docs

Generate slide decks programmatically: pitch decks, board updates, donor presentations, training materials.

---

## Install

```bash
npm install pptxgenjs
```

`pptxgenjs` is pure JS, no native deps. Worker-compatible with `nodejs_compat` flag.

---

## Basic slide deck

```typescript
import PptxGenJS from "pptxgenjs";

export interface PitchDeckData {
  companyName: string;
  tagline: string;
  problem: string;
  solution: string;
  marketSize: string;
  traction: Array<{ metric: string; value: string }>;
  team: Array<{ name: string; title: string }>;
  ask: string;
}

export async function generatePitchDeck(
  env: Env,
  data: PitchDeckData,
): Promise<string> {
  const pptx = new PptxGenJS();

  // Theme
  pptx.layout = "LAYOUT_WIDE"; // 16:9
  pptx.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

  // ---- Slide 1: Title ----
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "060610" };

  titleSlide.addText(data.companyName, {
    x: 0.5, y: 1.5, w: "90%", h: 1.5,
    fontSize: 54, bold: true, color: "00E5FF",
    align: "center",
  });
  titleSlide.addText(data.tagline, {
    x: 0.5, y: 3.2, w: "90%", h: 0.8,
    fontSize: 24, color: "CCCCCC",
    align: "center",
  });

  // ---- Slide 2: Problem ----
  const problemSlide = pptx.addSlide();
  problemSlide.background = { color: "060610" };
  addSectionHeader(pptx, problemSlide, "The Problem");
  problemSlide.addText(data.problem, {
    x: 0.5, y: 2.0, w: "90%", h: 3.0,
    fontSize: 20, color: "FFFFFF",
    wrap: true, valign: "top",
  });

  // ---- Slide 3: Solution ----
  const solutionSlide = pptx.addSlide();
  solutionSlide.background = { color: "060610" };
  addSectionHeader(pptx, solutionSlide, "Our Solution");
  solutionSlide.addText(data.solution, {
    x: 0.5, y: 2.0, w: "90%", h: 3.0,
    fontSize: 20, color: "FFFFFF",
    wrap: true, valign: "top",
  });

  // ---- Slide 4: Market Size ----
  const marketSlide = pptx.addSlide();
  marketSlide.background = { color: "060610" };
  addSectionHeader(pptx, marketSlide, "Market Opportunity");
  marketSlide.addText(data.marketSize, {
    x: 0.5, y: 2.0, w: "90%", h: 3.0,
    fontSize: 20, color: "FFFFFF", wrap: true,
  });

  // ---- Slide 5: Traction ----
  const tractionSlide = pptx.addSlide();
  tractionSlide.background = { color: "060610" };
  addSectionHeader(pptx, tractionSlide, "Traction");

  data.traction.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 4.0;
    const y = 2.0 + row * 2.2;

    tractionSlide.addText(item.value, {
      x, y, w: 3.5, h: 1.0,
      fontSize: 36, bold: true, color: "00E5FF", align: "center",
    });
    tractionSlide.addText(item.metric, {
      x, y: y + 1.0, w: 3.5, h: 0.5,
      fontSize: 14, color: "AAAAAA", align: "center",
    });
  });

  // ---- Slide 6: Team ----
  const teamSlide = pptx.addSlide();
  teamSlide.background = { color: "060610" };
  addSectionHeader(pptx, teamSlide, "Team");

  data.team.forEach((member, i) => {
    const x = 0.5 + i * 4.0;
    teamSlide.addText(member.name, {
      x, y: 2.2, w: 3.5, h: 0.7,
      fontSize: 20, bold: true, color: "FFFFFF", align: "center",
    });
    teamSlide.addText(member.title, {
      x, y: 2.9, w: 3.5, h: 0.5,
      fontSize: 14, color: "7C3AED", align: "center",
    });
  });

  // ---- Slide 7: The Ask ----
  const askSlide = pptx.addSlide();
  askSlide.background = { color: "060610" };
  addSectionHeader(pptx, askSlide, "The Ask");
  askSlide.addText(data.ask, {
    x: 0.5, y: 2.0, w: "90%", h: 3.0,
    fontSize: 24, color: "00E5FF",
    align: "center", bold: true, wrap: true,
  });

  // Export
  const buffer = await pptx.write({ outputType: "arraybuffer" }) as ArrayBuffer;
  const key = `documents/decks/${data.companyName.replace(/\s+/g, "-")}-pitch.pptx`;

  await env.R2.put(key, buffer, {
    httpMetadata: {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
  });

  return env.R2.createPresignedUrl(key, { expiresIn: 3600 });
}

// Helper: section header style
function addSectionHeader(pptx: PptxGenJS, slide: PptxGenJS.Slide, title: string): void {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 1.4,
    fill: { color: "0D0D1A" },
    line: { color: "00E5FF", width: 0 },
  });
  slide.addText(title, {
    x: 0.5, y: 0.2, w: "90%", h: 1.0,
    fontSize: 32, bold: true, color: "00E5FF",
  });
}
```

---

## Route handler

```typescript
app.post("/api/documents/pitch-deck", async (c) => {
  const data = PitchDeckSchema.parse(await c.req.json());
  const url = await generatePitchDeck(c.env, data);
  return c.json({ url, expiresIn: 3600 });
});
```

---

## AI-assisted deck generation

Use Workers AI to draft slide content from a brief, then pass to `generatePitchDeck`:

```typescript
app.post("/api/documents/pitch-deck/ai-draft", async (c) => {
  const { brief, companyName } = await c.req.json();

  const response = await c.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages: [
      {
        role: "system",
        content: "You are a startup pitch deck writer. Output JSON matching the PitchDeckData schema.",
      },
      {
        role: "user",
        content: `Draft a 7-slide pitch deck for: ${brief}. Company: ${companyName}. Output valid JSON only.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const deckData = PitchDeckSchema.parse(JSON.parse((response as { response: string }).response));
  const url = await generatePitchDeck(c.env, deckData);
  return c.json({ url, data: deckData });
});
```

---

## Worker compatibility notes

- `pptxgenjs` v3.x: pure JS, no native deps, Worker-compatible
- `pptx.write({ outputType: "arraybuffer" })` returns a Promise — await it
- Add `compatibility_flags = ["nodejs_compat"]` to `wrangler.toml`
- Slide image embeds: fetch image → convert to base64 → `slide.addImage({ data: base64string, ... })`
- Maximum practical deck size in Workers: ~50 slides, ~20MB output — use Queues for larger
