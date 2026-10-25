<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import VizChangelog from '#lib/components/VizChangelog.svelte';
	import { changelog } from '#lib/viz/likelihood/changelog.js';
</script>

<Seo
	title="Changelog — Understanding Maximum Likelihood Estimation"
	description="Release history and version-numbering policy for the interactive maximum likelihood estimation visualization."
	path="/likelihood/changelog"
	card="likelihood"
	imageAlt="Understanding Maximum Likelihood Estimation"
/>

<VizChangelog
	{changelog}
	name="Understanding Maximum Likelihood Estimation"
	appHref={resolve('/likelihood')}
/>
