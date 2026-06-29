<script lang="ts">
	// Thin wrapper over the shared `.fig-range` input (styled site-wide in
	// article.css). Adds an optional label row with a live formatted value, and
	// drives the track-fill `--pct` custom property the CSS reads. Exposes
	// pointer down/up so a consumer can skip animation while the thumb is dragged.
	interface Props {
		value: number;
		min: number;
		max: number;
		step?: number;
		label?: string;
		id?: string;
		format?: (v: number) => string;
		oninput?: () => void;
		onpointerdown?: (e: PointerEvent) => void;
		onpointermove?: (e: PointerEvent) => void;
		onpointerup?: () => void;
	}

	let {
		value = $bindable(),
		min,
		max,
		step = 0.01,
		label,
		id,
		format = (v) => String(v),
		oninput,
		onpointerdown,
		onpointermove,
		onpointerup
	}: Props = $props();

	const pct = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
</script>

<div class="slider">
	{#if label}
		<label for={id} class="slider-label">
			<span>{label}</span>
			<span class="slider-value">{format(value)}</span>
		</label>
	{/if}
	<input
		{id}
		class="fig-range"
		type="range"
		{min}
		{max}
		{step}
		bind:value
		style="--pct: {pct}%"
		{oninput}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
	/>
</div>

<style>
	.slider {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.slider-label {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.slider-value {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		font-weight: 600;
	}
</style>
