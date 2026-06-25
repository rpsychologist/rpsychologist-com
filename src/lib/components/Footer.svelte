<script lang="ts">
  import Icon from "./Icon.svelte";
  import Logo from "./Logo.svelte";

  // Placeholder links matching the brand footer in the screenshots.
  const connect = [
    { name: "bluesky", label: "Bluesky", href: "https://bsky.app/profile/rpsychologist.com" },
    { name: "github", label: "GitHub", href: "https://github.com/rpsychologist" },
    { name: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/kristofferm" }
  ];
  const nav = [
    { label: "About", href: "https://rpsychologist.com/about" },
    { label: "Posts", href: "https://rpsychologist.com/posts" },
    { label: "Visualizations", href: "https://rpsychologist.com/viz" }
  ];
  const year = new Date().getFullYear();
</script>

<footer class="site-footer">
  <div class="inner">
    <div class="brand-col">
      <div class="brand">
        <Logo height={26} />
      </div>
      <p class="blurb">Designed and built by Kristoffer Magnusson.</p>
    </div>

    <div class="col">
      <h3>Connect</h3>
      <ul>
        {#each connect as item (item.name)}
          <li>
            <a href={item.href} target="_blank" rel="noopener">
              <Icon name={item.name} size={15} /><span>{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>

    <div class="col">
      <h3>Site</h3>
      <ul>
        {#each nav as item (item.label)}
          <li>
            <a href={item.href} target="_blank" rel="noopener">
             {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <div class="legal">
    © {year} Kristoffer Magnusson. Text content CC BY 4.0.
  </div>
</footer>

<style>
  .site-footer {
    background: var(--navy);
    color: var(--navy-muted);
    margin-top: 4rem;
  }
  .inner {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 1.5rem;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 2rem;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    color: var(--navy-ink);
  }
  .blurb {
    margin: 0.9rem 0 0;
    font-size: 0.88rem;
    max-width: 24rem;
    line-height: 1.5;
  }
  .col h3 {
    color: var(--navy-ink);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 0.8rem;
  }
  .col ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .col a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--navy-muted);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.15s;
  }
  .col a:hover {
    color: #fff;
  }
  .legal {
    max-width: 72rem;
    margin: 0 auto;
    padding: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.8rem;
    color: var(--navy-muted);
  }

  @media (max-width: 48rem) {
    .inner {
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .brand-col {
      grid-column: 1 / -1;
    }
  }
</style>
