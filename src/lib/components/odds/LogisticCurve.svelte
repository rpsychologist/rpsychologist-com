<script module lang="ts">
	import { scaleLinear, scaleLog } from 'd3-scale';
	import { line } from 'd3-shape';
	import { expit } from '#lib/stats/binary.js';
	import { svgFont } from './type';

	interface Geom {
		variant: 'desktop' | 'mobile';
		W: number;
		H: number;
		m: { t: number; r: number; b: number; l: number };
		oddsTicks: number[];
		/** Axis titles; ticks and direct labels use `label` (see svgFont). */
		font: number;
		label: number;
	}

	const GEOMS: Geom[] = [
		{
			variant: 'desktop',
			W: 640,
			H: 388,
			m: { t: 38, r: 24, b: 62, l: 66 },
			oddsTicks: [0.01, 0.1, 0.25, 0.5, 1, 2, 4, 10, 100],
			// Capped by its height (--fig-max-h), the chart renders 816px wide.
			font: svgFont('desktop', 640, 'title', 816),
			label: svgFont('desktop', 640, 'label', 816)
		},
		{
			variant: 'mobile',
			W: 360,
			H: 334,
			m: { t: 40, r: 14, b: 60, l: 52 },
			oddsTicks: [0.01, 0.1, 1, 10, 100],
			font: svgFont('mobile', 360, 'title'),
			label: svgFont('mobile', 360, 'label')
		}
	];
	const DOMAIN: [number, number] = [-6, 6];
	// The odds step's label has its own row under the axis, above the tick
	// numbers, where nothing in the plot can meet it.
	const OR_ROW = 14;
	const GRID = Array.from(
		{ length: 201 },
		(_, i) => DOMAIN[0] + (i * (DOMAIN[1] - DOMAIN[0])) / 200
	);

	// On desktop this makes a log-risk unit the same length as a log-odds unit,
	// so where the curve is diagonal (rare outcomes) the RR step visibly equals
	// the OR step; the log axis then starts near where the curve does, expit(-6).
	const Y_MIN = 0.002;
	const LIN_TICKS = [0, 0.25, 0.5, 0.75, 1];
	const LOG_TICKS = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1];

	function scales(g: Geom) {
		const range = [g.H - g.m.b, g.m.t];
		return {
			x: scaleLinear()
				.domain(DOMAIN)
				.range([g.m.l, g.W - g.m.r]),
			lin: scaleLinear().domain([0, 1]).range(range),
			log: scaleLog().domain([Y_MIN, 1]).range(range)
		};
	}

	/** Risk to y, blended between the linear (t = 0) and log (t = 1) axes so the
	 *  curve morphs rather than jumps. */
	function yScale(g: Geom, t: number) {
		const { lin, log } = scales(g);
		return (v: number) => lin(v) + t * (log(Math.max(v, Y_MIN)) - lin(v));
	}

	function curve(g: Geom, t: number) {
		const x = scales(g).x;
		const y = yScale(g, t);
		return line<number>()
			.x((e) => x(e))
			.y((e) => y(expit(e)))(GRID);
	}

	interface Box {
		x0: number;
		y0: number;
		x1: number;
		y1: number;
	}
	export interface Placed {
		x: number;
		/** Baseline. */
		y: number;
		anchor: 'start' | 'middle' | 'end';
	}
	const hit = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
	const span = (x0: number, y0: number, x1: number, y1: number, r: number): Box => ({
		x0: Math.min(x0, x1) - r,
		y0: Math.min(y0, y1) - r,
		x1: Math.max(x0, x1) + r,
		y1: Math.max(y0, y1) + r
	});
	// Text is never measured (it must lay out identically in the prerender), so
	// widths are estimated generously: bold tabular digits run about 0.62 em.
	function textBox(s: Placed, text: string, font: number): Box {
		const w = text.length * font * 0.62;
		const x0 = s.anchor === 'start' ? s.x : s.anchor === 'end' ? s.x - w : s.x - w / 2;
		return { x0, x1: x0 + w, y0: s.y - 0.85 * font, y1: s.y + 0.25 * font };
	}

	// Direct labels name the arms on their marks, so telling them apart never
	// rests on color alone.
	const ARM_TEXT = { control: 'Control', treated: 'Treated' };

	/** Arm labels may rise into the top margin, short of the odds ticks, and
	 *  run into the right margin. */
	const armBox = (g: Geom, left: number): Box => ({
		x0: left + 2,
		y0: g.m.t - 11,
		x1: g.W - 2,
		y1: g.H - g.m.b - 1
	});

	/** On a rising curve, up-left of a point is always above it and down-right
	 *  always below, so the left arm's label goes up-left and the right arm's
	 *  down-right: neither crosses the curve or the other label. At an edge a
	 *  label slides along it, clearing its point by degrees, rather than
	 *  switching sides: it never jumps while the pair is dragged. */
	function armLabel(
		x: number,
		y: number,
		isLeft: boolean,
		text: string,
		font: number,
		inside: Box
	): Placed {
		const w = textBox({ x: 0, y: 0, anchor: 'start' }, text, font).x1;
		// How far the edge pushed the label over its point, eased in over 16 px.
		const over = (by: number) => Math.min(1, by / 16);
		if (isLeft) {
			const end = Math.max(x - 8, inside.x0 + w);
			const ly = y - 7 - 6 * over(end - (x - 8));
			return { x: end, y: Math.max(ly, inside.y0 + 0.85 * font), anchor: 'end' };
		}
		const start = Math.min(x + 8, inside.x1 - w);
		const ly = y + font + 3 + 4 * over(x + 8 - start);
		return { x: start, y: Math.min(ly, inside.y1 - 0.25 * font), anchor: 'start' };
	}

	/** Fixed spots: the odds step's label centered under it, the risk step's
	 *  above it, and each arm's beside its point. Where the arms' labels crowd
	 *  the risk label near a risk of 0, it stacks just above them, so it moves
	 *  with them instead of jumping. */
	function stepLabels(
		g: Geom,
		t: number,
		pts: { e0: number; p0: number; e1: number; p1: number },
		vText: string
	) {
		const x = scales(g).x;
		const y = yScale(g, t);
		const font = g.label;
		const [x0, y0, x1, y1] = [x(pts.e0), y(pts.p0), x(pts.e1), y(pts.p1)];
		const left = x(DOMAIN[0]);
		const inside = armBox(g, left);
		// By risk, not position: at an odds ratio of 1, or with the treated arm
		// pinned to the control's edge, the points coincide. A tie counts the
		// control arm as left.
		const controlLeft = pts.p0 <= pts.p1;
		let control = armLabel(x0, y0, controlLeft, ARM_TEXT.control, font, inside);
		let treated = armLabel(x1, y1, !controlLeft, ARM_TEXT.treated, font, inside);
		// In the bottom-left corner the left edge pushes the left label right and
		// the floor pushes the right one up; the right one then slides right, by
		// degrees as they close in, so it never jumps.
		const [l, r] = controlLeft
			? [textBox(control, ARM_TEXT.control, font), textBox(treated, ARM_TEXT.treated, font)]
			: [textBox(treated, ARM_TEXT.treated, font), textBox(control, ARM_TEXT.control, font)];
		const close = Math.min(1, Math.max(0, (Math.min(l.y1, r.y1) - Math.max(l.y0, r.y0) + 3) / 6));
		const shift = Math.max(0, l.x1 + 4 - r.x0) * close;
		if (controlLeft) treated = { ...treated, x: treated.x + shift };
		else control = { ...control, x: control.x + shift };
		const arms = [
			textBox(control, ARM_TEXT.control, font),
			textBox(treated, ARM_TEXT.treated, font)
		];
		const up = Math.min(y0, y1);
		/** Pushed up until clear of the arm labels. */
		const stack = (s: Placed): Placed => {
			for (let k = 0; k < arms.length; k++) {
				const t = textBox(s, vText, font);
				const b = arms.find((a) => hit(span(t.x0, t.y0, t.x1, t.y1, 2), a));
				if (!b) break;
				s = { ...s, y: b.y0 - 2 - 0.25 * font };
			}
			return s;
		};
		// Above the bar; near the top it slides down against the margin and
		// steps off the bar, rather than flipping below it.
		const above = stack({ x: left + 2, y: up - 7, anchor: 'start' });
		const pushed = Math.max(0, inside.y0 + 0.85 * font - above.y);
		const v: Placed = {
			x: left + 2 + 6 * Math.min(1, pushed / 16),
			y: above.y + pushed,
			anchor: 'start'
		};
		return {
			or: { x: (x0 + x1) / 2, y: g.H - g.m.b + font + 4, anchor: 'middle' } as Placed,
			v,
			control,
			treated
		};
	}
</script>

<script lang="ts">
	import { format } from 'd3-format';
	import { cubicOut } from 'svelte/easing';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { effects, logit, odds, p1FromOr, p1FromRd, p1FromRr } from '#lib/stats/binary.js';
	import ExpandButton from '#lib/components/ExpandButton.svelte';
	import ResponsiveSvg from './ResponsiveSvg.svelte';
	import { decimal } from './oddsPhrase';
	import './odds.css';

	let { title }: { title?: string } = $props();
	const uid = $props.id();

	type Measure = 'rd' | 'rr' | 'or';
	interface MeasureDef {
		key: Measure;
		label: string;
		/** On a phone, as in the essay's text and the severity figure's table. */
		short: string;
		p1: (p0: number, v: number) => number;
		/** The control risk that gives treated risk `p1`. */
		p0: (p1: number, v: number) => number;
		/** The values the slider steps through, or the log-scale span it slides over. */
		stops?: number[];
		span?: [number, number];
	}
	const round2 = (v: number) => Math.round(v * 100) / 100;
	const steps = (from: number, to: number, by: number) =>
		Array.from({ length: Math.round((to - from) / by) + 1 }, (_, i) => round2(from + i * by));
	const MEASURES: MeasureDef[] = [
		{
			key: 'rd',
			label: 'Risk difference',
			short: 'RD',
			p1: p1FromRd,
			p0: (p1, v) => p1 - v,
			stops: steps(-0.4, 0.4, 0.01)
		},
		{
			key: 'rr',
			label: 'Risk ratio',
			short: 'RR',
			p1: p1FromRr,
			p0: (p1, v) => p1 / v,
			stops: [...steps(0.25, 1.95, 0.05), ...steps(2, 4, 0.1)]
		},
		// On a log scale, so a protective effect mirrors a harmful one.
		{
			key: 'or',
			label: 'Odds ratio',
			short: 'OR',
			p1: p1FromOr,
			p0: (p1, v) => expit(logit(p1) - Math.log(v)),
			span: [0.25, 8]
		}
	];
	const nearest = (stops: number[], v: number) =>
		stops.reduce((best, s, i) => (Math.abs(s - v) < Math.abs(stops[best] - v) ? i : best), 0);

	let held = $state<Measure>('or');
	// Defaults are the running trial (30% vs 50%), so all three agree at p0 = .30.
	let values = $state<Record<Measure, number>>({ rd: 0.2, rr: 5 / 3, or: 7 / 3 });
	const heldDef = $derived(MEASURES.find((m) => m.key === held)!);
	// The slider's position: a stop's index, or the log of a continuous value.
	const slider = $derived.by(() => {
		const { stops, span } = heldDef;
		if (stops) {
			return {
				min: 0,
				max: stops.length - 1,
				step: '1',
				pos: nearest(stops, values[held]),
				value: (i: number) => stops[i]
			};
		}
		return {
			min: Math.log(span![0]),
			max: Math.log(span![1]),
			step: 'any',
			pos: Math.log(values[held]),
			value: (x: number) => round2(Math.exp(x))
		};
	});
	// Skip no-op writes (hydration echoes the slider back) so the trial's risk
	// ratio of 5/3 and odds ratio of 7/3, off the slider's grid, survive until
	// the reader moves it.
	const setHeld = (pos: number) => {
		if (Math.abs(pos - slider.pos) > 1e-9) values[held] = slider.value(pos);
	};
	/** The control risk the reader chose; `p0` is it held within reach. */
	let chosen = $state(0.3);
	// The control arm stops where the treated arm reaches an end of the axis, so
	// the held measure never demands a risk outside (0, 1) and the pair never
	// collapses onto an edge.
	const P_LO = expit(DOMAIN[0]);
	const P_HI = expit(DOMAIN[1]);
	const reach = $derived.by((): [number, number] => {
		const v = values[held];
		return [logit(Math.max(P_LO, heldDef.p0(P_LO, v))), logit(Math.min(P_HI, heldDef.p0(P_HI, v)))];
	});
	const clampAxis = (e: number) => Math.min(DOMAIN[1], Math.max(DOMAIN[0], e));
	const clampE = (e: number) => Math.min(reach[1], Math.max(reach[0], e));
	const e0 = $derived(clampE(logit(chosen)));
	const p0 = $derived(e0 === logit(chosen) ? chosen : expit(e0));
	// The control slider runs along the whole log-odds axis, so it tracks the
	// point; past the reach its thumb is put back. Skip no-op writes, as for the
	// held measure.
	function slideE0(el: HTMLInputElement) {
		const e = +el.value;
		if (Math.abs(e - e0) > 1e-9) chosen = expit(clampE(e));
		el.value = String(e0);
	}
	let logAxis = $state(false);
	let expanded = $state(false);
	const mix = Tween.of(() => (logAxis ? 1 : 0), {
		duration: () => (prefersReducedMotion.current ? 0 : 600),
		easing: cubicOut
	});
	// The vertical step is the risk difference on a linear axis, the risk ratio on a log one.
	const vbar = $derived<Measure>(logAxis ? 'rr' : 'rd');

	const p1 = $derived(heldDef.p1(p0, values[held]));
	const fx = $derived(effects(p0, p1));
	// Clamped: at the reach, rounding can put the treated arm a hair past the axis.
	const e1 = $derived(clampAxis(logit(p1)));
	/** Whether a held risk ratio or difference has run out of room, rather than
	 *  meeting the chart's edge as an odds ratio, or a risk ratio below 1, does:
	 *  past it the treated risk would leave (0, 1). */
	const ceiling = $derived.by(() => {
		const v = values[held];
		const top = e0 >= reach[1] - 1e-9 && reach[1] < DOMAIN[1];
		const bottom = e0 <= reach[0] + 1e-9 && reach[0] > DOMAIN[0];
		if (held !== 'or' && v > (held === 'rr' ? 1 : 0) && top) return 'top';
		if (held === 'rd' && v < 0 && bottom) return 'bottom';
		return null;
	});

	// Drag the pair along the curve; the grab offset keeps it from jumping
	// to the pointer.
	let grab = $state<number | null>(null);
	function toLogit(e: PointerEvent, g: Geom): number {
		const el = e.currentTarget as SVGGraphicsElement;
		const pt = el.ownerSVGElement!.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		return scales(g).x.invert(pt.matrixTransform(el.getScreenCTM()!.inverse()).x);
	}
	function down(e: PointerEvent, g: Geom) {
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		grab = toLogit(e, g) - e0;
	}
	function move(e: PointerEvent, g: Geom) {
		if (grab === null) return;
		chosen = expit(clampE(toLogit(e, g) - grab));
	}

	const f2 = format('.2f');
	// Near 0 or 1 two decimals would round a possible risk to an impossible one.
	const fRisk = (p: number) =>
		(p > 0.99 && p < 1) || (p > 0 && p < 0.01) ? format('.3f')(p) : f2(p);
	// The readout speaks in shares of each arm, as the essay does; a decimal near
	// 0% or 100% keeps a possible share from reading as an impossible one.
	const fPct = (p: number) =>
		(p > 0.99 || p < 0.01 ? format('.1f')(100 * p) : format('d')(Math.round(100 * p))) + '%';
	const fTick = (v: number) => (v < 1 ? format('~g')(v) : format('d')(v));
	// d3's format writes negatives with a true minus sign.
	const fInt = format('d');
	const show = (m: Measure, v: number) =>
		m === 'rd' ? (v < 0 ? '−' : '+') + f2(Math.abs(v)) : m === 'or' ? decimal(v) : f2(v);
	const readout = $derived.by(() => {
		const arms = `${fPct(p0)} of the control arm remit and ${fPct(p1)} of the treated arm (odds ${decimal(odds(p0))} and ${decimal(odds(p1))}).`;
		if (!ceiling) return arms;
		const [more, share] =
			ceiling === 'top' ? ['more', 'more than 100%'] : ['fewer', 'less than 0%'];
		return `${arms} A ${heldDef.label.toLowerCase()} of ${show(held, values[held])} can go no further: if ${more} of the control arm remitted, ${share} of the treated arm would have to.`;
	});
	const orText = $derived(`×${decimal(fx.or)} odds`);
	const vText = $derived(`${logAxis ? `×${f2(fx.rr)}` : show('rd', fx.rd)} risk`);
</script>

{#snippet stepLabel(s: Placed, cls: string, text: string, font: number)}
	<text class={cls} x={s.x} y={s.y} text-anchor={s.anchor} font-size={font}>{text}</text>
{/snippet}

<figure
	class={['card', 'wide', 'odds-fig', 'logistic', { expanded }]}
	aria-labelledby={title ? `${uid}-title` : undefined}
>
	<ExpandButton bind:expanded label="logistic curve" />
	{#if title}<p class="fig-title" id="{uid}-title">{title}</p>{/if}
	<div class="layout">
		<!-- Inputs above the chart and results below it in the article; all of
		     them beside it in a landscape full view. -->
		<div class="panel">
			<div class="odds-controls toggles">
				<div class="odds-group" role="group" aria-labelledby="{uid}-held">
					<span class="odds-label" id="{uid}-held">Hold fixed</span>
					{#each MEASURES as m (m.key)}
						<button
							type="button"
							class={['fig-pill', { on: held === m.key }]}
							aria-pressed={held === m.key}
							onclick={() => (held = m.key)}
							><span class="full">{m.label}</span><span class="short" aria-hidden="true"
								>{m.short}</span
							></button
						>
					{/each}
				</div>
				<div class="odds-group" role="group" aria-labelledby="{uid}-axis">
					<span class="odds-label" id="{uid}-axis">Risk axis</span>
					<button
						type="button"
						class={['fig-pill', { on: !logAxis }]}
						aria-pressed={!logAxis}
						onclick={() => (logAxis = false)}>Linear</button
					>
					<button
						type="button"
						class={['fig-pill', { on: logAxis }]}
						aria-pressed={logAxis}
						onclick={() => (logAxis = true)}>Log</button
					>
				</div>
			</div>
			<div class="sliders">
				<!-- Remounted per measure: its min, max, and value change together. -->
				{#key held}
					<label class="odds-slider">
						<span class="odds-label">{heldDef.label}</span>
						<input
							class="fig-range"
							type="range"
							min={slider.min}
							max={slider.max}
							step={slider.step}
							bind:value={() => slider.pos, setHeld}
							style="--pct: {((slider.pos - slider.min) / (slider.max - slider.min)) * 100}%"
							aria-valuetext="{heldDef.label.toLowerCase()} {show(held, values[held])}"
						/>
						<output>{show(held, values[held])}</output>
					</label>
				{/key}
				<label class="odds-slider">
					<span class="odds-label">Control-arm risk</span>
					<input
						class="fig-range"
						type="range"
						min={DOMAIN[0]}
						max={DOMAIN[1]}
						step="any"
						value={e0}
						oninput={(e) => slideE0(e.currentTarget)}
						style="--pct: {((e0 - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * 100}%"
						aria-valuetext="control risk {fRisk(p0)}"
					/>
					<output>{fRisk(p0)}</output>
				</label>
			</div>

			<!-- The held measure's value is the slider's; it stays in the row, marked,
			     so the three can be compared. The swatches tie each to its mark. -->
			<div class="results">
				{#each MEASURES as m (m.key)}
					<p class={['result', m.key, { held: held === m.key, vbar: vbar === m.key }]}>
						<span class="eq-label"
							><span class="full">{m.label}</span><span class="short" aria-hidden="true"
								>{m.short}</span
							></span
						>
						<strong class="result-value">{show(m.key, fx[m.key])}</strong>
						<span class="held-tag">held fixed</span>
					</p>
				{/each}
			</div>

			<p class="fig-readout sub">{readout}</p>
		</div>

		<div class="plot">
			{#each GEOMS as g (g.variant)}
				{@const x = scales(g).x}
				{@const y = yScale(g, mix.current)}
				{@const bottom = g.H - g.m.b}
				{@const top = Math.max(0, Math.min(p1, 1))}
				<ResponsiveSvg
					variant={g.variant}
					width={g.W}
					height={g.H}
					label="Logistic curve mapping log-odds to risk, with the control and treated arms on it"
				>
					<line class="axis" x1={x(DOMAIN[0])} x2={x(DOMAIN[1])} y1={bottom} y2={bottom} />
					{#each logAxis ? LOG_TICKS : LIN_TICKS as t (t)}
						<line class="grid" x1={x(DOMAIN[0])} x2={x(DOMAIN[1])} y1={y(t)} y2={y(t)} />
						<text x={g.m.l - 6} y={y(t) + 4} text-anchor="end" font-size={g.label}>{t}</text>
					{/each}
					{#each [-6, -4, -2, 0, 2, 4, 6] as t (t)}
						<text
							x={x(t)}
							y={bottom + OR_ROW + g.label + 6}
							text-anchor="middle"
							font-size={g.label}>{fInt(t)}</text
						>
					{/each}
					<text x={(g.m.l + g.W - g.m.r) / 2} y={g.H - 4} text-anchor="middle" font-size={g.font}
						>Log-odds of remission</text
					>
					<line class="axis" x1={x(DOMAIN[0])} x2={x(DOMAIN[1])} y1={g.m.t - 18} y2={g.m.t - 18} />
					{#each g.oddsTicks as t (t)}
						<line
							class="tick"
							x1={x(Math.log(t))}
							x2={x(Math.log(t))}
							y1={g.m.t - 18}
							y2={g.m.t - 13}
						/>
						<text x={x(Math.log(t))} y={g.m.t - 23} text-anchor="middle" font-size={g.label}
							>{fTick(t)}</text
						>
					{/each}
					<text x={g.m.l - 6} y={g.m.t - 23} text-anchor="end" font-size={g.label}>Odds</text>
					<text
						transform="translate({g.font}, {(g.m.t + g.H - g.m.b) / 2}) rotate(-90)"
						text-anchor="middle"
						font-size={g.font}>Risk of remission{logAxis ? ' (log scale)' : ''}</text
					>

					<path class="curve" d={curve(g, mix.current)} />

					<line class="drop" x1={x(e0)} x2={x(e0)} y1={y(p0)} y2={bottom} />
					<line class="drop" x1={x(DOMAIN[0])} x2={x(e0)} y1={y(p0)} y2={y(p0)} />
					<line class="drop" x1={x(e1)} x2={x(e1)} y1={y(p1)} y2={bottom} />
					<line class="drop" x1={x(DOMAIN[0])} x2={x(e1)} y1={y(p1)} y2={y(p1)} />
					<!-- The odds ratio is the horizontal step between the arms; the risk
						 difference is the vertical step the curve turns it into. -->
					<line class="or-span" x1={x(e0)} x2={x(e1)} y1={bottom} y2={bottom} />
					<line class="rd-span" x1={x(DOMAIN[0])} x2={x(DOMAIN[0])} y1={y(p0)} y2={y(top)} />
					{@const lab = stepLabels(g, mix.current, { e0, p0, e1, p1 }, vText)}
					{@render stepLabel(lab.or, 'or-label', orText, g.label)}
					{@render stepLabel(lab.v, 'rd-label', vText, g.label)}
					{@render stepLabel(lab.control, 'arm-label', ARM_TEXT.control, g.label)}
					{@render stepLabel(lab.treated, 'arm-label', ARM_TEXT.treated, g.label)}
					<circle class="pt treated" cx={x(e1)} cy={y(p1)} r="6" />
					<circle class="pt control" cx={x(e0)} cy={y(p0)} r="6" />

					<rect
						class={['hit', { dragging: grab !== null }]}
						x={g.m.l}
						y={g.m.t}
						width={g.W - g.m.l - g.m.r}
						height={bottom - g.m.t}
						aria-hidden="true"
						onpointerdown={(e) => down(e, g)}
						onpointermove={(e) => move(e, g)}
						onpointerup={() => (grab = null)}
						onpointercancel={() => (grab = null)}
					/>
				</ResponsiveSvg>
			{/each}
		</div>
	</div>

	<figcaption>
		Hold one measure fixed and move the control arm<span class="drag-hint">, or drag the pair</span
		>: the other two change with the baseline risk.
	</figcaption>
</figure>

<style>
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
	.or-span,
	.rd-span {
		stroke-width: 4;
		stroke-linecap: round;
	}
	.or-span {
		stroke: var(--odds-ref);
	}
	.rd-span {
		stroke: var(--ink);
	}
	/* The panel's children join the layout's column so the readout can sit
	   under the chart here and in the panel in a full view. */
	.layout {
		display: flex;
		flex-direction: column;
	}
	.panel {
		display: contents;
	}
	/* Each row owns the gap above it, as the card's blocks do (odds.css): flex
	   `order` puts the chart between the inputs and the results, and a phone
	   moves the sliders under it, so a uniform gap won't do. */
	.toggles {
		order: 0;
	}
	.sliders {
		order: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--odds-sp-2) 1.5rem;
		margin-top: var(--odds-sp-2);
	}
	.plot {
		order: 1;
		margin-top: var(--odds-sp-3);
	}
	.results {
		order: 2;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--odds-sp-2) 3rem;
		margin-top: var(--odds-sp-3);
	}
	.fig-readout {
		order: 3;
		margin: var(--odds-sp-2) 0 0;
	}
	/* Set like the other cards' equations (odds.css). */
	.result {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--odds-sp-1);
		margin: 0;
	}
	.result-value {
		font-size: 1.6rem;
		font-weight: 700;
		line-height: 1.25;
		font-variant-numeric: tabular-nums;
	}
	/* The held measure is the input, so it steps back like an off equation;
	   its tag keeps a row in every result so toggling never shifts them. */
	.result.held .result-value {
		color: var(--muted);
	}
	.held-tag {
		font-size: 0.75rem;
		color: var(--muted);
		visibility: hidden;
	}
	.result.held .held-tag {
		visibility: visible;
	}
	/* Swatches tie the number to its mark: the orange horizontal step, the
	   ink vertical one, which is the RD or the RR depending on the risk axis. */
	.result.or .eq-label::before,
	.result.vbar .eq-label::before {
		content: '';
		display: inline-block;
		margin-right: 0.35rem;
		vertical-align: middle;
		border-radius: 2px;
	}
	.result.or .eq-label::before {
		width: 12px;
		height: 4px;
		background: var(--odds-ref);
	}
	.result.vbar .eq-label::before {
		width: 4px;
		height: 12px;
		background: var(--ink);
	}
	.logistic {
		--fs-chrome: 18rem;
	}
	/* A little under the shared 58vh so the whole card fits a 1280×900 screen. */
	.logistic:not(.expanded) {
		--fig-max-h: 55vh;
	}
	/* Full view on a landscape screen: the controls and readout move beside the
	   chart, which is then sized by the window's height. */
	@media (min-width: 56rem) {
		.expanded .layout {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 20rem;
			align-items: start;
			gap: 2rem;
		}
		.expanded .panel {
			display: flex;
			flex-direction: column;
			grid-column: 2;
			grid-row: 1;
			padding-top: 2rem;
		}
		.expanded .plot {
			margin-top: 0;
			grid-column: 1;
			grid-row: 1;
		}
		.logistic.expanded {
			--fs-chrome: 6rem;
		}
		.expanded .sliders {
			flex-direction: column;
			gap: var(--odds-sp-3);
			margin-top: var(--odds-sp-3);
		}
		.expanded .sliders .odds-slider {
			flex: none;
		}
		.expanded .results {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: var(--odds-sp-2);
		}
		.expanded .result-value {
			font-size: 1.5rem;
		}
		/* The panel is a phone's width, so it takes the phone's abbreviations
		   (odds.css): each label then holds one line and the values align. */
		.expanded :is(.toggles, .results) .full {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		.expanded :is(.toggles, .results) .short {
			display: inline;
		}
	}
	@media (max-width: 40rem) {
		/* The sliders follow the chart, where a thumb on one doesn't cover it. */
		.sliders {
			order: 1;
			margin-top: var(--odds-sp-3);
		}
		.plot {
			order: 0;
		}
		.results {
			column-gap: 1.5rem;
		}
		.result-value {
			font-size: 1.3rem;
		}
	}
	/* On a touch screen a drag across the chart fights the page's scrolling,
	   so the slider alone moves the pair. */
	@media (pointer: coarse) {
		.hit,
		.drag-hint {
			display: none;
		}
	}
	text.or-label,
	text.rd-label {
		fill: var(--ink);
		font-weight: 600;
	}
	text.arm-label {
		fill: var(--ink);
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
	.hit {
		fill: transparent;
		cursor: grab;
		touch-action: pan-y;
	}
	.hit.dragging {
		cursor: grabbing;
	}
</style>
