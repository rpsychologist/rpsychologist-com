<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ColorInput from '../core/components/ColorInput.svelte';
	import { presets, type CohendState } from './cohend.svelte';

	// Fixed full-height right drawer (like the original tool's MUI drawer). The
	// page reserves room for it (see .page.settings-open in +page.svelte).
	// Parameters are numeric inputs, not sliders, so every control fits. Edits go
	// through the state's sync methods so Cohen's d and the means stay consistent.
	interface Props {
		model: CohendState;
		/** Open state, bindable so the close button can dismiss the panel. */
		open?: boolean;
	}

	let { model, open = $bindable(false) }: Props = $props();

	const presetNames = ['small', 'medium', 'large'] as const;

	type NumKey = 'M0' | 'M1' | 'SD' | 'CER' | 'sliderMax' | 'sliderStep';

	// Controlled numeric input: write only a finite, in-range value. The HTML
	// min/max attributes don't clamp *typed* input, so we re-check them here —
	// otherwise SD=0 divides by zero (NaN chart) and M0>M1 yields a negative d.
	function setNum(
		key: NumKey,
		e: Event & { currentTarget: HTMLInputElement },
		min: number | undefined,
		max: number | undefined,
		sync?: () => void
	) {
		const v = e.currentTarget.valueAsNumber;
		if (!Number.isFinite(v)) return;
		if (min !== undefined && v < min) return;
		if (max !== undefined && v > max) return;
		model.p[key] = v;
		sync?.();
	}

	// Transient confirmation, mirroring the old MUI snackbar. aria-live announces
	// it to screen readers; it auto-dismisses.
	let toast = $state<{ msg: string; kind: 'ok' | 'err' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout>;
	function flash(msg: string, kind: 'ok' | 'err' = 'ok') {
		toast = { msg, kind };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 2600);
	}
	function onSave() {
		const ok = model.save();
		flash(ok ? 'Settings saved in this browser' : "Couldn't save settings", ok ? 'ok' : 'err');
	}
	function onClear() {
		const ok = model.clearSaved();
		flash(ok ? 'Saved settings cleared' : "Couldn't clear settings", ok ? 'ok' : 'err');
	}

	// Per-section help (replaces the removed guided tour). One popover open at a
	// time, keyed by section id; toggled by its (?) button. Closes on Escape or a
	// pointerdown outside any `.info` wrapper. The listeners only exist while a
	// popover is open, so there's no idle global handler.
	let openInfo = $state<string | null>(null);
	function toggleInfo(id: string) {
		openInfo = openInfo === id ? null : id;
	}
	$effect(() => {
		if (openInfo === null) return;
		const onDown = (e: PointerEvent) => {
			if (!(e.target as Element).closest('.info')) openInfo = null;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') openInfo = null;
		};
		window.addEventListener('pointerdown', onDown);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

{#snippet numField(
	label: string,
	key: NumKey,
	min: number | undefined,
	max: number | undefined,
	step: number | string,
	sync?: () => void
)}
	<label class="field">
		<span>{label}</span>
		<input
			type="number"
			value={model.p[key]}
			{min}
			{max}
			{step}
			oninput={(e) => setNum(key, e, min, max, sync)}
		/>
	</label>
{/snippet}

{#snippet sectionHead(title: string, id: string, text: string)}
	<div class="group-head">
		<h3>{title}</h3>
		<span class="info">
			<button
				type="button"
				class="info-btn"
				aria-label="About {title}"
				aria-expanded={openInfo === id}
				onclick={() => toggleInfo(id)}
			>
				?
			</button>
			{#if openInfo === id}
				<span class="info-pop" role="tooltip" transition:fly={{ y: 4, duration: 120 }}>
					{text}
				</span>
			{/if}
		</span>
	</div>
{/snippet}

<aside
	class="settings-panel"
	aria-label="Visualization settings"
	transition:fly={{ x: 360, duration: 200, easing: cubicOut }}
>
	<header class="panel-head">
		<h2>Settings</h2>
		<button class="close" type="button" aria-label="Close settings" onclick={() => (open = false)}>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M18 6 6 18M6 6l12 12" />
			</svg>
		</button>
	</header>

	<section class="group">
		{@render sectionHead(
			'Parameters',
			'params',
			"Set the means and standard deviation directly — Cohen's d updates to match. Control event rate is the baseline event proportion, used for number-needed-to-treat."
		)}
		{@render numField(`Mean 1 (${model.p.muZeroLabel})`, 'M0', 0, model.p.M1, 'any', () =>
			model.syncFromMeans()
		)}
		{@render numField(`Mean 2 (${model.p.muOneLabel})`, 'M1', model.p.M0, undefined, 'any', () =>
			model.syncFromMeans()
		)}
		{@render numField('Standard deviation', 'SD', 1, undefined, 'any', () => model.syncFromMeans())}
		{@render numField('Control event rate (%)', 'CER', 0, 100, 1)}
		<p class="hint">Tip: double-click the chart to rescale.</p>
	</section>

	<section class="group">
		{@render sectionHead(
			'Presets',
			'presets',
			'Snap d to a conventional benchmark: small = 0.2, medium = 0.5, large = 0.8 (Cohen, 1988).'
		)}
		<div class="segmented" role="group" aria-label="Effect-size presets">
			{#each presetNames as name (name)}
				<button
					class={['seg', { on: model.p.cohend === presets[name] }]}
					type="button"
					aria-pressed={model.p.cohend === presets[name]}
					onclick={() => model.setPreset(name)}
				>
					{name}
				</button>
			{/each}
		</div>
	</section>

	<section class="group">
		{@render sectionHead(
			'Labels',
			'labels',
			'Rename the two groups and the x-axis as shown on the chart.'
		)}
		<label class="field text">
			<span>Group 1</span>
			<input type="text" bind:value={model.p.muZeroLabel} aria-label="Group 1 label" />
		</label>
		<label class="field text">
			<span>Group 2</span>
			<input type="text" bind:value={model.p.muOneLabel} aria-label="Group 2 label" />
		</label>
		<label class="field text">
			<span>X-axis</span>
			<input type="text" bind:value={model.p.xLabel} aria-label="x-axis label" />
		</label>
	</section>

	<section class="group">
		{@render sectionHead(
			'Colors',
			'colors',
			'Fill colors for the two distributions and their overlap region.'
		)}
		<div class="colors">
			<ColorInput label={model.p.muZeroLabel} bind:value={model.p.colorDist1} />
			<ColorInput label="Overlap" bind:value={model.p.colorOverlap} />
			<ColorInput label={model.p.muOneLabel} bind:value={model.p.colorDist2} />
		</div>
	</section>

	<section class="group">
		{@render sectionHead(
			'Display',
			'display',
			'Toggle the effect-size gauges (Cohen’s U₃, % overlap, probability of superiority, NNT) shown beneath the chart.'
		)}
		<label class="check">
			<input type="checkbox" bind:checked={model.p.showDonuts} />
			<span>Effect-size gauges</span>
		</label>
	</section>

	<details class="group advanced">
		<summary><h3>Advanced — slider range</h3></summary>
		<div class="advanced-body">
			{@render numField('Max', 'sliderMax', 0.1, undefined, 'any')}
			{@render numField('Step size', 'sliderStep', 0.001, undefined, 'any')}
		</div>
	</details>

	<section class="group actions">
		{#if toast}
			<div
				class={['toast', toast.kind]}
				role="status"
				aria-live="polite"
				transition:fly={{ y: 12, duration: 180, easing: cubicOut }}
			>
				{toast.msg}
			</div>
		{/if}
		<p class="save-status" class:dirty={model.isDirty}>
			{#if model.isDirty}
				Unsaved changes
			{:else if model.hasSaved}
				Saved in this browser
			{:else}
				Not saved
			{/if}
		</p>
		<button class="btn-primary" type="button" onclick={onSave}>
			{model.hasSaved ? 'Update saved' : 'Save to browser'}
		</button>
		<div class="minor-actions">
			<button class="btn-ghost" type="button" disabled={!model.hasSaved} onclick={onClear}>
				Clear saved
			</button>
			<button class="btn-ghost" type="button" onclick={() => model.reset()}>Reset</button>
		</div>
	</section>
</aside>

<style>
	/* Fixed full-height drawer flush to the right edge (like the old MUI drawer).
	   The page reserves room for it only when the viewport margin can't already
	   hold it — see .page.settings-open in +page.svelte. */
	.settings-panel {
		/* Full-height drawer flush to the right edge. It covers the (non-sticky)
		   header when scrolled to the top — same as the original tool's drawer. */
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		z-index: 60;
		/* border-box so the rendered width equals --panel-w, which the page's
		   drawer-reservation math relies on to clear the viz. */
		box-sizing: border-box;
		width: var(--panel-w, 320px);
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 1rem 1.1rem 0;
		background: var(--panel);
		border-left: 1px solid var(--rule);
		box-shadow: var(--shadow-md);
		overflow-y: auto;
	}
	/* Small screens: a full-width temporary drawer you dismiss to see the viz. */
	@media (max-width: 48rem) {
		.settings-panel {
			width: 100%;
		}
	}
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.panel-head h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--heading);
	}
	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		margin-right: -0.4rem;
		border: none;
		background: none;
		color: var(--muted);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.close:hover {
		color: var(--accent);
	}
	.close svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.85rem;
	}
	/* Hairline divider between sections chunks the panel without the extra
	   whitespace that pure gaps would add (the panel is height-constrained). */
	.group + .group {
		border-top: 1px solid var(--rule);
	}
	/* Sticky footer: the panel scrolls but Save/Clear/Reset stay visible, so the
	   primary actions never fall below the fold on a short viewport. Negative
	   inline margins let its background + border span the panel's full width. */
	.actions {
		position: sticky;
		bottom: 0;
		margin: 0 -1.1rem;
		margin-top: auto;
		padding: 0.7rem 1.1rem 0.9rem;
		gap: 0.4rem;
		background: var(--panel);
		border-top: 1px solid var(--rule);
	}
	.group h3 {
		margin: 0;
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}
	.group-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	/* Section help popover (the (?) buttons). */
	.info {
		position: relative;
		display: inline-flex;
	}
	.info-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.05rem;
		height: 1.05rem;
		padding: 0;
		border: 1px solid var(--rule);
		border-radius: 50%;
		background: transparent;
		color: var(--muted);
		font-size: 0.7rem;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.info-btn:hover,
	.info-btn[aria-expanded='true'] {
		color: var(--accent);
		border-color: var(--accent);
	}
	.info-pop {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 70;
		width: 220px;
		padding: 0.55rem 0.7rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
		/* reset the inherited uppercase/spacing from the section <h3> context */
		font-size: 0.78rem;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: normal;
		text-transform: none;
		color: var(--ink);
	}
	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		font-size: 0.85rem;
		color: var(--ink);
	}
	.field input {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--ink);
		/* Snug to the digits (+ the native spinner) so the value sits near its
		   label rather than floating at the panel's edge. */
		width: 3.4rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	/* Fixed-width labels so every text input shares one left edge and one width
	   (otherwise the shorter "X-axis" label lets its input grow wider). */
	.field.text span {
		flex: 0 0 4.5rem;
	}
	.field.text input {
		flex: 1;
		min-width: 0;
		width: auto;
		text-align: left;
		font-variant-numeric: normal;
	}
	.hint {
		margin: 0.1rem 0 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
	/* One swatch per row so they don't wrap 2-then-1. */
	.colors {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	/* Segmented control: one row of three equal buttons (replaces the wrapping
	   pills). Neutral by default, accent only for the active one — keeps blue
	   meaning "selected" rather than colouring every control. */
	.segmented {
		display: flex;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.seg {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: none;
		border-left: 1px solid var(--rule);
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 500;
		text-transform: capitalize;
		line-height: 1.2;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.seg:first-child {
		border-left: none;
	}
	.seg:hover:not(.on) {
		color: var(--accent);
	}
	.seg.on {
		background: var(--accent);
		color: var(--on-accent);
	}

	.check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--ink);
		cursor: pointer;
	}
	.check input {
		width: 1rem;
		height: 1rem;
		accent-color: var(--accent);
		cursor: pointer;
	}

	/* Footer: Save is the one emphasized action; Clear/Reset stay quiet. */
	.btn-primary {
		padding: 0.5rem 0.85rem;
		border: 1px solid var(--accent);
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--on-accent);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.btn-primary:hover {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}
	.minor-actions {
		display: flex;
		gap: 0.25rem;
	}
	.btn-ghost {
		flex: 1;
		padding: 0.4rem 0.5rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.btn-ghost:hover:not(:disabled) {
		background: var(--accent-soft);
		color: var(--ink);
	}
	.btn-ghost:disabled {
		opacity: 0.4;
		cursor: default;
	}

	/* Advanced (rare slider max/step) collapsed by default so the common controls
	   dominate the first screen. The <details> marker is replaced by a chevron. */
	.advanced {
		gap: 0;
	}
	.advanced summary {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
		list-style: none;
	}
	.advanced summary::-webkit-details-marker {
		display: none;
	}
	.advanced summary::before {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		border-right: 1.5px solid var(--muted);
		border-bottom: 1.5px solid var(--muted);
		transform: rotate(-45deg);
		transition: transform 0.15s;
	}
	.advanced[open] summary::before {
		transform: rotate(45deg);
	}
	.advanced summary h3 {
		margin: 0;
	}
	.advanced-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.6rem;
	}
	.save-status {
		margin: 0 0 0.1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.save-status.dirty {
		color: var(--ink);
	}

	/* Transient save/clear confirmation (replaces the old MUI snackbar). Sits at
	   the top of the sticky footer, so it's always on screen when it fires. */
	.toast {
		margin-bottom: 0.2rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		font-weight: 500;
		text-align: center;
		background: var(--accent-soft);
		color: var(--accent);
	}
	.toast.err {
		background: color-mix(in srgb, red 14%, var(--panel));
		color: #b3261e;
	}
</style>
