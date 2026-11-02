<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Pt } from '#lib/dots/grid.js';
	import ResponsiveSvg from './ResponsiveSvg.svelte';

	export interface Dot {
		id: string;
		/** Any of: event, non, hl, faded, gone. */
		cls: string[];
	}

	interface Props {
		variant: 'desktop' | 'mobile' | 'only';
		width: number;
		height: number;
		dots: Dot[];
		/** One position per dot, in the same order. */
		pos: Pt[];
		r: number;
		label: string;
		underlay?: Snippet;
		overlay?: Snippet;
		/** Per-dot transition delays in ms, in `dots` order (staggered motion). */
		delays?: number[];
	}

	let { variant, width, height, dots, pos, r, label, underlay, overlay, delays }: Props = $props();

	// Tenths of a pixel: keeps the prerendered markup short and identical to the client's.
	const px = (v: number) => Math.round(v * 10) / 10;
</script>

<!-- Every dot stays mounted for the figure's lifetime and only its transform and
     classes change, so state changes animate with CSS and never enter/exit. -->
<ResponsiveSvg {variant} {width} {height} {label}>
	{@render underlay?.()}
	{#each dots as d, i (d.id)}
		<circle
			{r}
			class={['dot', ...d.cls]}
			style:transform="translate({px(pos[i].x)}px, {px(pos[i].y)}px)"
			style:transition-delay={delays ? `${delays[i]}ms` : undefined}
		/>
	{/each}
	{@render overlay?.()}
</ResponsiveSvg>

<style>
	.dot {
		fill: var(--panel);
		stroke: var(--muted);
		stroke-width: 1.2;
		transition:
			transform var(--dot-duration, 0.7s) var(--dot-ease, cubic-bezier(0.4, 0, 0.2, 1)),
			fill 0.4s ease,
			stroke 0.4s ease,
			opacity 0.4s ease;
	}
	.dot.event {
		fill: var(--odds-accent);
		stroke: var(--odds-accent);
	}
	.dot.hl {
		stroke: var(--ink);
		stroke-width: 2;
	}
	.dot.faded {
		opacity: var(--odds-faded);
	}
	.dot.gone {
		opacity: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.dot {
			transition: none;
		}
	}
</style>
