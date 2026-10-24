import { describe, expect, it } from 'vitest';
import {
	chi2Quantile2,
	recorrelate,
	rescaleBounds,
	sampleStats,
	toCsv,
	vennOverlapDistance,
	type BaseSample,
	type Point
} from './model';
import { anscombe1, anscombe2, anscombe3, anscombe4, anscombosaurus } from './datasets';
import { mean, sampleSd } from '../../stats/descriptive';

// A small fixed "sample" standing in for the app's random draw — arbitrary
// values, deterministic tests.
function baseSample(): BaseSample {
	const x = [98.2, 103.4, 95.1, 100.9, 107.3, 92.8, 101.5, 99.0, 104.2, 96.6];
	const y = [101.1, 98.7, 100.4, 102.9, 97.5, 99.8, 103.3, 96.2, 100.0, 101.9];
	return {
		x,
		y,
		muHatX: mean(x),
		muHatY: mean(y),
		sigmaHatX: sampleSd(x),
		sigmaHatY: sampleSd(y)
	};
}

describe('sampleStats', () => {
	it('reproduces the published Anscombe quartet statistics', () => {
		// Anscombe (1973): all four sets share r ~ 0.816, y = 3.00 + 0.500x.
		for (const data of [anscombe1, anscombe2, anscombe3, anscombe4]) {
			const s = sampleStats(data);
			expect(s.cor).toBeCloseTo(0.816, 2);
			expect(s.slope).toBeCloseTo(0.5, 2);
			expect(s.intercept).toBeCloseTo(3.0, 1);
			expect(s.muHatNewX).toBeCloseTo(9, 1);
			expect(s.muHatNewY).toBeCloseTo(7.5, 1);
		}
	});

	it('clamps cor to [-1, 1] on collinear data', () => {
		// These x values are chosen so the raw cov/(sx·sy) ratio lands at
		// 1 + 2.2e-16; unclamped, sqrt(1 - cor) goes NaN and the SVG ellipse's
		// invalid radius falls back to `auto` — rendering a full circle (the
		// "flashing ellipse at rho = ±1" bug).
		const x = [
			95, 103.63917525773196, 101.96907216494846, 100.29896907216495, 98.62886597938144,
			96.95876288659794, 95.28865979381443, 103.9278350515464
		];
		const up: Point[] = x.map((v) => [v, v * 3 + 10]);
		const down: Point[] = x.map((v) => [v, -v * 3 + 10]);
		// Raw ratios land at 1 + 2.2e-16 and -1 - 2.2e-16; only the clamp makes
		// these exact.
		expect(sampleStats(up).cor).toBe(1);
		expect(sampleStats(down).cor).toBe(-1);
		expect(Math.sqrt(1 - sampleStats(up).cor)).toBe(0);
		expect(Math.sqrt(1 + sampleStats(down).cor)).toBe(0);
	});

	it('matches the datasaurus summary statistics', () => {
		// The old app's copy is a 141-point variant of the canonical 142-point
		// datasaurus, so these pins are computed from the copied data itself.
		const s = sampleStats(anscombosaurus);
		expect(s.muHatNewX).toBeCloseTo(54.2553, 3);
		expect(s.muHatNewY).toBeCloseTo(47.4823, 3);
		expect(s.cor).toBeCloseTo(-0.06615, 4);
	});
});

describe('recorrelate', () => {
	it('produces a sample correlation of exactly rho', () => {
		for (const rho of [-0.99, -0.5, 0, 0.123, 0.8, 0.99]) {
			const { cor } = recorrelate(baseSample(), rho, 100, 100, 5, 3);
			expect(cor).toBeCloseTo(rho, 10);
		}
	});

	it('hits the requested moments exactly', () => {
		// Standardizing by the sample moments makes the transformed means/SDs
		// equal the targets, not just approach them.
		const d = recorrelate(baseSample(), 0.5, 100, 50, 5, 3);
		expect(d.muHatNewX).toBeCloseTo(100, 10);
		expect(d.sigmaHatNewX).toBeCloseTo(5, 10);
		expect(d.muHatNewY).toBeCloseTo(50, 10);
		expect(d.sigmaHatNewY).toBeCloseTo(3, 10);
	});

	it('is deterministic: same sample and rho give the same points', () => {
		const a = recorrelate(baseSample(), 0.42, 100, 100, 5, 3);
		const b = recorrelate(baseSample(), 0.42, 100, 100, 5, 3);
		expect(a.data).toEqual(b.data);
	});

	it('stays finite when the base sample is perfectly collinear', () => {
		// Same x values as the clamp test above: the standardized covariance of
		// (x, 3x + 10) computes to 1 + 2.2e-16, so without the whitening clamp
		// d = sqrt(1 - c²) is NaN and every output coordinate is NaN (a loaded
		// y = a·x + b CSV then any slider move destroyed the old app's chart).
		const x = [
			95, 103.63917525773196, 101.96907216494846, 100.29896907216495, 98.62886597938144,
			96.95876288659794, 95.28865979381443, 103.9278350515464
		];
		const y = x.map((v) => v * 3 + 10);
		const sample: BaseSample = {
			x,
			y,
			muHatX: mean(x),
			muHatY: mean(y),
			sigmaHatX: sampleSd(x),
			sigmaHatY: sampleSd(y)
		};
		const { data } = recorrelate(sample, 0.5, 100, 100, 5, 3);
		expect(data.every(([px, py]) => Number.isFinite(px) && Number.isFinite(py))).toBe(true);
	});

	it('rho = 1 maps y onto a perfect line', () => {
		const { data, slope, intercept } = recorrelate(baseSample(), 1, 100, 100, 5, 3);
		for (const [x, y] of data) {
			expect(y).toBeCloseTo(intercept + slope * x, 8);
		}
	});
});

describe('rescaleBounds', () => {
	it('frames the sample at mean +/- 4 SD', () => {
		const s = sampleStats(anscombe1);
		const b = rescaleBounds(s);
		expect(b.xMin).toBeCloseTo(s.muHatNewX - 4 * s.sigmaHatNewX, 12);
		expect(b.xMax).toBeCloseTo(s.muHatNewX + 4 * s.sigmaHatNewX, 12);
		expect(b.yMin).toBeCloseTo(s.muHatNewY - 4 * s.sigmaHatNewY, 12);
		expect(b.yMax).toBeCloseTo(s.muHatNewY + 4 * s.sigmaHatNewY, 12);
	});
});

describe('chi2Quantile2', () => {
	it('matches jstat.chisquare.inv(p, 2)', () => {
		expect(chi2Quantile2(0.5)).toBeCloseTo(1.3862943611198906, 12);
		expect(chi2Quantile2(0.8)).toBeCloseTo(3.2188758248682006, 12);
		expect(chi2Quantile2(0.95)).toBeCloseTo(5.991464547107982, 12);
		// The old Ellipse.js hard-codes 9.21034 for the .99 level.
		expect(chi2Quantile2(0.99)).toBeCloseTo(9.21034037197618, 5);
	});
});

describe('vennOverlapDistance', () => {
	// The caller places circle centers 2r - 2*result apart.
	const lensArea = (s: number, r: number) =>
		2 * r * r * Math.acos(s / (2 * r)) - (s / 2) * Math.sqrt(4 * r * r - s * s);

	it('is 0 at rho = 0 (tangent circles, no overlap)', () => {
		expect(vennOverlapDistance(0, 100)).toBe(0);
	});

	it('fully overlaps the circles at |rho| = 1', () => {
		expect(vennOverlapDistance(1, 100)).toBeCloseTo(100, 6);
		expect(vennOverlapDistance(-1, 100)).toBeCloseTo(100, 6);
	});

	it('makes the intersection area rho^2 of one circle', () => {
		const r = 100;
		for (const rho of [0.25, 0.5, 0.816, 0.95]) {
			const sep = 2 * r - 2 * vennOverlapDistance(rho, r);
			expect(lensArea(sep, r) / (Math.PI * r * r)).toBeCloseTo(rho * rho, 6);
		}
	});
});

describe('toCsv', () => {
	it('quotes the header labels and joins rows (old saveCsv format)', () => {
		const data: Point[] = [
			[1, 2],
			[3.5, 4.25]
		];
		expect(toCsv(data, 'x', 'my y')).toBe('"x","my y"\n1,2\n3.5,4.25');
	});
});
