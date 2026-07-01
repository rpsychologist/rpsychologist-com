<script lang="ts">
	import { posts } from '$lib/content';
	import { viz } from '$lib/viz';
	import { site } from '$lib/config';
	import { resolve } from '$app/paths';
	import Container from '$lib/components/Container.svelte';
	import PostList from '$lib/components/PostList.svelte';
	import VizGallery from '$lib/components/VizGallery.svelte';
	import HeroMotif from '$lib/components/HeroMotif.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';

	const recent = posts.slice(0, 5);
	// One clean row on the homepage; the full set lives on /viz.
	const featured = viz.slice(0, 4);
	const socials = [
		{ name: 'bluesky', href: site.social.bluesky, label: 'Bluesky' },
		{ name: 'mastodon', href: site.social.mastodon, label: 'Mastodon' },
		{ name: 'github', href: site.social.github, label: 'GitHub' },
		{ name: 'x', href: site.social.twitter, label: 'Twitter' }
	];
</script>

<Seo title="R Psychologist" path="/" />

<Container wide>
	<section class="intro">
		<div class="intro-text">
			<h1 class="display">Kristoffer Magnusson</h1>
			<p class="tagline">
				I build interactive tools for understanding statistics, and write about applied methods,
				causal inference, and study design.
			</p>
			<p class="cred">PhD · Lic. Psychologist</p>
			<div class="socials">
				{#each socials as s (s.name)}
					<a href={s.href} aria-label={s.label} target="_blank" rel="noopener external">
						<Icon name={s.name} size={18} />
					</a>
				{/each}
			</div>
		</div>
		<div class="motif-wrap"><HeroMotif /></div>
	</section>

	<section class="block">
		<div class="block-head">
			<h2 class="eyebrow">Interactive visualizations</h2>
			<a class="more" href={resolve('/viz')}>All visualizations →</a>
		</div>
		<VizGallery items={featured} />
	</section>

	<section class="block">
		<div class="block-head">
			<h2 class="eyebrow">Writing</h2>
			<a class="more" href={resolve('/posts')}>All posts →</a>
		</div>
		<PostList posts={recent} />
		<div class="block-foot">
			<a class="more" href={resolve('/posts')}>All posts →</a>
		</div>
	</section>
</Container>

<style>
	.intro {
		position: relative;
		overflow: hidden;
		padding: 1rem 0 2.5rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--rule);
	}
	/* Text sits above the ambient motif, constrained left so the two don't clash. */
	.intro-text {
		position: relative;
		z-index: 1;
		max-width: 38rem;
	}
	.motif-wrap {
		position: absolute;
		inset: 0 -1rem 0 auto;
		z-index: 0;
		width: 22rem;
		max-width: 42%;
		display: flex;
		align-items: center;
		pointer-events: none;
	}
	@media (max-width: 52rem) {
		.motif-wrap {
			display: none;
		}
	}
	.intro h1 {
		margin: 0 0 0.6rem;
	}
	.tagline {
		margin: 0 0 0.9rem;
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--ink);
	}
	.cred {
		margin: 0 0 1.1rem;
		font-size: 0.92rem;
		color: var(--muted);
	}
	.socials {
		display: flex;
		gap: 1rem;
	}
	.socials a {
		display: inline-flex;
		color: var(--muted);
		transition: color 0.15s;
	}
	.socials a:hover {
		color: var(--accent);
	}

	.block {
		margin: 2.5rem 0;
	}
	/* The letterspaced kicker + section rule is the recurring section device. */
	.block-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--rule);
	}
	/* Identity comes from the global .eyebrow; only the margin differs here. */
	.eyebrow {
		margin: 0;
	}
	/* Mirror the header link at the foot so a scroll-to-end reader isn't dead-ended. */
	.block-foot {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--rule);
	}
	.more {
		font-family: var(--font-heading);
		font-size: 0.82rem;
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}
	.more:hover {
		text-decoration: underline;
		text-decoration-color: var(--accent);
		text-underline-offset: 0.15em;
	}
</style>
