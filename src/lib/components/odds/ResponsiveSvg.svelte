<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** `only` shows at every width (no paired layout to swap with). */
		variant: 'desktop' | 'mobile' | 'only';
		width: number;
		height: number;
		label: string;
		children: Snippet;
	}

	let { variant, width, height, label, children }: Props = $props();
</script>

<svg
	viewBox="0 0 {width} {height}"
	class="fig-svg {variant}"
	style:aspect-ratio="{width} / {height}"
	role="img"
	aria-label={label}
>
	{@render children()}
</svg>

<style>
	.fig-svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	/* Cap the desktop chart in viewport units so controls and readout stay on
	   screen; width follows the aspect ratio. A figure can set --fig-max-h. */
	.fig-svg.desktop {
		width: auto;
		max-width: 100%;
		max-height: var(--fig-max-h, 58vh);
		margin-inline: auto;
	}
	/* Both layouts are prerendered; CSS picks one at first paint (no flash). */
	.fig-svg.mobile {
		display: none;
	}
	@media (max-width: 36rem) {
		.fig-svg.desktop {
			display: none;
		}
		.fig-svg.mobile {
			display: block;
		}
	}
</style>
