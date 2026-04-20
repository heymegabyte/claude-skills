---
name: visual-qa
description: "AI-powered visual inspection for web pages. Take Playwright screenshots at desktop + mobile, analyze layout/design/accessibility, fix issues, and re-verify. Runs automatically at the end of every UI task. Uses GPT-4o Vision when available, falls back to manual inspection."
---

# Visual QA — AI-Powered Design Inspection

## When to Run

- After every UI/frontend change
- After deploying any HTML/CSS/JS modification
- When the user asks to "make it beautiful/gorgeous/perfect"
- Before declaring any visual task "done"

## The Process

### Step 1: Take Screenshots

```typescript
// Desktop (1280px)
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto('https://yoursite.com');
await page.screenshot({ path: 'desktop.png', fullPage: true });

// Mobile (375px)
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({ path: 'mobile.png', fullPage: true });
```

### Step 2: Automated Checks

Before any AI analysis, verify programmatically:
- [ ] All images loaded (no broken image icons)
- [ ] No horizontal overflow on mobile
- [ ] All text is readable (not cut off, not overlapping)
- [ ] Footer is at the bottom of the page
- [ ] No console errors (`page.on('console', ...)`)
- [ ] All interactive elements have cursor:pointer
- [ ] Focus-visible outlines present on focusable elements

### Step 3: Visual Analysis

Read each screenshot with the Read tool and evaluate:

**Layout:**
- Alignment consistency (are things lined up?)
- Spacing rhythm (consistent padding between sections?)
- Grid integrity (do cards align properly?)
- Overflow (anything breaking out of containers?)

**Typography:**
- Hierarchy clear? (h1 > h2 > h3 visually distinct)
- Readability? (contrast ratio, font size, line height)
- Font loading? (no FOUT/FOIT flashes)

**Color & Brand:**
- Consistent palette? (not mixing random colors)
- Contrast meets WCAG AA? (4.5:1 for text)
- Dark backgrounds not pure black? (#060610, not #000)

**Interactions:**
- All buttons/links visually clickable?
- Hover states visible?
- Active states provide feedback?

**Content:**
- No placeholder text (Lorem ipsum, TBD, etc.)?
- Images are real and relevant?
- Copy is concise and meaningful?

### Step 4: Fix Issues

For each issue found:
1. Describe the problem
2. Make the fix
3. Redeploy
4. Re-screenshot
5. Verify fix

### Step 5: Enhancement Pass

After fixing bugs, ask:
- "What would make this 10% more beautiful?"
- "What animation is missing?"
- "What detail would surprise the user?"

If the answer takes < 5 minutes, implement it.

## Fallback (No GPT-4o Vision)

If GPT-4o Vision isn't available:
1. Run all automated checks (Step 2)
2. Use the Read tool to view screenshots yourself
3. Check against the frontend-design skill's checklist
4. Apply the "Apple Test": Would Apple ship this?

## Quick Checklist

```
- [ ] Desktop screenshot reviewed
- [ ] Mobile screenshot reviewed
- [ ] No console errors
- [ ] No broken images
- [ ] No overflow on mobile
- [ ] All hover states work
- [ ] Focus rings visible
- [ ] Cursor pointer on all interactive elements
- [ ] No placeholder content
- [ ] Typography hierarchy clear
- [ ] Color palette consistent
```
