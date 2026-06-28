<script lang="ts">
	import { site } from '$lib/config';
	import Icon from './Icon.svelte';
	import Mark from './Mark.svelte';

	const follow = [
		{ name: 'bluesky', href: site.social.bluesky, label: 'Bluesky' },
		{ name: 'mastodon', href: site.social.mastodon, label: 'Mastodon' },
		{ name: 'x', href: site.social.twitter, label: 'Twitter' },
		{ name: 'github', href: site.social.github, label: 'GitHub' }
	];
</script>

<aside class="bio">
	<div class="avatar" aria-hidden="true"><Mark /></div>
	<div class="bio-body">
		<p class="bio-name">{site.author}</p>
		<p class="bio-text">
			Researcher in clinical psychology, working on statistics, causal inference, and study design.
		</p>
		<div class="bio-follow">
			<span class="bio-label">Follow</span>
			{#each follow as f (f.name)}
				<a href={f.href} aria-label={f.label} target="_blank" rel="noopener external">
					<Icon name={f.name} size={18} />
				</a>
			{/each}
		</div>
	</div>
</aside>

<style>
	.bio {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	/* The site mark as the author badge (currentColor → ink, so the arrow knocks
     out to the page surface). No blue — interactive-only rule holds. */
	.avatar {
		flex-shrink: 0;
		width: 3rem;
		height: 3rem;
		color: var(--heading);
	}
	.bio-body {
		min-width: 0;
	}
	.bio-name {
		margin: 0 0 0.15rem;
		font-family: var(--font-heading);
		font-weight: 600;
		color: var(--heading);
	}
	.bio-text {
		max-width: 36rem;
		margin: 0 0 0.6rem;
		font-size: 0.92rem;
		color: var(--muted);
	}
	.bio-follow {
		display: inline-flex;
		gap: 0.7rem;
		align-items: center;
		font-size: 0.85rem;
	}
	.bio-label {
		color: var(--muted);
	}
	.bio-follow a {
		display: inline-flex;
		color: var(--muted);
		transition: color 0.15s;
	}
	.bio-follow a:hover {
		color: var(--accent);
	}
</style>
