# Agent Instructions

SvelteKit (Svelte 5 runes) site, fully prerendered with `adapter-static`, deployed on Cloudflare Pages.

## Package Manager

- Use **pnpm** (version pinned in `package.json` `packageManager`); Node `>=22.17` (`.nvmrc`).

## Commands

| Task                              | Command                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| Unit test file                    | `pnpm test src/lib/stats/regression.test.ts`                |
| E2E spec (builds first locally)   | `pnpm test:e2e e2e/cohend.spec.ts`                          |
| Lint file                         | `pnpm exec eslint path/to/file.ts`                          |
| Format check file                 | `pnpm exec prettier --check path/to/file`                   |
| Types + Svelte + format (project) | `pnpm check`                                                |
| Build (prerender + search index)  | `pnpm build`                                                |
| Serve build (legacy apps, search) | `pnpm preview --port 4173`                                  |
| Release tags present              | `pnpm check:tags` (fails on an unmerged bump, by design)    |
| Regenerate viz gallery thumbnails | `node scripts/viz-thumbnails.mjs [name]` (against preview)  |
| Regenerate stale share cards      | `node scripts/share-cards.mjs [keys\|--all]` (then rebuild) |

## External References

| Need                                              | File                           |
| ------------------------------------------------- | ------------------------------ |
| Architecture, pipelines, and the reasons for them | `docs/architecture.md`         |
| Releasing a viz app version (semver, changelog)   | `RELEASING.md`                 |
| Template viz app: file map, URL params, i18n      | `src/lib/viz/cohend/README.md` |
| Translation workflow (Crowdin)                    | `docs/translation.md`          |
| CI steps and release tagging                      | `.github/workflows/ci.yml`     |

## Key Conventions

- Posts live in `content/blog/<dated-slug>/`, not `src/`; `content/` and `static/` are skipped by Prettier and ESLint.
- Post lists read metadata from `virtual:posts` (`vite-plugin-posts.js`); never resolve the post glob eagerly, or per-post code-splitting is lost.
- In `mdsvex.config.js`, `escapeSvelte` must stay after `rehype-katex`, and `rehypePostBibliography` → `rehype-citation` → `rehypeLinkBibliography` must stay together, in that order.
- Editing the inline script in `src/app.html`, or adding an inline script or origin, means updating the CSP in `vite.config.ts` (its sha256 is listed by hand).
- Viz app state is a class in `<name>.svelte.ts`, instantiated per component (never a module singleton), with URL/persisted state applied in `onMount`.
- Charts reserve their space with CSS `aspect-ratio` and draw at the measured width; nothing may shift layout on hydration.
- Formulas whose numbers follow a control use `TexLive`, not `Tex`.
- `src/lib/stats/scenarios.ts` values are engineered to be exact; do not make them realistic.
- Embeddable views are `/<app>/embed` child routes, not query params.
- Throwaway prototypes live in `src/routes/<app>/lab/` and `src/lib/viz/<app>/lab/`, listed in `.gitignore` and never committed; the route's `+page.ts` sets `prerender = false` and 404s unless `dev`.
- `pnpm dev` 404s the legacy apps under `static/` and serves a stale search index; verify those with `pnpm build && pnpm preview`.
- Never move `static/{d3,slides,thesis}/` or remove `static/sw.js`.
- Porting a legacy Gatsby app: delete its snapshot files and remove its prefix from `src/routes/+layout.svelte`, `scripts/pagefind-index.mjs`, and `src/lib/viz.ts` in the same change.
- `data-pagefind-*` markup is injected only by `scripts/pagefind-index.mjs`, never in templates or content; `pagefind` stays pinned exactly.
- A reader-visible change to a viz app needs a release entry in `src/lib/viz/<app>/changelog.json`; never reset version numbers or drop old URL params (migrate them).
- Never hardcode a viz app version; it is read from the newest changelog entry.
- When a change alters what `docs/architecture.md` describes, update it in the same change.

## Svelte MCP

- Before Svelte or SvelteKit work, call `list-sections`, then `get-documentation` for every section whose `use_cases` match the task.
- Run `svelte-autofixer` on every `.svelte` and `.svelte.ts` file you write or edit until it returns no issues or suggestions.
- The server fetches from `svelte.dev`; if its tools are missing, say so instead of working without them.
- Delegate multi-file Svelte edits to the `svelte-file-editor` subagent so doc lookups and autofixer rounds stay out of the main context.

## Code Comments

- Explain why, not what: keep a comment only if it stops someone from breaking the code.
- Keep comments to about 3 lines; derivations in `src/lib/stats/` may run longer.
- State a fact in one place and point to it elsewhere.
- Do not narrate the next line.

## Commits

- Subjects follow Conventional Commits: `type(scope): summary`, lowercase and imperative, e.g. `fix(likelihood): update the gallery description`.
- Scope is the viz app (`likelihood`, `cohend`) or area (`agents`, `share`, `e2e`); omit it only when the change spans the repo.
- Work lands on `main` through a PR branch named `<type>/<topic>`, e.g. `docs/cf-pages-toolchain`.
