<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import Bio from '#lib/components/Bio.svelte';
	import ShareLinks from '#lib/components/ShareLinks.svelte';
	import Toc from '#lib/components/Toc.svelte';
	import { enhanceCode } from '#lib/actions/code.js';
	import { enhanceCitations } from '#lib/actions/citations.js';
	import { termSlug } from '#lib/content.js';
	import { site } from '#lib/config.js';
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/utils/date.js';

	let { data } = $props();
	const Content = $derived(data.component);
	const githubUrl = $derived(`${site.repo}/blob/main${data.meta.path}`);
</script>

<Seo
	title={data.meta.title}
	description={data.meta.summary}
	path={`/${data.meta.slug}`}
	type="article"
	card={data.meta.slug}
	published={data.meta.date}
	tags={data.meta.tags}
/>

<div class="post-layout" class:has-toc={data.meta.includeToc}>
	{#if data.meta.includeToc}
		<aside class="post-aside"><Toc sections={data.meta.toc} /></aside>
	{/if}

	<article class="article" use:enhanceCode use:enhanceCitations>
		<header class="post-header">
			<h1 class="display">{data.meta.title}</h1>
			{#if data.meta.summary}
				<p class="post-subtitle">{data.meta.summary}</p>
			{/if}
			<div class="meta-row">
				<p class="post-meta">
					<time datetime={data.meta.date}>{formatDate(new Date(data.meta.date))}</time>
					<span aria-hidden="true">·</span>
					<span>{data.meta.readingTime} min read</span>
					{#if data.meta.category}
						<span aria-hidden="true">·</span>
						<a class="post-cat" href={resolve('/tags/[tag]', { tag: termSlug(data.meta.category) })}
							>{data.meta.category}</a
						>
					{/if}
				</p>
				<ShareLinks slug={data.meta.slug} title={data.meta.title} />
			</div>
		</header>

		<Content />

		<div class="article-meta">
			{#if data.meta.tags.length}
				<ul class="post-tags">
					{#each data.meta.tags as tag (tag)}
						<li><a href={resolve('/tags/[tag]', { tag: termSlug(tag) })}>{tag}</a></li>
					{/each}
				</ul>
			{/if}
			<p class="colophon">
				<a href={githubUrl} rel="external">Source on GitHub</a> ·
				<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
			</p>
		</div>

		<footer class="post-footer">
			<Bio />

			<div class="questions">
				<h2>Questions &amp; comments</h2>
				<p>
					Please use <a href={`${site.repo}/discussions`} rel="external">GitHub Discussions</a> for
					questions, or
					<a href={`${site.repo}/issues`} rel="external">open an issue</a> for bugs and feature requests.
				</p>
			</div>

			<nav class="post-nav" aria-label="Adjacent posts">
				{#if data.newer}
					<a class="nav-card prev" href={resolve('/[slug]', { slug: data.newer.slug })} rel="prev">
						<span class="nav-label">← Newer</span>
						<span class="nav-title">{data.newer.title}</span>
					</a>
				{/if}
				{#if data.older}
					<a class="nav-card next" href={resolve('/[slug]', { slug: data.older.slug })} rel="next">
						<span class="nav-label">Older →</span>
						<span class="nav-title">{data.older.title}</span>
					</a>
				{/if}
			</nav>
		</footer>
	</article>
</div>

<style>
	.post-header {
		margin-bottom: 2rem;
	}
	.post-header h1 {
		margin-bottom: 0.6rem;
	}
	.post-subtitle {
		margin: 0 0 1.1rem;
		font-size: 1.2rem;
		line-height: 1.5;
		color: var(--muted);
	}
	.post-cat {
		color: var(--muted);
		text-decoration: none;
	}
	.post-cat:hover {
		text-decoration: underline;
	}
	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
		align-items: center;
		justify-content: space-between;
	}
	.post-meta {
		color: var(--muted);
		font-size: 0.85rem;
		display: flex;
		gap: 0.4rem;
		align-items: center;
		margin: 0;
	}
	/* "About this article" group: tags + provenance/license, right under the body. */
	.article-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.85rem;
		margin-top: 2.5rem;
	}
	.post-tags {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0;
		margin: 0;
	}
	.post-tags a {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		color: var(--muted);
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: 999px;
		text-decoration: none;
	}
	.post-tags a:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
	.post-footer {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--rule);
	}
	/* Hairline-bordered callout, matching the pager cards / gallery tiles (one box
     language site-wide; no filled grey box). */
	.questions {
		margin: 1.75rem 0;
		padding: 1rem 1.25rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
	}
	.questions h2 {
		margin: 0 0 0.3rem;
		font-size: 1rem;
	}
	.questions p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--ink);
	}
	/* One compact provenance + license line (replaces the separate published row,
     GitHub line, and the full license paragraph). */
	.colophon {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
	/* Pager cards: a small label over the adjacent post's title; the whole card
     is the target and its border warms to accent on hover. */
	/* Flex (not grid) so a lone card — when there's no newer/older neighbour —
     fills the row instead of stranding it in one half. */
	.post-nav {
		display: flex;
		gap: 1rem;
		margin-top: 2.5rem;
	}
	.nav-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
		transition: border-color 0.15s;
	}
	.nav-card:hover {
		border-color: var(--accent);
	}
	.nav-card.next {
		text-align: right;
	}
	.nav-label {
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.nav-title {
		font-weight: 500;
		line-height: 1.35;
		color: var(--heading);
	}
	.nav-card:hover .nav-title {
		color: var(--accent);
	}
	@media (max-width: 32rem) {
		.post-nav {
			flex-direction: column;
		}
		.nav-card.next {
			text-align: left;
		}
	}

	/* Sidebar TOC from laptop widths up; below, a collapsed "Contents" row
	   (breakpoint kept in sync with Toc.svelte). The article is centered where
	   there's room and shifts right on laptops; the gap clears the wide-figure
	   breakout in article.css. Media-query rem is 16px, not the root's 19px:
	   80rem = 1280px is the narrowest that fits with a classic scrollbar. */
	@media (min-width: 80rem) {
		.post-layout.has-toc {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
		}
		.post-aside {
			grid-column: 1;
			justify-self: end;
			width: 12rem;
			margin-left: 1rem;
			margin-right: 3.5rem;
			padding-top: 3.4rem;
		}
		.post-layout.has-toc .article {
			grid-column: 2;
		}
	}
</style>
