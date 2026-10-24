<script lang="ts">
	import { onMount } from 'svelte';
	import Container from '$lib/components/Container.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { loadPagefindUI, RESULT_TEMPLATE } from '$lib/search';

	// Inline Component UI building blocks — the deep-link/no-header-modal
	// fallback. Own instance name so its state doesn't sync with the header
	// modal's "default" instance on the same page.
	onMount(() => {
		loadPagefindUI().catch(() => {});
	});
</script>

<Seo title="Search" description="Search the blog." path="/search" noindex />

<Container>
	<h1>Search</h1>
	<div class="search-ui">
		<pagefind-input instance="page"></pagefind-input>
		<pagefind-summary instance="page"></pagefind-summary>
		<!-- Static template from src/lib/search.ts, no user input. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<pagefind-results instance="page" max-sub-results="3">{@html RESULT_TEMPLATE}</pagefind-results>
	</div>
	<noscript>Search requires JavaScript.</noscript>
</Container>

<style>
	.search-ui {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.5rem;
		/* Same token mapping as the header modal (see SearchModal.svelte). */
		--pf-font: var(--font-sans);
		--pf-text: var(--ink);
		--pf-text-muted: var(--muted);
		--pf-text-secondary: var(--muted);
		--pf-background: var(--bg);
		--pf-border: var(--rule);
		--pf-border-focus: var(--accent);
		--pf-border-radius: var(--radius);
		--pf-hover: var(--panel);
		--pf-outline-focus: var(--accent);
		--pf-skeleton: var(--panel);
		--pf-skeleton-shine: var(--rule);
	}
</style>
