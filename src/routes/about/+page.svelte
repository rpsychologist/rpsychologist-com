<script lang="ts">
	import { site } from '$lib/config';
	import Container from '$lib/components/Container.svelte';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="About" description="About Kristoffer Magnusson and R Psychologist." path="/about" />

<Container>
	<article class="article">
		<h1>About</h1>
		<p>
			R Psychologist is a blog by <strong>Kristoffer Magnusson</strong>, a researcher in clinical
			psychology. It covers statistics, psychology, and data visualization, with a focus on making
			quantitative ideas tangible through interactive figures.
		</p>
		<p>
			The site is best known for its interactive visualizations of statistical concepts — effect
			sizes, correlation, <em>p</em>-values, likelihood, and more — designed to build intuition for
			ideas that are easy to state but hard to feel.
		</p>
		<h2>Elsewhere</h2>
		<ul>
			<li><a href={site.social.bluesky} rel="external">Bluesky</a></li>
			<li><a href={site.social.mastodon} rel="external">Mastodon</a></li>
			<li><a href={site.social.github} rel="external">GitHub</a></li>
			<li><a href={site.social.twitter} rel="external">Twitter / X</a></li>
		</ul>
	</article>
</Container>
