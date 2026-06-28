<script lang="ts">
  import { termSlug, type PostMeta } from "$lib/content";
  import { formatDate } from "$lib/utils/date";

  let { posts }: { posts: PostMeta[] } = $props();
</script>

<ul class="post-list">
  {#each posts as post (post.slug)}
    <li class="post-card">
      <h2 class="post-title">
        <a href="/{post.slug}">{post.title}</a>
      </h2>
      <p class="post-meta">
        <time datetime={post.date}>{formatDate(new Date(post.date))}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
        <span aria-hidden="true">·</span>
        <a class="post-cat" href="/tags/{termSlug(post.category)}">{post.category}</a>
      </p>
      {#if post.summary}
        <p class="post-summary">{post.summary}</p>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
  .post-title {
    margin: 0 0 0.35rem;
    font-size: 1.5rem;
    line-height: 1.2;
  }
  .post-title a {
    color: var(--heading);
    text-decoration: none;
  }
  .post-title a:hover {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-underline-offset: 3px;
  }
  .post-meta {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
  .post-cat {
    color: var(--muted);
    text-decoration: none;
  }
  .post-cat:hover {
    text-decoration: underline;
  }
  .post-summary {
    margin: 0;
    color: var(--ink);
    line-height: 1.6;
  }
</style>
