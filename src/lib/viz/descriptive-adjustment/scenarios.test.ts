import { describe, expect, it } from 'vitest';
import { isPositiveDefinite } from '../../stats/linalg';
import { marginalSlope, partialCoefficient, regressionCoefficients } from '../../stats/regression';
import {
	buildRankingSigma,
	coefIndex,
	coefficientScenario,
	rankIndex,
	rankingScenario,
	rankingSliderDefaults,
	rankingSliderRanges
} from './scenarios';

const { Y, X, Z1, Z2, Z3 } = coefIndex;
const sigma = coefficientScenario.sigma;

describe('coefficient scenario', () => {
	it('uses a positive-definite population correlation matrix', () => {
		expect(isPositiveDefinite(sigma)).toBe(true);
	});

	it('has the marginal income gradient in gambling harm at -0.48', () => {
		expect(marginalSlope(sigma, Y, X)).toBeCloseTo(-0.48, 10);
	});

	it('attenuates to -0.305 when adjusting for psychological distress alone', () => {
		expect(partialCoefficient(sigma, Y, X, [Z1])).toBeCloseTo(-0.305, 3);
	});

	it('recovers the distress coefficient alongside income', () => {
		const beta = regressionCoefficients(sigma, Y, [X, Z1]);
		expect(beta[0]).toBeCloseTo(-0.305, 3); // X (income)
		expect(beta[1]).toBeCloseTo(0.38, 3); // Z1 (distress)
	});

	it("reverses sign on the full comorbidity set (Simpson's paradox)", () => {
		const marginal = partialCoefficient(sigma, Y, X, []);
		const adjZ1 = partialCoefficient(sigma, Y, X, [Z1]);
		const adjZ1Z2 = partialCoefficient(sigma, Y, X, [Z1, Z2]);
		const adjAll = partialCoefficient(sigma, Y, X, [Z1, Z2, Z3]);

		// Strongly negative marginally, attenuating through zero to a positive value.
		expect(marginal).toBeCloseTo(-0.48, 10);
		expect(adjZ1).toBeLessThan(0);
		expect(adjZ1).toBeGreaterThan(marginal); // less negative than marginal
		expect(adjZ1Z2).toBeCloseTo(-0.095, 3); // still negative, near zero
		expect(adjAll).toBeGreaterThan(0); // sign flips
		expect(adjAll).toBeCloseTo(0.176, 3); // reversed disparity
	});
});

describe('ranking scenario', () => {
	const rsigma = rankingScenario.sigma;
	const { oSlots, oBetting, horses, lottery } = rankIndex;
	const Yr = 0;
	const allForms = [oSlots, oBetting, horses, lottery];

	it('uses a positive-definite population correlation matrix', () => {
		expect(isPositiveDefinite(rsigma)).toBe(true);
	});

	it('ranks online slots strongest taken one at a time (marginal)', () => {
		const marg = (i: number) => marginalSlope(rsigma, Yr, i);
		expect(marg(oSlots)).toBeCloseTo(0.5, 10);
		expect(marg(oBetting)).toBeCloseTo(0.48, 10);
		expect(marg(horses)).toBeCloseTo(0.46, 10);
		expect(marg(lottery)).toBeCloseTo(0.3, 10);
		// Online slots leads taken one at a time.
		expect(marg(oSlots)).toBeGreaterThan(marg(horses));
	});

	it('crowns horse betting once all four forms are entered together', () => {
		const beta = regressionCoefficients(rsigma, Yr, allForms);
		expect(beta[0]).toBeCloseTo(0.2887, 3); // online slots, demoted from 0.50
		expect(beta[1]).toBeCloseTo(0.1887, 3); // online betting
		expect(beta[2]).toBeCloseTo(0.391, 3); // horse betting, crowned
		expect(beta[3]).toBeCloseTo(0.2132, 3); // lottery
		// The crude leader (online slots) is overtaken by horse betting.
		expect(beta[2]).toBeGreaterThan(beta[0]);
	});

	it('flips online slots below horse betting once online betting is adjusted for', () => {
		// Online slots leads when only it and horse betting are entered...
		const pair = regressionCoefficients(rsigma, Yr, [oSlots, horses]);
		expect(pair[0]).toBeCloseTo(0.4586, 3); // online slots
		expect(pair[1]).toBeCloseTo(0.4141, 3); // horse betting
		expect(pair[0]).toBeGreaterThan(pair[1]);
		// ...but adjusting for its online twin craters it below horse betting.
		const adj = regressionCoefficients(rsigma, Yr, [oSlots, horses, oBetting]);
		expect(adj[0]).toBeCloseTo(0.2994, 3); // online slots
		expect(adj[1]).toBeCloseTo(0.4101, 3); // horse betting
		expect(adj[1]).toBeGreaterThan(adj[0]);
	});
});

describe('ranking explorable', () => {
	const formIdx = [1, 2, 3, 4]; // oSlots, oBetting, horses, lottery
	const names = ['oSlots', 'oBetting', 'horses', 'lottery'];
	const crown = (q: number, h: number): string => {
		const beta = regressionCoefficients(
			buildRankingSigma({ onlineCorr: q, horsesCorr: h }),
			0,
			formIdx
		);
		return names[beta.indexOf(Math.max(...beta))];
	};

	it('stays positive definite across the slider range', () => {
		const [qLo, qHi] = rankingSliderRanges.onlineCorr;
		const [hLo, hHi] = rankingSliderRanges.horsesCorr;
		for (const q of [qLo, qHi, (qLo + qHi) / 2]) {
			for (const h of [hLo, hHi, (hLo + hHi) / 2]) {
				expect(isPositiveDefinite(buildRankingSigma({ onlineCorr: q, horsesCorr: h }))).toBe(true);
			}
		}
	});

	it('reproduces the scenario sigma at the defaults', () => {
		expect(buildRankingSigma(rankingSliderDefaults)).toEqual(rankingScenario.sigma);
	});

	it('moves the crown with the correlation structure, not the harm links', () => {
		// No online channel: the crude leader (online slots) keeps the top rank.
		expect(crown(0, 0.1)).toBe('oSlots');
		// Default online channel: the two online forms split, horse betting is crowned.
		expect(crown(0.8, 0.1)).toBe('horses');
		// Pull horse betting into the online crowd too and the crown leaves it.
		expect(crown(0.8, 0.6)).toBe('lottery');
	});
});
