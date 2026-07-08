<script lang="ts">
	// The inference figure: relative log-likelihood curves at the fixed
	// estimates for the reference n = 10 (gray) and the hypothetical slider n
	// (accent) — curvature (Fisher information) grows with n. New in 0.2.0:
	// the geometry of the three tests is drawn explicitly (after Buse, 1982)
	// and the active test's element highlights while the others dim.
	//
	// Inherited quirk kept deliberately: the score tangent uses σ̂² (old
	// derivMuN) while the Score *statistic* uses σ̂₀² — the old page carried
	// a "figure is simplified" caveat, which the LRT tab still shows.
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { format } from 'd3-format';
	import { MU_MAX, MU_MIN, relLogLik, scoreMu } from './model';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const margin = { top: 20, right: 20, bottom: 40, left: 60 };
	const ASPECT = 0.55;
	const N_REF = 10;

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw * ASPECT - margin.top - margin.bottom);

	const x = $derived(scaleLinear([MU_MIN, MU_MAX], [0, w]));
	// Frame from the reference curve only (old behavior), so changing n moves
	// the curves inside a stable window.
	const yMin = $derived(
		Math.min(
			relLogLik(N_REF, model.muHat, MU_MIN, model.sigma2Hat),
			relLogLik(N_REF, model.muHat, MU_MAX, model.sigma2Hat)
		)
	);
	const y = $derived(scaleLinear([yMin, 0], [h, 0]));
	const xTicks = $derived(x.ticks(8));
	const yTicks = $derived(y.ticks(4));

	const toPath = $derived(
		line<[number, number]>()
			.x((d) => x(d[0]))
			.y((d) => y(d[1]))
	);
	const curveOf = (n: number) => {
		const step = (MU_MAX - MU_MIN) / 50;
		const pts: [number, number][] = [];
		for (let t = MU_MIN; t <= MU_MAX + 1e-9; t += step)
			pts.push([t, relLogLik(n, model.muHat, t, model.sigma2Hat)]);
		return pts;
	};
	const refCurve = $derived(curveOf(N_REF));
	const nCurve = $derived(curveOf(model.p.n));

	// Test geometry on the slider-n curve (old estllThetaNull / derivMuN).
	const llNull = $derived(relLogLik(model.p.n, model.muHat, model.p.muNull, model.sigma2Hat));
	const slope = $derived(scoreMu(model.p.n, model.p.muNull, model.muHat, model.sigma2Hat));

	const test = $derived(model.p.test);
	const f1 = format('.1f');

	// Score tangent through (μ₀, llNull): ±Δμ in data units.
	const tangent = $derived.by(() => {
		const dMu = (MU_MAX - MU_MIN) / 6;
		return {
			x1: x(model.p.muNull - dMu),
			x2: x(model.p.muNull + dMu),
			y1: y(llNull - dMu * slope),
			y2: y(llNull + dMu * slope)
		};
	});
</script>

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			width={cw}
			height={cw * ASPECT}
			role="img"
			aria-label="Relative log-likelihood curves for sample sizes 10 and {model.p
				.n}, annotated with the geometry of the likelihood ratio, Wald, and score tests"
		>
			<defs>
				<clipPath id="curvature-clip">
					<rect x="0" y="-10" width={w} height={h + 20} />
				</clipPath>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<g clip-path="url(#curvature-clip)">
					<path class="ref-curve" d={toPath(refCurve)} />
					<path class="n-curve" d={toPath(nCurve)} />

					<!-- LRT: the vertical drop between ℓ(μ̂) and ℓ(μ₀). -->
					<g class="anno anno-lrt" class:highlight={test === 'LRT'} data-testid="anno-LRT">
						<line class="guide" x1="0" x2={w} y1={y(0)} y2={y(0)} />
						<line class="guide" x1="0" x2={w} y1={y(llNull)} y2={y(llNull)} />
						<g class="bracket">
							<line x1="14" x2="14" y1={y(0)} y2={y(llNull)} />
							<line x1="9" x2="19" y1={y(0)} y2={y(0)} />
							<line x1="9" x2="19" y1={y(llNull)} y2={y(llNull)} />
						</g>
						<text class="anno-label" x="22" y={(y(0) + y(llNull)) / 2} dominant-baseline="central">
							½·LR (vertical drop)
						</text>
					</g>

					<!-- Wald: the horizontal distance μ̂ − μ₀, weighted by curvature. -->
					<g class="anno anno-wald" class:highlight={test === 'wald'} data-testid="anno-wald">
						<line class="guide" x1={x(model.muHat)} x2={x(model.muHat)} y1="0" y2={h} />
						<line class="guide" x1={x(model.p.muNull)} x2={x(model.p.muNull)} y1="0" y2={h} />
						<g class="bracket">
							<line x1={x(model.p.muNull)} x2={x(model.muHat)} y1={h - 14} y2={h - 14} />
							<line x1={x(model.p.muNull)} x2={x(model.p.muNull)} y1={h - 19} y2={h - 9} />
							<line x1={x(model.muHat)} x2={x(model.muHat)} y1={h - 19} y2={h - 9} />
						</g>
						<text
							class="anno-label"
							x={(x(model.muHat) + x(model.p.muNull)) / 2}
							y={h - 24}
							text-anchor="middle"
						>
							μ̂ − μ₀, scaled by curvature I(μ̂)
						</text>
					</g>

					<!-- Score: the slope of the tangent at the null. -->
					<g class="anno anno-score" class:highlight={test === 'score'} data-testid="anno-score">
						<line class="tangent" x1={tangent.x1} x2={tangent.x2} y1={tangent.y1} y2={tangent.y2} />
						<text
							class="anno-label"
							x={Math.min(tangent.x2 + 6, w - 4)}
							y={tangent.y2}
							dominant-baseline="central"
						>
							slope U(μ₀)
						</text>
					</g>

					<circle class="pt-mle" r="5" cx={x(model.muHat)} cy={y(0)} />
					<circle class="pt-null" r="5" cx={x(model.p.muNull)} cy={y(llNull)} />
				</g>

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
							{f1(t)}
						</text>
					{/each}
				</g>

				<text class="axis-label" text-anchor="middle" transform="translate({w / 2}, {h + 34})">
					μ
				</text>
				<text
					class="axis-label"
					text-anchor="middle"
					transform="translate({-margin.left + 14}, {h / 2}) rotate(-90)"
				>
					Log-likelihood (relative)
				</text>
			</g>
		</svg>
	{/if}
</div>

<style>
	.chart {
		width: 100%;
		aspect-ratio: 1 / 0.55;
	}
	.chart svg {
		display: block;
	}
	.ref-curve {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
		opacity: 0.7;
	}
	.n-curve {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 2.5;
	}
	.anno {
		opacity: 0.35;
		transition: opacity 0.2s;
	}
	.anno.highlight {
		opacity: 1;
	}
	.guide {
		stroke: var(--muted);
		stroke-dasharray: 2 3;
	}
	.bracket line,
	.tangent {
		stroke: var(--heading);
		stroke-width: 1.5;
	}
	.anno.highlight .bracket line,
	.anno.highlight .tangent {
		stroke: #e17055;
		stroke-width: 2;
	}
	.anno-label {
		font-size: 11px;
		fill: var(--ink);
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 3px;
	}
	.pt-mle {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	.pt-null {
		fill: #e17055;
		stroke: var(--bg);
		stroke-width: 1.5;
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
</style>
