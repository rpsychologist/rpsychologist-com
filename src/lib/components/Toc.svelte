<script lang="ts">
  import { onMount } from "svelte";

  type Heading = { id: string; text: string; level: number };
  let headings = $state<Heading[]>([]);

  // Built client-side from the rendered article headings (which carry ids from
  // rehype-slug). Progressive enhancement: no-JS readers just don't see the TOC.
  onMount(() => {
    const article = document.querySelector(".article");
    if (!article) return;
    headings = [...article.querySelectorAll<HTMLElement>("h2, h3")]
      .filter((h) => h.id)
      .map((h) => ({
        id: h.id,
        text: (h.textContent ?? "").trim(),
        level: Number(h.tagName[1])
      }));
  });
</script>

{#if headings.length}
  <nav class="toc" aria-label="Table of contents">
    <p class="toc-title">Contents</p>
    <ul>
      {#each headings as h (h.id)}
        <li class:sub={h.level === 3}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .toc {
    font-size: 0.85rem;
  }
  .toc-title {
    font-weight: 600;
    color: var(--heading);
    margin: 0 0 0.5rem;
  }
  .toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .toc li.sub {
    padding-left: 0.85rem;
  }
  .toc a {
    color: var(--muted);
    text-decoration: none;
  }
  .toc a:hover {
    color: var(--accent);
  }
  @media (min-width: 64rem) {
    .toc {
      position: sticky;
      top: 1.5rem;
    }
  }
</style>
