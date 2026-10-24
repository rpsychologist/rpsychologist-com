<script lang="ts">
	import { termSlug, type PostMeta } from '$lib/content';
	import { formatDate } from '$lib/utils/date';
	import { resolve } from '$app/paths';

	let {
		posts,
		variant = 'stack',
		headingLevel = 2
	}: {
		posts: PostMeta[];
		/** `index`: title left, summary right; for wide containers (the homepage). */
		variant?: 'stack' | 'index';
		headingLevel?: 2 | 3;
	} = $props();
</script>

<ul class="post-list" class:index={variant === 'index'}>
	{#each posts as post (post.slug)}
		<li class="post-card">
			<svelte:element this={`h${headingLevel}`} class="post-title">
				<a href={resolve('/[slug]', { slug: post.slug })}>{post.title}</a>
			</svelte:element>
			<p class="post-meta">
				<time datetime={post.date}>{formatDate(new Date(post.date))}</time>
				<span aria-hidden="true">·</span>
				<span>{post.readingTime} min read</span>
				<span aria-hidden="true">·</span>
				<a class="post-cat" href={resolve('/tags/[tag]', { tag: termSlug(post.category) })}
					>{post.category}</a
				>
			</p>
			{#if post.summary}
				<p class="post-summary">{post.summary}</p>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.post-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}
	.post-title {
		margin: 0 0 0.35rem;
		font-size: 1.5rem;
		line-height: 1.2;
	}
	.post-title a {
		color: var(--heading);
		text-decoration: none;
	}
	.post-title a:hover {
		text-decoration: underline;
		text-decoration-color: var(--accent);
		text-underline-offset: 3px;
	}
	.post-meta {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		color: var(--muted);
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}
	.post-cat {
		color: var(--muted);
		text-decoration: none;
	}
	.post-cat:hover {
		text-decoration: underline;
	}
	/* Capped near the article's text column (~75 chars); full width in the
	   homepage container ran to ~120 chars a line. */
	.post-summary {
		margin: 0;
		max-width: 38rem;
		color: var(--ink);
		line-height: 1.6;
	}

	/* Index rows: summaries recede under the titles and clamp, so a long one
	   can't outweigh its title or stretch its row. */
	.index .post-summary {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
		font-size: var(--text-sm);
		color: var(--muted);
	}
	/* Two columns fill a wide container while each keeps a readable measure.
	   Below ~960px the columns drop under ~50 chars, so stack. */
	@media (min-width: 60rem) {
		.index {
			gap: 0;
		}
		.index .post-card {
			display: grid;
			/* 1:1 with the gallery's 1rem gap puts the summaries on the edge of its
			   third card above (VizGallery). */
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			grid-template-areas:
				'title summary'
				'meta summary';
			grid-template-rows: auto 1fr;
			column-gap: 1rem;
			/* Summary's first line sits on the title's first baseline. */
			align-items: baseline;
			padding: 1.5rem 0;
		}
		.index .post-card + .post-card {
			border-top: 1px solid var(--rule);
		}
		/* The section's own head/foot rules and margins frame the list. */
		.index .post-card:first-child {
			padding-top: 0;
		}
		.index .post-card:last-child {
			padding-bottom: 0;
		}
		/* The gap alone would let a long title run up against the summary. */
		.index .post-title {
			grid-area: title;
			padding-right: 2rem;
			font-size: var(--text-lg);
			line-height: 1.3;
		}
		.index .post-meta {
			grid-area: meta;
			align-self: start;
			margin: 0;
		}
		.index .post-summary {
			grid-area: summary;
			max-width: none;
		}
	}
</style>
