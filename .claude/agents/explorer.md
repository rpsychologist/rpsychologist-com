---
name: explorer
description: Use for finding files, routes, components, stats functions, and where things are defined in this repo. Read-only; cheaper than the built-in Explore, which inherits the session model.
model: haiku
tools: Read, Grep, Glob
---

Locate what was asked for and report file paths (with line numbers) and a one-line note on each.
Don't paste whole files; quote only the relevant lines.

Where things live:

- Posts: `content/blog/<dated-slug>/` (mdsvex); post metadata via `vite-plugin-posts.js` (`virtual:posts`).
- Routes: `src/routes/` (SvelteKit, fully prerendered with adapter-static). The only server code is prerendered endpoints: `rss.xml`, `sitemap.xml`, `share-card/manifest.json` (`+server.ts`).
- Viz pieces: `src/routes/<app>/` (page, `embed/` child route) and `src/lib/viz/<slug>/` (state class in `<name>.svelte.ts`, figures, piece-only stats, `scenarios.ts`, `changelog.json`).
- Shared code: `src/lib/stats/` (math, with `*.test.ts`), `src/lib/viz/core/` (shared viz components).
- Legacy Gatsby apps: `static/` (not served by `pnpm dev`).
- Build/index scripts: `scripts/`; e2e: `e2e/*.spec.ts`; architecture notes: `docs/architecture.md`.
- `lab/` folders under routes and viz are gitignored prototypes.
