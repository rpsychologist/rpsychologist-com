<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { scaleLinear } from 'd3-scale';
	import { area } from 'd3-shape';
	import { format } from 'd3-format';
	import { normalPdf } from '$lib/stats/distributions';
	import { drag } from '../core/actions/drag';
	import type { CohendState } from './cohend.svelte';

	// Two equal-variance normal curves separated by Cohen's d, overlap shaded
	// solid. Proportions are dynamic and taken verbatim from the old Overlap.js:
	// the height is the rendered width times an aspect that switches 0.4 -> 0.6 on
	// narrow screens, so the bells stay legible on mobile. We measure the rendered
	// width (bind:clientWidth) and draw the SVG 1:1 at that size, so geometry and
	// text are at their intended px. The wrapper reserves height via CSS
	// aspect-ratio, so the chart drawing on hydration causes no layout shift.
	interface Props {
		model: CohendState;
		/** The <svg> node, exposed for SVG export. */
		svg?: SVGSVGElement;
	}

	let { model, svg = $bindable() }: Props = $props();

	const margin = { top: 70, right: 20, bottom: 35, left: 20 };

	let cw = $state(0);
	const aspect = $derived(cw < 450 ? 0.6 : 0.4);
	const totalH = $derived(cw * aspect);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(totalH - margin.top - margin.bottom);

	const m1 = new Tween(model.p.M1, { duration: 400, easing: cubicOut });
	$effect(() => {
		m1.set(model.p.M1, { duration: model.immediate ? 0 : 400 });
	});

	// Horizontal pan offset (data units), reset on double-click.
	let pan = $state(0);

	// Frozen domain (M0 - 3·SD to M1 + 3·SD), recomputed only on init/rescale —
	// not on every d change. This is what keeps the control distribution fixed on
	// screen while the treatment curve slides. `untrack` reads the params without
	// subscribing, so the domain only updates when `rescaleToken` bumps.
	const domain0 = $derived.by(() => {
		model.rescaleToken;
		return untrack(
			() => [model.p.M0 - 3 * model.p.SD, model.p.M1 + 3 * model.p.SD] as [number, number]
		);
	});
	const x = $derived(
		scaleLinear()
			.domain([domain0[0] - pan, domain0[1] - pan])
			.range([0, w])
	);
	const yMax = $derived(normalPdf(model.p.M0, model.p.M0, model.p.SD));
	const y = $derived(scaleLinear().domain([0, yMax]).range([0, h]));

	// One bell path (the control distribution), recomputed only when its inputs
	// change — crucially NOT during a d drag, when M0, SD and the scales are all
	// stable. The treatment curve is this same path shifted by `dx`, and the
	// overlap is this same path clipped to the treatment's shape (the old viz's
	// trick). So a drag updates only a transform, never re-runs the pdf math.
	const bellPath = $derived.by(() => {
		const sd = model.p.SD;
		const m0 = model.p.M0;
		const a = m0 - 5 * sd;
		const b = m0 + 5 * sd;
		const n = 160;
		const pts = new Array<number>(n + 1);
		for (let i = 0; i <= n; i++) pts[i] = a + ((b - a) * i) / n;
		return (
			area<number>()
				.x((xv) => x(xv))
				.y0(h)
				.y1((xv) => h - y(normalPdf(xv, m0, sd)))(pts) ?? ''
		);
	});

	// Horizontal shift of the treatment curve, in screen px (tweened, cheap).
	const dx = $derived(x(m1.current) - x(model.p.M0));

	const ticks = $derived(x.ticks(10));
	const fmtTick = format('.0f');
	const fmtD = format('.2f');
	const fmtDiff = format('.1f');

	const xM0 = $derived(x(model.p.M0));
	const xM1 = $derived(x(m1.current));
	const cx = $derived((xM0 + xM1) / 2);
	// Drive the d and Diff labels off the tweened mean so the numbers count up in
	// step with the curve (matching the old react-spring aniProps.d / .x labels).
	const diff = $derived(m1.current - model.p.M0);
	const dDisplay = $derived(diff / model.p.SD);

	function onDrag(e: { dx: number }) {
		const unitsPerPx = (domain0[1] - domain0[0]) / w;
		pan += e.dx * unitsPerPx;
	}
</script>

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			bind:this={svg}
			width={cw}
			height={totalH}
			viewBox="0 0 {cw} {totalH}"
			role="img"
			aria-label="Two overlapping normal distributions separated by Cohen's d"
			use:drag={{
				onstart: () => (model.immediate = true),
				ondrag: onDrag,
				onend: () => (model.immediate = false)
			}}
			ondblclick={() => {
				model.rescale();
				pan = 0;
			}}
		>
			<defs>
				<marker
					id="cohend-arrow"
					viewBox="0 0 10 10"
					refX="8"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
				</marker>
				<clipPath id="cohend-clip">
					<rect x="0" y="0" width={w} height={h} />
				</clipPath>
				<!-- the treatment bell's shape, used to clip the overlap region -->
				<clipPath id="cohend-treat-clip">
					<path d={bellPath} transform="translate({dx}, 0)" />
				</clipPath>
			</defs>

			<g transform="translate({margin.left}, {margin.top})">
				<!-- curves clipped to the plot box so a pan trims cleanly. All three
				     reuse the one bell path: control as-is, treatment shifted by dx,
				     overlap = control clipped to the treatment shape. -->
				<g clip-path="url(#cohend-clip)">
					<path d={bellPath} fill={model.p.colorDist1} />
					<path d={bellPath} fill={model.p.colorDist2} transform="translate({dx}, 0)" />
					<path d={bellPath} fill={model.p.colorOverlap} clip-path="url(#cohend-treat-clip)" />
					<line x1={xM0} x2={xM0} y1={h - y(yMax)} y2={h} class="mean" />
					<line x1={xM1} x2={xM1} y1={h - y(yMax)} y2={h} class="mean" />
				</g>

				<!-- d label + unstandardized difference -->
				<text x={cx} y={-50} class="d-label" text-anchor="middle" dominant-baseline="central">
					Cohen's d: {fmtD(dDisplay)}
				</text>
				<text x={cx} y={-25} class="diff-label" text-anchor="middle" dominant-baseline="central">
					(Diff: {fmtDiff(diff)})
				</text>

				<!-- group labels + difference arrow between the means -->
				<text x={xM0 - 6} y={-10} class="grp" text-anchor="end" dominant-baseline="central">
					{model.p.muZeroLabel}
				</text>
				<text x={xM1 + 6} y={-10} class="grp" text-anchor="start" dominant-baseline="central">
					{model.p.muOneLabel}
				</text>
				{#if Math.abs(xM1 - xM0) > 2}
					<line
						x1={xM0}
						x2={xM1}
						y1={-10}
						y2={-10}
						class="arrow"
						marker-start="url(#cohend-arrow)"
						marker-end="url(#cohend-arrow)"
					/>
				{/if}

				{#if model.p.xLabel}
					<text x={w / 2} y={h + margin.bottom - 2.5} class="axis-label" text-anchor="middle">
						{model.p.xLabel}
					</text>
				{/if}
			</g>

			<!-- axis -->
			<g transform="translate({margin.left}, {margin.top + h})">
				<line x1="0" x2={w} y1="0" y2="0" class="axis" />
				{#each ticks as t (t)}
					<line x1={x(t)} x2={x(t)} y1="0" y2="5" class="axis" />
					<text x={x(t)} y="18" class="tick" text-anchor="middle">{fmtTick(t)}</text>
				{/each}
			</g>
		</svg>
	{/if}
</div>

<style>
	/* Reserve the chart's height before JS measures it (height = width * aspect),
	   so the chart drawing on hydration produces no layout shift. The aspect
	   switches on narrow screens, matching the old 0.4 / 0.6 split. */
	.chart {
		width: 100%;
		aspect-ratio: 1 / 0.4;
	}
	@media (max-width: 28rem) {
		.chart {
			aspect-ratio: 1 / 0.6;
		}
	}
	.chart svg {
		display: block;
		touch-action: none;
		cursor: grab;
	}
	.chart svg:active {
		cursor: grabbing;
	}
	.axis {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.mean {
		stroke: var(--bg);
		stroke-width: 1;
		stroke-dasharray: 4 3;
		opacity: 0.7;
	}
	.arrow {
		stroke: var(--muted);
		stroke-width: 1.5;
	}
	.tick {
		fill: var(--muted);
		font-size: 12px;
	}
	.d-label {
		fill: var(--heading);
		font-size: 24px;
		font-weight: 700;
	}
	.diff-label {
		fill: var(--muted);
		font-size: 15px;
	}
	.grp {
		fill: var(--ink);
		font-size: 15px;
	}
	.axis-label {
		fill: var(--ink);
		font-size: 15px;
		font-weight: 600;
	}
</style>
