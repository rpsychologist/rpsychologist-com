<script lang="ts">
	// Assembles the likelihood tool: sticky parameter bar, then the three
	// teaching sections (likelihood calculation → finding the MLEs →
	// inference). The route page owns the prose around the tool; live values
	// (the sample line, readouts) live in here because they need the model.
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import ControlBar from './ControlBar.svelte';
	import EstimateReadout from './EstimateReadout.svelte';
	import SamplePlot from './SamplePlot.svelte';
	import CalcLogLik from './CalcLogLik.svelte';
	import LogLikPlotMu from './LogLikPlotMu.svelte';
	import LogLikPlotSigma from './LogLikPlotSigma.svelte';
	import JointLogLik from './JointLogLik.svelte';
	import OptimizerControls from './OptimizerControls.svelte';
	import CurvaturePlot from './CurvaturePlot.svelte';
	import TestTabs from './TestTabs.svelte';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { MU_NULL_MAX, MU_NULL_MIN, N_MAX, N_MIN } from './likelihood.svelte';
	import type { LikelihoodState } from './likelihood.svelte';
	import { likelihoodIntervalMu } from './model';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	// Hovered observation index, linking the sample plot and the breakdown.
	let highlight = $state<number | null>(null);
	const setHighlight = (i: number | null) => (highlight = i);

	const f1 = format('.1f');
	const f2 = format('.2f');
	const f2n = format('.2n');
	const sampleLine = $derived(model.p.sample.map((y) => f1(y)).join(', '));

	// Likelihood interval for μ at the current σ² — shown as a full-width line
	// under the slices pair (it tracks the ℓ(μ) slice's shaded band). Peak width
	// = estimate precision, the intuition the Inference section formalizes.
	const li = $derived(likelihoodIntervalMu(model.muHat, model.p.sigma2, model.p.sample.length));

	const eqHypo = $derived(
		String.raw`H_0: \mu = ${model.p.muNull} \quad \text{versus} \quad H_1: \mu \ne ${model.p.muNull}`
	);
	const eqScoreAtNull = $derived(
		String.raw`U(\mu_0, \hat\sigma_0^2) = \frac{\partial}{\partial \mu_0}\ell(\mu_0, \hat\sigma_0^2) = ${f2n(model.scoreAtNull)}`
	);
	const eqInfoAtNull = $derived(String.raw`I(\mu_0, \hat\sigma_0^2) = ${f2n(model.infoAtNull)}`);
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
				<!-- Data with its plot; calculation with its result — each cell pairs
				     a view with the numbers it produces. -->
				<div class="calc-cell">
					<SamplePlot {model} {highlight} onhighlight={setHighlight} />
					<p class="sample-line">Y = [{sampleLine}]</p>
				</div>
				<div class="calc-cell">
					<p class="calc-note">
						Each observation contributes its density under the candidate parameters — the height of
						the curve at that point. Multiplying the ten densities gives the joint likelihood; in
						practice we sum their logs instead, the <em>log-likelihood</em>:
					</p>
					<CalcLogLik {model} {highlight} onhighlight={setHighlight} />
					<p class="calc-note">
						The combination of parameter values with the largest log-likelihood is the maximum
						likelihood estimates (MLEs) — the readout compares the best attainable
						<Tex math={String.raw`\ell(\hat\mu, \hat\sigma^2)`} /> with the current candidate's.
					</p>
					<EstimateReadout {model} />
				</div>
			</div>
			<p class="hint">
				Move the sliders to change the candidate parameters — hover an observation or a term to see
				them linked.
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

			<!-- In flow above the instrument: on wide screens the bar and all three
		     plots share the viewport, so it no longer needs to be sticky. -->
			<div class="optimizer-bar">
				<OptimizerControls {model} />
			</div>
			<p class="hint">
				Drag the point on any plot (the surface's floor ring moves both parameters at once), or pick
				an algorithm and press play to watch the computer climb.
			</p>

			<!-- One instrument: on wide screens the two slices stack beside the joint
		     view so the cross-section relationship is visible in a single viewport
		     (a 15" laptop fits all three plots plus the pinned bars). Narrower
		     screens fall back to the staged column. -->
			<div class="instrument">
				<div class="slices">
					<LogLikPlotMu {model} />
					<LogLikPlotSigma {model} />
					<p class="ci-readout">
						The width of the peak is the precision of the estimate: the 95% likelihood interval for
						<Tex math={String.raw`\mu`} /> at the current
						<Tex math={String.raw`\sigma^2`} /> is
						<span class="interval">[{f2(li[0])}, {f2(li[1])}]</span>.
					</p>
				</div>
				<JointLogLik {model} />
			</div>
		</section>
	</div>

	<section class="tool-section">
		<h2>Inference</h2>
		<p class="section-intro">
			After we've found the MLEs we usually want to make some inferences, so let's focus on three
			common hypothesis tests. Use the sliders to change the null hypothesis and the hypothetical
			sample size.
		</p>

		<div class="inference-grid">
			<div class="inference-left">
				<div class="inference-sliders">
					<Slider
						id="likelihood-n"
						label="Sample size — what if n were…"
						min={N_MIN}
						max={N_MAX}
						step={1}
						bind:value={model.p.n}
						oninput={() => model.setN(model.p.n)}
					/>
					<p class="slider-help">
						The estimates <Tex math={String.raw`\hat\mu`} /> and
						<Tex math={String.raw`\hat\sigma^2`} /> stay fixed at the values from the 10 observations
						above; the curve and the tests show how the same estimates would behave at sample size n.
						No new data are drawn. Try increasing n: the peak narrows around the MLE and the
						<em>Fisher information</em> — the curvature of the log-likelihood — grows. The inverse of
						the information is the variance of the MLE, so a sharper peak means a more precise estimate.
					</p>
					<Slider
						id="likelihood-munull"
						label="Null hypothesis (μ₀)"
						min={MU_NULL_MIN}
						max={MU_NULL_MAX}
						step={1}
						bind:value={model.p.muNull}
						oninput={() => model.setMuNull(model.p.muNull)}
					/>
				</div>
				<!-- Directly under the μ₀ slider that sets it, heading the curvature
				     plot that draws it (moved out of TestTabs, where it sat detached
				     from its control). -->
				<p class="hypo"><Tex display math={eqHypo} /></p>
				<CurvaturePlot {model} />
			</div>
			<div class="inference-right">
				<TestTabs {model} />
				<!-- The score test's ingredients, so it lives with the tests (and
				     balances the columns' heights). -->
				<details class="score-details">
					<summary>Score and Fisher information at the null</summary>
					<div class="score-panel" data-testid="score-info">
						<p>
							The <em>score function</em> is the first derivative of the log-likelihood — how fast ℓ changes
							at the null:
						</p>
						<Tex display math={eqScoreAtNull} />
						<p>
							The <em>Fisher information</em> is the negative expected second derivative — the curvature
							at the null:
						</p>
						<Tex display math={eqInfoAtNull} />
					</div>
				</details>
			</div>
		</div>
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
	.sample-line {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: var(--muted);
		overflow-x: auto;
	}
	.calc-grid {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 1.25rem;
		align-items: center;
	}
	.calc-cell {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 0;
	}
	/* Guided derivation around the equation (restores the old app's prose
	   pairing: sentence → sum → punchline). */
	.calc-note {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.55;
	}
	/* Optimizer run controls: a plain bordered row above the instrument. */
	.optimizer-bar {
		margin-top: 0.75rem;
		padding: 0.55rem 0.9rem;
		background: var(--bg);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	.instrument {
		margin-top: 0.75rem;
	}
	/* Mid widths: the two slices side by side as a matched pair, joint view
	   below; collapses to one column under 48rem. */
	.slices {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1.25rem 2rem;
		align-items: start;
	}
	.slices .ci-readout {
		grid-column: 1 / -1;
	}
	/* Wide screens: slices stack in a left column beside the joint view, so
	   slice, surface, and the pinned controls share one viewport. */
	@media (min-width: 64rem) {
		.instrument {
			display: grid;
			grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
			gap: 1rem 2rem;
			align-items: start;
		}
		.slices {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.75rem;
		}
	}
	.ci-readout {
		margin: 0.6rem 0 0;
		max-width: 700px;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.ci-readout .interval {
		white-space: nowrap;
	}
	.score-details summary {
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--heading);
	}
	.hypo {
		margin: 0;
	}
	.inference-grid {
		display: grid;
		grid-template-columns: minmax(0, 6fr) minmax(0, 6fr);
		gap: 1.25rem 2rem;
		align-items: start;
		margin-top: 0.75rem;
	}
	.inference-left,
	.inference-right {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}
	.inference-sliders {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		max-width: 32rem;
	}
	.slider-help {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.5;
	}
	.score-panel {
		font-size: 0.92rem;
		line-height: 1.55;
	}
	.score-panel p {
		margin: 0.3rem 0;
	}
	@media (max-width: 48rem) {
		.calc-grid,
		.slices,
		.inference-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
