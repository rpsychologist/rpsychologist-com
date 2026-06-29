<script lang="ts">
	import { format } from 'd3-format';
	import Slider from '../core/components/Slider.svelte';
	import ColorInput from '../core/components/ColorInput.svelte';
	import { presets, type CohendState } from './cohend.svelte';

	// The settings panel (replaces the old MUI drawer). A native <details> keeps
	// it collapsible and accessible without a library. Parameter edits go through
	// the state's sync methods so Cohen's d and the means stay consistent.
	interface Props {
		model: CohendState;
		/** Open state, bindable so the control bar's gear icon can toggle it. */
		open?: boolean;
	}

	let { model, open = $bindable(false) }: Props = $props();

	const f0 = format('.0f');
	const presetNames = ['small', 'medium', 'large'] as const;
</script>

<details class="settings" bind:open>
	<summary>Settings</summary>

	<div class="grid">
		<Slider
			label="Mean 1 ({model.p.muZeroLabel})"
			id="cohend-m0"
			min={50}
			max={150}
			step={1}
			format={f0}
			bind:value={model.p.M0}
			oninput={() => model.syncFromMeans()}
		/>
		<Slider
			label="Mean 2 ({model.p.muOneLabel})"
			id="cohend-m1"
			min={50}
			max={150}
			step={1}
			format={f0}
			bind:value={model.p.M1}
			oninput={() => model.syncFromMeans()}
		/>
		<Slider
			label="Standard deviation"
			id="cohend-sd"
			min={1}
			max={40}
			step={1}
			format={f0}
			bind:value={model.p.SD}
			oninput={() => model.syncFromMeans()}
		/>
		<Slider
			label="Control event rate (%)"
			id="cohend-cer"
			min={1}
			max={99}
			step={1}
			format={f0}
			bind:value={model.p.CER}
		/>
	</div>

	<div class="row">
		<span class="row-label">Presets</span>
		{#each presetNames as name (name)}
			<button
				class={['fig-pill', { on: model.p.cohend === presets[name] }]}
				type="button"
				onclick={() => model.setPreset(name)}
			>
				{name} (d = {presets[name]})
			</button>
		{/each}
	</div>

	<div class="row">
		<span class="row-label">Labels</span>
		<input class="text-input" bind:value={model.p.muZeroLabel} aria-label="Group 1 label" />
		<input class="text-input" bind:value={model.p.muOneLabel} aria-label="Group 2 label" />
		<input
			class="text-input"
			bind:value={model.p.xLabel}
			placeholder="x-axis label"
			aria-label="x-axis label"
		/>
	</div>

	<div class="row">
		<span class="row-label">Colors</span>
		<ColorInput label={model.p.muZeroLabel} bind:value={model.p.colorDist1} />
		<ColorInput label="Overlap" bind:value={model.p.colorOverlap} />
		<ColorInput label={model.p.muOneLabel} bind:value={model.p.colorDist2} />
	</div>

	<div class="row">
		<button
			class={['fig-pill', { on: model.p.showDonuts }]}
			type="button"
			aria-pressed={model.p.showDonuts}
			onclick={() => (model.p.showDonuts = !model.p.showDonuts)}
		>
			Show effect-size gauges
		</button>
		<button class="fig-pill" type="button" onclick={() => model.save()}>Save</button>
		<button class="fig-pill" type="button" onclick={() => model.clearSaved()}>Clear saved</button>
		<button class="fig-pill" type="button" onclick={() => model.reset()}>Reset</button>
	</div>
</details>

<style>
	.settings {
		margin-top: 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		padding: 0 1rem;
	}
	.settings summary {
		padding: 0.7rem 0;
		font-weight: 600;
		cursor: pointer;
		color: var(--heading);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem 1.5rem;
		padding-bottom: 1rem;
	}
	@media (max-width: 36rem) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		padding-bottom: 1rem;
	}
	.row-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--muted);
		min-width: 4.5rem;
	}
	.text-input {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.35rem 0.55rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--ink);
		max-width: 9rem;
	}
</style>
