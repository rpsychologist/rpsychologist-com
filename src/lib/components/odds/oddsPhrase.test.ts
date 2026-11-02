import { describe, expect, it } from 'vitest';
import { odds, probFromOdds } from '#lib/stats/binary.js';
import {
	longestReadouts,
	longestTrialReadouts,
	oddsDecimal,
	riskOddsReadout,
	trialReadout
} from './oddsPhrase';

describe('oddsDecimal', () => {
	it('shows the decimal odds at the precision of decimal()', () => {
		expect(oddsDecimal(30, 100)).toBe('odds 0.43');
		expect(oddsDecimal(30, 44)).toBe('odds 2.14');
		expect(oddsDecimal(50, 60)).toBe('odds 5.00');
	});
});

describe('riskOddsReadout', () => {
	it('defines the measure, then gives its value', () => {
		expect(riskOddsReadout(39, 100, 'risk')).toBe(
			'The risk of remission is the proportion of all patients who remit: 0.39, or 39%.'
		);
		expect(riskOddsReadout(39, 100, 'odds')).toBe(
			'The odds of remission are the number of remitters for every patient who does not remit: 0.64.'
		);
		expect(riskOddsReadout(5, 100, 'odds')).toBe(
			'The odds of remission are the number of remitters for every patient who does not remit: 0.053.'
		);
	});

	it('reserves the longest sentence of each view', () => {
		const [risk, odds] = longestReadouts(100);
		for (let k = 1; k < 100; k++) {
			expect(risk.length).toBeGreaterThanOrEqual(riskOddsReadout(k, 100, 'risk').length);
			expect(odds.length).toBeGreaterThanOrEqual(riskOddsReadout(k, 100, 'odds').length);
		}
	});
});

describe('trialReadout', () => {
	const read = (...args: Parameters<typeof trialReadout>) =>
		trialReadout(...args)
			.map((r) => (r.strong ? `**${r.text}**` : r.text))
			.join('');

	it('reads the risks view in patients and the number needed to treat', () => {
		expect(read(30, 50, 1, 'risk', 100)).toBe(
			'20 more of every 100 treated patients remit, so treating about 5 patients yields one extra remission. Treated patients remit 1.67 times as often as control patients.'
		);
		expect(read(50, 30, 1, 'risk', 100)).toBe(
			'20 fewer of every 100 treated patients remit: treatment costs about one remission for every 5 patients treated. Treated patients remit 0.60 times as often as control patients.'
		);
		expect(read(40, 40, 1, 'risk', 100)).toBe(
			'As many treated as control patients remit, so treating more patients yields no extra remission. Treated patients remit 1.00 times as often as control patients.'
		);
	});

	it('reads the odds view as the multiplication its equation shows', () => {
		expect(read(30, 50, 7 / 3, 'or', 100)).toBe(
			'Treatment multiplies the odds of remission by **2.33**: from 0.43 remitters for every patient who does not remit in the control arm to 1.00 in the treated arm.'
		);
		expect(read(55, 83, 4, 'or', 100)).toBe(
			'Treatment multiplies the odds of remission by **4.00**: from 1.22 remitters for every patient who does not remit in the control arm to 4.89 in the treated arm.'
		);
		expect(read(1, 1, 1 / 4, 'or', 100)).toBe(
			'Treatment multiplies the odds of remission by **0.25**: from 0.010 remitters for every patient who does not remit in the control arm to 0.0025 in the treated arm.'
		);
	});

	it('reserves the longest readout of each view', () => {
		const stops = [1 / 4, 1 / 2, 1, 2, 7 / 3, 8];
		const treatedFor = (c: number, or: number) =>
			Math.min(99, Math.max(1, Math.round(100 * probFromOdds(odds(c / 100) * or))));
		const len = (s: ReturnType<typeof trialReadout>) => s.map((r) => r.text).join('').length;
		const [risk, or] = longestTrialReadouts(100, stops, treatedFor);
		for (let c = 1; c < 100; c++) {
			for (let t = 1; t < 100; t++)
				expect(len(risk)).toBeGreaterThanOrEqual(len(trialReadout(c, t, 1, 'risk', 100)));
			for (const s of stops)
				expect(len(or)).toBeGreaterThanOrEqual(
					len(trialReadout(c, treatedFor(c, s), s, 'or', 100))
				);
		}
	});
});
