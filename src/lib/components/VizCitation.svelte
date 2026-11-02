<script lang="ts">
	// Cite-this block for a viz app's FAQ or a post. The version, year, and BibTeX
	// derive from the changelog (newest release); inside a post, the title and
	// address derive from the post, so neither can drift from what they cite.
	import { untrack } from 'svelte';
	import { site } from '#lib/config.js';
	import { citationTitle } from '#lib/citation.js';
	import { getPostMeta } from '#lib/post-context.js';
	import type { AppChangelog } from '#lib/viz/core/changelog.js';

	let {
		changelog,
		title: titleProp,
		changelogHref: changelogHrefProp,
		path: pathProp,
		medium: mediumProp,
		entryType: entryTypeProp
	}: {
		changelog: AppChangelog;
		/** Required outside a post; a post passes it only when sentence case
		 * would lowercase a proper noun ("Cohen's"). */
		title?: string;
		/** Required outside a post: pre-resolved by the route, as `resolve()`
		 * needs a literal route id. */
		changelogHref?: string;
		/** The cited address; apps keep the trailing-slash form already in print. */
		path?: string;
		/** APA bracketed description, e.g. `Interactive article`. */
		medium?: string;
		/** BibTeX entry type, e.g. `online` for an article. */
		entryType?: string;
	} = $props();

	const post = getPostMeta();
	const missing = untrack(() => titleProp === undefined || changelogHrefProp === undefined);
	if (!post && missing) {
		throw new Error('VizCitation: `title` and `changelogHref` are required outside a post.');
	}
	const meta = $derived(post?.());

	const title = $derived(titleProp ?? (meta ? citationTitle(meta.title, meta.subtitle) : ''));
	const changelogHref = $derived(changelogHrefProp ?? (meta ? `/${meta.slug}/changelog` : ''));
	const path = $derived(pathProp ?? (meta ? `/${meta.slug}` : `/${changelog.app}/`));
	const medium = $derived(mediumProp ?? (meta ? 'Interactive article' : 'Web App'));
	const entryType = $derived(entryTypeProp ?? (meta ? 'online' : 'software'));

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
	The current version is {changelog.version}
	<!-- changelogHref is the app's changelog route, passed as a plain string. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	(<a href={changelogHref}>changelog</a>).
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
		text-decoration-color: var(--link-underline);
		text-decoration-thickness: var(--link-thickness);
		text-underline-offset: var(--link-offset);
		transition:
			text-decoration-color 0.15s,
			color 0.15s;
	}
	a:hover {
		color: var(--accent);
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
