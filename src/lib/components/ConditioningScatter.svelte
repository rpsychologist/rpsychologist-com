<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { format } from 'd3-format';
	import { makeConditioningData, type Line } from '$lib/stats/conditioning';
	import type { ScaleLinear } from 'd3-scale';

	const data = makeConditioningData();
	let adjusted = $state(false);

	// Comorbidity-burden palette: low -> moderate -> high (high burden = more harm).
	const stratumColors = ['#3b82f6', '#d97706', '#dc2626'];

	const height = 380;
	const margin = { top: 16, right: 16, bottom: 44, left: 44 };
	const dom = 2.5;

	const y = scaleLinear()
		.domain([-dom, dom])
		.range([height - margin.bottom, margin.top]);

	const ticks = [-2, -1, 0, 1, 2];

	function ends(line: Line, x: ScaleLinear<number, number>) {
		const x1 = Math.max(line.xMin, -dom);
		const x2 = Math.min(line.xMax, dom);
		return {
			x1: x(x1),
			y1: y(line.slope * x1 + line.intercept),
			x2: x(x2),
			y2: y(line.slope * x2 + line.intercept)
		};
	}

	// Both widths are rendered into the DOM; a CSS @media query shows the one that
	// fits the viewport, so the choice happens at first paint with no hydration
	// flash. Desktop is a wide landscape plot; mobile is near-square so it renders
	// close to 1:1 and the ticks/labels/dots stay full size.

	const fmt = format('+.2f');
</script>

<figure class="card cond">
	<div class="controls">
		<button
			class={['fig-pill', { on: adjusted }]}
			aria-pressed={adjusted}
			onclick={() => (adjusted = !adjusted)}
		>
			{adjusted ? 'Adjusting for' : 'Adjust for'} comorbidity
		</button>
	</div>

	{#snippet plot(variant: string, width: number)}
		{@const x = scaleLinear()
			.domain([-dom, dom])
			.range([margin.left, width - margin.right])}
		{@const pooled = ends(data.pooledLine, x)}
		{@const strata = data.strataLines.map((l) => ends(l, x))}
		<svg
			viewBox="0 0 {width} {height}"
			class="plot {variant}"
			role="img"
			aria-label="Income versus gambling-related harm, by comorbidity burden"
		>
			<!-- origin gridlines -->
			<line x1={x(0)} x2={x(0)} y1={margin.top} y2={height - margin.bottom} class="grid" />
			<line x1={margin.left} x2={width - margin.right} y1={y(0)} y2={y(0)} class="grid" />

			{#each ticks as t (t)}
				<text x={x(t)} y={height - margin.bottom + 18} class="tick" text-anchor="middle">{t}</text>
				<text x={margin.left - 10} y={y(t) + 4} class="tick" text-anchor="end">{t}</text>
			{/each}

			<!-- points -->
			{#each data.points as p, i (i)}
				<circle
					cx={x(p.x)}
					cy={y(p.y)}
					r="3"
					class="pt"
					style={`fill: ${adjusted ? stratumColors[p.stratum] : 'var(--muted)'}`}
				/>
			{/each}

			<!-- pooled (marginal) line -->
			<line
				x1={pooled.x1}
				y1={pooled.y1}
				x2={pooled.x2}
				y2={pooled.y2}
				class="pooled"
				style:opacity={adjusted ? 0.15 : 1}
			/>

			<!-- within-stratum lines -->
			{#each strata as s, k (k)}
				<line
					x1={s.x1}
					y1={s.y1}
					x2={s.x2}
					y2={s.y2}
					class="within"
					style={`stroke: ${stratumColors[k]}; opacity: ${adjusted ? 1 : 0}`}
				/>
			{/each}

			<text
				x={(margin.left + width - margin.right) / 2}
				y={height - 6}
				class="axis-label"
				text-anchor="middle">{data.xLabel}</text
			>
			<text
				transform={`translate(14, ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`}
				class="axis-label"
				text-anchor="middle">{data.yLabel}</text
			>
		</svg>
	{/snippet}

	{@render plot('desktop', 640)}
	{@render plot('mobile', 384)}

	{#if adjusted}
		<div class="legend">
			{#each data.strataLabels as label, k (label)}
				<span class="key"
					><span class="swatch" style={`background: ${stratumColors[k]}`}></span>{label}</span
				>
			{/each}
		</div>
	{/if}

	<p class="fig-readout">
		{#if !adjusted}
			Across the whole population the slope is <strong>{fmt(data.pooledSlope)}</strong>: lower
			income goes with <strong>more</strong> gambling-related harm.
		{:else}
			Within each comorbidity stratum the slope is <strong class="pos"
				>{fmt(data.withinSlope)}</strong
			>; it has changed sign: holding comorbidity fixed, <em>higher</em> income goes with more harm. Adjusting
			replaced the question, from "how does gambling harm vary with income in the population?" to "…among
			people with the same comorbidity burden?"
		{/if}
	</p>
</figure>

<style>
	.cond {
		margin: 2rem 0;
		padding: 1.25rem;
		box-shadow: var(--shadow);
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
	.plot {
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.grid {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.tick {
		fill: var(--muted);
		font-size: 11px;
	}
	.axis-label {
		fill: var(--ink);
		font-size: 12px;
	}
	.pt {
		opacity: 0.55;
		transition: fill 0.5s ease;
	}
	.pooled {
		stroke: var(--ink);
		stroke-width: 2.5;
		transition: opacity 0.5s ease;
	}
	.within {
		stroke-width: 2.5;
		transition: opacity 0.5s ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.pt,
		.pooled,
		.within {
			transition: none;
		}
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin: 0.5rem 0;
		font-size: 0.82rem;
		color: var(--ink);
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.swatch {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		display: inline-block;
	}
	/* Both layouts are rendered; CSS picks one at first paint (no hydration flash). */
	.plot.mobile {
		display: none;
	}
	@media (max-width: 36rem) {
		.plot.desktop {
			display: none;
		}
		.plot.mobile {
			display: block;
		}
	}

	/* Portrait viewBox renders near 1:1, so size these in near-CSS pixels. */
	.plot.mobile .tick {
		font-size: 14px;
	}
	.plot.mobile .axis-label {
		font-size: 14px;
	}
	.plot.mobile .pt {
		r: 3.6;
	}
</style>
