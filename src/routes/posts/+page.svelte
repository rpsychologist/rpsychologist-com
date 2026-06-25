<script lang="ts">
  import { posts, type PostMeta } from "$lib/content";
  import Container from "$lib/components/Container.svelte";
  import Seo from "$lib/components/Seo.svelte";

  const groups: [string, PostMeta[]][] = Object.entries(
    posts.reduce<Record<string, PostMeta[]>>((acc, p) => {
      const year = new Date(p.date).getFullYear().toString();
      (acc[year] ??= []).push(p);
      return acc;
    }, {})
  ).sort((a, b) => Number(b[0]) - Number(a[0]));
</script>

<Seo title="All posts" description="Every post, by year." path="/posts" />

<Container>
  <h1>All posts</h1>
  <p class="lead">{posts.length} posts since 2012.</p>

  {#each groups as [year, items] (year)}
    <section class="year">
      <h2>{year}</h2>
      <ul>
        {#each items as post (post.slug)}
          <li>
            <a href="/{post.slug}">{post.title}</a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</Container>

<style>
  .lead {
    color: var(--muted);
    margin-bottom: 2.5rem;
  }
  .year {
    margin-bottom: 2rem;
  }
  .year h2 {
    font-size: 1.1rem;
    color: var(--muted);
    border-bottom: 1px solid var(--rule);
    padding-bottom: 0.3rem;
  }
  .year ul {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .year a {
    color: var(--heading);
    text-decoration: none;
  }
  .year a:hover {
    color: var(--accent);
  }
</style>
