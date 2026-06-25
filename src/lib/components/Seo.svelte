<script lang="ts">
  import { site } from "$lib/config";

  interface Props {
    /** Page title (site name is appended automatically). */
    title: string;
    description?: string;
    /** Path beginning with "/" (canonical URL is built from it). */
    path: string;
    type?: "website" | "article";
    /** Absolute URL or site-relative path to the share image. */
    image?: string;
    imageAlt?: string;
    /** Article metadata (ISO strings). */
    published?: string;
    modified?: string;
    tags?: string[];
  }

  let {
    title,
    description = site.description,
    path,
    type = "website",
    image,
    imageAlt,
    published,
    modified,
    tags = []
  }: Props = $props();

  const fullTitle = $derived(title === site.title ? title : `${title} | ${site.title}`);
  const canonical = $derived(new URL(path, site.url).href);
  const ogImage = $derived(image ? new URL(image, site.url).href : undefined);

  const jsonLd = $derived(
    JSON.stringify(
      type === "article"
        ? {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: title,
            description,
            url: canonical,
            datePublished: published,
            dateModified: modified ?? published,
            image: ogImage,
            keywords: tags.join(", ") || undefined,
            author: { "@type": "Person", name: site.author, url: site.url },
            publisher: { "@type": "Person", name: site.author, url: site.url },
            mainEntityOfPage: canonical
          }
        : {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.title,
            description,
            url: site.url,
            author: { "@type": "Person", name: site.author, url: site.url }
          }
    )
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <link
    rel="alternate"
    type="application/rss+xml"
    title={site.title}
    href={`${site.url}/rss.xml`}
  />

  <meta property="og:type" content={type} />
  <meta property="og:site_name" content={site.title} />
  <meta property="og:url" content={canonical} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
    {#if imageAlt}<meta property="og:image:alt" content={imageAlt} />{/if}
  {/if}

  <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
  <meta name="twitter:site" content={site.twitter} />
  <meta name="twitter:creator" content={site.twitter} />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  {#if ogImage}<meta name="twitter:image" content={ogImage} />{/if}

  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
