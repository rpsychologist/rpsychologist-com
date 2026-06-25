<script lang="ts">
  import { site } from "$lib/config";

  let { slug, title }: { slug: string; title: string } = $props();

  const enc = encodeURIComponent;
  const url = $derived(`${site.url}/${slug}`);
  const bluesky = $derived(
    `https://bsky.app/intent/compose?text=${enc(`${title} ${url} @rpsychologist.com`)}`
  );
  const twitter = $derived(
    `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}&via=krstoffr`
  );
  const facebook = $derived(`https://www.facebook.com/sharer.php?u=${enc(url)}`);
</script>

<span class="share">
  <span class="share-label">Share:</span>
  <a href={bluesky} target="_blank" rel="noopener">Bluesky</a>
  <a href={twitter} target="_blank" rel="noopener">Twitter</a>
  <a href={facebook} target="_blank" rel="noopener">Facebook</a>
</span>

<style>
  .share {
    display: inline-flex;
    gap: 0.6rem;
    align-items: center;
    font-size: 0.85rem;
  }
  .share-label {
    color: var(--muted);
  }
  .share a {
    color: var(--accent);
    text-decoration: none;
  }
  .share a:hover {
    text-decoration: underline;
  }
</style>
