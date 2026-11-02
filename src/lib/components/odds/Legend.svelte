<script lang="ts">
	/** Swatch kinds mirror the marks: dots for units, short strokes for lines. */
	export type Key =
		| 'event'
		| 'non'
		| 'control'
		| 'faded'
		| 'hl'
		| 'outline'
		| 'midpoint'
		| 'line'
		| 'line-ref'
		| 'line-dash';

	interface Item {
		key: Key;
		label: string;
		/** Keep the item's space without showing it, so the legend never rewraps. */
		hidden?: boolean;
	}

	let { items }: { items: Item[] } = $props();
</script>

<ul class="legend">
	{#each items as item (item.label)}
		<li class={{ hidden: item.hidden }} aria-hidden={item.hidden || undefined}>
			<svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
				{#if item.key.startsWith('line')}
					<line x1="1" x2="15" y1="6" y2="6" class={item.key} />
				{:else if item.key === 'outline'}
					<rect x="1.5" y="1.5" width="13" height="9" rx="2" />
				{:else}
					<circle cx="8" cy="6" r="4.5" class={item.key} />
				{/if}
			</svg>
			{item.label}
		</li>
	{/each}
</ul>

<style>
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.1rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.82rem;
		color: var(--muted);
	}
	li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	li.hidden {
		visibility: hidden;
	}
	circle {
		fill: var(--panel);
		stroke: var(--muted);
		stroke-width: 1.2;
	}
	circle.event,
	circle.hl {
		fill: var(--odds-accent);
		stroke: var(--odds-accent);
	}
	circle.hl {
		stroke: var(--ink);
		stroke-width: 2;
	}
	circle.control {
		fill: var(--muted);
		stroke: var(--muted);
	}
	circle.faded {
		opacity: var(--odds-faded);
	}
	circle.midpoint {
		fill: var(--ink);
		stroke: var(--panel);
		stroke-width: 1.5;
	}
	rect {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.5;
	}
	line {
		stroke-width: 2;
		stroke-linecap: round;
	}
	line.line {
		stroke: var(--odds-accent);
	}
	line.line-ref {
		stroke: var(--odds-ref);
	}
	line.line-dash {
		stroke: var(--muted);
		stroke-width: 1.2;
		stroke-dasharray: 4 3;
	}
</style>
