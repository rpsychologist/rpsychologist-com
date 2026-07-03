<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';

	// Transient status card shared by the viz apps (drawer save confirmations,
	// page-level notices), so every toast in a tool speaks one visual language:
	// panel surface, hairline rule, a signature left edge in the tool's accent
	// (red for errors). Owns the look, motion, and live-region wiring; the
	// caller owns placement (wrap it in a positioned element), lifetime, and
	// the state that shows/hides it.
	interface Props {
		/** Colors the signature edge: status = viz accent, error = red. */
		kind?: 'status' | 'error';
		/** When provided, renders a × button that calls it. */
		ondismiss?: () => void;
		children: Snippet;
	}

	let { kind = 'status', ondismiss, children }: Props = $props();
</script>

<div
	class={['toast', kind]}
	role="status"
	transition:fly={{ y: prefersReducedMotion.current ? 0 : 12, duration: 200, easing: cubicOut }}
>
	<div class="msg">{@render children()}</div>
	{#if ondismiss}
		<button type="button" aria-label="Dismiss notice" onclick={ondismiss}>×</button>
	{/if}
</div>

<style>
	.toast {
		box-sizing: border-box;
		display: flex;
		align-items: flex-start;
		gap: 0.9rem;
		padding: 0.7rem 0.95rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-left: 3px solid var(--viz-accent);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--ink);
	}
	.toast.error {
		/* Same red as the settings drawer's field errors. */
		border-left-color: #b3261e;
	}
	.msg {
		flex: 1;
		min-width: 0;
	}
	button {
		border: none;
		background: none;
		padding: 0;
		font-size: 1.15rem;
		line-height: 1;
		color: var(--muted);
		cursor: pointer;
		transition: color 0.15s;
	}
	button:hover {
		color: var(--ink);
	}
</style>
