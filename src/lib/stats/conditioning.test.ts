import { describe, expect, it } from 'vitest';
import { makeConditioningData } from './conditioning';

describe('conditioning (Simpson) data', () => {
	const d = makeConditioningData();

	it('has a steep negative pooled slope (lower income, more harm)', () => {
		expect(d.pooledSlope).toBeCloseTo(-0.51, 2);
	});

	it("reverses to a positive within-stratum slope (Simpson's paradox)", () => {
		// Holding comorbidity burden fixed, the income->harm slope is positive: the
		// pooled gradient and the within-stratum gradient point in OPPOSITE directions.
		expect(d.withinSlope).toBeCloseTo(0.28, 3);
		expect(d.pooledSlope).toBeLessThan(0);
		expect(d.withinSlope).toBeGreaterThan(0);
	});

	it('draws parallel within-stratum lines (additive adjustment, common slope)', () => {
		for (const line of d.strataLines) {
			expect(line.slope).toBeCloseTo(d.withinSlope, 12);
		}
	});

	it('is deterministic across calls', () => {
		expect(makeConditioningData().pooledSlope).toBeCloseTo(d.pooledSlope, 12);
	});
});
