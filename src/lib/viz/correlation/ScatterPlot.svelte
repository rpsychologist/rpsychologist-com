<script lang="ts">
	import { scaleLinear, scaleBand } from 'd3-scale';
	import { drag } from '../core/actions/drag';
	import { chi2Quantile2, type Point } from './model';
	import type { CorrelationState } from './correlation.svelte';

	// The scatter/slope chart, ported from the old ScatterPlot.js. Square
	// (height = width), margins verbatim. Point movement is animated by a CSS
	// transition on the transform attribute (the old app's approach), suppressed
	// while `model.immediate`; the residual/slope lines animate the same way via
	// scale/skew transform tricks, so dragging never re-runs any path math.
	interface Props {
		model: CorrelationState;
		/** The <svg> node, exposed for SVG/PNG export. */
		svg?: SVGSVGElement;
	}

	let { model, svg = $bindable() }: Props = $props();

	const margin = { top: 20, right: 20, bottom: 45, left: 60 };
	// Old slope-chart condition labels; state fields there but never editable.
	const COND_A = 'Pre';
	const COND_B = 'Post';

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw - margin.top - margin.bottom); // aspect 1 (square)

	const slope = $derived(model.p.plotType === 'slope');

	const x = $derived(scaleLinear().domain([model.p.xMin, model.p.xMax]).range([0, w]));
	const y = $derived(scaleLinear().domain([model.p.yMin, model.p.yMax]).range([h, 0]));
	const xBand = $derived(scaleBand<string>().domain([COND_A, COND_B]).range([0, w]));
	const bw = $derived(xBand.bandwidth());

	const xTicks = $derived(x.ticks(10));
	const yTicks = $derived(y.ticks(10));
	const fmtX = $derived(x.tickFormat(10));
	const fmtY = $derived(y.tickFormat(10));

	// Fade the slope lines in and slide the Post points over from their scatter
	// positions when slope mode mounts (the old SlopeChart's `show` timeout).
	let slopeShown = $state(false);
	$effect(() => {
		if (!slope) {
			slopeShown = false;
			return;
		}
		const t = setTimeout(() => (slopeShown = true), 0);
		return () => clearTimeout(t);
	});

	const canDragPoints = $derived(model.p.showPointEdit && model.p.pointEdit === 'drag');
	const canDelete = $derived(model.p.showPointEdit && model.p.pointEdit === 'delete');
	const canAdd = $derived(model.p.showPointEdit && model.p.pointEdit === 'add');

	const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

	// Point drags accumulate per move from the current value (equivalent to the
	// old memo + total-movement form, since state updates between moves).
	// cond: 'xy' = free scatter drag; 'a'/'b' = vertical-only drags of the
	// Pre (data x) / Post (data y) value in slope mode.
	function dragPoint(i: number, dx: number, dy: number, cond: 'xy' | 'a' | 'b') {
		const [px, py] = model.p.data[i];
		const { xMin, xMax, yMin, yMax } = model.p;
		let next: Point;
		if (cond === 'a') {
			next = [clamp(y.invert(y(px) + dy), yMin, yMax), py];
		} else if (cond === 'b') {
			next = [px, clamp(y.invert(y(py) + dy), yMin, yMax)];
		} else {
			next = [clamp(x.invert(x(px) + dx), xMin, xMax), clamp(y.invert(y(py) + dy), yMin, yMax)];
		}
		model.dragPoint(i, next);
	}

	// One svg-level handler for delete / ellipse-select / add (the old app also
	// let these bubble to the svg). Delegation instead of per-element handlers
	// keeps the interactive role on the svg alone (a11y: no clickable <circle>s).
	function onSvgPointerDown(e: PointerEvent) {
		const target = e.target as Element;
		if (canDelete) {
			const i = target.getAttribute('data-i');
			if (i !== null) {
				model.deletePoint(Number(i));
				return;
			}
		}
		const level = target.getAttribute('data-level');
		if (level !== null) {
			toggleEllipse(Number(level));
			return;
		}
		if (!canAdd) return;
		// The svg draws 1:1 at its rendered size (no viewBox scaling), so offset
		// coordinates map straight through the margin translate — no CTM math.
		const py = y.invert(e.offsetY - margin.top);
		const px = slope ? py : x.invert(e.offsetX - margin.left);
		model.addPoint([px, py]);
	}

	// Ellipse selection is view state, not model state (old local useState).
	// Only Add mode blocks it (a click there places a point); Drag/Delete act on
	// circles alone, so ellipse clicks are unambiguous. The old app disabled
	// selection during any edit mode — relaxation approved 2026-07-04.
	let ellipseLevel = $state<number | null>(null);
	function toggleEllipse(level: number) {
		if (canAdd) return;
		ellipseLevel = ellipseLevel === level ? null : level;
	}
	const ELLIPSE_LEVELS = [0.99, 0.95, 0.8, 0.5]; // painted large -> small

	// Regression line (slope mode: the mean(x) -> mean(y) segment), positioned
	// entirely via transform (translate + skewY) like the residual/slope lines:
	// bare x/y attributes don't transition, so they'd jump on parameter changes
	// while the points glide. Slope mode uses band left edges, not centers: the
	// group this renders in already translates by bw/2 (same as the points).
	const reg = $derived.by(() => {
		if (!model.stats) return null;
		const { intercept: b0, slope: b1, muHatNewX, muHatNewY } = model.stats;
		const { xMin, xMax } = model.p;
		if (slope) {
			return {
				x0: xBand(COND_A)!,
				y0: y(muHatNewX),
				len: xBand(COND_B)! - xBand(COND_A)!,
				dy: y(muHatNewY) - y(muHatNewX)
			};
		}
		return {
			x0: x(xMin),
			y0: y(b0 + xMin * b1),
			len: x(xMax) - x(xMin),
			dy: y(b0 + xMax * b1) - y(b0 + xMin * b1)
		};
	});
</script>

{#snippet ellipse(level: number)}
	{@const s = model.stats!}
	{@const chi = chi2Quantile2(level)}
	{@const sx = x(0) - x(s.sigmaHatNewX * Math.sqrt(chi))}
	{@const sy = y(0) - y(s.sigmaHatNewY * Math.sqrt(chi))}
	<g transform="translate({x(s.muHatNewX)}, {y(s.muHatNewY)}) scale({sx}, {sy})">
		<ellipse
			class="ellipse"
			class:selected={ellipseLevel === level}
			class:clickable={!canAdd}
			data-level={level}
			transform="rotate(45)"
			cx="0"
			cy="0"
			vector-effect="non-scaling-stroke"
			rx={Math.sqrt(1 + s.cor)}
			ry={Math.sqrt(1 - s.cor)}
		/>
	</g>
	{#if level === 0.5}
		<!-- Major/minor axis lines, drawn at the .99 ellipse's extent (the old
		     code's hard-coded 9.21034 = chi2(.99, 2)). Always rotate(45): the
		     principal axes of the (SD-scaled) fit are the diagonals for every
		     nonzero r, and at r = 0 (a circle) the direction is arbitrary — the
		     old app's axis-aligned special case there made the cross snap
		     between r = 0 and r = ±0.01. Improvement over the old app. -->
		{@const sx99 = x(0) - x(s.sigmaHatNewX * Math.sqrt(9.21034))}
		{@const sy99 = y(0) - y(s.sigmaHatNewY * Math.sqrt(9.21034))}
		<g transform="translate({x(s.muHatNewX)}, {y(s.muHatNewY)}) scale({sx99}, {sy99})">
			<line
				class="ellipse-axis major"
				class:hot={ellipseLevel !== null}
				transform="rotate(45)"
				vector-effect="non-scaling-stroke"
				x1={-Math.sqrt(1 + s.cor)}
				x2={Math.sqrt(1 + s.cor)}
				y1="0"
				y2="0"
			/>
			<line
				class="ellipse-axis minor"
				class:hot={ellipseLevel !== null}
				transform="rotate(45)"
				vector-effect="non-scaling-stroke"
				x1="0"
				x2="0"
				y1={-Math.sqrt(1 - s.cor)}
				y2={Math.sqrt(1 - s.cor)}
			/>
		</g>
	{/if}
{/snippet}

{#snippet circle(i: number, xVal: number, yVal: number, cond: 'xy' | 'a' | 'b')}
	<circle
		class="point"
		class:no-transition={model.immediate}
		class:draggable={canDragPoints}
		class:deletable={canDelete}
		style:fill={model.p.color}
		style:fill-opacity={model.p.colorAlpha}
		data-i={i}
		transform="translate({xVal}, {yVal})"
		r="5"
		cx="0"
		cy="0"
		use:drag={{
			ondrag: (e) => {
				if (canDragPoints) dragPoint(i, e.dx, e.dy, cond);
			},
			onend: () => (model.immediate = false)
		}}
	/>
{/snippet}

<div class="chart" bind:clientWidth={cw}>
	{#if w > 0}
		<svg
			bind:this={svg}
			width={cw}
			height={cw}
			viewBox="0 0 {cw} {cw}"
			class:adding={canAdd}
			role="img"
			aria-label="Scatter plot of {model.p.n} points with correlation {model.stats
				? model.stats.cor.toFixed(2)
				: '—'}"
			onpointerdown={onSvgPointerDown}
		>
			<defs>
				<clipPath id="correlation-clip">
					<rect x="0" y="-10" width={w} height={h + 10} />
				</clipPath>
			</defs>

			<g transform="translate({margin.left}, {margin.top})">
				<g clip-path="url(#correlation-clip)">
					<g transform={slope ? `translate(${bw / 2}, 0)` : undefined}>
						{#if model.stats && model.p.ellipses && !slope}
							{#each ELLIPSE_LEVELS as level (level)}
								{@render ellipse(level)}
							{/each}
						{/if}

						{#if model.p.regressionLine && reg}
							<line
								class="reg"
								class:no-transition={model.immediate}
								x1="0"
								x2={reg.len}
								y1="0"
								y2="0"
								transform="translate({reg.x0}, {reg.y0}) skewY({(Math.atan(reg.dy / reg.len) *
									180) /
									Math.PI})"
							/>
						{/if}

						{#each model.p.data as [px, py], i (i)}
							{#if model.p.residuals && !slope && model.stats}
								<!-- Unit line scaled to the residual so the CSS transform
								     transition animates it (old app's trick). -->
								<line
									class="residual"
									class:no-transition={model.immediate}
									x1="0"
									x2="0"
									y1="0"
									y2="1"
									transform="translate({x(px)}, {y(py)}) scale(1 {y(
										model.stats.intercept + model.stats.slope * px
									) - y(py)})"
								/>
							{/if}
							<!-- Primary circle, rendered in BOTH modes so the node persists
							     across the toggle and its transform transition slides it
							     to/from the Pre column (the old app kept ScatterPoints
							     mounted with stable keys for exactly this). In slope mode
							     it is the Pre point; vertical drag edits the data x value. -->
							{@render circle(
								i,
								slope ? xBand(COND_A)! : x(px),
								slope ? y(px) : y(py),
								slope ? 'a' : 'xy'
							)}
							{#if slope}
								<!-- Post point: holds its scatter x until shown, so entering
								     slope mode slides it over (old SlopeChart `show`). -->
								{@render circle(i, slopeShown ? xBand(COND_B)! : x(px), y(py), 'b')}
								<!-- Vertical position lives in the transform, not y1/y2: the
								     translate + skew transition as one, so a Mean/SD change
								     glides with the points instead of jumping. -->
								<line
									class="slope-line"
									class:hidden={!slopeShown}
									class:no-transition={model.immediate}
									x1={xBand(COND_A)}
									x2={xBand(COND_B)}
									y1="0"
									y2="0"
									transform="translate(0, {y(px)}) skewY({(Math.atan((y(py) - y(px)) / bw) * 180) /
										Math.PI})"
								/>
							{/if}
						{/each}
					</g>
				</g>

				{#if model.p.ellipses && !slope && ellipseLevel !== null}
					<text class="ellipse-label" text-anchor="middle" transform="translate({w / 2}, 0)">
						Ellipse probability: {ellipseLevel}
					</text>
				{/if}

				<!-- axes -->
				<g transform="translate(0, {h})">
					<line x1="0" x2={w} y1="0" y2="0" class="axis" />
					{#if slope}
						{#each [COND_A, COND_B] as cond (cond)}
							<line
								x1={xBand(cond)! + bw / 2}
								x2={xBand(cond)! + bw / 2}
								y1="0"
								y2="6"
								class="axis"
							/>
							<text x={xBand(cond)! + bw / 2} y="20" class="tick" text-anchor="middle">{cond}</text>
						{/each}
					{:else}
						{#each xTicks as t (t)}
							<line x1={x(t)} x2={x(t)} y1="0" y2="6" class="axis" />
							<text x={x(t)} y="20" class="tick" text-anchor="middle">{fmtX(t)}</text>
						{/each}
					{/if}
				</g>
				<g>
					<line x1="0" x2="0" y1="0" y2={h} class="axis" />
					{#each yTicks as t (t)}
						<line x1="-6" x2="0" y1={y(t)} y2={y(t)} class="axis" />
						<text x="-9" y={y(t)} class="tick" text-anchor="end" dominant-baseline="central">
							{fmtY(t)}
						</text>
					{/each}
				</g>

				{#if !slope}
					<!-- Pre/Post are the tick labels in slope mode; "x" under them
					     only confuses. -->
					<text
						class="axis-label"
						text-anchor="middle"
						transform="translate({w / 2}, {h + margin.bottom - 5})"
					>
						{model.p.xLabel}
					</text>
				{/if}
				<text
					class="axis-label"
					text-anchor="middle"
					transform="translate({-margin.left + 20}, {h / 2}) rotate(-90)"
				>
					{model.p.yLabel}
				</text>
			</g>
		</svg>
	{/if}
</div>

<style>
	/* Square chart; the wrapper reserves the space so drawing on hydration
	   causes no layout shift. */
	.chart {
		width: 100%;
		aspect-ratio: 1 / 1;
	}
	.chart svg {
		display: block;
		user-select: none;
	}
	.chart svg.adding {
		cursor: copy;
	}

	.point {
		stroke: #2980b9;
		stroke-width: 2px;
		stroke-opacity: 0.75;
		transition: transform 0.2s linear;
		touch-action: none;
	}
	.point:hover {
		fill-opacity: 1 !important;
		stroke-width: 5px;
	}
	.point.draggable {
		cursor: grab;
	}
	.point.draggable:active {
		cursor: grabbing;
	}
	.point.deletable:hover {
		cursor: pointer;
		fill: #fff !important;
		stroke: red;
	}

	.reg {
		stroke: var(--ink);
		stroke-width: 2px;
		vector-effect: non-scaling-stroke;
		transition: transform 0.2s linear;
	}

	.residual {
		stroke: #f18686;
		stroke-width: 1.5px;
		transition: transform 0.2s linear;
	}

	.slope-line {
		stroke: var(--ink);
		stroke-width: 1.5px;
		opacity: 0.25;
		vector-effect: non-scaling-stroke;
		transition:
			transform 0.2s linear,
			opacity 0.33s;
	}
	.slope-line.hidden {
		opacity: 0;
	}

	.no-transition {
		transition: none !important;
	}

	.ellipse {
		stroke: gray;
		fill: var(--paper, #fff);
		fill-opacity: 0.5;
	}
	.ellipse.clickable {
		cursor: pointer;
	}
	.ellipse.clickable:not(.selected):hover {
		stroke-width: 3px;
		fill: #000;
		fill-opacity: 0.05;
	}
	/* The light-mode hover darkens; on a dark paper that's invisible, so
	   lighten instead. Same for the hard-coded green/red axis-line colours. */
	:global(html[data-theme='dark']) .ellipse.clickable:not(.selected):hover {
		fill: #fff;
		fill-opacity: 0.07;
	}
	.ellipse.selected {
		stroke: #9fdfff;
		stroke-width: 5px;
		fill: #9fdfff;
		fill-opacity: 0.33;
	}
	.ellipse-axis {
		stroke: var(--ink);
		stroke-width: 1px;
		stroke-opacity: 0.5;
		/* Decoration on top of the ellipse fills — don't swallow their clicks. */
		pointer-events: none;
	}
	.ellipse-axis.hot.major {
		stroke: green;
		stroke-width: 2px;
		stroke-opacity: 0.75;
	}
	.ellipse-axis.hot.minor {
		stroke: red;
		stroke-width: 2px;
		stroke-opacity: 0.75;
	}
	:global(html[data-theme='dark']) .ellipse-axis.hot.major {
		stroke: #4ade80;
	}
	:global(html[data-theme='dark']) .ellipse-axis.hot.minor {
		stroke: #ff7b72;
	}
	.ellipse-label {
		fill: var(--ink);
		font-size: 15px;
	}

	.axis {
		stroke: var(--rule);
		stroke-width: 1;
	}
	.tick {
		fill: var(--muted);
		font-size: 12px;
	}
	.axis-label {
		fill: var(--ink);
		font-size: 15px;
	}

	@media (prefers-reduced-motion: reduce) {
		.point,
		.residual,
		.slope-line,
		.reg {
			transition: none;
		}
	}
</style>
