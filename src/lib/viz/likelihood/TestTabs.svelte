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

	const f2 = format('.2f');
	const f3n = format('.3n');
	const f2n = format('.2n');

	const tabs: { id: TestKind; label: string }[] = [
		{ id: 'LRT', label: 'Likelihood ratio' },
		{ id: 'wald', label: 'Wald' },
		{ id: 'score', label: 'Score' }
	];

	const eqHypo = $derived(
		String.raw`H_0: \mu = ${model.p.muNull} \quad \text{versus} \quad H_1: \mu \ne ${model.p.muNull}`
	);
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
	const eqScore = $derived(
		String.raw`\begin{aligned}
		S(\mu_0, \hat\sigma_0^2) =& \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \\
		&= \frac{${f2n(model.scoreAtNull)}^2}{${f2n(model.infoAtNull)}} \\
		&= ${f3n(model.tests.score.stat)}
		\end{aligned}`
	);
</script>

<div class="tests">
	<p class="hypo"><Tex display math={eqHypo} /></p>

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
			which gives <em>p</em> = <span data-testid="pval-LRT">{f2(model.tests.lr.pval)}</span>.
		</p>
		<p class="caveat">
			Note: the figure is simplified and does not account for the fact that each likelihood is based
			on a different variance estimate.
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
			Asymptotically <em>Z</em> follows a standard normal distribution, giving <em>p</em> =
			<span data-testid="pval-wald">{f2(model.tests.wald.pval)}</span>.
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
			giving <em>p</em> = <span data-testid="pval-score">{f2(model.tests.score.pval)}</span>.
		</p>
	</div>
</div>

<style>
	.tests {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.hypo {
		margin: 0;
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
	.caveat {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
