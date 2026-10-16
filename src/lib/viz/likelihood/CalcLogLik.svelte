<script lang="ts">
	// The log-likelihood as a ledger: one row per observation's contribution,
	// summed in the footer next to the best attainable value at the MLEs.
	// Rows link to their points in the sample plot (shared `highlight`). The
	// bars are scaled to the largest current term, so they show which
	// observations cost the candidate the most.
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
	const f2 = format('.2f');
	const terms = $derived(model.p.sample.map((yv) => logLikPoint(yv, model.p.mu, model.p.sigma2)));
	const worst = $derived(Math.max(...terms.map(Math.abs), 1e-9));
</script>

<div class="ledger">
	<p class="eq">
		<Tex math={String.raw`\ell(\mu, \sigma^2) = \sum_{i=1}^{n} \ln f(y_i \mid \mu, \sigma^2)`} />
	</p>
	<table>
		<thead>
			<tr>
				<th class="num" scope="col"><Tex math="i" /></th>
				<th class="num" scope="col"><Tex math="y_i" /></th>
				<th class="num" scope="col"><Tex math={String.raw`\ln f(y_i)`} /></th>
				<th class="bar-col"><span class="sr-only">Relative size</span></th>
			</tr>
		</thead>
		<tbody>
			{#each terms as t, i (i)}
				<!-- Focusable so keyboard users get the same plot linking as hover. -->
				<tr
					class:hot={highlight === i}
					tabindex="0"
					onpointerenter={() => onhighlight(i)}
					onpointerleave={() => onhighlight(null)}
					onfocus={() => onhighlight(i)}
					onblur={() => onhighlight(null)}
				>
					<td class="num idx">{i + 1}</td>
					<td class="num">{f1(model.p.sample[i])}</td>
					<td class="num">{f2(t)}</td>
					<td class="bar-col" aria-hidden="true">
						<span class="bar" style="width: {(Math.abs(t) / worst) * 100}%"></span>
					</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr class="total">
				<th scope="row" colspan="2"><Tex math={String.raw`\ell(\mu, \sigma^2)`} /></th>
				<td class="num" data-testid="loglik-sum">{f2(model.ll)}</td>
				<td class="note">the current candidate</td>
			</tr>
			<tr class="best" data-testid="estimates">
				<th scope="row" colspan="2"><Tex math={String.raw`\ell(\hat\mu, \hat\sigma^2)`} /></th>
				<td class="num">{f2(model.llMax)}</td>
				<td class="note">
					the maximum, at <Tex math={String.raw`\hat\mu`} />&nbsp;=&nbsp;{f2(model.muHat)},
					<Tex math={String.raw`\hat\sigma^2`} />&nbsp;=&nbsp;{f2(model.sigma2Hat)}
				</td>
			</tr>
		</tfoot>
	</table>
</div>

<style>
	.ledger {
		min-width: 0;
	}
	/* Scrolls rather than overflows on narrow screens, like display math. */
	.eq {
		margin: 0 0 0.5rem;
		overflow-x: auto;
		overflow-y: hidden;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		padding: 0.12rem 0.5rem;
		text-align: left;
		font-weight: normal;
	}
	thead th {
		color: var(--muted);
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.35rem;
	}
	.num {
		text-align: right;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	thead .num {
		font-family: inherit;
	}
	.idx {
		color: var(--muted);
	}
	tbody tr {
		cursor: default;
		transition: background 0.15s;
	}
	tbody tr:focus-visible {
		outline: 2px solid var(--viz-accent);
		outline-offset: -2px;
	}
	tbody tr.hot {
		background: color-mix(in srgb, var(--viz-accent) 12%, transparent);
	}
	/* Numbers shrink-wrap; the bar column takes the rest of the width. */
	.num {
		width: 1%;
	}
	/* 320px screens: default cell padding made the table ~13px too wide. */
	@media (max-width: 24rem) {
		th,
		td {
			padding-inline: 0.3rem;
		}
	}
	.bar {
		display: block;
		height: 0.5rem;
		border-radius: 1px;
		background: var(--viz-accent);
		opacity: 0.45;
		transition: opacity 0.15s;
	}
	:global([data-theme='dark']) .bar {
		opacity: 0.7;
	}
	tr.hot .bar {
		opacity: 1;
	}
	tfoot th {
		text-align: right;
	}
	tfoot th,
	tfoot td {
		padding-top: 0.3rem;
	}
	.total th,
	.total td {
		border-top: 1px solid var(--ink);
		padding-top: 0.45rem;
	}
	.total .num {
		color: var(--heading);
		font-weight: 600;
	}
	.note {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.35;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
