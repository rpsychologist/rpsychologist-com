<script lang="ts">
	import { site } from '$lib/config';
	import { SHARE_SIZE, SITE_CARD_ALT, shareImage } from '$lib/share';

	interface Props {
		/** Page title (site name is appended automatically). */
		title: string;
		description?: string;
		/** Path beginning with "/" (canonical URL is built from it). */
		path: string;
		/** `app` is a viz app: an Open Graph website, a schema.org WebApplication. */
		type?: 'website' | 'article' | 'app';
		/** Share card key (see `$lib/share`); defaults to the site-wide card. */
		card?: string;
		imageAlt?: string;
		/** The app's displayed version (`type: 'app'`). */
		version?: string;
		noindex?: boolean;
		/** Article metadata (ISO strings). */
		published?: string;
		modified?: string;
		tags?: string[];
		/** Translations of this page (`hreflang` alternates, incl. `x-default`). */
		alternates?: { hrefLang: string; path: string }[];
		/** Open Graph locales (language_TERRITORY) of this page and its translations. */
		locale?: string;
		localeAlternates?: string[];
	}

	let {
		title,
		description = site.description,
		path,
		type = 'website',
		card = 'site',
		imageAlt = card === 'site' ? SITE_CARD_ALT : title,
		version,
		noindex = false,
		published,
		modified,
		tags = [],
		alternates = [],
		locale = 'en_US',
		localeAlternates = []
	}: Props = $props();

	const fullTitle = $derived(title === site.title ? title : `${title} | ${site.title}`);
	const canonical = $derived(new URL(path, site.url).href);
	const ogImage = $derived(new URL(shareImage(card), site.url).href);
	const author = { '@type': 'Person', name: site.author, url: site.url };
	const website = { '@type': 'WebSite', name: site.title, url: site.url };

	const jsonLd = $derived.by(() => {
		const page = { url: canonical, name: title, description, image: ogImage };
		const data =
			type === 'article'
				? {
						'@type': 'BlogPosting',
						headline: title,
						description,
						url: canonical,
						datePublished: published,
						dateModified: modified ?? published,
						image: ogImage,
						keywords: tags.join(', ') || undefined,
						author,
						publisher: author,
						mainEntityOfPage: canonical
					}
				: type === 'app'
					? {
							'@type': 'WebApplication',
							...page,
							applicationCategory: 'EducationalApplication',
							operatingSystem: 'Any',
							browserRequirements: 'Requires JavaScript',
							softwareVersion: version,
							isAccessibleForFree: true,
							author
						}
					: path === '/'
						? { ...website, description, author }
						: { '@type': 'WebPage', ...page, isPartOf: website };
		return JSON.stringify({ '@context': 'https://schema.org', ...data });
	});

	// Build the JSON-LD script element as a string. Its closing tag must be
	// escaped (backslash before the slash): an unescaped closing tag here would
	// terminate this component's own script block during HTML tokenization. The
	// escape is redundant at the JS string level (hence the disable) but required
	// at the source level.
	// eslint-disable-next-line no-useless-escape
	const jsonLdScript = $derived(`<script type="application/ld+json">${jsonLd}<\/script>`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<link rel="canonical" href={canonical} />
	{#each alternates as alt (alt.hrefLang)}
		<link rel="alternate" hreflang={alt.hrefLang} href={new URL(alt.path, site.url).href} />
	{/each}
	<link
		rel="alternate"
		type="application/rss+xml"
		title={site.title}
		href={`${site.url}/rss.xml`}
	/>

	<!-- og:title/twitter:title drop the site-name suffix: og:site_name carries it,
	     and previews have little room. -->
	<meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
	<meta property="og:site_name" content={site.title} />
	<meta property="og:locale" content={locale} />
	{#each localeAlternates as alt (alt)}<meta property="og:locale:alternate" content={alt} />{/each}
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(SHARE_SIZE.width)} />
	<meta property="og:image:height" content={String(SHARE_SIZE.height)} />
	<meta property="og:image:alt" content={imageAlt} />
	{#if type === 'article'}
		{#if published}<meta property="article:published_time" content={published} />{/if}
		<meta property="article:author" content={`${site.url}/about`} />
		{#each tags as tag (tag)}<meta property="article:tag" content={tag} />{/each}
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={site.twitter} />
	<meta name="twitter:creator" content={site.twitter} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={imageAlt} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonLdScript}
</svelte:head>
