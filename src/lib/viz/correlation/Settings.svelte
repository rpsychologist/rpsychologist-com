<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import ColorInput from '../core/components/ColorInput.svelte';
	import Slider from '../core/components/Slider.svelte';
	import Toast from '../core/components/Toast.svelte';
	import { typedSettle } from '../core/util/typedInput';
	import { presetList } from './datasets';
	import { downloadCsv, parseCsvPoints } from './csv';
	import { LABEL_MAX, N_MAX, type CorrelationState } from './correlation.svelte';

	// Fixed full-height right drawer; structure and interaction rules copied from
	// the cohend drawer (the house template): numeric params live-apply on valid
	// input with commit-time feedback, section (?) popovers replace the old
	// guided tour, sticky Save/Clear/Reset footer.
	interface Props {
		model: CorrelationState;
		/** Open state, bindable so the close button can dismiss the panel. */
		open?: boolean;
	}

	// `open` is only ever written here (the drawer exists only while open), but
	// writes to a $bindable propagate to the parent; the rule can't see that.
	// eslint-disable-next-line no-useless-assignment
	let { model, open = $bindable(false) }: Props = $props();

	type NumKey = 'M0' | 'M1' | 'SD0' | 'SD1' | 'n';

	// SD bounds are exclusive at zero (a zero sigma divides by zero in the
	// standardization); n must be a positive integer, capped at N_MAX so the SVG
	// scatter stays smooth (see N_MAX).
	function outOfRange(key: NumKey, v: number): boolean {
		if (!Number.isFinite(v)) return true;
		if ((key === 'SD0' || key === 'SD1') && v <= 0) return true;
		if (key === 'n' && (v < 1 || v > N_MAX || !Number.isInteger(v))) return true;
		return false;
	}

	// Live-apply valid input; moments re-transform the sample (the old app's
	// explicit Update button is replaced by the cohend drawer's live
	// semantics). Typed digits settle via `typedSettle` before applying;
	// steppers/arrows stay immediate. Out-of-range keystrokes are ignored
	// silently — the user may be mid-typing — and the message fires on change
	// (blur/Enter).
	const settle = typedSettle();
	function applyNum(key: NumKey, v: number) {
		if (key === 'n') {
			model.p.n = v;
		} else {
			model.updateMoments({
				M0: model.p.M0,
				M1: model.p.M1,
				SD0: model.p.SD0,
				SD1: model.p.SD1,
				[key]: v
			});
		}
		if (fieldError?.key === key) fieldError = null;
	}
	function setNum(key: NumKey, e: Event & { currentTarget: HTMLInputElement }) {
		const v = e.currentTarget.valueAsNumber;
		if (outOfRange(key, v)) {
			settle.cancel(); // don't let an earlier valid keystroke land later
			return;
		}
		settle.run(e, () => applyNum(key, v));
	}

	let fieldError = $state<{ key: NumKey; msg: string } | null>(null);
	function rangeMsg(key: NumKey): string {
		switch (key) {
			case 'SD0':
			case 'SD1':
				return 'Standard deviations must be greater than 0.';
			case 'n':
				return `Sample size must be a whole number between 1 and ${N_MAX}.`;
			default:
				return 'Value must be a number.';
		}
	}
	function commitNum(key: NumKey, e: Event & { currentTarget: HTMLInputElement }) {
		const v = e.currentTarget.valueAsNumber;
		if (!outOfRange(key, v)) {
			settle.flush(); // Enter/blur applies a still-settling typed value now
			return;
		}
		settle.cancel();
		fieldError = { key, msg: rangeMsg(key) };
		e.currentTarget.value = String(model.p[key]);
	}

	// Transient confirmation, mirroring the old MUI snackbar; auto-dismisses.
	let toast = $state<{ msg: string; kind: 'status' | 'error' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout>;
	function flash(msg: string, kind: 'status' | 'error' = 'status') {
		toast = { msg, kind };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 2600);
	}
	function onSave() {
		const ok = model.save();
		flash(
			ok ? 'Settings saved in this browser' : "Couldn't save settings",
			ok ? 'status' : 'error'
		);
	}
	function onClear() {
		const ok = model.clearSaved();
		flash(ok ? 'Saved settings cleared' : "Couldn't clear settings", ok ? 'status' : 'error');
	}

	function onLoadCsv(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = ''; // allow re-loading the same file
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const parsed = parseCsvPoints(String(reader.result));
			if (parsed) {
				const { loaded, truncated } = model.loadCsv(parsed.points, parsed.xLabel, parsed.yLabel);
				flash(
					truncated
						? `Loaded the first ${loaded} of ${parsed.points.length} points from ${file.name} (capped at ${N_MAX})`
						: `Loaded ${loaded} points from ${file.name}`,
					truncated ? 'error' : 'status'
				);
			} else {
				flash('Could not read any (x, y) rows from that file', 'error');
			}
		};
		reader.onerror = () => flash('Could not read that file', 'error');
		reader.readAsText(file);
	}

	const slopeMode = $derived(model.p.plotType === 'slope');

	// Per-section help popovers (cohend pattern): one open at a time, closed on
	// Escape or pointerdown outside; the listener exists only while one is open.
	let openInfo = $state<string | null>(null);
	function toggleInfo(id: string) {
		openInfo = openInfo === id ? null : id;
	}
	$effect(() => {
		if (openInfo === null) return;
		const onDown = (e: PointerEvent) => {
			if (!(e.target as Element).closest('.info')) openInfo = null;
		};
		window.addEventListener('pointerdown', onDown);
		return () => window.removeEventListener('pointerdown', onDown);
	});

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (openInfo !== null) openInfo = null;
		else open = false;
	}

	let panel = $state<HTMLElement>();
	onMount(() => {
		panel?.focus();
		return () => {
			clearTimeout(toastTimer);
			// Escape-close mid-type: apply the typed value rather than drop it.
			settle.flush();
		};
	});
</script>

{#snippet numField(label: string, key: NumKey, min: number, step: number | string, max?: number)}
	<label class="field" class:invalid={fieldError?.key === key}>
		<span>{label}</span>
		<input
			type="number"
			value={model.p[key]}
			{min}
			{max}
			{step}
			aria-invalid={fieldError?.key === key}
			oninput={(e) => setNum(key, e)}
			onchange={(e) => commitNum(key, e)}
		/>
	</label>
	{#if fieldError?.key === key}
		<p class="field-error" role="alert">{fieldError.msg}</p>
	{/if}
{/snippet}

{#snippet sectionHead(title: string, id: string, text?: string)}
	<div class="group-head">
		<h3>{title}</h3>
		{#if text}
			<span class="info">
				<button
					type="button"
					class="info-btn"
					aria-label="About {title}"
					aria-expanded={openInfo === id}
					aria-controls="info-pop-{id}"
					onclick={() => toggleInfo(id)}
				>
					?
				</button>
				{#if openInfo === id}
					<span
						class="info-pop"
						id="info-pop-{id}"
						transition:fly={{ y: 4, duration: prefersReducedMotion.current ? 0 : 120 }}
					>
						{text}
					</span>
				{/if}
			</span>
		{/if}
	</div>
{/snippet}

<svelte:window onkeydown={onWindowKeydown} />

<aside
	bind:this={panel}
	class="settings-panel"
	aria-label="Visualization settings"
	tabindex="-1"
	transition:fly={{ x: 360, duration: prefersReducedMotion.current ? 0 : 200, easing: cubicOut }}
>
	<header class="panel-head">
		<h2>Settings</h2>
		<button
			class="close icon-btn"
			type="button"
			aria-label="Close settings"
			onclick={() => (open = false)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M18 6 6 18M6 6l12 12" />
			</svg>
		</button>
	</header>

	<section class="group">
		{@render sectionHead(
			'Data',
			'data',
			'Presets snap the correlation to a conventional benchmark (Cohen, 1988) by re-transforming the current sample; the Anscombe and Anscombosaurus presets load fixed datasets whose summary statistics hide very different shapes.'
		)}
		<label class="field select">
			<span>Preset</span>
			<!-- activePreset, not p.preset: the select only names a preset while the
			     state still matches it (see the derived's doc comment). The old app
			     claimed "Large" on a fresh load and kept names after edits. -->
			<select value={model.activePreset} onchange={(e) => model.setPreset(e.currentTarget.value)}>
				<option value="" disabled>—</option>
				{#each presetList as item (item.preset)}
					<option value={item.preset}>{item.label}</option>
				{/each}
			</select>
		</label>
		{@render numField('Sample size', 'n', 1, 1, N_MAX)}
		<button class="btn-outline" type="button" onclick={() => model.newSample()}>
			New sample
		</button>
	</section>

	<section class="group">
		{@render sectionHead(
			'Parameters',
			'params',
			'Population means and standard deviations the sample is re-transformed to match. After you drag, add, or delete points these snap to the observed sample moments.'
		)}
		{@render numField('Mean X', 'M0', 0, 'any')}
		{@render numField('SD X', 'SD0', 0, 'any')}
		{@render numField('Mean Y', 'M1', 0, 'any')}
		{@render numField('SD Y', 'SD1', 0, 'any')}
		<button
			class="btn-outline"
			type="button"
			title="Re-frame the axes around the current sample"
			onclick={() => model.rescale()}
		>
			Rescale plot
		</button>
	</section>

	<section class="group">
		{@render sectionHead(
			'Display',
			'display',
			'The slope chart redraws each (x, y) pair as a Pre–Post line. Ellipses mark the regions holding 50/80/95/99% of the fitted bivariate normal — click an ellipse to see its level (not while adding points).'
		)}
		<label class="check">
			<input
				type="checkbox"
				checked={slopeMode}
				onchange={() => (model.p.plotType = slopeMode ? 'scatter' : 'slope')}
			/>
			<span>Slope chart</span>
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={model.p.regressionLine} />
			<span>Regression line</span>
		</label>
		<label class="check" class:off={slopeMode}>
			<input type="checkbox" disabled={slopeMode} bind:checked={model.p.residuals} />
			<span>Residuals</span>
		</label>
		<label class="check" class:off={slopeMode}>
			<input type="checkbox" disabled={slopeMode} bind:checked={model.p.ellipses} />
			<span>Probability ellipses</span>
		</label>
		<label class="check">
			<input type="checkbox" bind:checked={model.p.showPointEdit} />
			<span>Edit points</span>
		</label>
	</section>

	<details class="group collapsible">
		<summary><h3>Labels &amp; color</h3></summary>
		<div class="collapsible-body">
			<!-- maxlength matches the restore validation (LABEL_MAX). -->
			<label class="field text">
				<span>X-axis</span>
				<input
					type="text"
					maxlength={LABEL_MAX}
					bind:value={model.p.xLabel}
					aria-label="x-axis label"
				/>
			</label>
			<label class="field text">
				<span>Y-axis</span>
				<input
					type="text"
					maxlength={LABEL_MAX}
					bind:value={model.p.yLabel}
					aria-label="y-axis label"
				/>
			</label>
			<!-- Old app picked an rgba; native color inputs carry no alpha, so the
			     fill opacity is a separate slider. -->
			<ColorInput label="Circles" bind:value={model.p.color} />
			<Slider
				label="Fill opacity"
				min={0}
				max={1}
				step={0.05}
				bind:value={model.p.colorAlpha}
				format={(v) => v.toFixed(2)}
			/>
		</div>
	</details>

	<details class="group collapsible">
		<summary><h3>Import &amp; export</h3></summary>
		<div class="collapsible-body">
			<button
				class="btn-outline"
				type="button"
				title="Export the plotted points to a CSV file"
				onclick={() => downloadCsv(model.p.data, model.p.xLabel, model.p.yLabel)}
			>
				Download CSV
			</button>
			<label class="btn-outline file-label">
				Load CSV…
				<input type="file" accept=".csv,text/csv" onchange={onLoadCsv} />
			</label>
			<p class="hint">
				First column = x, second = y; the header row becomes the axis labels. The file is read in
				your browser only — nothing is uploaded.
			</p>
		</div>
	</details>

	<section class="group actions">
		{#if toast}
			<div class="toast-slot">
				<Toast kind={toast.kind}>{toast.msg}</Toast>
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
		<button
			class="btn-primary"
			type="button"
			disabled={model.hasSaved && !model.isDirty}
			onclick={onSave}
		>
			{model.hasSaved ? 'Save changes' : 'Save to browser'}
		</button>
		<div class="minor-actions">
			<button
				class="btn-ghost"
				type="button"
				disabled={!model.hasSaved}
				title="Remove the settings saved in this browser"
				onclick={onClear}
			>
				Clear saved
			</button>
			<button
				class="btn-ghost"
				type="button"
				title="Restore the page-load sample and default settings"
				onclick={() => model.reset()}
			>
				Reset to defaults
			</button>
		</div>
	</section>
</aside>

<style>
	/* Drawer chrome copied from the cohend Settings (see that file for the
	   rationale comments); only correlation-specific bits differ below. */
	.settings-panel {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 0;
		z-index: 60;
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
		scrollbar-gutter: stable;
	}
	.settings-panel:focus {
		outline: none;
	}
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
		width: 30px;
		height: 30px;
		margin-right: -0.4rem;
		color: var(--muted);
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
	.group + .group {
		border-top: 1px solid var(--rule);
	}
	.group + .group:not(.actions) {
		margin-top: 0.85rem;
	}
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
	.field input,
	.field select {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--ink);
	}
	.field input[type='number'] {
		width: 4.2rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.field.select select {
		flex: 1;
		min-width: 0;
	}
	.field.text span {
		flex: 0 0 4.5rem;
	}
	.field.text input {
		flex: 1;
		min-width: 0;
		text-align: left;
	}
	.hint {
		margin: 0.1rem 0 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.field-error {
		margin: -0.15rem 0 0;
		font-size: 0.72rem;
		line-height: 1.3;
		color: #b3261e;
	}
	.field.invalid input {
		border-color: #b3261e;
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
	.check.off {
		color: var(--muted);
		cursor: default;
	}

	.btn-outline {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.btn-outline:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
	.file-label {
		position: relative;
		overflow: hidden;
	}
	.file-label input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

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
	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}
	.btn-primary:disabled {
		opacity: 0.4;
		cursor: default;
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

	.collapsible {
		gap: 0;
	}
	.collapsible summary {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
		list-style: none;
	}
	.collapsible summary::-webkit-details-marker {
		display: none;
	}
	.collapsible summary::before {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		border-right: 1.5px solid var(--muted);
		border-bottom: 1.5px solid var(--muted);
		transform: rotate(-45deg);
		transition: transform 0.15s;
	}
	.collapsible[open] summary::before {
		transform: rotate(45deg);
	}
	.collapsible summary h3 {
		margin: 0;
	}
	.collapsible-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.6rem;
	}
	/* On the details itself, not the body: the body only exists while open,
	   and a closed last section would sit flush against the actions footer. */
	.collapsible:last-of-type {
		padding-bottom: 0.85rem;
	}
	.save-status {
		margin: 0 0 0.1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.save-status.dirty {
		color: var(--ink);
	}
	.toast-slot {
		position: absolute;
		left: 1.1rem;
		right: 1.1rem;
		bottom: calc(100% + 0.4rem);
	}
</style>
