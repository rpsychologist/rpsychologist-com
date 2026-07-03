<script lang="ts">
	import { format } from 'd3-format';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { downloadSvg } from '$lib/viz/core/util/svgExport';
	import Overlap from './Overlap.svelte';
	import Donuts from './Donuts.svelte';
	import Settings from './Settings.svelte';
	import ShareDialog from './ShareDialog.svelte';
	import type { CohendState } from './cohend.svelte';

	// The interactive Cohen's d tool: control bar (d input + settings/download/share
	// icons), slider, overlap chart, donut gauges, plus the settings drawer and share
	// dialog. Shared by the full `/cohend` page and the chrome-free `/cohend/embed`
	// route. `minimal` drops the control bar, settings drawer, and share dialog,
	// leaving just the slider + chart + gauges (the embed view). `settingsOpen` is
	// bindable so the full page can shift its layout when the drawer opens.
	interface Props {
		model: CohendState;
		minimal?: boolean;
		settingsOpen?: boolean;
	}
	let { model, minimal = false, settingsOpen = $bindable(false) }: Props = $props();

	const d2 = format('.2f');
	let svg = $state<SVGSVGElement>();
	let shareOpen = $state(false);
	let dragStartX = 0;

	// The drawer moves focus into itself on open; when it closes (close button
	// or Escape) return focus here so keyboard focus isn't dropped on <body>.
	let settingsBtn = $state<HTMLButtonElement>();
	let wasSettingsOpen = false;
	$effect(() => {
		if (wasSettingsOpen && !settingsOpen) settingsBtn?.focus();
		wasSettingsOpen = settingsOpen;
	});

	function download() {
		if (svg) downloadSvg(svg, 'rpsychologist-cohend.svg');
	}
</script>

<!-- The tool shares one accent: the overlap teal, not the royal site accent.
     display:contents so the wrapper retints without adding a box that would alter
     layout or trap the fixed settings drawer. -->
<div class="viz-tool">
	{#if !minimal}
		<div class="control-bar">
			<label class="d-input">
				<span>Cohen's <em>d</em></span>
				<input
					class="card-sm"
					type="number"
					min="0"
					max={model.p.sliderMax}
					step={model.p.sliderStep}
					value={model.p.cohend}
					oninput={(e) => {
						const v = e.currentTarget.valueAsNumber;
						if (!Number.isFinite(v)) return;
						// Floor at 0 so the treatment mean can't drop below control (bind would
						// ignore the min and let a typed -1 push it below). The slider + chart
						// snapping back to 0 is the visible feedback.
						model.p.cohend = Math.max(0, v);
						model.syncFromCohend();
					}}
				/>
			</label>
			<div class="icons">
				<!-- The settings panel holds the bulk of the tool (means, SD, CER, labels,
			     colors), so it carries a visible label — a bare gear hides how much
			     lives behind it. The remaining controls stay icon-only. -->
				<button
					bind:this={settingsBtn}
					class={['icon-btn', 'labeled', { on: settingsOpen }]}
					aria-label="Settings"
					aria-expanded={settingsOpen}
					onclick={() => (settingsOpen = !settingsOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="12" cy="12" r="3" />
						<path
							d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
						/>
					</svg>
					<span class="btn-label">Settings</span>
				</button>
				<!-- Utility cluster, separated from the labeled Settings pill so the bar
			     reads "primary control | utilities". Recenter is double-click +
			     fig-hint already; Help duplicated the FAQ below — both dropped. -->
				<span class="icon-divider" aria-hidden="true"></span>
				<button class="icon-btn" aria-label="Download SVG" title="Download SVG" onclick={download}>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
				</button>
				<button
					class="icon-btn"
					aria-label="Share"
					title="Share"
					onclick={() => (shareOpen = true)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="18" cy="5" r="3" />
						<circle cx="6" cy="12" r="3" />
						<circle cx="18" cy="19" r="3" />
						<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<Slider
		id="cohend-d"
		min={0}
		max={model.p.sliderMax}
		step={model.p.sliderStep}
		format={d2}
		bind:value={model.p.cohend}
		oninput={() => model.syncFromCohend()}
		onpointerdown={(e) => {
			dragStartX = e.clientX;
			model.immediate = false;
		}}
		onpointermove={(e) => {
			// Only a real drag (past a small threshold) updates immediately; a click —
			// which often emits a tiny pointermove — keeps animating, so re-clicking
			// mid-transition doesn't snap.
			if (Math.abs(e.clientX - dragStartX) > 4) model.immediate = true;
		}}
		onpointerup={() => (model.immediate = false)}
	/>

	<Overlap {model} bind:svg />
	<p class="fig-hint">Drag the chart to pan · double-click to recenter.</p>

	{#if model.p.showDonuts}
		<Donuts {model} />
	{/if}

	{#if !minimal && settingsOpen}
		<Settings {model} bind:open={settingsOpen} />
	{/if}

	{#if !minimal}
		<ShareDialog {model} bind:open={shareOpen} />
	{/if}
</div>

<style>
	.viz-tool {
		display: contents;
		--accent: var(--viz-accent);
	}
	.control-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.4rem;
	}
	.d-input {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: var(--muted);
	}
	.d-input input {
		width: 4.5rem;
		font: inherit;
		padding: 0.3rem 0.5rem;
		color: var(--ink);
	}
	.icons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	/* Splits the labeled Settings pill from the icon-only utilities. */
	.icon-divider {
		width: 1px;
		align-self: stretch;
		margin: 0.2rem 0.4rem;
		background: var(--rule);
	}
	/* Base .icon-btn (box, default colour, accent hover) is the global one in
	   article.css; only the labeled pill variant is local. */
	/* The labeled settings button reads as a distinct control (bordered pill) so the
	   panel behind it is discoverable, not hidden behind a bare glyph. */
	.icon-btn.labeled {
		width: auto;
		gap: 0.4rem;
		padding: 0 0.7rem;
		border: 1px solid var(--rule);
		color: var(--ink);
	}
	.icon-btn.labeled:hover,
	.icon-btn.labeled.on {
		border-color: var(--accent);
		color: var(--accent);
	}
	.btn-label {
		font-size: 0.85rem;
		font-weight: 500;
	}
	.icon-btn svg {
		width: 19px;
		height: 19px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
