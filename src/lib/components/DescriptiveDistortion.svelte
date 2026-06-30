<script lang="ts">
	import { format } from 'd3-format';
	import { computeDisparity, disparityDefaults, type DisparityParams } from '$lib/stats/scenarios';

	let fracHighA = $state(disparityDefaults.fracHighA);
	let fracHighB = $state(disparityDefaults.fracHighB);
	let adjust = $state(false);

	const params = $derived<DisparityParams>({ ...disparityDefaults, fracHighA, fracHighB });
	const r = $derived(computeDisparity(params));

	const shownA = $derived(adjust ? r.stdPrevA : r.prevA);
	const shownB = $derived(adjust ? r.stdPrevB : r.prevB);
	const shownGap = $derived(adjust ? r.adjustedGap : r.crudeGap);

	const pct = format('.0%');
	const pp = (v: number) => `${(v * 100).toFixed(1)} pp`;

	// Bar geometry: 0 at the baseline, axis top a little above the largest
	// possible prevalence so the bars use most of the track.
	const barMax = 0.65;
	const h = (p: number) => `${Math.min(100, (p / barMax) * 100)}%`;
</script>

<figure class="card dist">
	<div class="controls">
		<div class="sliders">
			<label>
				<span class="slabel">Community A — share on low income</span>
				<span class="sval">{pct(fracHighA)}</span>
				<input
					class="fig-range"
					type="range"
					min="0"
					max="1"
					step="0.01"
					bind:value={fracHighA}
					style="--pct: {fracHighA * 100}%"
					aria-label="Community A share on low income"
				/>
			</label>
			<label>
				<span class="slabel">Community B — share on low income</span>
				<span class="sval">{pct(fracHighB)}</span>
				<input
					class="fig-range"
					type="range"
					min="0"
					max="1"
					step="0.01"
					bind:value={fracHighB}
					style="--pct: {fracHighB * 100}%"
					aria-label="Community B share on low income"
				/>
			</label>
		</div>

		<div class="control-row">
			<button
				class={['fig-pill', { on: adjust }]}
				aria-pressed={adjust}
				onclick={() => (adjust = !adjust)}
			>
				Adjust for income
			</button>
			<span class="hint"
				>Try the extremes: Community A near 100%, Community B near 0%, then toggle.</span
			>
		</div>
	</div>

	<div
		class="chart"
		role="img"
		aria-label={`Community A ${pct(shownA)}, Community B ${pct(shownB)}, ${adjust ? 'adjusted' : 'observed'} gap ${pp(shownGap)}.`}
	>
		<div class="bars">
			<div class="bar-group">
				<div class="bar-track">
					<div class="bar a" style:height={h(shownA)}></div>
					{#if adjust}
						<div class="obs-line a" style:bottom={h(r.prevA)}></div>
					{/if}
				</div>
				<div class="bar-value">{pct(shownA)}</div>
				<div class="bar-label">Community A</div>
			</div>
			<div class="bar-group">
				<div class="bar-track">
					<div class="bar b" style:height={h(shownB)}></div>
					{#if adjust}
						<div class="obs-line b" style:bottom={h(r.prevB)}></div>
					{/if}
				</div>
				<div class="bar-value">{pct(shownB)}</div>
				<div class="bar-label">Community B</div>
			</div>
		</div>

		<div class={['gap', { adjusted: adjust }]}>
			<div class="gap-num">{pp(shownGap)}</div>
			<div class="gap-cap">
				{adjust ? 'adjusted gap' : 'observed gap'}
			</div>
			<div class="gap-was">{adjust ? `was ${pp(r.crudeGap)}` : ' '}</div>
		</div>
	</div>

	<p class="sentence">
		{#if adjust}
			The adjusted gap of <strong>{pp(r.adjustedGap)}</strong> is what the disparity <em>would</em>
			be if the two communities had the same income distribution — but they do not. Adjustment describes
			a population that does not exist; the disparity that actually exists is
			<strong>{pp(r.crudeGap)}</strong> (the dashed line marks where each community really sits).
		{:else}
			In the population as it is, the gap in gambling-related financial harm between the communities
			is <strong>{pp(r.crudeGap)}</strong>. This unadjusted quantity is what a descriptive study
			should report — the disparity that actually exists.
		{/if}
	</p>

	<figcaption>
		Adjusting for a covariate that is distributed differently across groups silently replaces the
		real disparity with a smaller one, and typically <em>understates</em> the disparity a descriptive
		question is meant to characterize (Lesko et al., 2022; Zalla et al., 2021).
	</figcaption>
</figure>

<style>
	.dist {
		margin: 2rem 0;
		padding: 1.25rem;
		box-shadow: var(--shadow);
	}
	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.sliders {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem 1.5rem;
	}
	.sliders label {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: baseline;
		gap: 0 0.5rem;
		font-size: 0.86rem;
		color: var(--ink);
	}
	.slabel {
		color: var(--muted);
	}
	.sval {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	/* Layout placement only; the slider's visual design comes from the shared
     .fig-range class in article.css. */
	.sliders .fig-range {
		grid-column: 1 / -1;
		margin-top: 0.35rem;
	}
	.control-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.hint {
		font-size: 0.82rem;
		color: var(--muted);
	}
	.chart {
		display: flex;
		align-items: flex-end;
		gap: 2.5rem;
		justify-content: center;
		padding: 0.5rem 0 0.25rem;
	}
	.bars {
		display: flex;
		gap: 1.5rem;
		align-items: flex-end;
	}
	.bar-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 78px;
	}
	.bar-track {
		position: relative;
		height: 168px;
		width: 60px;
		border-bottom: 2px solid var(--ink);
	}
	.bar {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		border-radius: 5px 5px 0 0;
		transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.bar.a {
		background: var(--flip-neg);
	}
	.bar.b {
		background: var(--accent);
	}
	.obs-line {
		position: absolute;
		left: -3px;
		width: calc(100% + 6px);
		height: 0;
		border-top: 2px dashed var(--ink);
		opacity: 0.55;
		transition: bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.bar-value {
		margin-top: 0.5rem;
		font-weight: 700;
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
	}
	.bar-label {
		font-size: 0.82rem;
		color: var(--muted);
	}
	.gap {
		text-align: center;
		min-width: 9rem;
	}
	.gap-num {
		font-size: 1.9rem;
		font-weight: 700;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}
	.gap-cap {
		font-size: 0.78rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.gap-was {
		margin-top: 0.3rem;
		min-height: 1.1em; /* reserve the line so toggling does not shift content */
		font-size: 0.82rem;
		color: var(--muted);
	}
	.sentence {
		margin: 1.25rem 0 0.5rem;
		min-height: 4.8rem; /* reserve for the longer adjusted wording */
		font-size: 0.98rem;
		line-height: 1.6;
	}
	figcaption {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.5;
		border-top: 1px solid var(--rule);
		padding-top: 0.6rem;
		margin-top: 0.5rem;
	}

	@media (max-width: 42rem) {
		.sliders {
			grid-template-columns: 1fr;
		}
		.chart {
			flex-direction: column;
			align-items: center;
			gap: 1.25rem;
		}
	}
</style>
