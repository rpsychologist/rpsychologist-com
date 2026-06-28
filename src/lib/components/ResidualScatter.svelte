<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { format } from 'd3-format';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		residualPositions,
		residualDefaults,
		residualRanges,
		residualSlope,
		residualParamsValid,
		type ResidualParams
	} from '$lib/stats/residual';

	// The Frisch-Waugh-Lovell identity, staged explicitly. Two auxiliary panels
	// regress income and harm on a single comorbidity Z: the fitted line is the part
	// comorbidity predicts, the vertical gap from it is the leftover (residual). The
	// two sliders ARE those auxiliary slopes -- "how strongly comorbidity tracks
	// income" is literally the tilt of the left panel's line. The main panel below
	// scatters one set of leftovers against the other and morphs from raw to residual;
	// its slope is the adjusted coefficient. The income-harm correlation is fixed, so
	// the raw cloud is a stable anchor (see the Cholesky-ordering note in residual.ts)
	// and only the residualized positions respond to the sliders.
	//
	// Performance: the cloud is recomputed on every slider move, so the hot path is
	// kept lean -- `residualPositions` returns typed arrays from a cached base (no
	// resample), the d3 scales and per-point colors are computed once, and only the
	// visible main-plot variant updates its circles (the hidden one is gated off).

	const [xzMin, xzMax] = residualRanges.rXZ;
	const [yzMin, yzMax] = residualRanges.rYZ;

	let rXZ = $state(residualDefaults.rXZ);
	let rYZ = $state(residualDefaults.rYZ);
	let removed = $state(false);

	// Fraction of each slider's range the handle has travelled, for the track fill.
	const xzPct = $derived(((rXZ - xzMin) / (xzMax - xzMin)) * 100);
	const yzPct = $derived(((rYZ - yzMin) / (yzMax - yzMin)) * 100);

	// Defensive guard: the slider caps keep the 3x3 correlation matrix positive
	// definite, but fall back to the defaults if a combination ever escaped it.
	const params = $derived.by<ResidualParams>(() => {
		const p = { rXY: residualDefaults.rXY, rXZ, rYZ };
		return residualParamsValid(p) ? p : residualDefaults;
	});

	const pos = $derived(residualPositions(params));
	const marginal = $derived(params.rXY);
	const adjusted = $derived(residualSlope(params));

	// The morph: 0 = raw (income, harm), 1 = residualized. Points and the live line
	// interpolate by `t`; the slider-driven residual positions track 1:1, only the
	// raw->residual transition is tweened.
	const morph = new Tween(0, { duration: 650, easing: cubicOut });
	const t = $derived(morph.current);

	function toggle() {
		removed = !removed;
		morph.target = removed ? 1 : 0;
	}

	const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
	const liveSlope = $derived(lerp(marginal, adjusted, t));

	const height = 360;
	const margin = { top: 16, right: 16, bottom: 46, left: 46 };
	const dom = 3;
	const ticks = [-3, -2, -1, 0, 1, 2, 3];

	const y = scaleLinear()
		.domain([-dom, dom])
		.range([height - margin.bottom, margin.top]);

	// Main-plot x scales hoisted: they depend only on the per-variant width.
	const xByVariant: Record<string, ReturnType<typeof scaleLinear<number, number>>> = {
		desktop: scaleLinear()
			.domain([-dom, dom])
			.range([margin.left, 640 - margin.right]),
		mobile: scaleLinear()
			.domain([-dom, dom])
			.range([margin.left, 384 - margin.right])
	};

	// Comorbidity-burden palette: low -> moderate -> high (high burden = more harm),
	// matching ConditioningScatter. Coloring the points by Z is what makes the
	// decomposition legible: the high-burden (red) points sit far from the origin on
	// the comorbidity axis, so they have the largest gaps from each auxiliary line and
	// travel the most when those gaps become their residual coordinates below.
	const burdenColors = ['#3b82f6', '#d97706', '#dc2626'];
	const burdenLabels = ['Low comorbidity', 'Moderate', 'High comorbidity'];
	// Terciles of a standard normal (+/-0.43) split Z into three burden bands.
	const burdenBucket = (z: number) => (z < -0.43 ? 0 : z > 0.43 ? 2 : 1);

	// Per-point colors are computed once from the default cloud and held fixed: a
	// person's burden band is an identity, not something that should flicker as the
	// sliders shift Z, and a stable string avoids rebuilding `fill` every frame.
	const basePos = residualPositions(residualDefaults);
	const stableColor = Array.from(basePos.z, (z) => burdenColors[burdenBucket(z)]);
	const indices = Array.from({ length: basePos.z.length }, (_, i) => i);

	// Three exemplar individuals (high / mid / low comorbidity), fixed by index so the
	// same people are ringed and lettered across all three panels -- the reader can
	// trace one person's gap in an auxiliary panel to their dot in the scatter.
	const exemplarTags = ['a', 'b', 'c'];
	const exemplars = (() => {
		const order = Array.from(basePos.z, (z, i) => ({ z, i }))
			.sort((x, z) => x.z - z.z)
			.map((o) => o.i);
		const at = (q: number) => order[Math.round((order.length - 1) * q)];
		return [at(0.93), at(0.5), at(0.07)].map((idx, k) => ({ idx, tag: exemplarTags[k] }));
	})();

	// Auxiliary-panel geometry (income-on-Z and harm-on-Z), scales hoisted (static).
	const aw = 330;
	const ah = 248;
	const am = { top: 26, right: 14, bottom: 40, left: 44 };
	const az = scaleLinear()
		.domain([-dom, dom])
		.range([am.left, aw - am.right]);
	const av = scaleLinear()
		.domain([-dom, dom])
		.range([ah - am.bottom, am.top]);

	// Only the visible main-plot variant should update its circles. Both render at
	// first paint (SSR-safe, no hydration flash); after mount the hidden one is gated.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	const narrow = new MediaQuery('max-width: 36rem');
	const mainActive = (variant: string) =>
		!mounted || (variant === 'mobile' ? narrow.current : !narrow.current);

	const fmt = format('+.2f');
</script>

<figure class="resid">
	<div class="sliders">
		<label class="slider">
			<span class="slider-label">Correlation between comorbidity and income </span>
			<input
				class="fig-range"
				type="range"
				min={xzMin}
				max={xzMax}
				step="0.01"
				bind:value={rXZ}
				style="--pct: {xzPct}%"
				aria-label="Correlation between comorbidity and income"
			/>
			<span class="slider-val">{fmt(rXZ)}</span>
		</label>
		<label class="slider">
			<span class="slider-label">Correlation between comorbidity and harm </span>
			<input
				class="fig-range"
				type="range"
				min={yzMin}
				max={yzMax}
				step="0.01"
				bind:value={rYZ}
				style="--pct: {yzPct}%"
				aria-label="Correlation between comorbidity and harm"
			/>
			<span class="slider-val">{fmt(rYZ)}</span>
		</label>
	</div>

	<p class="fig-hint">
		<strong>Step 1.</strong> Regress income and harm on comorbidity separately, one regression per panel.
		The solid line is the part comorbidity predicts. The vertical gap from it (rings a, b, c) is the residual,
		the part comorbidity does not explain.
	</p>

	{#snippet auxPanel(heading: string, valueKey: 'xRaw' | 'yRaw', slope: number, vLabel: string)}
		<svg viewBox="0 0 {aw} {ah}" class="aux" role="img" aria-label={heading}>
			<text x={aw / 2} y={15} class="aux-title" text-anchor="middle">{heading}</text>

			<line x1={az(0)} x2={az(0)} y1={am.top} y2={ah - am.bottom} class="grid" />
			<line x1={am.left} x2={aw - am.right} y1={av(0)} y2={av(0)} class="grid" />

			{#each indices as i (i)}
				<circle
					cx={az(pos.z[i])}
					cy={av(pos[valueKey][i])}
					r="2.4"
					class="pt"
					style:fill={stableColor[i]}
				/>
			{/each}

			<!-- the part comorbidity predicts -->
			<line x1={az(-dom)} y1={av(slope * -dom)} x2={az(dom)} y2={av(slope * dom)} class="aux-fit" />

			<!-- exemplar leftovers: the gap from each point to the line -->
			{#each exemplars as ex (ex.tag)}
				{@const zz = pos.z[ex.idx]}
				{@const vv = pos[valueKey][ex.idx]}
				<line x1={az(zz)} y1={av(vv)} x2={az(zz)} y2={av(slope * zz)} class="gap" />
				<circle cx={az(zz)} cy={av(vv)} r="5" class="ring" style:stroke={stableColor[ex.idx]} />
				<text x={az(zz) + 8} y={av(vv) - 6} class="tag">{ex.tag}</text>
			{/each}

			<text x={(am.left + aw - am.right) / 2} y={ah - 6} class="aux-axis" text-anchor="middle"
				>Comorbidity (Z)</text
			>
			<text
				transform={`translate(12, ${(am.top + ah - am.bottom) / 2}) rotate(-90)`}
				class="aux-axis"
				text-anchor="middle">{vLabel}</text
			>
		</svg>
	{/snippet}

	<div class="aux-row">
		{@render auxPanel('Income on comorbidity', 'xRaw', params.rXZ, 'Income')}
		{@render auxPanel('Harm on comorbidity', 'yRaw', params.rYZ, 'Harm')}
	</div>

	<p class="fig-hint step2">
		<strong>Step 2.</strong> Plot each person's income residual against their harm residual. Press the
		button to move every point from its raw position to the residual it left above. The slope through
		these residuals is the adjusted coefficient.
	</p>

	<div class="controls">
		<button class={['fig-pill', { on: removed }]} aria-pressed={removed} onclick={toggle}>
			{removed ? 'Adjusted for comorbidity' : 'Adjust for comorbidity'}
		</button>
	</div>

	{#snippet plot(variant: string, width: number)}
		{@const x = xByVariant[variant]}
		{@const cx = (margin.left + width - margin.right) / 2}
		{@const active = mainActive(variant)}
		<svg
			viewBox="0 0 {width} {height}"
			class="plot {variant}"
			role="img"
			aria-label="Income residual versus harm residual, both with comorbidity removed"
		>
			<line x1={x(0)} x2={x(0)} y1={margin.top} y2={height - margin.bottom} class="grid" />
			<line x1={margin.left} x2={width - margin.right} y1={y(0)} y2={y(0)} class="grid" />

			{#each ticks as tk (tk)}
				<text x={x(tk)} y={height - margin.bottom + 18} class="tick" text-anchor="middle">{tk}</text
				>
				<text x={margin.left - 10} y={y(tk) + 4} class="tick" text-anchor="end">{tk}</text>
			{/each}

			{#if active}
				{#each indices as i (i)}
					<circle
						cx={x(lerp(pos.xRaw[i], pos.xResid[i], t))}
						cy={y(lerp(pos.yRaw[i], pos.yResid[i], t))}
						r="3"
						class="pt"
						style:fill={stableColor[i]}
					/>
				{/each}
			{/if}

			<!-- faint marginal reference: where the relationship started -->
			<line
				x1={x(-dom)}
				y1={y(marginal * -dom)}
				x2={x(dom)}
				y2={y(marginal * dom)}
				class="reference"
			/>
			<text x={x(-dom) + 6} y={y(marginal * -dom) - 6} class="line-label" text-anchor="start"
				>marginal</text
			>

			<!-- live fitted line: rotates from marginal toward the residual slope -->
			<line
				x1={x(-dom)}
				y1={y(liveSlope * -dom)}
				x2={x(dom)}
				y2={y(liveSlope * dom)}
				class={['fit', { pos: liveSlope > 0, neg: liveSlope <= 0 }]}
			/>
			<text
				x={x(dom) - 6}
				y={y(liveSlope * dom) + (liveSlope > 0 ? 16 : -8)}
				class={['line-label', { pos: liveSlope > 0, neg: liveSlope <= 0 }]}
				text-anchor="end"
				style:opacity={t}>adjusted</text
			>

			<!-- the same three people, ringed and lettered as above -->
			{#if active}
				{#each exemplars as ex (ex.tag)}
					{@const ex_x = x(lerp(pos.xRaw[ex.idx], pos.xResid[ex.idx], t))}
					{@const ex_y = y(lerp(pos.yRaw[ex.idx], pos.yResid[ex.idx], t))}
					<circle cx={ex_x} cy={ex_y} r="6" class="ring" style:stroke={stableColor[ex.idx]} />
					<text x={ex_x + 9} y={ex_y - 7} class="tag">{ex.tag}</text>
				{/each}
			{/if}

			<!-- axis labels cross-fade between raw and residual framings -->
			<text x={cx} y={height - 6} class="axis-label" text-anchor="middle" style:opacity={1 - t}
				>Income</text
			>
			<text x={cx} y={height - 6} class="axis-label" text-anchor="middle" style:opacity={t}
				>Income, comorbidity removed</text
			>
			<text
				transform={`translate(14, ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`}
				class="axis-label"
				text-anchor="middle"
				style:opacity={1 - t}>Gambling-related harm</text
			>
			<text
				transform={`translate(14, ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`}
				class="axis-label"
				text-anchor="middle"
				style:opacity={t}>Harm, comorbidity removed</text
			>
		</svg>
	{/snippet}

	{@render plot('desktop', 640)}
	{@render plot('mobile', 384)}

	<div class="legend">
		{#each burdenLabels as label, k (k)}
			<span class="key"
				><span class="swatch" style={`background: ${burdenColors[k]}`}></span>{label}</span
			>
		{/each}
	</div>

	<p class="fig-readout">
		The dashed line, <strong class="neg">{fmt(marginal)}</strong>, is where harm falls across
		income. The solid line,
		<strong class={['', { pos: adjusted > 0, neg: adjusted <= 0 }]}>{fmt(adjusted)}</strong>, is the
		slope relating the two residuals: income with comorbidity removed against harm with comorbidity
		removed, not income and harm as anyone actually has them.
	</p>
</figure>

<style>
	.resid {
		margin: 2rem 0;
		padding: 1.25rem 1.25rem 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		background: var(--panel);
		box-shadow: var(--shadow);
	}
	/* The card is tall (two auxiliary panels above the main scatter), so the sliders
     stick to the top of the viewport while the figure is in view. Negative margins
     pull the bar out to the card edges; the opaque background and bottom rule keep
     the scrolling panels hidden as they pass beneath. */
	.sliders {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: -1.25rem -1.25rem 0.75rem;
		padding: 1.25rem 1.25rem 0.85rem;
		background: var(--panel);
		border-bottom: 1px solid var(--rule);
	}
	.slider {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'label label'
			'input value';
		align-items: center;
		column-gap: 0.85rem;
		row-gap: 0.5rem;
	}
	.slider-label {
		grid-area: label;
		font-size: 0.85rem;
		line-height: 1.3;
		color: var(--ink);
	}
	.slider .fig-range {
		grid-area: input;
	}
	.slider-val {
		grid-area: value;
		min-width: 2.75rem;
		padding: 0.1rem 0.45rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		text-align: center;
		font-variant-numeric: tabular-nums;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border-radius: 6px;
	}
	.fig-hint.step2 {
		margin-top: 1rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}
	.aux-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.aux {
		flex: 1 1 280px;
		min-width: 0;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.aux-title {
		fill: var(--heading);
		font-size: 12px;
		font-weight: 600;
	}
	.aux-axis {
		fill: var(--muted);
		font-size: 11px;
	}
	.aux-fit {
		stroke: var(--ink);
		stroke-width: 2;
	}
	.gap {
		stroke: var(--ink);
		stroke-width: 1.5;
		stroke-dasharray: 3 2;
		opacity: 0.7;
	}
	.ring {
		fill: none;
		stroke-width: 2;
	}
	.tag {
		fill: var(--ink);
		font-size: 12px;
		font-weight: 700;
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
	.line-label {
		fill: var(--muted);
		font-size: 11px;
		font-weight: 600;
	}
	.line-label.pos {
		fill: var(--flip-pos);
	}
	.line-label.neg {
		fill: var(--flip-neg);
	}
	.pt {
		fill: var(--muted);
		opacity: 0.5;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin: 0.6rem 0 0;
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
	.reference {
		stroke: var(--muted);
		stroke-width: 1.5;
		stroke-dasharray: 4 4;
		opacity: 0.55;
	}
	.fit {
		stroke-width: 2.5;
	}
	.fit.pos {
		stroke: var(--flip-pos);
	}
	.fit.neg {
		stroke: var(--flip-neg);
	}
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
	.plot.mobile .tick {
		font-size: 14px;
	}
	.plot.mobile .axis-label {
		font-size: 14px;
	}
	.plot.mobile .line-label {
		font-size: 13px;
	}
	.plot.mobile .pt {
		r: 3.6;
	}
	@media (max-width: 520px) {
		.resid {
			padding: 1rem 0.85rem 0.85rem;
		}
		.sliders {
			margin: -1rem -0.85rem 0.75rem;
			padding: 1rem 0.85rem 0.7rem;
		}
		.aux-row {
			gap: 0.5rem;
		}
	}
</style>
