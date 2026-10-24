<script lang="ts">
	import { postsForPage, pageCount } from '$lib/content';
	import Container from '$lib/components/Container.svelte';
	import PostList from '$lib/components/PostList.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
	const posts = $derived(postsForPage(data.page));
</script>

<Seo title={`Page ${data.page}`} path={`/page/${data.page}`} />

<Container>
	<PostList {posts} />
	<Pagination current={data.page} total={pageCount} />
</Container>
