<script module>
	// mdsvex replaces Markdown elements with named module exports matching the
	// element name. Re-exporting PostImage (enhanced-img) as `img` routes every
	// Markdown image through it, with no per-post import.
	export { default as img } from './PostImage.svelte';
</script>

<script>
	// Bundled locally (not CDN) so the stylesheet always matches the installed
	// katex version that rendered the markup; scoped here so math-less routes
	// (home, /viz) don't pay for it.
	import 'katex/dist/katex.min.css';

	let { children } = $props();
</script>

{@render children()}
