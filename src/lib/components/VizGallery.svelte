<script lang="ts" module>
	// Enhanced Picture objects keyed by basename; typed loosely as in PostImage.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const thumbs = import.meta.glob<{ default: any }>('/src/lib/assets/viz/*.png', {
		eager: true,
		query: { enhanced: true }
	});
	const thumb = (name: string) => thumbs[`/src/lib/assets/viz/${name}.png`]?.default;
	// enhanced:img fails on undefined with an opaque error; name the missing file.
	const required = (name: string) => {
		const t = thumb(name);
		if (!t) throw new Error(`Missing gallery thumbnail src/lib/assets/viz/${name}.png`);
		return t;
	};
</script>

<script lang="ts">
	import type { Viz } from '#lib/viz.js';

	let { items }: { items: Viz[] } = $props();
</script>

<ul class="viz-grid">
	{#each items as v (v.title)}
		{@const dark = thumb(`${v.image}-dark`)}
		<li>
			<!-- hrefs are data and may be external; the site deploys at the root, so
			     there is no base path for resolve() to add. -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="card" href={v.href} rel={v.href.startsWith('http') ? 'external' : undefined}>
				<!-- Prerendered, so the theme isn't known at render time: both
				     variants ship and CSS shows one; lazy keeps the hidden one unloaded. -->
				<span class="screen" class:has-dark={dark}>
					<enhanced:img
						class="light"
						src={required(v.image)}
						alt=""
						loading="lazy"
						sizes="(max-width: 32rem) 45vw, 20rem"
					/>
					{#if dark}
						<enhanced:img
							class="dark"
							src={dark}
							alt=""
							loading="lazy"
							sizes="(max-width: 32rem) 45vw, 20rem"
						/>
					{/if}
				</span>
				<span class="name">{v.title}</span>
				<span class="desc">{v.description}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.viz-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 1rem;
	}
	/* Grid stretches each <li> to the row height; the <li> is flex so the <a>
     fills it, keeping every tile the same height regardless of copy length. */
	.viz-grid li {
		display: flex;
	}
	.viz-grid a {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
		padding: 0.85rem;
		text-decoration: none;
		color: var(--ink);
		transition: border-color 0.15s;
	}
	.viz-grid a:hover {
		border-color: var(--accent-signal);
	}
	/* Thumbnails are crops of the real charts. Apps with a dark mode have a dark
     crop too (scripts/viz-thumbnails.mjs); the rest are white-background
     screenshots, dimmed in dark mode so they don't glare. Each background
     matches its crops' flat backdrop, so nothing flashes while they load. */
	.screen {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: 4px;
		background: #fff;
		border: 1px solid var(--rule);
	}
	.screen.has-dark {
		background: var(--bg);
	}
	.screen :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.screen :global(img.dark) {
		display: none;
	}
	:global([data-theme='dark']) .has-dark :global(img.light) {
		display: none;
	}
	:global([data-theme='dark']) .has-dark :global(img.dark) {
		display: block;
	}
	:global([data-theme='dark']) .screen:not(.has-dark) {
		filter: brightness(0.82);
	}
	.name {
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1rem;
		color: var(--heading);
	}
	.desc {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--muted);
	}

	/* On phones a single 13rem column makes each card full-width with a tall
     thumbnail, so four stack into one long column. Force 2-up and tighten the
     tile so the section stays ~2 rows. */
	@media (max-width: 32rem) {
		.viz-grid {
			grid-template-columns: 1fr 1fr;
			gap: 0.6rem;
		}
		.viz-grid a {
			padding: 0.6rem;
			gap: 0.5rem;
		}
		.name {
			font-size: 0.9rem;
		}
		.desc {
			font-size: 0.78rem;
			/* Clamp to keep the two columns even when copy length differs. */
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 3;
			line-clamp: 3;
			overflow: hidden;
		}
	}
</style>
