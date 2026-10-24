<script lang="ts">
	import { browser } from '$app/environment';
	import type { CohendState } from './cohend.svelte';
	import { getCohendI18n } from './i18n';

	// Share / embed dialog (native <dialog>, no library). Two modes: a plain link
	// carrying the current state as URL params, and an embed <iframe> with a live
	// preview. Checkboxes pick which slices of state ride along (Parameters /
	// Labels / Colors); embed adds Minimal-slider and Donuts toggles. Ported from
	// the old MUI ShareDialog.
	interface Props {
		model: CohendState;
		/** Bindable so the control bar's share icon can open the dialog. */
		open?: boolean;
	}

	let { model, open = $bindable(false) }: Props = $props();

	const { m } = getCohendI18n();
	let dialog = $state<HTMLDialogElement>();
	let mode = $state<'link' | 'embed'>('link');
	let copied = $state(false);
	// Measured width of the preview box, to scale the true-size iframe down to fit.
	let previewW = $state(0);
	let iframe = $state<HTMLIFrameElement>();
	// The preview iframe loads once (src captured on entering embed mode); later
	// checkbox changes are postMessage'd into it. A reactive src would reload the
	// embed on every toggle, flashing its prerendered defaults (gauges pop in/out,
	// full redraw) before its init applies the params.
	let previewSrc = $state('');

	// The iframe renders at the embed's real logical size, then we scale it to the
	// preview width. Drawing at true 800px (not stretching a narrow iframe) means
	// the content fits its own 650px height, so the preview is a faithful thumbnail
	// with no scrollbar of its own. Keep in sync with the embed code's dimensions.
	const EMBED_W = 800;
	const EMBED_H = 650;

	// Which slices of state to bake into the link. `donuts` only affects the embed.
	let incParameters = $state(true);
	let incLabels = $state(true);
	let incColors = $state(true);
	let donuts = $state(true);

	const linkQuery = $derived(
		model.shareQuery({ parameters: incParameters, labels: incLabels, colors: incColors })
	);
	const embedQuery = $derived(
		model.shareQuery({ parameters: incParameters, labels: incLabels, colors: incColors, donuts })
	);
	// The dialog only ever renders on the full page, so location.pathname is
	// /cohend (or /<locale>/cohend); the embed is its child route `…/embed`
	// (chrome-free, frameable), in the same language.
	// Strip any trailing slash so a /cohend/ visit doesn't yield /cohend//embed.
	const base = $derived(browser ? location.origin + location.pathname.replace(/\/+$/, '') : '');
	const shareUrl = $derived(base + linkQuery);
	const embedUrl = $derived(base + '/embed' + embedQuery);
	const embedCode = $derived(
		`<iframe src="${embedUrl}" width="${EMBED_W}" height="${EMBED_H}" style="border:0" loading="lazy" title="${m.d_aria.replaceAll('"', '&quot;')}"></iframe>`
	);
	const output = $derived(mode === 'embed' ? embedCode : shareUrl);

	// Open/close the native modal in response to the bound `open` flag.
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	// Lock background scroll while open — a native <dialog> makes the page inert
	// but still lets it scroll behind the modal (the old MUI Dialog blocked it).
	$effect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	// Light dismiss: a click on the ::backdrop lands on the <dialog> element
	// itself, so close only when the click falls outside the dialog's box (this
	// way clicks on its padding don't count as "outside").
	function onBackdropClick(e: MouseEvent) {
		if (!dialog) return;
		const r = dialog.getBoundingClientRect();
		const outside =
			e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
		if (outside) dialog.close();
	}

	function setMode(next: 'link' | 'embed') {
		mode = next;
		copied = false;
		if (next === 'embed' && !previewSrc) previewSrc = embedUrl;
	}

	function pushPreview() {
		iframe?.contentWindow?.postMessage(
			{ type: 'cohend-preview', search: embedQuery },
			location.origin
		);
	}

	// Sync the loaded preview when the toggles change; gated on the dialog being
	// open in embed mode so background param changes don't spam the hidden iframe.
	// The iframe's own onload pushes too, catching changes made mid-load.
	$effect(() => {
		if (open && mode === 'embed') pushPreview();
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(output);
			copied = true;
		} catch {
			// clipboard unavailable; the field is selectable as a fallback
		}
	}
</script>

<dialog
	bind:this={dialog}
	class="share card-sm"
	aria-labelledby="share-title"
	onclick={onBackdropClick}
	onclose={() => {
		open = false;
		copied = false;
	}}
>
	<form method="dialog" class="head">
		<h2 id="share-title">{m.share}</h2>
		<button class="close" aria-label={m.share_close}>×</button>
	</form>

	<div class="body">
		<!-- Toggle buttons, not ARIA tabs: role="tab" implies arrow-key navigation
		     and tabpanel wiring we don't provide. -->
		<div class="tabs" role="group" aria-label={m.share_format}>
			<button
				type="button"
				aria-pressed={mode === 'link'}
				class:active={mode === 'link'}
				onclick={() => setMode('link')}>{m.share_link}</button
			>
			<button
				type="button"
				aria-pressed={mode === 'embed'}
				class:active={mode === 'embed'}
				onclick={() => setMode('embed')}>{m.share_embed}</button
			>
		</div>

		<fieldset class="group">
			<legend>{m.share_include}</legend>
			<p class="hint">{m.share_include_hint}</p>
			<div class="checks">
				<label title={m.share_parameters_title}>
					<input type="checkbox" bind:checked={incParameters} />
					{m.share_parameters}
				</label>
				<label title={m.share_labels_title}>
					<input type="checkbox" bind:checked={incLabels} />
					{m.share_labels}
				</label>
				<label title={m.share_colors_title}>
					<input type="checkbox" bind:checked={incColors} />
					{m.share_colors}
				</label>
			</div>
		</fieldset>

		{#if mode === 'embed'}
			<fieldset class="group">
				<legend>{m.share_embed_shows}</legend>
				<div class="checks">
					<label title={m.share_gauges_title}>
						<input type="checkbox" bind:checked={donuts} />
						{m.share_gauges}
					</label>
				</div>
			</fieldset>
		{/if}

		{#if mode === 'embed'}
			<div class="preview" bind:clientWidth={previewW} style="aspect-ratio: {EMBED_W} / {EMBED_H};">
				{#if previewSrc && previewW > 0}
					<iframe
						bind:this={iframe}
						title={m.share_preview}
						src={previewSrc}
						loading="lazy"
						onload={pushPreview}
						style="width: {EMBED_W}px; height: {EMBED_H}px; transform: scale({previewW / EMBED_W});"
					></iframe>
				{/if}
			</div>
		{/if}

		<div class="field">
			<!-- Only one of the two controls exists at a time, so they can share the id. -->
			<label class="label" for="share-output"
				>{mode === 'embed' ? m.share_embed_code : m.share_link}</label
			>
			<div class="combo">
				{#if mode === 'embed'}
					<textarea id="share-output" class="mono" readonly rows="4" value={embedCode}></textarea>
				{:else}
					<input id="share-output" class="mono" readonly value={shareUrl} />
				{/if}
				<button class="fig-pill" type="button" onclick={copy}>
					{copied ? m.share_copied : m.share_copy}
				</button>
			</div>
		</div>
	</div>
</dialog>

<style>
	/* Flex column so the header stays put while the body scrolls — the embed mode
	   (preview + long code) can outgrow short viewports; cap height and scroll
	   inside rather than letting the native <dialog> overflow off-screen. */
	.share {
		max-width: min(40rem, 94vw);
		max-height: 90dvh;
		padding: 0;
		color: var(--ink);
		/* Clip the scroll area to the rounded corners. */
		overflow: hidden;
	}
	/* A native <dialog> is display:none until opened. Only lay it out as a flex
	   column when actually open — an unconditional `display` on the element would
	   beat the UA `dialog:not([open])` rule (author > UA origin) and leave the
	   modal permanently visible. */
	.share[open] {
		display: flex;
		flex-direction: column;
	}
	.share::backdrop {
		background: rgba(0, 0, 0, 0.4);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--rule);
	}
	.head h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.05rem;
	}
	.close {
		display: inline-flex;
		border: none;
		background: none;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--muted);
		cursor: pointer;
		transition: color 0.15s;
	}
	.close:hover {
		color: var(--ink);
	}
	.body {
		padding: 1.25rem;
		overflow-y: auto;
	}
	/* Muted, letterspaced section labels (site eyebrow treatment). */
	.group legend,
	.field .label {
		display: block;
		margin-bottom: 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	/* Segmented Link / Embed switch. */
	.tabs {
		display: inline-flex;
		gap: 0.2rem;
		padding: 0.2rem;
		margin-bottom: 1.25rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	.tabs button {
		border: none;
		background: none;
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 1rem;
		border-radius: calc(var(--radius-sm) - 2px);
		color: var(--muted);
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.tabs button:hover:not(.active) {
		color: var(--ink);
	}
	.tabs button.active {
		background: var(--accent);
		color: #fff;
	}
	.group {
		border: none;
		padding: 0;
		margin: 0 0 1.25rem;
	}
	/* One-line explanation of what the checkboxes do, between legend and boxes. */
	.hint {
		margin: 0 0 0.7rem;
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--muted);
	}
	.checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.1rem;
		font-size: 0.9rem;
		color: var(--ink);
	}
	.checks label {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
	}
	/* Tint the native checkboxes to the tool accent (teal), not UA blue, so they
	   match the tabs and Copy button. */
	.checks input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		accent-color: var(--accent);
		cursor: pointer;
	}
	/* The box carries the embed's aspect (set inline); the iframe draws at true
	   size and is scaled to fit, so it never shows its own scrollbar. */
	.preview {
		position: relative;
		margin-bottom: 1.25rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg);
	}
	.preview iframe {
		position: absolute;
		top: 0;
		left: 0;
		border: 0;
		transform-origin: top left;
	}
	.field {
		display: block;
	}
	.combo {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.combo input,
	.combo textarea {
		flex: 1;
		min-width: 0;
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--ink);
	}
	.mono {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		line-height: 1.5;
	}
	.combo textarea {
		resize: vertical;
		/* Wrap the long query string instead of clipping it at the edge. */
		white-space: pre-wrap;
		word-break: break-all;
	}
	.combo .fig-pill {
		flex: none;
	}
</style>
