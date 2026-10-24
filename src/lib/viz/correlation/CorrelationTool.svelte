<script lang="ts">
	import { format } from 'd3-format';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { downloadSvg, downloadSvgAsPng } from '$lib/viz/core/util/svgExport';
	import ScatterPlot from './ScatterPlot.svelte';
	import Venn from './Venn.svelte';
	import PointEditControls from './PointEditControls.svelte';
	import Settings from './Settings.svelte';
	import { downloadCsv } from './csv';
	import { presetSources } from './datasets';
	import type { CorrelationState } from './correlation.svelte';

	// The interactive correlation tool: control bar (correlation input +
	// settings/download), slider, scatter plot with the point-edit overlay, and
	// the readout column (r, shared variance, Venn, regression equation,
	// moments). Layout mirrors the old app's 7/5 grid.
	interface Props {
		model: CorrelationState;
		/** Bindable so the page can shift its layout when the drawer opens. */
		settingsOpen?: boolean;
	}
	let { model, settingsOpen = $bindable(false) }: Props = $props();

	const f2 = format('.2f');
	const pct = format('.0%');
	// Trimmed display for the rho input: after point edits rho snaps to the
	// exact sample r, and the raw float (0.6923076923…) is unreadable. The full
	// value shows only while the field is focused for editing. Not d3-format:
	// its default minus is U+2212, which <input type=number> rejects — the
	// field would go blank for every negative rho.
	const f3 = (v: number) => String(Number(v.toFixed(3)));
	let rhoFocused = $state(false);

	// Readout names: Pre/Post in slope mode (the chart no longer shows x/y),
	// else the axis labels, truncated so a long CSV header can't blow up the
	// readout column.
	const short = (s: string) => (s.length > 14 ? s.slice(0, 13) + '…' : s);
	const xName = $derived(model.p.plotType === 'slope' ? 'Pre' : short(model.p.xLabel));
	const yName = $derived(model.p.plotType === 'slope' ? 'Post' : short(model.p.yLabel));

	let svg = $state<SVGSVGElement>();
	let downloadOpen = $state(false);
	let dragStartX = 0;

	// The drawer moves focus into itself on open; on close return focus here.
	let settingsBtn = $state<HTMLButtonElement>();
	let wasSettingsOpen = false;
	$effect(() => {
		if (wasSettingsOpen && !settingsOpen) settingsBtn?.focus();
		wasSettingsOpen = settingsOpen;
	});

	// Close the download menu on any outside pointerdown, or on Escape (which
	// returns focus to the trigger — outside clicks move focus themselves).
	// The listeners only exist while the menu is open.
	let downloadBtn = $state<HTMLButtonElement>();
	$effect(() => {
		if (!downloadOpen) return;
		const onDown = (e: PointerEvent) => {
			if (!(e.target as Element).closest('.download-menu')) downloadOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			downloadOpen = false;
			downloadBtn?.focus();
		};
		window.addEventListener('pointerdown', onDown);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('keydown', onKey);
		};
	});

	function pick(fn: () => void) {
		fn();
		downloadOpen = false;
	}

	// activePreset: attribution follows the base sample — a re-correlated
	// Anscombe is still Anscombe's data, but edits/New sample/CSV replace it
	// and the credit must vanish with them.
	const source = $derived(presetSources[model.activePreset]);
</script>

<div class="viz-tool">
	<div class="control-bar">
		<label class="rho-input">
			<span>Correlation</span>
			<input
				class="card-sm"
				type="number"
				min="-1"
				max="1"
				step="0.01"
				value={rhoFocused ? model.p.rho : f3(model.p.rho)}
				onfocus={() => (rhoFocused = true)}
				onblur={() => (rhoFocused = false)}
				oninput={(e) => {
					const v = e.currentTarget.valueAsNumber;
					// Clamp instead of reject: past ±1 the transform's sqrt(1 - rho²)
					// is NaN, and the slider snapping to the bound is visible feedback.
					if (!Number.isFinite(v)) return;
					model.setRho(Math.max(-1, Math.min(1, v)));
				}}
			/>
		</label>
		<div class="icons">
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
			<span class="icon-divider" aria-hidden="true"></span>
			<span class="download-menu">
				<!-- Deliberately not role="menu": that pattern promises arrow-key
				     navigation; three tabbable buttons in a popover need none. -->
				<button
					bind:this={downloadBtn}
					class="icon-btn"
					aria-label="Download PNG, SVG, or CSV"
					title="Download"
					aria-expanded={downloadOpen}
					onclick={() => (downloadOpen = !downloadOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
				</button>
				{#if downloadOpen}
					<div class="menu">
						<button
							onclick={() =>
								pick(() => svg && downloadSvgAsPng(svg, 'rpsychologist-correlation.png'))}
						>
							PNG image
						</button>
						<button
							onclick={() => pick(() => svg && downloadSvg(svg, 'rpsychologist-correlation.svg'))}
						>
							SVG image
						</button>
						<button
							onclick={() => pick(() => downloadCsv(model.p.data, model.p.xLabel, model.p.yLabel))}
						>
							CSV data
						</button>
					</div>
				{/if}
			</span>
		</div>
	</div>

	<Slider
		id="correlation-rho"
		ariaLabel="Correlation"
		min={-1}
		max={1}
		step={0.01}
		format={f2}
		bind:value={model.p.rho}
		oninput={() => model.setRho(model.p.rho, model.immediate)}
		onpointerdown={(e) => {
			dragStartX = e.clientX;
			model.immediate = false;
		}}
		onpointermove={(e) => {
			// A real drag updates immediately; a click keeps animating (see cohend).
			if (Math.abs(e.clientX - dragStartX) > 4) model.immediate = true;
		}}
		onpointerup={() => (model.immediate = false)}
	/>

	<div class="layout">
		<div class="plot">
			<PointEditControls {model} />
			<ScatterPlot {model} bind:svg />
			{#if source}
				<p class="source">
					Data source: <a href={source.href} rel="external">{source.label}</a>
				</p>
			{/if}
		</div>
		<div class="readout">
			<p class="cor-readout">
				Correlation: <strong data-testid="cor-value"
					>{model.stats ? f2(model.stats.cor) : '—'}</strong
				>
			</p>
			<p class="shared">
				Shared variance: <span data-testid="shared-variance"
					>{model.stats ? pct(model.stats.cor ** 2) : '—'}</span
				>
			</p>
			<Venn {model} {xName} {yName} />
			{#if model.stats}
				{@const b1 = model.stats.slope}
				<div class="stats" data-testid="descriptives">
					<p>
						{yName} = {f2(model.stats.intercept)}
						{b1 < 0 ? '−' : '+'}
						{f2(Math.abs(b1))}·{xName}
					</p>
					<p>Mean({yName}) = {f2(model.stats.muHatNewY)}</p>
					<p>Mean({xName}) = {f2(model.stats.muHatNewX)}</p>
					<p>SD({yName}) = {f2(model.stats.sigmaHatNewY)}</p>
					<p>SD({xName}) = {f2(model.stats.sigmaHatNewX)}</p>
					<p>n = {model.p.data.length}</p>
				</div>
			{/if}
		</div>
	</div>

	{#if settingsOpen}
		<Settings {model} bind:open={settingsOpen} />
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
	.rho-input {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: var(--muted);
	}
	.rho-input input {
		width: 5rem;
		font: inherit;
		padding: 0.3rem 0.5rem;
		color: var(--ink);
	}
	.icons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.icon-divider {
		width: 1px;
		align-self: stretch;
		margin: 0.2rem 0.4rem;
		background: var(--rule);
	}
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

	.download-menu {
		position: relative;
		display: inline-flex;
	}
	.menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		min-width: 8rem;
		padding: 0.3rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
	}
	.menu button {
		padding: 0.45rem 0.6rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.85rem;
		text-align: left;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.menu button:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}

	/* Old app's 7/5 grid: chart left, readouts right; stacked on small screens. */
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 1.25rem;
		align-items: center;
		margin-top: 0.75rem;
	}
	@media (max-width: 48rem) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.plot {
		position: relative;
		/* Room for the point-edit overlay above the plot area. */
		padding-top: 2.2rem;
	}
	.source {
		margin: 0.2rem 0 0;
		font-size: 0.78rem;
		text-align: right;
		color: var(--muted);
	}
	.readout {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		text-align: center;
	}
	.cor-readout {
		margin: 0;
		font-size: 1.35rem;
		color: var(--heading);
	}
	.cor-readout strong {
		font-variant-numeric: tabular-nums;
	}
	.shared {
		margin: 0;
		color: var(--ink);
	}
	.stats {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}
	.stats p {
		margin: 0.15rem 0;
	}
</style>
