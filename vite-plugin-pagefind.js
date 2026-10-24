import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';

// Serve the Pagefind search index (written to build/pagefind by
// scripts/pagefind-index.mjs) under /pagefind/* during `vite dev` and
// `vite preview`.
//
// In production the static host serves build/ directly, so this is dev-only glue.
// It reads straight from build/pagefind rather than copying the index into static/,
// because that copy is always a build behind (vite bakes static/ in *before* our
// post-build indexing step) and 404s on a fresh checkout's first build — the exact
// footgun this avoids. Search works locally as soon as `pnpm build` has run once.
const ROOT = join('build', 'pagefind');
/** @type {Record<string, string>} */
const MIME = {
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.wasm': 'application/wasm'
};

export function servePagefind() {
	/** @param {import('vite').ViteDevServer | import('vite').PreviewServer} server */
	const attach = (server) => {
		server.middlewares.use(
			(
				/** @type {import('http').IncomingMessage} */ req,
				/** @type {import('http').ServerResponse} */ res,
				/** @type {() => void} */ next
			) => {
				if (!req.url?.startsWith('/pagefind/')) return next();
				const file = normalize(join('build', decodeURIComponent(req.url.split('?')[0])));
				// Contain to build/pagefind (normalize collapses any ../ traversal).
				if (
					(file !== ROOT && !file.startsWith(ROOT + sep)) ||
					!existsSync(file) ||
					!statSync(file).isFile()
				) {
					return next();
				}
				const type = MIME[extname(file)];
				if (type) res.setHeader('Content-Type', type);
				createReadStream(file).pipe(res);
			}
		);
	};
	return { name: 'serve-pagefind', configureServer: attach, configurePreviewServer: attach };
}
