<script lang="ts">
	// The likelihood of μ for the fixed data, L(μ) = Π f(yᵢ | μ, σ²) at the
	// current σ²: the ledger's formula read the other way round. Raw L, not
	// ℓ, on purpose — the section is about what a likelihood value is, and
	// its tiny scale and non-unit area are the point. The observations sit
	// on the axis as fixed values. A pinned candidate A is drawn at its own
	// height, so the two heights' ratio is the likelihood ratio read out
	// below.
	import { scaleLinear } from 'd3-scale';
	import { line, area } from 'd3-shape';
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import { drag } from '$lib/viz/core/actions/drag';
	import { MU_MIN, MU_MAX, likelihoodAreaMu, logLikSum } from './model';
	import { sciTex } from './sci';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const margin = { top: 16, right: 20, bottom: 42, left: 55 };
	const ASPECT = 0.4;

	let cw = $state(0);
	const w = $derived(cw - margin.left - margin.right);
	const h = $derived(cw * ASPECT - margin.top - margin.bottom);

	const sample = $derived(model.p.sample);
	const L = (mu: number, s2: number) => Math.exp(logLikSum(sample, mu, s2));

	const x = $derived(scaleLinear([MU_MIN, MU_MAX], [0, w]));
	// In units of 10^k so the ticks stay readable; tops out over both the
	// curve and a pinned candidate.
	const lik = $derived.by(() => {
		const top = Math.max(
			L(model.muHat, model.p.sigma2),
			model.pinned ? L(model.pinned.mu, model.pinned.sigma2) : 0
		);
		const k = top > 0 ? Math.floor(Math.log10(top)) : 0;
		const unit = 10 ** k;
		return { k, unit, y: scaleLinear([0, (top / unit) * 1.1], [h, 0]).nice() };
	});
	const yL = (v: number) => lik.y(v / lik.unit);

	// Frame-wide grid plus a dense run over the peak (width σ/√n), which is
	// narrow next to the frame.
	const curve = $derived.by(() => {
		const sd = Math.sqrt(model.p.sigma2 / sample.length);
		const xs: number[] = [];
		for (let i = 0; i <= 120; i++) xs.push(MU_MIN + ((MU_MAX - MU_MIN) * i) / 120);
		for (let i = 0; i <= 80; i++) xs.push(model.muHat - 5 * sd + (10 * sd * i) / 80);
		return xs
			.filter((v) => v >= MU_MIN && v <= MU_MAX)
			.sort((a, b) => a - b)
			.map((v) => [x(v), yL(L(v, model.p.sigma2))] as [number, number]);
	});
	const path = $derived(line()(curve) ?? '');
	const fill = $derived(
		area()
			.y0(h)
			.y1((d) => d[1])(curve) ?? ''
	);
	const cur = $derived({ cx: x(model.p.mu), cy: yL(L(model.p.mu, model.p.sigma2)) });
	const pin = $derived(
		model.pinned
			? { cx: x(model.pinned.mu), cy: yL(L(model.pinned.mu, model.pinned.sigma2)) }
			: null
	);
	const xTicks = $derived(x.ticks(8));
	const yTicks = $derived(lik.y.ticks(4));
	const areaL = $derived(likelihoodAreaMu(sample, model.p.sigma2));

	// L_A / L_current, phrased with the larger one first.
	const fRatio = format('.3~r');
	const f1 = format('.1f');
	const ratio = $derived.by(() => {
		if (model.llPinned === null) return null;
		const d = model.llPinned - model.ll;
		return { aBetter: d >= 0, r: Math.exp(Math.abs(d)) };
	});
	const ratioTex = (r: number) => (r < 1e4 ? fRatio(r) : sciTex(r));

	let dragStart = 0;
</script>

<div class="lik-curve">
	<div class="chart" bind:clientWidth={cw}>
		{#if w > 0}
			<svg
				width={cw}
				height={cw * ASPECT}
				role="img"
				aria-label="The likelihood of the mean for the fixed sample, at variance {f1(
					model.p.sigma2
				)}"
			>
				<g transform="translate({margin.left}, {margin.top})">
					<path class="area" d={fill} />
					<path class="curve" d={path} />
					{#each sample as d, i (i)}
						<circle class="obs" r="3.5" cx={x(d)} cy={h} />
					{/each}
					{#if pin}
						<line class="guide" x1={pin.cx} x2={pin.cx} y1={pin.cy} y2={h} />
						<circle class="pinned-pt" r="5" cx={pin.cx} cy={pin.cy} />
						<text class="pt-label" x={pin.cx + 8} y={pin.cy - 6}>A</text>
					{/if}
					<line class="guide" x1={cur.cx} x2={cur.cx} y1={cur.cy} y2={h} />
					<circle
						class="cur-pt"
						role="slider"
						tabindex="0"
						aria-label="Candidate mean on the likelihood curve"
						aria-valuenow={model.p.mu}
						aria-valuemin={MU_MIN}
						aria-valuemax={MU_MAX}
						r="6"
						cx={cur.cx}
						cy={cur.cy}
						use:drag={{
							onstart: () => (dragStart = model.p.mu),
							ondrag: (e) => model.setMu(x.invert(x(dragStart) + e.totalX), true),
							onend: () => (model.immediate = false)
						}}
						onkeydown={(e) => {
							if (e.key === 'ArrowLeft') model.setMu(model.p.mu - 1);
							else if (e.key === 'ArrowRight') model.setMu(model.p.mu + 1);
						}}
					/>

					<g transform="translate(0, {h})">
						<line x1="0" x2={w} y1="0" y2="0" class="axis" />
						{#each xTicks as v (v)}
							<line x1={x(v)} x2={x(v)} y1="0" y2="6" class="axis" />
							<text x={x(v)} y="20" class="tick" text-anchor="middle">{v}</text>
						{/each}
					</g>
					<g>
						<line x1="0" x2="0" y1="0" y2={h} class="axis" />
						{#each yTicks as v (v)}
							<line x1="-6" x2="0" y1={lik.y(v)} y2={lik.y(v)} class="axis" />
							<text x="-9" y={lik.y(v)} class="tick" text-anchor="end" dominant-baseline="central"
								>{v}</text
							>
						{/each}
					</g>
					<text class="axis-label" text-anchor="middle" transform="translate({w / 2}, {h + 36})">
						Candidate mean, μ (the observations are fixed)
					</text>
					<text
						class="axis-label"
						text-anchor="middle"
						transform="translate({-margin.left + 16}, {h / 2}) rotate(-90)"
					>
						L(μ) ×10<tspan baseline-shift="super" font-size="9"
							>{String(lik.k).replace('-', '−')}</tspan
						>
					</text>
				</g>
			</svg>
		{/if}
	</div>
	<p class="caption" data-testid="curve-area">
		<Tex math={String.raw`L(\mu)`} /> at <Tex math={String.raw`\sigma^2`} /> = {f1(model.p.sigma2)}.
		Area under the curve: <Tex math={sciTex(areaL)} />.
	</p>
	<div class="compare">
		{#if ratio && model.pinned}
			<p data-testid="likelihood-ratio">
				{#if ratio.r < 1.0005}
					The data are equally likely under A and the current candidate.
				{:else}
					The data are <strong><Tex math={ratioTex(ratio.r)} />&times;</strong> as likely under
					{ratio.aBetter ? 'A as under the current candidate' : 'the current candidate as under A'}.
				{/if}
				<span class="a-note"
					>A: <Tex math={String.raw`\mu`} /> = {f1(model.pinned.mu)}, <Tex
						math={String.raw`\sigma^2`}
					/> = {f1(model.pinned.sigma2)}</span
				>
			</p>
			<button type="button" class="pin" onclick={() => model.unpin()}>Unpin A</button>
		{:else}
			<p>Pin the current candidate as A, then move the sliders or drag the point to compare.</p>
			<button type="button" class="pin" onclick={() => model.pin()}>Pin as A</button>
		{/if}
	</div>
</div>

<style>
	.lik-curve {
		min-width: 0;
	}
	/* Reserves the chart's footprint so hydration causes no shift. */
	.chart {
		width: 100%;
		aspect-ratio: 1 / 0.4;
	}
	.chart svg {
		display: block;
	}
	.curve {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 2.5;
	}
	.area {
		fill: var(--viz-accent);
		opacity: 0.08;
	}
	.obs {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	.guide {
		stroke: var(--muted);
		stroke-dasharray: 2 3;
	}
	.cur-pt {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 2;
		cursor: ew-resize;
	}
	.cur-pt:focus-visible {
		outline: none;
		stroke: var(--viz-accent);
		stroke-width: 3;
	}
	.pinned-pt {
		fill: var(--bg);
		stroke: var(--marginal);
		stroke-width: 2;
	}
	.pt-label {
		font-size: 12px;
		font-weight: 600;
		fill: var(--marginal);
	}
	.axis {
		stroke: var(--rule);
	}
	.tick {
		font-size: 11px;
		fill: var(--muted);
	}
	.axis-label {
		font-size: 12px;
		fill: var(--ink);
	}
	.caption {
		margin: 0.25rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.compare {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-top: 0.6rem;
		font-size: 0.9rem;
		line-height: 1.45;
		color: var(--ink);
	}
	.compare p {
		margin: 0;
		flex: 1;
		min-height: 2.9em;
	}
	.compare strong {
		color: var(--heading);
	}
	.a-note {
		display: block;
		font-size: 0.82rem;
		color: var(--marginal);
	}
	.pin {
		flex: none;
		padding: 0.3rem 0.8rem;
		border: 1px solid var(--marginal);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--marginal);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
	}
	.pin:hover {
		background: color-mix(in srgb, var(--marginal) 12%, transparent);
	}
</style>
