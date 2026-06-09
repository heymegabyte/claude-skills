---
name: "visualization-maps-diagrams-supervisor"
priority: 3
pack: "design"
triggers:
  - "chart"
  - "echarts"
  - "mermaid"
  - "map"
  - "graph"
paths:
  - "*"
---

# Visualization + Maps + Diagrams Supervisor

Charts exist to help users make decisions, never to decorate. Right tool per job: ECharts/Unovis for dashboards, @visx for custom, Cytoscape for graphs, MapLibre for geography, Mermaid/Excalidraw for diagrams. The visualization arm of the supervisor system.

## When this fires

- Any operational dashboard, metric surface, graph view, map, or diagram

## Tooling + when to use

- **Apache ECharts** / **Unovis** — operational dashboards, metric cards, trend charts
- **@visx/visx** — bespoke/custom visualization React primitives (isolated component per `stack-selector`)
- **Cytoscape** — tenant / site / domain / deployment / integration / dependency GRAPHS
- **MapLibre** + **h3-js** + **pmtiles** — geography, service areas, local SEO, regional site management
- **Mermaid** — architecture diagrams, workflows, ERDs, generated docs (render from source, `god-tier-engineering`)
- **Excalidraw** — sketches / wireframes
- **tldraw** — richer canvas workflows when genuinely justified

## Rules

- **Decisions, not decoration** — every chart answers a question a user has; if it doesn't change a decision, cut it
- Mermaid for anything diagram-shaped that can be generated from data/source
- Cytoscape for any relationship/topology view (sites↔domains↔deployments↔integrations)
- MapLibre stack for anything geographic; pmtiles for offline/edge-served vector tiles (Cloudflare-hostable per `cloudflare-hostable-supervisor`)
- Respect `prefers-reduced-motion` on animated charts per `motion-interaction-supervisor`
- Accessible: every chart has a text/table fallback + ARIA per `angular-large-app-supervisor`
- Lazy-load heavy viz libs (`@defer`) — never in the initial bundle
