<script lang="ts">
	// Persistent estimate strip (new in 0.2.0): the MLEs plus the log-likelihood
	// at the maximum and at the current point — the "how far below the peak am
	// I" pairing that motivates finding the MLEs. The iteration count lives with
	// the optimizer controls, where the concept is introduced.
	import { format } from 'd3-format';
	import Tex from '$lib/components/Tex.svelte';
	import type { LikelihoodState } from './likelihood.svelte';

	interface Props {
		model: LikelihoodState;
	}
	let { model }: Props = $props();

	const f2 = format('.2f');
</script>

<dl class="readout" data-testid="estimates">
	<div>
		<dt><Tex math={String.raw`\hat\mu`} /></dt>
		<dd>{f2(model.muHat)}</dd>
	</div>
	<div>
		<dt><Tex math={String.raw`\hat\sigma^2`} /></dt>
		<dd>{f2(model.sigma2Hat)}</dd>
	</div>
	<div>
		<dt><Tex math={String.raw`\ell(\hat\mu, \hat\sigma^2)`} /></dt>
		<dd>{f2(model.llMax)}</dd>
	</div>
	<div>
		<dt><Tex math={String.raw`\ell(\mu, \sigma^2)`} /></dt>
		<dd>{f2(model.ll)}</dd>
	</div>
</dl>

<style>
	.readout {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.6rem;
		margin: 0.75rem 0 0;
		padding: 0.55rem 0.9rem;
		background: var(--panel);
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		font-variant-numeric: tabular-nums;
	}
	.readout div {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
	}
	dt {
		color: var(--muted);
		font-size: 0.85rem;
	}
	dd {
		margin: 0;
		color: var(--heading);
		font-weight: 600;
	}
</style>
