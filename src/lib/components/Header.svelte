<script lang="ts">
  import Icon from "./Icon.svelte";
  import Logo from "./Logo.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";

  import { site } from "$lib/config";

  const nav = [
    { label: "Posts", href: "/posts" },
    { label: "Visualizations", href: "/viz" },
    { label: "About", href: "/about" },
    { label: "Search", href: "/search" }
  ];
  const socials = [
    { name: "bluesky", href: site.social.bluesky, label: "Bluesky" },
    { name: "github", href: site.social.github, label: "GitHub" }
  ];

  let menuOpen = $state(false);
</script>

<header class="site-header">
  <div class="bar">
    <a class="brand" href="/" aria-label="R Psychologist home">
      <Logo height={44} />
    </a>

    <nav class="nav" aria-label="Primary">
      {#each nav as item (item.href)}
        <a href={item.href}>{item.label}</a>
      {/each}
    </nav>

    <div class="actions">
      {#each socials as s (s.name)}
        <a class="social" href={s.href} aria-label={s.label} target="_blank" rel="noopener">
          <Icon name={s.name} size={17} />
        </a>
      {/each}
      <ThemeToggle />
      <button
        class="menu-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        onclick={() => (menuOpen = !menuOpen)}
      >
        {#if menuOpen}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        {:else}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  {#if menuOpen}
    <nav id="mobile-menu" class="mobile-menu" aria-label="Primary">
      {#each nav as item (item.href)}
        <a href={item.href} onclick={() => (menuOpen = false)}>{item.label}</a>
      {/each}
      <div class="mobile-socials">
        {#each socials as s (s.name)}
          <a class="social" href={s.href} aria-label={s.label} target="_blank" rel="noopener">
            <Icon name={s.name} size={18} />
          </a>
        {/each}
      </div>
    </nav>
  {/if}
</header>

<style>
  .site-header {
    position: relative;
    background: var(--bg);
    border-bottom: 1px solid var(--rule);
  }
  .bar {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0.6rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: var(--heading);
  }
  .nav {
    display: flex;
    gap: 1.1rem;
    margin-left: auto;
    font-size: 0.9rem;
  }
  .nav a {
    color: var(--muted);
    text-decoration: none;
  }
  .nav a:hover {
    color: var(--accent);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .social {
    color: var(--muted);
    display: inline-flex;
    transition: color 0.15s;
  }
  .social:hover {
    color: var(--accent);
  }
  .menu-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: none;
    color: var(--heading);
    cursor: pointer;
  }

  /* Mobile dropdown panel (only rendered when open) */
  .mobile-menu {
    display: flex;
    flex-direction: column;
    padding: 0.25rem 1.25rem 1rem;
  }
  .mobile-menu a {
    color: var(--ink);
    text-decoration: none;
    padding: 0.65rem 0;
    font-size: 1rem;
  }
  .mobile-menu a:hover {
    color: var(--accent);
  }
  .mobile-socials {
    display: flex;
    gap: 1.1rem;
    margin-top: 0.5rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--rule);
  }
  /* Guard against the panel lingering if the viewport grows while open */
  @media (min-width: 48.0625rem) {
    .mobile-menu {
      display: none;
    }
  }

  @media (max-width: 48rem) {
    .nav {
      display: none;
    }
    .actions {
      margin-left: auto;
      gap: 0.5rem;
    }
    .actions .social {
      display: none;
    }
    .menu-toggle {
      display: inline-flex;
    }
    .brand :global(svg) {
      height: 34px;
    }
  }
</style>
