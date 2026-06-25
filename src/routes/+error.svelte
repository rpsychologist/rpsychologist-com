<script lang="ts">
  import { page } from "$app/state";
  import Container from "$lib/components/Container.svelte";
  import Seo from "$lib/components/Seo.svelte";
</script>

<Seo title={`${page.status}`} path="/404" />

<Container>
  <h1>{page.status}</h1>
  <p>
    {page.status === 404
      ? "That page could not be found."
      : (page.error?.message ?? "Something went wrong.")}
  </p>
  <p><a href="/">← Back to the blog</a></p>
</Container>
