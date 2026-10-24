<script lang="ts">
	// 2D contour of the joint log-likelihood over (μ, σ²): filled level sets,
	// crosshairs + a draggable point at the current parameters, and the
	// optimizer's path. Ported from the old ContourLogLik.js; d3-geo's geoPath
	// is replaced by contourRingsToPath, and the old light-only white→teal ramp
	// by an accent fill-opacity ramp over the panel background so dark mode
	// works without a theme watcher.
	import { scaleLinear } from 'd3-scale';
	import { range } from 'd3-array';
	import { contours } from 'd3-contour';
	import { format } from 'd3-format';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { drag } from '$lib/viz/core/actions/drag';
	import { contourRingsToPath, MU_MAX, MU_MIN, SIGMA2_MAX, SIGMA2_MIN } from './model';
	import { defaults, type LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const margin = { top: 10, right: 20, bottom: 40, left: 55 };
	const H_RATIO = 0.75;

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw * H_RATIO - margin.top - margin.bottom);

	const x = $derived(scaleLinear([MU_MIN, MU_MAX], [0, w]));
	const y = $derived(scaleLinear([SIGMA2_MIN, SIGMA2_MAX], [h, 0]));
	const xTicks = $derived(x.ticks(8));
	const yTicks = $derived(y.ticks(6));

	// Old thresholds: 100 levels over the fixed ℓ window.
	const LL_MIN = -300;
	const LL_MAX = -20;
	const thresholds = range(LL_MIN, LL_MAX, (LL_MAX - LL_MIN) / 100);

	// Level polygons in grid-index space; recompute only on sample change.
	const levels = $derived.by(() => {
		const g = model.grid;
		return contours().size([g.cols, g.rows]).thresholds(thresholds)(
			g.values as unknown as number[]
		);
	});

	// Grid index → screen (the affine map the old geoPath transform did).
	// Fills must be OPAQUE and painted in ascending threshold order: each
	// level's polygon contains every higher region, so higher levels paint
	// over lower ones — translucent fills would stack and saturate. The ramp
	// is the old teal→white one (far → peak), rebuilt as an accent→panel
	// color-mix so it adapts to dark mode; same clamp at ℓ = −100.
	const paths = $derived.by(() => {
		const g = model.grid;
		const sx = (gx: number) => x(g.muMin + gx * g.muStep);
		const sy = (gy: number) => y(g.sigma2Min + gy * g.sigma2Step);
		const accentPct = scaleLinear([-100, model.grid.max], [60, 0]).clamp(true);
		return levels.map((c) => ({
			d: contourRingsToPath(c.coordinates as number[][][][], sx, sy),
			pct: Math.round(accentPct(c.value))
		}));
	});

	const pt = new Tween({ mu: defaults.mu, sigma2: defaults.sigma2 }, { duration: 0 });
	$effect(() => {
		pt.set(
			{ mu: model.p.mu, sigma2: model.p.sigma2 },
			{ duration: model.animating && !prefersReducedMotion.current ? 500 : 0 }
		);
	});

	const px = $derived(x(pt.current.mu));
	const py = $derived(y(pt.current.sigma2));

	const trail = $derived(model.path.map((p) => `${x(p.mu)},${y(p.sigma2)}`).join(' '));

	// Ghost of the next iteration (hidden while running): a dashed arrow from
	// the point to where the step lands. An overshooting step runs off the
	// clipped frame, so its dot is dropped and the arrow just leaves.
	const ghost = $derived.by(() => {
		const nx = model.nextStep;
		if (!nx || model.running) return null;
		const x1 = x(model.p.mu);
		const y1 = y(model.p.sigma2);
		const x2 = x(nx.mu);
		const y2 = y(nx.sigma2);
		const len = Math.hypot(x2 - x1, y2 - y1);
		if (len < 1) return null;
		const inside = x2 >= 0 && x2 <= w && y2 >= 0 && y2 <= h;
		// Arrowhead at the landing point, or where the step crosses the frame.
		const tEnd = inside
			? 1
			: Math.min(
					...[
						x2 > w ? (w - x1) / (x2 - x1) : x2 < 0 ? -x1 / (x2 - x1) : 1,
						y2 > h ? (h - y1) / (y2 - y1) : y2 < 0 ? -y1 / (y2 - y1) : 1
					]
				);
		const ex = x1 + (x2 - x1) * tEnd;
		const ey = y1 + (y2 - y1) * tEnd;
		const ux = (x2 - x1) / len;
		const uy = (y2 - y1) / len;
		const H = 9;
		const A = 0.4;
		const c = Math.cos(A);
		const sn = Math.sin(A);
		const head = `M${ex - H * (ux * c - uy * sn)},${ey - H * (ux * sn + uy * c)}L${ex},${ey}L${ex - H * (ux * c + uy * sn)},${ey - H * (-ux * sn + uy * c)}`;
		return { x1, y1, ex, ey, head, dot: inside ? { x: x2, y: y2 } : null };
	});

	let dragStart = { mu: 0, sigma2: 0 };
	const f2 = format('.2f');
</script>

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			width={cw}
			height={cw * H_RATIO}
			role="img"
			aria-label="Contour plot of the joint log-likelihood over the mean and variance, with the optimizer path"
		>
			<defs>
				<clipPath id="contour-clip">
					<rect x="0" y="0" width={w} height={h} />
				</clipPath>
			</defs>
			<g transform="translate({margin.left}, {margin.top})">
				<rect class="bed" x="0" y="0" width={w} height={h} />
				<g clip-path="url(#contour-clip)">
					{#each paths as p, i (i)}
						<path
							class="level"
							d={p.d}
							style="fill: color-mix(in srgb, var(--viz-accent) {p.pct}%, var(--panel))"
							class:major={i % 5 === 0}
						/>
					{/each}

					{#if trail}
						<polyline class="trail" points={trail} />
					{/if}

					{#if ghost}
						<g class="ghost">
							<line x1={ghost.x1} y1={ghost.y1} x2={ghost.ex} y2={ghost.ey} />
							<path d={ghost.head} />
							{#if ghost.dot}<circle r="5" cx={ghost.dot.x} cy={ghost.dot.y} />{/if}
						</g>
					{/if}

					<line class="crosshair" x1={px} x2={px} y1="0" y2={h} />
					<line class="crosshair" x1="0" x2={w} y1={py} y2={py} />
				</g>
				<circle
					class="param-point"
					r="6"
					cx={px}
					cy={py}
					role="slider"
					aria-label="Drag to set the mean and variance together"
					aria-valuenow={model.p.mu}
					aria-valuetext="mean {f2(model.p.mu)}, variance {f2(model.p.sigma2)}"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'ArrowLeft') model.setMu(model.p.mu - 1);
						else if (e.key === 'ArrowRight') model.setMu(model.p.mu + 1);
						else if (e.key === 'ArrowDown') model.setSigma2(model.p.sigma2 - 10);
						else if (e.key === 'ArrowUp') model.setSigma2(model.p.sigma2 + 10);
					}}
					use:drag={{
						onstart: () => (dragStart = { mu: model.p.mu, sigma2: model.p.sigma2 }),
						ondrag: (e) =>
							model.setPoint({
								mu: x.invert(x(dragStart.mu) + e.totalX),
								sigma2: y.invert(y(dragStart.sigma2) + e.totalY)
							}),
						onend: () => (model.immediate = false)
					}}
				/>

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
					σ²
				</text>
			</g>
		</svg>
	{/if}
</div>

<style>
	.chart {
		width: 100%;
		aspect-ratio: 1 / 0.75;
	}
	.chart svg {
		display: block;
	}
	.bed {
		fill: var(--panel);
	}
	.level {
		stroke: var(--viz-accent);
		stroke-opacity: 0.12;
	}
	.level.major {
		stroke-opacity: 0.35;
	}
	.trail {
		fill: none;
		stroke: #e17055;
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.crosshair {
		stroke: var(--muted);
		stroke-dasharray: 2 3;
		opacity: 0.7;
	}
	.ghost line,
	.ghost path {
		fill: none;
		stroke: #e17055;
		stroke-width: 2;
		stroke-dasharray: 5 4;
		opacity: 0.85;
	}
	.ghost path {
		stroke-dasharray: none;
	}
	.ghost circle {
		fill: var(--bg);
		stroke: #e17055;
		stroke-width: 2;
		stroke-dasharray: 3 2;
	}
	.param-point {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1.5;
		cursor: grab;
	}
	.param-point:active {
		cursor: grabbing;
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
