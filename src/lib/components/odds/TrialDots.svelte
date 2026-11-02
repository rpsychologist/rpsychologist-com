<script module lang="ts">
	import { memoize } from '#lib/dots/memo.js';
	import { facingStacks, pourDelays, stackBlock, type Pt } from '#lib/dots/grid.js';
	import { ARMS, type Arm } from '#lib/stats/oddsScenario.js';
	import { odds, probFromOdds } from '#lib/stats/binary.js';
	import { longestTrialReadouts } from './oddsPhrase';
	import { svgFont } from './type';

	/** The risk difference and risk ratio share a view: both compare the same risks. */
	type Measure = 'risk' | 'or';
	type Shape = 'block' | 'stacks';
	type Counts = Record<Arm, number>;

	interface Geom {
		variant: 'desktop' | 'mobile';
		W: number;
		H: number;
		r: number;
		s: number;
		/** Headings; ticks and direct labels use `label` (see svgFont). */
		font: number;
		label: number;
		/** Each arm's center and baseline (the bottom row of dots). */
		arms: Record<Arm, { cx: number; base: number }>;
	}

	// Desktop sets the arms side by side; two facing stacks per arm need the
	// smaller dots. Side by side at 375px the stacks would need dots half this
	// size, so mobile stacks the arms vertically.
	const GEOMS: Geom[] = [
		{
			variant: 'desktop',
			W: 640,
			H: 158,
			r: 4.8,
			s: 12,
			font: svgFont('desktop', 640, 'title'),
			label: svgFont('desktop', 640, 'label'),
			arms: { control: { cx: 160, base: 136 }, treated: { cx: 480, base: 136 } }
		},
		{
			variant: 'mobile',
			W: 360,
			H: 372,
			r: 5,
			s: 13,
			font: svgFont('mobile', 360, 'title'),
			label: svgFont('mobile', 360, 'label'),
			arms: { control: { cx: 180, base: 150 }, treated: { cx: 180, base: 345 } }
		}
	];
	// 10 x 10 per arm, so each dot is one percentage point.
	const N = 100;
	const gapOf = (g: Geom) => 2.5 * g.s;
	/** The top row of a full stack; the arm label sits just above it. */
	const topOf = (g: Geom, arm: Arm) => g.arms[arm].base - 9 * g.s - g.r;
	/**
	 * How far an arm's heading drops from the block's top to sit over its
	 * taller stack. Side by side (desktop) both arms drop alike, so the
	 * headings stay level.
	 */
	function headDrop(g: Geom, shape: Shape, c: Counts, arm: Arm) {
		if (shape === 'block') return 0;
		const rows = (a: Arm) => Math.ceil(Math.max(c[a], N - c[a]) / 10);
		const tall = g.variant === 'desktop' ? Math.max(...ARMS.map(rows)) : rows(arm);
		return (10 - tall) * g.s;
	}

	/** `k` is the patient's position within their arm: the first `count` remit. */
	const PATIENTS = ARMS.flatMap((arm) =>
		Array.from({ length: N }, (_, k) => ({ id: `${arm}-${k}`, arm, k }))
	);
	const remits = (i: number, c: Counts) => PATIENTS[i].k < c[PATIENTS[i].arm];

	/**
	 * Block: one block per arm with the remitters along the bottom.
	 * Stacks: the block splits into remitters facing non-remitters on one
	 * baseline (see facingStacks).
	 */
	function positions(g: Geom, shape: Shape, c: Counts): Pt[] {
		const shapes = Object.fromEntries(
			ARMS.map((arm) => {
				const { cx, base } = g.arms[arm];
				return [
					arm,
					shape === 'stacks'
						? facingStacks(N, c[arm], cx, base, g.s, gapOf(g))
						: stackBlock(N, cx, base, g.s)
				];
			})
		) as Record<Arm, Pt[]>;
		return PATIENTS.map((p) => shapes[p.arm][p.k]);
	}

	const layout = memoize(
		(g: Geom, shape: Shape, c: Counts) =>
			`${g.variant}|${shape}|${shape === 'block' ? '' : `${c.control}-${c.treated}`}`,
		positions
	);

	// The odds-ratio slider runs on a log scale, so 1 sits where 1/2 and 2 are
	// equally far from it; each step multiplies the odds ratio by about 1.01.
	// 360 steps keep 1/4 to 8 on steps and put one on 2.33, the running trial's
	// odds ratio, so readers can set the values the post quotes.
	const OR_MIN = 1 / 4;
	const OR_MAX = 8;
	const OR_STEPS = 360;
	/** Snapped to a step, as the browser draws the thumb. */
	const toPos = (v: number) =>
		Math.round((OR_STEPS * Math.log(v / OR_MIN)) / Math.log(OR_MAX / OR_MIN)) / OR_STEPS;
	/** The odds ratio at slider position `u`, to the two decimals it shows. */
	const fromPos = (u: number) => Math.round(100 * OR_MIN * (OR_MAX / OR_MIN) ** u) / 100;

	/** The treated count that `or` implies for `control` remitters (control odds x OR). */
	const treatedFor = (control: number, or: number) =>
		Math.min(N - 1, Math.max(1, Math.round(N * probFromOdds(odds(control / N) * or))));

	// Laid invisibly under the live readout so its box keeps one height while
	// the sliders move.
	const READOUT_GHOSTS = longestTrialReadouts(
		N,
		Array.from({ length: OR_STEPS / 4 + 1 }, (_, i) => fromPos((4 * i) / OR_STEPS)),
		treatedFor
	);
</script>

<script lang="ts">
	import { format } from 'd3-format';
	import { effects } from '#lib/stats/binary.js';
	import { fx, trialReadout, type Segments } from './oddsPhrase';
	import ExpandButton from '#lib/components/ExpandButton.svelte';
	import DotField from './DotField.svelte';
	import './odds.css';

	let { title }: { title?: string } = $props();
	const uid = $props.id();

	let measure = $state<Measure>('risk');
	let expanded = $state(false);
	// The running trial (30% vs 50%).
	let input = $state<Counts>({ control: 30, treated: 50 });
	// In the OR view the treated slider becomes an odds ratio and the treated arm
	// follows: control odds x OR. Leaving the view commits its count, so all
	// three views keep describing one trial.
	let or = $state(7 / 3);
	// Kept apart from `or`, which rounds: writing a rounded value back would
	// stop the thumb from stepping where the odds ratio changes by less than 0.01.
	let orPos = $state(toPos(7 / 3));
	const orMode = $derived(measure === 'or');
	const counts = $derived<Counts>({
		control: input.control,
		treated: orMode ? treatedFor(input.control, or) : input.treated
	});
	function pick(m: Measure) {
		if (m === measure) return;
		if (m === 'or') {
			// The counts' exact OR, so the treated arm keeps its count until the
			// slider moves.
			or = effects(input.control / N, input.treated / N).or;
			orPos = toPos(or);
		} else if (orMode) input.treated = counts.treated;
		measure = m;
	}
	function onOrInput(e: Event & { currentTarget: HTMLInputElement }) {
		orPos = Number(e.currentTarget.value);
		or = fromPos(orPos);
	}

	const risk = $derived({ control: counts.control / N, treated: counts.treated / N });
	const remit = $derived(effects(risk.control, risk.treated));

	// Each view draws only each arm's own quantity (risks, or odds in the OR
	// view) and its equation does the comparing. Marking the RD's "extra"
	// remitters implied identifiable responders, which a parallel trial lacks.
	const dots = $derived(
		PATIENTS.map((p, i) => ({ id: p.id, cls: [remits(i, counts) ? 'event' : 'non'] }))
	);
	const shape = $derived<Shape>(orMode ? 'stacks' : 'block');

	// Switching between a block and the stacks pours the moving dots row by row;
	// slider steps are never delayed. `prevShape` is plain (not state): it
	// remembers the last shape seen.
	let prevShape: Shape = 'block';
	const delays = $derived.by(() => {
		const to = shape;
		const switched = to !== prevShape;
		prevShape = to;
		if (!switched) return undefined;
		const per = Object.fromEntries(
			ARMS.map((arm) => [arm, pourDelays(N, counts[arm], to, 110)])
		) as Record<Arm, number[]>;
		return PATIENTS.map((p) => per[p.arm][p.k]);
	});

	const f2 = format('.2f');
	const armLabel: Record<Arm, string> = { control: 'Control', treated: 'Treated' };
	const measures: { key: Measure; label: string }[] = [
		{ key: 'risk', label: 'Risks' },
		{ key: 'or', label: 'Odds' }
	];

	const oddsOf = (arm: Arm) => counts[arm] / (N - counts[arm]);
	// `widest`: the widest lhs and result each equation can show over the
	// sliders' ranges (fx gives "0.0025" at the smallest treated odds), so the
	// equations hold still while dragging (see .slot in odds.css).
	const equations = $derived({
		risk: [
			{
				label: 'Risk difference',
				lhs: `${f2(risk.treated)} − ${f2(risk.control)}`,
				result: f2(remit.rd),
				widest: ['0.00 − 0.00', '−0.00']
			},
			{
				label: 'Risk ratio',
				lhs: `${f2(risk.treated)} / ${f2(risk.control)}`,
				result: fx(remit.rr),
				widest: ['0.00 / 0.00', '0.000']
			}
		],
		// Written as the multiplication a logistic model's exp(coefficient) performs.
		or: [
			{
				label: 'Control odds × OR = treated odds',
				lhs: `${fx(oddsOf('control'))} × ${f2(or)}`,
				result: fx(odds(input.control / N) * or),
				widest: ['0.000 × 0.00', '0.0000']
			}
		]
	});

	const at = (x: number, y: number) => `translate(${x}px, ${y}px)`;
</script>

{#snippet segments(runs: Segments)}
	{#each runs as run, i (i)}{#if run.strong}<strong>{run.text}</strong>{:else}{run.text}{/if}{/each}
{/snippet}

<figure
	class={['card', 'wide', 'odds-fig', 'trial', { expanded }]}
	aria-labelledby={title ? `${uid}-title` : undefined}
>
	<ExpandButton bind:expanded label="trial figure" />
	{#if title}<p class="fig-title" id="{uid}-title">{title}</p>{/if}
	<div class="odds-controls">
		<div class="odds-group" role="group" aria-label="Effect measure">
			<span class="odds-label">Compare the arms by their</span>
			{#each measures as m (m.key)}
				<button
					type="button"
					class={['fig-pill', { on: measure === m.key }]}
					aria-pressed={measure === m.key}
					onclick={() => pick(m.key)}>{m.label}</button
				>
			{/each}
		</div>
		<div class="sliders">
			{#each ARMS as arm (arm)}
				{#if arm === 'treated' && orMode}
					<label class="odds-slider">
						<span class="odds-label">Odds ratio: multiplies the control odds</span>
						<input
							class="fig-range"
							type="range"
							min="0"
							max="1"
							step={1 / OR_STEPS}
							value={orPos}
							oninput={onOrInput}
							style="--pct: {orPos * 100}%"
							aria-valuetext="odds ratio {f2(or)}"
						/>
						<output>{f2(or)}</output>
					</label>
				{:else}
					<label class="odds-slider">
						<span class="odds-label">{armLabel[arm]}: patients who remit, of {N}</span>
						<input
							class="fig-range"
							type="range"
							min="1"
							max={N - 1}
							step="1"
							bind:value={input[arm]}
							style="--pct: {((counts[arm] - 1) / (N - 2)) * 100}%"
							aria-valuetext="{counts[arm]} of {N} {armLabel[arm].toLowerCase()} patients remit"
						/>
						<output>{counts[arm]}</output>
					</label>
				{/if}
			{/each}
		</div>
	</div>

	{#each GEOMS as g (g.variant)}
		{@const pos = layout(g, shape, counts)}
		{@const stacks = shape === 'stacks'}
		{#snippet labels()}
			<!-- Direct labels replace a legend, as on the risk and odds card: the
			     bracket marks each risk's denominator, every patient in the arm.
			     Each block fills from the bottom, so for 1-99 remitters the bottom
			     row holds remitters and the top row non-remitters. -->
			{#each ARMS as arm (arm)}
				{@const { cx, base } = g.arms[arm]}
				{@const half = gapOf(g) / 2 + 5 * g.s}
				{@const yCount = base + g.r + g.label + 2}
				{@const left = cx - 4.5 * g.s - g.r - 8}
				{@const right = cx + 4.5 * g.s + g.r + 8}
				{@const top = topOf(g, arm)}
				<text
					class="head"
					x={cx}
					y={top - 10}
					style:transform={at(0, headDrop(g, shape, counts, arm))}
					text-anchor="middle"
					font-size={g.font}>{armLabel[arm]}</text
				>
				<g aria-hidden="true" class="stack-labels">
					<path
						class={['bracket', { on: !stacks }]}
						d="M {left + 4} {top} H {left} V {base + g.r} H {left + 4}"
					/>
					<text
						class={['side', 'end', { on: !stacks }]}
						style:transform={at(left - 6, base - 4.5 * g.s)}
						dy="0.35em"
						font-size={g.label}>{N} patients</text
					>
					<text
						class={['side', { on: !stacks }]}
						style:transform={at(right, base)}
						dy="0.35em"
						font-size={g.label}>{counts[arm]} remitted</text
					>
					<text
						class={['side', { on: !stacks }]}
						style:transform={at(right, base - 9 * g.s)}
						dy="0.35em"
						font-size={g.label}>{N - counts[arm]} did not remit</text
					>
					<text
						class={['count', { on: stacks }]}
						style:transform={at(cx - half, yCount)}
						font-size={g.label}>{counts[arm]} remitted</text
					>
					<text
						class={['count', { on: stacks }]}
						style:transform={at(cx + half, yCount)}
						font-size={g.label}>{N - counts[arm]} did not remit</text
					>
					<text
						class={['to', { on: stacks }]}
						style:transform={at(cx, base - 1.5 * g.s)}
						font-size={g.label}>to</text
					>
				</g>
			{/each}
		{/snippet}
		<DotField
			variant={g.variant}
			width={g.W}
			height={g.H}
			r={g.r}
			{dots}
			{pos}
			{delays}
			label="Remission in the control and treated arms, 100 patients each"
			overlay={labels}
		/>
	{/each}

	<div class="equations" aria-live="polite">
		{#each equations[measure] as eq (eq.label)}
			<p class="equation">
				<span class="eq-label">{eq.label}</span>
				<span class="eq-body"
					><span class="slot lhs" data-widest={eq.widest[0]}><span>{eq.lhs}</span></span> =
					<strong class="slot" data-widest={eq.widest[1]}><span>{eq.result}</span></strong></span
				>
			</p>
		{/each}
	</div>
	<p class="fig-readout readout">
		{#each READOUT_GHOSTS as ghost, i (i)}
			<span aria-hidden="true" class="ghost">{@render segments(ghost)}</span>
		{/each}
		<span aria-live="polite"
			>{@render segments(trialReadout(counts.control, counts.treated, or, measure, N))}</span
		>
	</p>

	<figcaption>
		Each dot is a patient, 100 per arm. The risks view shows the two risks that the risk difference
		subtracts and the risk ratio divides. In the odds view each arm splits into remitters facing
		non-remitters, and the second slider sets the odds ratio: the treated arm changes so that its
		odds equal the control odds times that ratio. Switching views keeps the same patients, so all
		three measures describe one trial.
	</figcaption>
</figure>

<style>
	.trial {
		--fs-chrome: 22rem;
	}
	/* Drops onto the taller stack with the dots (see headDrop). */
	text.head {
		transition:
			transform 0.7s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.4s ease;
	}
	@media (prefers-reduced-motion: reduce) {
		text.head {
			transition: none;
		}
	}
	.sliders {
		display: flex;
		flex-wrap: wrap;
		gap: var(--odds-sp-2) 1.5rem;
		width: 100%;
	}
</style>
