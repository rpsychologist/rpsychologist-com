import { describe, expect, it } from 'vitest';
import { covariance, mean, sampleSd, sampleVariance } from './descriptive';

// Anscombe's first quartet (Anscombe, 1973) — published moments pin the
// n-1 denominators the correlation app depends on.
const x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
const y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];

describe('descriptive statistics', () => {
	it('mean matches published Anscombe values', () => {
		expect(mean(x)).toBeCloseTo(9, 10);
		expect(mean(y)).toBeCloseTo(7.500909, 6);
	});

	it('sample variance uses the n-1 denominator', () => {
		expect(sampleVariance(x)).toBeCloseTo(11, 10);
		expect(sampleVariance(y)).toBeCloseTo(4.127269, 6);
	});

	it('sampleSd is the square root of the sample variance', () => {
		expect(sampleSd(x)).toBeCloseTo(Math.sqrt(11), 10);
	});

	it('covariance matches Pearson r ~ 0.8164 for Anscombe I', () => {
		const r = covariance(x, y) / (sampleSd(x) * sampleSd(y));
		expect(covariance(x, y)).toBeCloseTo(5.501, 3);
		expect(r).toBeCloseTo(0.81642, 5);
	});

	it('covariance of a variable with itself is its variance', () => {
		expect(covariance(y, y)).toBeCloseTo(sampleVariance(y), 12);
	});
});
