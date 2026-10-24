<script lang="ts">
	// Inline LaTeX rendered with KaTeX, so every mathematical symbol in the
	// interactive figures stays LaTeX rather than Unicode. CSS imported here so
	// non-post routes using Tex (viz apps) get it; Vite dedupes with PostLayout.
	import katex from 'katex';
	import 'katex/dist/katex.min.css';

	let { math, display = false }: { math: string; display?: boolean } = $props();

	const html = $derived(katex.renderToString(math, { displayMode: display, throwOnError: false }));
</script>

<!-- `math` is always an author-controlled constant (never user input) and the
     markup is KaTeX's own sanitized output, so {@html} is safe here. -->
<!-- The class is `tex-display`, not `display` — article.css has a global
     `.display` (hero title type step) that would blow the equation up to
     display-heading size. -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<span class={['tex', { 'tex-display': display }]}>{@html html}</span>

<style>
	.tex {
		white-space: nowrap;
	}
	.tex.tex-display {
		display: block;
		margin: 0.4rem 0;
	}
</style>
