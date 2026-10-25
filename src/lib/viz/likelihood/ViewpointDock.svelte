<script lang="ts" module>
	// Named 3D viewpoints; the camera geometry for each id lives in
	// SurfaceLogLik (VIEWS), which animates to whichever is selected.
	export const VIEWPOINTS = [
		{ id: 'angled', label: 'Angled', title: 'The default angled view' },
		{
			id: 'mu',
			label: 'Side μ',
			title: 'Look along σ²: the outline follows the profile likelihood of μ'
		},
		{
			id: 's2',
			label: 'Side σ²',
			title: 'Look along μ: the outline is the likelihood of σ² at μ̂'
		}
	] as const;
	export type ViewpointId = (typeof VIEWPOINTS)[number]['id'];
</script>

<script lang="ts">
	// Viewpoint buttons for a 3D surface, floating over the figure. The dock
	// is a zero-height sticky row at the top of the instrument body, so the
	// buttons line up with the header's first control and, once the figure
	// scrolls under the page's pinned bars (--sticky-top, set per instrument
	// in LikelihoodTool), stay the header's own padding below them. Phones
	// don't pin the instrument headers, so the dock scrolls away with them.
	interface Props {
		/** Selected viewpoint; the surface clears it when the user rotates. */
		view: ViewpointId | null;
	}
	let { view = $bindable() }: Props = $props();
	const uid = $props.id();
</script>

<div class="views-dock">
	<div class="views">
		<span class="lab" id="{uid}-label">View</span>
		<div class="group" role="group" aria-labelledby="{uid}-label">
			{#each VIEWPOINTS as v (v.id)}
				<button
					type="button"
					class:on={view === v.id}
					aria-pressed={view === v.id}
					title={v.title}
					onclick={() => (view = v.id)}>{v.label}</button
				>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Pulled up so, in flow, the row sits the header's vertical padding
	   (0.6rem) below it rather than the body's 1rem. */
	.views-dock {
		position: sticky;
		top: calc(var(--sticky-top, 0px) + 0.6rem);
		z-index: 2;
		height: 0;
		margin-top: -0.4rem;
	}
	@media (max-width: 47.99rem) {
		.views-dock {
			position: relative;
			top: 0;
		}
	}
	.views {
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding-right: 0.3rem;
		border-radius: var(--radius-sm);
		background: var(--bg);
	}
	.lab {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.group {
		display: inline-flex;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	button {
		padding: 0.2rem 0.55rem;
		border: none;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}
	button + button {
		border-left: 1px solid var(--rule);
	}
	button:hover {
		color: var(--ink);
	}
	button.on {
		color: var(--heading);
		background: var(--inset);
	}
</style>
