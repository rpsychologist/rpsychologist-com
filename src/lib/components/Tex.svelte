<script lang="ts">
  // Inline LaTeX rendered with KaTeX, so every mathematical symbol in the
  // interactive figures stays LaTeX rather than Unicode. KaTeX stylesheet is
  // loaded once in app.html.
  import katex from "katex";

  let { math, display = false }: { math: string; display?: boolean } = $props();

  const html = $derived(
    katex.renderToString(math, { displayMode: display, throwOnError: false })
  );
</script>

<!-- `math` is always an author-controlled constant (never user input) and the
     markup is KaTeX's own sanitized output, so {@html} is safe here. -->
<span class={["tex", { display }]}>{@html html}</span>

<style>
  .tex {
    white-space: nowrap;
  }
  .tex.display {
    display: block;
    margin: 0.4rem 0;
  }
</style>
