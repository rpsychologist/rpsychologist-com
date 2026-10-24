<script lang="ts">
	// Toggles an instrument between its in-page frame and a full-window view.
	// The parent restyles the same element (class:expanded) rather than
	// re-mounting it in a modal, so WebGL contexts and rotation survive. A CSS
	// overlay instead of the Fullscreen API because iOS Safari has no element
	// fullscreen. While expanded: Esc exits and page scroll is locked.
	interface Props {
		expanded: boolean;
		label: string;
	}
	let { expanded = $bindable(), label }: Props = $props();

	let button: HTMLButtonElement;

	$effect(() => {
		if (!expanded) return;
		const root = document.documentElement;
		const prev = root.style.overflow;
		root.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') expanded = false;
		};
		window.addEventListener('keydown', onKey);
		button.focus();
		return () => {
			root.style.overflow = prev;
			window.removeEventListener('keydown', onKey);
			// The button stays put through the toggle, so focus returns to it.
			button.focus();
		};
	});
</script>

<button
	bind:this={button}
	type="button"
	class="expand"
	aria-pressed={expanded}
	aria-label={expanded ? `Exit full view of the ${label}` : `Full view of the ${label}`}
	title={expanded ? 'Exit full view (Esc)' : 'Full view'}
	onclick={() => (expanded = !expanded)}
>
	<svg viewBox="0 0 24 24" aria-hidden="true">
		{#if expanded}
			<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
		{:else}
			<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
		{/if}
	</svg>
</button>

<style>
	.expand {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.expand:hover {
		color: var(--viz-accent);
		border-color: var(--viz-accent);
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
