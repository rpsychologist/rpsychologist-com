<script lang="ts">
  import { postsForPage, pageCount } from "$lib/content";
  import Container from "$lib/components/Container.svelte";
  import PostList from "$lib/components/PostList.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import Seo from "$lib/components/Seo.svelte";

  const posts = postsForPage(1);
</script>

<Seo title="R Psychologist" path="/" />

<Container>
  <PostList {posts} />
  <Pagination current={1} total={pageCount} />
</Container>
