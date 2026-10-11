<script lang="ts">
	// Cite-this block for a viz app's FAQ. The version, year, and BibTeX all
	// derive from the app's changelog (newest release), so the displayed
	// citation can never drift from the recorded release history.
	import { site } from '$lib/config';
	import type { AppChangelog } from '$lib/viz/core/changelog';

	let {
		changelog,
		title,
		changelogHref,
		path = `/${changelog.app}/`,
		medium = 'Web App',
		entryType = 'software'
	}: {
		changelog: AppChangelog;
		title: string;
		/** Pre-resolved by the route — `resolve()` needs a literal route id. */
		changelogHref: string;
		/** The cited address; apps keep the trailing-slash form already in print. */
		path?: string;
		/** APA bracketed description, e.g. `Interactive article`. */
		medium?: string;
		/** BibTeX entry type, e.g. `online` for an article. */
		entryType?: string;
	} = $props();

	const url = $derived(`${site.url}${path}`);
	const year = $derived(changelog.releases[0].date.slice(0, 4));
	const bibtex =
		$derived(`@${entryType}{magnusson${changelog.app[0].toUpperCase()}${changelog.app.slice(1)},
  author = {Kristoffer Magnusson},
  title = {${title}},
  url = {${url}},
  version = {${changelog.version}},
  date = {${changelog.releases[0].date}},
}`);
</script>

<p>Cite this page according to your favorite style guide.</p>
<p>
	The current version is {changelog.version} — the
	<!-- changelogHref is the app's changelog route, passed as a plain string. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a href={changelogHref}>changelog</a> records what changed in each release, and what the version numbers
	mean.
</p>
<p><strong>APA 7</strong></p>
<p class="apa">
	Magnusson, K. ({year}). <em>{title}</em> (Version {changelog.version}) [{medium}]. R Psychologist. {url}
</p>
<p><strong>BibTeX</strong></p>
<pre class="code"><code>{bibtex}</code></pre>

<style>
	/* Rendered inside a viz page's FAQ answer, but scoped styles there can't
	   reach this component's elements — carry the page's .apa/.code/link
	   treatment (see /cohend +page.svelte) locally. */
	a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.15em;
		transition:
			text-decoration-color 0.15s,
			color 0.15s;
	}
	a:hover {
		color: var(--heading);
		text-decoration-color: var(--accent);
	}
	.apa {
		font-size: 0.9rem;
		color: var(--muted);
		padding-left: 2em;
		text-indent: -2em;
	}
	.code {
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		overflow-x: auto;
		font-size: 0.85rem;
	}
</style>
