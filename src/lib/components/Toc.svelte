<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { TocSection } from 'virtual:posts';

	// Sections are extracted at build time (vite-plugin-posts) and prerendered —
	// building the list from the DOM in onMount pushed the article down at
	// hydration (mobile CLS ~0.36). Only the open/closed state is client-side,
	// keyed by id so it resets naturally when navigating between posts.
	let { sections = [] }: { sections?: TocSection[] } = $props();
	let open = $state<Record<string, boolean>>({});
</script>

{#if sections.length}
	<nav class="toc" aria-label="Table of contents">
		<p class="toc-title">Contents</p>
		<ul>
			{#each sections as s (s.id)}
				<li>
					{#if s.subs.length}
						<button
							class="toc-toggle"
							aria-expanded={!!open[s.id]}
							onclick={() => (open[s.id] = !open[s.id])}
						>
							<svg
								class="chev"
								class:open={open[s.id]}
								width="11"
								height="11"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<polyline points="9 6 15 12 9 18" />
							</svg>
							<span class="toc-text">{s.text}</span>
						</button>
						{#if open[s.id]}
							<ul class="toc-sub" transition:slide={{ duration: 150 }}>
								<li><a href={`#${s.id}`}>Intro</a></li>
								{#each s.subs as sub (sub.id)}
									<li><a href={`#${sub.id}`}>{sub.text}</a></li>
								{/each}
							</ul>
						{/if}
					{:else}
						<a class="toc-link" href={`#${s.id}`}>{s.text}</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.toc {
		font-size: 0.85rem;
	}
	/* Matches the section kickers elsewhere — letterspaced caps, quiet. */
	.toc-title {
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	.toc ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* No width:100% — these are block-level flex, so they fill naturally without
     the content-box + padding overflow that produced a stray scrollbar. */
	.toc-link,
	.toc-toggle {
		display: flex;
		gap: 0.4rem;
		align-items: baseline;
		padding: 0.26rem 0;
		color: var(--muted);
		text-align: left;
		text-decoration: none;
		background: none;
		border: 0;
		cursor: pointer;
		font: inherit;
		line-height: 1.4;
	}
	.toc-sub {
		margin: 0.05rem 0 0.25rem;
	}
	.toc-sub a {
		display: block;
		padding: 0.22rem 0 0.22rem 1.4rem;
		color: var(--muted);
		text-decoration: none;
		line-height: 1.4;
	}
	.toc-link:hover,
	.toc-toggle:hover,
	.toc-sub a:hover {
		color: var(--heading);
	}
	.chev {
		flex-shrink: 0;
		align-self: center;
		color: var(--muted);
		transition: transform 0.15s;
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.toc-text {
		flex: 1;
	}
	@media (min-width: 64rem) {
		.toc {
			position: sticky;
			top: 1.5rem;
			max-height: calc(100vh - 3rem);
			overflow-y: auto;
			overflow-x: hidden;
		}
	}
</style>
