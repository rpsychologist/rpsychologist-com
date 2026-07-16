<script lang="ts">
	// Joint (μ, σ²) view with the 2D ⇄ 3D toggle (new in 0.2.0). The surface is
	// the default where available; the contour is the precise-input and fallback
	// view — the 3D option is hidden under reduced motion, and the view flips
	// back to the contour if WebGL init fails (the default 'surface' state is
	// guarded by show3dToggle below, so those users still get the contour). Both
	// views sit in the same aspect-ratio box so toggling causes no layout shift.
	import { prefersReducedMotion } from 'svelte/motion';
	import ContourLogLik from './ContourLogLik.svelte';
	import SurfaceLogLik from './SurfaceLogLik.svelte';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	let glFailed = $state(false);
	const show3dToggle = $derived(!prefersReducedMotion.current && !glFailed);

	function onGlUnavailable() {
		glFailed = true;
		model.jointView = 'contour';
	}
</script>

<div class="joint">
	{#if show3dToggle}
		<div class="view-toggle" role="group" aria-label="Joint log-likelihood view">
			<button
				class:on={model.jointView === 'contour'}
				aria-pressed={model.jointView === 'contour'}
				onclick={() => (model.jointView = 'contour')}>Contour</button
			>
			<button
				class:on={model.jointView === 'surface'}
				aria-pressed={model.jointView === 'surface'}
				onclick={() => (model.jointView = 'surface')}>3D surface</button
			>
		</div>
	{/if}
	{#if glFailed}
		<p class="gl-note">3D view isn't available in this browser — showing the contour.</p>
	{/if}

	{#if model.jointView === 'surface' && show3dToggle}
		<SurfaceLogLik {model} onunavailable={onGlUnavailable} />
	{:else}
		<ContourLogLik {model} />
	{/if}
</div>

<style>
	.joint {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		/* Fit the whole surface on a laptop: both views are 1/0.75 aspect, so at
		   full content width the canvas (~890px) plus the two pinned bars
		   (~15rem) overflows a 15" MacBook viewport — you'd rotate a hill you
		   can only ever half-see. Cap width so canvas + pinned chrome fits;
		   the max() keeps it usable on short-but-wide windows. */
		max-width: max(35rem, calc((100vh - 15rem) / 0.75));
		margin-inline: auto;
		width: 100%;
	}
	.view-toggle {
		display: inline-flex;
		align-self: flex-start;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.view-toggle button {
		padding: 0.3rem 0.8rem;
		border: none;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.view-toggle button + button {
		border-left: 1px solid var(--rule);
	}
	.view-toggle button.on {
		background: var(--viz-accent);
		color: #fff;
	}
	.gl-note {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
</style>
