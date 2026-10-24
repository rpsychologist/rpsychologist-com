<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import Bio from '$lib/components/Bio.svelte';
	import MoreViz from '$lib/components/MoreViz.svelte';
	import ShareLinks from '$lib/components/ShareLinks.svelte';
	import { viz } from '$lib/viz';
	import Toast from '$lib/viz/core/components/Toast.svelte';
	import VizCitation from '$lib/components/VizCitation.svelte';
	import { changelog } from './changelog';
	import CohendTool from './CohendTool.svelte';
	import CommonLanguage from './CommonLanguage.svelte';
	import { CohendState, type DroppedState } from './cohend.svelte';
	import {
		PUBLISHED,
		cohendHref,
		cohendPath,
		hrefLang,
		messages,
		setCohendI18n,
		t,
		translatorsFor,
		type Locale
	} from './i18n';
	import Msg from './i18n/Msg.svelte';

	// The /cohend article page in any locale; the routes (/cohend, /sv/cohend, …)
	// are thin wrappers. The changelog, citation, references, and site chrome stay
	// English.
	let { locale }: { locale: Locale } = $props();

	// Read once: the localized route remounts this per locale ({#key}), and the
	// switcher does a full page load anyway.
	// svelte-ignore state_referenced_locally
	const i18n = { locale, m: messages(locale) };
	setCohendI18n(i18n);
	const { m } = i18n;

	// Permanent legacy redirect (see the /cohend block in static/_headers,
	// which makes this page frameable so it can run at all): the old site
	// embedded this page as /cohend?embed=1&…, so forward those iframes to the
	// embed route. Permanent by policy — embeds are links teachers built
	// material on, and the changelog promises old links are never dropped.
	// `embed` is dropped; so is the old minimal-slider toggle `slider` (the
	// embed view is already minimal); the state params carry over unchanged
	// (audited: old and new keys match). Runs during hydration, not onMount,
	// to shorten the flash inside the iframe.
	if (browser) {
		// Read once before redirecting; nothing renders from it.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(location.search);
		if (params.get('embed') === '1') {
			params.delete('embed');
			params.delete('slider');
			const qs = params.toString();
			location.replace(cohendHref(i18n.locale, '/embed') + (qs ? `?${qs}` : ''));
		}
	}

	const model = new CohendState({
		muZeroLabel: m.default_control,
		muOneLabel: m.default_treatment,
		xLabel: m.default_outcome
	});
	// Owned here (not in CohendTool) so the page can shift its layout when the
	// settings drawer opens; the tool binds it.
	let settingsOpen = $state(false);

	// Params/saved keys init rejected as invalid. Surfaced instead of failing
	// silently: a recipient of a mangled share link (or a stale saved blob after
	// a schema change) would otherwise mistake the defaults for the shared state.
	let dropped = $state<DroppedState | null>(null);

	// Apply saved state + URL params after mount so SSR and first client render
	// share the defaults (the page is prerendered). The chrome-free embed lives at
	// its own prerendered route (/cohend/embed), so there's no `?embed=1` handling
	// here — nothing to collapse, nothing to flash.
	onMount(() => {
		const d = model.init(location.search);
		if (!d.saved.length && !d.link.length) return;
		dropped = d;
		// Long enough to read both sentences; the × dismisses sooner.
		const timer = setTimeout(() => (dropped = null), 10000);
		return () => clearTimeout(timer);
	});

	// Related tools, surfaced in context for visitors who land directly on this
	// page (most do, via search) and never see the global /viz gallery.
	const more = viz.filter((v) => !v.legacy && v.href !== '/cohend');

	const translators = translatorsFor(i18n.locale);
	const alternates = [
		...PUBLISHED.map((l) => ({ hrefLang: l.hrefLang, path: cohendPath(l.code) })),
		{ hrefLang: 'x-default', path: cohendPath('en') }
	];

	// The switcher's links carry the current state (shared params) into the other
	// language. Appended on click so the prerendered hrefs stay canonical.
	function keepSearch(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		e.currentTarget.search = location.search;
	}

	// A <details> disclosure, so the menu works before hydration and without JS;
	// JS only adds the expected dismissals (outside click, Escape).
	let langMenu = $state<HTMLDetailsElement>();
	let langOpen = $state(false);
	$effect(() => {
		if (!langOpen) return;
		const onDown = (e: PointerEvent) => {
			if (!langMenu?.contains(e.target as Node)) langOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			langOpen = false;
			langMenu?.querySelector('summary')?.focus();
		};
		window.addEventListener('pointerdown', onDown);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('keydown', onKey);
		};
	});

	// LaTeX kept in the script (a `{` inside a Svelte attribute is parsed as an
	// expression delimiter, so braces in \frac{}{} must live in JS strings).
	const tex = {
		Phi: String.raw`\Phi`,
		Psi: String.raw`\Psi`,
		delta: String.raw`\delta`,
		sigma: String.raw`\sigma`,
		mu: String.raw`\mu_i`,
		d: String.raw`\delta = \frac{\mu_2 - \mu_1}{\sigma}`,
		u3: String.raw`U_3 = \Phi(\delta)`,
		ovl: String.raw`\text{OVL} = 2\,\Phi(-|\delta|/2)`,
		cl: String.raw`\text{CL} = \Phi\!\left(\frac{\delta}{\sqrt{2}}\right)`,
		nnt: String.raw`\text{NNT} = \frac{1}{\Phi(\delta + \Psi(\text{CER})) - \text{CER}}`
	};

	const rCode = `CER <- 0.2\nd <- 0.2\n1 / (pnorm(d + qnorm(CER)) - CER)`;
</script>

{#snippet texDelta()}<Tex math={tex.delta} />{/snippet}
{#snippet texSigma()}<Tex math={tex.sigma} />{/snippet}
{#snippet texMu()}<Tex math={tex.mu} />{/snippet}
{#snippet texPhi()}<Tex math={tex.Phi} />{/snippet}
{#snippet texPsi()}<Tex math={tex.Psi} />{/snippet}
{#snippet paramList(keys: string[])}{#each keys as p, i (p)}{i > 0 ? ', ' : ''}<code>{p}</code
		>{/each}{/snippet}
{#snippet linkParams()}{@render paramList(dropped?.link ?? [])}{/snippet}
{#snippet savedParams()}{@render paramList(dropped?.saved ?? [])}{/snippet}

<Seo
	title={m.seo_title}
	description={m.seo_description}
	path={cohendPath(locale)}
	{alternates}
	locale={hrefLang(locale)}
/>

<div class="page" class:settings-open={settingsOpen}>
	<header class="hero">
		<h1 class="display"><Msg text={m.title} /></h1>
		<p class="subtitle">{m.subtitle}</p>
		<!-- eslint-disable svelte/no-navigation-without-resolve -- translator sites are
		     external; the switcher's hrefs come from resolve() inside cohendHref. -->
		<!-- A <div>: the language menu is a <details>, which can't sit in a <p>. -->
		<div class="byline">
			{m.created_by}
			<span class="item"><a href={resolve('/about')}>Kristoffer Magnusson</a> ·</span>
			<span class="item"
				><a href={resolve('/cohend/changelog')}>{t(m, 'version', { version: changelog.version })}</a
				> ·</span
			>
			<span class="item"
				><details class="lang-menu" bind:this={langMenu} bind:open={langOpen}>
					<summary aria-label="{m.language}: {PUBLISHED.find((l) => l.code === locale)?.localName}">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="12" cy="12" r="10" />
							<path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20" />
						</svg>
						{PUBLISHED.find((l) => l.code === locale)?.localName}
						<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"
							><path d="m6 9 6 6 6-6" /></svg
						>
					</summary>
					<!-- A full page load (data-sveltekit-reload): <html lang> is set by the
					     server hook at prerender, so a client-side switch would keep the old one. -->
					<nav class="lang-list card-sm" aria-label={m.language}>
						<ul>
							{#each PUBLISHED as l (l.code)}
								<li>
									<a
										href={cohendHref(l.code)}
										hreflang={l.hrefLang}
										lang={l.hrefLang}
										aria-current={l.code === locale ? 'page' : undefined}
										data-sveltekit-reload
										onclick={keepSearch}>{l.localName}</a
									>
								</li>
							{/each}
						</ul>
						<a
							class="help-translate"
							href="https://github.com/rpsychologist/rpsychologist-com/blob/master/docs/translation.md"
							rel="noopener">{m.help_translate}</a
						>
					</nav>
				</details></span
			>
		</div>
		{#if translators.length}
			<p class="byline">
				{m.translated_by}
				{#each translators as tr, i (tr.name)}{i > 0 ? ', ' : ''}{#if tr.url}<a
							href={tr.url}
							rel="noopener">{tr.name}</a
						>{:else}{tr.name}{/if}{/each}
			</p>
		{/if}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</header>

	<div class="intro">
		<div class="share-row">
			<ShareLinks slug={cohendPath(locale).slice(1)} title={m.seo_title} label={m.share} />
		</div>
		<p><Msg text={m.intro_p1} /></p>
		<p><Msg text={m.intro_p2} /></p>
	</div>

	{#if dropped}
		<div class="notice-slot">
			<Toast ondismiss={() => (dropped = null)}>
				{#if dropped.link.length}
					<Msg text={m.dropped_link} values={{ params: linkParams }} />
				{/if}
				{#if dropped.saved.length}
					<Msg text={m.dropped_saved} values={{ params: savedParams }} />
				{/if}
			</Toast>
		</div>
	{/if}

	<CohendTool {model} bind:settingsOpen />

	<section class="cl-section">
		<h2>{m.cl_heading}</h2>
		<CommonLanguage {model} />
	</section>

	<div class="bio-wrap">
		<Bio />
	</div>

	<section id="faq" class="faq">
		<h2>{m.faq_heading}</h2>

		<details>
			<summary>{m.faq_help_q}</summary>
			<div class="answer">
				<p><Msg text={m.faq_help_a1} /></p>
				<p><Msg text={m.faq_help_a2} /></p>
				<p><Msg text={m.faq_help_a3} /></p>
			</div>
		</details>

		<details>
			<summary>{m.faq_formulas_q}</summary>
			<div class="answer">
				<p>
					<Msg text={m.faq_formulas_a1} values={{ delta: texDelta, sigma: texSigma, mu: texMu }} />
				</p>
				<Tex display math={tex.d} />
				<p><Msg text={m.faq_formulas_a2} values={{ Phi: texPhi, Psi: texPsi }} /></p>
				<Tex display math={tex.u3} />
				<Tex display math={tex.ovl} />
				<Tex display math={tex.cl} />
				<Tex display math={tex.nnt} />
				<p><Msg text={m.faq_formulas_a3} /></p>
				<p><Msg text={m.faq_formulas_r} /></p>
				<pre class="code"><code>{rCode}</code></pre>
				<h3>{m.faq_references}</h3>
				<ul class="refs" lang="en">
					<li>
						Cohen, J. (1977). <em>Statistical power analysis for the behavioral sciences</em>.
						Routledge.
					</li>
					<li>
						Furukawa, T. A., &amp; Leucht, S. (2011). How to obtain NNT from Cohen's d: comparison
						of two methods. <em>PLoS ONE, 6</em>(4), e19070.
					</li>
					<li>
						Reiser, B., &amp; Faraggi, D. (1999). Confidence intervals for the overlapping
						coefficient: the normal equal variance case. <em
							>Journal of the Royal Statistical Society, 48</em
						>(3), 413–418.
					</li>
					<li>
						Ruscio, J. (2008). A probability-based measure of effect size: robustness to base rates
						and other factors. <em>Psychological Methods, 13</em>(1), 19–30.
					</li>
				</ul>
			</div>
		</details>

		<details>
			<summary>{m.faq_cite_q}</summary>
			<div class="answer">
				<VizCitation
					{changelog}
					title="Interpreting Cohen's d effect size: An interactive visualization"
					changelogHref={resolve('/cohend/changelog')}
				/>
			</div>
		</details>

		<details>
			<summary>{m.faq_bug_q}</summary>
			<div class="answer">
				<p>
					<Msg
						text={m.faq_bug_a}
						links={{ a1: 'https://github.com/rpsychologist/rpsychologist-com' }}
					/>
				</p>
			</div>
		</details>

		<details>
			<summary>{m.faq_overlap_q}</summary>
			<div class="answer">
				<p>
					<Msg
						text={m.faq_overlap_a}
						links={{ a1: resolve('/[slug]', { slug: 'cohen-d-proportion-overlap' }) }}
					/>
				</p>
			</div>
		</details>

		<details>
			<summary>{m.faq_license_q}</summary>
			<div class="answer">
				<p>
					<Msg
						text={m.faq_license_a1}
						links={{ a1: 'https://creativecommons.org/publicdomain/zero/1.0/' }}
					/>
					<Msg text={m.faq_license_a2} />
				</p>
			</div>
		</details>
	</section>

	<MoreViz items={more} heading={m.more_heading} allLabel={m.more_all} />
</div>

<style>
	/* The viz area uses the wide ~lg container (~1200px) the old page used; prose
	   stays at the old 700px reading measure, centered within it. */
	/* Match the old page's absolute sizes: ~1232px viz area, 700px prose. Set in
	   px (not rem) because the target dimensions are specific and the site's root
	   font is 18px. */
	.page {
		--panel-w: 320px;
		/* Drawer footprint: its width plus a breathing gap. */
		--reserve: calc(var(--panel-w) + 1.5rem);
		box-sizing: border-box;
		max-width: 1232px;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 4rem;
		/* Anchor for the open-state `left` shift. position:relative (not transform)
		   so the drawer — which is position:fixed and rendered inside .page — still
		   anchors to the viewport; a transform would make .page its containing
		   block. Both `left` and `max-width` animate so the shift is smooth. */
		position: relative;
		left: 0;
		transition:
			left 0.2s ease,
			max-width 0.2s ease;
	}
	/* When the drawer opens, shrink the centering area by the drawer footprint and
	   re-center the page in what's left — the old layout gave its content a
	   margin-right of the drawer width and let the centered container re-center.
	   Capping max-width keeps the viz full width until the leftover space is
	   narrower than it (then it shrinks); the left shift of half the footprint
	   keeps the result centered in the visible area rather than hugging the
	   drawer. */
	.page.settings-open {
		max-width: min(1232px, calc(100vw - var(--reserve) - 2.5rem));
		left: calc(-1 * var(--reserve) / 2);
	}
	/* Small screens: the drawer is a full-width overlay, so don't reserve or shift. */
	@media (max-width: 48rem) {
		.page.settings-open {
			max-width: 1232px;
			left: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.page {
			transition: none;
		}
	}
	.hero,
	.intro,
	.cl-section,
	.bio-wrap,
	.faq {
		max-width: 700px;
		margin-inline: auto;
	}
	/* Set off from the explanation above and the FAQ below; the bio is a
	   secondary attribution block, not part of the prose flow. */
	.bio-wrap {
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--rule);
	}
	.hero {
		text-align: center;
		margin-top: 1rem;
		margin-bottom: 1.5rem;
	}
	.hero h1 {
		margin-bottom: 0.3rem;
	}
	.subtitle {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--heading);
		margin: 0 0 0.5rem;
	}
	.byline {
		font-size: 0.9rem;
		color: var(--muted);
		margin: 0;
	}
	/* Phrases that mustn't split ("Version" / "2.8.0" did on narrow phones);
	   the "Created by" label stays free to wrap, as translations of it run long. */
	.byline .item {
		white-space: nowrap;
	}
	/* Language menu: the byline's last item, styled as byline text rather than a
	   button. */
	.lang-menu {
		position: relative;
		display: inline-block;
	}
	/* Inline (not flex), so the name sits on the byline's text baseline. */
	.lang-menu summary {
		display: inline;
		color: var(--ink);
		cursor: pointer;
		list-style: none;
	}
	.lang-menu summary::-webkit-details-marker {
		display: none;
	}
	.lang-menu summary:hover,
	.lang-menu[open] summary {
		color: var(--heading);
	}
	.lang-menu svg {
		width: 14px;
		height: 14px;
		vertical-align: -0.15em;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.lang-menu .chevron {
		width: 13px;
		height: 13px;
		transition: transform 0.15s;
	}
	.lang-menu[open] .chevron {
		transform: rotate(180deg);
	}
	.lang-list {
		position: absolute;
		top: calc(100% + 0.35rem);
		/* Hung from the trigger's right edge: the trigger always ends its line, often
		   near the viewport edge, where a centered menu would overflow. */
		right: 0;
		z-index: 40;
		min-width: 11rem;
		padding: 0.3rem;
		text-align: left;
		white-space: normal;
		background: var(--panel);
		box-shadow: var(--shadow-md);
	}
	.lang-list ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.lang-list a {
		display: block;
		padding: 0.35rem 0.65rem;
		border-radius: var(--radius-sm);
		color: var(--ink);
		text-decoration: none;
	}
	.lang-list a:hover {
		background: var(--rule);
	}
	.lang-list a[aria-current='page'] {
		font-weight: 600;
	}
	.lang-list .help-translate {
		margin-top: 0.3rem;
		padding-top: 0.55rem;
		border-top: 1px solid var(--rule);
		border-radius: 0;
		color: var(--muted);
	}
	@media (prefers-reduced-motion: reduce) {
		.lang-menu .chevron {
			transition: none;
		}
	}
	/* This page is wrapped in `.page`, not `.article`, so the site's prose-link
	   treatment (article.css `.article a`) doesn't reach the byline + FAQ links.
	   Without this they fall back to UA-default blue and go purple once visited.
	   Mirror the canonical treatment here: ink text, quiet rule underline that
	   warms to accent on hover. (VizGallery/Bio links carry their own scoped
	   styles and aren't affected.) */
	.byline .item > a,
	.byline > a,
	.faq .answer :global(a) {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.15em;
		transition:
			text-decoration-color 0.15s,
			color 0.15s;
	}
	.byline .item > a:hover,
	.byline > a:hover,
	.faq .answer :global(a:hover) {
		color: var(--heading);
		text-decoration-color: var(--accent);
	}
	.intro {
		margin-bottom: 1.5rem;
	}
	.intro p {
		line-height: 1.6;
	}

	/* Invalid-state notice: the shared core Toast, floated bottom-center by this
	   slot so it never reflows the page. Centered via auto margins, not a
	   transform — the Toast's fly transition animates transform and would fight
	   a translateX(-50%). */
	.notice-slot {
		position: fixed;
		inset-inline: 0;
		bottom: 1.25rem;
		z-index: 80; /* above the settings drawer (60) and its popovers (70) */
		margin-inline: auto;
		width: fit-content;
		max-width: min(36rem, calc(100vw - 2rem));
	}
	.notice-slot code {
		/* Plain mono, not the global boxed-chip treatment: chips detach the list's
		   commas ("SD , CER") and read too busy inside a small toast. */
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--heading);
	}

	.cl-section {
		margin-top: 1.5rem;
	}
	.cl-section h2 {
		text-align: center;
	}

	.faq {
		margin-top: 2.5rem;
	}
	.faq details {
		border-bottom: 1px solid var(--rule);
	}
	.faq summary {
		padding: 0.85rem 0;
		font-weight: 600;
		cursor: pointer;
		color: var(--heading);
	}
	.faq .answer {
		padding-bottom: 1rem;
		line-height: 1.6;
	}
	.refs {
		font-size: 0.9rem;
		color: var(--muted);
	}
	.code {
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		overflow-x: auto;
		font-size: 0.85rem;
	}
	.share-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.75rem;
	}
</style>
