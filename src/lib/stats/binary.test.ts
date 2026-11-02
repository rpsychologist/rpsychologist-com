import { describe, expect, it } from 'vitest';
import {
	calibrateToMarginal,
	calibrateToStrata,
	caseControlSample,
	effects,
	effectsFromCounts,
	expit,
	gaussianAverage,
	logit,
	marginalOr,
	marginalRisk,
	orFromRr,
	p1FromOr,
	p1FromRr,
	rrFromOr,
	standardize,
	stratifiedRisk,
	zlaAttenuation
} from './binary';
import { normalCdf } from './distributions';

const P_GRID = [0.001, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9];

describe('expit / logit', () => {
	it('round-trips', () => {
		for (const p of P_GRID) expect(expit(logit(p))).toBeCloseTo(p, 12);
	});

	it('stays finite for extreme inputs', () => {
		expect(expit(800)).toBe(1);
		expect(expit(-800)).toBe(0);
	});
});

describe('effects', () => {
	it('gives the running example exactly', () => {
		const e = effects(0.3, 0.5);
		expect(e.rd).toBeCloseTo(0.2, 12);
		expect(e.rr).toBeCloseTo(5 / 3, 12);
		expect(e.or).toBeCloseTo(7 / 3, 12);
		expect(e.nnt).toBeCloseTo(5, 12);
	});

	it('agrees with counts', () => {
		expect(effectsFromCounts({ e1: 40, n1: 80, e0: 24, n0: 80 }).or).toBeCloseTo(7 / 3, 12);
	});

	it('satisfies OR = RR (1 - p0) / (1 - p1)', () => {
		for (const p0 of P_GRID) {
			for (const or of [0.25, 0.5, 2, 4]) {
				const p1 = p1FromOr(p0, or);
				const e = effects(p0, p1);
				expect(e.or).toBeCloseTo((e.rr * (1 - p0)) / (1 - p1), 9);
				expect(e.or).toBeCloseTo(or, 9);
			}
		}
	});

	it('puts the OR at least as far from 1 as the RR, in both directions', () => {
		for (const p0 of P_GRID) {
			for (const or of [0.25, 0.5, 0.9, 1.1, 2, 4]) {
				const e = effects(p0, p1FromOr(p0, or));
				expect(Math.abs(Math.log(e.or))).toBeGreaterThanOrEqual(Math.abs(Math.log(e.rr)));
			}
		}
	});

	it('approximates the RR when the outcome is rare', () => {
		const e = effects(0.001, p1FromRr(0.001, 1.6));
		expect(Math.abs(e.or / e.rr - 1)).toBeLessThan(0.001);
	});

	it('inverts the OR, but not the RR, when the outcome is recoded', () => {
		const e = effects(0.3, 0.5);
		const flip = effects(0.7, 0.5);
		expect(flip.or).toBeCloseTo(1 / e.or, 12);
		expect(flip.rr).toBeCloseTo(5 / 7, 12);
		expect(flip.rr).not.toBeCloseTo(1 / e.rr, 3);
	});
});

describe('OR <-> RR conversion', () => {
	it('round-trips and matches the direct computation', () => {
		for (const p0 of P_GRID) {
			for (const or of [0.5, 2, 4]) {
				const rr = rrFromOr(or, p0);
				expect(rr).toBeCloseTo(effects(p0, p1FromOr(p0, or)).rr, 9);
				expect(orFromRr(rr, p0)).toBeCloseTo(or, 9);
			}
		}
	});

	it('cannot exceed 1 / p0', () => {
		expect(rrFromOr(1e6, 0.25)).toBeLessThan(4);
		expect(rrFromOr(1e6, 0.25)).toBeCloseTo(4, 4);
	});
});

describe('standardize', () => {
	it('recovers the pooled risks of the running example', () => {
		const m = standardize([
			{ w: 1, p0: 0.5, p1: 0.75 },
			{ w: 1, p0: 0.1, p1: 0.25 }
		]);
		expect(m.p0).toBeCloseTo(0.3, 12);
		expect(m.p1).toBeCloseTo(0.5, 12);
	});
});

describe('caseControlSample', () => {
	const t = { e1: 40, n1: 80, e0: 24, n0: 80 };

	it('leaves the OR unchanged for any sampling fractions', () => {
		for (const [fc, fn] of [
			[1, 1],
			[1, 0.25],
			[0.3, 0.9],
			[1, 1 / 8]
		]) {
			expect(effectsFromCounts(caseControlSample(t, fc, fn)).or).toBeCloseTo(7 / 3, 12);
		}
	});

	it('biases the RR unless both outcomes are sampled at the same rate', () => {
		expect(effectsFromCounts(caseControlSample(t, 0.5, 0.5)).rr).toBeCloseTo(5 / 3, 12);
		expect(effectsFromCounts(caseControlSample(t, 1, 0.25)).rr).toBeCloseTo(0.8 / (24 / 38), 12);
	});
});

describe('marginalization over a normal covariate', () => {
	it('integrates accurately (probit identity)', () => {
		// E[Phi(a + sigma Z)] = Phi(a / sqrt(1 + sigma^2)); the tolerance is set by
		// normalCdf's own ~1.5e-7 error, not the quadrature.
		for (const a of [-2, 0, 0.7]) {
			for (const s of [0.5, 1, 3]) {
				const exact = normalCdf(a / Math.sqrt(1 + s * s));
				expect(gaussianAverage((x) => normalCdf(x), a, s)).toBeCloseTo(exact, 6);
			}
		}
	});

	it('reduces to expit without a covariate', () => {
		expect(marginalRisk(0.4, 0)).toBe(expit(0.4));
	});

	it('attenuates the OR toward 1, more so as sigma grows', () => {
		const betaT = Math.log(3);
		let prev = 3;
		for (const s of [0.5, 1, 2, 3]) {
			const { or } = marginalOr(logit(0.3), betaT, s);
			expect(or).toBeGreaterThan(1);
			expect(or).toBeLessThan(prev);
			prev = or;
		}
	});

	it('is approximated by Zeger-Liang-Albert to within 8% for sigma <= 3', () => {
		// Empirical tolerance: the ratio of exact to approximate attenuation
		// measured ~3% at sigma = 1 and ~7% at sigma = 3.
		for (const s of [1, 2, 3]) {
			const { beta0, betaT } = calibrateToMarginal(0.3, 0.5, 0);
			const exact = Math.log(marginalOr(beta0, betaT, s).or) / betaT;
			expect(Math.abs(exact / zlaAttenuation(s) - 1)).toBeLessThan(0.08);
		}
	});

	it('calibrates conditional coefficients to fixed marginal risks', () => {
		for (const s of [0, 1, 2.5]) {
			const { beta0, betaT } = calibrateToMarginal(0.3, 0.5, s);
			const m = marginalOr(beta0, betaT, s);
			expect(m.p0).toBeCloseTo(0.3, 8);
			expect(m.p1).toBeCloseTo(0.5, 8);
			if (s === 0) expect(betaT).toBeCloseTo(Math.log(7 / 3), 8);
			else expect(betaT).toBeGreaterThan(Math.log(7 / 3));
		}
	});
});

describe('calibrateToStrata', () => {
	it('reproduces the strata of the running example at delta = log 3', () => {
		// Mild 50% vs 75%, severe 10% vs 25%: an OR of exactly 3 in each stratum.
		const d = Math.log(3);
		const { beta0, betaT } = calibrateToStrata(0.3, 0.5, d);
		expect(betaT).toBeCloseTo(Math.log(3), 10);
		expect(expit(beta0 + d)).toBeCloseTo(0.5, 10);
		expect(expit(beta0 - d)).toBeCloseTo(0.1, 10);
		expect(expit(beta0 + betaT + d)).toBeCloseTo(0.75, 10);
		expect(expit(beta0 + betaT - d)).toBeCloseTo(0.25, 10);
	});

	it('holds the trial fixed while the stratum OR grows with delta', () => {
		let prev = 0;
		for (const d of [0, 0.5, 1, 2, 3]) {
			const { beta0, betaT } = calibrateToStrata(0.3, 0.5, d);
			expect(stratifiedRisk(beta0, d)).toBeCloseTo(0.3, 10);
			expect(stratifiedRisk(beta0 + betaT, d)).toBeCloseTo(0.5, 10);
			if (d === 0) expect(betaT).toBeCloseTo(Math.log(7 / 3), 10);
			else expect(betaT).toBeGreaterThan(prev);
			prev = betaT;
		}
	});
});
