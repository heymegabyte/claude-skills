---
name: "auto-logo"
description: "Automatically generate, evaluate, and select the best logo and app icon for a project using Ideogram AI. Use when a project is missing a logo, favicon, or app icon, or when the user asks to create/improve branding assets. Generates multiple variations via Ideogram API, uses visual inspection to pick the best one, processes it into all required favicon sizes, and outputs proper HTML meta tags via realfavicongenerator conventions."
---

# Auto Logo Generation Skill

Generates professional logos and app icons using Ideogram AI, evaluates them visually, selects the best option, and processes it into a complete favicon/meta tag set.

## When to use

- A project has no logo, favicon, or app icon
- The user asks to create, generate, or improve a logo
- A site is being deployed without proper branding assets
- The user wants to refresh or replace an existing logo
- Favicon files are missing or placeholder

## When NOT to use

- The project already has a finalized logo the user is happy with
- The task is about editing an existing vector/SVG logo (use imagegen or manual editing)
- The user wants a logo designed in Figma or another design tool

## Requirements

- **IDEOGRAM_API_KEY** environment variable or provided by user
- Python 3 with Pillow (`PIL`) for image processing
- `curl` for API calls

## Workflow

### Step 1: Gather context

Before generating, collect:
1. **Brand name** (required) — the text that should appear in/on the logo
2. **Brand colors** — hex codes for primary and secondary colors (default: project's CSS variables)
3. **Industry/purpose** — what the brand does (e.g., "tech nonprofit", "SaaS", "e-commerce")
4. **Style preferences** — minimal, bold, playful, corporate, etc.
5. **Background color** — dark or light (default: match the site's background)
6. **Any motifs** — symbols, icons, or themes to incorporate

### Step 2: Generate 3 variations via Ideogram API

Use `POST https://api.ideogram.ai/generate` with these headers:
```
Api-Key: {IDEOGRAM_API_KEY}
Content-Type: application/json
```

Generate 3 logo variations with different prompt strategies:

**Variation 1 — Horizontal lockup (for navbar):**
```json
{
  "image_request": {
    "prompt": "Professional horizontal logo lockup for '{brand_name}'. Left side: geometric icon/monogram in {colors}. Right side: brand name in modern sans-serif font (Outfit, Plus Jakarta Sans, or Inter style). Icon and text visually connected. {background}. Clean vector style.",
    "model": "V_2",
    "magic_prompt_option": "AUTO",
    "aspect_ratio": "ASPECT_3_1",
    "style_type": "DESIGN"
  }
}
```

**Variation 2 — Icon-forward lockup:**
```json
{
  "image_request": {
    "prompt": "Modern brand logo for '{brand_name}'. Bold {motif} icon in {colors} that flows into the typography. Use a critically-acclaimed geometric typeface. {background}. Minimal, tech-forward, award-winning design.",
    "model": "V_2",
    "magic_prompt_option": "AUTO",
    "aspect_ratio": "ASPECT_3_1",
    "style_type": "DESIGN"
  }
}
```

**Variation 3 — App icon (square, icon-only):**
```json
{
  "image_request": {
    "prompt": "App icon / favicon for '{brand_name}'. Single letter or abstract monogram in {colors} on {background}. Clean, recognizable at 16px. No text. Rounded corners safe area.",
    "model": "V_2",
    "magic_prompt_option": "AUTO",
    "aspect_ratio": "ASPECT_1_1",
    "style_type": "DESIGN"
  }
}
```

### Step 3: Visual evaluation

For each generated image:
1. Read the image file to visually inspect it
2. Evaluate on these criteria (score 1-10 each):
   - **Legibility**: Can you read the brand name? Does it work at small sizes?
   - **Color accuracy**: Does it use the requested brand colors?
   - **Professionalism**: Does it look like a real company logo?
   - **Uniqueness**: Is it distinctive and memorable?
   - **Scalability**: Will it work from 16px favicon to 512px app icon?
3. Pick the best horizontal logo (for navbar) and best square icon (for favicon)

### Step 4: Process into favicon set

Using Python + Pillow, process the selected images into:

```
favicon.ico          (16x16 + 32x32 + 48x48 multi-size ICO)
favicon-16x16.png    (16x16)
favicon-32x32.png    (32x32)
apple-touch-icon.png (180x180)
android-chrome-192x192.png (192x192)
android-chrome-512x512.png (512x512)
logo-mark.png        (76x76 for navbar @2x)
```

### Step 5: Generate HTML meta tags

Output the following meta tags for the site's `<head>`:

```html
<!-- Favicons (realfavicongenerator convention) -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="msapplication-TileColor" content="{bg_color}">
<meta name="theme-color" content="{bg_color}">
```

And the `site.webmanifest`:
```json
{
  "name": "{brand_name}",
  "short_name": "{short_name}",
  "icons": [
    { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "theme_color": "{bg_color}",
  "background_color": "{bg_color}",
  "display": "standalone"
}
```

### Step 6: Integration

1. Place all generated files in the project's public/static directory
2. Update the HTML `<head>` with the meta tags
3. Update any navbar/footer logo references to use the new horizontal logo
4. Report which variations were generated and which was selected, with reasoning

## API Reference

### Ideogram Generate

```
POST https://api.ideogram.ai/generate
Headers:
  Api-Key: {key}
  Content-Type: application/json

Response:
{
  "created": "2024-01-01T00:00:00Z",
  "data": [
    {
      "prompt": "...",
      "resolution": "1024x1024",
      "url": "https://ideogram.ai/assets/image/...",
      "is_image_safe": true
    }
  ]
}
```

### Supported aspect ratios
- `ASPECT_1_1` — Square (app icons)
- `ASPECT_3_1` — Wide horizontal (navbar logos)
- `ASPECT_16_9` — Landscape
- `ASPECT_10_16` — Portrait

### Supported style types
- `DESIGN` — Best for logos, icons, graphic design
- `GENERAL` — Photorealistic / general purpose
- `REALISTIC` — Photo-like output
- `RENDER_3D` — 3D rendered style

## Tips

- Always generate at least 3 variations to compare
- Use `style_type: "DESIGN"` for logos — it produces cleaner vector-like output
- Include specific font names in prompts (Outfit, Plus Jakarta Sans, Inter, Space Grotesk) for better typography
- Specify "no text" for app icon variations to ensure clean monogram output
- Always process the 512x512 app icon from the square variation, not from the horizontal logo
- Test the favicon at 16x16 — if it's not legible, regenerate with a simpler icon prompt
