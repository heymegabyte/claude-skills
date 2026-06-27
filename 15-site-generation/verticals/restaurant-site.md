---
name: restaurant-site
description: Directive playbook for restaurant, cafe, bar, food truck, ghost kitchen websites.
when_to_use: When the business profile is food-service (NAICS 722) — restaurants, cafes, bars, food trucks, bakeries, breweries, dessert shops.
---

# Restaurant Site Skill

## Goal
Deliver a website that drives reservations, online orders, and walk-ins. Visitors should know what's being served, when, where, and how to order — within 5 seconds of landing.

## Above the fold (mandatory)
- One-sentence value prop ("Wood-fired Neapolitan pizza in Lake Hiawatha since 2007")
- Two primary CTAs: `Reserve a Table` and `Order Online`
- Tonight's hours + status pill (`OPEN NOW` / `CLOSES IN 47 MIN` / `OPENS AT 5PM`)
- Hero photo: the SIGNATURE dish, shot under warm lighting, NEVER a stock photo of "generic food"

## Required sections
1. **Menu** — every section the kitchen actually serves (apps, pizzas, salads, mains, desserts, drinks). Real prices. Allergen icons.
2. **Reservations** — embed OpenTable / Resy / SevenRooms widget when available; fall back to a simple form posting to the contact endpoint
3. **Order online** — link to existing Toast / Square Online / DoorDash / Uber Eats / Grubhub; never invent an unbuilt ordering flow
4. **Hours & location** — Google Maps embed + interactive driving-directions link + hours grid for the week
5. **About** — 2-paragraph story of the chef/owner, opening year, sourcing philosophy
6. **Gallery** — minimum 12 plated-dish photos (real, not stock) in a lightbox
7. **Reviews** — pull from Yelp / Google reviews; never fabricate

## Conversion rules
- Every page has a sticky "Reserve" button on mobile
- Every dish on the menu links to its photo in the gallery (intra-site anchor)
- Phone number is `tel:` linked in header, footer, and contact section
- Address is `https://www.google.com/maps/dir/?api=1&destination=…` linked everywhere it appears

## Schema (JSON-LD per route)
- `Restaurant` on home with `servesCuisine`, `priceRange`, `menu`, `acceptsReservations`
- `Menu` + `MenuSection` + `MenuItem` (one entry per dish)
- `OpeningHoursSpecification` for every day of the week
- `LocalBusiness` (parent of Restaurant) with full NAP + `geo` + `paymentAccepted`
- `Review` + `AggregateRating` when real reviews exist

## Anti-patterns
- Never use stock photos of "generic restaurant" hero — every food image must be from this kitchen
- Never list "happy hour" or "weekend brunch" unless the kitchen actually serves it
- Never hide the menu behind a PDF — render it as HTML so search + crawlers index every dish
- Never use the word "exquisite", "culinary journey", "elevated", "curated" — banned per copy-writing rule
