<script lang="ts">
  let { current, total }: { current: number; total: number } = $props();

  // Page 1 lives at "/", pages 2..N at "/page/N".
  const href = (n: number) => (n === 1 ? "/" : `/page/${n}`);
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
    font-size: 0.9rem;
  }
  .page-link {
    color: var(--accent);
    text-decoration: none;
  }
  .page-link.disabled {
    color: var(--muted);
    opacity: 0.5;
  }
  .page-status {
    color: var(--muted);
  }
</style>
