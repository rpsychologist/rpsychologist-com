import { describe, expect, it } from 'vitest';
import { drawGaussian } from './random';
import { mean, sampleSd } from './descriptive';

describe('drawGaussian', () => {
	it('returns exactly n draws for even and odd n', () => {
		expect(drawGaussian(10, 0, 1)).toHaveLength(10);
		expect(drawGaussian(11, 0, 1)).toHaveLength(11);
		expect(drawGaussian(1, 0, 1)).toHaveLength(1);
		expect(drawGaussian(0, 0, 1)).toHaveLength(0);
	});

	it('matches the requested moments for a large draw', () => {
		// SE(mean) ~ 5/sqrt(2e5) ~ 0.011; a 0.1 tolerance is ~9 SEs.
		const draws = drawGaussian(200_000, 100, 5);
		expect(mean(draws)).toBeCloseTo(100, 1);
		expect(sampleSd(draws)).toBeCloseTo(5, 1);
	});

	it('produces finite values only', () => {
		expect(drawGaussian(1000, 0, 1).every(Number.isFinite)).toBe(true);
	});
});
