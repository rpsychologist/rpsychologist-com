<script lang="ts">
	import { format } from 'd3-format';
	import type { CohendState } from './cohend.svelte';
	import { getCohendI18n } from './i18n';
	import Msg from './i18n/Msg.svelte';

	// The "common language" readout: the same numbers as the gauges, stated as a
	// sentence (the old app's wording). Always visible (not collapsed) — this
	// inline explanation is part of what makes the tool self-explanatory without
	// a guided tour.
	interface Props {
		model: CohendState;
	}

	let { model }: Props = $props();

	const { m } = getCohendI18n();
	const pct = format('.1%');
	const d2 = format('.2f');
	const f1 = format('.1f');

	// Additional favorable outcomes per 100 treated (= absolute risk reduction);
	// 0 when d = 0, where NNT is infinite. Like the old app, the NNT sentence is
	// always shown (∞ at d = 0) rather than hidden — hiding it made the readout
	// jump as d crossed zero.
	const nntStr = $derived(Number.isFinite(model.effects.nnt) ? f1(model.effects.nnt) : '∞');
	const nntPerc = $derived(100 / model.effects.nnt);
	const vals = $derived({
		d: d2(model.p.cohend),
		u3: pct(model.effects.u3),
		ovl: pct(model.effects.overlap),
		cles: pct(model.effects.cles),
		nnt: nntStr,
		cer: model.p.CER,
		nntPerc: f1(nntPerc),
		g0: model.p.muZeroLabel,
		g1: model.p.muOneLabel
	});
</script>

<p class="cl"><Msg text={m.cl_sentence} values={vals} /></p>
<p class="cl-footnote"><Msg text={m.cl_footnote} values={vals} /></p>

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
