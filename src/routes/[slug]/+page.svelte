<script lang="ts">
  import Seo from "$lib/components/Seo.svelte";
  import Bio from "$lib/components/Bio.svelte";
  import License from "$lib/components/License.svelte";
  import ShareLinks from "$lib/components/ShareLinks.svelte";
  import Toc from "$lib/components/Toc.svelte";
  import { enhanceCode } from "$lib/actions/code";
  import { termSlug } from "$lib/content";
  import { site } from "$lib/config";
  import { formatDate } from "$lib/utils/date";

  let { data } = $props();
  const Content = $derived(data.component);
  const githubUrl = $derived(`${site.repo}/blob/master${data.meta.path}`);
</script>

<Seo
  title={data.meta.title}
  description={data.meta.summary}
  path={`/${data.meta.slug}`}
  type="article"
  published={data.meta.date}
  tags={data.meta.tags}
/>

<div class="post-layout" class:has-toc={data.meta.includeToc}>
  {#if data.meta.includeToc}
    <aside class="post-aside"><Toc /></aside>
  {/if}

  <article class="article" use:enhanceCode>
    <header class="post-header">
      <h1>{data.meta.title}</h1>
      <div class="meta-row">
        <p class="post-meta">
          <time datetime={data.meta.date}>{formatDate(new Date(data.meta.date))}</time>
          <span aria-hidden="true">·</span>
          <span>{data.meta.readingTime} min read</span>
        </p>
        <ShareLinks slug={data.meta.slug} title={data.meta.title} />
      </div>
    </header>

    <Content />

    {#if data.meta.tags.length}
      <ul class="post-tags">
        {#each data.meta.tags as tag (tag)}
          <li><a href="/tags/{termSlug(tag)}">{tag}</a></li>
        {/each}
      </ul>
    {/if}

    <footer class="post-footer">
      <Bio />

      <div class="share-row">
        <ShareLinks slug={data.meta.slug} title={data.meta.title} />
      </div>

      <p class="published">
        Published {formatDate(new Date(data.meta.date))} ·
        <a href={githubUrl}>View on GitHub</a>
      </p>

      <div class="questions">
        <h2>Questions &amp; Comments</h2>
        <p>
          Please use <a href={`${site.repo}/discussions`}>GitHub Discussions</a> for any questions
          related to this post, or <a href={`${site.repo}/issues`}>open an issue</a> if you've
          found a bug or want to make a feature request.
        </p>
      </div>

      <License />

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
    </footer>
  </article>
</div>

<style>
  .post-header {
    margin-bottom: 2rem;
  }
  .post-header h1 {
    margin-bottom: 0.6rem;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    align-items: center;
    justify-content: space-between;
  }
  .post-meta {
    color: var(--muted);
    font-size: 0.9rem;
    display: flex;
    gap: 0.4rem;
    align-items: center;
    margin: 0;
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
  .post-footer {
    margin-top: 2.5rem;
  }
  .share-row {
    display: flex;
    justify-content: flex-end;
  }
  .published {
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 1rem;
  }
  .questions {
    margin-top: 2rem;
  }
  .questions h2 {
    font-size: 1.1rem;
  }
  .questions p {
    font-size: 0.9rem;
  }
  .post-nav {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
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

  /* Sticky TOC sidebar on wide screens for include_toc posts. */
  @media (min-width: 64rem) {
    .post-layout.has-toc {
      display: grid;
      grid-template-columns: 13rem minmax(0, 1fr);
      gap: 2.5rem;
      max-width: 64rem;
      margin-inline: auto;
    }
    .post-layout.has-toc .article {
      margin-inline: 0;
    }
  }
</style>
