<script lang="ts">
	// Self-hosted webfonts (GDPR: no visitor IPs to Google; also drops two
	// render-blocking cross-origin requests and their CSP entries). Latin subset
	// only; weights mirror the old Google Fonts selection. Body text stays on the
	// system stack — see article.css.
	import '@fontsource/ibm-plex-sans/latin-500.css';
	import '@fontsource/ibm-plex-sans/latin-600.css';
	import '@fontsource/ibm-plex-sans/latin-700.css';
	import '@fontsource/ibm-plex-sans/latin-600-italic.css';
	import '@fontsource/ibm-plex-sans/latin-700-italic.css';
	import '@fontsource/ibm-plex-mono/latin-400.css';
	import '@fontsource/ibm-plex-mono/latin-500.css';
	import '@fontsource/ibm-plex-mono/latin-600.css';
	import '$lib/styles/article.css';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { site } from '$lib/config';

	let { children } = $props();

	// Viz embed routes live at `<app>/embed` and render chrome-free (iframe targets):
	// drop the site header + footer. Keyed off the pathname, not a query param, so
	// it's known at prerender — the static HTML for an embed route ships without
	// chrome, so there's no flash. (No real page slug ends in `/embed`.)
	const bare = $derived(page.url.pathname.endsWith('/embed'));
</script>

<svelte:head>
	{#if site.cloudflareAnalyticsToken}
		<script
			defer
			src="https://static.cloudflareinsights.com/beacon.min.js"
			data-cf-beacon={JSON.stringify({ token: site.cloudflareAnalyticsToken })}
		></script>
	{/if}
</svelte:head>

<div class="site">
	{#if !bare}
		<Header />
	{/if}
	<main>
		{@render children()}
	</main>
	{#if !bare}
		<Footer />
	{/if}
</div>

<style>
	.site {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	main {
		flex: 1;
	}
</style>
