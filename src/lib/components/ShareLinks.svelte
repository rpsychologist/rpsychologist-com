<script lang="ts">
	import { site } from '$lib/config';
	import Icon from './Icon.svelte';

	let { slug, title }: { slug: string; title: string } = $props();

	const enc = encodeURIComponent;
	const url = $derived(`${site.url}/${slug}`);
	const targets = $derived([
		{
			name: 'bluesky',
			label: 'Share on Bluesky',
			href: `https://bsky.app/intent/compose?text=${enc(`${title} ${url}`)}`
		},
		{
			name: 'x',
			label: 'Share on X',
			href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}&via=krstoffr`
		},
		{
			name: 'linkedin',
			label: 'Share on LinkedIn',
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`
		}
	]);
</script>

<span class="share">
	<span class="share-label">Share</span>
	{#each targets as t (t.name)}
		<a href={t.href} aria-label={t.label} target="_blank" rel="noopener external">
			<Icon name={t.name} size={17} />
		</a>
	{/each}
</span>

<style>
	.share {
		display: inline-flex;
		gap: 0.7rem;
		align-items: center;
		font-size: 0.85rem;
	}
	.share-label {
		color: var(--muted);
	}
	.share a {
		display: inline-flex;
		color: var(--muted);
		transition: color 0.15s;
	}
	.share a:hover {
		color: var(--accent-signal);
	}
</style>
