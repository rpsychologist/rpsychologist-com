<script lang="ts">
  import Container from "$lib/components/Container.svelte";
  import Seo from "$lib/components/Seo.svelte";

  // These currently link to the existing (Gatsby) apps; they become internal
  // routes when each visualization is ported in a later phase.
  const viz = [
    {
      title: "Cohen's d",
      description: "Interpreting effect size and distribution overlap.",
      href: "https://rpsychologist.com/cohend"
    },
    {
      title: "Correlation",
      description: "Visualizing the correlation coefficient.",
      href: "https://rpsychologist.com/correlation"
    },
    {
      title: "p-values",
      description: "The relationship between p-values and statistical power.",
      href: "https://rpsychologist.com/pvalue"
    },
    {
      title: "Likelihood",
      description: "Likelihood, probability, and maximum likelihood estimation.",
      href: "https://rpsychologist.com/likelihood"
    },
    {
      title: "Therapist effects",
      description: "How clustering by therapist affects treatment-effect estimates.",
      href: "https://rpsychologist.com/therapist-effects"
    }
  ];
</script>

<Seo
  title="Visualizations"
  description="Interactive visualizations of statistical concepts."
  path="/viz"
/>

<Container wide>
  <h1>Visualizations</h1>
  <p class="lead">Interactive tools for building intuition about statistical concepts.</p>
  <ul class="viz-grid">
    {#each viz as v (v.title)}
      <li>
        <a href={v.href}>
          <h2>{v.title}</h2>
          <p>{v.description}</p>
        </a>
      </li>
    {/each}
  </ul>
</Container>

<style>
  .lead {
    color: var(--muted);
    margin-bottom: 2rem;
  }
  .viz-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
  }
  .viz-grid a {
    display: block;
    height: 100%;
    padding: 1.25rem;
    background: var(--panel);
    border: 1px solid var(--rule);
    border-radius: var(--radius, 12px);
    text-decoration: none;
    color: var(--ink);
    transition: border-color 0.15s;
  }
  .viz-grid a:hover {
    border-color: var(--accent);
  }
  .viz-grid h2 {
    margin: 0 0 0.4rem;
    font-size: 1.15rem;
    color: var(--heading);
  }
  .viz-grid p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }
</style>
