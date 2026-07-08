<script lang="ts">
	// ℓ(μ | σ²) slice: the curve, a draggable point with its tangent (the
	// score), the active algorithm's overlay (gradient-ascent next step, or the
	// Newton quadratic — exact here, since ℓ is quadratic in μ), and the 0.2.0
	// likelihood-interval shading: the region where ℓ stays within
	// χ²₁(0.95)/2 ≈ 1.92 of the slice's maximum, with the Wald CI for
	// comparison. Ported from the old LogLikPlot.js.
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { format } from 'd3-format';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import Tex from '$lib/components/Tex.svelte';
	import { drag } from '$lib/viz/core/actions/drag';
	import {
		gradientAscentStep,
		likelihoodIntervalMu,
		LL_DROP_95,
		logLikSum,
		MU_MAX,
		MU_MIN,
		quadraticApprox,
		scoreMu,
		waldIntervalMu
	} from './model';
	import { defaults, type LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const margin = { top: 46, right: 20, bottom: 40, left: 55 };
	const ASPECT = 0.4;

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw * ASPECT - margin.top - margin.bottom);

	// Old fixed windows: μ over the frame, ℓ over [−100, −20].
	const LL_MIN = -100;
	const LL_MAX = -20;
	const x = $derived(scaleLinear([MU_MIN, MU_MAX], [0, w]));
	const y = $derived(scaleLinear([LL_MIN, LL_MAX], [h, 0]));
	const xTicks = $derived(x.ticks(8));
	const yTicks = $derived(y.ticks(4));

	// Tweened evaluation point: animates only during Newton runs (old spring
	// semantics — gradient ascent steps once per frame and must not lag).
	const pt = new Tween({ mu: defaults.mu, sigma2: defaults.sigma2 }, { duration: 0 });
	$effect(() => {
		const target = { mu: model.p.mu, sigma2: model.p.sigma2 };
		pt.set(target, {
			duration: model.animating && !prefersReducedMotion.current ? 500 : 0
		});
	});

	const sample = $derived(model.p.sample);
	// 51 curve samples over the frame at the tweened σ² (old genLogLikCurve).
	const curve = $derived.by(() => {
		const s2 = pt.current.sigma2;
		const step = (MU_MAX - MU_MIN) / 50;
		const pts: [number, number][] = [];
		for (let t = MU_MIN; t <= MU_MAX + 1e-9; t += step) pts.push([t, logLikSum(sample, t, s2)]);
		return pts;
	});
	const toPath = $derived(
		line<[number, number]>()
			.x((d) => x(d[0]))
			.y((d) => y(d[1]))
	);

	const px = $derived(x(pt.current.mu));
	const py = $derived(y(logLikSum(sample, pt.current.mu, pt.current.sigma2)));
	const deriv = $derived(scoreMu(sample.length, pt.current.mu, model.muHat, pt.current.sigma2));

	// Off the bottom of the ℓ window (dragging μ far out): ℓ(μ) is below the
	// frame, so the point is shown as a down-arrow pinned to the axis rather
	// than wandering below the chart. (ℓ never exceeds the top: its max is at
	// σ̂², already inside the window.)
	const offBottom = $derived(py > h);
	const markerX = $derived(Math.max(0, Math.min(w, px)));

	// Tooltip position, clamped to the plot so it stays in-frame with the marker.
	const tipX = $derived(markerX + margin.left);
	const tipY = $derived(Math.max(0, Math.min(h, py)) + margin.top - 14);

	// Tangent segment through the point: ±Δμ in data units, mapped to screen.
	// Screen y grows downward, so the left endpoint (lower ℓ when the score is
	// positive) gets +dy and the right endpoint −dy.
	const tangent = $derived.by(() => {
		const dMu = (MU_MAX - MU_MIN) / 8;
		const kx = w / (MU_MAX - MU_MIN);
		const ky = h / (LL_MAX - LL_MIN);
		return { dx: dMu * kx, dy: dMu * deriv * ky };
	});

	// Gradient-ascent preview: where the next step lands (old overlay).
	const gaNext = $derived.by(() => {
		if (model.p.algo !== 'gradientAscent') return null;
		const next = gradientAscentStep(model.sampleZ, model.muHat, model.sigma2Hat, {
			mu: model.p.mu,
			sigma2: model.p.sigma2
		}).next;
		return { mu: next.mu, ll: logLikSum(sample, next.mu, model.p.sigma2) };
	});

	// Newton quadratic around the current point — drawn like the old app even
	// though it coincides with the curve (ℓ is quadratic in μ; the FAQ notes it).
	const newtonPath = $derived.by(() => {
		if (model.p.algo !== 'newtonRaphson') return null;
		const { mu, sigma2 } = pt.current;
		const ll = logLikSum(sample, mu, sigma2);
		const hess = -sample.length / sigma2;
		const step = (MU_MAX - MU_MIN) / 50;
		const pts: [number, number][] = [];
		for (let t = MU_MIN; t <= MU_MAX + 1e-9; t += step)
			pts.push([t, quadraticApprox(t - mu, ll, deriv, hess)]);
		return toPath(pts);
	});

	// Likelihood interval on THIS slice at the current σ² vs the Wald CI (which
	// always uses σ̂²); they coincide exactly when σ² = σ̂².
	const li = $derived(likelihoodIntervalMu(model.muHat, pt.current.sigma2, sample.length));
	const wald = $derived(waldIntervalMu(model.muHat, model.sigma2Hat, sample.length));
	const dropLL = $derived(logLikSum(sample, model.muHat, pt.current.sigma2) - LL_DROP_95);

	let dragStart = 0;
	const f2 = format('.2f');
</script>

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			width={cw}
			height={cw * ASPECT}
			role="img"
			aria-label="Log-likelihood of the mean, holding the variance at {f2(model.p.sigma2)}"
		>
			<defs>
				<clipPath id="loglik-mu-clip">
					<rect x="0" y="-10" width={w} height={h + 10} />
				</clipPath>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<g clip-path="url(#loglik-mu-clip)">
					<!-- 95% likelihood-interval band (new in 0.2.0). -->
					<rect
						class="li-band"
						x={x(li[0])}
						y="0"
						width={Math.max(0, x(li[1]) - x(li[0]))}
						height={h}
					/>
					<line class="li-drop" x1="0" x2={w} y1={y(dropLL)} y2={y(dropLL)} />
					<text class="li-label" x={4} y={y(dropLL) - 5}> max ℓ − χ²₁(.95)/2 </text>

					<path class="curve" d={toPath(curve)} />

					{#if newtonPath}
						<path class="newton" d={newtonPath} />
					{/if}
					{#if gaNext}
						<line
							class="next-line"
							x1={x(gaNext.mu)}
							x2={x(gaNext.mu)}
							y1={y(LL_MIN)}
							y2={y(gaNext.ll)}
						/>
						<circle class="next-point" r="5" cx={x(gaNext.mu)} cy={y(gaNext.ll)} />
					{/if}

					<!-- Tangent (the score at the current μ) + draggable point. -->
					<g transform="translate({px}, {py})">
						<line class="deriv" x1={-tangent.dx} x2={tangent.dx} y1={tangent.dy} y2={-tangent.dy} />
					</g>
				</g>
				<!-- Marker: the draggable point, or a down-arrow at the axis when
				     ℓ(μ) has dropped below the frame. Both drive μ by horizontal drag. -->
				<g
					class="marker"
					transform="translate({markerX}, {offBottom ? h : py})"
					role="slider"
					aria-label="Drag to set the mean"
					aria-valuenow={model.p.mu}
					aria-valuemin={MU_MIN}
					aria-valuemax={MU_MAX}
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'ArrowLeft') model.setMu(model.p.mu - 1);
						else if (e.key === 'ArrowRight') model.setMu(model.p.mu + 1);
					}}
					use:drag={{
						onstart: () => (dragStart = model.p.mu),
						ondrag: (e) =>
							model.setPoint({ mu: x.invert(x(dragStart) + e.totalX), sigma2: model.p.sigma2 }),
						onend: () => (model.immediate = false)
					}}
				>
					{#if offBottom}
						<path class="off-arrow" d="M-5,-11 L5,-11 L0,-2 Z" />
					{:else}
						<circle class="param-point" r="6" />
					{/if}
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
							{t}
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
					ℓ(μ, σ² = {f2(model.p.sigma2)})
				</text>
			</g>
		</svg>
		<div class="deriv-tip" style="left: {tipX}px; top: {tipY}px">
			<Tex math={String.raw`\tfrac{\partial}{\partial \mu}\ell =`} />
			{f2(deriv)}
		</div>
	{/if}
</div>
<p class="interval-readout" data-testid="intervals">
	Likelihood interval (at current σ²): [{f2(li[0])}, {f2(li[1])}] · Wald 95% CI: [{f2(wald[0])},
	{f2(wald[1])}]
</p>

<style>
	.chart {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 0.4;
	}
	.chart svg {
		display: block;
	}
	.curve {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 2.5;
	}
	.newton {
		fill: none;
		stroke: #e17055;
		stroke-width: 1.75;
		stroke-dasharray: 4 3;
	}
	.next-line {
		stroke: var(--muted);
		stroke-dasharray: 2 3;
	}
	.next-point {
		fill: none;
		stroke: #e17055;
		stroke-width: 2;
	}
	.deriv {
		stroke: var(--heading);
		stroke-width: 1.5;
	}
	.marker {
		cursor: grab;
	}
	.marker:active {
		cursor: grabbing;
	}
	.param-point {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	.off-arrow {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1;
	}
	.li-band {
		fill: var(--viz-accent);
		opacity: 0.09;
	}
	.li-drop {
		stroke: var(--muted);
		stroke-dasharray: 5 4;
	}
	.li-label {
		font-size: 10px;
		fill: var(--muted);
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
	.deriv-tip {
		position: absolute;
		transform: translate(-50%, -100%);
		padding: 0.15rem 0.5rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		color: var(--ink);
		white-space: nowrap;
		pointer-events: none;
	}
	.interval-readout {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
</style>
