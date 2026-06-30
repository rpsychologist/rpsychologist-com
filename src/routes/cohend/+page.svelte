<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { format } from 'd3-format';
	import Seo from '$lib/components/Seo.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import Bio from '$lib/components/Bio.svelte';
	import VizGallery from '$lib/components/VizGallery.svelte';
	import { viz } from '$lib/viz';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { downloadSvg } from '$lib/viz/core/util/svgExport';
	import Overlap from '$lib/viz/cohend/Overlap.svelte';
	import Donuts from '$lib/viz/cohend/Donuts.svelte';
	import Settings from '$lib/viz/cohend/Settings.svelte';
	import ShareDialog from '$lib/viz/cohend/ShareDialog.svelte';
	import CommonLanguage from '$lib/viz/cohend/CommonLanguage.svelte';
	import { CohendState } from '$lib/viz/cohend/cohend.svelte';

	const model = new CohendState();
	let svg = $state<SVGSVGElement>();
	let settingsOpen = $state(false);
	let shareOpen = $state(false);
	let dragStartX = 0;

	// Apply saved state + URL params after mount so SSR and first client render
	// share the defaults (the page is prerendered).
	onMount(() => model.init(location.search));

	const d2 = format('.2f');

	// Related tools, surfaced in context for visitors who land directly on this
	// page (most do, via search) and never see the global /viz gallery.
	const more = viz.filter((v) => v.href !== '/cohend');

	function download() {
		if (svg) downloadSvg(svg, 'rpsychologist-cohend.svg');
	}

	// LaTeX kept in the script (a `{` inside a Svelte attribute is parsed as an
	// expression delimiter, so braces in \frac{}{} must live in JS strings).
	const tex = {
		Phi: String.raw`\Phi`,
		delta: String.raw`\delta`,
		sigma: String.raw`\sigma`,
		d: String.raw`\delta = \frac{\mu_2 - \mu_1}{\sigma}`,
		u3: String.raw`U_3 = \Phi(\delta)`,
		ovl: String.raw`\text{OVL} = 2\,\Phi(-|\delta|/2)`,
		cl: String.raw`\text{CL} = \Phi\!\left(\frac{\delta}{\sqrt{2}}\right)`,
		nnt: String.raw`\text{NNT} = \frac{1}{\Phi(\delta + \Psi(\text{CER})) - \text{CER}}`
	};

	const rCode = `CER <- 0.2\nd <- 0.2\n1 / (pnorm(d + qnorm(CER)) - CER)`;
	const bibtex = `@software{magnussonCohend,
  author = {Kristoffer Magnusson},
  title = {Interpreting Cohen's d Effect Size: An Interactive Visualization},
  url = {https://rpsychologist.com/cohend/},
  version = {2.6.0},
  date = {2020},
}`;
</script>

<Seo
	title="Interpreting Cohen's d Effect Size"
	description="An interactive visualization of Cohen's d effect size: the overlap of two distributions, Cohen's U3, the probability of superiority, percentage of overlap, and the number needed to treat."
	path="/cohend"
/>

<div class="page" class:settings-open={settingsOpen}>
	<header class="hero">
		<h1>Interpreting Cohen's <em>d</em> Effect Size</h1>
		<p class="subtitle">An Interactive Visualization</p>
		<p class="byline">Created by <a href={resolve('/about')}>Kristoffer Magnusson</a></p>
	</header>

	<div class="intro">
		<p>
			The Cohen's <em>d</em> effect size is immensely popular in psychology. However, its interpretation
			is not straightforward and researchers often use general guidelines, such as small (0.2), medium
			(0.5) and large (0.8) when interpreting an effect. Moreover, in many cases it is questionable whether
			the standardized mean difference is more interpretable than the unstandardized mean difference.
		</p>
		<p>
			In order to aid the interpretation of Cohen's <em>d</em>, this visualization offers these
			different representations of Cohen's <em>d</em>: visual overlap, Cohen's U<sub>3</sub>, the
			probability of superiority, percentage of overlap, and the number needed to treat. It also
			lets you change the standard deviation and displays the unstandardized difference.
		</p>
	</div>

	<div class="control-bar">
		<label class="d-input">
			<span>Cohen's <em>d</em></span>
			<input
				type="number"
				min="0"
				max={model.p.sliderMax}
				step={model.p.sliderStep}
				bind:value={model.p.cohend}
				oninput={() => model.syncFromCohend()}
			/>
		</label>
		<div class="icons">
			<button
				class={['icon-btn', { on: settingsOpen }]}
				aria-label="Settings"
				aria-expanded={settingsOpen}
				title="Settings"
				onclick={() => (settingsOpen = !settingsOpen)}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="3" />
					<path
						d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
					/>
				</svg>
			</button>
			<button class="icon-btn" aria-label="Download SVG" title="Download SVG" onclick={download}>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
				</svg>
			</button>
			<button class="icon-btn" aria-label="Share" title="Share" onclick={() => (shareOpen = true)}>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="18" cy="5" r="3" />
					<circle cx="6" cy="12" r="3" />
					<circle cx="18" cy="19" r="3" />
					<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
				</svg>
			</button>
			<a class="icon-btn" href="#faq" aria-label="Help" title="Help">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="12" r="10" />
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
			</a>
		</div>
	</div>

	<Slider
		id="cohend-d"
		min={0}
		max={model.p.sliderMax}
		step={model.p.sliderStep}
		format={d2}
		bind:value={model.p.cohend}
		oninput={() => model.syncFromCohend()}
		onpointerdown={(e) => {
			dragStartX = e.clientX;
			model.immediate = false;
		}}
		onpointermove={(e) => {
			// Only a real drag (past a small threshold) updates immediately; a click —
			// which often emits a tiny pointermove — keeps animating, so re-clicking
			// mid-transition doesn't snap.
			if (Math.abs(e.clientX - dragStartX) > 4) model.immediate = true;
		}}
		onpointerup={() => (model.immediate = false)}
	/>

	<Overlap {model} bind:svg />
	<p class="fig-hint">Drag the chart to pan · double-click to reset.</p>

	{#if model.p.showDonuts}
		<Donuts {model} />
	{/if}

	{#if settingsOpen}
		<Settings {model} bind:open={settingsOpen} />
	{/if}

	<ShareDialog {model} bind:open={shareOpen} />

	<section class="cl-section">
		<h2>A Common Language Explanation</h2>
		<CommonLanguage {model} />
	</section>

	<Bio />

	<section id="faq" class="faq">
		<h2>FAQ</h2>

		<details>
			<summary>How do I use this visualization?</summary>
			<div class="answer">
				<p>
					Use the slider to change Cohen's <em>d</em>, or open the settings to change the
					parameters. The inputs can also be controlled with the keyboard arrows.
				</p>
				<p>
					From the settings you can change the means, standard deviation, and the control group
					event rate (CER); the axis and distribution labels; and the slider's maximum and step
					size. Settings can be saved in your browser's <code>localStorage</code> so they persist across
					visits.
				</p>
				<p>
					You can pan the x-axis by clicking and dragging the visualization. Double-click the
					visualization to center and rescale it.
				</p>
			</div>
		</details>

		<details>
			<summary>What are the formulas?</summary>
			<div class="answer">
				<p>
					Cohen's <em>d</em> is the standardized mean difference, where <Tex math={tex.delta} /> is the
					population Cohen's <em>d</em>, equal population variances (<Tex math={tex.sigma} />) are
					assumed, and <Tex math="\mu_i" /> is each population mean:
				</p>
				<Tex display math={tex.d} />
				<p>
					Writing <Tex math={tex.Phi} /> for the standard-normal CDF and <Tex math="\Psi" /> for its inverse,
					Cohen's U<sub>3</sub> (Cohen, 1977), the overlapping coefficient (Reiser &amp; Faraggi, 1999),
					the probability of superiority / common-language effect size (Ruscio, 2008), and the number
					needed to treat (Furukawa &amp; Leucht, 2011) are:
				</p>
				<Tex display math={tex.u3} />
				<Tex display math={tex.ovl} />
				<Tex display math={tex.cl} />
				<Tex display math={tex.nnt} />
				<p>
					CER is the control group's event rate (20% by default; change it in the settings). The
					overlap statistic here intentionally differs from Cohen's original calculation — see the
					question below.
				</p>
				<p>R code to calculate NNT from Cohen's <em>d</em>:</p>
				<pre class="code"><code>{rCode}</code></pre>
				<h3>References</h3>
				<ul class="refs">
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
			<summary>How do I cite this page?</summary>
			<div class="answer">
				<p>Cite this page according to your favorite style guide.</p>
				<p><strong>APA 7</strong></p>
				<p class="apa">
					Magnusson, K. (2020). <em
						>Interpreting Cohen's d effect size: An interactive visualization</em
					> (Version 2.6.0) [Web App]. R Psychologist. https://rpsychologist.com/cohend/
				</p>
				<p><strong>BibTeX</strong></p>
				<pre class="code"><code>{bibtex}</code></pre>
			</div>
		</details>

		<details>
			<summary>I found a bug/error/typo or want to make a suggestion!</summary>
			<div class="answer">
				<p>
					Please open an issue on <a href="https://github.com/rpsychologist/rpsychologist-com"
						>GitHub</a
					>, or reach out on social media.
				</p>
			</div>
		</details>

		<details>
			<summary>The overlap statistic differs from Cohen's calculations</summary>
			<div class="answer">
				<p>
					This is intentional; you can read more about my reasons in this blog post:
					<a href={resolve('/[slug]', { slug: 'cohen-d-proportion-overlap' })}
						>Where Cohen went wrong – the proportion of overlap between two normal distributions</a
					>.
				</p>
			</div>
		</details>

		<details>
			<summary>Can I include this visualization in my book/article/etc?</summary>
			<div class="answer">
				<p>
					Yes, go ahead! I did not invent plotting two overlapping Gaussian distributions. This
					visualization is dedicated to the <strong>public domain</strong> (<a
						href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a
					>), so you can copy, modify, and distribute it, even commercially, without asking
					permission. Attribution is not required but always appreciated. The source code is
					licensed MIT, and the text on this page is CC-BY 4.0.
				</p>
			</div>
		</details>
	</section>

	<section class="more">
		<h2>More visualizations</h2>
		<VizGallery items={more} />
	</section>
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
	.faq {
		max-width: 700px;
		margin-inline: auto;
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
	.intro {
		margin-bottom: 1.5rem;
	}
	.intro p {
		line-height: 1.6;
	}

	.control-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.4rem;
	}
	.d-input {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: var(--muted);
	}
	.d-input input {
		width: 4.5rem;
		font: inherit;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--ink);
	}
	.icons {
		display: flex;
		gap: 0.25rem;
	}
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border: none;
		background: none;
		color: var(--muted);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color 0.15s;
	}
	.icon-btn:hover,
	.icon-btn.on {
		color: var(--accent);
	}
	.icon-btn svg {
		width: 19px;
		height: 19px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
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
	.refs,
	.apa {
		font-size: 0.9rem;
		color: var(--muted);
	}
	.apa {
		padding-left: 2em;
		text-indent: -2em;
	}
	.code {
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		padding: 0.75rem 1rem;
		overflow-x: auto;
		font-size: 0.85rem;
	}
	.more {
		margin-top: 2.5rem;
	}
</style>
