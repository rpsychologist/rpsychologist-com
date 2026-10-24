<script lang="ts">
	// Assembles the likelihood tool: sticky parameter bar, then the three
	// teaching sections (likelihood calculation → finding the MLEs →
	// inference). The route page owns the prose around the tool; live values
	// (the sample line, readouts) live in here because they need the model.
	import Tex from '$lib/components/Tex.svelte';
	import TexLive from '$lib/components/TexLive.svelte';
	import ControlBar from './ControlBar.svelte';
	import SamplePlot from './SamplePlot.svelte';
	import CalcLogLik from './CalcLogLik.svelte';
	import JointLogLik from './JointLogLik.svelte';
	import SurfaceLogLik from './SurfaceLogLik.svelte';
	import SurfaceKey, { type KeyItem } from './SurfaceKey.svelte';
	import ExpandButton from './ExpandButton.svelte';
	import ViewpointDock, { type ViewpointId } from './ViewpointDock.svelte';
	import OptimizerControls from './OptimizerControls.svelte';
	import TestTabs from './TestTabs.svelte';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { MU_NULL_MAX, MU_NULL_MIN, N_MAX, N_MIN } from './likelihood.svelte';
	import type { LikelihoodState } from './likelihood.svelte';
	import { format } from 'd3-format';
	import { SIGMA2_MAX, profileIntervalMu, waldIntervalMu } from './model';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	// Hovered observation index, linking the sample plot and the breakdown.
	let highlight = $state<number | null>(null);
	const setHighlight = (i: number | null) => (highlight = i);

	// The 3D surface is the joint view for everyone; the contour remains only
	// as the fallback when WebGL fails to start. (Reduced motion no longer
	// downgrades: the surface never moves on its own, and SurfaceLogLik makes
	// its own transitions instant then.)
	let glFailed = $state(false);
	const show3d = $derived(!glFailed);
	function onGlFail() {
		glFailed = true;
	}
	// Key for the 3D inference view: only what the active test draws.
	let infEmphasis = $state<string[] | null>(null);
	// Each test opens with its own geometry picked out:
	// LR reads the null slice's peak against the profile wall; the
	// score test reads the μ-slice at the null's best point, with the null
	// slice showing it is flat in σ² there; Wald, the μ-slice through the MLE
	// and its floor distance to the null line. LR and score also pick out the
	// ridge: the null's best point rides it (the prose points readers at it).
	const infFocus = $derived(
		model.p.test === 'LRT'
			? ['nullSlice', 'ridge', 'profile']
			: model.p.test === 'score'
				? ['muSlice', 'nullSlice', 'ridge']
				: ['muSlice', 'null']
	);
	const keyNull: KeyItem = { id: 'null', swatch: 'null-line', tex: String.raw`H_0\!: \mu = \mu_0` };
	const keyNullSlice: KeyItem = {
		id: 'nullSlice',
		swatch: 'null-slice',
		tex: String.raw`\ell(\mu_0, \sigma^2)`
	};
	const keyRidge: KeyItem = { id: 'ridge', swatch: 'ridge', text: 'ridge: best σ² for each μ' };
	const infKey = $derived.by((): KeyItem[] => {
		if (model.p.test === 'LRT')
			return [
				keyNull,
				keyNullSlice,
				keyRidge,
				{
					id: 'profile',
					swatch: 'profile',
					tex: String.raw`\ell_p(\mu)`,
					text: 'profile log-likelihood (back wall)'
				}
			];
		if (model.p.test === 'score')
			return [
				keyNull,
				keyNullSlice,
				{ id: 'muSlice', swatch: 'slice', tex: String.raw`\ell(\mu, \hat\sigma_0^2)` },
				keyRidge
			];
		return [
			keyNull,
			{
				id: 'muSlice',
				swatch: 'slice',
				tex: String.raw`\ell(\mu, \hat\sigma^2)`,
				text: 'through the MLE'
			}
		];
	});
	// The parameter bar's height: the MLE instrument's control row pins just
	// below it.
	let barH = $state(0);
	// Instrument header heights: floating figure controls (the 3D viewpoint
	// buttons) dock below whichever bars are pinned above them.
	let mleHeadH = $state(0);
	// The parameter bar repeated at the top of the MLE full view.
	let fullBarH = $state(0);
	// 3D viewpoints, one per surface (the dock buttons drive them).
	let mleView = $state<ViewpointId | null>('angled');
	let infView = $state<ViewpointId | null>('angled');
	let infHeadH = $state(0);
	// Full-window view per instrument (see ExpandButton).
	let fullMle = $state(false);
	let fullInf = $state(false);
	// 95% intervals at the slider n, read out under the figure.
	const li = $derived(profileIntervalMu(model.muHat, model.sigma2Hat, model.p.n));
	const wald = $derived(waldIntervalMu(model.muHat, model.sigma2Hat, model.p.n));
	const f2 = format('.2f');

	// Two formulas around a plain "versus" so a narrow screen can wrap between them.
</script>

<div class="viz-tool">
	<section class="tool-section">
		<h2>Likelihood Calculation</h2>
		<p class="section-intro">
			Before we can estimate anything, we need some data. Let's take 10 independent observations
			from a normal distribution and pretend we don't know its mean or variance. We'll fit the model <Tex
				math={String.raw`y \sim \mathcal N(\mu, \sigma^2)`}
			/>. Try moving the sliders to find a combination of <Tex math={String.raw`\mu`} /> and
			<Tex math={String.raw`\sigma^2`} /> that seems to fit the observations. The table scores your choice:
			it adds up how well the curve fits each observation, and the higher (less negative) the total, the
			better the fit.
		</p>
	</section>

	<!-- The parameter bar's sticky containing block: it rides through the two
	     sections whose plots respond to the candidate (μ, σ²), then releases —
	     the Inference section (outside this wrapper) reads only the fixed
	     estimates and its own sliders, so pinning the bar there is dead chrome. -->
	<div class="param-scope" style:--bar-h="{barH}px">
		<ControlBar {model} bind:height={barH} />

		<section class="tool-section calc-section">
			<div class="calc-grid">
				<SamplePlot {model} {highlight} onhighlight={setHighlight} />
				<CalcLogLik {model} {highlight} onhighlight={setHighlight} />
			</div>
			<p class="section-intro">
				We can calculate the likelihood for any combination you choose. Each observation has a
				density given by the height of the normal curve at that point, and because the observations
				are independent we can multiply these densities together. Notice that the data don't change
				when you move the sliders. We're comparing different parameter values for the same
				observations, not assigning probabilities to the parameters themselves.
			</p>
			<p class="section-intro">
				In practice, multiplying lots of small densities can give us very small numbers. It's
				usually more convenient to work with the <em>log-likelihood</em>, where we add the
				log-densities instead. We'll write it as <Tex math={String.raw`\ell(\mu, \sigma^2)`} />: for
				a given mean and variance, the sum of the log-densities
				<Tex math={String.raw`\ln f(y_i \mid \mu, \sigma^2)`} /> over the observations. That's the calculation
				in the table. The logarithm is increasing, so whichever parameter values give the largest likelihood
				also give the largest log-likelihood.
			</p>
			<p class="section-intro after">
				Those parameter values are our <em>maximum likelihood estimates</em> (MLEs). The last row of the
				table gives the answer, so you can compare it with the values you've chosen.
			</p>
		</section>

		<section class="tool-section">
			<h2>Finding the Maximum Likelihood Estimates</h2>
			<p class="section-intro">
				If we repeat the calculation for a range of means and variances, we get the hill below. The
				height is the log-likelihood, and the combination we're looking for is at the top.
			</p>
			<p class="section-intro">
				For our simple normal model, we can find the MLEs using calculus. We take the partial
				derivatives with respect to the mean and variance,
				<Tex math={String.raw`\partial\ell/\partial\mu`} /> and
				<Tex math={String.raw`\partial\ell/\partial\sigma^2`} />, which tell us the slope in each
				direction. Together these make up the gradient, also called the <em>score</em>. At the
				maximum both slopes are zero.
			</p>
			<p class="section-intro">
				We can also let the computer search for the maximum. This is more work than we need for this
				example, but for many models we can't solve the score equations directly. The algorithms
				below start from your chosen values and try to climb the hill. Take one step with the +1
				button and check the readout: <Tex math={String.raw`\ell`} /> should have gone up.
				<em>Gradient ascent</em> follows the slope uphill, and you choose how far it steps. Try a
				few step sizes: too small and it takes a long time to get anywhere; too large and it can
				jump past the peak. <em>Fisher scoring</em> uses the expected curvature as well, which helps it
				choose how far to step.
			</p>

			<!-- One instrument, one frame: run controls and the view toggle in its
			     header, the joint view (the surface; the contour only as fallback) as the body. -->
			<div
				class="instrument mle-inst"
				class:expanded={fullMle}
				style:--head-h="{mleHeadH}px"
				style:--full-bar-h="{fullBarH}px"
			>
				<!-- Full view covers the page's parameter bar, so it carries its own
				     copy (same model; ids suffixed). display: contents keeps the bar a
				     direct child of the scrolling instrument, so it still pins. -->
				{#if fullMle}
					<div class="full-bar">
						<ControlBar {model} idSuffix="-full" inFull bind:height={fullBarH} />
					</div>
				{/if}
				<div class="inst-head mle-head" bind:offsetHeight={mleHeadH}>
					<OptimizerControls {model} />
					<div class="head-end">
						<ExpandButton bind:expanded={fullMle} label="likelihood plots" />
					</div>
				</div>
				<div class="inst-body">
					{#if show3d}
						<ViewpointDock bind:view={mleView} />
					{/if}
					<JointLogLik {model} {show3d} {glFailed} onglfail={onGlFail} bind:view={mleView} />
				</div>
			</div>
			<p class="section-intro after">
				Try looking at the hill from one of the side views. Its outline matches the curve drawn on
				the back wall: for each value of one parameter, it keeps the highest log-likelihood we can
				get by varying the other. This is the <em>profile log-likelihood</em>. For the mean we write
				it <Tex math={String.raw`\ell_p(\mu)`} />, and we'll use it below to test hypotheses about
				the mean.
			</p>
		</section>
	</div>

	<section class="tool-section">
		<h2>Inference</h2>
		<p class="section-intro">
			Once we've estimated the mean, we usually want to say something about its uncertainty too.
			Let's test the hypothesis that the population mean equals some value
			<Tex math={String.raw`\mu_0`} />. There are several ways to do this; here we'll compare the
			likelihood ratio, Wald, and score tests.
		</p>
		<p class="section-intro">
			We still have to deal with the variance. Our null hypothesis specifies the mean, but it
			doesn't tell us what the variance should be. For the likelihood ratio and score tests, we
			therefore estimate it again, this time with the mean fixed at
			<Tex math={String.raw`\mu_0`} />. We call this estimate
			<Tex math={String.raw`\hat\sigma_0^2`} />. Repeat it for every possible mean and we get the
			profile log-likelihood <Tex math={String.raw`\ell_p(\mu)`} /> from the previous section. You may
			see this described as <em>profiling out</em> the variance. In the figure, the point labeled
			<em>best under <Tex math="H_0" /></em> is the fit under the null. Move <Tex
				math={String.raw`\mu_0`}
			/> and it slides along the dotted ridge, the best variance for each mean, whose shadow on the back
			wall is <Tex math={String.raw`\ell_p(\mu)`} />.
		</p>
		<p class="section-intro">
			Away from the estimated mean, allowing the variance to change gives a better fit than keeping
			it fixed at <Tex math={String.raw`\hat\sigma^2`} />. The Wald test uses a quadratic
			approximation to the profile, which agrees near the maximum but falls faster farther away.
		</p>
		<p class="section-intro">
			I've also included a sample-size slider so you can see how much the tests depend on
			<Tex math="n" />. This doesn't generate any new observations. It shows what would happen at a
			different sample size if we got exactly the same estimates of the mean and variance.
		</p>

		<div class="instrument inf-inst" class:expanded={fullInf} style:--head-h="{infHeadH}px">
			<div class="inst-head inf-head" bind:offsetHeight={infHeadH}>
				<div class="inf-control">
					<Slider
						id="likelihood-munull"
						label="Null hypothesis (μ₀)"
						min={MU_NULL_MIN}
						max={MU_NULL_MAX}
						step={1}
						bind:value={model.p.muNull}
						oninput={() => model.setMuNull(model.p.muNull)}
					/>
					<p class="hypo">
						<TexLive math={String.raw`H_0: \mu = #0`} values={[String(model.p.muNull)]} />
						&ensp;versus&ensp;
						<TexLive math={String.raw`H_1: \mu \ne #0`} values={[String(model.p.muNull)]} />
					</p>
				</div>
				<div class="inf-control">
					<Slider
						id="likelihood-n"
						label="What if the sample size were…"
						min={N_MIN}
						max={N_MAX}
						step={1}
						bind:value={model.p.n}
						oninput={() => model.setN(model.p.n)}
					/>
				</div>
				<div class="head-end">
					<ExpandButton bind:expanded={fullInf} label="inference figure" />
				</div>
			</div>
			<div class="inst-body inf-body">
				<div class="inf-figure">
					{#if show3d}
						<ViewpointDock bind:view={infView} />
						<div class="inf-surface">
							<SurfaceLogLik
								{model}
								mode="inference"
								emphasis={infEmphasis}
								onunavailable={onGlFail}
								bind:view={infView}
							/>
						</div>
						<SurfaceKey items={infKey} focus={infFocus} onemphasis={(ids) => (infEmphasis = ids)} />
						{#if model.sigma2Null > SIGMA2_MAX}
							<p class="hint">
								At this <Tex math={String.raw`\mu_0`} />, the variance estimate under the null,
								<Tex math={String.raw`\hat\sigma_0^2`} />, is outside the plotted range. Its
								log-likelihood is still shown on the profile curve on the back wall.
							</p>
						{/if}
					{:else}
						<p class="hint" role="status">
							The inference figure requires WebGL2, which isn't available in this browser. The test
							results and intervals are still available.
						</p>
					{/if}
					<p class="interval-readout" data-testid="intervals">
						95% intervals at <em>n</em> = {model.p.n}: profile likelihood [{f2(li[0])}, {f2(
							li[1]
						)}]; Wald [{f2(wald[0])}, {f2(wald[1])}]
					</p>
				</div>
				<TestTabs {model} />
			</div>
		</div>
		<p class="section-intro after">
			Increasing the sample size makes the peak narrower. The estimated mean hasn't moved, but
			values around it now fit considerably worse. For the mean in this model, the curvature at the
			peak is <Tex math={String.raw`n/\hat\sigma^2`} />, the estimated
			<em>Fisher information</em>. Taking its inverse gives
			<Tex math={String.raw`\hat\sigma^2/n`} />, our estimate of the variance of the sample mean. So
			the narrower peak corresponds to a smaller standard error.
		</p>
		<p class="section-intro">
			With only 10 observations, the tests can give rather different answers, because each relies on
			a large-sample approximation, and so do the intervals. In this normal model the Wald test
			gives the smallest <em>p</em>-value and the score test the largest, with the likelihood ratio
			test in between. For this model we don't actually need any of them: the one-sample
			<em>t</em>-test is exact.
		</p>
		<p class="section-intro">
			The reason to work through the likelihood-based tests anyway is that none of the steps
			depended on the normal model. Whatever the model, we write down its log-likelihood, climb to
			the peak, and read the tests off the same three features: the drop from the peak to the best
			fit under the null, the distance to the null measured against the curvature at the peak, and
			the slope at the null. The same steps work for logistic regression, mixed models, or
			structural equation models, where exact tests usually don't exist. There the surface has more
			dimensions than we can draw, and more nuisance parameters to profile out, but we handle them
			just as we handled the variance here.
		</p>
	</section>
</div>

<style>
	.viz-tool {
		--accent: var(--viz-accent);
	}
	/* The three sections are the page's movements (calculate → maximize →
	   infer); generous separation chunks them into chapters. */
	.tool-section {
		margin-top: 3.5rem;
	}
	.calc-section {
		margin-top: 0;
	}
	.tool-section h2 {
		margin-bottom: 0.5rem;
	}
	/* One spine: tool prose sits on the same centered 700px column as the
	   route's hero/intro/FAQ, so only the instruments break out to full
	   width — symmetrically. */
	.tool-section h2,
	.section-intro {
		max-width: 700px;
		margin-inline: auto;
	}
	.section-intro {
		line-height: 1.6;
	}
	/* Interaction how-tos live as muted captions beside their controls;
	   concepts stay in the narrative spine. */
	.hint {
		margin: 0.6rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.5;
	}
	.calc-grid {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 1.25rem 2.5rem;
		align-items: start;
	}
	.section-intro.after {
		margin-top: 1.5rem;
	}
	.interval-readout {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}
	/* One hairline frame per instrument; the header row carries its controls. */
	/* --sticky-top: how far down the viewport the pinned bars above a figure
	   reach, for the viewpoint dock that floats under them. In flow: the
	   parameter bar plus the MLE run controls; full view: the instrument's
	   own header. Desktop only, where the headers pin (ViewpointDock). */
	@media (min-width: 48rem) {
		.mle-inst {
			--sticky-top: calc(var(--bar-h, 0px) + var(--head-h, 0px));
		}
		.inf-inst,
		.instrument.expanded {
			--sticky-top: var(--head-h, 0px);
		}
		.instrument.mle-inst.expanded {
			--sticky-top: calc(var(--full-bar-h, 0px) + var(--head-h, 0px));
			--chrome: calc(5.5rem + var(--full-bar-h, 0px));
		}
		.instrument.expanded .inst-head.mle-head {
			top: var(--full-bar-h, 0px);
		}
	}
	.full-bar {
		display: contents;
	}
	.instrument {
		margin-top: 1.25rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	.inst-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem 1.5rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--rule);
	}
	.inst-body {
		padding: 1rem;
	}
	/* Instrument headers ride along while the panel is on screen (the
	   instrument is the containing block, so they release with it): the run
	   controls under the parameter bar, the inference sliders at the top. Not
	   on phones: they wrap too tall to pin. Opaque like the parameter bar. */
	@media (min-width: 48rem) {
		.mle-head,
		.inf-head {
			position: sticky;
			top: var(--bar-h, 0px);
			z-index: 39;
			background: var(--bg);
			border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		}
	}
	.head-end {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}
	/* Phones: instruments run edge to edge like the parameter bar — a framed
	   card inside the page margin only spent width on double padding. Header
	   and body share one inset so the controls and the viewpoint dock align. */
	@media (max-width: 48rem) {
		.instrument {
			margin-inline: calc(50% - 50vw);
			border-left: none;
			border-right: none;
			border-radius: 0;
		}
		.inst-head,
		.inst-body {
			padding-inline: 0.9rem;
		}
	}
	/* Phones: the MLE header's full-view button joins the algorithm row (top
	   right) instead of taking a row of its own. */
	@media (max-width: 48rem) {
		.mle-head {
			position: relative;
		}
		.mle-head .head-end {
			position: absolute;
			top: 0.6rem;
			right: 0.9rem;
		}
	}
	/* Full view: the same frame pinned over the window, so nothing re-mounts
	   (WebGL state and rotation survive). Only the header sits above the
	   figure now, which --chrome hands to the joint view's width cap. */
	.instrument.expanded {
		position: fixed;
		inset: 0;
		z-index: 100;
		margin: 0;
		border: none;
		border-radius: 0;
		background: var(--bg);
		overflow: auto;
		--chrome: 5.5rem;
	}
	/* Header pinned only where it is one row; on phones it wraps tall enough
	   to crowd the figure, so it scrolls away with the content there. */
	@media (min-width: 48rem) {
		.instrument.expanded .inst-head {
			position: sticky;
			top: 0;
			z-index: 1;
			background: var(--bg);
		}
	}
	@media (min-width: 64rem) {
		.instrument.expanded .inf-body {
			grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
		}
	}
	/* Cap the inference surface so the whole hill fits the window. */
	.instrument.expanded .inf-surface {
		max-width: calc((100vh - 9rem) / 0.75);
		margin-inline: auto;
	}
	/* The one two-column instrument (figure beside the test tabs) breaks out
	   past the page's 1232px frame on wide screens. 100vw counts a classic
	   scrollbar, hence the 4rem gutter rather than the page's 2.5rem. */
	@media (min-width: 48rem) {
		.inf-inst:not(.expanded) {
			--inf-w: max(100%, min(1440px, 100vw - 4rem));
			box-sizing: border-box;
			width: var(--inf-w);
			margin-inline: calc((100% - var(--inf-w)) / 2);
		}
	}
	.inf-head {
		align-items: flex-start;
	}
	.inf-control {
		flex: 1 1 16rem;
		min-width: 0;
	}
	.hypo {
		margin: 0.3rem 0 0;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.inf-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem 2rem;
		align-items: start;
	}
	@media (min-width: 48rem) {
		.inf-body {
			grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		}
	}
	.inf-figure {
		min-width: 0;
	}
	@media (max-width: 48rem) {
		.calc-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
