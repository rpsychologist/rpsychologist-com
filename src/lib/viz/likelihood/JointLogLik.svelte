<script lang="ts">
	// Joint (μ, σ²) view: the 3D surface, or the 2D contour only as the
	// fallback when WebGL fails (LikelihoodTool passes `show3d` down and learns
	// of a failed init through `onglfail`). Both views sit in the same
	// aspect-ratio box, so the fallback swap causes no layout shift.
	import ContourLogLik from './ContourLogLik.svelte';
	import SurfaceLogLik from './SurfaceLogLik.svelte';
	import SurfaceKey, { type KeyItem } from './SurfaceKey.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import TexLive from '$lib/components/TexLive.svelte';
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
	// Constant, apart from the values: new entry objects on every input made
	// each label's Tex typeset again.
	const entries = [
		{ axis: 'll', label: 'Show the height of the point on the surface', lhs: String.raw`\ell` },
		{
			axis: 'mu',
			label: 'Show the slope along μ on the surface',
			lhs: String.raw`\frac{\partial \ell}{\partial \mu}`
		},
		{
			axis: 's2',
			label: 'Show the slope along σ² on the surface',
			lhs: String.raw`\frac{\partial \ell}{\partial \sigma^2}`
		}
	] as const;
	const values = $derived({
		ll: f2(model.ll),
		mu: f3(scoreMu(model.p.sample.length, model.p.mu, model.muHat, model.p.sigma2)),
		s2: f3(scoreSigma2(model.p.sample, model.p.mu, model.p.sigma2))
	});
	// Each side its own formula, so the wide layout can align the "=" signs; the
	// leading {} keeps KaTeX's relation spacing before "=".
	const rhs = '{} = #0';

	// Each readout entry draws itself on the surface, ℓ as the point's height
	// and each score as a slope triangle: while hovered or focused (a
	// preview), or pinned by a click/tap.
	type Mark = 'll' | 'mu' | 's2';
	let markHover = $state<Mark | null>(null);
	let markPin = $state<Mark | null>(null);
	const mark = $derived(markHover ?? markPin);
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
		{ id: 'profile', swatch: 'profile', text: 'profile log-likelihoods (back walls)' }
	]);
</script>

<div class="joint">
	{#if glFailed}
		<p class="gl-note">
			The 3D view isn't available in this browser, so the contour plot is shown instead.
		</p>
	{/if}

	<div class="fig">
		{#if show3d}
			<SurfaceLogLik {model} {emphasis} {mark} onunavailable={onglfail} bind:view />
		{:else}
			<ContourLogLik {model} />
		{/if}
	</div>
	<div class="side">
		{#if show3d}
			<SurfaceKey items={keyItems} onemphasis={(ids) => (emphasis = ids)} />
		{/if}
		<p class="readout" data-testid="point-readout">
			{#each entries as en (en.axis)}
				{#if show3d}
					<button
						type="button"
						class="mark"
						class:on={mark === en.axis}
						aria-pressed={markPin === en.axis}
						aria-label={en.label}
						title="Hover or tap to draw this on the surface"
						onpointerenter={() => (markHover = en.axis)}
						onpointerleave={() => (markHover = null)}
						onfocus={() => (markHover = en.axis)}
						onblur={() => (markHover = null)}
						onclick={() => (markPin = markPin === en.axis ? null : en.axis)}
						><span class="lhs"><Tex math={en.lhs} /></span><span class="rhs"
							><TexLive math={rhs} values={[values[en.axis]]} /></span
						></button
					>
				{:else}
					<span
						><span class="lhs"><Tex math={en.lhs} /></span><span class="rhs"
							><TexLive math={rhs} values={[values[en.axis]]} /></span
						></span
					>
				{/if}
			{/each}
		</p>
	</div>
</div>

<style>
	.joint {
		/* Fit the whole surface on a laptop: both views are 1/0.75 aspect, so cap
		   the width so the canvas plus the sticky parameter bar and the
		   instrument header (--chrome, ~11rem; less in full view) fit the viewport — otherwise you rotate a
		   hill you can only half-see. The max() keeps short-but-wide windows usable. */
		--cap: max(35rem, calc((100vh - var(--chrome, 11rem)) / 0.75));
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		max-width: var(--cap);
		margin-inline: auto;
		width: 100%;
	}
	.fig {
		min-width: 0;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.readout {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.25rem 2rem;
		margin: 0.2rem 0 0;
		font-size: 0.95rem;
	}
	/* Left side and "= value" as two boxes, aligned on the baseline. */
	.readout > span,
	.mark {
		display: inline-flex;
		align-items: baseline;
	}
	.mark {
		padding: 0.1rem 0.35rem;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	.mark:hover,
	.mark:focus-visible,
	.mark.on {
		border-color: var(--rule);
	}
	.mark[aria-pressed='true'] {
		border-color: var(--viz-accent);
	}
	.gl-note {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
	/* Wide screens: the height cap leaves spare width beside the canvas, so the
	   key and readout sit there, in view while dragging, instead of below the
	   fold. Beside, not over: the rotating surface reaches every canvas edge. */
	@media (min-width: 64rem) {
		.joint {
			display: grid;
			grid-template-columns: minmax(0, var(--cap)) 15rem;
			gap: 0.4rem 1.5rem;
			justify-content: center;
			align-items: center;
			max-width: none;
		}
		.gl-note {
			grid-column: 1 / -1;
		}
		.side {
			gap: 1.25rem;
		}
		.side :global(.key) {
			flex-direction: column;
			align-items: flex-start;
			margin: 0;
		}
		.side :global(.key button) {
			text-align: left;
		}
		/* A two-column grid aligns the "=" signs; each entry spans both columns
		   through a subgrid, so the hover borders are one width. */
		.readout {
			display: grid;
			grid-template-columns: auto auto;
			justify-content: start;
			gap: 0.3rem 0;
		}
		.readout > span,
		.mark {
			display: grid;
			grid-template-columns: subgrid;
			grid-column: span 2;
			/* Same inset as the key's buttons, so the column shares one left edge. */
			padding-inline: 0.45rem;
		}
		.lhs {
			justify-self: end;
		}
		/* Buttons center their content; a shorter value would shift its "=". */
		.rhs {
			justify-self: start;
		}
	}
</style>
