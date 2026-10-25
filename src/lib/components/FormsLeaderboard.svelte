<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { rankingScenario, rankIndex } from '#lib/stats/scenarios.js';
	import { regressionCoefficients, marginalSlope } from '#lib/stats/regression.js';
	import LeaderboardPlot, { type Geom } from './LeaderboardPlot.svelte';

	// The horse-race abuse: several co-equal exposures entered together, the largest
	// mutually-adjusted coefficient read off as the dominant risk factor. Each form's
	// crude (one-at-a-time) association is shown as a hollow reference marker; its
	// adjusted coefficient is the solid bar. The reader toggles which forms are
	// entered and the leaderboard re-sorts -- the crowned form changes with the set,
	// not with the world. Coefficients are exact (population covariance).

	const scenario = rankingScenario;
	const sigma = scenario.sigma;
	const yIdx = 0;
	const forms = scenario.forms;

	// Crude (marginal) association of each form with harm -- a fixed reference.
	const crudeByKey: Record<string, number> = Object.fromEntries(
		forms.map((f) => [f.key, marginalSlope(sigma, yIdx, rankIndex[f.key])])
	);

	let active = $state<Record<string, boolean>>(Object.fromEntries(forms.map((f) => [f.key, true])));

	const enteredForms = $derived(forms.filter((f) => active[f.key]));
	const enteredIdx = $derived(enteredForms.map((f) => rankIndex[f.key]));

	// Mutually-adjusted coefficient for every entered form; non-entered -> 0.
	const coefByKey = $derived.by(() => {
		const map: Record<string, number> = Object.fromEntries(forms.map((f) => [f.key, 0]));
		if (enteredIdx.length === 0) return map;
		const beta = regressionCoefficients(sigma, yIdx, enteredIdx);
		enteredForms.forEach((f, i) => (map[f.key] = beta[i]));
		return map;
	});

	// Rank: entered forms sorted by adjusted coefficient (descending) take the top
	// slots; non-entered forms fall to a muted tray below in their natural order.
	const slotByKey = $derived.by(() => {
		const ranked = enteredForms.slice().sort((a, b) => coefByKey[b.key] - coefByKey[a.key]);
		const rest = forms.filter((f) => !active[f.key]);
		const map: Record<string, number> = {};
		[...ranked, ...rest].forEach((f, i) => (map[f.key] = i));
		return map;
	});

	const topKey = $derived(
		enteredForms.length
			? enteredForms.slice().sort((a, b) => coefByKey[b.key] - coefByKey[a.key])[0].key
			: null
	);

	// Geometry for the shared <LeaderboardPlot>: desktop puts the form name + crude
	// value in a left column with the bar beside it; mobile stacks them on a line
	// above a full-width bar in a narrow portrait canvas (type renders near 1:1).
	const desktopGeom: Geom = {
		variant: 'desktop',
		stacked: false,
		W: 640,
		rowH: 58,
		top: 56,
		plotL: 188,
		plotR: 560
	};
	const mobileGeom: Geom = {
		variant: 'mobile',
		stacked: true,
		W: 360,
		rowH: 66,
		top: 66,
		plotL: 16,
		plotR: 344
	};

	// Tweened coefficient (bar length) and slot position (vertical re-sort), each
	// bound to its derived target so they animate on every change with no effect.
	const twCoef = Tween.of(() => coefByKey, { duration: 420, easing: cubicOut });
	const twSlot = Tween.of(() => slotByKey, { duration: 480, easing: cubicOut });

	// Rows for the shared plot: bar length and vertical slot are both tweened here,
	// so the bars grow/shrink and the rows glide to their new order.
	const rows = $derived(
		forms.map((f) => ({
			key: f.key,
			label: f.label,
			crude: crudeByKey[f.key],
			adjusted: twCoef.current[f.key],
			slot: twSlot.current[f.key],
			focal: active[f.key] && f.key === topKey,
			entered: active[f.key]
		}))
	);
</script>

<figure class="card leader">
	<div class="controls">
		<span class="controls-label">Enter into the model:</span>
		{#each forms as f (f.key)}
			<button
				class={['fig-pill', { on: active[f.key] }]}
				aria-pressed={active[f.key]}
				onclick={() => (active[f.key] = !active[f.key])}
			>
				<span class="fig-pill-text">{f.label}</span>
			</button>
		{/each}
	</div>

	<LeaderboardPlot
		{rows}
		desktop={desktopGeom}
		mobile={mobileGeom}
		axisPad={6}
		ariaLabel="Leaderboard of gambling forms ranked by their mutually-adjusted coefficient"
	/>

	<div class="legend">
		<span><span class="key-bar"></span> adjusted coefficient</span>
		<span><span class="key-gap"></span> portion removed by adjustment</span>
	</div>
</figure>

<style>
	.leader {
		margin: 2rem 0;
		padding: 1.25rem 1.25rem 1rem;
		box-shadow: var(--shadow);
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.controls-label {
		font-size: 0.85rem;
		color: var(--muted);
		margin-right: 0.25rem;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
		font-size: 0.78rem;
		color: var(--muted);
		margin: 0.25rem 0 0;
	}
	.key-bar,
	.key-gap {
		display: inline-block;
		width: 14px;
		height: 11px;
		vertical-align: -1px;
		margin-right: 0.3rem;
	}
	.key-bar {
		background: var(--accent);
	}
	.key-gap {
		background: var(--accent);
		opacity: 0.3;
	}
</style>
