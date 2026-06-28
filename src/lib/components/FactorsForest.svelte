<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { format } from 'd3-format';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { coefficientScenario, coefIndex } from '$lib/stats/scenarios';
	import { regressionCoefficients, marginalSlope } from '$lib/stats/regression';
	import Tex from './Tex.svelte';
	import ModelEquation from './ModelEquation.svelte';

	// The "factors associated with" table itself: every variable entered into one
	// regression, each row carrying its mutually-adjusted coefficient. The reader
	// chooses which comorbidities the analyst enters; every row resettles, income
	// included. The point is that the whole table is a function of that choice, not
	// a readout of the population. Coefficients are exact (population covariance),
	// so no significance stars are invented -- the verdict that flips is the sign.

	const scenario = coefficientScenario;
	const sigma = scenario.sigma;
	const yIdx = coefIndex.Y;
	const xIdx = coefIndex.X;
	const covIdx: Record<string, number> = {
		Z1: coefIndex.Z1,
		Z2: coefIndex.Z2,
		Z3: coefIndex.Z3
	};

	let active = $state<Record<string, boolean>>({ Z1: false, Z2: false, Z3: false });

	const activeIdx = $derived(
		scenario.covariates.filter((c) => active[c.key]).map((c) => covIdx[c.key])
	);

	// The full coefficient vector of the currently-entered model, mapped back to
	// each variable. Income is always entered; a covariate that is not entered has
	// no coefficient and collapses onto the zero line.
	const coefByKey = $derived.by(() => {
		const predictors = [xIdx, ...activeIdx];
		const betaVec = regressionCoefficients(sigma, yIdx, predictors);
		const map: Record<string, number> = { X: betaVec[0] };
		let pos = 1;
		for (const c of scenario.covariates) {
			map[c.key] = active[c.key] ? betaVec[pos++] : 0;
		}
		return map;
	});

	const marginal = marginalSlope(sigma, yIdx, xIdx);
	const incomeCoef = $derived(coefByKey.X);

	// The fitted-equation card: the lm() call and fitted line for the current
	// model, income highlighted as the term of interest.
	const tokenByIdx: Record<number, string> = {
		[xIdx]: scenario.exposure.token,
		...Object.fromEntries(scenario.covariates.map((c) => [covIdx[c.key], c.token]))
	};
	const eqTerms = $derived.by(() => {
		const predictors = [xIdx, ...activeIdx];
		const betaVec = regressionCoefficients(sigma, yIdx, predictors);
		return predictors.map((idx, i) => ({
			token: tokenByIdx[idx],
			coef: betaVec[i],
			highlight: idx === xIdx
		}));
	});

	// Rows top to bottom: the focal exposure first, then the candidate covariates.
	const rows = $derived([
		{
			key: 'X',
			label: scenario.exposure.label,
			gloss: scenario.exposure.gloss,
			focal: true,
			entered: true
		},
		...scenario.covariates.map((c) => ({
			key: c.key,
			label: c.label,
			gloss: c.gloss,
			focal: false,
			entered: active[c.key]
		}))
	]);

	const NEAR = 0.05;

	const fmt = format('+.2f');

	const nRows = scenario.covariates.length + 1; // exposure + candidate covariates
	const xTicks = [-0.4, -0.2, 0, 0.2, 0.4];

	// Two layouts, both rendered into the DOM; a CSS @media query shows the one that
	// fits the viewport. The breakpoint is thus resolved at first paint (pure CSS),
	// so there is no hydration flash from a JS-decided layout. Desktop lays each row
	// out as name | lollipop | verdict across a wide canvas; mobile uses a narrow
	// portrait canvas (type renders near 1:1) and stacks name + verdict above a
	// full-width lollipop.
	type Geom = {
		variant: 'desktop' | 'mobile';
		stacked: boolean;
		W: number;
		top: number;
		rowH: number;
		plotL: number;
		plotR: number;
		botPad: number;
	};
	const desktopGeom: Geom = {
		variant: 'desktop',
		stacked: false,
		W: 640,
		top: 50,
		rowH: 50,
		plotL: 170,
		plotR: 545,
		botPad: 12
	};
	const mobileGeom: Geom = {
		variant: 'mobile',
		stacked: true,
		W: 360,
		top: 64,
		rowH: 60,
		plotL: 16,
		plotR: 344,
		botPad: 24
	};

	// Tweened coefficient per row: the lollipops slide as the model changes; a
	// not-entered covariate tweens to the zero line (and fades via CSS).
	const tw = Tween.of(() => coefByKey, { duration: 420, easing: cubicOut });
</script>

<figure class="forest">
	<div class="controls">
		<span class="controls-label">Choose adjustment variables:</span>
		{#each scenario.covariates as cov (cov.key)}
			<button
				class={['fig-pill', { on: active[cov.key] }]}
				aria-pressed={active[cov.key]}
				onclick={() => (active[cov.key] = !active[cov.key])}
				title={cov.gloss}
			>
				<Tex math={cov.symbol} /><span class="fig-pill-text">{cov.label}</span>
			</button>
		{/each}
	</div>
	{#snippet plot(g: Geom)}
		{@const xScale = scaleLinear().domain([-0.55, 0.6]).range([g.plotL, g.plotR])}
		{@const x0 = xScale(0)}
		{@const H = g.top + nRows * g.rowH + g.botPad}
		{@const bandTop = g.top - g.rowH / 2 + 4}
		{@const bandBottom = g.top + (nRows - 1) * g.rowH + g.rowH / 2 - 4}
		<svg
			viewBox="0 0 {g.W} {H}"
			class="plot {g.variant}"
			role="img"
			aria-label="Coefficient table: every entered variable's mutually-adjusted coefficient"
		>
			<!-- direction-of-harm annotation -->
			<text class="dir" x={x0 - 10} y={g.stacked ? 36 : 24} text-anchor="end">&larr; less harm</text
			>
			<text class="dir" x={x0 + 10} y={g.stacked ? 36 : 24} text-anchor="start"
				>more harm &rarr;</text
			>

			<!-- x gridlines + labels -->
			{#each xTicks as t (t)}
				<line
					class={['grid', { zero: t === 0 }]}
					x1={xScale(t)}
					x2={xScale(t)}
					y1={bandTop}
					y2={bandBottom}
				/>
				<text class="xtick" x={xScale(t)} y={H - 4} text-anchor="middle">{t}</text>
			{/each}

			{#each rows as row, i (row.key)}
				{@const c = coefByKey[row.key]}
				{@const xc = xScale(tw.current[row.key])}
				{@const cy = g.top + i * g.rowH}
				{@const lolliY = g.stacked ? cy + 15 : cy}
				<!-- Place the value on the inner side when the dot is near an edge so the
             label never spills past the (narrow) mobile plot; otherwise follow the
             sign, as on desktop. -->
				{@const valRight = g.stacked ? xc < g.plotL + 72 || (c >= 0 && xc <= g.plotR - 72) : c >= 0}
				<!-- focal (income) row highlight -->
				{#if row.focal}
					<rect class="band" x="4" y={cy - g.rowH / 2 + 4} width={g.W - 8} height={g.rowH - 8} />
				{/if}

				{#if g.stacked}
					<!-- name above the lollipop -->
					<text class={['name', { focal: row.focal, off: !row.entered }]} x="14" y={cy - 9}
						>{row.label}</text
					>
				{:else}
					<!-- variable name (left column) -->
					<text class={['name', { focal: row.focal, off: !row.entered }]} x="14" y={cy + 4}
						>{row.label}</text
					>
				{/if}

				<!-- lollipop -->
				<g class={['lolli', { off: !row.entered }]}>
					<line
						class={['stem', { pos: c >= 0, neg: c < 0 }]}
						x1={x0}
						x2={xc}
						y1={lolliY}
						y2={lolliY}
					/>
					<circle
						class={['dot', { pos: c >= 0, neg: c < 0 }]}
						cx={xc}
						cy={lolliY}
						r={g.stacked ? 6 : 5.5}
					/>
					{#if row.entered}
						<text
							class={['val', { pos: c >= 0, neg: c < 0 }]}
							x={valRight ? xc + 10 : xc - 10}
							y={g.stacked ? lolliY - 8 : lolliY + 4}
							text-anchor={valRight ? 'start' : 'end'}>{fmt(tw.current[row.key])}</text
						>
					{/if}
				</g>
			{/each}
		</svg>
	{/snippet}

	{@render plot(desktopGeom)}
	{@render plot(mobileGeom)}

	<ModelEquation outcomeToken={scenario.outcome.token} terms={eqTerms} />

	<p class="fig-readout">
		{#if activeIdx.length === 0}
			With nothing else entered, income's slope is <strong class="neg">{fmt(incomeCoef)}</strong> &mdash;
			harm concentrated among the low-income, the actual disparity.
		{:else if incomeCoef > NEAR}
			Income now has a coefficient of <strong class="pos">{fmt(incomeCoef)}</strong>: the table
			reports
			<em>higher</em> income with <em>more</em> harm &mdash; the association has flipped sign.
		{:else}
			Income now has a coefficient of <strong class={{ neg: incomeCoef < 0, pos: incomeCoef >= 0 }}
				>{fmt(incomeCoef)}</strong
			>, flatter than the {fmt(marginal)} disparity the population actually contains.
		{/if}
	</p>
</figure>

<style>
	.forest {
		margin: 2rem 0;
		padding: 1.25rem 1.25rem 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		background: var(--panel);
		box-shadow: var(--shadow);
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.controls-label {
		font-size: 0.85rem;
		color: var(--muted);
		margin-right: 0.25rem;
	}
	.plot {
		width: 100%;
		height: auto;
		margin: 0.5rem 0;
		overflow: visible;
	}
	.band {
		fill: var(--accent-soft);
	}
	.grid {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.grid.zero {
		stroke: var(--ink);
		stroke-width: 1.5;
	}
	.xtick {
		fill: var(--muted);
		font-size: 11px;
	}
	.dir {
		fill: var(--muted);
		font-size: 13px;
	}
	.name {
		fill: var(--ink);
		font-size: 12.5px;
	}
	.name.focal {
		font-weight: 700;
	}
	.name.off {
		fill: var(--muted);
	}
	.lolli {
		transition: opacity 0.35s;
	}
	.lolli.off {
		opacity: 0.32;
	}
	.stem {
		stroke-width: 2.5;
	}
	.stem.pos {
		stroke: var(--flip-pos);
	}
	.stem.neg {
		stroke: var(--flip-neg);
	}
	.dot.pos {
		fill: var(--flip-pos);
	}
	.dot.neg {
		fill: var(--flip-neg);
	}
	.val {
		font-size: 12px;
		font-weight: 700;
	}
	.val.pos {
		fill: var(--flip-pos);
	}
	.val.neg {
		fill: var(--flip-neg);
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

	/* Portrait layout: the narrow viewBox renders these near 1:1, so size them in
     near-CSS pixels for comfortable reading on a phone. */
	.plot.mobile .name {
		font-size: 16px;
	}
	.plot.mobile .xtick {
		font-size: 14px;
	}
	.plot.mobile .val {
		font-size: 15px;
	}
</style>
