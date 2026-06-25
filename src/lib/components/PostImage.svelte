<script lang="ts" module>
  // Raster images get enhanced (AVIF/WebP + srcset + intrinsic dimensions).
  // The enhanced module default is enhanced-img's Picture object; typed loosely
  // here since its type isn't exported for direct import.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enhanced = import.meta.glob<{ default: any }>(
    "/content/blog/**/*.{avif,gif,jpeg,jpg,png,webp}",
    { eager: true, query: { enhanced: true } }
  );
  // Plain hashed URLs: fallback for SVG (enhanced-img is static-only for SVG)
  // and any raster not matched above.
  const urls = import.meta.glob<string>(
    "/content/blog/**/*.{avif,gif,jpeg,jpg,png,webp,svg}",
    { eager: true, query: "?url", import: "default" }
  );
</script>

<script lang="ts">
  /** Markdown images, with `src` already rewritten to a project-absolute path
   *  by remarkResolveImages. */
  let { src, alt = "", title = undefined }: { src: string; alt?: string; title?: string } =
    $props();

  const pic = $derived(enhanced[src]?.default);
  const url = $derived(urls[src]);
</script>

{#if pic}
  <enhanced:img class="post-image" src={pic} {alt} {title} />
{:else if url}
  <img class="post-image" src={url} {alt} {title} loading="lazy" decoding="async" />
{:else}
  <img class="post-image" {src} {alt} {title} loading="lazy" decoding="async" />
{/if}

<style>
  .post-image {
    display: block;
    max-width: 100%;
    height: auto;
    margin-inline: auto;
    border-radius: var(--radius, 8px);
  }
</style>
