<script lang="ts">
  let { children, wide = false }: { children: import("svelte").Snippet; wide?: boolean } =
    $props();
</script>

<div class="container" class:wide>
  {@render children()}
</div>

<style>
  .container {
    max-width: 48rem;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
  }
  .container.wide {
    max-width: 60rem;
  }
</style>
