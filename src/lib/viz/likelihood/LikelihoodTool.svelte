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

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	// Hovered observation index, linking the sample plot and the breakdown.
	let highlight = $state<number | null>(null);
	const setHighlight = (i: number | null) => (highlight = i);

	const f1 = format('.1f');
	const f2n = format('.2n');
	const sampleLine = $derived(model.p.sample.map((y) => f1(y)).join(', '));

	const eqScoreAtNull = $derived(
		String.raw`U(\mu_0, \hat\sigma_0^2) = \frac{\partial}{\partial \mu_0}\ell(\mu_0, \hat\sigma_0^2) = ${f2n(model.scoreAtNull)}`
	);
	const eqInfoAtNull = $derived(String.raw`I(\mu_0, \hat\sigma_0^2) = ${f2n(model.infoAtNull)}`);
</script>

<div class="viz-tool">
	<section class="tool-section">
		<h2>Likelihood Calculation</h2>
		<p class="section-intro">
			We have a sample of 10 observations drawn from a normal distribution,
			<Tex math={String.raw`y \sim \mathcal N(\mu, \sigma^2)`} />:
		</p>
		<p class="sample-line">Y = [{sampleLine}]</p>
		<p class="section-intro">
			The log-likelihood sums each observation's contribution under the candidate parameters. Move
			the sliders and watch the fit — hover a point or a term to see them linked.
		</p>
	</section>

	<!-- Direct child of .viz-tool: a sticky element only sticks while its
	     parent is in view, and the bar must ride along through every section
	     below (old app's sticky slider block). -->
	<ControlBar {model} />

	<section class="tool-section calc-section">
		<div class="calc-grid">
			<SamplePlot {model} {highlight} onhighlight={setHighlight} />
			<CalcLogLik {model} {highlight} onhighlight={setHighlight} />
		</div>
		<EstimateReadout {model} />
	</section>

	<section class="tool-section">
		<h2>Finding the Maximum Likelihood Estimates</h2>
		<p class="section-intro">
			The maximum likelihood estimates are the parameter values that maximize the log-likelihood.
			Drag the points on the curves — the tangent line shows the derivative (the <em>score</em>),
			which is zero at the maximum. The contour plot shows both parameters at once; an optimizer
			climbs it step by step.
		</p>

		<div class="mle-grid">
			<div class="mle-left">
				<LogLikPlotMu {model} />
				<JointLogLik {model} />
			</div>
			<div class="mle-right">
				<OptimizerControls {model} />
				<LogLikPlotSigma {model} />
			</div>
		</div>
		<p class="drag-tip">Tip: drag the points on the plots.</p>
	</section>

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
						No new data are drawn.
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
				<CurvaturePlot {model} />
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
			</div>
			<div class="inference-right">
				<TestTabs {model} />
			</div>
		</div>
	</section>
</div>

<style>
	.viz-tool {
		--accent: var(--viz-accent);
	}
	.tool-section {
		margin-top: 1.5rem;
	}
	.calc-section {
		margin-top: 0;
	}
	.tool-section h2 {
		margin-bottom: 0.5rem;
	}
	.section-intro {
		max-width: 700px;
		line-height: 1.6;
	}
	.sample-line {
		font-family: var(--font-mono);
		font-size: 0.88rem;
		color: var(--heading);
		overflow-x: auto;
	}
	.calc-grid {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 1.25rem;
		align-items: center;
	}
	.mle-grid {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 1.25rem 2rem;
		align-items: start;
		margin-top: 0.75rem;
	}
	.mle-left,
	.mle-right {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
	}
	.drag-tip {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
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
		.mle-grid,
		.inference-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
