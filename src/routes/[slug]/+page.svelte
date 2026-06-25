<script lang="ts">
  import Seo from "$lib/components/Seo.svelte";
  import { termSlug } from "$lib/content";
  import { formatDate } from "$lib/utils/date";

  let { data } = $props();
  const Content = $derived(data.component);
</script>

<Seo
  title={data.meta.title}
  description={data.meta.summary}
  path={`/${data.meta.slug}`}
  type="article"
  published={data.meta.date}
  tags={data.meta.tags}
/>

<article class="article">
  <header class="post-header">
    <h1>{data.meta.title}</h1>
    <p class="post-meta">
      <time datetime={data.meta.date}>{formatDate(new Date(data.meta.date))}</time>
      <span aria-hidden="true">·</span>
      <span>{data.meta.readingTime} min read</span>
    </p>
  </header>

  <Content />

  {#if data.meta.tags.length}
    <ul class="post-tags">
      {#each data.meta.tags as tag (tag)}
        <li><a href="/tags/{termSlug(tag)}">{tag}</a></li>
      {/each}
    </ul>
  {/if}

  <nav class="post-nav" aria-label="Adjacent posts">
    {#if data.newer}
      <a class="prev" href="/{data.newer.slug}" rel="prev">← {data.newer.title}</a>
    {:else}
      <span></span>
    {/if}
    {#if data.older}
      <a class="next" href="/{data.older.slug}" rel="next">{data.older.title} →</a>
    {/if}
  </nav>
</article>

<style>
  .post-header {
    margin-bottom: 2rem;
  }
  .post-header h1 {
    margin-bottom: 0.4rem;
  }
  .post-meta {
    color: var(--muted);
    font-size: 0.9rem;
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .post-tags {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0;
    margin: 3rem 0 0;
  }
  .post-tags a {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
    color: var(--muted);
    background: var(--panel);
    border: 1px solid var(--rule);
    border-radius: 999px;
    text-decoration: none;
  }
  .post-tags a:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
  .post-nav {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
    font-size: 0.9rem;
  }
  .post-nav a {
    color: var(--accent);
    text-decoration: none;
    max-width: 45%;
  }
  .post-nav .next {
    text-align: right;
    margin-left: auto;
  }
</style>
