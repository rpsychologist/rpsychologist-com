<script lang="ts">
	// Assembles the likelihood tool: sticky parameter bar, then the three
	// teaching sections (likelihood calculation → finding the MLEs →
	// inference). The route page owns the prose around the tool; live values
	// (the sample line, readouts) live in here because they need the model.
	import Tex from '$lib/components/Tex.svelte';
	import ControlBar from './ControlBar.svelte';
	import SamplePlot from './SamplePlot.svelte';
	import CalcLogLik from './CalcLogLik.svelte';
	import LogLikPlotMu from './LogLikPlotMu.svelte';
	import LogLikPlotSigma from './LogLikPlotSigma.svelte';
	import JointLogLik from './JointLogLik.svelte';
	import SurfaceLogLik from './SurfaceLogLik.svelte';
	import SurfaceKey, { type KeyItem } from './SurfaceKey.svelte';
	import ExpandButton from './ExpandButton.svelte';
	import OptimizerControls from './OptimizerControls.svelte';
	import CurvaturePlot from './CurvaturePlot.svelte';
	import TestTabs from './TestTabs.svelte';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { MU_NULL_MAX, MU_NULL_MIN, N_MAX, N_MIN } from './likelihood.svelte';
	import type { LikelihoodState } from './likelihood.svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { SIGMA2_MAX } from './model';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	// Hovered observation index, linking the sample plot and the breakdown.
	let highlight = $state<number | null>(null);
	const setHighlight = (i: number | null) => (highlight = i);

	// 3D is offered unless motion is reduced or WebGL failed to start; either
	// way JointLogLik falls back to the contour.
	let glFailed = $state(false);
	const show3d = $derived(!prefersReducedMotion.current && !glFailed);
	function onGlFail() {
		glFailed = true;
		model.jointView = 'contour';
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
	// Full-window view per instrument (see ExpandButton).
	let fullMle = $state(false);
	let fullInf = $state(false);
	// The inference figure opens on the 2D curves; 3D is opt-in.
	let infView = $state<'curves' | 'surface'>('curves');

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
	<div class="param-scope">
		<ControlBar {model} />

		<section class="tool-section calc-section">
			<div class="calc-grid">
				<SamplePlot {model} {highlight} onhighlight={setHighlight} />
				<CalcLogLik {model} {highlight} onhighlight={setHighlight} />
			</div>
			<p class="hint">
				Move the sliders to change the candidate parameters; hover a point or a row to link them.
			</p>
			<p class="section-intro after">
				The combination of parameter values with the largest log-likelihood is the maximum
				likelihood estimates (MLEs). The table's last row shows that best attainable value, so you
				can see how far below it the current candidate falls.
			</p>
		</section>

		<section class="tool-section">
			<h2>Finding the Maximum Likelihood Estimates</h2>
			<p class="section-intro">
				Repeat the calculation above for a wide range of candidate values and you get the plots
				below: each slice holds one parameter fixed and varies the other, and both are
				cross-sections of the one surface over both parameters. The tangent line shows the
				<em>score</em> (<Tex math="U" />) — the derivative of the log-likelihood — which is zero at
				the peak, so the joint maximum sits where both slices crest at once. For this model,
				calculus finds it directly (set both scores to zero and solve); for more challenging models
				there is no closed form, so we let an <strong>optimization algorithm</strong> climb the hill instead.
			</p>

			<p class="section-intro">
				The width of the peak is the precision of the estimate: the shaded band on the
				<Tex math={String.raw`\ell(\mu)`} /> slice is the 95% likelihood interval for
				<Tex math={String.raw`\mu`} /> at the current <Tex math={String.raw`\sigma^2`} />.
			</p>

			<!-- One instrument, one frame: run controls and the view toggle in its
			     header; on wide screens the slices stack beside the joint view so the
			     cross-section relationship fits a single laptop viewport. -->
			<div class="instrument" class:expanded={fullMle}>
				<div class="inst-head">
					<OptimizerControls {model} />
					<div class="head-end">
						{#if show3d}
							<div class="view-toggle" role="group" aria-label="Joint log-likelihood view">
								<button
									class:on={model.jointView === 'contour'}
									aria-pressed={model.jointView === 'contour'}
									onclick={() => (model.jointView = 'contour')}>Contour</button
								>
								<button
									class:on={model.jointView === 'surface'}
									aria-pressed={model.jointView === 'surface'}
									onclick={() => (model.jointView = 'surface')}>3D surface</button
								>
							</div>
						{/if}
						<ExpandButton bind:expanded={fullMle} label="likelihood plots" />
					</div>
				</div>
				<div class="inst-body">
					<div class="slices">
						<LogLikPlotMu {model} />
						<LogLikPlotSigma {model} />
					</div>
					<JointLogLik {model} {show3d} {glFailed} onglfail={onGlFail} />
				</div>
			</div>
			<p class="hint">
				Drag the point on any plot (the surface's floor ring moves both parameters at once), or pick
				an algorithm and press play to watch the computer climb.
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

		<div class="instrument" class:expanded={fullInf}>
			<div class="inst-head inf-head">
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
						<div class="inf-surface">
							<SurfaceLogLik
								{model}
								mode="inference"
								emphasis={infEmphasis}
								onunavailable={onGlFail}
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
	.section-intro.after {
		margin-top: 1.5rem;
	}
	/* One hairline frame per instrument; the header row carries its controls. */
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
	.head-end {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
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
		.instrument.expanded .inst-body {
			grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
		}
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
	/* Mid widths: the two slices side by side as a matched pair, joint view
	   below; collapses to one column under 48rem. */
	.slices {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1.25rem 2rem;
		align-items: start;
		margin-bottom: 1.25rem;
	}
	/* Wide screens: slices stack in a left column beside the joint view, so
	   slices, surface, and the pinned bar share one viewport. */
	@media (min-width: 64rem) {
		.inst-body {
			display: grid;
			grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
			gap: 1rem 2rem;
			align-items: center;
		}
		.slices {
			grid-template-columns: minmax(0, 1fr);
			gap: 1rem;
			margin-bottom: 0;
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
		.calc-grid,
		.slices {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
