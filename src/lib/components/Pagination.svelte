<script lang="ts">
	import { resolve } from '$app/paths';

	let { current, total }: { current: number; total: number } = $props();

	// Page 1 lives at "/", pages 2..N at "/page/N".
	const href = (n: number) => (n === 1 ? resolve('/') : resolve('/page/[page]', { page: `${n}` }));
</script>

{#if total > 1}
	<nav class="pagination" aria-label="Pagination">
		{#if current > 1}
			<a class="page-link" rel="prev" href={href(current - 1)}>← Newer</a>
		{:else}
			<span class="page-link disabled">← Newer</span>
		{/if}

		<span class="page-status">Page {current} of {total}</span>

		{#if current < total}
			<a class="page-link" rel="next" href={href(current + 1)}>Older →</a>
		{:else}
			<span class="page-link disabled">Older →</span>
		{/if}
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 3rem;
		font-size: 0.85rem;
	}
	.page-link {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-underline-offset: 0.15em;
	}
	.page-link:hover {
		text-decoration-color: var(--accent);
	}
	.page-link.disabled {
		color: var(--muted);
		opacity: 0.5;
		text-decoration: none;
	}
	.page-status {
		color: var(--muted);
	}
</style>
