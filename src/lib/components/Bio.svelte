<script lang="ts">
  import { site } from "$lib/config";
</script>

<aside class="bio">
  <p>
    Written by <strong>{site.author}</strong>, a researcher in clinical psychology. You should
    follow him on <a href={site.social.bluesky}>Bluesky</a> or on
    <a href={site.social.twitter}>Twitter</a>.
  </p>
</aside>

<style>
  .bio {
    margin: 2rem 0;
    padding: 1.25rem 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .bio p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--ink);
  }
</style>
