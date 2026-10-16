<script lang="ts">
	import CohendEmbed from '$lib/viz/cohend/CohendEmbed.svelte';

	let { data } = $props();
</script>

<!-- Same route across locales: remount so the messages switch too. -->
{#key data.locale}
	<CohendEmbed locale={data.locale} />
{/key}
