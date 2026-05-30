# Visualization + Maps + Diagrams Supervisor (***SUPREME — charts help decisions, every large app***)

Charts exist to help users make decisions, never to decorate. Right tool per job: ECharts/Unovis for dashboards, @visx for custom, Cytoscape for graphs, MapLibre for geography, Mermaid/Excalidraw for diagrams. The visualization arm of the supervisor system.

## When this fires
- Any operational dashboard, metric surface, graph view, map, or diagram

## Tooling + when to use
- **Apache ECharts** / **Unovis** — operational dashboards, metric cards, trend charts
- **@visx/visx** — bespoke/custom visualization React primitives (isolated component per [[stack-selector]])
- **Cytoscape** — tenant / site / domain / deployment / integration / dependency GRAPHS
- **MapLibre** + **h3-js** + **pmtiles** — geography, service areas, local SEO, regional site management
- **Mermaid** — architecture diagrams, workflows, ERDs, generated docs (render from source, [[god-tier-engineering]])
- **Excalidraw** — sketches / wireframes
- **tldraw** — richer canvas workflows when genuinely justified

## Rules
- **Decisions, not decoration** — every chart answers a question a user has; if it doesn't change a decision, cut it
- Mermaid for anything diagram-shaped that can be generated from data/source
- Cytoscape for any relationship/topology view (sites↔domains↔deployments↔integrations)
- MapLibre stack for anything geographic; pmtiles for offline/edge-served vector tiles (Cloudflare-hostable per [[cloudflare-hostable-supervisor]])
- Respect `prefers-reduced-motion` on animated charts per [[motion-interaction-supervisor]]
- Accessible: every chart has a text/table fallback + ARIA per [[angular-large-app-supervisor]]
- Lazy-load heavy viz libs (`@defer`) — never in the initial bundle

## See
- [[package-preference-registry]] · [[stack-selector]] · [[angular-large-app-supervisor]] · [[motion-interaction-supervisor]] · [[observability-ops-supervisor]] · [[cloudflare-hostable-supervisor]]

## Reference incident (***2026-05-29 — supervisor knowledge-system upgrade, wave 2***)
Brief: ECharts/Unovis for dashboards, @visx custom, Cytoscape for site/domain/deployment graphs, MapLibre+h3-js+pmtiles for geography/local-SEO, Mermaid+Excalidraw/tldraw for diagrams; charts must help users decide. Authored wave 2; package decisions in [[package-preference-registry]].
