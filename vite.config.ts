import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import { postsData } from './vite-plugin-posts.js';
import { servePagefind } from './vite-plugin-pagefind.js';

export default defineConfig({
	// enhancedImages must run before sveltekit so it can transform <enhanced:img>
	// and ?enhanced imports emitted by the markdown image transform.
	plugins: [enhancedImages(), postsData(), sveltekit(), servePagefind()],
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
