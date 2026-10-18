<script lang="ts">
	// Algorithm picker + run controls (old GradientAscent.js). Hosts the
	// auto-run loop. Gradient ascent runs at a fixed cadence (not one step per
	// frame — that finished the whole climb in well under a second and read as
	// a jump-cut); Fisher scoring steps once a second so its parabola
	// animation can play out. The γ slider is log-scaled: the interesting
	// range runs from a crawl (0.002) to a bounce or overshoot (≥ 0.3).
	import Tex from '$lib/components/Tex.svelte';
	import Slider from '$lib/viz/core/components/Slider.svelte';
	import { defaults, GAMMA_MAX, GAMMA_MIN, RUN_CAP } from './likelihood.svelte';
	import type { LikelihoodState, Algo } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	let infoOpen = $state(false);
	let infoBtn: HTMLButtonElement | undefined = $state();
	let card: HTMLElement | undefined = $state();

	// The info card is a popover: a press anywhere outside it (capture phase,
	// so the surface's own pointer handling can't swallow it) or Esc closes
	// it. The ? button is excluded so its own click can toggle.
	$effect(() => {
		if (!infoOpen) return;
		const onDown = (e: PointerEvent) => {
			const t = e.target as Node;
			if (card?.contains(t) || infoBtn?.contains(t)) return;
			infoOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			infoOpen = false;
			infoBtn?.focus();
		};
		window.addEventListener('pointerdown', onDown, true);
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('pointerdown', onDown, true);
			window.removeEventListener('keydown', onKey);
		};
	});

	// Slider position = log10 γ; seeded from the defaults (only the slider
	// sets γ, so it can't drift from the model).
	let logGamma = $state(Math.log10(defaults.gamma));
	const fGamma = (lg: number) => String(Number((10 ** lg).toPrecision(2)));

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
	// Fisher scoring: the inverse expected information scales each score.
	const eqFisher = String.raw`
		\begin{aligned}
		\mu_{n+1} &= \mu_n + I(\mu_n)^{-1} \frac{\partial}{\partial \mu_n}\ell, & I(\mu) &= \frac{n}{\sigma^2} \\
		\sigma^2_{n+1} &= \sigma^2_n + I(\sigma^2_n)^{-1} \frac{\partial}{\partial \sigma^2_n}\ell, & I(\sigma^2) &= \frac{n}{2\sigma^4}
		\end{aligned}`;
</script>

<div class="optimizer">
	<div class="controls">
		<label class="algo">
			<!-- Visually hidden: the options name themselves, and the header
			     needs the width for the step-size slider. -->
			<span class="sr-only">Algorithm</span>
			<select value={model.p.algo} onchange={(e) => model.setAlgo(e.currentTarget.value as Algo)}>
				<option value="none">None</option>
				<option value="gradientAscent">Gradient ascent</option>
				<option value="fisherScoring">Fisher scoring</option>
			</select>
		</label>

		{#if model.p.algo === 'gradientAscent'}
			<div class="gamma">
				<Slider
					id="likelihood-gamma"
					label="Step size γ"
					min={Math.round(Math.log10(GAMMA_MIN) * 100) / 100}
					max={Math.log10(GAMMA_MAX)}
					step={0.01}
					format={fGamma}
					bind:value={logGamma}
					oninput={() => model.setGamma(Number(fGamma(logGamma)))}
				/>
			</div>
		{/if}

		{#if model.p.algo !== 'none'}
			<div class="buttons">
				<button
					class="ctrl"
					title="Run until convergence"
					aria-label="Run until convergence"
					disabled={model.converged || model.diverged || model.running}
					onclick={() => model.start()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />
					</svg>
				</button>
				<button
					class="ctrl"
					title="One iteration"
					disabled={model.converged || model.diverged || model.running}
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
					bind:this={infoBtn}
					onclick={() => (infoOpen = !infoOpen)}>?</button
				>
			</div>

			<p class="iter">
				Iterations: <span data-testid="iterations"
					>{model.count}{#if model.converged}<span class="converged">(converged)</span
						>{:else if model.diverged}<span
							class="diverged"
							title="The last step left the plotted frame">(overshot)</span
						>{:else if model.count >= RUN_CAP}<span
							class="diverged"
							title="Stopped after the iteration cap without converging">(stopped)</span
						>{/if}</span
				>
			</p>
		{/if}
	</div>

	{#if infoOpen && model.p.algo === 'gradientAscent'}
		<aside class="card" bind:this={card}>
			<h3>Gradient Ascent</h3>
			<p>
				<a href="https://en.wikipedia.org/wiki/Gradient_descent">Gradient descent</a> is a simple
				iterative algorithm that uses the
				<a href="https://en.wikipedia.org/wiki/Gradient">gradient</a> (the vector of partial
				derivatives) to find a local minimum. Here we look for the maximum, so we do gradient
				<em>ascent</em>. We start with an initial guess and iteratively update the values until
				convergence. Each update is proportional to the derivative of the log-likelihood at the
				current value, the slope of the surface. Move to a steeper region and the next step grows;
				the dashed arrow previews it. For our model the iteration is:
			</p>
			<Tex display math={eqGrad} />
			<p class="note">
				Note: the data are standardized internally to make the algorithm more efficient, and values
				are back-transformed before they are plotted. The step size (<Tex
					math={String.raw`\gamma`}
				/>, sometimes called the "learning rate") is set with the slider; 0.05 is the default.
			</p>
		</aside>
	{:else if infoOpen && model.p.algo === 'fisherScoring'}
		<aside class="card" bind:this={card}>
			<h3>Fisher Scoring</h3>
			<p>
				<a href="https://en.wikipedia.org/wiki/Scoring_algorithm#Fisher_scoring">Fisher scoring</a>
				is a version of the
				<a href="https://en.wikipedia.org/wiki/Newton%27s_method">Newton-Raphson method</a>. Like
				gradient ascent it follows the score, but the step length also depends on the curvature:
				Newton-Raphson uses the
				<a href="https://en.wikipedia.org/wiki/Hessian_matrix">Hessian</a> (the matrix of
				second-order partial derivatives), and Fisher scoring uses the Fisher information, the
				expected value of the negative Hessian. Either way we make a second-order
				<a href="https://en.wikipedia.org/wiki/Taylor_series">Taylor approximation</a> around the current
				value and jump to that approximation's maximum. The dotted curves on the 3D surface show it: in
				the mean the log-likelihood is quadratic, so the approximation lies exactly on the teal slice;
				in the variance it peels away from the hill. The iteration is:
			</p>
			<Tex display math={eqFisher} />
			<p class="note">
				Both parameters update at once, so the first step computes the new
				<Tex math={String.raw`\sigma^2`} /> at the old <Tex math={String.raw`\mu`} />: it lands on
				<Tex math={String.raw`\hat\sigma^2 + (\mu_n - \hat\mu)^2`} />, the best variance for the
				starting mean, which overshoots whenever that mean is off. The second step lands on the MLE.
				The approximation is drawn along the two slices; over both parameters it is a paraboloid,
				which rises well above the hill away from the peak.
			</p>
		</aside>
	{/if}
</div>

<style>
	.optimizer {
		position: relative;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.6rem 0.8rem;
		flex-wrap: wrap;
	}
	/* Room reserved for the longest status, so a run that ends in
	   "(overshot)" doesn't rewrap the header and shove the plots. */
	.iter {
		min-width: 11.5rem;
		margin: 0;
		font-size: 0.9rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.iter span {
		color: var(--heading);
		font-weight: 600;
	}
	.iter .converged {
		/* Margin, not a whitespace text node — Svelte's whitespace handling
		   collapsed the latter ("59(converged)"). */
		margin-left: 0.35rem;
		color: var(--viz-accent);
	}
	.iter .diverged {
		margin-left: 0.35rem;
		color: #e17055;
	}
	/* One-line label at every γ: the value is the widest part ("0.0035"). */
	.gamma {
		width: 8.25rem;
		font-size: 0.85rem;
	}
	.gamma :global(.slider-label) {
		white-space: nowrap;
	}
	.gamma :global(.slider-value) {
		font-variant-numeric: tabular-nums;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	.algo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.algo select {
		font: inherit;
		font-size: 0.9rem;
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
		width: 2rem;
		height: 2rem;
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
	/* Popover, not in flow: opening it must not change the header's height
	   (that would shove the plots on every toggle). Overlays the content below. */
	.card {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		z-index: 41;
		width: min(40rem, 90vw);
		padding: 0.9rem 1.1rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.14);
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
	/* Phones: the algorithm (the full-view button sits at its right, see
	   LikelihoodTool), the step size across the full width, the run buttons,
	   and a one-line counter — instead of five loosely stacked rows. */
	@media (max-width: 48rem) {
		.optimizer {
			flex: 1 1 100%;
		}
		/* The popover spans the controls' own width, which is the header's. */
		.card {
			right: 0;
			width: auto;
		}
		.controls {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			grid-template-areas:
				'algo algo'
				'gamma gamma'
				'buttons buttons'
				'iter iter';
			gap: 0.55rem 0.75rem;
			align-items: center;
		}
		.algo {
			grid-area: algo;
			margin-right: 3rem;
		}
		.algo select {
			width: 100%;
		}
		.gamma {
			grid-area: gamma;
			width: auto;
		}
		.buttons {
			grid-area: buttons;
		}
		/* The counter gets its own short line: beside five buttons it would be
		   clipped on a 360px phone once a status like "(overshot)" appears. */
		.iter {
			grid-area: iter;
			min-width: 0;
			margin-top: -0.25rem;
			font-size: 0.8rem;
		}
	}
</style>
