<script lang="ts">
	// The inference figure, at the fixed estimates for the reference n = 10
	// (gray, dashed) and the hypothetical slider n. Two curves per n matter:
	// the profile ℓₚ(μ) (σ² re-estimated at every μ — what the LR and score
	// tests use) and the slice ℓ(μ, σ̂²), which is the profile's quadratic
	// approximation at the peak (what the Wald test uses). The test geometry
	// (after Buse, 1982) sits on the curve each test actually reads, so the
	// gap between the curves is the disagreement between the tests.
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import {
		LL_DROP_95,
		MU_MAX,
		MU_MIN,
		profileIntervalMu,
		relLogLik,
		relProfileMu,
		waldIntervalMu
	} from './model';
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
	// The null point on the profile: its drop is ½·LR, and its slope is the
	// score at σ̂₀² (envelope theorem), so the tangent is the score test's.
	const llNull = $derived(relProfileMu(model.p.n, model.muHat, model.p.muNull, model.sigma2Hat));
	const llNullSlice = $derived(relLogLik(model.p.n, model.muHat, model.p.muNull, model.sigma2Hat));
	const slope = $derived(model.scoreAtNull);

	// Frame on the reference profile (with headroom), so changing n narrows
	// the curves inside a stable window; it only deepens when the active
	// test's null point would leave it. The slice may plunge out of frame —
	// far from the peak the quadratic stops tracking the profile.
	const yMin = $derived(
		1.15 *
			Math.min(
				relProfileMu(N_REF, model.muHat, MU_MIN, model.sigma2Hat),
				relProfileMu(N_REF, model.muHat, MU_MAX, model.sigma2Hat),
				model.p.test === 'wald' ? llNullSlice : llNull
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
	const curveOf = (f: typeof relLogLik, n: number) => {
		const step = (MU_MAX - MU_MIN) / 100;
		const pts: [number, number][] = [];
		for (let t = MU_MIN; t <= MU_MAX + 1e-9; t += step)
			pts.push([t, f(n, model.muHat, t, model.sigma2Hat)]);
		return pts;
	};
	const refCurve = $derived(curveOf(relProfileMu, N_REF));
	const nCurve = $derived(curveOf(relProfileMu, model.p.n));
	const sliceCurve = $derived(curveOf(relLogLik, model.p.n));

	// 95% intervals at the slider n: each curve's 1.92 drop. The profile's is
	// the likelihood interval (the LR test inverted), the slice's the Wald CI.
	const li = $derived(profileIntervalMu(model.muHat, model.sigma2Hat, model.p.n));
	const wald = $derived(waldIntervalMu(model.muHat, model.sigma2Hat, model.p.n));
	const f2 = format('.2f');

	const test = $derived(model.p.test);
	const fTick = format('~f');

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

<ul class="legend">
	<li>
		<span class="sw profile"></span>profile <Tex math={String.raw`\ell_p(\mu)`} />, n = {model.p.n}
	</li>
	<li>
		<span class="sw slice"></span>slice <Tex math={String.raw`\ell(\mu, \hat\sigma^2)`} />: its
		quadratic at the peak
	</li>
	{#if model.p.n !== N_REF}<li><span class="sw ref"></span>profile, n = 10</li>{/if}
</ul>
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
					<g class="intervals">
						<line class="cutoff" x1="0" x2={w} y1={y(-LL_DROP_95)} y2={y(-LL_DROP_95)} />
						<line
							class="li-bar"
							x1={x(li[0])}
							x2={x(li[1])}
							y1={y(-LL_DROP_95)}
							y2={y(-LL_DROP_95)}
						/>
						<line
							class="wald-bar"
							x1={x(wald[0])}
							x2={x(wald[1])}
							y1={y(-LL_DROP_95) + 7}
							y2={y(-LL_DROP_95) + 7}
						/>
					</g>
					<path class="ref-curve" d={toPath(refCurve)} />
					<path class="slice-curve" d={toPath(sliceCurve)} />
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
						<circle class="pt-wald" r="4" cx={x(model.p.muNull)} cy={y(llNullSlice)} />
					</g>

					<!-- Score: the slope of the tangent at the null. -->
					<g class="anno anno-score" class:highlight={test === 'score'} data-testid="anno-score">
						<line class="tangent" x1={tangent.x1} x2={tangent.x2} y1={tangent.y1} y2={tangent.y2} />
						<text
							class="anno-label"
							x={Math.max(tangent.x1 - 6, 4)}
							y={tangent.y1}
							text-anchor="end"
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
							{fTick(t)}
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
<p class="interval-readout" data-testid="intervals">
	95% intervals at n = {model.p.n}: likelihood (profile) [{f2(li[0])}, {f2(li[1])}]; Wald [{f2(
		wald[0]
	)}, {f2(wald[1])}]. Each is where its curve drops 1.92 below the peak.
</p>

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
		stroke: var(--marginal);
		stroke-width: 2.5;
	}
	.slice-curve {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 1.5;
	}
	.cutoff {
		stroke: var(--muted);
		stroke-dasharray: 4 3;
		opacity: 0.7;
	}
	.li-bar {
		stroke: var(--marginal);
		stroke-width: 6;
		opacity: 0.6;
	}
	.wald-bar {
		stroke: var(--viz-accent);
		stroke-width: 3;
		opacity: 0.6;
	}
	.interval-readout {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0 0 0.5rem;
		padding: 0;
		list-style: none;
		font-size: 0.8rem;
		color: var(--ink);
	}
	.sw {
		display: inline-block;
		width: 1.5rem;
		margin-right: 0.4rem;
		vertical-align: middle;
		border-top: 2.5px solid var(--marginal);
	}
	.sw.slice {
		border-top: 1.5px solid var(--viz-accent);
	}
	.sw.ref {
		border-top: 1.5px dashed var(--muted);
	}
	.pt-wald {
		fill: var(--bg);
		stroke: var(--viz-accent);
		stroke-width: 1.5;
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
