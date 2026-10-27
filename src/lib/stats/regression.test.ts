import { describe, expect, it } from 'vitest';
import { solveLinearSystem } from './linalg';

describe('solveLinearSystem', () => {
	it('solves a hand-checked 2x2 system', () => {
		// [[2,1],[1,3]] x = [3,5]  ->  x = [0.8, 1.4]
		const x = solveLinearSystem(
			[
				[2, 1],
				[1, 3]
			],
			[3, 5]
		);
		expect(x[0]).toBeCloseTo(0.8, 10);
		expect(x[1]).toBeCloseTo(1.4, 10);
	});

	it('throws on a singular matrix', () => {
		expect(() =>
			solveLinearSystem(
				[
					[1, 2],
					[2, 4]
				],
				[1, 2]
			)
		).toThrow();
	});
});
