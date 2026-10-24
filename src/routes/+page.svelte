<script lang="ts">
	import { posts } from '$lib/content';
	import { viz } from '$lib/viz';
	import { site } from '$lib/config';
	import { resolve } from '$app/paths';
	import Container from '$lib/components/Container.svelte';
	import PostList from '$lib/components/PostList.svelte';
	import VizGallery from '$lib/components/VizGallery.svelte';
	import HeroGaussianMesh from '$lib/components/HeroGaussianMesh.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Seo from '$lib/components/Seo.svelte';

	const recent = posts.slice(0, 5);
	// Hand-picked (`featured` in viz.ts); the full set lives on /viz.
	const featured = viz.filter((v) => v.featured);
	const socials = [
		{ name: 'bluesky', href: site.social.bluesky, label: 'Bluesky' },
		{ name: 'github', href: site.social.github, label: 'GitHub' },
		{ name: 'x', href: site.social.twitter, label: 'Twitter' },
		{ name: 'linkedin', href: site.social.linkedin, label: 'LinkedIn' }
	];
</script>

<Seo title="R Psychologist" path="/" />

<Container wide>
	<section class="intro">
		<HeroGaussianMesh class="hero-deco" />
		<div class="intro-text">
			<h1 class="display greeting">Hi, I'm<br />Kristoffer.</h1>
			<p class="tagline">{site.bio}</p>
			<div class="meta">
				<p class="cred">PhD · Lic. Psychologist</p>
				<div class="socials">
					{#each socials as s (s.name)}
						<a href={s.href} aria-label={s.label} target="_blank" rel="noopener external">
							<Icon name={s.name} size={18} />
						</a>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="block">
		<div class="block-head">
			<h2 class="eyebrow">Interactive visualizations</h2>
			<a class="more wide-only" href={resolve('/viz')}>All visualizations →</a>
		</div>
		<VizGallery items={featured} />
		<div class="block-foot narrow-only">
			<a class="more" href={resolve('/viz')}>All visualizations →</a>
		</div>
	</section>

	<section class="block">
		<div class="block-head">
			<h2 class="eyebrow">Writing</h2>
			<a class="more" href={resolve('/posts')}>All posts →</a>
		</div>
		<PostList posts={recent} variant="index" headingLevel={3} />
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
	/* The Gaussian mesh sits on the right, frameless on the paper. Hidden from the
	   a11y tree (decorative), dropped on narrow screens where it would crowd the
	   text, but pointer-interactive: clicking launches a gradient-ascent climber.
	   The edge fade and climbers are owned by the component. */
	.intro :global(.hero-deco) {
		position: absolute;
		top: 1.25rem;
		bottom: 1.25rem;
		right: 0;
		width: min(30rem, 48%);
		z-index: 0;
	}
	/* Type carries the hero; the colorful gallery below is the visual identity, so
	   the headline block is kept to a readable measure and the rest stays open.
	   Capped to the space left of the mesh (mirrors its width above) so it doesn't run under it. */
	.intro-text {
		position: relative;
		z-index: 1;
		max-width: calc(max(100% - 30rem, 52%) - 1.5rem);
	}
	@media (max-width: 52rem) {
		.intro :global(.hero-deco) {
			display: none;
		}
		.intro-text {
			max-width: 38rem;
		}
	}
	/* The greeting is the "loud" moment; the <br> sets the deliberate two-line
	   rhythm ("Hi, I'm" / "Kristoffer.") so the name lands as its own beat. */
	.intro h1 {
		margin: 0 0 0.9rem;
	}
	.tagline {
		margin: 0 0 1.3rem;
		max-width: 34rem;
		font-size: var(--text-lg);
		line-height: 1.55;
		color: var(--ink);
	}
	/* Credential + socials read as one footing line under the lead. */
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
	}
	.cred {
		margin: 0;
		font-size: var(--text-sm);
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
		color: var(--accent-signal);
	}

	.block {
		margin: 2.5rem 0;
	}
	/* The letterspaced kicker + section rule is the recurring section device. */
	.block-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--rule);
	}
	/* Identity comes from the global .eyebrow; only the margin differs here. */
	.eyebrow {
		margin: 0;
	}
	/* On a narrow phone the link wraps under the heading; keep it right-aligned. */
	.block-head .more {
		margin-left: auto;
	}
	/* The gallery's long kicker leaves no room for its link on any phone, so
	   there the link moves to the foot instead of wrapping under the heading. */
	.block-foot.narrow-only {
		display: none;
	}
	@media (max-width: 32rem) {
		.wide-only {
			display: none;
		}
		.block-foot.narrow-only {
			display: flex;
		}
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
		text-decoration-color: var(--accent-signal);
		text-underline-offset: 0.15em;
	}
</style>
