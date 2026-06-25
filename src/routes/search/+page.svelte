<script lang="ts">
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import Container from "$lib/components/Container.svelte";
  import Seo from "$lib/components/Seo.svelte";

  // Pagefind's index + UI are emitted into /pagefind by the `pagefind` CLI after
  // `vite build`, so they don't exist during `vite dev` (search works in the
  // production build / preview). Load them via injected tags to bypass Vite's
  // module resolution of a path that only exists post-build.
  onMount(() => {
    if (dev) return; // index isn't built in dev; avoid a 404

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/pagefind/pagefind-ui.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "/pagefind/pagefind-ui.js";
    script.onload = () => {
      // @ts-expect-error injected global from pagefind-ui.js
      new window.PagefindUI({ element: "#search", showImages: false, showSubResults: true });
    };
    document.body.appendChild(script);
  });
</script>

<Seo title="Search" description="Search the blog." path="/search" />

<Container>
  <h1>Search</h1>
  {#if dev}
    <p class="dev-note">
      Search runs on a Pagefind index generated at <code>pnpm build</code>. It isn't served
      by <code>vite dev</code>/<code>preview</code>; test it by serving the build output:
      <code>pnpm build &amp;&amp; npx serve build</code>.
    </p>
  {/if}
  <div id="search"></div>
  <noscript>Search requires JavaScript.</noscript>
</Container>

<style>
  .dev-note {
    color: var(--muted);
    font-size: 0.9rem;
    background: var(--panel);
    border: 1px solid var(--rule);
    border-radius: var(--radius, 8px);
    padding: 0.75rem 1rem;
  }
  #search {
    margin-top: 1.5rem;
    /* Pagefind UI custom properties (themed to match the site). */
    --pagefind-ui-primary: var(--accent);
    --pagefind-ui-text: var(--ink);
    --pagefind-ui-background: var(--bg);
    --pagefind-ui-border: var(--rule);
    --pagefind-ui-tag: var(--panel);
    --pagefind-ui-border-radius: var(--radius, 8px);
  }
</style>
