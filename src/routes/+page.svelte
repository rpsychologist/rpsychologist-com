<script lang="ts">
  // svelte-check resolves the .svx file directly rather than the ambient
  // *.svx module declaration; mdsvex compiles it fine at build time.
  // @ts-expect-error mdsvex document import
  import Article from "$lib/article.svx";

  // Replace with the real deployed URL once known; OG/Twitter tags need an
  // absolute image URL, so this base is prepended to the asset path.
  const siteUrl = "https://rpsychologist.com/descriptive-adjustment";
  const title = "Why Adjusted Regression Coefficients Are Less Descriptive Than They Look | R Psychologist";
  const description =
    "An interactive article about how regression adjustment works and the pitfalls of conditional associations in descriptive studies.";
  const ogImage = `${siteUrl}/og-image.png`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={siteUrl} />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="R Psychologist" />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta
    property="og:image:alt"
    content="The marginal income slope of −0.48 reversing to an adjusted +0.18 once comorbidities are controlled."
  />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@krstoffr" />
  <meta name="twitter:creator" content="@krstoffr" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

<article class="article">
  <Article />
</article>
