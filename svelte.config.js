import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { mdsvex, escapeSvelte } from 'mdsvex';
import { createHighlighter } from 'shiki';
import remarkMath from 'remark-math';
import remarkSmartypants from 'remark-smartypants';
import { remarkResolveImages } from './src/lib/remark/resolve-images.js';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { rehypeEscapeSvelte } from './src/lib/rehype/escape-svelte.js';
import { rehypeWrapTables } from './src/lib/rehype/wrap-tables.js';

// Dual-theme Shiki highlighting. A single highlighter instance is reused across
// every fenced block (creating one per block is the common performance trap).
// Dual themes emit CSS variables (--shiki-dark) toggled by [data-theme="dark"].
const shikiThemes = { light: 'github-light', dark: 'github-dark' };
// Only Shiki-bundled grammars. Anything else in a fence (e.g. `rout`, `xhtml`)
// falls back to plaintext via the getLoadedLanguages() check below.
const shikiLangs = [
	'r',
	'bash',
	'shell',
	'js',
	'ts',
	'jsx',
	'tsx',
	'svelte',
	'json',
	'yaml',
	'python',
	'sql',
	'css',
	'html',
	'xml',
	'md',
	'diff',
	'latex'
];

let highlighterPromise;
const getHighlighter = () =>
	(highlighterPromise ??= createHighlighter({
		themes: Object.values(shikiThemes),
		langs: shikiLangs
	}));

async function highlight(code, lang, meta) {
	const hl = await getHighlighter();
	// Old R-generated fences use forms like `r:collapsed=true`; take the base token.
	const info = `${lang ?? ''} ${meta ?? ''}`;
	const base = (lang || 'text').split(/[:\s]/)[0];
	const language = hl.getLoadedLanguages().includes(base) ? base : 'text';
	const collapsed = /collapsed=true/i.test(info);
	const attrs = `data-language="${language}"${collapsed ? ' data-collapsed="true"' : ''}`;
	const rendered = hl
		.codeToHtml(code, {
			lang: language,
			themes: shikiThemes,
			defaultColor: false,
			// github-light's orange (#e36209) is 3.5:1 on white — below WCAG AA for
			// body text. Primer's darker orange reads the same and passes (5.0:1).
			colorReplacements: { 'github-light': { '#e36209': '#bc4c00' } }
		})
		.replace('<pre ', `<pre ${attrs} `);
	// The block chrome (bar, buttons, collapsed state) is emitted here, at build
	// time, so posts prerender in their final layout — adding bars and folding
	// collapsed blocks at hydration shifted the article under the reader.
	// enhanceCode only wires the buttons; CSS gated on html.js keeps collapsed
	// blocks readable without JS.
	const fold = collapsed
		? '<button type="button" class="code-fold" aria-expanded="false">Show code</button>'
		: '';
	const label = language !== 'text' ? language : '';
	const block =
		`<div class="code-block${collapsed ? ' collapsed' : ''}">` +
		`<div class="code-bar"><span class="code-lang">${label}</span>` +
		`<div class="code-actions">${fold}<button type="button" class="code-copy">Copy</button></div></div>` +
		`${rendered}</div>`;
	const html = escapeSvelte(block);
	// Official mdsvex pattern: return the highlighted HTML as an {@html `...`} block;
	// escapeSvelte makes the string safe inside the template literal.
	return `{@html \`${html}\`}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [
		mdsvex({
			extensions: ['.svx', '.md'],
			// Absolute path: mdsvex injects this as an import into each compiled doc,
			// resolved relative to the doc, so a relative path would break.
			layout: fileURLToPath(new URL('./src/lib/components/PostLayout.svelte', import.meta.url)),
			highlight: { highlighter: highlight },
			remarkPlugins: [remarkResolveImages, remarkMath, remarkSmartypants],
			rehypePlugins: [
				rehypeSlug,
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'append',
						properties: { class: 'heading-anchor', ariaHidden: true, tabIndex: -1 }
					}
				],
				[rehypeKatex, { strict: false }],
				rehypeWrapTables,
				// Must run after rehype-katex to escape braces in its MathML annotation.
				rehypeEscapeSvelte
			]
		})
	],
	kit: {
		adapter: adapter({
			// Emit build/404.html (the rendered +error page) — Netlify serves it for
			// unmatched paths. The site is otherwise fully prerendered.
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		// Hash mode auto-hashes only the scripts SvelteKit itself renders (its
		// hydration bootstrap). It does NOT hash inline scripts in app.html — those
		// are interpolated after the policy is built — so the pre-paint theme script
		// there must be hashed manually below. This matters in dev, where SvelteKit
		// sends CSP as an HTTP *header* (governs from byte zero and would block it);
		// in the prerendered build the policy is a <meta> that sits after the script,
		// so it'd run regardless — but listing it keeps dev and prod honest. Recompute
		// if the script's bytes change (a mismatch is loud: console violation + a
		// theme flash in dev).
		csp: {
			mode: 'hash',
			directives: {
				'default-src': ['self'],
				// wasm-unsafe-eval: Pagefind compiles wasm. Today that happens inside its
				// worker, which a <meta>-delivered CSP doesn't govern — search works by
				// accident. This keeps it working if the CSP ever moves to an HTTP header
				// or Pagefind drops the worker. (Allows wasm compilation only, not JS eval.)
				'script-src': [
					'self',
					'wasm-unsafe-eval',
					'https://static.cloudflareinsights.com',
					'sha256-nnPyRf3TJGBhR91oc8sJXvDtonYVSMw/wGLCZqf9k+k='
				],
				// unsafe-inline: Shiki emits style="" attributes, which hashes can't
				// cover. Fonts (Fontsource) and KaTeX CSS are self-hosted, so the only
				// remaining third party is the analytics beacon.
				'style-src': ['self', 'unsafe-inline'],
				'font-src': ['self', 'data:'],
				'img-src': ['self', 'data:'],
				'connect-src': ['self', 'https://cloudflareinsights.com'],
				'base-uri': ['self'],
				'object-src': ['none']
			}
		}
	}
};

export default config;
