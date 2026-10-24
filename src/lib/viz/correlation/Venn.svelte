<script lang="ts">
	import { format } from 'd3-format';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { vennOverlapDistance } from './model';
	import type { CorrelationState } from './correlation.svelte';

	// Shared-variance Venn: two circles whose intersection area is r^2 (the
	// squared correlation) of one circle's area. Ported from the old Venn.js —
	// geometry and clip-path construction verbatim, react-spring swapped for a
	// Tween (400 ms cubicOut, the house motion; 0 while dragging/reduced motion).
	// Labels are new (approved 2026-07-04): variable names in the circles and
	// the r² percentage in the lens, so the diagram reads without the caption.
	interface Props {
		model: CorrelationState;
		/** Display names for the circles (the tool passes truncated axis labels,
		 * or Pre/Post in slope mode). */
		xName?: string;
		yName?: string;
	}

	let { model, xName = 'x', yName = 'y' }: Props = $props();

	const margin = { top: 20, right: 10, bottom: 30, left: 0 };

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(w / 2);
	const r = $derived(w / 4);

	const cor = $derived(model.stats?.cor ?? 0);

	const overlap = new Tween(0, { duration: 400, easing: cubicOut });
	$effect(() => {
		overlap.set(vennOverlapDistance(cor, r), {
			duration: model.immediate || prefersReducedMotion.current ? 0 : 400
		});
	});

	const x1 = $derived(r + (2 * r - overlap.current));
	const x2 = $derived(r + overlap.current);
	const intersect = $derived(2 * r);

	// Label geometry along the horizontal diameter: each circle-only region is
	// x1 - x2 wide, the lens is the rest. Labels fade out (rather than clip or
	// spill into the wrong region) when their region gets too narrow.
	const pctF = format('.0%');
	const mid = $derived((x1 + x2) / 2);
	const uniqueW = $derived(x1 - x2);
	const lensLabel = $derived(pctF(cor ** 2));
	const CHAR_W = 7.5; // ~13px font
	const fits = (label: string, width: number) => width > label.length * CHAR_W + 14;
</script>

<div class="venn" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			width={cw}
			height={h}
			viewBox="0 0 {cw} {h}"
			role="img"
			aria-label="Venn diagram: the two variables share {Math.round(
				cor * cor * 100
			)}% of their variance"
		>
			<g transform="translate({margin.left}, 0)">
				<circle class="circle-y" {r} cx={x1} cy={r} />
				<circle class="circle-x" {r} cx={x2} cy={r} />
				<circle class="intersect" {r} cx={x2} cy={r} clip-path="url(#corr-venn-clip1)" />
				<circle class="intersect" {r} cx={x1} cy={r} clip-path="url(#corr-venn-clip2)" />
				<text
					class="vlabel on-x"
					class:hidden={!fits(xName, uniqueW)}
					x={mid - r}
					y={r}
					text-anchor="middle"
					dominant-baseline="central">{xName}</text
				>
				<text
					class="vlabel on-y"
					class:hidden={!fits(yName, uniqueW)}
					x={mid + r}
					y={r}
					text-anchor="middle"
					dominant-baseline="central">{yName}</text
				>
				<text
					class="vlabel on-lens"
					class:hidden={cor === 0 || !fits(lensLabel, 2 * r - uniqueW)}
					x={mid}
					y={r}
					text-anchor="middle"
					dominant-baseline="central">{lensLabel}</text
				>
			</g>
			<defs>
				<clipPath id="corr-venn-clip1">
					<rect width={r * 2} height={r * 2} x={intersect - 1} y="0" />
				</clipPath>
				<clipPath id="corr-venn-clip2">
					<rect width={intersect} height={r * 2} x="0" y="0" />
				</clipPath>
			</defs>
		</svg>
	{/if}
</div>

<style>
	/* Wrapper reserves the ~2:1 footprint (height = (width - margins) / 2) so
	   the diagram drawing on hydration causes no layout shift. */
	.venn {
		width: 100%;
		aspect-ratio: 2 / 1;
	}
	.venn svg {
		display: block;
		touch-action: pan-y;
	}
	/* Fixed brand colours from the old app (theme-independent by design); dark
	   mode only lifts the navy circle and outlines the lens, which otherwise
	   read as holes against a dark background. */
	.circle-x {
		fill: #30394f;
		stroke: #30394f;
	}
	.circle-y {
		fill: #6aceeb;
		stroke: #6aceeb;
	}
	.intersect {
		fill: #000;
		stroke: #000;
		stroke-width: 2px;
	}
	:global(html[data-theme='dark']) .circle-x {
		fill: #3d4a6b;
		stroke: #6b7ba3;
	}
	:global(html[data-theme='dark']) .intersect {
		stroke: #6b7ba3;
	}

	.vlabel {
		font-size: 13px;
		pointer-events: none;
		transition: opacity 0.3s;
	}
	.vlabel.hidden {
		opacity: 0;
	}
	/* Fixed fills to match the fixed region colours, not the theme. */
	.on-x {
		fill: #dfe5f0;
	}
	.on-y {
		fill: #14293e;
	}
	.on-lens {
		fill: #f2f2f2;
	}
	@media (prefers-reduced-motion: reduce) {
		.vlabel {
			transition: none;
		}
	}
</style>
