<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import VizChangelog from '$lib/components/VizChangelog.svelte';
	import { changelog } from '$lib/viz/correlation/changelog';
</script>

<Seo
	title="Changelog — Interpreting Correlations"
	description="Release history and version-numbering policy for the interactive correlation visualization."
	path="/correlation/changelog"
/>

<VizChangelog {changelog} name="Interpreting Correlations" appHref={resolve('/correlation')} />
