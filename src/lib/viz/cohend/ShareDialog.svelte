<script lang="ts">
	import { browser } from '$app/environment';
	import type { CohendState } from './cohend.svelte';

	// Share / embed dialog (native <dialog>, no library). Builds a link carrying
	// the current state as URL params and a ready-to-paste <iframe> embed snippet.
	interface Props {
		model: CohendState;
		/** Bindable so the control bar's share icon can open the dialog. */
		open?: boolean;
	}

	let { model, open = $bindable(false) }: Props = $props();

	let dialog = $state<HTMLDialogElement>();
	let copied = $state('');

	const shareUrl = $derived(
		browser ? location.origin + location.pathname + model.shareQuery() : ''
	);
	const embedCode = $derived(
		`<iframe src="${shareUrl}" width="100%" height="650" style="border:0" loading="lazy" title="Cohen's d"></iframe>`
	);

	// Open/close the native modal in response to the bound `open` flag.
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	async function copy(text: string, which: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = which;
		} catch {
			// clipboard unavailable; the field is selectable as a fallback
		}
	}
</script>

<dialog
	bind:this={dialog}
	class="share"
	onclose={() => {
		open = false;
		copied = '';
	}}
>
	<form method="dialog" class="head">
		<h2>Share</h2>
		<button class="close" aria-label="Close">×</button>
	</form>

	<label class="field">
		<span>Link</span>
		<div class="combo">
			<input readonly value={shareUrl} />
			<button class="fig-pill" type="button" onclick={() => copy(shareUrl, 'link')}>
				{copied === 'link' ? 'Copied' : 'Copy'}
			</button>
		</div>
	</label>

	<label class="field">
		<span>Embed</span>
		<div class="combo">
			<textarea readonly rows="3">{embedCode}</textarea>
			<button class="fig-pill" type="button" onclick={() => copy(embedCode, 'embed')}>
				{copied === 'embed' ? 'Copied' : 'Copy'}
			</button>
		</div>
	</label>
</dialog>

<style>
	.share {
		max-width: min(32rem, 92vw);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--ink);
		padding: 1.25rem;
	}
	.share::backdrop {
		background: rgba(0, 0, 0, 0.4);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 0 1rem;
	}
	.head h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	.close {
		border: none;
		background: none;
		font-size: 1.4rem;
		line-height: 1;
		color: var(--muted);
		cursor: pointer;
	}
	.field {
		display: block;
		margin-bottom: 1rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.field span {
		display: block;
		margin-bottom: 0.35rem;
	}
	.combo {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.combo input,
	.combo textarea {
		flex: 1;
		font: inherit;
		font-size: 0.85rem;
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--ink);
		resize: vertical;
	}
</style>
