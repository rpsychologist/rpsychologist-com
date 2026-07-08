<script lang="ts">
	// The sample: N(μ, σ²) density with the 10 observations pinned to it, each
	// with a stem to the baseline. Hovering a point highlights its term in the
	// calculation breakdown (shared `highlight` index owned by LikelihoodTool)
	// and shows its log-likelihood contribution. Ported from the old
	// SamplePlot.js; the d3-selection rendering is now plain Svelte SVG and the
	// foreignObject tooltip is an HTML overlay.
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import { normalPdf } from '../../stats/distributions';
	import { MU_MIN, MU_MAX } from './model';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
		highlight: number | null;
		onhighlight: (i: number | null) => void;
	}
	let { model, highlight, onhighlight }: Props = $props();

	// Old margins: the large top made room for the SVG tooltip bubble; the HTML
	// overlay keeps needing that headroom for points near the density peak.
	const margin = { top: 60, right: 20, bottom: 42, left: 55 };
	const ASPECT = 0.5;

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw * ASPECT - margin.top - margin.bottom);

	const sigma = $derived(Math.sqrt(model.p.sigma2));

	// Old fixed frame: x spans μ_θ ± 5σ_θ, y is pinned to [0, 0.04] so the
	// curve visibly flattens as σ² grows instead of rescaling.
	const x = $derived(scaleLinear([MU_MIN, MU_MAX], [0, w]));
	const y = $derived(scaleLinear([0, 0.04], [h, 0]));
	const xTicks = $derived(x.ticks(8));
	const yTicks = $derived(y.ticks(5));

	// 50 curve samples over μ ± 3σ with far-out anchors and zero endpoints so
	// the path closes to the baseline (old genData).
	const curve = $derived.by(() => {
		const mu = model.p.mu;
		const start = mu - 3 * sigma;
		const end = mu + 3 * sigma;
		const step = (end - start) / 50;
		const pts: [number, number][] = [];
		const far = 10 * Math.sqrt(225);
		pts.push([100 - far, 0]);
		for (let t = start; t < end; t += step) pts.push([t, normalPdf(t, mu, sigma)]);
		pts.push([100 + far, 0]);
		return pts;
	});
	const path = $derived(
		line<[number, number]>()
			.x((d) => x(d[0]))
			.y((d) => y(d[1]))(curve) ?? ''
	);

	const fL = format('.2n');
	const tip = $derived.by(() => {
		if (highlight === null) return null;
		const d = model.p.sample[highlight];
		const L = normalPdf(d, model.p.mu, sigma);
		return { x: x(d) + margin.left, y: y(L) + margin.top, i: highlight, L };
	});
</script>

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			width={cw}
			height={cw * ASPECT}
			role="img"
			aria-label="The sample plotted on the density of a normal distribution with mean {format(
				'.1f'
			)(model.p.mu)} and variance {format('.1f')(model.p.sigma2)}"
		>
			<g transform="translate({margin.left}, {margin.top})">
				<path class="dist" d={path} />

				{#each model.p.sample as d, i (i)}
					{@const py = y(normalPdf(d, model.p.mu, sigma))}
					<line class="stem" x1={x(d)} x2={x(d)} y1={py} y2={y(0)} />
					<!-- Hover affordance only (the tooltip repeats the breakdown panel's
					     numbers), so presentation rather than a focusable control. -->
					<circle
						class="sample-point"
						class:hot={highlight === i}
						role="presentation"
						r={highlight === i ? 10 : 5}
						cx={x(d)}
						cy={py}
						onpointerenter={() => onhighlight(i)}
						onpointerleave={() => onhighlight(null)}
					/>
				{/each}

				<g transform="translate(0, {h})">
					<line x1="0" x2={w} y1="0" y2="0" class="axis" />
					{#each xTicks as t (t)}
						<line x1={x(t)} x2={x(t)} y1="0" y2="6" class="axis" />
						<text x={x(t)} y="20" class="tick" text-anchor="middle">{t}</text>
					{/each}
				</g>
				<g>
					<line x1="0" x2="0" y1="0" y2={h} class="axis" />
					{#each yTicks as t (t)}
						<line x1="-6" x2="0" y1={y(t)} y2={y(t)} class="axis" />
						<text x="-9" y={y(t)} class="tick" text-anchor="end" dominant-baseline="central">
							{t}
						</text>
					{/each}
				</g>

				<text class="axis-label" text-anchor="middle" transform="translate({w / 2}, {h + 36})">
					Observed values
				</text>
				<text
					class="axis-label"
					text-anchor="middle"
					transform="translate({-margin.left + 16}, {h / 2}) rotate(-90)"
				>
					Density
				</text>
			</g>
		</svg>
		{#if tip}
			<div
				class="tooltip"
				style="left: {Math.min(Math.max(tip.x, 70), cw - 70)}px; top: {tip.y - 12}px"
			>
				<Tex math={`\\ell_{${tip.i + 1}} =`} /> log({fL(tip.L)})
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Wrapper reserves the chart's footprint so hydration causes no shift. */
	.chart {
		position: relative;
		width: 100%;
		aspect-ratio: 2 / 1;
	}
	.chart svg {
		display: block;
	}
	.dist {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 2.5;
	}
	.stem {
		stroke: var(--muted);
		stroke-width: 1;
		opacity: 0.55;
	}
	.sample-point {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1.5;
		cursor: pointer;
		transition: r 0.15s;
	}
	.sample-point.hot {
		fill: var(--viz-accent);
	}
	.axis {
		stroke: var(--rule);
	}
	.tick {
		font-size: 11px;
		fill: var(--muted);
	}
	.axis-label {
		font-size: 12px;
		fill: var(--ink);
	}

	.tooltip {
		position: absolute;
		transform: translate(-50%, -100%);
		padding: 0.25rem 0.6rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
		font-size: 0.85rem;
		color: var(--ink);
		white-space: nowrap;
		pointer-events: none;
	}
</style>
