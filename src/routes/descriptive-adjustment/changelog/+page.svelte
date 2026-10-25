<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import VizChangelog from '#lib/components/VizChangelog.svelte';
	import { changelog } from '#lib/viz/descriptive-adjustment/changelog.js';

	const name = 'Why Adjusted Regression Coefficients Are Less Descriptive Than They Look';
</script>

<Seo
	title={`Changelog — ${name}`}
	description="Release history and version-numbering policy for the interactive article on regression adjustment in descriptive studies."
	path="/descriptive-adjustment/changelog"
	card="descriptive-adjustment"
	imageAlt={name}
/>

<VizChangelog {changelog} {name} appHref={resolve('/[slug]', { slug: 'descriptive-adjustment' })} />
