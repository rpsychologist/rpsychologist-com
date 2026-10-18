<script lang="ts">
	// The three large-sample tests with live values in their formulas (old
	// TestTabs.js). Panels stay mounted and toggle with `hidden` so switching
	// tabs never recreates DOM; selecting a tab also drives the curvature
	// plot's geometry highlight via model.p.test.
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import TexLive from '$lib/components/TexLive.svelte';
	import type { LikelihoodState, TestKind } from './likelihood.svelte';
	import { fData, fScore, fStat } from './format';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const f3 = format('.3f');
	// APA style: no leading zero, and p < .001 rather than a rounded 0.
	const fmtP = (p: number) => (p < 0.001 ? '< .001' : `= ${f3(p).replace(/^0/, '')}`);

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
	const eqScoreAtNull = String.raw`\begin{aligned}
		U(\mu_0, \hat\sigma_0^2) &= \frac{\partial}{\partial \mu_0}\ell(\mu_0, \hat\sigma_0^2)
		= \frac{n(\hat\mu - \mu_0)}{\hat\sigma_0^2} \\
		&= \frac{#0\,(#1 - #2)}{#3} = #4
		\end{aligned}`;
	const eqInfoAtNull = String.raw`I(\mu_0, \hat\sigma_0^2) = #0`;
	const eqScore = String.raw`\begin{aligned}
		S(\mu_0, \hat\sigma_0^2) =& \frac{U(\mu_0, \hat\sigma_0^2)^2}{I(\mu_0, \hat\sigma_0^2)} \\
		&= \frac{#0^2}{#1} \\
		&= #2
		\end{aligned}`;
</script>

<div class="tests">
	<p class="intro">
		All three tests ask whether <Tex math={String.raw`\mu_0`} /> is far from the peak of the same log-likelihood.
		They differ in what they measure: the likelihood ratio test the drop in height, the Wald test the
		distance along <Tex math={String.raw`\mu`} />, and the score test the slope at the null.
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
			The likelihood ratio test asks how much worse the null fits than the best estimate. The
			bracket in the figure is that loss: the drop in log-likelihood from the peak at
			<Tex math={String.raw`\hat\mu`} /> down to <Tex math={String.raw`\mu_0`} />. A small drop
			means the data are almost as likely under the null as under the MLE. Multiplying the drop by 2
			puts it on the scale of a <Tex math={String.raw`\chi^2`} /> distribution,
		</p>
		<TexLive display math={eqLR} values={[fStat(model.tests.lr.stat)]} />
		<p>
			Asymptotically LR follows a <Tex math={String.raw`\chi^2`} /> distribution with 1 degree of freedom,
			which gives <em>p</em>
			<span data-testid="pval-LRT">{fmtP(model.tests.lr.pval)}</span>. The test rejects at the .05
			level when LR exceeds 3.84, the 95th percentile of that distribution, so when the bracket is
			longer than 1.92. In 2D, the 95% cutoff line at −1.92 marks that depth. The values of
			<Tex math={String.raw`\mu_0`} /> the test does not reject form the profile likelihood interval.
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
			The Wald test asks how far the estimate is from the null, measured in standard errors. The
			horizontal bracket in the figure is that distance, from <Tex math={String.raw`\hat\mu`} /> to
			<Tex math={String.raw`\mu_0`} />. Whether it counts as far depends on how sharply the
			log-likelihood peaks: a sharp peak means the data pin down <Tex math={String.raw`\mu`} />
			tightly, so the standard error is small. Drag the sample size slider and the bracket keeps its length
			while the peak narrows and <em>Z</em> grows,
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
			The standard error is read off the curvature at the peak, <Tex math={eqSE} />: the sharper the
			peak, the smaller it is. Asymptotically <em>Z</em> follows a standard normal distribution,
			giving <em>p</em>
			<span data-testid="pval-wald">{fmtP(model.tests.wald.pval)}</span>. The test rejects at the
			.05 level when <em>Z</em> is beyond ±1.96, so the Wald interval is
			<Tex math={String.raw`\hat\mu \pm 1.96\,\text{se}(\hat\mu)`} />. In 2D, the teal parabola
			crosses the 95% cutoff line exactly at its ends: 1.96 standard errors from the peak, the
			parabola has dropped <Tex math={String.raw`1.96^2/2 = 1.92`} />.
		</p>
		<p class="caveat">
			The Wald test only looks at the peak. It measures the curvature there and treats the
			log-likelihood as the parabola with that curvature, the teal slice through the MLE, so it
			never evaluates the likelihood at <Tex math={String.raw`\mu_0`} />. In 2D, the open circle is
			where that parabola puts the null; the likelihood ratio test uses the real curve instead.
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
			The score test (also known as the Lagrange multiplier test) stands at the null and asks
			whether the log-likelihood is still climbing toward the estimate. It never evaluates the MLE.
			The slope at <Tex math={String.raw`\mu_0`} />, the score <em>U</em>, is the tangent in the
			figure. At the peak the curve is flat, so a steep slope means the data point away from the
			null. How steep counts as steep depends on how sharply the curve bends there, the Fisher
			information <em>I</em>, so the statistic divides the squared slope by it,
		</p>
		<TexLive
			display
			math={eqScore}
			values={[fScore(model.scoreAtNull), fScore(model.infoAtNull), fStat(model.tests.score.stat)]}
		/>
		<p>
			Asymptotically <em>S</em> follows a <Tex math={String.raw`\chi^2`} /> distribution with 1 degree
			of freedom, giving <em>p</em>
			<span data-testid="pval-score">{fmtP(model.tests.score.pval)}</span>.
		</p>
		<p class="caveat">
			The slope is read at <Tex math={String.raw`\hat\sigma_0^2`} />, where the log-likelihood is
			flat in the variance direction. That is why, in 2D, the tangent touches the profile curve.
		</p>
		<div class="score-info" data-testid="score-info">
			<p>
				The <em>score function</em> is the first derivative of the log-likelihood, how fast ℓ changes
				at the null:
			</p>
			<TexLive
				display
				math={eqScoreAtNull}
				values={[
					String(model.p.n),
					fData(model.muHat),
					fData(model.p.muNull),
					fData(model.sigma2Null),
					fScore(model.scoreAtNull)
				]}
			/>
			<p>
				It is zero only when <Tex math={String.raw`\mu_0 = \hat\mu`} />: the log-likelihood is flat
				at its maximum.
			</p>
			<p>
				The <em>Fisher information</em> is the negative expected second derivative, the curvature at the
				null:
			</p>
			<TexLive display math={eqInfoAtNull} values={[fScore(model.infoAtNull)]} />
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
	.intro {
		margin: 0 0 0.2rem;
		font-size: 0.92rem;
		line-height: 1.55;
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
