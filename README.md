# Source code for https://rpsychologist.com

The blog and its interactive visualizations, built with SvelteKit and prerendered to static files.

## Development

Requires Node ≥ 22.17 (see `.nvmrc`) and pnpm.

```sh
pnpm install
pnpm build     # prerender the site into build/ and index it for search
pnpm preview   # serve build/ at http://localhost:4173
```

`pnpm dev` is faster for editing, but it does not serve the search index or the older apps kept under `static/`; check those with `pnpm preview`.

```sh
pnpm check     # type and Svelte diagnostics, formatting
pnpm lint      # ESLint
pnpm test      # unit tests
pnpm test:e2e  # browser tests against the built site
```

## Layout

- `content/blog/` holds the posts, one folder per post.
- `src/lib/viz/` holds the interactive visualizations; each has its own version and changelog (see `RELEASING.md`).
- `static/` also contains older apps served as-is: the D3 visualizations (`/d3/…`), slides, the thesis, and copies of the previous site's p-value and therapist-effects pages until they are rewritten.

## Contributions are welcome

Open an issue if you want to discuss potential contributions.

The Cohen's _d_ page is translated; how translations work is in `src/lib/viz/cohend/README.md`.
