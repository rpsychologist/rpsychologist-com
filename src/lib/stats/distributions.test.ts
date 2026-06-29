import { describe, expect, it } from 'vitest';
import { normalCdf, normalPdf, normalQuantile } from './distributions';

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
