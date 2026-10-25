<script lang="ts" module>
	export type KeySwatch =
		'slice' | 'path' | 'next' | 'profile' | 'ridge' | 'null-line' | 'null-slice';
	export interface KeyItem {
		id: string;
		swatch: KeySwatch;
		tex?: string;
		text?: string;
	}
</script>

<script lang="ts">
	// Key for a 3D surface: one entry per element the view currently draws,
	// each with a sample of its real stroke. Hovering or focusing an entry
	// previews it alone (others dim); clicking toggles it in or out of the
	// pinned set, which is also the touch path. `focus` is the view's default
	// pinned set (e.g. the active test's geometry) and resets the pins when it
	// changes. Curves aren't labelled in place: labels on rotating lines collide.
	import Tex from '#lib/components/Tex.svelte';

	interface Props {
		items: KeyItem[];
		focus?: string[];
		onemphasis: (ids: string[] | null) => void;
	}
	let { items, focus = [], onemphasis }: Props = $props();

	let hover = $state<string | null>(null);
	// Follows `focus` (resets on a new test); clicks override until it changes.
	let pinned = $derived<string[]>([...focus]);
	// Pins the active view no longer draws must not keep everything else dimmed.
	const pins = $derived(pinned.filter((id) => items.some((i) => i.id === id)));
	const active = $derived(hover ? [hover] : pins.length ? pins : null);
	$effect(() => onemphasis(active));

	function toggle(id: string) {
		pinned = pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id];
	}
</script>

<ul class="key" aria-label="Key">
	{#each items as item (item.id)}
		<li>
			<button
				type="button"
				aria-pressed={pins.includes(item.id)}
				class:dim={active !== null && !active.includes(item.id)}
				onpointerenter={() => (hover = item.id)}
				onpointerleave={() => (hover = null)}
				onfocus={() => (hover = item.id)}
				onblur={() => (hover = null)}
				onclick={() => toggle(item.id)}
			>
				<svg class="swatch {item.swatch}" width="26" height="10" aria-hidden="true">
					<line x1="1" x2="25" y1="5" y2="5" />
				</svg>
				{#if item.tex}<Tex math={item.tex} />{/if}
				{#if item.text}<span>{item.text}</span>{/if}
			</button>
		</li>
	{/each}
</ul>

<style>
	.key {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.4rem;
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.82rem;
	}
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.2rem 0.45rem;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink);
		font: inherit;
		cursor: pointer;
		transition:
			opacity 0.15s,
			border-color 0.15s;
	}
	button:hover,
	button:focus-visible,
	button[aria-pressed='true'] {
		border-color: var(--rule);
	}
	button.dim {
		opacity: 0.45;
	}
	.swatch line {
		stroke-width: 2.5;
		stroke-linecap: round;
	}
	.slice line {
		stroke: var(--viz-accent);
	}
	.path line {
		stroke: #e17055;
		stroke-width: 3.5;
	}
	.next line {
		stroke: #e17055;
		stroke-width: 2;
		stroke-dasharray: 5 4;
		stroke-linecap: butt;
	}
	.profile line {
		stroke: var(--marginal);
	}
	.ridge line {
		stroke: var(--marginal);
		stroke-width: 2;
		stroke-dasharray: 1 4;
	}
	.null-line line {
		stroke: #e17055;
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
		stroke-linecap: butt;
	}
	.null-slice line {
		stroke: #e17055;
	}
</style>
