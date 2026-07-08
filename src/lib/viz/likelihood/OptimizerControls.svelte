<script lang="ts">
	// Algorithm picker + run controls (old GradientAscent.js). Hosts the
	// auto-run loop. Gradient ascent runs at a fixed cadence (not one step per
	// frame — that finished the whole climb in well under a second and read as
	// a jump-cut); Newton-Raphson steps once a second so its parabola
	// animation can play out.
	import Tex from '$lib/components/Tex.svelte';
	import type { LikelihoodState, Algo } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	let infoOpen = $state(false);

	// Autoplay cadence (presentation only — the path itself is unaffected):
	// ~15 gradient-ascent steps/s makes a full run a watchable ~2–3 s climb.
	const GA_STEP_MS = 66;

	$effect(() => {
		if (!model.running) return;
		const ms = model.p.algo === 'gradientAscent' ? GA_STEP_MS : 1000;
		const id = setInterval(() => model.step(), ms);
		return () => clearInterval(id);
	});

	const eqGrad = String.raw`
		\begin{aligned}
		\mu_{n+1} &= \mu_n + \gamma \frac{\partial}{\partial \mu_n}\ell \\
		\sigma^2_{n+1} &= \sigma^2_n + \gamma \frac{\partial}{\partial \sigma^2_n}\ell
		\end{aligned}`;
	const eqNewton = String.raw`
		\begin{aligned}
		\mu_{n+1} &= \mu_n + \small \frac{\partial^2}{\partial \mu_n^2}\ell^{-1} \frac{\partial}{\partial \mu_n}\ell \\
		\sigma^2_{n+1} &= \sigma^2_n + \small \frac{\partial^2}{\partial (\sigma_n^2)^2}\ell^{-1} \frac{\partial}{\partial \sigma^2_n}\ell
		\end{aligned}`;
</script>

<div class="optimizer">
	<p class="lead">
		For more challenging models, we often need an <strong>optimization algorithm</strong> — we let the
		computer iteratively climb toward the top of the hill. Use the controls to watch gradient ascent or
		Newton-Raphson find the maximum likelihood estimates.
	</p>

	<div class="controls">
		<label class="algo">
			<span>Algorithm</span>
			<select value={model.p.algo} onchange={(e) => model.setAlgo(e.currentTarget.value as Algo)}>
				<option value="none">None</option>
				<option value="gradientAscent">Gradient ascent</option>
				<option value="newtonRaphson">Newton-Raphson</option>
			</select>
		</label>

		{#if model.p.algo !== 'none'}
			<div class="buttons">
				<button
					class="ctrl"
					title="Run until convergence"
					aria-label="Run until convergence"
					disabled={model.converged || model.running}
					onclick={() => model.start()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />
					</svg>
				</button>
				<button
					class="ctrl"
					title="One iteration"
					disabled={model.converged || model.running}
					onclick={() => model.step()}>+1</button
				>
				<button
					class="ctrl"
					title="Undo one iteration"
					disabled={model.count === 0 || model.running}
					onclick={() => model.stepBack()}>−1</button
				>
				<!-- Old app enabled Reset only after convergence; any drawn path is
				     worth resetting (approved improvement). -->
				<button
					class="ctrl"
					title="Reset to the starting point"
					aria-label="Reset to the starting point"
					disabled={model.path.length === 0}
					onclick={() => model.resetRun()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M3 12a9 9 0 1 0 3-6.7M6 2v4h4" />
					</svg>
				</button>
				<button
					class="ctrl info"
					title="About this algorithm"
					aria-expanded={infoOpen}
					onclick={() => (infoOpen = !infoOpen)}>?</button
				>
			</div>
		{/if}
	</div>

	{#if infoOpen && model.p.algo === 'gradientAscent'}
		<aside class="card">
			<h3>Gradient Ascent</h3>
			<p>
				<a href="https://en.wikipedia.org/wiki/Gradient_descent">Gradient descent</a> is a simple
				iterative algorithm that uses the
				<a href="https://en.wikipedia.org/wiki/Gradient">gradient</a> (the vector of partial
				derivatives) to find a local minimum — here we look for the maximum, so we do gradient
				<em>ascent</em>. We start with an initial guess and iteratively update the values until
				convergence. Each update is proportional to the derivative of the log-likelihood at the
				current value — the slope of the tangent line in the plots. Move to a steeper region and the
				next step grows. For our model the iteration is:
			</p>
			<Tex display math={eqGrad} />
			<p class="note">
				Note: the data are standardized internally to make the algorithm more efficient — values are
				back-transformed before they are plotted. The step size (<Tex math={String.raw`\gamma`} />,
				sometimes called the "learning rate") is 0.05.
			</p>
		</aside>
	{:else if infoOpen && model.p.algo === 'newtonRaphson'}
		<aside class="card">
			<h3>The Newton-Raphson Method</h3>
			<p>
				<a href="https://en.wikipedia.org/wiki/Newton%27s_method">The Newton-Raphson method</a>
				(equal to
				<a href="https://en.wikipedia.org/wiki/Scoring_algorithm#Fisher_scoring"
					>Fisher's scoring algorithm</a
				>
				in this example) is like gradient ascent except the step length also depends on the
				<a href="https://en.wikipedia.org/wiki/Hessian_matrix">Hessian</a> (the matrix of
				second-order partial derivatives): we make a second-order
				<a href="https://en.wikipedia.org/wiki/Taylor_series">Taylor approximation</a> around the current
				value and jump to that approximation's maximum. The red curve in the variance plot shows it best
				— the log-likelihood in the mean is quadratic, so its approximation is exact and less illustrative.
				The iteration is:
			</p>
			<Tex display math={eqNewton} />
			<p class="note">
				Note: the Taylor approximation is drawn in one dimension; for our two-parameter
				log-likelihood it is of course two-dimensional, but drawing it on the contour plot would
				look messy and the intuition is the same.
			</p>
		</aside>
	{/if}
</div>

<style>
	.optimizer {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.lead {
		margin: 0;
		line-height: 1.6;
	}
	.controls {
		display: flex;
		align-items: end;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.algo {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.algo select {
		font: inherit;
		font-size: 0.95rem;
		color: var(--ink);
		padding: 0.35rem 0.5rem;
		background: var(--bg);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
	}
	.buttons {
		display: flex;
		gap: 0.35rem;
	}
	.ctrl {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.ctrl svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.ctrl:hover:not(:disabled) {
		color: var(--viz-accent);
		border-color: var(--viz-accent);
	}
	.ctrl:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.card {
		padding: 0.9rem 1.1rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
		line-height: 1.55;
	}
	.card h3 {
		margin: 0 0 0.4rem;
		font-size: 1rem;
	}
	.card p {
		margin: 0.4rem 0;
	}
	.card a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--rule);
	}
	.card a:hover {
		text-decoration-color: var(--viz-accent);
	}
	.note {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
