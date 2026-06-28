<script module>
	// mdsvex replaces Markdown elements with named module exports matching the
	// element name. Re-exporting PostImage (enhanced-img) as `img` routes every
	// Markdown image through it, with no per-post import.
	export { default as img } from './PostImage.svelte';
</script>

<script>
	let { children } = $props();
</script>

{@render children()}
