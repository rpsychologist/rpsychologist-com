<script lang="ts">
	import CohendPage from '$lib/viz/cohend/CohendPage.svelte';

	let { data } = $props();
</script>

<!-- Same route across locales: remount so the messages switch too. -->
{#key data.locale}
	<CohendPage locale={data.locale} />
{/key}
