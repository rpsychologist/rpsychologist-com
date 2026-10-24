<script lang="ts">
	import { resolve } from '$app/paths';
	import VizGallery from '$lib/components/VizGallery.svelte';
	import type { Viz } from '$lib/viz';

	// Labels are props so the translated cohend pages can pass their own.
	let {
		items,
		heading = 'More visualizations',
		allLabel = 'All visualizations'
	}: { items: Viz[]; heading?: string; allLabel?: string } = $props();
</script>

<section class="more">
	<div class="head">
		<h2>{heading}</h2>
		<a class="all" href={resolve('/viz')}>{allLabel} →</a>
	</div>
	<VizGallery {items} />
</section>

<style>
	.more {
		margin-top: 2.5rem;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
	}
	/* On a narrow phone the link wraps under the heading; keep it right-aligned. */
	.all {
		margin-left: auto;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}
	.all:hover {
		text-decoration: underline;
		text-decoration-color: var(--accent-signal);
		text-underline-offset: 0.15em;
	}
</style>
