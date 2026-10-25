<script lang="ts">
	import { posts, type PostMeta } from '#lib/content.js';
	import { formatDate } from '#lib/utils/date.js';
	import { resolve } from '$app/paths';
	import Container from '#lib/components/Container.svelte';
	import Seo from '#lib/components/Seo.svelte';

	const groups: [string, PostMeta[]][] = Object.entries(
		posts.reduce<Record<string, PostMeta[]>>((acc, p) => {
			const year = new Date(p.date).getFullYear().toString();
			(acc[year] ??= []).push(p);
			return acc;
		}, {})
	).sort((a, b) => Number(b[0]) - Number(a[0]));
</script>

<Seo title="All posts" description="Every post, by year." path="/posts" />

<Container>
	<h1>All posts</h1>
	<p class="lead">{posts.length} posts since 2012.</p>

	{#each groups as [year, items] (year)}
		<section class="year">
			<h2 class="year-head">
				<span>{year}</span>
				<span class="year-count">{items.length}</span>
			</h2>
			<ul>
				{#each items as post (post.slug)}
					<li>
						<a href={resolve('/[slug]', { slug: post.slug })}>
							<span class="t">{post.title}</span>
							<span class="d">{formatDate(new Date(post.date))}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</Container>

<style>
	.lead {
		color: var(--muted);
		margin-bottom: 2.5rem;
	}
	.year {
		margin-bottom: 2.25rem;
	}
	.year-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin: 0 0 0.4rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid var(--rule);
		font-size: 1rem;
		color: var(--muted);
	}
	.year-count {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--muted);
	}
	.year ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* Whole row is the click target; hover highlights it and underlines the title.
     Negative inline margin lets the highlight bleed past the text edge while the
     text itself stays aligned with the year header. */
	.year a {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		margin: 0 -0.6rem;
		padding: 0.45rem 0.6rem;
		border-radius: var(--radius-sm);
		color: var(--ink);
		text-decoration: none;
	}
	.year a:hover {
		background: var(--inset);
	}
	.year a:hover .t {
		text-decoration: underline;
		text-decoration-color: var(--accent);
		text-underline-offset: 0.15em;
	}
	.t {
		flex: 1;
		min-width: 0;
	}
	.d {
		flex-shrink: 0;
		font-size: 0.82rem;
		color: var(--muted);
		white-space: nowrap;
	}
</style>
