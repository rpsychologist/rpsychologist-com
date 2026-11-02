<script module lang="ts">
	import { memoize } from '#lib/dots/memo.js';
	import { longestReadouts } from './oddsPhrase';
	import { facingStacks, pourDelays, stackBlock, type Pt } from '#lib/dots/grid.js';
	import { svgFont } from './type';

	type View = 'risk' | 'odds';

	interface Geom {
		variant: 'desktop' | 'mobile';
		W: number;
		H: number;
		r: number;
		s: number;
		/** Vertical center of the dot region. */
		cy: number;
		/** Direct labels (see svgFont). */
		label: number;
	}

	const GEOMS: Geom[] = [
		{
			variant: 'desktop',
			W: 640,
			H: 168,
			r: 6,
			s: 15,
			cy: 77.5,
			label: svgFont('desktop', 640, 'label')
		},
		{
			variant: 'mobile',
			W: 360,
			H: 146,
			r: 4.8,
			s: 12,
			cy: 66,
			label: svgFont('mobile', 360, 'label')
		}
	];
	const N = 100;

	const baseOf = (g: Geom) => g.cy + 4.5 * g.s;

	// Risk: one block, events along the bottom. Odds: it splits into facing
	// stacks on the same baseline (see facingStacks in #lib/dots/grid).
	function computeLayout(g: Geom, view: View, k: number): Pt[] {
		return view === 'risk'
			? stackBlock(N, g.W / 2, baseOf(g), g.s)
			: facingStacks(N, k, g.W / 2, baseOf(g), g.s, 2.5 * g.s);
	}
	const layout = memoize(
		(g: Geom, view: View, k: number) => `${g.variant}|${view}|${view === 'risk' ? '' : k}`,
		computeLayout
	);

	// Laid invisibly under the live readout so its box keeps one height while
	// the slider moves (the caption sits below it).
	const READOUT_GHOSTS = longestReadouts(N);
</script>

<script lang="ts">
	import { odds } from '#lib/stats/binary.js';
	import { decimal, riskOddsReadout } from './oddsPhrase';
	import DotField from './DotField.svelte';
	import ExpandButton from '#lib/components/ExpandButton.svelte';
	import './odds.css';

	let { title }: { title?: string } = $props();
	const uid = $props.id();
	let view = $state<View>('risk');
	let k = $state(30);
	let expanded = $state(false);

	const p = $derived(k / N);
	const o = $derived(odds(p));
	const dots = $derived(
		Array.from({ length: N }, (_, i) => ({ id: `d${i}`, cls: [i < k ? 'event' : 'non'] }))
	);

	// Switching views pours the moving dots row by row; slider steps are never
	// delayed. `prevView` is plain: it remembers the last view this derived saw.
	let prevView: View = 'risk';
	const delays = $derived.by(() => {
		const v = view;
		const switched = v !== prevView;
		prevView = v;
		return switched ? pourDelays(N, k, v === 'odds' ? 'stacks' : 'block', 110) : undefined;
	});
	const at = (x: number, y: number) => `translate(${x}px, ${y}px)`;
</script>

<figure
	class={['card', 'wide', 'odds-fig', 'riskodds', { expanded }]}
	aria-labelledby={title ? `${uid}-title` : undefined}
>
	<ExpandButton bind:expanded label="risk and odds figure" />
	{#if title}<p class="fig-title" id="{uid}-title">{title}</p>{/if}
	<div class="odds-controls">
		<div class="odds-group" role="group" aria-labelledby="{uid}-view">
			<span class="odds-label" id="{uid}-view">Summarize the group by</span>
			<button
				type="button"
				class={['fig-pill', { on: view === 'risk' }]}
				aria-pressed={view === 'risk'}
				onclick={() => (view = 'risk')}>Risk</button
			>
			<button
				type="button"
				class={['fig-pill', { on: view === 'odds' }]}
				aria-pressed={view === 'odds'}
				onclick={() => (view = 'odds')}>Odds</button
			>
		</div>
		<label class="odds-slider">
			<span class="odds-label">Patients who remit, of 100</span>
			<input
				class="fig-range"
				type="range"
				min="1"
				max="99"
				step="1"
				bind:value={k}
				style="--pct: {((k - 1) / 98) * 100}%"
				aria-valuetext="{k} of 100 remit"
			/>
			<output>{k}</output>
		</label>
	</div>

	<div class="dots">
		{#each GEOMS as g (g.variant)}
			{@const base = baseOf(g)}
			{@const half = 1.25 * g.s + 5 * g.s}
			{@const yCount = base + g.r + g.label + 2}
			{@const left = g.W / 2 - 4.5 * g.s - g.r - 8}
			{@const right = g.W / 2 + 4.5 * g.s + g.r + 8}
			{@const top = base - 9 * g.s - g.r}
			{#snippet labels()}
				<!-- Direct labels replace a legend and carry the counts the equations
				     divide. In the risk view the bracket marks the risk's denominator,
				     every patient; the odds view drops it. The
				     block fills from the bottom, so for 1-99 remitters the bottom row
				     always holds remitters and the top row non-remitters. -->
				<g aria-hidden="true" class="stack-labels">
					<path
						class={['bracket', { on: view === 'risk' }]}
						d="M {left + 4} {top} H {left} V {base + g.r} H {left + 4}"
					/>
					<text
						class={['side', 'end', { on: view === 'risk' }]}
						style:transform={at(left - 6, base - 4.5 * g.s)}
						dy="0.35em"
						font-size={g.label}>{N} patients</text
					>
					<text
						class={['side', { on: view === 'risk' }]}
						style:transform={at(right, base)}
						dy="0.35em"
						font-size={g.label}>{k} remitted</text
					>
					<text
						class={['side', { on: view === 'risk' }]}
						style:transform={at(right, base - 9 * g.s)}
						dy="0.35em"
						font-size={g.label}>{N - k} did not remit</text
					>
					<text
						class={['count', { on: view === 'odds' }]}
						style:transform={at(g.W / 2 - half, yCount)}
						font-size={g.label}>{k} remitted</text
					>
					<text
						class={['count', { on: view === 'odds' }]}
						style:transform={at(g.W / 2 + half, yCount)}
						font-size={g.label}>{N - k} did not remit</text
					>
					<text
						class={['to', { on: view === 'odds' }]}
						style:transform={at(g.W / 2, base - 1.5 * g.s)}
						font-size={g.label}>to</text
					>
				</g>
			{/snippet}
			<DotField
				variant={g.variant}
				width={g.W}
				height={g.H}
				r={g.r}
				{dots}
				pos={layout(g, view, k)}
				{delays}
				label="One group of 100 patients; filled dots remitted"
				overlay={labels}
			/>
		{/each}
	</div>

	<div class="equations">
		<p class={['equation', { off: view !== 'risk' }]}>
			<span class="eq-label">Risk</span>
			<span class="eq-body"
				><span class="slot lhs" data-widest="00 / {N}"><span>{k} / {N}</span></span> =
				<strong class="slot" data-widest="0.000"><span>{decimal(p)}</span></strong></span
			>
		</p>
		<p class={['equation', { off: view !== 'odds' }]}>
			<span class="eq-label">Odds</span>
			<span class="eq-body"
				><span class="slot lhs" data-widest="00 / 00"><span>{k} / {N - k}</span></span> =
				<strong class="slot" data-widest="0.000"><span>{decimal(o)}</span></strong></span
			>
		</p>
	</div>
	<p class="fig-readout readout">
		{#each READOUT_GHOSTS as t (t)}
			<span aria-hidden="true" class="ghost">{t}</span>
		{/each}
		<span aria-live="polite">{riskOddsReadout(k, N, view)}</span>
	</p>

	<figcaption>
		Each dot is a patient. Risk divides the remitters by everyone; odds divide them by those who did
		not remit.
	</figcaption>
</figure>

<style>
	.riskodds {
		--fs-chrome: 18rem;
	}
	/* Pills on their own row, as in TrialDots: beside the slider, its stacked
	   label left the pills, label, and track on three different lines. */
	.riskodds .odds-group {
		flex-basis: 100%;
	}
	/* Side by side on a phone too, so the two divisions read as a pair; they
	   fit down to a 360px screen. */
	@media (max-width: 40rem) {
		.riskodds .equations {
			column-gap: var(--odds-sp-2);
		}
		.riskodds .eq-body {
			font-size: 0.9rem;
		}
	}
</style>
