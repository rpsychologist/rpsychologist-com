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
              <svg
                class="chev"
                class:open={s.open}
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
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
  /* Matches the section kickers elsewhere — letterspaced caps, quiet. */
  .toc-title {
    margin: 0 0 0.5rem;
    font-family: var(--font-heading);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  /* No width:100% — these are block-level flex, so they fill naturally without
     the content-box + padding overflow that produced a stray scrollbar. */
  .toc-link,
  .toc-toggle {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    padding: 0.26rem 0;
    color: var(--muted);
    text-align: left;
    text-decoration: none;
    background: none;
    border: 0;
    cursor: pointer;
    font: inherit;
    line-height: 1.4;
  }
  .toc-sub {
    margin: 0.05rem 0 0.25rem;
  }
  .toc-sub a {
    display: block;
    padding: 0.22rem 0 0.22rem 1.4rem;
    color: var(--muted);
    text-decoration: none;
    line-height: 1.4;
  }
  .toc-link:hover,
  .toc-toggle:hover,
  .toc-sub a:hover {
    color: var(--heading);
  }
  .chev {
    flex-shrink: 0;
    align-self: center;
    color: var(--muted);
    transition: transform 0.15s;
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
      overflow-x: hidden;
    }
  }
</style>
