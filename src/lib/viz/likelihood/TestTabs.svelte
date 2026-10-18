<script lang="ts">
	// The three large-sample tests with live values in their formulas (old
	// TestTabs.js). Panels stay mounted and toggle with `hidden` so switching
	// tabs never recreates DOM; selecting a tab also drives the curvature
	// plot's geometry highlight via model.p.test.
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import TexLive from '$lib/components/TexLive.svelte';
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

	// Live numbers go in the #k slots (TexLive), so the formulas typeset once.
	const eqLR = String.raw`\begin{aligned}
		\text{LR} &= -2[\ell(\mu_{0}, \hat\sigma^2_{0}) - \ell(\hat\mu, \hat\sigma^2)]\\
		&= #0
		\end{aligned}`;
	const eqSE = String.raw`\text{se}(\hat\mu) = I(\hat\mu, \hat\sigma^2)^{-1/2}`;
	const eqWald = String.raw`\begin{aligned}
		Z &= \frac{\hat\mu - \mu_0}{\text{se}(\hat\mu)} \\
		&= \frac{#0 - #1}{#2} \\
		&= #3
		\end{aligned}`;
	const eqScoreAtNull = String.raw`U(\mu_0, \hat\sigma_0^2) = \frac{\partial}{\partial \mu_0}\ell(\mu_0, \hat\sigma_0^2) = #0`;
	const eqInfoAtNull = String.raw`I(\mu_0, \hat\sigma_0^2) = #0`;
	const eqScore = String.raw`\begin{aligned}
		S(\mu_0, \hat\sigma_0^2) =& \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \\
		&= \frac{#0^2}{#1} \\
		&= #2
		\end{aligned}`;
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
			The likelihood ratio test compares the likelihoods of two models, here the likelihood
			evaluated at the MLE and at the null. The 2D figure shows this as the vertical distance
			between the two horizontal lines, which is half the statistic. Multiplying the difference in
			log-likelihood by −2 gives the statistic,
		</p>
		<TexLive display math={eqLR} values={[f3n(model.tests.lr.stat)]} />
		<p>
			Asymptotically LR follows a <Tex math={String.raw`\chi^2`} /> distribution with 1 degree of freedom,
			which gives <em>p</em>
			<span data-testid="pval-LRT">{fmtP(model.tests.lr.pval)}</span>.
		</p>
		<p class="caveat">
			Each likelihood uses the best variance for its own mean: <Tex
				math={String.raw`\hat\sigma^2`}
			/> at the MLE and <Tex math={String.raw`\hat\sigma_0^2`} /> at the null. That is why the bracket
			sits on the amber <em>profile</em> curve, the best log-likelihood for each
			<Tex math={String.raw`\mu`} />, and not on the slice at <Tex
				math={String.raw`\hat\sigma^2`}
			/>.
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
		<TexLive
			display
			math={eqWald}
			values={[
				f3n(model.muHat),
				f3n(model.p.muNull),
				f3n(model.tests.wald.se),
				f3n(model.tests.wald.z)
			]}
		/>
		<p>
			Asymptotically <em>Z</em> follows a standard normal distribution, giving <em>p</em>
			<span data-testid="pval-wald">{fmtP(model.tests.wald.pval)}</span>.
		</p>
		<p class="caveat">
			The Wald test reads the teal slice, the quadratic that matches the profile's curvature at the
			peak. The open circle at <Tex math={String.raw`\mu_0`} /> sits at <Tex
				math={String.raw`-Z^2/2`}
			/>, always at or below the profile (see the FAQ), so the Wald test overstates the evidence
			against the null relative to the likelihood ratio test.
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
			evaluate it at the null. It uses the first and second derivatives of the log-likelihood at
			<Tex math={String.raw`\mu_0`} />; the first is the slope of the tangent line in the figure,
		</p>
		<TexLive
			display
			math={eqScore}
			values={[f2n(model.scoreAtNull), f2n(model.infoAtNull), f3n(model.tests.score.stat)]}
		/>
		<p>
			Asymptotically <em>S</em> follows a <Tex math={String.raw`\chi^2`} /> distribution with 1 degree
			of freedom, giving <em>p</em>
			<span data-testid="pval-score">{fmtP(model.tests.score.pval)}</span>.
		</p>
		<p class="caveat">
			The tangent touches the profile curve: its slope there equals the score at <Tex
				math={String.raw`\hat\sigma_0^2`}
			/>, where the slope in the variance direction is zero.
		</p>
		<div class="score-info" data-testid="score-info">
			<p>
				The <em>score function</em> is the first derivative of the log-likelihood, how fast ℓ changes
				at the null:
			</p>
			<TexLive display math={eqScoreAtNull} values={[f2n(model.scoreAtNull)]} />
			<p>
				The <em>Fisher information</em> is the negative expected second derivative, the curvature at the
				null:
			</p>
			<TexLive display math={eqInfoAtNull} values={[f2n(model.infoAtNull)]} />
			<p>
				The more sharply the log-likelihood bends, the more precisely the data pin down
				<Tex math={String.raw`\mu`} />.
			</p>
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
	/* The three tabs need tighter padding in a narrow column (a 360px phone,
	   or the figure's side column just above the two-column breakpoint). */
	.tests {
		container-type: inline-size;
	}
	@container (max-width: 21rem) {
		.tablist {
			gap: 0;
		}
		.tablist button {
			padding: 0.45rem 0.55rem;
			font-size: 0.85rem;
		}
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
	/* Phones: the instrument already frames the panel edge to edge; a second
	   card inside it would only add padding. */
	@media (max-width: 48rem) {
		.panel {
			padding: 0.4rem 0 0;
			background: none;
			border: none;
			border-radius: 0;
		}
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
