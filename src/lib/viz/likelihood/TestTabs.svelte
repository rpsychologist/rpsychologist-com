<script lang="ts">
	// The three large-sample tests with live values in their formulas (old
	// TestTabs.js). Panels stay mounted and toggle with `hidden` so switching
	// tabs never recreates DOM; selecting a tab also drives the curvature
	// plot's geometry highlight via model.p.test.
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import type { LikelihoodState, TestKind } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const f3 = format('.3f');
	// APA style: no leading zero, and p < .001 rather than a rounded 0.
	const fmtP = (p: number) => (p < 0.001 ? '< .001' : `= ${f3(p).replace(/^0/, '')}`);
	const f3n = format('.3n');
	const f2n = format('.2n');

	const tabs: { id: TestKind; label: string }[] = [
		{ id: 'LRT', label: 'Likelihood ratio' },
		{ id: 'wald', label: 'Wald' },
		{ id: 'score', label: 'Score' }
	];

	const eqLR = $derived(
		String.raw`\begin{aligned}
		\text{LR} &= -2[\ell(\mu_{0}, \hat\sigma^2_{0}) - \ell(\hat\mu, \hat\sigma^2)]\\
		&= ${f3n(model.tests.lr.stat)}
		\end{aligned}`
	);
	const eqSE = String.raw`\text{se}(\hat\mu) = I(\hat\mu, \hat\sigma^2)^{-1/2}`;
	const eqWald = $derived(
		String.raw`\begin{aligned}
		Z =& \frac{\hat\mu - \mu_0}{\text{se}(\hat\mu)} \\
		=& \frac{${f3n(model.muHat)} - ${f3n(model.p.muNull)}}{${f3n(model.tests.wald.se)}} \\
		=& ${f3n(model.tests.wald.z)}
		\end{aligned}`
	);
	const eqScoreAtNull = $derived(
		String.raw`U(\mu_0, \hat\sigma_0^2) = \frac{\partial}{\partial \mu_0}\ell(\mu_0, \hat\sigma_0^2) = ${f2n(model.scoreAtNull)}`
	);
	const eqInfoAtNull = $derived(String.raw`I(\mu_0, \hat\sigma_0^2) = ${f2n(model.infoAtNull)}`);
	const eqScore = $derived(
		String.raw`\begin{aligned}
		S(\mu_0, \hat\sigma_0^2) =& \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \\
		&= \frac{${f2n(model.scoreAtNull)}^2}{${f2n(model.infoAtNull)}} \\
		&= ${f3n(model.tests.score.stat)}
		\end{aligned}`
	);
</script>

<div class="tests">
	<div class="tablist" role="tablist" aria-label="Hypothesis test">
		{#each tabs as t (t.id)}
			<button
				role="tab"
				id="test-tab-{t.id}"
				aria-selected={model.p.test === t.id}
				aria-controls="test-panel-{t.id}"
				class:on={model.p.test === t.id}
				onclick={() => model.setTest(t.id)}
			>
				{t.label}
			</button>
		{/each}
	</div>

	<div
		class="panel"
		role="tabpanel"
		id="test-panel-LRT"
		aria-labelledby="test-tab-LRT"
		hidden={model.p.test !== 'LRT'}
	>
		<p>
			The likelihood ratio test compares the likelihoods of two models — here, the likelihood
			evaluated at the MLE and at the null. The plot shows it as the vertical distance between the
			two horizontal lines. Multiplying the difference in log-likelihood by −2 gives the statistic,
		</p>
		<Tex display math={eqLR} />
		<p>
			Asymptotically LR follows a <Tex math={String.raw`\chi^2`} /> distribution with 1 degree of freedom,
			which gives <em>p</em>
			<span data-testid="pval-LRT">{fmtP(model.tests.lr.pval)}</span>.
		</p>
		<p class="caveat">
			The 2D figure simplifies this: it holds the variance at <Tex
				math={String.raw`\hat\sigma^2`}
			/>
			for both likelihoods, whereas the test re-estimates it under the null (<Tex
				math={String.raw`\hat\sigma_0^2`}
			/>). The 3D view shows the exact version.
		</p>
	</div>

	<div
		class="panel"
		role="tabpanel"
		id="test-panel-wald"
		aria-labelledby="test-tab-wald"
		hidden={model.p.test !== 'wald'}
	>
		<p>
			The Wald test is based on the difference between the maximum likelihood estimate of the mean
			and <Tex math={String.raw`\mu_0`} />, divided by the standard error of the MLE,
			<Tex math={eqSE} />,
		</p>
		<Tex display math={eqWald} />
		<p>
			Asymptotically <em>Z</em> follows a standard normal distribution, giving <em>p</em>
			<span data-testid="pval-wald">{fmtP(model.tests.wald.pval)}</span>.
		</p>
	</div>

	<div
		class="panel"
		role="tabpanel"
		id="test-panel-score"
		aria-labelledby="test-tab-score"
		hidden={model.p.test !== 'score'}
	>
		<p>
			The score test (also known as the Lagrange multiplier test) is different in that we only
			evaluate it at the null: it involves the first and second derivative of the log-likelihood at
			<Tex math={String.raw`\mu_0`} /> — the slope of the tangent line in the plot,
		</p>
		<Tex display math={eqScore} />
		<p>
			Asymptotically S follows a <Tex math={String.raw`\chi^2`} /> distribution with 1 degree of freedom,
			giving <em>p</em>
			<span data-testid="pval-score">{fmtP(model.tests.score.pval)}</span>.
		</p>
		<p class="caveat">
			The 2D figure draws the tangent at <Tex math={String.raw`\hat\sigma^2`} />; the statistic, and
			the 3D view, evaluate the score at <Tex math={String.raw`\hat\sigma_0^2`} />, where the slope
			in the variance direction is zero.
		</p>
		<div class="score-info" data-testid="score-info">
			<p>
				The <em>score function</em> is the first derivative of the log-likelihood, how fast ℓ changes
				at the null:
			</p>
			<Tex display math={eqScoreAtNull} />
			<p>
				The <em>Fisher information</em> is the negative expected second derivative, the curvature at the
				null:
			</p>
			<Tex display math={eqInfoAtNull} />
		</div>
	</div>
</div>

<style>
	.tests {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.tablist {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--rule);
	}
	.tablist button {
		padding: 0.45rem 0.8rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.9rem;
		white-space: nowrap;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.tablist button:hover {
		color: var(--viz-accent);
	}
	.tablist button.on {
		color: var(--heading);
		font-weight: 600;
		border-bottom-color: var(--viz-accent);
	}
	.panel {
		padding: 0.6rem 0.9rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		font-size: 0.92rem;
		line-height: 1.55;
	}
	.panel p {
		margin: 0.4rem 0;
	}
	[data-testid^='pval-'] {
		white-space: nowrap;
	}
	.score-info {
		margin-top: 0.6rem;
		padding-top: 0.4rem;
		border-top: 1px solid var(--rule);
	}
	.caveat {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
