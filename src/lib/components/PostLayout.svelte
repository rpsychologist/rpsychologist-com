<script module>
  // mdsvex replaces Markdown elements with named module exports matching the
  // element name. Exporting `img` routes every Markdown image through PostImage
  // (enhanced-img), with no per-post import.
  import img from "./PostImage.svelte";

  export { img };
</script>

<script>
  let { children } = $props();
</script>

{@render children()}
