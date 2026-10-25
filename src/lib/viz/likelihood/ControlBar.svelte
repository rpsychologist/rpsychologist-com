<script lang="ts">
	// Sticky parameter bar: μ and σ² sliders with paired number inputs and
	// snap-to-MLE buttons, plus New Sample. Sticks below the top of the
	// viewport from the tool onward (old app's sticky slider block).
	import Slider from '#lib/viz/core/components/Slider.svelte';
	import Tex from '#lib/components/Tex.svelte';
	import { typedSettle } from '#lib/viz/core/util/typedInput.js';
	import { MU_MIN, MU_MAX, SIGMA2_MIN, SIGMA2_MAX } from './model';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
		/** Rendered height, so instrument headers can pin just below the bar. */
		height?: number;
		/** Appended to element ids when a second bar is shown (the full view),
		 * so the page never has duplicate ids. */
		idSuffix?: string;
		/** Rendered as the top row of a full view, not over page prose. */
		inFull?: boolean;
	}
	let { model, height = $bindable(0), idSuffix = '', inFull = false }: Props = $props();

	// Not d3-format: its U+2212 minus blanks <input type=number> (house gotcha).
	const fIn = (v: number) => String(Number(v.toFixed(2)));
	const settle = typedSettle();
	let muFocused = $state(false);
	let s2Focused = $state(false);

	let dragStartX = 0;

	function applyNum(which: 'mu' | 'sigma2', e: Event & { currentTarget: HTMLInputElement }) {
		const v = e.currentTarget.valueAsNumber;
		if (!Number.isFinite(v)) {
			settle.cancel();
			return;
		}
		settle.run(e, () => (which === 'mu' ? model.setMu(v) : model.setSigma2(v)));
	}
</script>

<div class="control-bar" class:in-full={inFull} bind:offsetHeight={height}>
	<div class="param">
		<div class="param-head">
			<label for="likelihood-mu-num{idSuffix}" class="param-label">
				<span class="long">Mean (</span><Tex math={String.raw`\mu`} /><span class="long">)</span>
			</label>
			<input
				id="likelihood-mu-num{idSuffix}"
				class="card-sm"
				type="number"
				min={MU_MIN}
				max={MU_MAX}
				step="0.1"
				value={muFocused ? model.p.mu : fIn(model.p.mu)}
				onfocus={() => (muFocused = true)}
				onblur={() => (muFocused = false)}
				oninput={(e) => applyNum('mu', e)}
				onchange={() => settle.flush()}
			/>
			<button
				class="mle-btn"
				title="Set μ to the maximum likelihood estimate"
				onclick={() => model.snapTo('mu')}>MLE</button
			>
		</div>
		<Slider
			id="likelihood-mu{idSuffix}"
			ariaLabel="Mean"
			min={MU_MIN}
			max={MU_MAX}
			step={0.1}
			bind:value={model.p.mu}
			oninput={() => model.setMu(model.p.mu, model.immediate)}
			onpointerdown={(e) => {
				dragStartX = e.clientX;
				model.immediate = false;
			}}
			onpointermove={(e) => {
				if (Math.abs(e.clientX - dragStartX) > 4) model.immediate = true;
			}}
			onpointerup={() => (model.immediate = false)}
		/>
	</div>

	<div class="param">
		<div class="param-head">
			<label for="likelihood-sigma2-num{idSuffix}" class="param-label">
				<span class="long">Variance (</span><Tex math={String.raw`\sigma^2`} /><span class="long"
					>)</span
				>
			</label>
			<input
				id="likelihood-sigma2-num{idSuffix}"
				class="card-sm"
				type="number"
				min={SIGMA2_MIN}
				max={SIGMA2_MAX}
				step="0.1"
				value={s2Focused ? model.p.sigma2 : fIn(model.p.sigma2)}
				onfocus={() => (s2Focused = true)}
				onblur={() => (s2Focused = false)}
				oninput={(e) => applyNum('sigma2', e)}
				onchange={() => settle.flush()}
			/>
			<button
				class="mle-btn"
				title="Set σ² to the maximum likelihood estimate"
				onclick={() => model.snapTo('sigma2')}>MLE</button
			>
		</div>
		<Slider
			id="likelihood-sigma2{idSuffix}"
			ariaLabel="Variance"
			min={SIGMA2_MIN}
			max={SIGMA2_MAX}
			step={0.1}
			bind:value={model.p.sigma2}
			oninput={() => model.setSigma2(model.p.sigma2, model.immediate)}
			onpointerdown={(e) => {
				dragStartX = e.clientX;
				model.immediate = false;
			}}
			onpointermove={(e) => {
				if (Math.abs(e.clientX - dragStartX) > 4) model.immediate = true;
			}}
			onpointerup={() => (model.immediate = false)}
		/>
	</div>

	<button class="sample-btn" onclick={() => model.newSample()}>New Sample</button>
</div>

<style>
	.control-bar {
		position: sticky;
		top: 0;
		z-index: 40;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
		gap: 1rem 1.5rem;
		align-items: end;
		padding: 0.7rem 0.9rem;
		margin-bottom: 1rem;
		/* Opaque on purpose: the bar pins over body text, and every translucent
		   treatment (color-mix + backdrop-filter) ghosted the prose through it on
		   some browsers. Legibility of pinned controls must not depend on
		   effects support. */
		background: var(--bg);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	.control-bar.in-full {
		margin-bottom: 0;
		border-width: 0 0 1px;
		border-radius: 0;
	}
	.param {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.param-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.param-head input {
		width: 5.4rem;
		font: inherit;
		padding: 0.2rem 0.45rem;
		color: var(--ink);
	}
	.mle-btn {
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.mle-btn:hover {
		color: var(--viz-accent);
		border-color: var(--viz-accent);
	}
	.sample-btn {
		padding: 0.45rem 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.sample-btn:hover {
		color: var(--viz-accent);
		border-color: var(--viz-accent);
	}
	/* Phones and small tablets: the bar pins through two sections, so it is
	   kept short (symbol labels, each head on one line) but edge to edge, with
	   each slider at full width for precision. New Sample sits at the right of
	   the μ head row. */
	@media (max-width: 48rem) {
		.control-bar {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.35rem;
			align-items: stretch;
			padding: 0.45rem 0.9rem;
			margin-inline: calc(50% - 50vw);
			border-width: 0 0 1px;
			border-radius: 0;
		}
		.long {
			display: none;
		}
		.param {
			gap: 0.15rem;
		}
		.param-head {
			font-size: 0.85rem;
		}
		.param-head input {
			width: 4.5rem;
			padding: 0.15rem 0.3rem;
		}
		.sample-btn {
			position: absolute;
			top: 0.45rem;
			right: 0.9rem;
			padding: 0.2rem 0.75rem;
			font-size: 0.85rem;
		}
	}
</style>
