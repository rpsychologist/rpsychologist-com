<script lang="ts">
	// The three large-sample tests with live values in their formulas (old
	// TestTabs.js). Each tab carries its test's p-value, so the three compare
	// at a glance. Panels stay mounted and toggle with `hidden` so switching
	// tabs never recreates DOM; selecting a tab also drives the surface's
	// geometry highlight via model.p.test.
	import Tex from '#lib/components/Tex.svelte';
	import TexLive from '#lib/components/TexLive.svelte';
	import type { LikelihoodState, TestKind } from './likelihood.svelte';
	import { fData, fP as fmtP, fScore, fStat } from './format';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const tabs: { id: TestKind; label: string; key: 'lr' | 'wald' | 'score' }[] = [
		{ id: 'LRT', label: 'Likelihood ratio', key: 'lr' },
		{ id: 'wald', label: 'Wald', key: 'wald' },
		{ id: 'score', label: 'Score', key: 'score' }
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
	const eqScore = String.raw`\begin{aligned}
		S(\mu_0, \hat\sigma_0^2) =& \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \\
		&= \frac{#0^2}{#1} \\
		&= #2
		\end{aligned}`;
</script>

<div class="tests">
	<p class="intro">
		Choosing a test highlights the parts of the figure it uses. Move
		<Tex math={String.raw`\mu_0`} /> and watch the three <em>p</em>-values in the tabs.
	</p>
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
				<span class="name">{t.label}</span>
				<span class="p" data-testid="tabp-{t.id}"><em>p</em> {fmtP(model.tests[t.key].pval)}</span>
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
			The likelihood ratio test compares two fits of the model. In one, the mean and the variance
			are both free, which puts us at the top of the hill, the point labeled <em>MLE</em>. The other
			is the fit under the null, <em>best under <Tex math="H_0" /></em>, with the mean fixed at
			<Tex math={String.raw`\mu_0`} /> and the variance at <Tex
				math={String.raw`\hat\sigma_0^2`}
			/>. Both points lie on the dotted ridge, so their heights also appear on the profile curve on
			the back wall.
		</p>
		<p>
			The null fit can never be higher than the MLE, because the MLE is the best fit over all means,
			<Tex math={String.raw`\mu_0`} /> included. What matters is how much lower it is. The bracket labeled
			½·LR is that gap,
			<Tex math={String.raw`\ell(\hat\mu, \hat\sigma^2) - \ell(\mu_0, \hat\sigma_0^2)`} />. If the
			data are consistent with <Tex math={String.raw`\mu_0`} />, fixing the mean there costs little
			and the gap is small. Doubling the gap gives the test statistic:
		</p>
		<TexLive display math={eqLR} values={[fStat(model.tests.lr.stat)]} />
		<p>
			Under the null, LR approximately follows a <Tex math={String.raw`\chi^2`} /> distribution with 1
			degree of freedom in large samples. This gives <em>p</em>
			<span data-testid="pval-LRT">{fmtP(model.tests.lr.pval)}</span>. At the .05 level, we reject
			when LR exceeds about 3.84, which is a gap of 1.92. The means whose profile log-likelihood is
			within 1.92 of the maximum form the 95% profile likelihood interval, reported below the
			figure. It is exactly the set of <Tex math={String.raw`\mu_0`} /> values this test doesn't reject
			at the .05 level.
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
			For the Wald test we start with the estimated mean and ask how far it is from
			<Tex math={String.raw`\mu_0`} />. A difference of, say, five units doesn't tell us much on its
			own. We need to compare it with the uncertainty in our estimate, so we divide by the estimated
			standard error to get <em>Z</em>. The horizontal bracket shows the difference before this
			division:
		</p>
		<TexLive
			display
			math={eqWald}
			values={[
				fData(model.muHat),
				fData(model.p.muNull),
				fStat(model.tests.wald.se),
				fStat(model.tests.wald.z)
			]}
		/>
		<p>
			The standard error comes from the information at the maximum,
			<Tex math={eqSE} />. Try increasing the sample size. The bracket stays the same length, but
			the standard error gets smaller, so that difference now counts as more standard errors.
		</p>
		<p>
			Under the null, <em>Z</em> is approximately standard normal in large samples, giving
			<em>p</em>
			<span data-testid="pval-wald">{fmtP(model.tests.wald.pval)}</span>. We reject at the .05 level
			when <em>Z</em> is outside approximately ±1.96. The corresponding Wald interval is
			<Tex math={String.raw`\hat\mu \pm 1.96\,\text{se}(\hat\mu)`} />, reported below the figure.
		</p>
		<p>
			We don't need to fit the model under the null. Everything comes from the peak: the estimate
			and the curvature there. The slice through the MLE,
			<Tex math={String.raw`\ell(\mu, \hat\sigma^2)`} />, is a parabola with exactly that curvature.
			It matches the profile near the maximum but falls faster farther away, which is why the Wald
			<em>p</em>-value differs from the likelihood ratio test's.
		</p>
	</div>

	<div
		class="panel"
		role="tabpanel"
		id="test-panel-score"
		aria-labelledby="test-tab-score"
		hidden={model.p.test !== 'score'}
		data-testid="score-panel"
	>
		<p>
			The score test, also known as the Lagrange multiplier test, works only from the null. We fix
			the mean at <Tex math={String.raw`\mu_0`} />, estimate the variance, and measure the slope of
			the log-likelihood in the mean direction. That slope is the score, <em>U</em>, shown by the
			triangle in the figure. It is zero when <Tex math={String.raw`\mu_0`} /> equals the estimated mean.
		</p>
		<p>
			Move <Tex math={String.raw`\mu_0`} /> far away and the slope shrinks again: the null fit makes up
			for the wrong mean with a larger variance, which flattens the hill. Like the distance in the Wald
			test, then, a slope means little on its own. Under the null, the score varies from sample to sample
			with variance equal to the Fisher information, <em>I</em>, so we square the score and divide
			by it. The information shrinks along with the slope, so the statistic still grows the farther
			<Tex math={String.raw`\mu_0`} /> is from the estimate:
		</p>
		<TexLive
			display
			math={eqScore}
			values={[fScore(model.scoreAtNull), fScore(model.infoAtNull), fStat(model.tests.score.stat)]}
		/>
		<p>
			Under the null, <em>S</em> approximately follows a <Tex math={String.raw`\chi^2`} />
			distribution with 1 degree of freedom in large samples, giving <em>p</em>
			<span data-testid="pval-score">{fmtP(model.tests.score.pval)}</span>.
		</p>
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
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		padding: 0.35rem 0.8rem 0.4rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.9rem;
		line-height: 1.25;
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
			padding-inline: 0.55rem;
			font-size: 0.85rem;
		}
	}
	.tablist button.on {
		color: var(--heading);
		border-bottom-color: var(--viz-accent);
	}
	.tablist button.on .name {
		font-weight: 600;
	}
	.p {
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
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
	.intro {
		margin: 0 0 0.2rem;
		font-size: 0.92rem;
		line-height: 1.55;
	}
	[data-testid^='pval-'] {
		white-space: nowrap;
	}
</style>
