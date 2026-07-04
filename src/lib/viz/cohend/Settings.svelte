<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import ColorInput from '../core/components/ColorInput.svelte';
	import Toast from '../core/components/Toast.svelte';
	import { typedSettle } from '../core/util/typedInput';
	import { presets, LABEL_MAX, type CohendState } from './cohend.svelte';

	// Fixed full-height right drawer (like the original tool's MUI drawer). The
	// page reserves room for it (see .page.settings-open in +page.svelte).
	// Parameters are numeric inputs, not sliders, so every control fits. Edits go
	// through the state's sync methods so Cohen's d and the means stay consistent.
	interface Props {
		model: CohendState;
		/** Open state, bindable so the close button can dismiss the panel. */
		open?: boolean;
	}

	// `open` is only ever written here (the drawer exists only while open), but
	// writes to a $bindable propagate to the parent; the rule can't see that.
	// eslint-disable-next-line no-useless-assignment
	let { model, open = $bindable(false) }: Props = $props();

	const presetNames = ['small', 'medium', 'large'] as const;

	type NumKey = 'M0' | 'M1' | 'SD' | 'CER' | 'sliderMax' | 'sliderStep';

	// Range check shared by live input and commit. Every bound is inclusive
	// except SD's zero: the old app allowed any SD ≥ 0, but SD = 0 divides by
	// zero (NaN chart), so the zero bound is exclusive here.
	function outOfRange(
		key: NumKey,
		v: number,
		min: number | undefined,
		max: number | undefined
	): boolean {
		if (!Number.isFinite(v)) return true;
		if (min !== undefined && v < min) return true;
		if (max !== undefined && v > max) return true;
		return key === 'SD' && v === 0;
	}

	// Live-apply numeric input, but only a finite, in-range value. The HTML min/max
	// attributes don't clamp *typed* input, so we re-check here — otherwise SD=0
	// divides by zero (NaN chart) and M0>M1 yields a negative d. Out-of-range
	// keystrokes are ignored silently because the user may still be mid-typing
	// ("1" on the way to "125"); the explanatory message is deferred to `commitNum`.
	// Typed digits settle via `typedSettle` before applying; steppers/arrows
	// stay immediate.
	const settle = typedSettle();
	function setNum(
		key: NumKey,
		e: Event & { currentTarget: HTMLInputElement },
		min: number | undefined,
		max: number | undefined,
		sync?: () => void
	) {
		const v = e.currentTarget.valueAsNumber;
		if (outOfRange(key, v, min, max)) {
			settle.cancel(); // don't let an earlier valid keystroke land later
			return;
		}
		settle.run(e, () => {
			model.p[key] = v;
			if (fieldError?.key === key) fieldError = null;
			sync?.();
		});
	}

	// The constraints are intentional (the means stay ordered so Cohen's d can't go
	// negative, and SD stays positive). Validating per keystroke would flash
	// spurious errors while typing a valid target, so feedback fires on `change`
	// (blur/Enter): explain the rule and snap the field back to the last good value,
	// so a rejected entry can't sit there silently disagreeing with the chart.
	let fieldError = $state<{ key: NumKey; msg: string } | null>(null);
	function rangeMsg(key: NumKey): string {
		switch (key) {
			case 'M0':
				return `${model.p.muZeroLabel} mean must be between 0 and the ${model.p.muOneLabel} mean (${model.p.M1}).`;
			case 'M1':
				return `${model.p.muOneLabel} mean can't be below the ${model.p.muZeroLabel} mean (${model.p.M0}).`;
			case 'SD':
				return 'Standard deviation must be greater than 0.';
			case 'CER':
				return 'Control event rate must be between 0 and 100.';
			case 'sliderMax':
				return 'Slider max must be at least 0.1.';
			case 'sliderStep':
				return 'Step size must be at least 0.001.';
		}
	}
	function commitNum(
		key: NumKey,
		e: Event & { currentTarget: HTMLInputElement },
		min: number | undefined,
		max: number | undefined
	) {
		const v = e.currentTarget.valueAsNumber;
		if (!outOfRange(key, v, min, max)) {
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

	// Per-section help (replaces the removed guided tour). One popover open at a
	// time, keyed by section id; toggled by its (?) button. Closes on Escape or a
	// pointerdown outside any `.info` wrapper. The pointerdown listener only
	// exists while a popover is open, so there's no idle global handler.
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

	// Escape dismisses the innermost layer: an open help popover first, then the
	// drawer. The component only exists while the drawer is open, so the window
	// listener is scoped to it.
	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (openInfo !== null) openInfo = null;
		else open = false;
	}

	// Move focus into the drawer on open so keyboard/screen-reader users land in
	// what they just opened (the toggle button refocuses itself on close — see
	// CohendTool). Also stop a pending toast timeout from firing after unmount.
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

{#snippet numField(
	label: string,
	key: NumKey,
	min: number | undefined,
	max: number | undefined,
	step: number | string,
	sync?: () => void
)}
	<label class="field" class:invalid={fieldError?.key === key}>
		<span>{label}</span>
		<input
			type="number"
			value={model.p[key]}
			{min}
			{max}
			{step}
			aria-invalid={fieldError?.key === key}
			oninput={(e) => setNum(key, e, min, max, sync)}
			onchange={(e) => commitNum(key, e, min, max)}
		/>
	</label>
	{#if fieldError?.key === key}
		<p class="field-error" role="alert">{fieldError.msg}</p>
	{/if}
{/snippet}

{#snippet sectionHead(title: string, id: string, text?: string)}
	<div class="group-head">
		<h3>{title}</h3>
		<!-- Help is reserved for sections whose meaning isn't obvious from the label
		     (the stats behind Parameters/Presets, the gauges Display toggles). Labels
		     and Colors carry no popover — a `?` on every section would imply the panel
		     isn't self-explanatory. -->
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
					<!-- Click-toggled disclosure content (not role="tooltip", which implies
					     hover/focus triggering); it follows its button in DOM order, so
					     aria-expanded + reading order is the whole contract. -->
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
			'Parameters',
			'params',
			"Set the means and standard deviation directly — Cohen's d updates to match. Control event rate is the baseline event proportion, used only by the number-needed-to-treat gauge."
		)}
		{@render numField(`Mean 1 (${model.p.muZeroLabel})`, 'M0', 0, model.p.M1, 'any', () =>
			model.syncFromMeans()
		)}
		{@render numField(`Mean 2 (${model.p.muOneLabel})`, 'M1', model.p.M0, undefined, 'any', () =>
			model.syncFromMeans()
		)}
		{@render numField('Standard deviation', 'SD', 0, undefined, 'any', () => model.syncFromMeans())}
		{@render numField('Control event rate (%)', 'CER', 0, 100, 1)}
		<p class="hint">Tip: double-click the chart to recenter.</p>
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

	<!-- Presentation controls (labels, colors, gauge toggle) are collapsed together
	     so the statistical Parameters/Presets dominate the first screen. -->
	<details class="group collapsible">
		<summary><h3>Display settings</h3></summary>
		<div class="collapsible-body">
			<p class="sub">Labels</p>
			<!-- maxlength matches the share/restore validation (LABEL_MAX), so any
			     label typed here survives a link round-trip. -->
			<label class="field text">
				<span>Group 1</span>
				<input
					type="text"
					maxlength={LABEL_MAX}
					bind:value={model.p.muZeroLabel}
					aria-label="Group 1 label"
				/>
			</label>
			<label class="field text">
				<span>Group 2</span>
				<input
					type="text"
					maxlength={LABEL_MAX}
					bind:value={model.p.muOneLabel}
					aria-label="Group 2 label"
				/>
			</label>
			<label class="field text">
				<span>X-axis</span>
				<input
					type="text"
					maxlength={LABEL_MAX}
					bind:value={model.p.xLabel}
					aria-label="x-axis label"
				/>
			</label>

			<p class="sub">Colors</p>
			<div class="colors">
				<ColorInput label={model.p.muZeroLabel} bind:value={model.p.colorDist1} />
				<ColorInput label="Overlap" bind:value={model.p.colorOverlap} />
				<ColorInput label={model.p.muOneLabel} bind:value={model.p.colorDist2} />
			</div>

			<label class="check">
				<input type="checkbox" bind:checked={model.p.showDonuts} />
				<span>Effect-size gauges</span>
			</label>
			<p class="hint">
				Cohen’s U₃, % overlap, probability of superiority, and NNT, shown beneath the chart.
			</p>
		</div>
	</details>

	<details class="group collapsible">
		<summary><h3>Advanced — slider range</h3></summary>
		<div class="collapsible-body">
			{@render numField('Max', 'sliderMax', 0.1, undefined, 'any')}
			{@render numField('Step size', 'sliderStep', 0.001, undefined, 'any')}
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
				title="Restore every setting to its default value"
				onclick={() => model.reset()}
			>
				Reset to defaults
			</button>
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
		/* Reserve the scrollbar gutter permanently so opening a foldout (which tips
		   the panel into overflow) doesn't make a classic scrollbar appear and shove
		   all the content left. No-op where scrollbars are overlaid. */
		scrollbar-gutter: stable;
	}
	/* Programmatic focus target only (tabindex="-1"); not keyboard-reachable, so
	   no visible ring needed on the container itself. */
	.settings-panel:focus {
		outline: none;
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
	/* Box + accent hover from the global .icon-btn; close is a touch smaller and
	   sits muted by default, and pulls flush to the panel edge. */
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
	/* Hairline divider between sections chunks the panel without the extra
	   whitespace that pure gaps would add (the panel is height-constrained). The
	   margin balances the rule between the two sections — the group's padding-top
	   sits below the line, this margin above it — so the divider stops hugging the
	   section above. `:not(.actions)` preserves the sticky footer's margin-top:auto. */
	.group + .group {
		border-top: 1px solid var(--rule);
	}
	.group + .group:not(.actions) {
		margin-top: 0.85rem;
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
	/* Validation feedback for a rejected numeric entry (e.g. Treatment < Control). */
	.field-error {
		margin: -0.15rem 0 0;
		font-size: 0.72rem;
		line-height: 1.3;
		color: #b3261e;
	}
	.field.invalid input {
		border-color: #b3261e;
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

	/* Collapsible sections (Display settings, Advanced) closed by default so the
	   statistical controls dominate the first screen. The <details> marker is
	   replaced by a chevron. */
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
	/* Advanced is the last foldout, so when the panel scrolls (the footer's
	   margin-top:auto collapses) its open body would sit flush against the sticky
	   footer. Give that body room to breathe. Scoped to the last collapsible so the
	   Display→Advanced divider keeps its symmetric spacing. */
	.collapsible:last-of-type .collapsible-body {
		padding-bottom: 0.85rem;
	}
	/* Sub-group labels inside Display settings (Labels / Colors). */
	.sub {
		margin: 0.5rem 0 0;
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}
	.collapsible-body > .sub:first-child {
		margin-top: 0;
	}
	.save-status {
		margin: 0 0 0.1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.save-status.dirty {
		color: var(--ink);
	}

	/* Transient save/clear confirmation (replaces the old MUI snackbar). The card
	   itself is the shared core Toast; this slot floats it just above the sticky
	   footer's top border, anchored to .actions (which is `position: sticky`, so
	   it's the containing block). Out of normal flow so it never reflows the
	   footer — otherwise its appearance shoves the divider up. */
	.toast-slot {
		position: absolute;
		left: 1.1rem;
		right: 1.1rem;
		bottom: calc(100% + 0.4rem);
	}
</style>
