<script module lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { expit } from '#lib/stats/binary.js';
	import { svgFont } from './type';

	interface Geom {
		key: 'desktop' | 'mobile';
		W: number;
		H: number;
		/** Top and bottom margins; the panels share one risk axis. */
		t: number;
		b: number;
		/** Plot x ranges of the two panels. Equal widths, so a log-odds step is
		 *  the same length in both and the steps compare by eye. */
		left: [number, number];
		right: [number, number];
		/** Panel and axis titles; ticks and direct labels use `label` (see svgFont). */
		font: number;
		label: number;
		r: number;
		xticks: number[];
		titles: [string, string];
		xTitle: string;
	}

	const GEOMS: Geom[] = [
		{
			key: 'desktop',
			W: 880,
			H: 352,
			t: 34,
			b: 46,
			left: [56, 386],
			right: [536, 866],
			font: svgFont('desktop', 880, 'title'),
			label: svgFont('desktop', 880, 'label'),
			r: 6,
			xticks: [-4, -2, 0, 2, 4],
			titles: ['Within each severity group', 'Whole trial'],
			xTitle: 'Log-odds of remission'
		},
		{
			key: 'mobile',
			W: 400,
			H: 344,
			t: 30,
			b: 48,
			left: [54, 182],
			right: [256, 384],
			font: svgFont('mobile', 400, 'title'),
			label: svgFont('mobile', 400, 'label'),
			r: 5,
			xticks: [-4, 0, 4],
			titles: ['Groups', 'Whole trial'],
			xTitle: 'Log-odds'
		}
	];
	const DOMAIN: [number, number] = [-5, 5];
	const RISK_TICKS = [0, 0.25, 0.5, 0.75, 1];
	const GRID = Array.from(
		{ length: 201 },
		(_, i) => DOMAIN[0] + (i * (DOMAIN[1] - DOMAIN[0])) / 200
	);

	function scales(g: Geom) {
		const y = scaleLinear()
			.domain([0, 1])
			.range([g.H - g.b, g.t]);
		const xl = scaleLinear().domain(DOMAIN).range(g.left);
		const xr = scaleLinear().domain(DOMAIN).range(g.right);
		const curve = (x: (e: number) => number) =>
			line<number>()
				.x((e) => x(e))
				.y((e) => y(expit(e)))(GRID);
		return { y, xl, xr, curveL: curve(xl), curveR: curve(xr) };
	}

	/** Where each arm's two group lines meet: just short of the whole-trial panel. */
	const mergeX = (g: Geom) => g.right[0] - 14;

	/** Dash period of `.flow` (5 on, 4 off); keep the two in step. */
	const DASH = 9;

	/** A group's line, flat from its dot across the gap and then an S-bend into
	 *  its arm's average, drawn as two pieces so the dashes hold still while the
	 *  slider moves the dots. A dash pattern starts at a path's first point, so
	 *  each piece starts at a point that never moves sideways: the flat piece at
	 *  the gap's edge, the bend at the merge point (the whole trial is fixed).
	 *  The bend's fixed dash count (`pathLength`) stretches its dashes instead of
	 *  letting them crawl. */
	function flowParts(g: Geom, x0: number, y0: number, y1: number) {
		const sx = g.left[1] + 8;
		const mx = mergeX(g);
		const cx = (sx + mx) / 2;
		return {
			flat: `M${sx},${y0} H${x0}`,
			bend: `M${mx},${y1} C${cx},${y1} ${cx},${y0} ${sx},${y0}`,
			bendLength: Math.max(1, Math.round((mx - sx) / DASH)) * DASH
		};
	}
</script>

<script lang="ts">
	import { format } from 'd3-format';
	import { calibrateToStrata, effects, logit } from '#lib/stats/binary.js';
	import ExpandButton from '#lib/components/ExpandButton.svelte';
	import Legend from './Legend.svelte';
	import ResponsiveSvg from './ResponsiveSvg.svelte';
	import { decimal } from './oddsPhrase';
	import './odds.css';

	let { title }: { title?: string } = $props();
	const uid = $props.id();

	// The trial is held fixed at 30% vs 50% remission (whole-trial OR 7/3).
	const P0 = 0.3;
	const P1 = 0.5;
	const STRATA = ['mild', 'severe'] as const;
	type Stratum = (typeof STRATA)[number];
	type ArmKey = 'control' | 'treated';
	const LABEL: Record<Stratum, string> = { mild: 'Mild', severe: 'Severe' };

	let expanded = $state(false);
	// ln 3 puts the groups at exactly 50% → 75% (mild) and 10% → 25% (severe).
	let delta = $state(Math.log(3));

	// Calibration makes each arm's two group risks average to the arm's risk.
	const arms = $derived.by(() => {
		const { beta0, betaT } = calibrateToStrata(P0, P1, delta);
		return [
			{ key: 'control' as const, eta: beta0, p: P0 },
			{ key: 'treated' as const, eta: beta0 + betaT, p: P1 }
		].map((a) => ({
			...a,
			pooled: logit(a.p),
			mild: { e: a.eta + delta, p: expit(a.eta + delta) },
			severe: { e: a.eta - delta, p: expit(a.eta - delta) }
		}));
	});
	const rows = $derived([
		...STRATA.map((s) => ({
			key: s as string,
			label: LABEL[s],
			c: arms[0][s],
			t: arms[1][s],
			...effects(arms[0][s].p, arms[1][s].p)
		})),
		{
			key: 'whole',
			label: 'Whole trial',
			c: { e: arms[0].pooled, p: P0 },
			t: { e: arms[1].pooled, p: P1 },
			...effects(P0, P1)
		}
	]);

	// The whole trial between its groups: the risks, RD, and RR land between
	// the groups' values, and the odds ratio visibly does not.
	const tableRows = $derived([rows[0], rows[2], rows[1]]);

	// Hover follows one path: a group dot lights its own line and its arm's
	// merged line; a whole-trial dot lights both of its arm's group lines.
	let hovered = $state<{ arm: ArmKey; stratum: Stratum | null } | null>(null);
	const lit = (arm: ArmKey, stratum: Stratum | null) =>
		!hovered ||
		(hovered.arm === arm && (!stratum || !hovered.stratum || hovered.stratum === stratum));
	function local(e: PointerEvent) {
		const el = e.currentTarget as SVGGraphicsElement;
		const pt = el.ownerSVGElement!.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		return pt.matrixTransform(el.getScreenCTM()!.inverse());
	}
	function hover(e: PointerEvent, g: Geom) {
		const { y, xl, xr } = scales(g);
		const at = local(e);
		const marks = arms.flatMap((a) => [
			...STRATA.map((s) => ({ arm: a.key, stratum: s, x: xl(a[s].e), y: y(a[s].p) })),
			{ arm: a.key, stratum: null, x: xr(a.pooled), y: y(a.p) }
		]);
		let best = 2.5 * g.r + 12;
		hovered = null;
		for (const m of marks) {
			const d = Math.hypot(m.x - at.x, m.y - at.y);
			if (d < best) [best, hovered] = [d, { arm: m.arm, stratum: m.stratum }];
		}
	}

	/** Whether the severe group's treated dot or drop line lands on the mild
	 *  group's ×OR label, which would then read as the severe group's. Both
	 *  groups share one odds ratio, so the severe group's label alone suffices. */
	function mildOrCrowded(g: Geom) {
		const { y, xl } = scales(g);
		const [mild, sc, st] = [arms[0].mild, arms[0].severe, arms[1].severe];
		const font = g.label;
		const x0 = xl(mild.e) + g.r + 2;
		const x1 = x0 + 5 * font * 0.62;
		const base = y(mild.p) + font + 3;
		const [y0, y1] = [base - 0.85 * font, base + 0.25 * font];
		const sx = xl(st.e);
		return sx > x0 - g.r - 2 && sx < x1 + g.r && y(st.p) - g.r < y1 && y(sc.p) > y0;
	}

	const f2 = format('.2f');
	const pct = format('.0%');
	// Spelled out where they fit; a phone gets the abbreviations the essay defines.
	const MEASURE_HEADS = [
		['Risk difference', 'RD'],
		['Risk ratio', 'RR'],
		['Odds ratio', 'OR']
	];
	// d3's format writes negatives with a true minus sign.
	const fInt = format('d');
</script>

{#snippet step(
	g: Geom,
	x: (e: number) => number,
	y: (p: number) => number,
	c: { e: number; p: number },
	t: { e: number; p: number },
	or: number,
	label?: string,
	hideOr = false
)}
	<line class="or-span" x1={x(c.e)} x2={x(t.e)} y1={y(c.p)} y2={y(c.p)} />
	<line class="drop" x1={x(t.e)} x2={x(t.e)} y1={y(c.p)} y2={y(t.p)} />
	<circle class="pt control" cx={x(c.e)} cy={y(c.p)} r={g.r} />
	<circle class="pt treated" cx={x(t.e)} cy={y(t.p)} r={g.r} />
	<!-- Below and right of the control dot: the curve rises to the right, so
		 that corner is always clear of it. Near a risk of 0 that would reach the
		 tick numbers, so the label sits level with the bar, past its end. -->
	{@const low = y(c.p) + g.label + 3 > g.H - g.b - 2}
	<text
		class={['ink', { 'fade-out': hideOr }]}
		x={low ? x(t.e) + 5 : x(c.e) + g.r + 2}
		y={low ? y(c.p) + 0.35 * g.label : y(c.p) + g.label + 3}
		font-size={g.label}>×{decimal(or)}</text
	>
	{#if label}
		<!-- Below 0.35 the two groups' labels overlap. -->
		<text
			class={['ink', { 'fade-out': delta < 0.35 }]}
			x={x(c.e) - g.r - 2}
			y={y(c.p) - g.r - 2}
			text-anchor="end"
			font-size={g.label}>{label}</text
		>
	{/if}
{/snippet}

<figure
	class={['card', 'wide', 'odds-fig', 'strata', { expanded }]}
	aria-labelledby={title ? `${uid}-title` : undefined}
>
	<ExpandButton bind:expanded label="severity figure" />
	{#if title}<p class="fig-title" id="{uid}-title">{title}</p>{/if}
	<div class="odds-controls">
		<label class="odds-slider">
			<span class="odds-label">How strongly severity predicts remission (control arm)</span>
			<input
				class="fig-range"
				type="range"
				min="0"
				max="2"
				step="any"
				bind:value={delta}
				style="--pct: {(delta / 2) * 100}%"
				aria-valuetext="control arm: {pct(rows[0].c.p)} remit if mild, {pct(rows[1].c.p)} if severe"
			/>
			<output>
				<span>mild {pct(rows[0].c.p)}</span>
				<span>severe {pct(rows[1].c.p)}</span>
			</output>
		</label>
	</div>

	<Legend
		items={[
			{ key: 'control', label: 'Control arm' },
			{ key: 'event', label: 'Treated arm' },
			{ key: 'line-ref', label: 'Odds-ratio step' }
		]}
	/>

	{#each GEOMS as g (g.key)}
		{@const { y, xl, xr, curveL, curveR } = scales(g)}
		{@const bottom = g.H - g.b}
		<ResponsiveSvg
			variant={g.key}
			width={g.W}
			height={g.H}
			label="Two logistic curves on the same axes. Left: the mild and severe groups, each with its odds-ratio step. Right: the whole trial. Each arm's two group risks are averaged between the panels and carried to the whole-trial point."
		>
			<text class="title" x={g.left[0]} y={g.font + 3} font-size={g.font}>{g.titles[0]}</text>
			<text class="title" x={g.right[0]} y={g.font + 3} font-size={g.font}>{g.titles[1]}</text>

			{#each RISK_TICKS as v (v)}
				<line class="grid" x1={g.left[0]} x2={g.left[1]} y1={y(v)} y2={y(v)} />
				<line class="grid" x1={g.right[0]} x2={g.right[1]} y1={y(v)} y2={y(v)} />
				<text x={g.left[0] - 5} y={y(v) + 4} text-anchor="end" font-size={g.label}>{v}</text>
			{/each}
			{#each [xl, xr] as x, i (i)}
				{#each g.xticks as v (v)}
					<text x={x(v)} y={bottom + g.label + 5} text-anchor="middle" font-size={g.label}
						>{fInt(v)}</text
					>
				{/each}
				<text
					x={(x(DOMAIN[0]) + x(DOMAIN[1])) / 2}
					y={bottom + g.label + g.font + 13}
					text-anchor="middle"
					font-size={g.font}>{g.xTitle}</text
				>
			{/each}
			<text
				transform="translate({g.font - 3}, {(g.t + bottom) / 2}) rotate(-90)"
				text-anchor="middle"
				font-size={g.font}>Risk of remission</text
			>

			<!-- Rightward from a point on a rising curve stays under the curve, so the
				 group lines never cross their own panel's curve. -->
			{#each arms as a (a.key)}
				{#each STRATA as s (s)}
					{@const part = flowParts(g, xl(a[s].e), y(a[s].p), y(a.p))}
					<!-- Opacity on the group, so the two pieces' overlap doesn't darken. -->
					<g class={['flow', a.key, { dim: !lit(a.key, s), focus: hovered && lit(a.key, s) }]}>
						<path d={part.flat} />
						<path d={part.bend} pathLength={part.bendLength} />
					</g>
				{/each}
				<path
					class={[
						'flow',
						'merged',
						a.key,
						{ dim: !lit(a.key, null), focus: hovered && lit(a.key, null) }
					]}
					d="M{mergeX(g)},{y(a.p)} H{xr(a.pooled)}"
				/>
			{/each}
			<!-- The whole trial stays at 30% and 50%, so this spot between the two
				 merged lines, left of where the curve rises, never moves. It sits
				 high enough to clear the control arm's label below it. -->
			<!-- The narrow mobile panel starts it in the gap, clear of the drop line. -->
			<text
				class="note"
				x={g.key === 'mobile' ? g.right[0] - 14 : g.right[0] + 4}
				y={y(0.43) + 4}
				font-size={g.label}>{g.key === 'mobile' ? 'averages' : 'group averages'}</text
			>

			<path class="curve" d={curveL} />
			<path class="curve" d={curveR} />

			{#each rows as row (row.key)}
				{#if row.key === 'whole'}
					{@render step(g, xr, y, row.c, row.t, row.or)}
				{:else}
					{@render step(
						g,
						xl,
						y,
						row.c,
						row.t,
						row.or,
						row.label,
						row.key === 'mild' && mildOrCrowded(g)
					)}
				{/if}
			{/each}
			<!-- Direct labels name the arms on their marks, so color is not the only
				 cue. Above left of the control dot and right of the treated dot both
				 stay clear of the rising curve and the merged lines. -->
			<text
				class="ink"
				x={xr(arms[0].pooled) - g.r - 3}
				y={y(P0) - g.r - 2}
				text-anchor="end"
				font-size={g.label}>Control</text
			>
			<text
				class="ink"
				x={xr(arms[1].pooled) + g.r + 4}
				y={y(P1) + 0.35 * g.label}
				font-size={g.label}>Treated</text
			>

			<rect
				class="hit"
				x={g.left[0]}
				y={g.t}
				width={g.right[1] - g.left[0]}
				height={bottom - g.t}
				aria-hidden="true"
				onpointermove={(e) => hover(e, g)}
				onpointerleave={() => (hovered = null)}
			/>
		</ResponsiveSvg>
	{/each}

	<div class="numbers">
		<!-- "Multiplies the odds", never "times as likely": the post shows that
		 reading is wrong. -->
		<p class="fig-readout" aria-live="polite">
			{#if f2(rows[0].or) === f2(rows[2].or)}
				With severity making no difference to remission, treatment multiplies the odds of remission
				by <strong>{f2(rows[2].or)}</strong> in each group and in the whole trial alike.
			{:else}
				In each severity group, treatment multiplies the odds of remission by
				<strong>{f2(rows[0].or)}</strong>. In the whole trial, it multiplies them by
				<strong>{f2(rows[2].or)}</strong>.
			{/if}
		</p>

		<!-- The one home for the numbers: the essay cites its RD and RR columns,
		     which the chart does not draw. -->
		<div class="table-scroll">
			<table class="odds-table">
				<thead>
					<tr>
						<th></th>
						<th>Control</th>
						<th>Treated</th>
						{#each MEASURE_HEADS as [full, short] (short)}
							<th
								><span class="full">{full}</span><span class="short" aria-hidden="true"
									>{short}</span
								></th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each tableRows as row (row.key)}
						<tr class={{ whole: row.key === 'whole' }}>
							<th scope="row">{row.label}</th>
							<td>{pct(row.c.p)}</td>
							<td>{pct(row.t.p)}</td>
							<td>{f2(row.rd)}</td>
							<td>{f2(row.rr)}</td>
							<td>{f2(row.or)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<figcaption>
		Each arm's mild and severe groups sit on the left curve at their log-odds of remission, and the
		dashed lines average each arm's two risks into its whole-trial point on the right; hover a dot
		to follow its line. Both panels use the same log-odds scale, so the orange odds-ratio steps
		compare by length: the whole trial's is shorter than either group's. The slider sets how
		strongly severity predicts remission. The whole trial stays at 30% versus 50%, so only the
		groups' steps change; with the slider at its left end, all three match.
	</figcaption>
</figure>

<style>
	text.title {
		fill: var(--ink);
		font-weight: 600;
	}
	/* A panel halo keeps labels legible where a faint dashed line crosses them. */
	text.ink {
		fill: var(--ink);
		stroke: var(--panel);
		stroke-width: 3;
		paint-order: stroke;
	}
	.curve {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
	}
	.drop {
		stroke: var(--muted);
		stroke-width: 1;
		stroke-dasharray: 2 2;
	}
	.or-span {
		stroke: var(--odds-ref);
		stroke-width: 4;
		stroke-linecap: round;
	}
	.pt {
		stroke-width: 2;
	}
	.pt.control {
		fill: var(--muted);
		stroke: var(--panel);
	}
	.pt.treated {
		fill: var(--odds-accent);
		stroke: var(--panel);
	}
	/* Bookkeeping, not data: the connection stays faint until hovered. The dash
	   period is DASH in the script. */
	.flow {
		fill: none;
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
		opacity: 0.45;
		transition: opacity 0.2s ease;
	}
	/* Twice as thick: two groups' worth of patients after the merge. */
	.flow.merged {
		stroke-width: 3;
		stroke-dasharray: 7 5;
	}
	.flow.control {
		stroke: var(--muted);
	}
	.flow.treated {
		stroke: var(--odds-accent);
	}
	.flow.focus {
		opacity: 1;
	}
	.flow.dim {
		opacity: 0.12;
	}
	/* At 0.45 the lines nearly vanish on the dark panel; the teal needs more
	   (0.85 is about 3.6:1 against the panel) because it is the darker of the two. */
	:global(:root[data-theme='dark']) .flow:not(.focus, .dim) {
		opacity: 0.6;
	}
	:global(:root[data-theme='dark']) .flow.treated:not(.focus, .dim) {
		opacity: 0.85;
	}
	.hit {
		fill: transparent;
		touch-action: pan-y;
	}
	.strata {
		--fs-chrome: 20rem;
	}
	/* Full view on a landscape screen: the readout sits beside the table, so the
	   chart keeps most of the window's height. */
	@media (min-width: 56rem) {
		.strata.expanded {
			--fs-chrome: 24rem;
		}
		.expanded .numbers {
			display: grid;
			/* The table's six columns need the wider share to keep one-line headers. */
			grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
			align-items: start;
			gap: 0 2.5rem;
		}
		.expanded .numbers .table-scroll {
			grid-column: 2;
			margin-top: 0;
		}
	}
	@media (min-width: 40.01rem) {
		.odds-slider {
			grid-template-columns: auto 5.5rem;
		}
	}
	.odds-slider output {
		display: grid;
		font-size: 0.82rem;
		font-weight: 500;
		line-height: 1.25;
		white-space: nowrap;
		color: var(--ink);
	}
	.numbers > .fig-readout {
		margin: 0;
	}
	.table-scroll {
		margin-top: var(--odds-sp-2);
		overflow-x: auto;
	}
	/* Rules only around the whole trial, so they mark it as the groups'
	   combination rather than a third group. */
	.odds-table tbody :is(th, td) {
		border-bottom: none;
	}
	.odds-table tr.whole :is(th, td) {
		border-block: 1px solid var(--rule);
		background: color-mix(in srgb, var(--ink) 5%, transparent);
	}
	@media (max-width: 40rem) {
		/* Six columns in a phone's width; below about 360px the table scrolls. */
		.odds-table :is(th, td) {
			padding-inline: 0.15rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.flow {
			transition: none;
		}
	}
</style>
