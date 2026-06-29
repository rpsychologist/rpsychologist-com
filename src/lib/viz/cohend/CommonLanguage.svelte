<script lang="ts">
	import { format } from 'd3-format';
	import type { CohendState } from './cohend.svelte';

	// The "common language" readout: the same numbers as the gauges, stated as a
	// sentence (ported verbatim from the old app). Always visible (not collapsed) —
	// this inline explanation is part of what makes the tool self-explanatory
	// without a guided tour.
	interface Props {
		model: CohendState;
	}

	let { model }: Props = $props();

	const pct = format('.1%');
	const d2 = format('.2f');
	const f1 = format('.1f');

	// Additional favorable outcomes per 100 treated (= absolute risk reduction).
	const nntPerc = $derived(100 / model.effects.nnt);
</script>

<p class="cl">
	With a Cohen's <em>d</em> of {d2(model.p.cohend)}, {pct(model.effects.u3)} of the "{model.p
		.muOneLabel}" group will be above the mean of the "{model.p.muZeroLabel}" group (Cohen's U<sub
		>3</sub
	>), {pct(model.effects.overlap)} of the two groups will overlap, and there is a
	{pct(model.effects.cles)} chance that a person picked at random from the "{model.p.muOneLabel}"
	group will have a higher score than a person picked at random from the "{model.p.muZeroLabel}"
	group (probability of superiority).{#if Number.isFinite(model.effects.nnt)}{' '}
		Moreover, in order to have one more favorable outcome in the "{model.p.muOneLabel}" group
		compared to the "{model.p.muZeroLabel}" group, we need to treat {f1(model.effects.nnt)} people on
		average. This means that if there are 100 people in each group, and we assume that {model.p.CER}
		people have favorable outcomes in the "{model.p.muZeroLabel}" group, then {model.p.CER} + {f1(
			nntPerc
		)} people in the "{model.p.muOneLabel}" group will have favorable outcomes.<sup>1</sup>
	{/if}
</p>
{#if Number.isFinite(model.effects.nnt)}
	<p class="cl-footnote">
		<sup>1</sup>The values are averages, and it is assumed that {model.p.CER} (CER) of the "{model.p
			.muZeroLabel}" group have "favorable outcomes," i.e., their outcomes are below some cut-off.
		Change this by pressing the settings symbol to the right of the slider. Go to the formula
		section for more information.
	</p>
{/if}

<style>
	.cl {
		font-size: 1rem;
		line-height: 1.6;
	}
	.cl-footnote {
		font-size: 0.85rem;
		line-height: 1.55;
		color: var(--muted);
	}
</style>
