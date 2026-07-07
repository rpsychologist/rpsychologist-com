# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project: rpsychologist.com

SvelteKit rewrite of the site (migrated from Gatsby). Svelte 5 (runes), fully
prerendered to static files via `adapter-static`, deployed on Cloudflare Pages. Package
manager is **pnpm** (see the `packageManager` field); Node `>=22.12` (see `.nvmrc`).

The root `README.md` is stale — it describes the old Gatsby/React site and its
per-visualization theme packages. Ignore it for architecture; trust the code.

## Commands

```bash
pnpm dev          # vite dev server
pnpm build        # vite build, then scripts/pagefind-index.mjs to index for search
pnpm preview      # serve the production build locally
pnpm check        # svelte-kit sync + svelte-check (type/Svelte diagnostics)
pnpm test         # vitest run (all tests)
pnpm test:e2e     # playwright smoke (e2e/) against the prerendered build

pnpm test src/lib/stats/regression.test.ts   # single test file
pnpm vitest                                   # watch mode
```

Tests live next to their source as `*.test.ts` (configured in `vite.config.ts`,
`test.include = src/**/*.{test,spec}.{js,ts}`). They cover the `lib/stats`
numerical code; components and routes are not unit-tested. The viz apps get a
Playwright smoke spec each in `e2e/` instead — hydration + state wiring against
the real build (locally the webServer builds first; in CI it reuses the build
step). These are what catch a `viz/core` change breaking an existing app.

Search: `pagefind` is pinned exactly (no caret) — the Component UI is new in
1.5 and the template/CSS touch its internals; upgrade deliberately with the
search e2e as the gate. `scripts/pagefind-index.mjs` builds the index from `build/`
(Node API, not the CLI — clean URLs need explicit `url`s) and injects **all**
`data-pagefind-*` markup into the indexed copies (body scoping, code
down-weighting, type metadata, viz boosts) — never into templates or content,
so search stays swappable. UI: `SearchModal.svelte` (header, ⌘K) and the
`/search` fallback, shared glue in `src/lib/search.ts`. In dev/preview the
index is served from `build/pagefind` by `vite-plugin-pagefind.js` and is
stale until the next `pnpm build`.

## Content & post pipeline (the core of the site)

Blog posts are **not** in `src/`. They live in `content/blog/<dated-slug>/`,
each a directory with an `index.md` (or `.svx`) plus its image assets. Most are
exported from R Markdown, so fenced blocks use legacy infostrings like
`r:collapsed=true` that the Shiki highlighter parses specially.

Two parallel mechanisms turn that directory into a site, and understanding how
they stay decoupled is the key architectural idea:

1. **Metadata** — `vite-plugin-posts.js` is a Vite plugin exposing a virtual
   module `virtual:posts`. At build time it reads every post's frontmatter with
   `gray-matter`, validates it with a Zod schema, computes reading time, drops
   drafts, and emits a plain-data array (no components). For `include_toc`
   posts it also extracts the TOC here (mdast + github-slugger, ids matching
   what rehype-slug assigns) so `Toc.svelte` prerenders it — a DOM-scraped TOC
   appeared at hydration and pushed the article down ~320px on mobile (CLS 0.36). `src/lib/content.ts`
   imports this and derives everything list-shaped: pagination, tags/categories,
   term slugs, prev/next adjacency. List pages, RSS, and sitemap import from
   here and never touch a post's compiled component.

2. **Components** — `src/routes/[slug]/+page.ts` keeps a _separate, non-eager_
   `import.meta.glob('/content/blog/*/index.{md,svx}')`. It looks up the one
   post by slug and lazy-loads only that chunk. This is what preserves
   per-post code-splitting: the homepage doesn't bundle every post.

The split is deliberate. If you make the listing read post `.metadata` directly
(resolving the glob eagerly), you recouple the list to every post bundle and
lose code-splitting. Keep metadata flowing through `virtual:posts`.

`zod` is only used by this build-time plugin and lives in `devDependencies`.

### Markdown → component (svelte.config.js)

mdsvex (extensions `.svx`, `.md`) preprocesses posts. The pipeline:

- **Layout**: every doc is wrapped in `src/lib/components/PostLayout.svelte`
  (injected via absolute path so mdsvex resolves it relative to each doc).
- **Highlighting**: a single reused Shiki highlighter, dual-theme (CSS variables
  toggled by `[data-theme="dark"]`). Unknown languages fall back to plaintext;
  `:collapsed=true` marks foldable blocks. The block chrome (language label,
  copy/fold buttons, collapsed state) is emitted **at build time** by the
  highlighter — adding it at hydration shifted the article under the reader.
  The client action `src/lib/actions/code.ts` (`enhanceCode`) only wires
  the buttons; CSS gated on `html.js` (a class the `app.html` pre-paint script
  sets) shows collapsed blocks expanded and hides the buttons for no-JS readers.
- **remark**: `resolveImages` (custom — rewrites `./img/foo.png` to root-absolute
  `/content/blog/<slug>/...` so `PostImage.svelte` can match it against an
  `?enhanced` glob; resolution must be build-time because only the plugin knows
  which post a relative path belongs to), `remark-math`, `remark-smartypants`.
- **rehype**: `rehype-slug` → `rehype-autolink-headings` → `rehype-katex` →
  custom `wrapTables` → custom `escapeSvelte`. Order matters:
  `escapeSvelte` must run **after** `rehype-katex` to escape braces KaTeX emits
  in its MathML annotations.

## Routing & rendering model

Everything is prerendered: `src/routes/+layout.ts` sets `prerender = true`,
`ssr = true`. Dynamic routes provide an `EntryGenerator` (`entries`) so the
static adapter knows every path to emit:

- `[slug]` — individual posts; `entries` from `posts`.
- `page/[page]` — paginated index (`postsPerPage` in config).
- `tags/[tag]` — one page per term, where a "term" is a tag **or** a category
  (unified in `content.ts`; `termSlug`/`termBySlug` map display ↔ URL).
- `rss.xml`, `sitemap.xml` — `+server.ts` endpoints, also prerendered.
- `search` — client-only Pagefind UI loaded from `/pagefind/*` (emitted by the
  build's pagefind step).

`adapter-static` uses `fallback: "404.html"` (the rendered `+error.svelte`),
which Cloudflare Pages serves for unmatched paths. CSP is configured in `svelte.config.js`
in hash mode, which auto-hashes only the scripts SvelteKit itself renders (its
hydration bootstrap). The inline pre-paint theme script in `app.html` is **not**
auto-hashed — it's interpolated after the policy is built — so its sha256 hash is
listed by hand in the `script-src` directive. This matters in dev, where
SvelteKit sends CSP as an HTTP _header_ (governs from byte zero, so an unhashed
pre-paint script is blocked and its effect flashes); in the prerendered build the
policy is a `<meta>` after the script, so it runs regardless. Editing that
script's bytes, or adding an inline script or external origin, means updating the
CSP directives (recompute the hash).

Viz apps that need a chrome-free embeddable view expose it as a **child route**
(`/cohend/embed`) that is prerendered as the tool alone — not a `?embed=1` query
on the main page. The root layout drops the header/footer for any `/…/embed` path
(prerender-safe, so no flash), and framing headers are scoped to that path in
`static/_headers`. Share dialogs point their iframe snippet at the embed route.

## `src/lib/stats` — interactive-visualization domain code

Pure, tested numerical code (linear algebra, regression, conditioning, residuals)
backing the in-article interactive figures (e.g. `RedundancyExplorer`,
`ConditioningScatter`, `AdjustmentCells`). `scenarios.ts` defines **synthetic**
populations: correlation matrices engineered so every marginal and partial
coefficient is known exactly and any sign flip is deliberate, not a sampling
artifact. Don't "fix" these toward realism — the exact values are the point, and
the comments flag this. This is the one area where longer derivation comments are
expected.

## `src/lib/viz` — interactive viz apps & their state

Each full-page viz app (e.g. `cohend`) keeps its reactive state in a **class** in
`<name>.svelte.ts`, not a function factory. The house pattern:

- The class holds editable params plus `$state`/`$derived` **fields**, and methods
  that mutate state while preserving invariants (e.g. `CohendState` keeps `cohend`
  and the means mutually consistent via `syncFromCohend`/`syncFromMeans`). The
  invariant-bearing methods are why this is a class and not a loose state bag.
- Instantiate **per-component** in the route — `const model = new CohendState()` in
  `+page.svelte` — never a module-level singleton. The page is prerendered/SSR'd, so
  a shared instance would bleed state across requests.
- Apply persisted + URL state from `onMount` (`model.init(location.search)`) so SSR
  and the first client render share the plain defaults.
- Keep private store handles truly private (`#store`). Call methods as
  `model.foo()`; if you ever pass one as a bare event callback, wrap it
  (`() => model.foo()`) or `this` is lost.
- Charts must not shift layout: the parent container reserves the chart's space
  (CSS `aspect-ratio`), so drawing on hydration causes no CLS. Measure rendered
  width (`bind:clientWidth`) and draw the SVG 1:1 rather than `viewBox`-scaling.

Shared state primitives live in `core/state` (`Persisted`, `queryParams`); pure
numerical model code sits in a sibling `model.ts` with `model.test.ts`.

`cohend` is the template the other viz apps copy; its app-specific architecture
(file map, state flow, URL params, share/embed) is documented in
`src/lib/viz/cohend/README.md`.

## Code comments

Comment to explain **why**, not **what**. The code already shows what it does;
a comment earns its place only when it captures something the reader cannot
recover from the code itself.

- **Document non-obvious decisions and constraints.** Prefer comments that
  protect a deliberate choice — e.g. "page is prerendered, so JS can't pick the
  icon before paint; both render and CSS chooses one to avoid a flash," or
  "correlation matrix is engineered so the sign flip is deliberate, not a
  sampling artifact." These stop a future reader from "simplifying" the code
  back into a bug.
- **Be terse.** Say it in the fewest lines that stay clear. If a block runs
  past ~3 lines, it's usually restating the code or over-explaining — cut it
  down. The statistical/derivation comments in `lib/stats/*` carry real domain
  content and may run longer; that's fine.
- **Don't duplicate.** Explain a given fact in one canonical place. If another
  spot needs the context, point to it in a single line rather than restating it.
- **Don't narrate.** Skip comments that paraphrase the next line
  (`// loop over items`). A short note on a non-obvious `catch` or guard is
  fine.

When in doubt, ask: "would this comment stop someone from breaking the code, or
is it just describing it?" Keep the first kind; drop the second.
