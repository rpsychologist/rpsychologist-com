<script lang="ts">
	// ℓ(μ | σ²) slice rotated: σ² runs up the y-axis, ℓ along x (old
	// LogLikPlotSigma.js). Carries the Newton-Raphson teaching visual — the
	// second-order Taylor approximation drawn per step (dash draw-in, then its
	// maximum fades in), which ℓ(σ²) is NOT equal to, unlike the μ slice.
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { format } from 'd3-format';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import Tex from '$lib/components/Tex.svelte';
	import { drag } from '$lib/viz/core/actions/drag';
	import {
		gradientAscentStep,
		hessSigma2Expected,
		logLikSum,
		quadraticApprox,
		scoreSigma2,
		SIGMA2_MAX,
		SIGMA2_MIN
	} from './model';
	import { defaults, type LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const margin = { top: 10, right: 20, bottom: 40, left: 55 };
	// Tall, narrow frame like the old right-column plot.
	const H_RATIO = 0.85;

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw * H_RATIO - margin.top - margin.bottom);

	const LL_MIN = -100;
	const LL_MAX = -20;
	const x = $derived(scaleLinear([LL_MIN, LL_MAX], [0, w]));
	const y = $derived(scaleLinear([SIGMA2_MIN, SIGMA2_MAX], [h, 0]));
	const xTicks = $derived(x.ticks(3));
	const yTicks = $derived(y.ticks(6));

	const pt = new Tween({ mu: defaults.mu, sigma2: defaults.sigma2 }, { duration: 0 });
	$effect(() => {
		pt.set(
			{ mu: model.p.mu, sigma2: model.p.sigma2 },
			{ duration: model.animating && !prefersReducedMotion.current ? 500 : 0 }
		);
	});

	const sample = $derived(model.p.sample);
	// sqrt-spaced σ² samples so the curve is dense where it bends (old d*d grid).
	const curve = $derived.by(() => {
		const mu = pt.current.mu;
		const start = 1;
		const end = Math.sqrt(SIGMA2_MAX);
		const step = (end - start) / 50;
		const pts: [number, number][] = [];
		for (let t = start; t <= end + 1e-9; t += step) {
			const s2 = t * t;
			pts.push([s2, logLikSum(sample, mu, s2)]);
		}
		return pts;
	});
	// Rotated line: data [σ², ℓ] → screen (x(ℓ), y(σ²)).
	const toPath = $derived(
		line<[number, number]>()
			.x((d) => x(d[1]))
			.y((d) => y(d[0]))
	);

	const px = $derived(x(logLikSum(sample, pt.current.mu, pt.current.sigma2)));
	const py = $derived(y(pt.current.sigma2));
	const deriv = $derived(scoreSigma2(sample, pt.current.mu, pt.current.sigma2));

	// Off the left of the ℓ window (dragging σ² far from the MLE): ℓ is below
	// the frame, so the point is shown as a left-arrow pinned to the axis.
	const offLeft = $derived(px < 0);
	const markerY = $derived(Math.max(0, Math.min(h, py)));

	// Tooltip clamped to the plot so it stays in-frame with the marker.
	const tipX = $derived(Math.max(0, Math.min(w, px)) + margin.left + 12);
	const tipY = $derived(markerY + margin.top);

	const tangent = $derived.by(() => {
		// ±Δσ² in data units through the point; slope dℓ/dσ² maps to screen dx.
		// The −Δσ² endpoint (x1=−dx) sits lower on screen, so y1 gets +dy.
		const dS2 = (SIGMA2_MAX - SIGMA2_MIN) / 8;
		const kx = w / (LL_MAX - LL_MIN);
		const ky = h / (SIGMA2_MAX - SIGMA2_MIN);
		return { dx: dS2 * deriv * kx, dy: dS2 * ky };
	});

	const gaNext = $derived.by(() => {
		if (model.p.algo !== 'gradientAscent') return null;
		const next = gradientAscentStep(model.sampleZ, model.muHat, model.sigma2Hat, {
			mu: model.p.mu,
			sigma2: model.p.sigma2
		}).next;
		return { sigma2: next.sigma2, ll: logLikSum(sample, model.p.mu, next.sigma2) };
	});

	// The Taylor approximation around the current σ² (expected information,
	// exactly like the old NewtonParabola) and where its maximum sits.
	const newton = $derived.by(() => {
		if (model.p.algo !== 'newtonRaphson') return null;
		const { mu, sigma2 } = pt.current;
		const ll = logLikSum(sample, mu, sigma2);
		const hess = hessSigma2Expected(sample.length, sigma2);
		const step = (SIGMA2_MAX - SIGMA2_MIN) / 50;
		const pts: [number, number][] = [];
		for (let t = SIGMA2_MIN; t <= SIGMA2_MAX + 1e-9; t += step)
			pts.push([t, quadraticApprox(t - sigma2, ll, deriv, hess)]);
		const maxS2 = sigma2 + deriv / -hess;
		const maxLL = quadraticApprox(maxS2 - sigma2, ll, deriv, hess);
		return { path: toPath(pts), maxS2, maxLL };
	});

	let dragStart = 0;
	const f2 = format('.2f');
</script>

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			width={cw}
			height={cw * H_RATIO}
			role="img"
			aria-label="Log-likelihood of the variance, holding the mean at {f2(model.p.mu)}"
		>
			<defs>
				<clipPath id="loglik-sigma-clip">
					<rect x="-10" y="-10" width={w + 20} height={h + 20} />
				</clipPath>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<g clip-path="url(#loglik-sigma-clip)">
					<path class="curve" d={toPath(curve)} />

					{#if newton}
						{#key model.count}
							<path class="newton draw-in" d={newton.path} pathLength="1000" />
							<g class="newton-max fade-in">
								<line
									class="next-line"
									x1={x(LL_MIN)}
									x2={x(newton.maxLL)}
									y1={y(newton.maxS2)}
									y2={y(newton.maxS2)}
								/>
								<circle class="next-point" r="5" cx={x(newton.maxLL)} cy={y(newton.maxS2)} />
							</g>
						{/key}
					{/if}
					{#if gaNext}
						<line
							class="next-line"
							x1={x(LL_MIN)}
							x2={x(gaNext.ll)}
							y1={y(gaNext.sigma2)}
							y2={y(gaNext.sigma2)}
						/>
						<circle class="next-point" r="5" cx={x(gaNext.ll)} cy={y(gaNext.sigma2)} />
					{/if}

					<g transform="translate({px}, {py})">
						<line class="deriv" x1={-tangent.dx} x2={tangent.dx} y1={tangent.dy} y2={-tangent.dy} />
					</g>
				</g>
				<!-- Marker: the draggable point, or a left-arrow at the axis when ℓ
				     has dropped below the frame. Both drive σ² by vertical drag. -->
				<g
					class="marker"
					transform="translate({offLeft ? 0 : px}, {markerY})"
					role="slider"
					aria-label="Drag to set the variance"
					aria-valuenow={model.p.sigma2}
					aria-valuemin={SIGMA2_MIN}
					aria-valuemax={SIGMA2_MAX}
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'ArrowDown') model.setSigma2(model.p.sigma2 - 10);
						else if (e.key === 'ArrowUp') model.setSigma2(model.p.sigma2 + 10);
					}}
					use:drag={{
						onstart: () => (dragStart = model.p.sigma2),
						ondrag: (e) =>
							model.setPoint({ mu: model.p.mu, sigma2: y.invert(y(dragStart) + e.totalY) }),
						onend: () => (model.immediate = false)
					}}
				>
					{#if offLeft}
						<path class="off-arrow" d="M11,-5 L11,5 L2,0 Z" />
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
					ℓ(μ = {f2(model.p.mu)}, σ²)
				</text>
				<text
					class="axis-label"
					text-anchor="middle"
					transform="translate({-margin.left + 14}, {h / 2}) rotate(-90)"
				>
					σ²
				</text>
			</g>
		</svg>
		<div class="deriv-tip" style="left: {tipX}px; top: {tipY}px">
			<Tex math={String.raw`\tfrac{\partial}{\partial \sigma^2}\ell =`} />
			{f2(deriv)}
		</div>
	{/if}
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 0.85;
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
	}
	/* Newton step choreography (old NewtonParabola): the parabola draws in over
	   500 ms, then its maximum marker fades in. Re-keyed per iteration. */
	.draw-in {
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
		animation: dash 0.5s 0.5s forwards;
	}
	.newton-max {
		opacity: 0;
	}
	.fade-in {
		animation: appear 0.5s 1.5s forwards;
	}
	@keyframes dash {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes appear {
		to {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.draw-in {
			animation: none;
			stroke-dashoffset: 0;
		}
		.fade-in {
			animation: none;
			opacity: 1;
		}
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
		transform: translate(0, -50%);
		padding: 0.15rem 0.5rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		color: var(--ink);
		white-space: nowrap;
		pointer-events: none;
	}
</style>
