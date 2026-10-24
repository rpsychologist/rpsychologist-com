<script lang="ts">
	// Release history page for a viz app. The audience is citing researchers
	// and teachers with assignments built on the app; entries follow the Keep
	// a Changelog structure (Added/Changed/… headings) so the layout needs no decoding.
	import {
		CATEGORIES,
		CATEGORY_LABELS,
		compareUrl,
		tagUrl,
		type AppChangelog
	} from '$lib/viz/core/changelog';

	let {
		changelog,
		name,
		appHref
	}: {
		changelog: AppChangelog;
		name: string;
		/** Pre-resolved by the route — `resolve()` needs a literal route id. */
		appHref: string;
	} = $props();

	function formatDate(iso: string): string {
		// Fixed locale: the page is prerendered, so the build machine's locale
		// must not leak into the output.
		return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="page">
	<header class="hero">
		<h1 class="display">Changelog</h1>
		<!-- appHref is the app's route, passed as a plain string by its page. -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<p class="subtitle"><a href={appHref}>{name}</a></p>
	</header>

	{#each changelog.releases as release, i (release.version)}
		{@const older = changelog.releases[i + 1]}
		<section class="release">
			<h2 id="v{release.version}">
				{release.version}
				<span class="meta">
					<time datetime={release.date}>{formatDate(release.date)}</time>
					·
					<!-- GitHub links, external. -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={tagUrl(changelog.app, release.version)}>source</a>
					{#if older}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						· <a href={compareUrl(changelog.app, older.version, release.version)}>diff</a>
					{/if}
				</span>
			</h2>
			{#each CATEGORIES as cat (cat)}
				{#if release[cat]}
					<!-- "Breaking changes" is the one heading a non-dev reader must not
					     miss; the label explains itself, so emphasis here is legible. -->
					<h3 class:breaking={cat === 'breaking'}>{CATEGORY_LABELS[cat]}</h3>
					<ul>
						{#each release[cat] as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				{/if}
			{/each}
		</section>
	{/each}

	{#if changelog.note}
		<p class="note">{changelog.note}</p>
	{/if}
</div>

<style>
	.page {
		max-width: 700px;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 4rem;
	}
	.hero {
		text-align: center;
		margin: 1rem 0 2rem;
	}
	.hero h1 {
		margin-bottom: 0.3rem;
	}
	.subtitle {
		font-size: 1.15rem;
		font-weight: 600;
		margin: 0;
	}
	.release {
		margin-top: 2.25rem;
	}
	.release h2 {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		font-family: var(--font-mono);
		margin-bottom: 0.25rem;
	}
	.meta {
		font-size: 0.85rem;
		font-weight: 400;
		color: var(--muted);
	}
	.release h3 {
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 1rem 0 0.3rem;
	}
	.release h3.breaking {
		color: var(--heading);
	}
	.release ul {
		margin: 0;
		padding-left: 1.2rem;
		line-height: 1.55;
	}
	.release li {
		padding: 0.15rem 0;
	}
	.note {
		margin-top: 2.25rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
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
	.subtitle a {
		color: var(--heading);
		text-decoration: none;
	}
	.subtitle a:hover {
		text-decoration: underline;
		text-decoration-color: var(--accent);
	}
</style>
