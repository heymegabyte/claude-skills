---
name: "Accessibility Gate"
version: "2.0.0"
updated: "2026-04-23"
description: "WCAG 2.2 AA via axe-core v4.11.3 + Playwright. 9 new SC: focus-not-obscured, target-size 24px, accessible-auth, consistent-help, redundant-entry, dragging-movements, focus-appearance. ADA Title II: 2027 (large) / 2028 (small). WCAG 3.0 awareness (174 requirements, 2028-2030)."
---

# Accessibility Gate

WCAG 2.2 AA minimum on every project. 1 in 4 US adults has disability. 71% leave inaccessible sites. 5,000+ ADA lawsuits in 2025 (37% YoY increase). Accessible sites rank higher (semantic HTML, alt text). Brian's ethos: sites must be usable by everyone.

## Automated Audit (EVERY Deploy)
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const bp of BREAKPOINTS) {
  test(`a11y audit at ${bp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toHaveLength(0);
  });
}
```

## Focus Styling
```css
.skip-link { position: absolute; top: -100%; left: 50%; transform: translateX(-50%); background: #00E5FF; color: #060610; padding: 0.75rem 1.5rem; border-radius: 0 0 8px 8px; font-weight: 600; z-index: 10000; transition: top 0.2s; }
.skip-link:focus { top: 0; }
*:focus-visible { outline: 2px solid #00E5FF; outline-offset: 3px; border-radius: 4px; }
*:focus:not(:focus-visible) { outline: none; }
.dark-bg *:focus-visible { outline-color: #fff; box-shadow: 0 0 0 4px rgba(0,229,255,0.3); }
```

## HTML Requirements
```html
<html lang="en">
<a href="#main" class="skip-link">Skip to content</a>
<header role="banner"><nav role="navigation" aria-label="Main navigation"></nav></header>
<main id="main" role="main"></main>
<footer role="contentinfo"></footer>
<!-- Images: descriptive alt, decorative: alt="" role="presentation" -->
<!-- Forms: <label for="id">, aria-describedby for help text -->
<!-- Headings: never skip levels -->
```

## Keyboard Navigation Test
Tab through all focusable elements — verify not stuck on BODY. Test Escape closes modals.

## Reduced Motion
```typescript
test('respects prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
  expect(running).toBe(0);
});
```

## Screen Reader Checklist
All interactive elements have accessible names, form errors via aria-live="polite", dynamic content uses aria-live, images have descriptive alt (not "image"/filename), decorative alt="" + role="presentation", links describe destination, buttons describe action, page title includes page name + brand, logical heading hierarchy.

## WCAG 2.2 New Success Criteria (9 total)
**Level A (3):** 3.2.6 Consistent Help (same relative order)|3.3.7 Redundant Entry (don't re-ask same info)|3.3.9 Accessible Auth Enhanced (all cognitive tests need alternatives).
**Level AA (6):** 2.4.11 Focus Not Obscured Min (not hidden by sticky headers)|2.4.12 Focus Not Obscured Enhanced|2.4.13 Focus Appearance (2px thick, 3:1 contrast)|2.5.7 Dragging Movements (single-pointer alternative)|2.5.8 Target Size Min (24x24 CSS px)|3.3.8 Accessible Auth Min (support password managers/autofill/biometrics).

## Full Deploy Checklist
Skip-to-content link, all images alt text, form inputs labeled, contrast >= 4.5:1 (3:1 large), keyboard accessible, focus rings visible+beautiful (2px solid, 3:1 contrast per 2.4.13), ARIA landmarks, `lang` on html, prefers-reduced-motion, axe-core 0 violations (wcag22aa tags), logical tab order, no keyboard traps, touch targets >= 24x24px (WCAG 2.2) / 44x44px (recommended), focused element not obscured by sticky headers/footers (2.4.11), dragging has single-pointer alt (2.5.7), forms support autofill/password managers (3.3.8), help mechanisms consistent across pages (3.2.6), don't re-ask info already entered (3.3.7), iframes have title, icon buttons have aria-label, toggle buttons use aria-checked/pressed, decorative elements aria-hidden="true".

## MANDATORY Playwright Test (create if missing)
Verify: lang attr, skip link exists, landmarks (main/nav/header/footer), keyboard reaches CTA, focus-visible defined (2px thick per 2.4.13), reduced-motion defined, form inputs labeled, buttons named, no same fg/bg colors, target sizes >= 24px, focused element visible (not behind sticky elements).

## ADA & Standards Landscape
- **ADA Title II:** Large entities (50K+ pop) April 2027, smaller April 2028 (extended from 2026/2027). Standard: WCAG 2.1 AA.
- **Private companies:** No formal deadline, but 5,000+ lawsuits in 2025 (37% increase). Gov contractors contractually required.
- **WCAG 3.0:** Working draft March 2026, 174 requirements (up from 78 SC), no A/AA/AAA levels, assertions+scoring. Est. W3C Rec 2028-2030, legal adoption 2030+.
- **axe-core v4.11.3:** Covers WCAG 2.0/2.1/2.2 at A/AA/AAA, Section 508, EN 301 549, RGAA, ADA. ~57% automated detection.
- AI agents interact with interfaces — semantic HTML + ARIA + structured data serve BOTH humans and agents.
- `font-display: swap`, subset fonts, min 16px body, test at 200% zoom, `prefers-contrast: more` support.
