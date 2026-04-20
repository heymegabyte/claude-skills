# Style Guides Quick Reference

> Compact, actionable rules from top style guides. Scan, apply, ship.

---

## Google TypeScript Style Guide

1. **Naming:** `camelCase` variables/functions, `PascalCase` types/classes, `CONSTANT_CASE` constants
2. **`readonly`** on properties never reassigned
3. **`interface` over `type`** for object shapes (interfaces are extendable)
4. **Relative imports** (`./foo`) within the same project, not absolute
5. **No `obj['foo']`** to bypass visibility -- defeats private/protected
6. **No `@ts-ignore`** -- fix the actual type error
7. **No Hungarian notation** (`strName` -> just `name`)
8. **JSDoc documents intent,** not types (TypeScript handles types)
9. **`undefined` over `null`** for absent values
10. **No `any`** -- use `unknown` if the type is truly unknown

Source: google.github.io/styleguide/tsguide.html

---

## Angular Style Guide

1. **File names:** `kebab-case` (`user-profile.component.ts`)
2. **One thing per file** -- one component/service/pipe each
3. **Standalone components** (not NgModules) -- Angular 19 default
4. **Signals for reactivity** (not Zone.js -- being deprecated)
5. **Template logic:** simple expressions inline, complex -> TypeScript
6. **Selector prefixes:** `app-` for app, `lib-` for libraries
7. **Separate `.html` file** when template > 3 lines
8. **Services:** `providedIn: 'root'` for singletons
9. **No `any` in templates** -- use strict template checking

Source: angular.dev/style-guide

---

## Hono Best Practices

1. **Inline handlers** for type inference (not separate controller files)
2. **RPC mode:** `export type AppType = typeof app` + `hc<AppType>` on client
3. **Layered middleware:** global logger -> route-group CORS -> route-specific auth
4. **`@hono/zod-validator`** for all request validation
5. **Centralized errors:** `app.onError()` + `app.notFound()`
6. **Split large apps:** `app.route('/path', subApp)`
7. **Schema-first:** Zod schemas = single source of truth for types + validation

Source: hono.dev/docs/guides/best-practices

---

## Mailchimp Content Style Guide

1. **Humans first,** search engines second
2. **Active voice** and positive language
3. **5th-8th grade reading level** (Flesch 60+)
4. **Front-load** important information (inverted pyramid)
5. **One idea per paragraph,** one topic per section
6. **Descriptive link text** (not "click here"), with hover + focus states
7. **Error messages:** what happened, why, how to fix it
8. **Buttons start with a verb** ("Save changes" not "Changes")

Source: styleguide.mailchimp.com

---

## GOV.UK Writing Style

1. **Short sentences** (25 words max)
2. **Common words** ("buy" not "purchase", "help" not "assist")
3. **No jargon, Latin, or unexpanded acronyms**
4. **Bullet points** for lists of 3+ items
5. **Most important information first**
6. **"You"** to address the reader directly
7. **Numbers:** spell out one to nine, digits for 10+
8. **Dates:** 1 January 2026 (not Jan 1st, 2026)

Source: gov.uk/guidance/style-guide

---

## CUBE CSS

1. **C = Composition** -- layout patterns via flex/grid utilities
2. **U = Utility** -- single-purpose classes (`.text-center`, `.flow`)
3. **B = Block** -- component-specific styles, scoped
4. **E = Exception** -- state variations via data attributes (`[data-state="active"]`)
5. **Let CSS cascade work** -- don't fight it like BEM does
6. **Global styles handle 80%** -- blocks handle the remaining 20%

Source: piccalil.li/blog/cube-css

---

## Material Design 3 Key Rules

1. **8px grid** for all spacing (4px for small adjustments)
2. **Touch targets:** 48x48dp minimum (44x44px in CSS)
3. **Color:** surface -> on-surface hierarchy, not arbitrary colors
4. **Typography:** use type scale (not arbitrary font sizes)
5. **Motion:** 200ms micro, 300ms standard, 500ms complex
6. **Elevation:** shadow hierarchy (0dp, 1dp, 3dp, 6dp, 8dp, 12dp)

Source: m3.material.io

---

## Node.js Best Practices

1. **Validate all input at the boundary** (Zod)
2. **Structured logging** (JSON format)
3. **Centralized error handling,** not per-route
4. **Never trust user input** -- sanitize everything
5. **Environment variables for config** (never hardcode)
6. **Timeouts on all external HTTP calls**
7. **Graceful shutdown:** handle SIGTERM, close connections

Source: github.com/goldbergyoni/nodebestpractices (105K stars)
