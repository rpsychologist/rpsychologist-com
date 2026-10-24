import { describe, expect, it } from 'vitest';
import {
	gradientAscentStep,
	hessSigma2Observed,
	hessSigma2Expected,
	infoMu,
	LL_DROP_95,
	logLikGrid,
	logLikPoint,
	logLikSum,
	lrTest,
	MU_MAX,
	MU_MIN,
	fisherScoringStep,
	outsideFrame,
	profileMu,
	relLogLik,
	profileIntervalMu,
	relProfileMu,
	scoreMu,
	scoreSigma2,
	scoreTest,
	snapMean,
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

	it('relLogLik peaks at 0 when x = μ', () => {
		expect(relLogLik(N, 100, 100, 150)).toBeCloseTo(0, 15);
		expect(relLogLik(N, 100, 90, 150)).toBeLessThan(0);
	});

	it('relative profile drop is ½·LR, its slope is the score at σ̂₀², and it lies above the slice', () => {
		const muNull = 80;
		const s2Null = sumSquares(Y, muNull) / N;
		// ½·LR at μ₀ = 80: ½·10·ln(σ̂₀²/σ̂²) = 8.289276 in R (the slice would say 21.2).
		expect(-relProfileMu(N, MU_HAT, muNull, SIGMA2_HAT)).toBeCloseTo(
			lrTest(SIGMA2_HAT, s2Null, N).stat / 2,
			10
		);
		expect(-relProfileMu(N, MU_HAT, muNull, SIGMA2_HAT)).toBeCloseTo(8.2893, 3);
		const h = 1e-5;
		const slope =
			(relProfileMu(N, MU_HAT, muNull + h, SIGMA2_HAT) -
				relProfileMu(N, MU_HAT, muNull - h, SIGMA2_HAT)) /
			(2 * h);
		expect(slope).toBeCloseTo(scoreMu(N, muNull, MU_HAT, s2Null), 5);
		for (const x of [30, 80, 104, 150])
			expect(relProfileMu(N, MU_HAT, x, SIGMA2_HAT)).toBeGreaterThanOrEqual(
				relLogLik(N, MU_HAT, x, SIGMA2_HAT) - 1e-12
			);
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

	it('fisher scoring lands on μ̂ in one step (quadratic in μ)', () => {
		const r = fisherScoringStep(Y, MU_HAT, SIGMA2_HAT, { mu: 80, sigma2: 100 });
		expect(r.next.mu).toBeCloseTo(MU_HAT, 10);
	});

	it('fisher scoring converges to both MLEs in a few steps', () => {
		let cur = { mu: 80, sigma2: 100 };
		let converged = false;
		let i = 0;
		for (; i < 100 && !converged; i++) {
			const r = fisherScoringStep(Y, MU_HAT, SIGMA2_HAT, cur);
			cur = r.next;
			converged = r.converged;
		}
		expect(converged).toBe(true);
		expect(cur.mu).toBeCloseTo(MU_HAT, 4);
		expect(cur.sigma2).toBeCloseTo(SIGMA2_HAT, 4);
		expect(i).toBeLessThan(50);
	});
});

describe('gradient ascent step size', () => {
	const sampleZ = Y.map((y) => (y - MU_HAT) / Math.sqrt(SIGMA2_HAT));
	const run = (gamma: number, start: { mu: number; sigma2: number }, cap = 2000) => {
		let cur = start;
		for (let i = 0; i < cap; i++) {
			const r = gradientAscentStep(sampleZ, MU_HAT, SIGMA2_HAT, cur, gamma);
			if (r.converged) return { status: 'converged', steps: i };
			cur = r.next;
			if (outsideFrame(cur)) return { status: 'left', steps: i };
		}
		return { status: 'cap', steps: cap };
	};

	it('the default γ is the frozen 0.05 path', () => {
		const cur = { mu: 80, sigma2: 100 };
		expect(gradientAscentStep(sampleZ, MU_HAT, SIGMA2_HAT, cur)).toEqual(
			gradientAscentStep(sampleZ, MU_HAT, SIGMA2_HAT, cur, 0.05)
		);
	});

	it('small γ crawls, moderate γ climbs, large γ overshoots out of the frame or bounces', () => {
		const start = { mu: 80, sigma2: 100 };
		const tiny = run(0.005, start);
		const ok = run(0.05, start);
		expect(tiny.status).toBe('converged');
		expect(ok.status).toBe('converged');
		expect(tiny.steps).toBeGreaterThan(5 * ok.steps);
		expect(run(0.4, start).status).toBe('left');
		// Started near the peak, a large γ bounces across it and never settles.
		expect(run(0.4, { mu: 104, sigma2: 140 }).status).toBe('cap');
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

// Upper 95% profile limit at n = 10: mu + sqrt(s2 * expm1(qchisq(.95, 1) / 10)),
// R: 112.4752.
const PROFILE_HI_10 = 112.4752265;

describe('intervals', () => {
	it('the Wald CI is where the slice at σ̂² drops 1.92 (χ²₁(0.95)/2 = z²/2)', () => {
		const [lo, hi] = waldIntervalMu(MU_HAT, SIGMA2_HAT, N);
		expect(relLogLik(N, MU_HAT, lo, SIGMA2_HAT)).toBeCloseTo(-LL_DROP_95, 6);
		expect(relLogLik(N, MU_HAT, hi, SIGMA2_HAT)).toBeCloseTo(-LL_DROP_95, 6);
	});

	it('the profile interval sits at the 1.92 drop of the profile and is wider than Wald', () => {
		for (const n of [N, 40]) {
			const [lo, hi] = profileIntervalMu(MU_HAT, SIGMA2_HAT, n);
			expect(relProfileMu(n, MU_HAT, lo, SIGMA2_HAT)).toBeCloseTo(-LL_DROP_95, 10);
			expect(relProfileMu(n, MU_HAT, hi, SIGMA2_HAT)).toBeCloseTo(-LL_DROP_95, 10);
		}
		const prof = profileIntervalMu(MU_HAT, SIGMA2_HAT, N);
		const wald = waldIntervalMu(MU_HAT, SIGMA2_HAT, N);
		expect(prof[1] - prof[0]).toBeGreaterThan(wald[1] - wald[0]);
		expect(prof[1]).toBeCloseTo(PROFILE_HI_10, 4);
		// Converge as n grows (ratio of widths → 1).
		const w = (n: number) =>
			(profileIntervalMu(MU_HAT, SIGMA2_HAT, n)[1] - MU_HAT) /
			(waldIntervalMu(MU_HAT, SIGMA2_HAT, n)[1] - MU_HAT);
		expect(w(1000)).toBeLessThan(w(10));
		expect(w(1000)).toBeCloseTo(1, 2);
	});
});

describe('profile likelihood', () => {
	it('μ-profile peaks at ℓ̂ at μ = μ̂', () => {
		expect(profileMu(Y, MU_HAT)).toBeCloseTo(logLikSum(Y, MU_HAT, SIGMA2_HAT), 10);
	});

	it('μ-profile dominates every fixed-σ² slice', () => {
		for (const mu of [70, 90, MU_HAT, 120]) {
			for (const sigma2 of [50, 100, 139.9196, 400]) {
				expect(profileMu(Y, mu)).toBeGreaterThanOrEqual(logLikSum(Y, mu, sigma2) - 1e-9);
			}
		}
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

describe('snapMean', () => {
	it('shifts the mean to the nearest whole number and keeps the spread', () => {
		const y = snapMean(Y);
		expect(mean(y)).toBeCloseTo(104, 12);
		expect(sumSquares(y, mean(y))).toBeCloseTo(SS, 9);
		y.forEach((v, i) => expect(v - Y[i]).toBeCloseTo(-0.38, 12));
	});
});
