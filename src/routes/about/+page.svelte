<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '$lib/config';
	import Container from '$lib/components/Container.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import thesisCover from '$lib/assets/thesis_cover_front.png?enhanced';

	const thesisUrl = 'https://hdl.handle.net/10616/46909';
</script>

<Seo title="About" description="About Kristoffer Magnusson and R Psychologist." path="/about" />

<Container>
	<article class="article">
		<p class="eyebrow">About</p>
		<h1>Kristoffer Magnusson, PhD</h1>
		<p class="lede">
			I'm a licensed psychologist and researcher in clinical psychology at the Centre for Psychiatry
			Research, Karolinska Institutet, in Stockholm, Sweden. My interests are a mix of open science,
			gaming and gambling problems, statistics, therapist effects, visualization, and psychotherapy.
		</p>
		<p>
			I also have a background in web development, and I still work part-time as a web developer
			(mostly React/NextJS/Node). I have created various
			<a href={resolve('/viz')}>interactive visualizations of statistical concepts</a>.
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
		<dl class="contact">
			<div>
				<dt><Icon name="mail" size={16} />Email</dt>
				<dd>
					<a href="mailto:contact@mail.rpsychologist.com">contact@<wbr />mail.rpsychologist.com</a>
				</dd>
			</div>
			<div>
				<dt><Icon name="bluesky" size={16} />Bluesky</dt>
				<dd><a href={site.social.bluesky} rel="external">@rpsychologist.com</a></dd>
			</div>
			<div>
				<dt><Icon name="github" size={16} />GitHub</dt>
				<dd><a href={site.social.github} rel="external">rpsychologist</a></dd>
			</div>
			<div>
				<dt><Icon name="x" size={16} />Twitter</dt>
				<dd><a href={site.social.twitter} rel="external">@krstoffr</a></dd>
			</div>
			<div>
				<dt><Icon name="linkedin" size={16} />LinkedIn</dt>
				<dd><a href={site.social.linkedin} rel="external">kristofferm</a></dd>
			</div>
		</dl>
	</article>
</Container>

<style>
	/* .eyebrow identity is global (article.css); about uses the default margin. */
	.article h1 {
		margin: 0 0 1rem;
		letter-spacing: -0.025em;
	}
	.lede {
		font-size: 1.2rem;
		line-height: 1.65;
	}
	/* Contact: label/value rows echoing the facts strip; subgrid keeps the
	   label column aligned across rows while each row carries its own hairline. */
	.contact {
		display: grid;
		grid-template-columns: max-content 1fr;
		column-gap: 2rem;
		margin: 0;
		border-bottom: 1px solid var(--rule);
	}
	.contact div {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1 / -1;
		padding: 0.6rem 0;
		border-top: 1px solid var(--rule);
	}
	.contact dt {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		color: var(--muted);
	}
	.contact dd {
		margin: 0;
		min-width: 0;
		/* Break the address only at the <wbr> after "@", not mid-word. */
		overflow-wrap: normal;
	}
	/* A label column leaves too little width on phones; stack label over value. */
	@media (max-width: 34rem) {
		.contact div {
			grid-template-columns: 1fr;
		}
		.contact dt {
			font-size: 0.85rem;
		}
	}

	/* Facts strip: hairline-ruled cells, stacks on narrow screens. */
	.facts {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
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
	.fact a,
	.contact a {
		text-decoration-color: var(--link-underline-quiet);
		text-decoration-thickness: 1px;
	}
	.fact a:hover,
	.contact a:hover {
		text-decoration-color: var(--accent);
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
	/* 320px screens: a 110px cover leaves the title too narrow for "Methodological". */
	@media (max-width: 24rem) {
		.thesis-cover {
			width: 84px;
		}
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
