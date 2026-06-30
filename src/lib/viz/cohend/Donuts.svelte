<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { arc, type DefaultArcObject } from 'd3-shape';
	import { format } from 'd3-format';
	import type { CohendState } from './cohend.svelte';

	// Four gauges translating Cohen's d into interpretable quantities. U3, overlap,
	// and probability of superiority are simple proportions: a single arc fills to
	// the value. NNT is a count, but its donut is the reciprocal decomposition (as
	// in the original tool): the ring stacks the control event rate (CER, those who
	// respond at baseline) and the treatment's added responders (ARR = 1/NNT) over
	// an empty remainder, with NNT itself in the centre. A real ring keeps the row
	// balanced and is more informative than a bare number.
	// Fractions are tweened so the rings (and the NNT count, via 1/arr) ease.
	interface Props {
		model: CohendState;
	}

	let { model }: Props = $props();

	const pct = format('.1%');
	const nntFmt = format('.1f');

	const fracs = new Tween(
		{ u3: 0.5, overlap: 1, cles: 0.5, arr: 0 },
		{ duration: 400, easing: cubicOut }
	);
	$effect(() => {
		const e = model.effects;
		// Tween the absolute risk reduction (1/NNT, 0 when NNT is infinite) rather
		// than NNT itself, so the value stays finite; the label derives NNT = 1/arr.
		fracs.set(
			{
				u3: e.u3,
				overlap: e.overlap,
				cles: e.cles,
				arr: Number.isFinite(e.nnt) ? 1 / e.nnt : 0
			},
			{ duration: model.immediate ? 0 : 400 }
		);
	});

	const R = 46;
	const arcGen = arc();
	function ringArc(start: number, end: number) {
		return (
			arcGen({
				innerRadius: R - 11,
				outerRadius: R,
				startAngle: 2 * Math.PI * start,
				endAngle: 2 * Math.PI * end
			} as DefaultArcObject) ?? ''
		);
	}
	const ring = ringArc(0, 1);
	const wedge = (frac: number) => ringArc(0, frac);

	// CER is a proportion in [0,1]; the NNT ring stacks it under the ARR wedge.
	const cer = $derived(model.p.CER / 100);

	// Labels read from the tweened values so every number counts up in step with
	// its arc (matching the old animated donut labels).
	const gauges = $derived([
		{ label: 'Cohen’s U₃', frac: fracs.current.u3, center: pct(fracs.current.u3), nnt: false },
		{
			label: '% Overlap',
			frac: fracs.current.overlap,
			center: pct(fracs.current.overlap),
			nnt: false
		},
		{
			label: 'Probability of Superiority',
			frac: fracs.current.cles,
			center: pct(fracs.current.cles),
			nnt: false
		},
		{
			label: 'Number Needed to Treat',
			frac: fracs.current.arr,
			center: fracs.current.arr > 0 ? nntFmt(1 / fracs.current.arr) : '∞',
			nnt: true
		}
	]);
</script>

<div class="donuts">
	{#each gauges as g (g.label)}
		<figure class="donut">
			<svg viewBox="-60 -60 120 120" role="img" aria-label="{g.label}: {g.center}">
				<path d={ring} class="ring-bg" />
				{#if g.nnt}
					<!-- Stacked: baseline responders (CER) then treatment's added
					     responders (ARR = g.frac), clamped so a rounding overshoot
					     can't wrap past the full ring. -->
					<path d={ringArc(0, cer)} class="ring-cer" />
					<path d={ringArc(cer, Math.min(1, cer + g.frac))} class="ring-fg" />
				{:else}
					<path d={wedge(g.frac)} class="ring-fg" />
				{/if}
				<text class="center" text-anchor="middle" dominant-baseline="central">{g.center}</text>
			</svg>
			<figcaption>{g.label}</figcaption>
		</figure>
	{/each}
</div>

<style>
	.donuts {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}
	@media (max-width: 36rem) {
		.donuts {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.donut {
		margin: 0;
		text-align: center;
	}
	.donut svg {
		width: 100%;
		max-width: 110px;
		height: auto;
	}
	.ring-bg {
		fill: var(--track);
	}
	.ring-fg {
		fill: var(--viz-accent);
	}
	/* NNT baseline (CER) wedge — a neutral grey for "would respond anyway", set
	   off from the accent ARR wedge that follows it. */
	.ring-cer {
		fill: var(--muted);
	}
	.center {
		fill: var(--ink);
		font-size: 19px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.donut figcaption {
		margin-top: 0.3rem;
		font-size: 0.8rem;
		line-height: 1.3;
		color: var(--muted);
	}
</style>
