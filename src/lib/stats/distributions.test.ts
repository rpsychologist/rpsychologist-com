import { describe, expect, it } from 'vitest';
import { chiSquareCdf, normalCdf, normalPdf, normalQuantile } from './distributions';

describe('normalPdf', () => {
	it('peaks at the mean with the standard-normal height', () => {
		expect(normalPdf(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 10);
	});

	it('is symmetric about the mean', () => {
		expect(normalPdf(-1.3)).toBeCloseTo(normalPdf(1.3), 12);
	});

	it('scales by sd', () => {
		// N(0, 2^2) density at the mean is 1 / (sd * sqrt(2*pi)).
		expect(normalPdf(10, 10, 2)).toBeCloseTo(1 / (2 * Math.sqrt(2 * Math.PI)), 10);
	});
});

describe('normalCdf', () => {
	it('is 0.5 at the mean', () => {
		expect(normalCdf(0)).toBeCloseTo(0.5, 7);
	});

	it('matches known standard-normal values', () => {
		expect(normalCdf(1)).toBeCloseTo(0.8413447, 6);
		expect(normalCdf(1.96)).toBeCloseTo(0.9750021, 6);
		expect(normalCdf(-1)).toBeCloseTo(0.1586553, 6);
	});

	it('honors mean and sd', () => {
		expect(normalCdf(110, 100, 15)).toBeCloseTo(normalCdf(10 / 15), 7);
	});
});

describe('normalQuantile', () => {
	it('inverts the CDF at the median', () => {
		expect(normalQuantile(0.5)).toBeCloseTo(0, 10);
	});

	it('matches known probit values', () => {
		expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
		expect(normalQuantile(0.8413447)).toBeCloseTo(1, 5);
		expect(normalQuantile(0.2)).toBeCloseTo(-0.8416212, 5);
	});

	it('round-trips with normalCdf across the tails', () => {
		for (const z of [-3, -1.5, -0.3, 0.7, 2.2, 3.5]) {
			expect(normalQuantile(normalCdf(z))).toBeCloseTo(z, 6);
		}
	});

	it('returns infinities at the boundaries', () => {
		expect(normalQuantile(0)).toBe(-Infinity);
		expect(normalQuantile(1)).toBe(Infinity);
	});
});

describe('chiSquareCdf', () => {
	// Reference values from R's pchisq (options(digits = 16)).
	it('matches R pchisq at df = 1', () => {
		expect(chiSquareCdf(3.841459, 1)).toBeCloseTo(0.9500000053468043, 10);
		expect(chiSquareCdf(1, 1)).toBeCloseTo(0.682689492137086, 10);
		expect(chiSquareCdf(10, 1)).toBeCloseTo(0.9984345977419975, 10);
		expect(chiSquareCdf(0.5, 1)).toBeCloseTo(0.5204998778130465, 10);
	});

	it('matches the df = 2 closed form 1 - exp(-x/2)', () => {
		for (const x of [0.1, 1, 2, 5, 20]) {
			expect(chiSquareCdf(x, 2)).toBeCloseTo(1 - Math.exp(-x / 2), 12);
		}
		expect(chiSquareCdf(2, 2)).toBeCloseTo(0.6321205588285577, 12);
	});

	it('matches R pchisq on the continued-fraction branch (x >= a + 1)', () => {
		expect(chiSquareCdf(4.351, 5)).toBeCloseTo(0.4999369351326777, 10);
	});

	it('agrees with the erf-based normal CDF via the df = 1 identity', () => {
		// chi2(1) CDF = 2*Phi(sqrt(x)) - 1; normalCdf carries ~1e-7 erf error,
		// so this cross-check is capped at that accuracy, not the gamma code's.
		for (const x of [0.25, 1, 2.5, 6, 9]) {
			expect(chiSquareCdf(x, 1)).toBeCloseTo(2 * normalCdf(Math.sqrt(x)) - 1, 6);
		}
	});

	it('is 0 at and below zero and approaches 1 in the tail', () => {
		expect(chiSquareCdf(0, 1)).toBe(0);
		expect(chiSquareCdf(-3, 4)).toBe(0);
		expect(chiSquareCdf(1000, 1)).toBeCloseTo(1, 12);
	});
});
