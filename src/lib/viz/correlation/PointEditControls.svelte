<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { CorrelationState } from './correlation.svelte';
	import type { PointEditMode } from './correlation.svelte';

	// The point-edit overlay in the chart's top-right corner (old
	// PointEditSettings): a pencil toggle plus a Drag/Add/Delete segmented
	// control that slides in while editing is on.
	interface Props {
		model: CorrelationState;
	}

	let { model }: Props = $props();

	const modes: { mode: PointEditMode; label: string }[] = [
		{ mode: 'drag', label: 'Drag' },
		{ mode: 'add', label: 'Add' },
		{ mode: 'delete', label: 'Delete' }
	];
</script>

<div class="point-edit">
	{#if model.p.showPointEdit}
		<div
			class="segmented"
			role="group"
			aria-label="Point-edit mode"
			transition:fly={{ x: 12, duration: prefersReducedMotion.current ? 0 : 150, easing: cubicOut }}
		>
			{#each modes as { mode, label } (mode)}
				<button
					class={['seg', { on: model.p.pointEdit === mode }]}
					type="button"
					aria-pressed={model.p.pointEdit === mode}
					onclick={() => (model.p.pointEdit = mode)}
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}
	<button
		class="icon-btn"
		type="button"
		aria-label="Edit data points"
		title="Edit data points"
		aria-pressed={model.p.showPointEdit}
		onclick={() => (model.p.showPointEdit = !model.p.showPointEdit)}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
		</svg>
	</button>
</div>

<style>
	.point-edit {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.segmented {
		display: flex;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--panel);
	}
	.seg {
		padding: 0.25rem 0.55rem;
		border: none;
		border-left: 1px solid var(--rule);
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 500;
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
	.icon-btn svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.icon-btn[aria-pressed='true'] {
		color: var(--accent);
		border-color: var(--accent);
	}
</style>
