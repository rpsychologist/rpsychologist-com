<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import VizChangelog from '#lib/components/VizChangelog.svelte';
	import { changelog } from '#lib/viz/odds-ratio/changelog.js';

	const name = 'Odds Ratios Are Not Risk Ratios';
</script>

<Seo
	title={`Changelog — ${name}`}
	description="Release history and version-numbering policy for the interactive article on odds ratios, risk ratios, and risk differences."
	path="/odds-ratio/changelog"
/>

<VizChangelog {changelog} {name} appHref={resolve('/[slug]', { slug: 'odds-ratio' })} />
