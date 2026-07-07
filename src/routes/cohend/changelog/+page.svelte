<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import VizChangelog from '$lib/components/VizChangelog.svelte';
	import { changelog } from '$lib/viz/cohend/changelog';
</script>

<Seo
	title="Changelog — Interpreting Cohen's d Effect Size"
	description="Release history and version-numbering policy for the interactive Cohen's d visualization."
	path="/cohend/changelog"
/>

<VizChangelog {changelog} name="Interpreting Cohen's d Effect Size" appHref={resolve('/cohend')} />
