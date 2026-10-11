<script lang="ts">
	// Joint (μ, σ²) view: the 3D surface where available, else the contour
	// (the precise-input and fallback view). The Contour/3D toggle lives in
	// the instrument header (LikelihoodTool), which passes `show3d` down and
	// learns of a failed WebGL init through `onglfail`. Both views sit in the
	// same aspect-ratio box so toggling causes no layout shift.
	import ContourLogLik from './ContourLogLik.svelte';
	import SurfaceLogLik from './SurfaceLogLik.svelte';
	import SurfaceKey, { type KeyItem } from './SurfaceKey.svelte';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
		show3d: boolean;
		glFailed: boolean;
		onglfail: () => void;
	}
	let { model, show3d, glFailed, onglfail }: Props = $props();

	let emphasis = $state<string[] | null>(null);
	const keyItems: KeyItem[] = [
		{ id: 'slices', swatch: 'slice', text: 'slices through the point' },
		{ id: 'path', swatch: 'path', text: 'optimizer path' },
		{ id: 'profile', swatch: 'profile', text: 'profile likelihoods (back walls)' }
	];
</script>

<div class="joint">
	{#if glFailed}
		<p class="gl-note">3D view isn't available in this browser — showing the contour.</p>
	{/if}

	{#if model.jointView === 'surface' && show3d}
		<SurfaceLogLik {model} {emphasis} onunavailable={onglfail} />
		<SurfaceKey items={keyItems} onemphasis={(ids) => (emphasis = ids)} />
	{:else}
		<ContourLogLik {model} />
	{/if}
</div>

<style>
	.joint {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		/* Fit the whole surface on a laptop: both views are 1/0.75 aspect, so cap
		   the width so the canvas plus the sticky parameter bar and the
		   instrument header (--chrome, ~11rem; less in full view) fit the viewport — otherwise you rotate a
		   hill you can only half-see. The max() keeps short-but-wide windows usable. */
		max-width: max(35rem, calc((100vh - var(--chrome, 11rem)) / 0.75));
		margin-inline: auto;
		width: 100%;
	}
	.gl-note {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
</style>
