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
	import CurvaturePlot from './CurvaturePlot.svelte';
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
		infView = 'curves';
	}
	// Key for the 3D inference view: only what the active test draws.
	let infEmphasis = $state<string[] | null>(null);
	// Each test opens with its own geometry picked out, like the 2D figure's
	// highlight: LR reads the null slice's peak against the profile wall; the
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
				{ id: 'profile', swatch: 'profile', tex: String.raw`\ell_p(\mu)`, text: 'on the wall' }
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
	let infView3d = $state<ViewpointId | null>('angled');
	let infHeadH = $state(0);
	// Full-window view per instrument (see ExpandButton).
	let fullMle = $state(false);
	let fullInf = $state(false);
	// The inference figure opens on the surface, continuing the MLE view; 2D
	// flattens it onto shared axes so the tests' readings can be compared.
	let infView = $state<'curves' | 'surface'>('surface');
	// 95% intervals at the slider n, read out under either view.
	const li = $derived(profileIntervalMu(model.muHat, model.sigma2Hat, model.p.n));
	const wald = $derived(waldIntervalMu(model.muHat, model.sigma2Hat, model.p.n));
	const f2 = format('.2f');

	// Two formulas around a plain "versus" so a narrow screen can wrap between them.
</script>

<div class="viz-tool">
	<section class="tool-section">
		<h2>Likelihood Calculation</h2>
		<p class="section-intro">
			Before any calculation we need data: a sample of 10 observations, drawn from a normal
			distribution with unknown mean and variance. We also need to assume a model, and we'll go with
			the one we know generated the data,
			<Tex math={String.raw`y \sim \mathcal N(\mu, \sigma^2)`} />. The challenge is then to find the
			combination of <Tex math={String.raw`\mu`} /> and <Tex math={String.raw`\sigma^2`} />
			that makes these observations most likely under that model.
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
			<p class="hint">
				Move the sliders to change the candidate parameters; hover a point or a row to link them.
			</p>
			<p class="section-intro after">
				Because the observations are independent, their joint density is the product of the ten
				densities. The likelihood reads that product the other way round: the observations are fixed
				and the parameters vary. It does not integrate to 1 over the parameters, so it is not a
				probability distribution over <Tex math={String.raw`\mu`} /> and
				<Tex math={String.raw`\sigma^2`} />, and a likelihood value means nothing on its own; only
				ratios between values do. In practice we work with the log-likelihood, the sum in the table.
				A product of many small densities quickly shrinks toward zero, and a sum is much easier to
				differentiate, since its derivative is just the sum of the per-observation derivatives.
				Because the log is strictly increasing, the log-likelihood peaks at the same parameter
				values as the likelihood.
			</p>
			<p class="section-intro">
				The parameter values with the largest log-likelihood are the maximum likelihood estimates
				(MLEs). The table's last row shows that best attainable value, so you can see how far below
				it the current candidate falls.
			</p>
		</section>

		<section class="tool-section">
			<h2>Finding the Maximum Likelihood Estimates</h2>
			<p class="section-intro">
				Repeat the calculation above for every combination of <Tex math={String.raw`\mu`} /> and
				<Tex math={String.raw`\sigma^2`} /> and you get the surface below. Its height is the log-likelihood,
				drawn down to 50 below the peak, and the peak is the pair of MLEs. The teal curves are slices
				through the current point, each holding one parameter fixed. Their slopes at the point are the
				partial derivatives <Tex math={String.raw`\partial\ell/\partial\mu`} /> and
				<Tex math={String.raw`\partial\ell/\partial\sigma^2`} />, shown in the readout with the
				figure. Together they make up the gradient of the log-likelihood, which statisticians call
				the
				<em>score</em>. At the peak the surface is level, so both are zero. For this model calculus
				finds that point directly: set both to zero and solve. More complex models have no closed
				form, so we let an <em>optimization algorithm</em> climb the hill instead, and the dashed arrow
				shows where its next step would land.
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
			<p class="hint">
				Drag the ring on the surface's floor to move both parameters, or pick an algorithm and press
				play to watch the computer climb. With gradient ascent, try the step size: a tiny one
				crawls, a large one overshoots and bounces across the peak. Fisher scoring uses the
				curvature and needs just two steps here. The first puts <Tex math={String.raw`\mu`} /> exactly
				at the peak but sets <Tex math={String.raw`\sigma^2`} /> to the best value for the old
				<Tex math={String.raw`\mu`} />, and the second lands on the maximum.
			</p>
			<p class="section-intro after">
				The amber curves on the back walls are <em>profile likelihoods</em>, explained under
				Inference below; their peaks mark the two estimates. The dashed guides carry the current
				point's height across to each wall, and the dashed rise from there up to the curve is how
				much higher the log-likelihood would be at the best value of the other parameter. Move
				<Tex math={String.raw`\sigma^2`} /> and watch the gap on the <Tex math={String.raw`\mu`} /> wall
				close.
			</p>
		</section>
	</div>

	<section class="tool-section">
		<h2>Inference</h2>
		<p class="section-intro">
			After we've found the MLEs we usually want to make some inferences, so let's focus on three
			common hypothesis tests of the mean.
		</p>
		<p class="section-intro">
			The null hypothesis fixes the mean but says nothing about the variance. The likelihood ratio
			and score tests therefore give <Tex math={String.raw`\sigma^2`} /> its best value under the null,
			<Tex math={String.raw`\hat\sigma_0^2 = \hat\sigma^2 + (\hat\mu - \mu_0)^2`} />. Doing that for
			every <Tex math={String.raw`\mu`} /> and keeping the largest log-likelihood gives the
			<em>profile likelihood</em>
			<Tex math={String.raw`\ell_p(\mu)`} />; this is called profiling out <Tex
				math={String.raw`\sigma^2`}
			/>. In the figure below it is the amber curve on the back wall, the side view of the dotted
			ridge that traces the best variance for each mean. Drag
			<Tex math={String.raw`\mu_0`} /> and the null's best point slides along the ridge. Switch to 2D
			to set the profile against the teal slice at <Tex math={String.raw`\hat\sigma^2`} />, which
			treats the variance as known. The profile falls off more slowly, because a variance that is
			free to grow absorbs part of the misfit of a wrong mean. The Wald test reads the slice, and
			the likelihood ratio and score tests read the profile.
		</p>
		<p class="section-intro">
			The sample-size slider asks a what-if question. The estimates
			<Tex math={String.raw`\hat\mu`} /> and <Tex math={String.raw`\hat\sigma^2`} /> stay fixed at the
			values from the 10 observations above, and the figure and tests show how the same estimates would
			behave at sample size n; no new data are drawn. The <em>Fisher information</em> measures how
			sharply the log-likelihood bends at its maximum. Increase n and it grows, so the peak narrows
			around the MLE. In large samples the inverse of the information approximates the variance of
			the MLE (for
			<Tex math={String.raw`\hat\mu`} /> in this model it is exact), so a sharper peak means a more precise
			estimate. Increase n and the whole surface sharpens, in
			<Tex math={String.raw`\sigma^2`} /> as well as <Tex math={String.raw`\mu`} />; in 2D, the
			dashed curve keeps the profile at n = 10 for comparison.
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
					{#if show3d}
						<div class="view-toggle" role="group" aria-label="Inference figure view">
							<button
								class:on={infView === 'curves'}
								aria-pressed={infView === 'curves'}
								onclick={() => (infView = 'curves')}>2D</button
							>
							<button
								class:on={infView === 'surface'}
								aria-pressed={infView === 'surface'}
								onclick={() => (infView = 'surface')}>3D</button
							>
						</div>
					{/if}
					<ExpandButton bind:expanded={fullInf} label="inference figure" />
				</div>
			</div>
			<div class="inst-body inf-body">
				<div class="inf-figure">
					{#if infView === 'surface' && show3d}
						<ViewpointDock bind:view={infView3d} />
						<div class="inf-surface">
							<SurfaceLogLik
								{model}
								mode="inference"
								emphasis={infEmphasis}
								onunavailable={onGlFail}
								bind:view={infView3d}
							/>
						</div>
						<SurfaceKey items={infKey} focus={infFocus} onemphasis={(ids) => (infEmphasis = ids)} />
						{#if model.sigma2Null > SIGMA2_MAX}
							<p class="hint">
								At this <Tex math={String.raw`\mu_0`} /> the constrained variance estimate
								<Tex math={String.raw`\hat\sigma_0^2`} /> lies beyond the plotted range, so only its reading
								on the profile wall is shown.
							</p>
						{/if}
					{:else}
						<CurvaturePlot {model} />
					{/if}
					<p class="interval-readout" data-testid="intervals">
						95% intervals at n = {model.p.n}: profile likelihood [{f2(li[0])}, {f2(li[1])}]; Wald [{f2(
							wald[0]
						)}, {f2(wald[1])}]. Each holds the values of μ₀ that its test does not reject at .05.
					</p>
				</div>
				<TestTabs {model} />
			</div>
		</div>
		<p class="hint">
			Pick a test to highlight its geometry in the figure; in 3D, hover or tap a key entry to
			highlight a different element. The 2D view flattens the same geometry onto one set of axes,
			the profile against its quadratic approximation, so the tests' readings can be compared
			directly.
		</p>
		<p class="section-intro after">
			Inverting a test gives an interval: the 95% interval is the set of null values the test would
			not reject at the .05 level. The readout under the figure lists two of them, the profile
			likelihood interval (from the likelihood ratio test) and the Wald interval. Slide
			<Tex math={String.raw`\mu_0`} /> past either end of the profile likelihood interval and the likelihood
			ratio test's <em>p</em> drops below .05.
		</p>
		<p class="section-intro">
			All three <em>p</em>-values rest on large-sample approximations, which is why they disagree in
			small samples. For this model each statistic is a function of the one-sample <em>t</em>
			statistic (the formulas are in the FAQ), so they always rank the same way. The Wald test gives the
			smallest <em>p</em>, the score test the largest, and the <em>t</em>-test gives the exact
			answer that all three approximate. The likelihood tests are for models where no exact test
			exists.
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
		color: var(--muted);
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
	.view-toggle {
		display: inline-flex;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.view-toggle button {
		padding: 0.3rem 0.8rem;
		border: none;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.view-toggle button + button {
		border-left: 1px solid var(--rule);
	}
	.view-toggle button.on {
		background: var(--viz-accent);
		color: #fff;
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
