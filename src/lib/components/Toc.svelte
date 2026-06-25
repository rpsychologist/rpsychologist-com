<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  type Sub = { id: string; text: string };
  type Section = { id: string; text: string; subs: Sub[]; open: boolean };

  let sections = $state<Section[]>([]);

  // Built client-side from rendered headings (ids from rehype-slug). Posts use
  // inconsistent heading levels (some start sections at h1, others at h2), so the
  // shallowest level present becomes the "section" level and anything deeper is a
  // collapsible subsection. The post title h1 has no id, so it's filtered out.
  // Progressive enhancement — no-JS readers just don't get the TOC.
  onMount(() => {
    const article = document.querySelector(".article");
    if (!article) return;
    const heads = [
      ...article.querySelectorAll<HTMLElement>("h1, h2, h3, h4")
    ].filter((h) => h.id && !h.closest(".post-header"));
    if (!heads.length) return;

    const level = (h: HTMLElement) => Number(h.tagName[1]);
    const min = Math.min(...heads.map(level));

    const out: Section[] = [];
    for (const h of heads) {
      const text = (h.textContent ?? "").trim();
      if (level(h) === min || out.length === 0) {
        out.push({ id: h.id, text, subs: [], open: false });
      } else {
        out[out.length - 1].subs.push({ id: h.id, text });
      }
    }
    sections = out;
  });
</script>

{#if sections.length}
  <nav class="toc" aria-label="Table of contents">
    <p class="toc-title">Contents</p>
    <ul>
      {#each sections as s, i (s.id)}
        <li>
          {#if s.subs.length}
            <button
              class="toc-toggle"
              aria-expanded={s.open}
              onclick={() => (sections[i].open = !sections[i].open)}
            >
              <span class="chev" class:open={s.open} aria-hidden="true">▸</span>
              <span class="toc-text">{s.text}</span>
            </button>
            {#if s.open}
              <ul class="toc-sub" transition:slide={{ duration: 150 }}>
                <li><a href={`#${s.id}`}>Intro</a></li>
                {#each s.subs as sub (sub.id)}
                  <li><a href={`#${sub.id}`}>{sub.text}</a></li>
                {/each}
              </ul>
            {/if}
          {:else}
            <a class="toc-link" href={`#${s.id}`}>{s.text}</a>
          {/if}
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
    margin: 0 0 0.6rem;
  }
  .toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .toc-link,
  .toc-toggle,
  .toc-sub a {
    display: flex;
    width: 100%;
    gap: 0.35rem;
    align-items: center;
    color: var(--muted);
    text-decoration: none;
    text-align: left;
    background: none;
    border: 0;
    border-left: 3px solid transparent;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font: inherit;
  }
  .toc-link:hover,
  .toc-toggle:hover,
  .toc-sub a:hover {
    color: var(--accent);
    border-left-color: var(--accent);
  }
  .toc-sub {
    padding-left: 0.5rem !important;
  }
  .chev {
    transition: transform 0.15s;
    font-size: 0.7em;
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .toc-text {
    flex: 1;
  }
  @media (min-width: 64rem) {
    .toc {
      position: sticky;
      top: 1.5rem;
      max-height: calc(100vh - 3rem);
      overflow-y: auto;
    }
  }
</style>
