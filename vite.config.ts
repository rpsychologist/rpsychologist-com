import { existsSync } from 'node:fs';
import adapter from '@sveltejs/adapter-static';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import { markdownExtensions, markdownPreprocess } from './mdsvex.config.js';
import { postsData } from './vite-plugin-posts.js';
import { servePagefind } from './vite-plugin-pagefind.js';

export default defineConfig({
	// enhancedImages must run before sveltekit so it can transform <enhanced:img>
	// and ?enhanced imports emitted by the markdown image transform.
	plugins: [
		enhancedImages(),
		postsData(),
		sveltekit({
			extensions: ['.svelte', ...markdownExtensions],
			preprocess: [markdownPreprocess],
			adapter: adapter({
				// Emit build/404.html (the rendered +error page) — Cloudflare Pages serves it for
				// unmatched paths. The site is otherwise fully prerendered.
				fallback: '404.html',
				precompress: false,
				strict: true
			}),
			prerender: {
				// The prerender server doesn't resolve directory indexes in static/, so
				// links to the old apps there (/d3/NHST/, /pvalue -> index.html) 404 at
				// build time though Cloudflare Pages serves them.
				handleHttpError: ({ path, message }) => {
					if (existsSync(`static${path.replace(/\/?$/, '/')}index.html`)) return;
					throw new Error(message);
				}
			},
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
		}),
		servePagefind()
	],
	css: {
		transformer: 'lightningcss',
		// Targets come from the `browserslist` field in package.json. Note:
		// color-mix() over CSS variables can't be precomputed, so LightningCSS
		// leaves those as-is — this buys prefixing/transpilation/minification only.
		lightningcss: { targets: browserslistToTargets(browserslist()) }
	},
	build: {
		cssMinify: 'lightningcss'
	},
	server: {
		// Posts live in /content (outside src); allow the dev server to read them.
		fs: { allow: ['content'] },
		allowedHosts: ['.localhost', '.ngrok-free.app']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
