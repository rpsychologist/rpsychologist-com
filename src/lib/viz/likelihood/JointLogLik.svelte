<script lang="ts">
	// Joint (μ, σ²) view: the 3D surface, or the 2D contour only as the
	// fallback when WebGL fails (LikelihoodTool passes `show3d` down and learns
	// of a failed init through `onglfail`). Both views sit in the same
	// aspect-ratio box, so the fallback swap causes no layout shift.
	import ContourLogLik from './ContourLogLik.svelte';
	import SurfaceLogLik from './SurfaceLogLik.svelte';
	import SurfaceKey, { type KeyItem } from './SurfaceKey.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import { format } from 'd3-format';
	import { scoreMu, scoreSigma2 } from './model';
	import type { LikelihoodState } from './likelihood.svelte';
	import type { ViewpointId } from './ViewpointDock.svelte';

	interface Props {
		model: LikelihoodState;
		show3d: boolean;
		glFailed: boolean;
		onglfail: () => void;
		/** 3D viewpoint (the buttons are in the instrument, ViewpointDock). */
		view?: ViewpointId | null;
	}
	let { model, show3d, glFailed, onglfail, view = $bindable('angled') }: Props = $props();

	let emphasis = $state<string[] | null>(null);

	// Readout at the current point: the height and the two slopes (scores),
	// both zero at the peak. Replaces the numbers the old slice plots carried.
	const f2 = format('.2f');
	const f3 = format('.3f');
	const tex = (v: string) => v.replace('−', '-');
	const llTex = $derived(String.raw`\ell = ${tex(f2(model.ll))}`);
	const scores = $derived([
		{
			axis: 'mu' as const,
			label: 'Show the slope along μ on the surface',
			tex: String.raw`\frac{\partial \ell}{\partial \mu} = ${tex(f3(scoreMu(model.p.sample.length, model.p.mu, model.muHat, model.p.sigma2)))}`
		},
		{
			axis: 's2' as const,
			label: 'Show the slope along σ² on the surface',
			tex: String.raw`\frac{\partial \ell}{\partial \sigma^2} = ${tex(f3(scoreSigma2(model.p.sample, model.p.mu, model.p.sigma2)))}`
		}
	]);

	// Each score in the readout draws its slope triangle on the surface: while
	// hovered or focused (a preview), or pinned by a click/tap.
	type Axis = 'mu' | 's2';
	let slopeHover = $state<Axis | null>(null);
	let slopePin = $state<Axis | null>(null);
	const slope = $derived(slopeHover ?? slopePin);
	const keyItems = $derived.by((): KeyItem[] => [
		{ id: 'slices', swatch: 'slice', text: 'slices through the point' },
		{ id: 'path', swatch: 'path', text: 'optimizer path' },
		...(model.nextStep
			? [
					{
						id: 'next',
						swatch: 'next' as const,
						text:
							model.p.algo === 'fisherScoring'
								? 'next step, and the quadratic it climbs (dotted)'
								: 'next step'
					}
				]
			: []),
		{ id: 'profile', swatch: 'profile', text: 'profile likelihoods (back walls)' }
	]);
</script>

<div class="joint">
	{#if glFailed}
		<p class="gl-note">3D view isn't available in this browser — showing the contour.</p>
	{/if}

	{#if show3d}
		<SurfaceLogLik {model} {emphasis} {slope} onunavailable={onglfail} bind:view />
		<SurfaceKey items={keyItems} onemphasis={(ids) => (emphasis = ids)} />
	{:else}
		<ContourLogLik {model} />
	{/if}
	<p class="readout" data-testid="point-readout">
		<span><Tex math={llTex} /></span>
		{#each scores as sc (sc.axis)}
			{#if show3d}
				<button
					type="button"
					class="score"
					class:on={slope === sc.axis}
					aria-pressed={slopePin === sc.axis}
					aria-label={sc.label}
					title="Hover or tap to draw this slope on the surface"
					onpointerenter={() => (slopeHover = sc.axis)}
					onpointerleave={() => (slopeHover = null)}
					onfocus={() => (slopeHover = sc.axis)}
					onblur={() => (slopeHover = null)}
					onclick={() => (slopePin = slopePin === sc.axis ? null : sc.axis)}
					><Tex math={sc.tex} /></button
				>
			{:else}
				<span><Tex math={sc.tex} /></span>
			{/if}
		{/each}
	</p>
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
	.readout {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.25rem 2rem;
		margin: 0.2rem 0 0;
		font-size: 0.95rem;
	}
	/* The scores read as values first; the dotted underline says they also
	   draw something. */
	.score {
		padding: 0.1rem 0.35rem;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	/* KaTeX output ignores text-decoration, so the dotted cue is a border. */
	.score :global(.katex) {
		border-bottom: 1px dotted var(--muted);
	}
	.score:hover,
	.score:focus-visible,
	.score.on {
		border-color: var(--rule);
	}
	.score[aria-pressed='true'] {
		border-color: var(--viz-accent);
	}
	.gl-note {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
</style>
