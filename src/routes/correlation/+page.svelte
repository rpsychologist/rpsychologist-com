<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import Bio from '$lib/components/Bio.svelte';
	import VizGallery from '$lib/components/VizGallery.svelte';
	import { viz } from '$lib/viz';
	import Toast from '$lib/viz/core/components/Toast.svelte';
	import VizCitation from '$lib/components/VizCitation.svelte';
	import { changelog } from '$lib/viz/correlation/changelog';
	import CorrelationTool from '$lib/viz/correlation/CorrelationTool.svelte';
	import { CorrelationState } from '$lib/viz/correlation/correlation.svelte';

	const model = new CorrelationState();
	// Owned here (not in CorrelationTool) so the page can shift its layout when
	// the settings drawer opens; the tool binds it.
	let settingsOpen = $state(false);

	// Saved-state keys init rejected as invalid — surfaced instead of failing
	// silently (a stale blob after a schema change would otherwise masquerade as
	// the defaults). No URL params in this app, so only the saved side exists.
	let dropped = $state<string[] | null>(null);

	// Draw the sample and apply saved state after mount, so SSR and the first
	// client render share the (empty-frame) defaults — the page is prerendered.
	onMount(() => {
		const d = model.init();
		if (!d.length) return;
		dropped = d;
		const timer = setTimeout(() => (dropped = null), 10000);
		return () => clearTimeout(timer);
	});

	// Related tools, surfaced in context for visitors who land directly here.
	const more = viz.filter((v) => !v.legacy && v.href !== '/correlation');

	// LaTeX kept in the script (braces in \frac{}{} must live in JS strings).
	const tex = {
		rho: String.raw`\rho`,
		r: String.raw`r = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{(n - 1)\, s_x s_y}`,
		r2: String.raw`r^2`,
		ols: String.raw`b_1 = r\,\frac{s_y}{s_x}, \qquad b_0 = \bar{y} - b_1 \bar{x}`,
		whiten: String.raw`z_{y \perp x} = \frac{z_y - c\, z_x}{\sqrt{1 - c^2}}`,
		impose: String.raw`y^{*} = \left(\rho\, z_x + \sqrt{1 - \rho^2}\, z_{y \perp x}\right) s_y^{\text{target}} + \bar{y}^{\text{target}}`,
		ellipse: String.raw`s_x \sqrt{\chi^2_2(p)} \quad \text{and} \quad s_y \sqrt{\chi^2_2(p)}`
	};

	const csvExample = `x,y\n10.0,11.0\n12.0,12.0\n...,...`;
</script>

<Seo
	title="Interpreting Correlations"
	description="An interactive visualization of correlation: a scatter plot you can reshape by dragging the correlation, dragging points, or loading your own data — with shared variance, regression line, residuals, and probability ellipses."
	path="/correlation"
/>

<div class="page" class:settings-open={settingsOpen}>
	<header class="hero">
		<h1 class="display">Interpreting Correlations</h1>
		<p class="subtitle">An Interactive Visualization</p>
		<p class="byline">
			Created by <a href={resolve('/about')}>Kristoffer Magnusson</a> ·
			<a href={resolve('/correlation/changelog')}>Version {changelog.version}</a>
		</p>
	</header>

	<div class="intro">
		<p>
			Correlation is one of the most widely used tools in statistics. The correlation coefficient
			summarizes the association between two variables. In this visualization I show a scatter plot
			of two variables with a given correlation. The variables are samples from the standard normal
			distribution, which are then transformed to have a given correlation by using Cholesky
			decomposition. By moving the slider you will see how the shape of the data changes as the
			association becomes stronger or weaker. You can also look at the Venn diagram to see the
			amount of shared variance between the variables. It is also possible to drag the data points
			to see how the correlation is influenced by outliers.
		</p>
	</div>

	{#if dropped}
		<div class="notice-slot">
			<Toast ondismiss={() => (dropped = null)}>
				Your saved settings had invalid values for
				{#each dropped as p, i (p)}{i > 0 ? ', ' : ''}<code>{p}</code>{/each} — showing the defaults instead.
			</Toast>
		</div>
	{/if}

	<CorrelationTool {model} bind:settingsOpen />

	<div class="bio-wrap">
		<Bio />
	</div>

	<section id="faq" class="faq">
		<h2>FAQ</h2>

		<details>
			<summary>How do I use this visualization?</summary>
			<div class="answer">
				<p>
					Use the slider or the correlation input to set the correlation. The same sample is
					re-transformed each time, so the points move smoothly as the association strengthens or
					weakens; the Venn diagram shows the corresponding shared variance.
				</p>
				<h3>Edit the data points</h3>
				<p>
					With <strong>Edit points</strong> on (the pencil above the chart), choose
					<strong>Drag</strong> to move points, <strong>Add</strong> to insert a point wherever you
					click, or <strong>Delete</strong> to remove points. All statistics — including the slider —
					follow the observed sample, so dragging a single point into the corner is a quick way to see
					how sensitive the correlation is to outliers.
				</p>
				<h3>Presets</h3>
				<p>
					Small/medium/large snap the correlation to the conventional benchmarks (0.1, 0.3, 0.5).
					Anscombe I–IV load <em>Anscombe's quartet</em> — four datasets sharing nearly identical summary
					statistics but wildly different shapes — and Anscombosaurus loads the datasaurus. Both are reminders
					to always plot your data.
				</p>
				<h3>Load your own data (CSV)</h3>
				<p>The settings drawer can load a CSV file with this structure:</p>
				<pre class="code"><code>{csvExample}</code></pre>
				<p>
					The first row is the column names, which become the axis labels; the first column is taken
					as x and the second as y — all other columns are ignored. The file is parsed in your
					browser and <em>not</em> uploaded anywhere: this site performs no server-side calculations.
				</p>
				<h3>Probability ellipses</h3>
				<p>
					Toggle the ellipses in the settings drawer; they mark the regions expected to hold 50, 80,
					95, and 99% of the data under a bivariate normal with the sample's moments.
					<strong>Protip:</strong> click an ellipse to highlight it and read off its probability (except
					in Add mode, where clicks place new points).
				</p>
				<h3>Slope chart</h3>
				<p>
					The slope-chart toggle redraws each (x, y) pair as a Pre–Post line — the same data viewed
					as change scores, where the correlation governs how much the lines cross.
				</p>
				<p>
					The settings drawer also draws new samples of any size, sets the population means and SDs,
					re-frames the axes (Rescale), and saves the current state in your browser's
					<code>localStorage</code>.
				</p>
			</div>
		</details>

		<details>
			<summary>What are the formulas?</summary>
			<div class="answer">
				<p>The sample product-moment correlation between x and y is</p>
				<Tex display math={tex.r} />
				<p>
					where <Tex math="s_x" /> and <Tex math="s_y" /> are the sample standard deviations. The shared
					variance shown next to the Venn diagram is <Tex math={tex.r2} />, and the regression line
					uses the ordinary least-squares fit,
				</p>
				<Tex display math={tex.ols} />
				<p>
					To display a chosen correlation <Tex math={tex.rho} />, the sample is first standardized
					(z-scored). Writing <Tex math="c" /> for the observed correlation of the standardized pair,
					whitening removes the sampled association,
				</p>
				<Tex display math={tex.whiten} />
				<p>
					which is the inverse Cholesky factor of the observed 2×2 correlation matrix applied to the
					data. The target correlation is then imposed with the Cholesky factor of
					<Tex math={String.raw`\begin{bmatrix} 1 & \rho \\ \rho & 1 \end{bmatrix}`} /> and the result
					is scaled back to the target moments:
				</p>
				<Tex display math={tex.impose} />
				<p>
					Because the standardized sample has unit variances by construction, the transformed points
					have a sample correlation of exactly <Tex math={tex.rho} /> — no simulation error.
				</p>
				<p>
					The probability ellipses are level curves of the fitted bivariate normal: the ellipse
					containing probability <Tex math="p" /> has half-axes
				</p>
				<Tex display math={tex.ellipse} />
				<p>
					along the principal directions, where <Tex math={String.raw`\chi^2_2(p)`} /> is the chi-square
					quantile with 2 degrees of freedom.
				</p>
			</div>
		</details>

		<details>
			<summary>How do I cite this page?</summary>
			<div class="answer">
				<VizCitation
					{changelog}
					title="Interpreting correlations: An interactive visualization"
					changelogHref={resolve('/correlation/changelog')}
				/>
			</div>
		</details>

		<details>
			<summary>I found a bug/error/typo or want to make a suggestion!</summary>
			<div class="answer">
				<p>
					Please report errors or suggestions by opening an issue on
					<a href="https://github.com/rpsychologist/rpsychologist-com">GitHub</a>; if you want to
					ask a question, use
					<a href="https://github.com/rpsychologist/rpsychologist-com/discussions"
						>GitHub Discussions</a
					>.
				</p>
			</div>
		</details>

		<details>
			<summary
				>I'm gonna ask a large number of students to visit this site. Will it crash your server?</summary
			>
			<div class="answer">
				<p>
					No, it will be fine. The app runs in your browser, so the server only needs to serve the
					files.
				</p>
			</div>
		</details>

		<details>
			<summary>Can I include this visualization in my book/article/etc?</summary>
			<div class="answer">
				<p>
					Yes, go ahead! This visualization is dedicated to the <strong>public domain</strong> (<a
						href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a
					>), which means you can copy, modify, and distribute it, even for commercial purposes,
					without asking permission. Attribution is not required but always appreciated. The source
					code is licensed MIT, and the text on this page is CC-BY 4.0.
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
	/* Layout chrome copied from /cohend (the viz-page template): wide viz area,
	   700px prose measure, drawer-open shift. See that file for the rationale. */
	.page {
		--panel-w: 320px;
		--reserve: calc(var(--panel-w) + 1.5rem);
		box-sizing: border-box;
		max-width: 1232px;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 4rem;
		position: relative;
		left: 0;
		transition:
			left 0.2s ease,
			max-width 0.2s ease;
	}
	.page.settings-open {
		max-width: min(1232px, calc(100vw - var(--reserve) - 2.5rem));
		left: calc(-1 * var(--reserve) / 2);
	}
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
	.bio-wrap,
	.faq {
		max-width: 700px;
		margin-inline: auto;
	}
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
	.byline a,
	.faq .answer a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.15em;
		transition:
			text-decoration-color 0.15s,
			color 0.15s;
	}
	.byline a:hover,
	.faq .answer a:hover {
		color: var(--heading);
		text-decoration-color: var(--accent);
	}
	.intro {
		margin-bottom: 1.5rem;
	}
	.intro p {
		line-height: 1.6;
	}

	.notice-slot {
		position: fixed;
		inset-inline: 0;
		bottom: 1.25rem;
		z-index: 80;
		margin-inline: auto;
		width: fit-content;
		max-width: min(36rem, calc(100vw - 2rem));
	}
	.notice-slot code {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--heading);
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
	.faq .answer h3 {
		font-size: 0.95rem;
		margin: 1.1rem 0 0.3rem;
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
