<script lang="ts">
	// Sticky parameter bar: μ and σ² sliders with paired number inputs and
	// snap-to-MLE buttons, plus New Sample. Sticks below the top of the
	// viewport from the tool onward (old app's sticky slider block).
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import { typedSettle } from '$lib/viz/core/util/typedInput';
	import { MU_MIN, MU_MAX, SIGMA2_MIN, SIGMA2_MAX } from './model';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

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

<div class="control-bar">
	<div class="param">
		<div class="param-head">
			<label for="likelihood-mu-num" class="param-label">
				Mean (<Tex math={String.raw`\mu`} />)
			</label>
			<input
				id="likelihood-mu-num"
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
			id="likelihood-mu"
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
			<label for="likelihood-sigma2-num" class="param-label">
				Variance (<Tex math={String.raw`\sigma^2`} />)
			</label>
			<input
				id="likelihood-sigma2-num"
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
			id="likelihood-sigma2"
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
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		backdrop-filter: blur(6px);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	@media (max-width: 48rem) {
		.control-bar {
			grid-template-columns: minmax(0, 1fr);
			align-items: stretch;
		}
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
</style>
