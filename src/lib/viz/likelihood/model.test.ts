import { describe, expect, it } from 'vitest';
import {
	gradientAscentStep,
	hessSigma2Observed,
	hessSigma2Expected,
	infoMu,
	likelihoodIntervalMu,
	LL_DROP_95,
	logLikGrid,
	logLikPoint,
	logLikSum,
	lrTest,
	MU_MAX,
	MU_MIN,
	newtonStep,
	quadraticApprox,
	relLogLik,
	scoreMu,
	scoreSigma2,
	scoreTest,
	sumSquares,
	contourRingsToPath,
	waldIntervalMu,
	waldTest
} from './model';
import { mean } from '../../stats/descriptive';

// The old app's deterministic first-paint dataset. Reference values computed
// in R (options(digits = 16)) — see comments on each assertion.
const Y = [78.0, 95.5, 100.3, 100.6, 102.8, 107.8, 109.1, 110.8, 113.9, 125.0];
const N = Y.length;
const MU_HAT = 104.38; // mean(y)
const SS = 1399.196; // sum((y - mean(y))^2)
const SIGMA2_HAT = 139.9196; // SS/10

describe('log-likelihood', () => {
	it('matches R on the default sample', () => {
		expect(mean(Y)).toBeCloseTo(MU_HAT, 12);
		expect(sumSquares(Y, MU_HAT)).toBeCloseTo(SS, 9);
		// sum(dnorm(y, 80, 10, log = TRUE))
		expect(logLikSum(Y, 80, 100)).toBeCloseTo(-68.93043626198718, 10);
		// sum(dnorm(y, muHat, sqrt(sigma2Hat), log = TRUE))
		expect(logLikSum(Y, MU_HAT, SIGMA2_HAT)).toBeCloseTo(-38.89472519169581, 10);
	});

	it('sums the per-observation contributions', () => {
		const total = Y.reduce((acc, y) => acc + logLikPoint(y, 80, 100), 0);
		expect(total).toBeCloseTo(logLikSum(Y, 80, 100), 10);
	});

	it('is maximized at the MLEs', () => {
		const llMax = logLikSum(Y, MU_HAT, SIGMA2_HAT);
		for (const [dm, ds] of [
			[1, 0],
			[-1, 0],
			[0, 10],
			[0, -10],
			[0.5, 5]
		]) {
			expect(logLikSum(Y, MU_HAT + dm, SIGMA2_HAT + ds)).toBeLessThan(llMax);
		}
	});
});

describe('derivatives', () => {
	it('score and information have their closed forms', () => {
		expect(scoreMu(N, 90, MU_HAT, 200)).toBeCloseTo((10 / 200) * (MU_HAT - 90), 12);
		expect(infoMu(N, 200)).toBeCloseTo(10 / 200, 12);
	});

	it('scoreMu and scoreSigma2 vanish at the MLEs', () => {
		expect(scoreMu(N, MU_HAT, MU_HAT, SIGMA2_HAT)).toBeCloseTo(0, 10);
		expect(scoreSigma2(Y, MU_HAT, SIGMA2_HAT)).toBeCloseTo(0, 10);
	});

	it('scores match numerical first differences of logLikSum', () => {
		const h = 1e-5;
		const dMu = (logLikSum(Y, 90 + h, 200) - logLikSum(Y, 90 - h, 200)) / (2 * h);
		expect(scoreMu(N, 90, MU_HAT, 200)).toBeCloseTo(dMu, 5);
		const dS2 = (logLikSum(Y, 90, 200 + h) - logLikSum(Y, 90, 200 - h)) / (2 * h);
		expect(scoreSigma2(Y, 90, 200)).toBeCloseTo(dS2, 5);
	});

	it('hessSigma2Observed matches the numerical second difference (old formula was wrong)', () => {
		const h = 1e-3;
		const num =
			(logLikSum(Y, 90, 200 + h) - 2 * logLikSum(Y, 90, 200) + logLikSum(Y, 90, 200 - h)) / (h * h);
		expect(hessSigma2Observed(Y, 90, 200)).toBeCloseTo(num, 4);
	});

	it('expected information for sigma2 is −n/(2σ⁴)', () => {
		expect(hessSigma2Expected(N, 200)).toBeCloseTo(-10 / (2 * 200 ** 2), 15);
	});

	it('quadraticApprox reproduces ℓ exactly in μ (quadratic direction)', () => {
		// ℓ(μ) at fixed σ² is exactly quadratic, so the 2nd-order Taylor
		// expansion around any point is exact.
		const sigma2 = 150;
		const mu0 = 95;
		const ll = logLikSum(Y, mu0, sigma2);
		const grad = scoreMu(N, mu0, MU_HAT, sigma2);
		const hess = -infoMu(N, sigma2);
		for (const t of [-10, -2, 3, 12]) {
			expect(quadraticApprox(t, ll, grad, hess)).toBeCloseTo(logLikSum(Y, mu0 + t, sigma2), 8);
		}
	});

	it('relLogLik peaks at 0 when x = μ', () => {
		expect(relLogLik(N, 100, 100, 150)).toBeCloseTo(0, 15);
		expect(relLogLik(N, 100, 90, 150)).toBeLessThan(0);
	});
});

describe('optimizers', () => {
	const sampleZ = Y.map((y) => (y - MU_HAT) / Math.sqrt(SIGMA2_HAT));

	it('gradient ascent fixes the MLE point and reports convergence', () => {
		const r = gradientAscentStep(sampleZ, MU_HAT, SIGMA2_HAT, { mu: MU_HAT, sigma2: SIGMA2_HAT });
		expect(r.converged).toBe(true);
		expect(r.next.mu).toBeCloseTo(MU_HAT, 8);
		expect(r.next.sigma2).toBeCloseTo(SIGMA2_HAT, 6);
	});

	it('gradient ascent converges to the MLEs from the default start', () => {
		let cur = { mu: 80, sigma2: 100 };
		let converged = false;
		let i = 0;
		for (; i < 1000 && !converged; i++) {
			const r = gradientAscentStep(sampleZ, MU_HAT, SIGMA2_HAT, cur);
			cur = r.next;
			converged = r.converged;
		}
		expect(converged).toBe(true);
		expect(cur.mu).toBeCloseTo(MU_HAT, 2);
		expect(cur.sigma2).toBeCloseTo(SIGMA2_HAT, 1);
	});

	it('newton lands on μ̂ in one step (quadratic in μ)', () => {
		const r = newtonStep(Y, MU_HAT, SIGMA2_HAT, { mu: 80, sigma2: 100 });
		expect(r.next.mu).toBeCloseTo(MU_HAT, 10);
	});

	it('newton converges to both MLEs in a few steps', () => {
		let cur = { mu: 80, sigma2: 100 };
		let converged = false;
		let i = 0;
		for (; i < 100 && !converged; i++) {
			const r = newtonStep(Y, MU_HAT, SIGMA2_HAT, cur);
			cur = r.next;
			converged = r.converged;
		}
		expect(converged).toBe(true);
		expect(cur.mu).toBeCloseTo(MU_HAT, 4);
		expect(cur.sigma2).toBeCloseTo(SIGMA2_HAT, 4);
		expect(i).toBeLessThan(50);
	});
});

describe('tests (R-pinned at muNull = 90, n = 10)', () => {
	const SIGMA2_NULL = 346.704; // sum((y - 90)^2)/10

	it('sigma2 under the null', () => {
		expect(sumSquares(Y, 90) / N).toBeCloseTo(SIGMA2_NULL, 9);
	});

	it('LRT', () => {
		const { stat, pval } = lrTest(SIGMA2_HAT, SIGMA2_NULL, N);
		expect(stat).toBeCloseTo(9.074034180467834, 8);
		expect(pval).toBeCloseTo(0.002592644711662684, 8);
	});

	it('LRT equals −2 times the log-likelihood drop', () => {
		const llNull = logLikSum(Y, 90, SIGMA2_NULL);
		const llHat = logLikSum(Y, MU_HAT, SIGMA2_HAT);
		expect(lrTest(SIGMA2_HAT, SIGMA2_NULL, N).stat).toBeCloseTo(-2 * (llNull - llHat), 8);
	});

	it('Wald', () => {
		const { z, pval } = waldTest(MU_HAT, 90, SIGMA2_HAT, N);
		expect(z).toBeCloseTo(3.844320686455949, 8);
		expect(pval).toBeCloseTo(0.0001208868393656211, 7);
	});

	it('Score', () => {
		const u = scoreMu(N, 90, MU_HAT, SIGMA2_NULL);
		const info = infoMu(N, SIGMA2_NULL);
		expect(u).toBeCloseTo(0.4147630255203285, 10);
		expect(info).toBeCloseTo(0.0288430476717892, 12);
		const { stat, pval } = scoreTest(u, info);
		expect(stat).toBeCloseTo(5.964292306982323, 8);
		expect(pval).toBeCloseTo(0.0145984586786089, 8);
	});

	it('statistics scale with the hypothetical n at fixed estimates', () => {
		expect(lrTest(SIGMA2_HAT, SIGMA2_NULL, 30).stat).toBeCloseTo(
			3 * lrTest(SIGMA2_HAT, SIGMA2_NULL, 10).stat,
			10
		);
		expect(waldTest(MU_HAT, 90, SIGMA2_HAT, 30).z).toBeCloseTo(
			Math.sqrt(3) * waldTest(MU_HAT, 90, SIGMA2_HAT, 10).z,
			10
		);
	});
});

describe('intervals', () => {
	it('likelihood interval equals the Wald CI at σ² = σ̂² (χ²₁(0.95)/2 = z²/2)', () => {
		const li = likelihoodIntervalMu(MU_HAT, SIGMA2_HAT, N);
		const wald = waldIntervalMu(MU_HAT, SIGMA2_HAT, N);
		expect(li[0]).toBeCloseTo(wald[0], 6);
		expect(li[1]).toBeCloseTo(wald[1], 6);
	});

	it('endpoints sit exactly at the 1.92 drop on the drawn slice', () => {
		const sigma2 = 100; // deliberately not σ̂²
		const [lo, hi] = likelihoodIntervalMu(MU_HAT, sigma2, N);
		const target = logLikSum(Y, MU_HAT, sigma2) - LL_DROP_95;
		expect(logLikSum(Y, lo, sigma2)).toBeCloseTo(target, 8);
		expect(logLikSum(Y, hi, sigma2)).toBeCloseTo(target, 8);
	});
});

describe('grid and contour path', () => {
	it('grid peaks near the MLEs and spans the fixed frame', () => {
		const g = logLikGrid(Y);
		expect(g.cols).toBe(100);
		expect(g.rows).toBe(100);
		expect(g.muMin).toBe(MU_MIN);
		expect(g.muMin + g.cols * g.muStep).toBeCloseTo(MU_MAX, 10);
		// The grid max can't exceed the true max and should get close to it.
		const llMax = logLikSum(Y, MU_HAT, SIGMA2_HAT);
		expect(g.max).toBeLessThanOrEqual(llMax);
		expect(g.max).toBeGreaterThan(llMax - 0.5);
	});

	it('serializes rings through the coordinate transforms', () => {
		const ring = [
			[0, 0],
			[10, 0],
			[10, 10]
		];
		const d = contourRingsToPath(
			[[ring]],
			(x) => x * 2,
			(y) => 100 - y
		);
		expect(d).toBe('M0.00,100.00L20.00,100.00L20.00,90.00Z');
	});
});
