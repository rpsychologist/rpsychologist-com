<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { arc, type DefaultArcObject } from 'd3-shape';
	import { format } from 'd3-format';
	import type { CohendState } from './cohend.svelte';

	// Four gauges translating Cohen's d into interpretable quantities. U3,
	// overlap, and probability of superiority are proportions (arc = the value);
	// NNT is a count, so its arc tracks the absolute risk reduction (1/NNT) while
	// the centre shows the count itself. Fractions are tweened so the rings ease.
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
	function ringPath(frac: number) {
		return (
			arcGen({
				innerRadius: R - 11,
				outerRadius: R,
				startAngle: 0,
				endAngle: 2 * Math.PI * frac
			} as DefaultArcObject) ?? ''
		);
	}
	const ring = ringPath(1);
	const wedge = (frac: number) => ringPath(frac);

	// Labels read from the tweened values so every number counts up in step with
	// its arc (matching the old animated donut labels).
	const gauges = $derived([
		{ label: 'Cohen’s U₃', frac: fracs.current.u3, center: pct(fracs.current.u3) },
		{ label: '% Overlap', frac: fracs.current.overlap, center: pct(fracs.current.overlap) },
		{
			label: 'Probability of Superiority',
			frac: fracs.current.cles,
			center: pct(fracs.current.cles)
		},
		{
			label: 'Number Needed to Treat',
			frac: fracs.current.arr,
			center: fracs.current.arr > 0 ? nntFmt(1 / fracs.current.arr) : '∞'
		}
	]);
</script>

<div class="donuts">
	{#each gauges as g (g.label)}
		<figure class="donut">
			<svg viewBox="-60 -60 120 120" role="img" aria-label="{g.label}: {g.center}">
				<path d={ring} class="ring-bg" />
				<path d={wedge(g.frac)} class="ring-fg" />
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
		fill: #4a7fb5;
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
