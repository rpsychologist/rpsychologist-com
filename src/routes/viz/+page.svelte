<script lang="ts">
  import Container from "$lib/components/Container.svelte";
  import VizGallery from "$lib/components/VizGallery.svelte";
  import Seo from "$lib/components/Seo.svelte";
  import { viz } from "$lib/viz";
</script>

<Seo
  title="Visualizations"
  description="Interactive visualizations of statistical concepts."
  path="/viz"
/>

<Container wide>
  <h1>Visualizations</h1>
  <p class="lead">Interactive tools for building intuition about statistical concepts.</p>
  <VizGallery items={viz} />
</Container>

<style>
  .lead {
    color: var(--muted);
    margin-bottom: 2rem;
  }
</style>
