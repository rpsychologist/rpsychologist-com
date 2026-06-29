<script lang="ts">
	// Native colour picker (replaces react-color). Stores a hex string; the old
	// app's per-channel RGBA is simplified to hex + a fixed fill-opacity on the
	// overlap region, which native `<input type=color>` supports without a library.
	interface Props {
		value: string;
		label?: string;
		id?: string;
		onchange?: () => void;
	}

	let { value = $bindable(), label, id, onchange }: Props = $props();
</script>

<label class="color-input">
	<input type="color" bind:value {id} aria-label={label} {onchange} />
	{#if label}<span>{label}</span>{/if}
</label>

<style>
	.color-input {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--muted);
		cursor: pointer;
	}
	input[type='color'] {
		inline-size: 2rem;
		block-size: 1.6rem;
		padding: 0;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--panel);
		cursor: pointer;
	}
</style>
