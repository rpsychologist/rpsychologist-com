// Plain-language labels and readouts for risk and odds.

import { format } from 'd3-format';
import { effects } from '#lib/stats/binary.js';

/** Odds span orders of magnitude: two significant figures below 0.1. */
export function decimal(v: number): string {
	if (v >= 100) return Math.round(v).toLocaleString('en-US');
	if (v >= 10) return v.toFixed(1);
	if (v >= 0.1) return v.toFixed(2);
	return v.toPrecision(2);
}

/** "odds 2.14": the decimal, for a figure whose readout multiplies the odds. */
export function oddsDecimal(k: number, n: number): string {
	return `odds ${decimal(k / (n - k))}`;
}

/**
 * The risk or odds of `k` remitters in `n`: what the measure divides, in
 * everyday words, then its value. One wording per view, with no article or
 * verb that agrees with a number, so dragging the slider changes only the
 * numbers.
 */
export function riskOddsReadout(k: number, n: number, view: 'risk' | 'odds'): string {
	return view === 'risk'
		? `The risk of remission is the proportion of all patients who remit: ${decimal(k / n)}, or ${Math.round((100 * k) / n)}%.`
		: `The odds of remission are the number of remitters for every patient who does not remit: ${decimal(k / (n - k))}.`;
}

/** The longest readout of each view over every count, for reserving its height. */
export function longestReadouts(n: number): string[] {
	return (['risk', 'odds'] as const).map((view) =>
		Array.from({ length: n - 1 }, (_, i) => riskOddsReadout(i + 1, n, view)).reduce((a, b) =>
			b.length > a.length ? b : a
		)
	);
}

const f2 = format('.2f');
const nnt = format('.1~f');

/** Odds and ratios span orders of magnitude at extreme slider settings. */
export const fx = (v: number) =>
	v >= 100 ? format(',.0f')(v) : v >= 10 ? format('.1f')(v) : v >= 0.1 ? f2(v) : format('.2r')(v);

/** A readout as runs of text, `strong` for the number it stresses. */
export type Segments = { text: string; strong?: boolean }[];

/**
 * The trial card's readout for `control` and `treated` remitters of `n` per
 * arm. The odds view reads out the odds ratio `or` as the multiplication its
 * equation shows; the post's prose, not the card, takes on the misreading
 * "times as likely".
 */
export function trialReadout(
	control: number,
	treated: number,
	or: number,
	measure: 'risk' | 'or',
	n: number
): Segments {
	if (measure === 'risk') {
		const { rd, rr, nnt: perExtra } = effects(control / n, treated / n);
		const ratio = `Treated patients remit ${fx(rr)} times as often as control patients.`;
		if (rd > 0)
			return [
				{
					text: `${treated - control} more of every ${n} treated patients remit, so treating about ${nnt(perExtra)} patients yields one extra remission. ${ratio}`
				}
			];
		if (rd < 0)
			return [
				{
					text: `${control - treated} fewer of every ${n} treated patients remit: treatment costs about one remission for every ${nnt(-perExtra)} patients treated. ${ratio}`
				}
			];
		// Equal arms keep the sentences' shape, so dragging through them reads on.
		return [
			{
				text: `As many treated as control patients remit, so treating more patients yields no extra remission. ${ratio}`
			}
		];
	}
	// Treated odds as the card's equation computes them, so the two agree.
	const controlOdds = control / (n - control);
	return [
		{ text: 'Treatment multiplies the odds of remission by ' },
		{ text: f2(or), strong: true },
		{
			text: `: from ${fx(controlOdds)} remitters for every patient who does not remit in the control arm to ${fx(controlOdds * or)} in the treated arm.`
		}
	];
}

const segmentsText = (s: Segments) => s.map((r) => r.text).join('');

/**
 * The longest trial readout of each view, for reserving its height: every
 * pair of counts, and every control count at each of `ors`, with
 * `treatedFor` giving the treated count that odds ratio implies.
 */
export function longestTrialReadouts(
	n: number,
	ors: number[],
	treatedFor: (control: number, or: number) => number
): Segments[] {
	const counts = Array.from({ length: n - 1 }, (_, i) => i + 1);
	const longest = (all: Segments[]) =>
		all.reduce((a, b) => (segmentsText(b).length > segmentsText(a).length ? b : a));
	return [
		longest(counts.flatMap((c) => counts.map((t) => trialReadout(c, t, 1, 'risk', n)))),
		longest(counts.flatMap((c) => ors.map((or) => trialReadout(c, treatedFor(c, or), or, 'or', n))))
	];
}
