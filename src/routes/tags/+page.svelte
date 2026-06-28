<script lang="ts">
	import { tags, categories, termSlug, postsForTerm } from '$lib/content';
	import { resolve } from '$app/paths';
	import Container from '$lib/components/Container.svelte';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="Tags" description="Browse posts by topic." path="/tags" />

<Container>
	<h1>Topics</h1>

	<h2>Categories</h2>
	<ul class="term-list">
		{#each categories as term (term)}
			<li>
				<a href={resolve('/tags/[tag]', { tag: termSlug(term) })}>{term}</a>
				<span class="count">{postsForTerm(term).length}</span>
			</li>
		{/each}
	</ul>

	<h2>Tags</h2>
	<ul class="term-list">
		{#each tags as term (term)}
			<li>
				<a href={resolve('/tags/[tag]', { tag: termSlug(term) })}>{term}</a>
				<span class="count">{postsForTerm(term).length}</span>
			</li>
		{/each}
	</ul>
</Container>

<style>
	.term-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0 0 2.5rem;
	}
	.term-list a {
		color: var(--accent);
		text-decoration: none;
	}
	.count {
		color: var(--muted);
		font-size: 0.8rem;
		margin-left: 0.2rem;
	}
</style>
