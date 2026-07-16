<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import Tex from '$lib/components/Tex.svelte';
	import Bio from '$lib/components/Bio.svelte';
	import VizGallery from '$lib/components/VizGallery.svelte';
	import VizCitation from '$lib/components/VizCitation.svelte';
	import { viz } from '$lib/viz';
	import { changelog } from '$lib/viz/likelihood/changelog';
	import LikelihoodTool from '$lib/viz/likelihood/LikelihoodTool.svelte';
	import { LikelihoodState } from '$lib/viz/likelihood/likelihood.svelte';

	// Per-component instance: the page is prerendered, so a module-level
	// singleton would bleed state across requests.
	const model = new LikelihoodState();

	const more = viz.filter((v) => v.href !== '/likelihood');

	// LaTeX kept in the script (braces in \frac{}{} must live in JS strings).
	const tex = {
		loglik: String.raw`\ell(\mu, \sigma^2) = -\frac{n}{2}\ln(2\pi\sigma^2) - \frac{\sum_{i=1}^n (y_i - \mu)^2}{2\sigma^2}`,
		mles: String.raw`\hat\mu = \frac{1}{n}\sum_{i=1}^n y_i, \qquad \hat\sigma^2 = \frac{\sum_{i=1}^n (y_i - \hat\mu)^2}{n}`,
		scores: String.raw`U(\mu) = \frac{n(\bar y - \mu)}{\sigma^2}, \qquad U(\sigma^2) = -\frac{n}{2\sigma^2} + \frac{\sum_i (y_i - \mu)^2}{2\sigma^4}`,
		info: String.raw`I(\mu) = \frac{n}{\sigma^2}, \qquad I(\sigma^2) = \frac{n}{2\sigma^4}`,
		lr: String.raw`\text{LR} = -2\left[\ell(\mu_0, \hat\sigma_0^2) - \ell(\hat\mu, \hat\sigma^2)\right] = n \ln\frac{\hat\sigma_0^2}{\hat\sigma^2} \sim \chi^2_1`,
		wald: String.raw`Z = \frac{\hat\mu - \mu_0}{\sqrt{\hat\sigma^2 / n}} \sim \mathcal N(0, 1)`,
		score: String.raw`S = \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \sim \chi^2_1`,
		li: String.raw`\left\{\mu : \ell(\mu) \ge \ell(\hat\mu) - \tfrac{1}{2}\chi^2_{1}(0.95)\right\}, \qquad \tfrac{1}{2}\chi^2_{1}(0.95) \approx 1.92`,
		profile: String.raw`\hat\mu \pm \hat\sigma\sqrt{e^{\chi^2_1(0.95)/n} - 1}`,
		ga: String.raw`\mu_{n+1} = \mu_n + \gamma\, U(\mu_n), \qquad \sigma^2_{n+1} = \sigma^2_n + \gamma\, U(\sigma^2_n)`,
		nr: String.raw`\theta_{n+1} = \theta_n + I(\theta_n)^{-1} U(\theta_n)`
	};
</script>

<Seo
	title="Understanding Maximum Likelihood Estimation"
	description="An interactive visualization of maximum likelihood estimation: follow gradient ascent or Newton-Raphson up the likelihood surface of a normal model, and see how the likelihood ratio, Wald, and score tests flow from the same curve."
	path="/likelihood"
/>

<div class="page">
	<header class="hero">
		<h1 class="display">Understanding Maximum Likelihood Estimation</h1>
		<p class="subtitle">An Interactive Visualization</p>
		<p class="byline">
			Created by <a href={resolve('/about')}>Kristoffer Magnusson</a> ·
			<a href={resolve('/likelihood/changelog')}>Version {changelog.version}</a>
		</p>
	</header>

	<div class="intro">
		<p>
			Maximum likelihood is the workhorse of statistical estimation — most of the models
			psychologists fit every day are estimated by it. The idea is simple: the likelihood function
			scores how well candidate parameter values explain the data we actually observed, and the
			maximum likelihood estimates are the values that score best. This page walks through the whole
			story for the simplest interesting case, a normal model with unknown mean and variance: first
			what the likelihood <em>is</em>, then how an optimizer climbs it to find the maximum, and
			finally how the likelihood ratio, Wald, and score tests all read their answers off the same
			curve. Throughout, the mean is the parameter of interest and the variance a nuisance parameter
			— estimated along the way, but never tested. Everything is interactive — drag, click, and
			break things.
		</p>
	</div>

	<LikelihoodTool {model} />

	<div class="bio-wrap">
		<Bio />
	</div>

	<section id="faq" class="faq">
		<h2>FAQ</h2>

		<details>
			<summary>How do I use this visualization?</summary>
			<div class="answer">
				<p>
					The sticky bar at the top sets the candidate parameters: drag the sliders, type exact
					values, or press <strong>MLE</strong> to jump a parameter to its estimate.
					<strong>New Sample</strong> draws 10 fresh observations from N(100, 225).
				</p>
				<h3>Explore the log-likelihood</h3>
				<p>
					The two slices are live and read as a pair: drag the point on the ℓ(μ) or ℓ(σ²) curve to
					vary one parameter while the other is held fixed. The tangent line shows the score — the
					derivative of the log-likelihood — which is zero at the peak. The shaded band on the ℓ(μ)
					slice is the 95% likelihood interval at the current σ²; its width is the estimate's
					precision, reported beneath the slices. The joint view shows both parameters at once —
					drag the 3D floor handle or the contour point to move them together.
				</p>
				<h3>Run an optimizer</h3>
				<p>
					Pick gradient ascent or Newton-Raphson and press play (or step with +1/−1). The climb is
					drawn on the joint plot, which opens as a rotatable <strong>3D surface</strong> — drag to
					rotate, grab the floor handle to move the point, or switch to <strong>Contour</strong> for
					precise readouts. The teal curves through the current point are the ℓ(μ) and ℓ(σ²) slices
					above, drawn on the surface; the amber curves on the back walls are the <em>profile</em>
					likelihoods — the ridge cast onto each axis, which the likelihood-ratio test and profile interval
					are built on. Height is the relative likelihood <Tex
						math={String.raw`(L/\hat L)^{1/50}`}
					/> rather than ℓ itself — a monotone transform, so the peak and every climb are unchanged (the
					same reason maximizing the log-likelihood is legitimate), but the summit is visible: raw ℓ renders
					as a plateau with one cliff, and raw
					<Tex math="L" /> as a needle.
				</p>
				<h3>Inference</h3>
				<p>
					The inference section computes the likelihood ratio, Wald, and score tests of H₀: μ = μ₀.
					Selecting a test highlights its geometry in the figure. The sample-size slider is
					hypothetical: it rescales the curvature and the tests at the fixed estimates without
					drawing new data.
				</p>
			</div>
		</details>

		<details>
			<summary>What are the formulas?</summary>
			<div class="answer">
				<p>The log-likelihood of a sample of <Tex math="n" /> independent observations is</p>
				<Tex display math={tex.loglik} />
				<p>and it is maximized by</p>
				<Tex display math={tex.mles} />
				<p>
					Note that <Tex math={String.raw`\hat\sigma^2`} /> divides by <Tex math="n" />, not
					<Tex math="n - 1" /> — the MLE of the variance is biased in small samples.
				</p>
				<p>The score functions (first derivatives) are</p>
				<Tex display math={tex.scores} />
				<p>and the expected (Fisher) information for each parameter is</p>
				<Tex display math={tex.info} />
				<h3>The three tests</h3>
				<p>
					With <Tex math={String.raw`\hat\sigma_0^2`} /> denoting the MLE of the variance with the mean
					pinned to <Tex math={String.raw`\mu_0`} />, the three tests of
					<Tex math={String.raw`H_0\!: \mu = \mu_0`} /> are
				</p>
				<Tex display math={tex.lr} />
				<Tex display math={tex.wald} />
				<Tex display math={tex.score} />
				<p>
					The three are asymptotically equivalent but differ in small samples; Buse (1982) gives the
					geometric interpretation the inference figure draws.
				</p>
				<h3>The likelihood interval</h3>
				<p>
					Inverting the likelihood ratio test gives the interval of means whose log-likelihood stays
					within <Tex math={String.raw`\chi^2_1(0.95)/2`} /> of the maximum:
				</p>
				<Tex display math={tex.li} />
				<p>
					The ℓ(μ) plot shades this region on the drawn slice, where the curve is exactly quadratic
					in <Tex math={String.raw`\mu`} /> — so when σ² is at its MLE the likelihood interval and the
					Wald interval coincide (since
					<Tex math={String.raw`2 \times 1.92 = 1.96^2`} />). Profiling σ² out instead (the exact
					LRT inversion) gives the slightly wider closed form
				</p>
				<Tex display math={tex.profile} />
				<h3>The optimizers</h3>
				<p>Gradient ascent updates each parameter proportionally to its score,</p>
				<Tex display math={tex.ga} />
				<p>
					with <Tex math={String.raw`\gamma = 0.05`} /> on internally standardized data (values are back-transformed
					before plotting). Newton-Raphson (here equal to Fisher scoring) weights the step by the inverse
					information,
				</p>
				<Tex display math={tex.nr} />
				<p>
					which lands on <Tex math={String.raw`\hat\mu`} /> in a single step because ℓ is quadratic in
					<Tex math={String.raw`\mu`} />.
				</p>
			</div>
		</details>

		<details>
			<summary>How do I cite this page?</summary>
			<div class="answer">
				<VizCitation
					{changelog}
					title="Understanding maximum likelihood estimation: An interactive visualization"
					changelogHref={resolve('/likelihood/changelog')}
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

		<details>
			<summary>References</summary>
			<div class="answer">
				<p>
					Buse, A. (1982). The likelihood ratio, Wald, and Lagrange multiplier tests: An expository
					note. <em>The American Statistician, 36</em>(3a), 153–157.
					<a href="https://doi.org/10.1080/00031305.1982.10482817"
						>https://doi.org/10.1080/00031305.1982.10482817</a
					>
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
	   700px prose measure. No settings drawer in this app, so no drawer shift. */
	.page {
		box-sizing: border-box;
		max-width: 1232px;
		margin: 0 auto;
		padding: 2.5rem 1.25rem 4rem;
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
	.more {
		margin-top: 2.5rem;
	}
</style>
