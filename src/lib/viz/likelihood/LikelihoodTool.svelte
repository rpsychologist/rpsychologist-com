<script lang="ts">
	// Assembles the likelihood tool: sticky parameter bar, then the three
	// teaching sections (likelihood calculation → finding the MLEs →
	// inference). The route page owns the prose around the tool; live values
	// (the sample line, readouts) live in here because they need the model.
	import Tex from '$lib/components/Tex.svelte';
	import ControlBar from './ControlBar.svelte';
	import SamplePlot from './SamplePlot.svelte';
	import CalcLogLik from './CalcLogLik.svelte';
	import LikelihoodCurve from './LikelihoodCurve.svelte';
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
	import { SIGMA2_MAX, likelihoodAreaMu } from './model';
	import { sciTex } from './sci';

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
	// score test reads the μ-slice at the null's best point; Wald, the μ-slice
	// through the MLE and its floor distance to the null line.
	const infFocus = $derived(
		model.p.test === 'LRT'
			? ['nullSlice', 'profile']
			: model.p.test === 'score'
				? ['muSlice']
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
	// The inference figure opens on the 2D curves; 3D is opt-in.
	let infView = $state<'curves' | 'surface'>('curves');

	// Live area for the "not a probability" prose.
	const areaL = $derived(likelihoodAreaMu(model.p.sample, model.p.sigma2));

	const eqHypo = $derived(
		String.raw`H_0: \mu = ${model.p.muNull} \quad \text{versus} \quad H_1: \mu \ne ${model.p.muNull}`
	);
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
				Move the sliders to change the candidate parameters; hover a point or a row to link them, or
				drag a point to change the data.
			</p>
			<p class="section-intro after">
				The combination of parameter values with the largest log-likelihood is the maximum
				likelihood estimates (MLEs). The table's last row shows that best attainable value, so you
				can see how far below it the current candidate falls.
			</p>
		</section>

		<section class="tool-section">
			<h2>Likelihood Is Not a Probability</h2>
			<p class="section-intro">
				The ledger read the normal density as a function of the data, for fixed
				<Tex math={String.raw`\mu`} /> and <Tex math={String.raw`\sigma^2`} />. The likelihood reads
				the same formula the other way round: the ten observations are fixed and
				<Tex math={String.raw`\mu`} /> varies. Below is <Tex math={String.raw`L(\mu)`} />, the
				product of the ten densities, at the current <Tex math={String.raw`\sigma^2`} />. Its area
				is
				<Tex math={sciTex(areaL)} />, not 1, so it is not a probability distribution over
				<Tex math={String.raw`\mu`} />.
			</p>
			<div class="figure">
				<LikelihoodCurve {model} />
			</div>
			<p class="section-intro">
				A likelihood value therefore means nothing on its own; only comparisons do. Pin a candidate
				as A and move the sliders to see how many times more likely the data are under one than the
				other. Products of small densities shrink toward zero with every observation, which is why
				we work with their logs, the sum in the ledger.
			</p>
		</section>

		<section class="tool-section">
			<h2>Finding the Maximum Likelihood Estimates</h2>
			<p class="section-intro">
				Repeat the calculation above for every combination of <Tex math={String.raw`\mu`} /> and
				<Tex math={String.raw`\sigma^2`} /> and you get the surface below: its height is the log-likelihood,
				and its peak is the pair of MLEs. The teal curves are slices through the current point, each holding
				one parameter fixed; the side views look straight along an axis. At the peak the surface is level,
				so both slopes, the <em>scores</em> shown beneath it, are zero. For this model calculus
				finds that point directly (set both scores to zero and solve); for more challenging models
				there is no closed form, so we let an
				<strong>optimization algorithm</strong> climb the hill instead. The dashed arrow shows where its
				next step would land.
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
				curvature and needs just two steps here: the first puts <Tex math={String.raw`\mu`} /> exactly
				at the peak but sets <Tex math={String.raw`\sigma^2`} /> for the old <Tex
					math={String.raw`\mu`}
				/>, up on the ridge; the second lands on the maximum.
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
			The sample-size slider asks a what-if question. The estimates
			<Tex math={String.raw`\hat\mu`} /> and <Tex math={String.raw`\hat\sigma^2`} /> stay fixed at the
			values from the 10 observations above, and the figure and tests show how the same estimates would
			behave at sample size n; no new data are drawn. Increase n and the peak narrows around the MLE as
			the <em>Fisher information</em>, the curvature of the log-likelihood, grows. The inverse of
			the information is the variance of the MLE, so a sharper peak means a more precise estimate.
			Switch the figure to 3D to watch the whole surface sharpen, in
			<Tex math={String.raw`\sigma^2`} /> as well as <Tex math={String.raw`\mu`} />.
		</p>

		<div class="instrument" class:expanded={fullInf} style:--head-h="{infHeadH}px">
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
					<p class="hypo"><Tex math={eqHypo} /></p>
				</div>
				<div class="inf-control">
					<Slider
						id="likelihood-n"
						label="Sample size, what if n were…"
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
				</div>
				<TestTabs {model} />
			</div>
		</div>
		<p class="hint">
			Pick a test to highlight its geometry in the figure. In 3D, each test opens with its own
			elements picked out; hover or tap a key entry to change what stands out.
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
	/* A single-chart figure stays on the spine; only instruments break out. */
	.figure {
		max-width: 700px;
		margin: 1.25rem auto 1.5rem;
	}
	.section-intro.after {
		margin-top: 1.5rem;
	}
	/* One hairline frame per instrument; the header row carries its controls. */
	/* --sticky-top: how far down the viewport the pinned bars above a figure
	   reach, for figure controls that float under them (SurfaceLogLik). In
	   flow: the parameter bar, plus the MLE run controls where those pin.
	   Full view: only the instrument's own header (pinned at ≥48rem). */
	.instrument {
		--sticky-top: 0px;
	}
	.mle-inst {
		--sticky-top: var(--bar-h, 0px);
	}
	.instrument.expanded {
		--sticky-top: 0px;
	}
	@media (min-width: 48rem) {
		.mle-inst {
			--sticky-top: calc(var(--bar-h, 0px) + var(--head-h, 0px));
		}
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
	/* Phones: the run controls scroll away in full view, so only the (compact)
	   parameter bar is pinned above the figure. */
	@media (max-width: 47.99rem) {
		.instrument.mle-inst.expanded {
			--sticky-top: var(--full-bar-h, 0px);
		}
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
	/* The run controls ride under the pinned parameter bar while the panel is
	   on screen (the instrument is the containing block, so they release with
	   it). Not on phones: the two bars together would cover too much. Opaque
	   for the same reason as the parameter bar. */
	@media (min-width: 48rem) {
		.mle-head {
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
