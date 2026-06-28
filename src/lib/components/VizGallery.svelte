<script lang="ts">
	import VizGlyph from './VizGlyph.svelte';
	import type { Viz } from '$lib/viz';

	let { items }: { items: Viz[] } = $props();
</script>

<ul class="viz-grid">
	{#each items as v (v.title)}
		<li>
			<a href={v.href} rel="external">
				<span class="screen"><VizGlyph name={v.glyph} /></span>
				<span class="name">{v.title}</span>
				<span class="desc">{v.description}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.viz-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 1rem;
	}
	/* Grid stretches each <li> to the row height; the <li> is flex so the <a>
     fills it, keeping every tile the same height regardless of copy length. */
	.viz-grid li {
		display: flex;
	}
	.viz-grid a {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		padding: 0.85rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--ink);
		transition: border-color 0.15s;
	}
	.viz-grid a:hover {
		border-color: var(--accent);
	}
	/* Glyph floats on the card itself, separated from the label by a hairline —
     a single frame (the card), not a box-in-a-box. */
	.screen {
		aspect-ratio: 16 / 10;
		display: grid;
		place-items: center;
		padding: 0.3rem 0.4rem 0.85rem;
		border-bottom: 1px solid var(--rule);
	}
	.name {
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1rem;
		color: var(--heading);
	}
	.desc {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--muted);
	}

	/* On phones a single 13rem column makes each card full-width with a tall
     thumbnail, so four stack into one long column. Force 2-up and tighten the
     tile so the section stays ~2 rows. */
	@media (max-width: 32rem) {
		.viz-grid {
			grid-template-columns: 1fr 1fr;
			gap: 0.6rem;
		}
		.viz-grid a {
			padding: 0.6rem;
			gap: 0.5rem;
		}
		.name {
			font-size: 0.9rem;
		}
		.desc {
			font-size: 0.78rem;
			/* Clamp to keep the two columns even when copy length differs. */
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 3;
			line-clamp: 3;
			overflow: hidden;
		}
	}
</style>
