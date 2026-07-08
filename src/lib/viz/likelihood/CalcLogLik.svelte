<script lang="ts">
	// The log-likelihood written out: one chip per observation's contribution,
	// linked by hover to its point in the sample plot (shared `highlight`).
	// Ported from the old CalcLogLik.js (MUI spans → plain CSS chips).
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import { logLikPoint } from './model';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
		highlight: number | null;
		onhighlight: (i: number | null) => void;
	}
	let { model, highlight, onhighlight }: Props = $props();

	const f1 = format('.1f');
	const terms = $derived(model.p.sample.map((yv) => logLikPoint(yv, model.p.mu, model.p.sigma2)));
	const sum = $derived(terms.reduce((a, b) => a + b, 0));
</script>

<p class="calc">
	<span class="eq"><Tex math={String.raw`\ell(\mu, \sigma^2) = \sum_i^n \ln f_y(y_i) =`} /></span>
	{#each terms as t, i (i)}
		<span
			class="chip"
			class:hot={highlight === i}
			role="presentation"
			onpointerenter={() => onhighlight(i)}
			onpointerleave={() => onhighlight(null)}>{f1(t)}</span
		>{#if i !== terms.length - 1}<span class="plus">+</span>{/if}
	{/each}
	<span class="plus">=</span>
	<span class="chip sum" data-testid="loglik-sum">{f1(sum)}</span>
</p>

<style>
	.calc {
		margin: 0;
		line-height: 2;
		color: var(--ink);
	}
	.eq {
		margin-right: 0.3rem;
	}
	.chip {
		display: inline-block;
		padding: 0.15rem 0.45rem;
		margin: 0.1rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		font-variant-numeric: tabular-nums;
		font-size: 0.95rem;
		cursor: default;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}
	.chip.hot {
		background: var(--viz-accent);
		border-color: var(--viz-accent);
		color: #fff;
	}
	.chip.sum {
		background: var(--viz-accent);
		border-color: var(--viz-accent);
		color: #fff;
		font-weight: 600;
	}
	.plus {
		color: var(--muted);
	}
</style>
