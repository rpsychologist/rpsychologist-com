import { describe, expect, it } from 'vitest';
import { groupIntoCells, makeCellsData, pooledSlope, withinCellSlope } from './cells';

describe('adjustment cells', () => {
	const points = makeCellsData();

	it('pooled slope tracks the population marginal gradient (~-0.48)', () => {
		// Same population as the specification curve, so the pooled slope is the
		// marginal income gradient in harm up to sampling noise.
		expect(pooledSlope(points)).toBeCloseTo(-0.461, 3);
	});

	it('within-cell slope shrinks monotonically toward zero as covariates are added', () => {
		const s0 = withinCellSlope(points, [0]);
		const s1 = withinCellSlope(points, [0, 1]);
		const s2 = withinCellSlope(points, [0, 1, 2]);
		expect(s0).toBeCloseTo(-0.349, 3);
		expect(s1).toBeCloseTo(-0.207, 3);
		expect(s2).toBeCloseTo(-0.103, 3);
		// Negative throughout, rising toward zero as more covariates are held fixed.
		expect(s0).toBeLessThan(s1);
		expect(s1).toBeLessThan(s2);
	});

	it('dichotomized adjustment is too loose to reproduce the continuous reversal', () => {
		// The continuous fully-adjusted partial coefficient reverses sign to about
		// +0.18 (scenarios.ts). Binning each covariate into two coarse levels leaves
		// residual confounding inside each cell, so the within-cell slope only collapses
		// toward zero (~-0.10) -- it does NOT flip. Coarse strata under-adjust.
		const within = withinCellSlope(points, [0, 1, 2]);
		expect(within).toBeLessThan(0); // has not reversed
		expect(within).toBeGreaterThan(pooledSlope(points)); // but far flatter than pooled
	});

	it('the number of cells doubles with each binary covariate', () => {
		expect(groupIntoCells(points, []).length).toBe(1);
		expect(groupIntoCells(points, [0]).length).toBe(2);
		expect(groupIntoCells(points, [0, 1]).length).toBe(4);
		expect(groupIntoCells(points, [0, 1, 2]).length).toBe(8);
	});

	it('cells partition the sample (no points lost)', () => {
		const total = groupIntoCells(points, [0, 1, 2]).reduce((s, c) => s + c.points.length, 0);
		expect(total).toBe(points.length);
	});
});
