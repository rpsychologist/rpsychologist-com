<script lang="ts">
	import { site } from '$lib/config';
	import Container from '$lib/components/Container.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import thesisCover from '$lib/assets/thesis_cover_front.png?enhanced';

	const thesisUrl = 'https://openarchive.ki.se/xmlui/handle/10616/46909';
	const elsewhere = [
		{ name: 'bluesky', href: site.social.bluesky, label: 'Bluesky' },
		{ name: 'github', href: site.social.github, label: 'GitHub' },
		{ name: 'x', href: site.social.twitter, label: 'Twitter' },
		{ name: 'linkedin', href: site.social.linkedin, label: 'LinkedIn' }
	];
</script>

<Seo title="About" description="About Kristoffer Magnusson and R Psychologist." path="/about" />

<Container>
	<article class="article">
		<p class="eyebrow">About</p>
		<h1>Kristoffer Magnusson, PhD</h1>
		<p class="lede">
			I'm a licensed psychologist and researcher in clinical psychology at the
			<a href="https://ki.se/en/cns/centre-for-psychiatry-research" rel="external"
				>Centre for Psychiatry Research, Karolinska Institutet</a
			>, in Stockholm, Sweden. My interests are a mix of open science, gaming and gambling problems,
			statistics, therapist effects, visualization, and psychotherapy.
		</p>
		<p>
			I also have a background in web development, and I still work part-time as a web developer
			(mostly React/NextJS/Node). I have created various
			<a href="/viz">interactive visualizations of statistical concepts</a>.
		</p>

		<!-- Horizontal facts strip carries the structure a tall sidebar can't, without
		     the dead space a short bio leaves beside one. -->
		<div class="facts">
			<div class="fact">
				<p class="eyebrow">Affiliation</p>
				<p>
					<a href="https://ki.se/en/cns/centre-for-psychiatry-research" rel="external"
						>Centre for Psychiatry Research, Karolinska Institutet</a
					>
				</p>
			</div>
			<div class="fact">
				<p class="eyebrow">Publications</p>
				<p>
					<a href="https://scholar.google.com/citations?user=IK8wjnUAAAAJ" rel="external"
						>Google Scholar</a
					>
					· <a href="https://orcid.org/0000-0003-0713-0556" rel="external">ORCID</a>
				</p>
			</div>
			<div class="fact">
				<p class="eyebrow">Elsewhere</p>
				<div class="icons">
					{#each elsewhere as e (e.name)}
						<a href={e.href} aria-label={e.label} target="_blank" rel="noopener external">
							<Icon name={e.name} size={18} />
						</a>
					{/each}
				</div>
			</div>
		</div>

		<!-- Thesis as a horizontal figure: the heavy black cover is balanced by text
		     beside it, rather than standing alone as a billboard. -->
		<figure class="thesis">
			<a class="thesis-cover" href={thesisUrl} rel="external" aria-label="K Magnusson PhD thesis">
				<enhanced:img src={thesisCover} alt="K Magnusson PhD thesis cover" />
			</a>
			<figcaption>
				<p class="eyebrow">PhD thesis</p>
				<p class="thesis-title">
					<a href={thesisUrl} rel="external"
						>Methodological issues in psychological treatment research</a
					>
				</p>
				<p class="thesis-note">Doctoral thesis · Karolinska Institutet, 2019</p>
			</figcaption>
		</figure>

		<h2 class="eyebrow">Questions</h2>
		<p>
			Please use
			<a href="{site.repo}/discussions" rel="external">GitHub Discussions</a>
			for any questions related to this site, or
			<a href="{site.repo}/issues" rel="external">open an issue on GitHub</a>
			if you've found a bug or want to make a feature request.
		</p>

		<h2 class="eyebrow">Contact</h2>
		<p>
			Email me at <span class="email">hello [at] rpsychologist.com</span>, or reach me on any of the
			platforms listed under Elsewhere.
		</p>
	</article>
</Container>

<style>
	.eyebrow {
		margin: 0 0 0.4rem;
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	.article h1 {
		margin: 0 0 1rem;
		letter-spacing: -0.025em;
	}
	.lede {
		font-size: 1.2rem;
		line-height: 1.65;
	}
	.email {
		white-space: nowrap;
	}

	/* Facts strip: three hairline-separated cells, stacks on narrow screens. */
	.facts {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr;
		gap: 1.5rem;
		margin: 2.5rem 0;
		padding: 1.25rem 0;
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
	}
	.fact p {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.5;
	}
	.fact p a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.15em;
	}
	.fact p a:hover {
		color: var(--heading);
		text-decoration-color: var(--accent);
	}
	.icons {
		display: flex;
		gap: 0.9rem;
	}
	.icons a {
		display: inline-flex;
		color: var(--muted);
		transition: color 0.15s;
	}
	.icons a:hover {
		color: var(--accent);
	}
	@media (max-width: 34rem) {
		.facts {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
	}

	/* Thesis figure: small cover beside its title + note. */
	.thesis {
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
		margin: 2.5rem 0;
	}
	.thesis-cover {
		flex-shrink: 0;
		display: block;
		width: 110px;
	}
	.thesis-cover :global(img) {
		display: block;
		width: 100%;
		height: auto;
		border-radius: var(--radius, 8px);
		border: 1px solid var(--rule);
	}
	.thesis figcaption {
		min-width: 0;
		/* Cancel the global .article figcaption hairline — that separator is for
		   the interactive figures' below-figure captions, not this side-by-side one. */
		border-top: none;
		padding-top: 0;
		margin-top: 0;
	}
	.thesis-title {
		margin: 0 0 0.4rem;
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 600;
		line-height: 1.35;
	}
	.thesis-title a {
		color: var(--heading);
		text-decoration: none;
	}
	.thesis-title a:hover {
		text-decoration: underline;
		text-decoration-color: var(--accent);
	}
	.thesis-note {
		margin: 0;
		font-size: 0.9rem;
		color: var(--muted);
		line-height: 1.5;
	}
</style>
