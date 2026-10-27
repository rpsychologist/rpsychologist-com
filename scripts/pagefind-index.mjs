// Build the Pagefind search index from the prerendered site.
//
// We use Pagefind's Node Indexing API instead of the `pagefind --site build`
// CLI for one reason: the CLI derives each result's URL from the file path, so
// a page emitted as `build/foo.html` is indexed as `/foo.html`. This site serves
// clean URLs (adapter-static, trailingSlash: 'never'), so those `.html` links —
// and the `#section` sub-result anchors derived from them — 404 in the client
// router. Passing an explicit `url` to addHTMLFile indexes each page under the
// URL it is actually served at, so results (and sub-results) point at real routes.
import * as pagefind from 'pagefind';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
// Node ≥22.18 type-strips erasable TS, and viz.ts is pure data.
import { viz } from '../src/lib/viz.ts';

const SITE = 'build';
const OUT = path.join(SITE, 'pagefind');

const vizPaths = new Set(viz.map((v) => v.href).filter((h) => h.startsWith('/')));
if (vizPaths.size === 0) throw new Error('[pagefind] no internal viz paths found in viz.ts');

// Interactive articles are the `.svx` posts, as in vite-plugin-posts.js (whose
// virtual module this Node script can't import).
const blogDir = path.join('content', 'blog');
const articlePaths = new Set();
for (const dir of await readdir(blogDir, { withFileTypes: true })) {
	if (!dir.isDirectory()) continue;
	const file = path.join(blogDir, dir.name, 'index.svx');
	const src = await readFile(file, 'utf8').catch(() => null);
	if (src === null) continue;
	const { data } = matter(src);
	if (!data.draft) articlePaths.add('/' + data.slug);
}
if (articlePaths.size === 0) throw new Error('[pagefind] no interactive articles found');

// foo.html -> /foo ; index.html -> / ; a/b.html -> /a/b
function urlForFile(relPath) {
	const noExt = relPath.slice(0, -'.html'.length);
	const clean =
		noExt === 'index' || noExt.endsWith('/index') ? noExt.slice(0, -'index'.length) : noExt;
	return '/' + clean.replace(/\/$/, '').replace(/^\/*/, '');
}

// Rendered in results as a badge (see the shared result template). The URL is
// the only place a page's kind is knowable at index time, so this is the one
// canonical spot for the type logic.
function typeFor(url) {
	if (articlePaths.has(url)) return 'Interactive article';
	if (vizPaths.has(url)) return 'Viz';
	if (url === '/' || url === '/about' || url === '/viz') return 'Page';
	return 'Post';
}

// Rewrite the copy of each page handed to Pagefind — never the served page.
// All Pagefind-specific markup lives here, so the site's templates and content
// stay free of data-pagefind-* attributes (and swapping search engines later
// only touches this script and the search UI components).
function decorate(url, content) {
	let out = content
		// Scope indexing to <main> (exactly one per page, from the root layout):
		// header nav and footer stop polluting every page. The type feeds the
		// result badge via metadata.
		.replace('<main', `<main data-pagefind-body data-pagefind-meta="type:${typeFor(url)}"`)
		// Prev/next links inside <main> would bleed each post's title into its
		// neighbors' indexes.
		.replace('<nav class="post-nav', '<nav data-pagefind-ignore class="post-nav')
		// The "More visualizations" cross-promo on viz pages duplicates the other
		// apps' descriptions — indexed, it makes every viz page match every other
		// app's terms (and pollutes excerpts).
		.replace('<section class="more ', '<section data-pagefind-ignore class="more ')
		// Bylines (date · read time · tag links) on posts and in list snippets are
		// pure excerpt noise — "Oct 29, 2022 · 1 min read · viz" is no answer.
		.replaceAll('<p class="post-meta', '<p data-pagefind-ignore class="post-meta')
		// The prerendered code-block bar is button chrome, not content — indexed,
		// "Copy"/"Show code" and the language label leak into every code post.
		.replaceAll('<div class="code-bar">', '<div data-pagefind-ignore class="code-bar">')
		// Down-weight code blocks: function/package names stay searchable, but
		// code stops winning excerpts and rankings over prose.
		.replaceAll('<pre', '<pre data-pagefind-weight="0.2"');

	// The interactive-viz pages are the site's headline content but carry little
	// prose, so blog posts that merely mention the same term outrank the tool
	// itself. Weight the tool's own <h1> to the max and add a max-weight block
	// covering the generic terms (interactive/visualization/viz) and the slug.
	// It reads as prose because Pagefind may surface it as the excerpt — keyword
	// soup here shows up verbatim in the UI. The alias sentence comes FIRST so a
	// "viz"/"interactive" match sits at the block's start and the excerpt runs
	// forward into the description, instead of starting mid-description with the
	// highlighted match truncated off the end. Topic aliases (scatterplot, mle, …)
	// are deliberately NOT indexed; the Tools row in SearchModal covers those from
	// the manifest. Injected right after the <h1> so the excerpt window extends
	// into the page's own intro, not whatever sits at the end of <main>.
	if (vizPaths.has(url)) {
		const desc = content.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '';
		out = out.replace(/<h1(\s|>)/i, '<h1 data-pagefind-weight="10"$1');
		const kind = articlePaths.has(url) ? 'An interactive article' : 'An interactive visualization';
		const block = `<p data-pagefind-weight="10">${kind} (viz): ${url.slice(1)}. ${desc}</p>`;
		if (!out.includes('</h1>')) throw new Error(`[pagefind] no </h1> in ${url}`);
		out = out.replace('</h1>', `</h1>${block}`);
	}
	return out;
}

// Navigation/duplicate pages that add noise instead of answers: taxonomy and
// post listings, the search page itself, the chrome-free viz embeds
// and changelogs (which repeat their parent viz's terms and would outrank or
// crowd it), and the share-card screenshot targets. Keeping these out sharpens
// results.
function isNoise(url) {
	return (
		url === '/tags' ||
		url.startsWith('/tags/') ||
		url === '/posts' ||
		url === '/search' ||
		url.endsWith('/embed') ||
		url.endsWith('/changelog') ||
		url.startsWith('/share-card/') ||
		// Translated Cohen's d pages: the search UI only runs on English pages,
		// so their per-language indexes could never be queried.
		/^\/[a-z]{2}\/cohend$/.test(url) ||
		// Old standalone apps copied into static/ verbatim; their markup isn't
		// shaped for search (no titles/excerpts worth showing).
		/^\/(d3|slides|thesis)\//.test(url)
	);
}

const entries = await readdir(SITE, { recursive: true, withFileTypes: true });
const files = entries
	.filter((e) => e.isFile() && e.name.endsWith('.html'))
	.map((e) => path.relative(SITE, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
	// Skip the Pagefind bundle itself and the SPA fallback error page.
	.filter((rel) => !rel.startsWith('pagefind/') && rel !== '404.html')
	.filter((rel) => !isNoise(urlForFile(rel)));

const { index } = await pagefind.createIndex();

let indexed = 0;
for (const rel of files) {
	const content = await readFile(path.join(SITE, rel), 'utf8');
	// Skip non-page files (e.g. the Google site-verification stub has no <html>);
	// Pagefind's own CLI ignores these too.
	if (!content.includes('<html')) continue;
	const url = urlForFile(rel);
	const { errors } = await index.addHTMLFile({ url, content: decorate(url, content) });
	if (errors?.length) console.warn(`[pagefind] ${rel}:`, errors.join('; '));
	else indexed++;
}

await index.writeFiles({ outputPath: OUT });
await pagefind.close();
console.log(`[pagefind] indexed ${indexed}/${files.length} pages -> ${OUT}`);
