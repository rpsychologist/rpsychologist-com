<script lang="ts">
	import type { Snippet } from 'svelte';

	// An SVG with a fixed internal coordinate space (`width`×`height`) that scales
	// fluidly to its container via CSS. The geometry is computed against the fixed
	// dimensions, so it renders into the prerendered HTML and is correct at first
	// paint — no client-side measurement, no layout shift. `el` is bindable so a
	// consumer can grab the node (e.g. for SVG export).
	interface Props {
		width: number;
		height: number;
		el?: SVGSVGElement;
		label?: string;
		class?: string;
		children: Snippet;
	}

	let { width, height, el = $bindable(), label, class: klass = '', children }: Props = $props();
</script>

<svg
	bind:this={el}
	class={klass}
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="xMidYMid meet"
	role="img"
	aria-label={label}
>
	{@render children()}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
