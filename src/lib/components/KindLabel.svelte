<script lang="ts">
	// Says what kind of piece a link opens: the same chip in post lists and on
	// gallery thumbnails. Kept out of article.css, which feeds the share-card hash
	// (share-card-hash.server.ts).
	let { text }: { text: string } = $props();
</script>

<span class="kind-label">{text}</span>

<style>
	.kind-label {
		display: inline-block;
		padding: 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.6;
		color: var(--ink);
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: 4px;
		white-space: nowrap;
	}
</style>
