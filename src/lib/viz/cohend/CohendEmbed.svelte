<script lang="ts">
	import { onMount } from 'svelte';
	import CohendTool from './CohendTool.svelte';
	import EmbedAttribution from './EmbedAttribution.svelte';
	import { CohendState } from './cohend.svelte';
	import { messages, setCohendI18n, type Locale } from './i18n';

	// Chrome-free embed view — the <iframe> target for `<CohendTool minimal>` plus a
	// source credit. Prerendered AS the embed (its own route), so the static HTML is
	// already just the tool: no `?embed=1` client-side collapse, no flash. The root
	// layout drops the site header/footer for `/…/embed` paths, and this route is
	// framed cross-origin (framing headers scoped to the path — see static/_headers).
	// Display is configured by the embedder through URL params (colors, labels,
	// `donuts=0`), applied on mount like the full page. The routes (/cohend/embed,
	// /sv/cohend/embed, …) are thin wrappers.
	let { locale }: { locale: Locale } = $props();

	// Read once: the localized route remounts this per locale ({#key}).
	// svelte-ignore state_referenced_locally
	const i18n = { locale, m: messages(locale) };
	setCohendI18n(i18n);
	const { m } = i18n;
	const model = new CohendState({
		muZeroLabel: m.default_control,
		muOneLabel: m.default_treatment,
		xLabel: m.default_outcome
	});
	onMount(() => {
		model.init(location.search);
		// The share dialog's live preview pushes setting changes here instead of
		// rewriting the iframe src — a reload would flash the prerendered defaults
		// before init applies the params. Same-origin only, so embedding pages
		// can't drive this.
		const onMessage = (e: MessageEvent) => {
			if (e.origin !== location.origin) return;
			const data = e.data as { type?: string; search?: string } | null;
			if (data?.type === 'cohend-preview') model.applySearch(data.search ?? '');
		};
		window.addEventListener('message', onMessage);
		return () => window.removeEventListener('message', onMessage);
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="embed">
	<CohendTool {model} minimal />
	<EmbedAttribution />
</div>

<style>
	.embed {
		box-sizing: border-box;
		max-width: 100%;
		padding: 0.75rem 1rem 1rem;
	}
</style>
