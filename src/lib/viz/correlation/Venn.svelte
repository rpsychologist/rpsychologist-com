<script lang="ts">
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { vennOverlapDistance } from './model';
	import type { CorrelationState } from './correlation.svelte';

	// Shared-variance Venn: two circles whose intersection area is r^2 (the
	// squared correlation) of one circle's area. Ported from the old Venn.js —
	// geometry and clip-path construction verbatim, react-spring swapped for a
	// Tween (400 ms cubicOut, the house motion; 0 while dragging/reduced motion).
	interface Props {
		model: CorrelationState;
	}

	let { model }: Props = $props();

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
	/* Fixed brand colours from the old app (theme-independent by design). */
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
</style>
