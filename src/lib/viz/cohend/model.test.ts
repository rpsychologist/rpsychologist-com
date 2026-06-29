import { describe, expect, it } from 'vitest';
import { cohenD, cles, effectSizes, nnt, overlap, u3 } from './model';

describe('cohenD', () => {
	it('standardizes the mean difference', () => {
		expect(cohenD(100, 112, 15)).toBeCloseTo(0.8, 10);
	});
});

// Reference values for d = 0.8 as published by the original tool: U3 ≈ 78.8%,
// overlap ≈ 68.9%, probability of superiority ≈ 71.4%.
describe('effect sizes at d = 0.8', () => {
	it('U3 ≈ 0.788', () => {
		expect(u3(0.8)).toBeCloseTo(0.7881, 4);
	});

	it('overlap ≈ 0.689', () => {
		expect(overlap(0.8)).toBeCloseTo(0.6892, 4);
	});

	it('CLES ≈ 0.714', () => {
		expect(cles(0.8)).toBeCloseTo(0.7142, 4);
	});

	it('NNT ≈ 3.53 at CER = 0.2', () => {
		expect(nnt(0.8, 0.2)).toBeCloseTo(3.529, 2);
	});
});

describe('degenerate case d = 0 (no effect)', () => {
	it('U3, overlap, and CLES take their no-effect values', () => {
		expect(u3(0)).toBeCloseTo(0.5, 7);
		expect(overlap(0)).toBeCloseTo(1, 7);
		expect(cles(0)).toBeCloseTo(0.5, 7);
	});

	it('NNT is infinite', () => {
		expect(nnt(0, 0.2)).toBe(Infinity);
	});
});

describe('symmetry', () => {
	it('overlap depends only on |d|', () => {
		expect(overlap(-0.8)).toBeCloseTo(overlap(0.8), 12);
	});

	it('U3 and CLES are symmetric about 0.5', () => {
		expect(u3(-0.8)).toBeCloseTo(1 - u3(0.8), 7);
		expect(cles(-0.8)).toBeCloseTo(1 - cles(0.8), 7);
	});
});

describe('effectSizes bundles the four quantities', () => {
	it('agrees with the individual functions', () => {
		const e = effectSizes(0.5, 0.2);
		expect(e.u3).toBeCloseTo(u3(0.5), 12);
		expect(e.overlap).toBeCloseTo(overlap(0.5), 12);
		expect(e.cles).toBeCloseTo(cles(0.5), 12);
		expect(e.nnt).toBeCloseTo(nnt(0.5, 0.2), 12);
	});
});
