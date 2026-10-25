<script lang="ts">
	import { postsForTerm, termSlug } from '#lib/content.js';
	import Container from '#lib/components/Container.svelte';
	import PostList from '#lib/components/PostList.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
	const posts = $derived(postsForTerm(data.term));
</script>

<Seo
	title={`Posts tagged “${data.term}”`}
	description={`All posts about ${data.term}.`}
	path={`/tags/${termSlug(data.term)}`}
/>

<Container>
	<h1 class="tag-title">{data.term}</h1>
	<p class="tag-count">
		{posts.length}
		{posts.length === 1 ? 'post' : 'posts'}
	</p>
	<PostList {posts} />
</Container>

<style>
	.tag-title {
		margin-bottom: 0.2rem;
	}
	.tag-count {
		color: var(--muted);
		margin: 0 0 2.5rem;
	}
</style>
