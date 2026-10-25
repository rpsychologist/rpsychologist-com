<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '#lib/components/Seo.svelte';
	import Tex from '#lib/components/Tex.svelte';
	import Bio from '#lib/components/Bio.svelte';
	import MoreViz from '#lib/components/MoreViz.svelte';
	import ShareLinks from '#lib/components/ShareLinks.svelte';
	import VizCitation from '#lib/components/VizCitation.svelte';
	import { viz } from '#lib/viz.js';
	import { changelog } from '#lib/viz/likelihood/changelog.js';
	import LikelihoodTool from '#lib/viz/likelihood/LikelihoodTool.svelte';
	import { LikelihoodState } from '#lib/viz/likelihood/likelihood.svelte.js';

	// Per-component instance: the page is prerendered, so a module-level
	// singleton would bleed state across requests.
	const model = new LikelihoodState();

	const more = viz.filter((v) => !v.legacy && v.href !== '/likelihood');

	// LaTeX kept in the script (braces in \frac{}{} must live in JS strings).
	const tex = {
		loglik: String.raw`\ell(\mu, \sigma^2) = -\frac{n}{2}\ln(2\pi\sigma^2) - \frac{\sum_{i=1}^n (y_i - \mu)^2}{2\sigma^2}`,
		mles: String.raw`\hat\mu = \frac{1}{n}\sum_{i=1}^n y_i, \qquad \hat\sigma^2 = \frac{\sum_{i=1}^n (y_i - \hat\mu)^2}{n}`,
		scores: String.raw`U(\mu) = \frac{n(\bar y - \mu)}{\sigma^2}, \qquad U(\sigma^2) = -\frac{n}{2\sigma^2} + \frac{\sum_i (y_i - \mu)^2}{2\sigma^4}`,
		info: String.raw`I(\mu) = \frac{n}{\sigma^2}, \qquad I(\sigma^2) = \frac{n}{2\sigma^4}`,
		lr: String.raw`\text{LR} = -2\left[\ell(\mu_0, \hat\sigma_0^2) - \ell(\hat\mu, \hat\sigma^2)\right] = n \ln\frac{\hat\sigma_0^2}{\hat\sigma^2} \sim \chi^2_1`,
		wald: String.raw`Z = \frac{\hat\mu - \mu_0}{\sqrt{\hat\sigma^2 / n}} \sim \mathcal N(0, 1)`,
		score: String.raw`S = \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \sim \chi^2_1`,
		t: String.raw`T = \frac{\bar y - \mu_0}{s / \sqrt n}, \qquad s^2 = \frac{n}{n - 1}\hat\sigma^2, \qquad x = \frac{T^2}{n - 1}`,
		viaT: String.raw`\text{LR} = n \ln(1 + x), \qquad Z^2 = n x, \qquad S = \frac{n x}{1 + x}`,
		li: String.raw`\left\{\mu : \ell_p(\mu) \ge \ell_p(\hat\mu) - \tfrac{1}{2}\chi^2_{1}(0.95)\right\}, \qquad \tfrac{1}{2}\chi^2_{1}(0.95) \approx 1.92`,
		profile: String.raw`\hat\mu \pm \hat\sigma\sqrt{e^{\chi^2_1(0.95)/n} - 1}`,
		ga: String.raw`\mu_{t+1} = \mu_t + \gamma\, U(\mu_t), \qquad \sigma^2_{t+1} = \sigma^2_t + \gamma\, U(\sigma^2_t)`,
		nr: String.raw`\theta_{t+1} = \theta_t + I(\theta_t)^{-1} U(\theta_t)`
	};
</script>

<Seo
	title="Understanding Maximum Likelihood Estimation"
	description="Explore maximum likelihood estimation with an interactive normal model. Fit the mean and variance, follow an optimizer, and compare likelihood ratio, Wald, and score tests."
	path="/likelihood"
	type="app"
	card="likelihood"
	version={changelog.version}
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
		<div class="share-row">
			<ShareLinks slug="likelihood" title="Understanding Maximum Likelihood Estimation" />
		</div>
		<p>
			The maximum likelihood method is used to fit many models in statistics. In this visualization
			I want to give some intuition for how it works, and how it relates to three common hypothesis
			tests: the likelihood ratio, Wald, and score tests.
		</p>
		<p>
			We'll use a normal model with just two unknown parameters, the mean and variance, so we can
			draw the whole log-likelihood as a surface. When we get to hypothesis testing, we'll focus on
			the mean. The variance will be a <em>nuisance parameter</em>, meaning we still need to
			estimate it even though it isn't what we want to test.
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
					Use the sliders in the top bar to choose the mean and variance. You can also type a value
					or press <strong>MLE</strong> to set a parameter to its maximum likelihood estimate.
					<strong>New Sample</strong> draws 10 fresh observations from
					<Tex math={String.raw`\mathcal N(100, 225)`} />.
				</p>
				<h3>Explore the log-likelihood</h3>
				<p>
					Drag the ring on the floor of the 3D figure to change both parameters at once. The two
					curves through the point (the slices in the key) show what happens when you vary one
					parameter while holding the other fixed. Below the figure you'll find the current
					log-likelihood and the two scores, the slopes in the mean and variance directions. Hover
					or tap a score to show that slope on the surface.
				</p>
				<h3>Run an optimizer</h3>
				<p>
					Choose gradient ascent or Fisher scoring and press play. Use +1 to take a single step and
					−1 to undo it. A dashed arrow previews the next step, and the path shows the steps already
					taken. Gradient ascent has an adjustable step size. For Fisher scoring, dotted parabolas
					show the local approximations used to choose the next step.
				</p>
				<h3>Move around the 3D view</h3>
				<p>
					Drag the surface away from the ring to rotate it. The View buttons switch between an
					angled view and two side views. From the side, the outline of the surface follows the
					profile curve on the back wall.
				</p>
				<p>
					The full-view button at the right of each figure's header expands it to fill the window.
					Press it again, or press Esc, to return.
				</p>
				<h3>Why the surface is cut off</h3>
				<p>
					Near <Tex math={String.raw`\sigma^2 = 0`} />, the log-likelihood drops so far that showing
					it all would make the peak look almost flat. I've cut the figure off 50 log-likelihood
					units below the maximum so we can see what's happening near the top. The surface fades out
					below that floor; if you drag a point there, only its floor ring is shown. Above the
					cutoff, the vertical scale is still linear in log-likelihood.
				</p>
				<h3>Inference</h3>
				<p>
					Choose a test tab and move the null mean <Tex math={String.raw`\mu_0`} />. The dashed line
					across the floor marks the null mean, and the point labeled
					<em>best under <Tex math="H_0" /></em> is the fitted model under that null, with variance
					<Tex math={String.raw`\hat\sigma_0^2`} />. As you change <Tex math={String.raw`\mu_0`} />,
					this point follows the dotted ridge.
				</p>
				<p>
					The likelihood ratio tab highlights a vertical drop, the Wald tab a horizontal difference,
					and the score tab a slope. The sample-size slider changes the tests and intervals while
					keeping the estimated mean and variance fixed; it does not generate a larger sample. Hover
					or tap a legend entry to highlight its curve.
				</p>
			</div>
		</details>

		<details>
			<summary>What are the formulas?</summary>
			<div class="answer">
				<p>
					For <Tex math="n" /> independent observations from a normal distribution, the log-likelihood
					is
				</p>
				<Tex display math={tex.loglik} />
				<p>and it is maximized by</p>
				<Tex display math={tex.mles} />
				<p>
					The variance estimate <Tex math={String.raw`\hat\sigma^2`} /> divides by <Tex math="n" />,
					not
					<Tex math="n - 1" />, so the MLE of the variance is biased downward in small samples.
				</p>
				<p>The score functions (first derivatives) are</p>
				<Tex display math={tex.scores} />
				<p>and the expected (Fisher) information for each parameter is</p>
				<Tex display math={tex.info} />
				<h3>The log-likelihood, AIC, and BIC</h3>
				<p>
					The maximum, <Tex math={String.raw`\ell(\hat\mu, \hat\sigma^2)`} />, is the number
					statistical software reports as a model's log-likelihood. It is also where AIC and BIC
					come from: both take <Tex math={String.raw`-2\ell(\hat\mu, \hat\sigma^2)`} /> and add a penalty
					for the number of parameters <Tex math="k" />, <Tex math="2k" /> for AIC and
					<Tex math={String.raw`k \ln n`} /> for BIC. Here <Tex math="k = 2" />.
				</p>
				<h3>The three tests</h3>
				<p>
					Let <Tex math={String.raw`\hat\sigma_0^2`} /> be the variance estimate when the mean is fixed
					at <Tex math={String.raw`\mu_0`} />. In this model,
					<Tex math={String.raw`\hat\sigma_0^2 = \hat\sigma^2 + (\hat\mu - \mu_0)^2`} />. The three
					test statistics are shown below with their large-sample null distributions:
				</p>
				<Tex display math={tex.lr} />
				<Tex display math={tex.wald} />
				<Tex display math={tex.score} />
				<p>
					The tests are asymptotically equivalent but can differ in small samples. The figure's
					geometric interpretation follows Buse (1982).
				</p>
				<p>
					For the normal model all three are functions of the one-sample <em>t</em> statistic. With
				</p>
				<Tex display math={tex.t} />
				<p>they are</p>
				<Tex display math={tex.viaT} />
				<p>
					Since <Tex math={String.raw`x / (1 + x) \le \ln(1 + x) \le x`} />, the statistics always
					satisfy <Tex math={String.raw`Z^2 \ge \text{LR} \ge S`} />. Their approximate
					<em>p</em>-values therefore have the reverse order.
				</p>
				<p>
					Each statistic is a monotone function of <Tex math={String.raw`T^2`} />, and <Tex
						math="T"
					/> follows a
					<Tex math={String.raw`t_{n-1}`} /> distribution exactly under the null. If we used each statistic's
					exact null distribution, all three tests would give the same
					<em>p</em>-value as the two-sided <em>t</em>-test. The differences here come from using
					the large-sample <Tex math={String.raw`\chi^2_1`} /> approximation for LR,
					<Tex math={String.raw`Z^2`} />, and S.
				</p>
				<h3>The profile likelihood interval</h3>
				<p>
					Inverting the likelihood ratio test gives the interval of means whose profile
					log-likelihood stays within <Tex math={String.raw`\chi^2_1(0.95)/2`} /> of the maximum:
				</p>
				<Tex display math={tex.li} />
				<p>
					Applying the same cutoff to the quadratic approximation gives the Wald interval: a
					distance of 1.96 standard errors corresponds to a drop of <Tex
						math={String.raw`1.96^2/2 \approx 1.92`}
					/>. For this model, the profile likelihood interval has the closed form
				</p>
				<Tex display math={tex.profile} />
				<h3>The optimizers</h3>
				<p>Gradient ascent updates each parameter proportionally to its score,</p>
				<Tex display math={tex.ga} />
				<p>
					where <Tex math={String.raw`\gamma`} /> is the step size (0.05 by default). The app runs this
					calculation on standardized data, then converts back to the original units for plotting. A small
					step size slows convergence; a large one can overshoot the maximum.
				</p>
				<p>
					Fisher scoring is a variant of Newton-Raphson that uses expected information rather than
					observed information. It scales the score by the inverse information:
				</p>
				<Tex display math={tex.nr} />
				<p>
					For this normal model, the first step puts the mean at <Tex math={String.raw`\hat\mu`} />
					but updates the variance using the previous mean. The second step gives
					<Tex math={String.raw`\hat\sigma^2`} /> as well. The app stops a run if a step leaves the plotted
					range.
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
					<a class="url" href="https://doi.org/10.1080/00031305.1982.10482817"
						>https://doi.org/10.1080/00031305.1982.10482817</a
					>
				</p>
			</div>
		</details>
	</section>

	<MoreViz items={more} />
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
		text-decoration-color: var(--link-underline);
		text-decoration-thickness: var(--link-thickness);
		text-underline-offset: var(--link-offset);
		transition:
			text-decoration-color 0.15s,
			color 0.15s;
	}
	/* A bare URL has no spaces to wrap at; let it break anywhere. */
	.faq .answer .url {
		overflow-wrap: anywhere;
	}
	.byline a:hover,
	.faq .answer a:hover {
		color: var(--accent);
		text-decoration-color: var(--accent);
	}
	.byline a {
		text-decoration-color: var(--link-underline-quiet);
		text-decoration-thickness: 1px;
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
	.share-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.75rem;
	}
</style>
