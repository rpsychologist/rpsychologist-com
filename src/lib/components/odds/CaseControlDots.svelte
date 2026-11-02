<script module lang="ts">
	import { facingStacks, type Pt } from '#lib/dots/grid.js';
	import { effectsFromCounts } from '#lib/stats/binary.js';
	import { ARMS, type Arm } from '#lib/stats/oddsScenario.js';
	import { decimal } from './oddsPhrase';
	import { svgFont } from './type';

	type Counts = Record<Arm, number>;

	interface Geom {
		variant: 'desktop' | 'mobile';
		W: number;
		H: number;
		r: number;
		s: number;
		/** Headings; direct labels use `label` (see svgFont). */
		font: number;
		label: number;
		/** Each arm's center and baseline (the bottom row of dots). */
		arms: Record<Arm, { cx: number; base: number }>;
	}

	// TrialDots' odds view (dot size and spacing), so the reader meets the same
	// facing stacks.
	const GEOMS: Geom[] = [
		{
			variant: 'desktop',
			W: 640,
			H: 137,
			r: 4.8,
			s: 12,
			font: svgFont('desktop', 640, 'title'),
			label: svgFont('desktop', 640, 'label'),
			arms: { control: { cx: 160, base: 115 }, treated: { cx: 480, base: 115 } }
		},
		{
			variant: 'mobile',
			W: 360,
			H: 307,
			r: 5,
			s: 13,
			font: svgFont('mobile', 360, 'title'),
			label: svgFont('mobile', 360, 'label'),
			arms: { control: { cx: 180, base: 129 }, treated: { cx: 180, base: 280 } }
		}
	];
	const N = 100;
	const gapOf = (g: Geom) => 2.5 * g.s;

	/** The running trial: 30 of 100 control and 50 of 100 treated patients remit. */
	const REMIT: Counts = { control: 30, treated: 50 };
	const NON: Counts = { control: N - REMIT.control, treated: N - REMIT.treated };
	/** Rows of 10 in an arm's non-remitter stack, the taller of its two. */
	const rowsOf = (arm: Arm) => Math.ceil(NON[arm] / 10);
	const ROWS = Math.max(...ARMS.map(rowsOf));

	/** `k` is the patient's position within their arm: the first `REMIT[arm]` remit. */
	const PATIENTS = ARMS.flatMap((arm) =>
		Array.from({ length: N }, (_, k) => ({ id: `${arm}-${k}`, arm, k }))
	);

	// Sampling changes only classes, never positions, so each layout is fixed.
	const FIELDS = GEOMS.map((g) => {
		const stacks = Object.fromEntries(
			ARMS.map((arm) => {
				const { cx, base } = g.arms[arm];
				return [arm, facingStacks(N, REMIT[arm], cx, base, g.s, gapOf(g))];
			})
		) as Record<Arm, Pt[]>;
		return { g, pos: PATIENTS.map((p) => stacks[p.arm][p.k]) };
	});

	// The slider keeps tenths of the non-remitters: 7 and 5 per tenth, so every
	// kept count is a whole patient and the odds ratio is exact at every stop.
	const TENTHS = 10;

	/** The odds and risk ratios with `non` non-remitters kept per arm. */
	function ratios(non: Counts) {
		return effectsFromCounts({
			e1: REMIT.treated,
			n1: REMIT.treated + non.treated,
			e0: REMIT.control,
			n0: REMIT.control + non.control
		});
	}
	const FULL = ratios(NON);

	// Treated over control, each kept count written as the share (#0, #1: one
	// slot per place, as TexLive requires) times the arm's non-remitters, so
	// the reader sees the share cancel in the odds ratio and not in the risk
	// ratio. Exact counts, not rounded odds, so the quotient matches #2.
	const keptTex = (arm: Arm, k: 0 | 1) => String.raw`#${k} \times ${NON[arm]}`;
	const RATIO_TEX = {
		or: String.raw`\dfrac{${REMIT.treated} \,/\, (${keptTex('treated', 0)})}{${REMIT.control} \,/\, (${keptTex('control', 1)})} = #2`,
		rr: String.raw`\dfrac{${REMIT.treated} \,/\, (${REMIT.treated} + ${keptTex('treated', 0)})}{${REMIT.control} \,/\, (${REMIT.control} + ${keptTex('control', 1)})} = #2`
	};
	/** The share kept, as the formula and readout print it: "0.2". */
	const shareOf = (tenths: number) => (tenths / TENTHS).toFixed(1);
	const noteOf = (full: string, biased: boolean) =>
		`All ${2 * N} patients: ${full}${biased ? "; the sample's is biased toward 1" : ', the same'}`;
	const ARM_LABEL: Record<Arm, string> = { control: 'Untreated', treated: 'Treated' };

	const oddsOf = (arm: Arm, non: number) => decimal(REMIT[arm] / non);

	/**
	 * One wording at every setting, so dragging changes only the numbers; the
	 * equations above carry the two ratios.
	 */
	function readout(tenths: number): string {
		const keptOf = (arm: Arm) => (NON[arm] * tenths) / TENTHS;
		const factor = TENTHS / tenths;
		const shift = (arm: Arm) => `${oddsOf(arm, NON[arm])}\u00a0→\u00a0${oddsOf(arm, keptOf(arm))}`;
		// "1/0.2 = 5" ties the factor to the share in the formula above.
		return `Keeping ${tenths * 10}% of the non-remitters multiplies both groups' odds by 1/${shareOf(tenths)}\u00a0=\u00a0${Number.isInteger(factor) ? factor : decimal(factor)}: untreated ${shift('control')}, treated ${shift('treated')}.`;
	}
	// Laid invisibly under the live readout so its box keeps one height; all
	// ten, since the longest string need not wrap to the most lines.
	const READOUT_GHOSTS = Array.from({ length: TENTHS }, (_, i) => readout(i + 1));
</script>

<script lang="ts">
	import ExpandButton from '#lib/components/ExpandButton.svelte';
	import TexLive from '#lib/components/TexLive.svelte';
	import DotField from './DotField.svelte';
	import './odds.css';

	let { title }: { title?: string } = $props();
	const uid = $props.id();

	let tenths = $state(TENTHS);
	let expanded = $state(false);

	const kept = $derived<Counts>({
		control: (NON.control * tenths) / TENTHS,
		treated: (NON.treated * tenths) / TENTHS
	});
	const sample = $derived(ratios(kept));
	const share = $derived(shareOf(tenths));
	// The sample's risk ratio is marked once it leaves the trial's, shown below it.
	const equations = $derived(
		(['or', 'rr'] as const).map((key) => ({
			label: key === 'or' ? 'Odds ratio' : 'Risk ratio',
			math: RATIO_TEX[key],
			values: [share, share, decimal(sample[key])],
			full: decimal(FULL[key]),
			canBias: key === 'rr',
			bad: key === 'rr' && tenths < TENTHS
		}))
	);

	// A non-remitter sits in right-stack slot N - 1 - k (slot 0 is bottom left;
	// see facingStacks), so the kept ones fill the bottom and the stack shrinks
	// from the top, leaving the rest as faint dots.
	const dots = $derived(
		PATIENTS.map(({ id, arm, k }) => {
			if (k < REMIT[arm]) return { id, cls: ['event'] };
			const slot = N - 1 - k;
			return { id, cls: slot < kept[arm] ? ['non'] : ['non', 'faded'] };
		})
	);
</script>

<figure
	class={['card', 'wide', 'odds-fig', 'casecontrol', { expanded }]}
	aria-labelledby={title ? `${uid}-title` : undefined}
>
	<ExpandButton bind:expanded label="case-control figure" />
	{#if title}<p class="fig-title" id="{uid}-title">{title}</p>{/if}
	<div class="odds-controls">
		<label class="odds-slider">
			<span class="odds-label">Controls (non-remitters) kept in the sample</span>
			<input
				class="fig-range"
				type="range"
				min="1"
				max={TENTHS}
				step="1"
				bind:value={tenths}
				style="--pct: {((tenths - 1) / (TENTHS - 1)) * 100}%"
				aria-valuetext="{tenths * 10}% of non-remitters kept"
			/>
			<output>{tenths * 10}%</output>
		</label>
	</div>

	{#each FIELDS as { g, pos } (g.variant)}
		{#snippet labels()}
			{#each ARMS as arm (arm)}
				{@const { cx, base } = g.arms[arm]}
				{@const half = gapOf(g) / 2 + 5 * g.s}
				{@const yCount = base + g.r + g.label + 2}
				{@const yTop = (rows: number) => base - (rows - 1) * g.s - g.r - 6}
				<!-- Side by side, both titles clear the taller arm; stacked, each sits on its own. -->
				<text
					class="head"
					x={cx}
					y={yTop(g.variant === 'desktop' ? ROWS : rowsOf(arm)) - g.font - 8}
					text-anchor="middle"
					font-size={g.font}>{ARM_LABEL[arm]}</text
				>
				<text class="to" x={cx} y={base - 1.5 * g.s} text-anchor="middle" font-size={g.label}
					>to</text
				>
				<!-- Direct labels replace a legend, as on the trial card. The controls'
				     label tops the full stack, so it stays put as the slider fades dots. -->
				<g aria-hidden="true" class="stack-labels">
					<text class="count on" x={cx - half} y={yCount} font-size={g.label}
						>{REMIT[arm]} remitted</text
					>
					<text class="count on" x={cx + half} y={yCount} font-size={g.label}
						>{kept[arm]} did not remit</text
					>
					<text
						class="count on role"
						x={cx - half}
						y={yTop(Math.ceil(REMIT[arm] / 10))}
						font-size={g.label}>cases</text
					>
					<text class="count on role" x={cx + half} y={yTop(rowsOf(arm))} font-size={g.label}
						>controls</text
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
			label="Each group's remitters (cases) and non-remitters (controls) as facing stacks; faint dots are controls left out of the sample"
			overlay={labels}
		/>
	{/each}

	<div class="equations" aria-live="polite">
		{#each equations as eq (eq.label)}
			<p class="equation">
				<span class="eq-label">{eq.label}</span>
				<span class={['eq-body', 'ratio', { neg: eq.bad }]}>
					<!-- The MathML already reads top over bottom; the arms are for the eye. -->
					<span class="rows" aria-hidden="true"
						><span>{ARM_LABEL.treated}</span><span>{ARM_LABEL.control}</span></span
					>
					<TexLive math={eq.math} values={eq.values} />
				</span>
				<!-- The verdict labels the red result. Fewer non-remitters push both
				     sample risks toward 1, so the risk ratio falls toward 1. -->
				<span class="eq-note readout">
					{#if eq.canBias}
						<span aria-hidden="true" class="ghost">{noteOf(eq.full, true)}</span>
					{/if}
					<span>{noteOf(eq.full, eq.bad)}</span>
				</span>
			</p>
		{/each}
	</div>

	<p class="fig-readout readout">
		{#each READOUT_GHOSTS as t (t)}
			<span aria-hidden="true" class="ghost">{t}</span>
		{/each}
		<span aria-live="polite">{readout(tenths)}</span>
	</p>

	<figcaption>
		Each dot is a patient. Every remitter (case) is kept, but only some of the non-remitters
		(controls); the faint dots are the non-remitters left out. Treated and untreated patients keep
		the same share of their non-remitters, in steps of 10% so that each keeps whole patients, and
		both ratios are computed from the patients kept.
	</figcaption>
</figure>

<style>
	.casecontrol {
		--fs-chrome: 20rem;
	}
	text.to,
	text.role {
		font-style: italic;
	}
	/* KaTeX enlarges its text by 1.21, and the shared .eq-body line height
	   would clip a stacked fraction. */
	.equation .ratio {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.15rem;
		line-height: normal;
	}
	/* Stretched to the fraction's height, so each label sits beside its row. */
	.rows {
		align-self: stretch;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: flex-end;
		font-size: 0.75rem;
		color: var(--muted);
	}
	@media (max-width: 40rem) {
		.equation .ratio {
			font-size: 1rem;
		}
	}
	/* The risk ratio's row labels and fraction need ~340px. */
	@media (max-width: 22.5rem) {
		.equation .ratio {
			font-size: 0.85rem;
		}
	}
	.ratio :global(.tex-v2) {
		font-weight: 700;
		transition: color 0.3s ease;
	}
	.ratio.neg :global(.tex-v2) {
		color: var(--flip-neg);
	}
	.eq-note {
		text-align: center;
		font-size: 0.8rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
</style>
