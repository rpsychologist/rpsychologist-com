<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Msg from '#lib/viz/cohend/i18n/Msg.svelte';
	import { SHARE_SIZE } from '#lib/share.js';
	import { siteCardImages } from '#lib/share-cards.js';
	import { site } from '#lib/config.js';

	let { data } = $props();
	const card = $derived(data.card);

	const urls = import.meta.glob<string>(
		['/src/lib/assets/viz/*.png', '/content/blog/**/*.{png,jpg,jpeg}'],
		{ eager: true, query: '?url', import: 'default' }
	);

	const isSite = $derived(card.key === 'site');
	let titleBox: HTMLElement | undefined = $state();
	let heading: HTMLElement | undefined = $state();
	let size = $derived(card.image ? 60 : isSite ? 64 : 84);
	let ready = $state(false);
	let errorMessage = $state('');

	// Long titles step down until they fit their box; scripts/share-cards.mjs
	// waits for data-ready so it never captures a half-fitted or font-less card.
	onMount(async () => {
		try {
			await document.fonts.ready;
			await Promise.all(
				[...document.images].map(async (img) => {
					await img.decode();
					if (!img.naturalWidth || !img.naturalHeight)
						throw new Error(`Image failed to load: ${img.src}`);
				})
			);
			while (
				heading &&
				titleBox &&
				heading.offsetHeight >
					titleBox.clientHeight - parseFloat(getComputedStyle(titleBox).paddingBottom) &&
				size > 36
			) {
				size -= 2;
				await tick();
			}
			ready = true;
		} catch (error) {
			errorMessage = `Share card capture failed: ${error instanceof Error ? error.message : error}`;
		}
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div
	class="share-card"
	class:has-image={card.image}
	class:site={isSite}
	class:type-only={!card.image && !isSite}
	lang={card.lang}
	style:width="{SHARE_SIZE.width}px"
	style:height="{SHARE_SIZE.height}px"
	data-ready={ready || undefined}
	data-error={errorMessage || undefined}
>
	{#if errorMessage}<p class="capture-error" role="alert">{errorMessage}</p>{/if}
	<div class="text">
		{#if card.kicker}<p class="kicker">{card.kicker}</p>{/if}
		<div class="title-box" bind:this={titleBox} style:--title-size="{size}px">
			<h1 bind:this={heading} style:font-size="{size}px"><Msg text={card.title} /></h1>
		</div>
	</div>

	{#if isSite}
		<div class="strip">
			{#each siteCardImages as src (src)}
				<figure><img src={urls[src]} alt="" /></figure>
			{/each}
		</div>
	{:else if card.image}
		<figure class="figure"><img src={urls[card.image]} alt="" /></figure>
	{/if}

	<footer>
		<span>{site.author}</span>
		<Logo height={34} />
	</footer>
</div>

<style>
	.share-card {
		position: relative;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) auto;
		column-gap: 56px;
		padding: 64px 80px 44px;
		overflow: hidden;
		background: var(--bg);
		color: var(--heading);
		font-family: var(--font-heading);
	}
	.share-card.has-image {
		grid-template-columns: minmax(0, 1fr) 520px;
	}
	.share-card.site {
		grid-template-rows: auto minmax(0, 1fr) auto;
	}
	.site .text {
		margin-bottom: 32px;
	}
	/* An auto row: a flexible title box would collapse and read as overflowing. */
	.site .title-box {
		flex: none;
		overflow: visible;
	}
	.text {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	/* Short titles would leave the lower half empty. The box still shrinks to
	   the row when a title overflows, so the fitting loop sees it. */
	.type-only .text {
		justify-content: center;
	}
	.type-only .title-box {
		flex: 0 1 auto;
		/* Reserve descender ink beyond the line box, even at the flex limit. */
		overflow: visible;
	}
	.kicker {
		margin: 0 0 22px;
		font-size: 24px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	.title-box {
		flex: 1;
		min-height: 0;
		padding-bottom: calc(var(--title-size) * 0.16);
		overflow: hidden;
	}
	h1 {
		margin: 0;
		font-weight: 700;
		line-height: 1.06;
		letter-spacing: -0.03em;
		text-wrap: balance;
	}
	figure {
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		overflow: hidden;
	}
	figure img {
		display: block;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	.figure {
		grid-row: 1;
		grid-column: 2;
		align-self: center;
		aspect-ratio: 4 / 3;
		max-height: 100%;
	}
	.strip {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
		align-self: end;
	}
	.strip figure {
		aspect-ratio: 4 / 3;
	}
	footer {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 28px;
		padding-top: 20px;
		border-top: 1px solid var(--rule);
		font-size: 25px;
		font-weight: 500;
		color: var(--muted);
	}
	footer :global(svg) {
		color: var(--heading);
	}
	.capture-error {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		padding: 80px;
		background: #fff;
		color: #b91c1c;
		font: 600 28px/1.3 sans-serif;
		overflow-wrap: anywhere;
	}
</style>
