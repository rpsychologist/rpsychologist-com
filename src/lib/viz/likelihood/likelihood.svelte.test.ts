import { describe, expect, it } from 'vitest';
import { defaults, LikelihoodState } from './likelihood.svelte';
import {
	logLikSum,
	lrTest,
	MU_MAX,
	MU_MIN,
	scoreMu,
	scoreTest,
	SIGMA2_MAX,
	SIGMA2_MIN,
	sumSquares,
	waldTest
} from './model';

// The default sample is the R-pinned one in model.test.ts shifted by −0.38
// (snapMean). A shift moves only the location, so values at μ on the default
// sample equal R-checked values at μ + 0.38 on the original.
const ORIGINAL = [78.0, 95.5, 100.3, 100.6, 102.8, 107.8, 109.1, 110.8, 113.9, 125.0];
const SHIFT = 0.38;
const MU_HAT = 104;
const SIGMA2_HAT = 139.9196;

describe('derived sample statistics', () => {
	it('prerenders the real estimates from the fixed default sample', () => {
		const s = new LikelihoodState();
		expect(s.muHat).toBeCloseTo(MU_HAT, 10);
		expect(s.sigma2Hat).toBeCloseTo(SIGMA2_HAT, 8);
		expect(s.ll).toBeCloseTo(logLikSum(ORIGINAL, 80 + SHIFT, 100), 10);
		expect(s.llMax).toBeCloseTo(-38.89472519169581, 10);
	});

	it('recomputes everything when the sample changes', () => {
		const s = new LikelihoodState();
		s.newSample();
		expect(s.p.sample).toHaveLength(10);
		expect(s.muHat).not.toBeCloseTo(MU_HAT, 6);
		// Sorted ascending (old drawSample sorted; SamplePlot relies on it).
		const sorted = [...s.p.sample].sort((a, b) => a - b);
		expect(s.p.sample).toEqual(sorted);
		// σ̂²(μ₀) ≥ σ̂² with equality iff μ₀ = μ̂.
		expect(s.sigma2Null).toBeGreaterThanOrEqual(s.sigma2Hat);
	});

	it('tests match the model at the default null', () => {
		const s = new LikelihoodState();
		s.setMuNull(90);
		const s2Null = sumSquares(ORIGINAL, 90 + SHIFT) / 10;
		const u = scoreMu(10, 90 + SHIFT, MU_HAT + SHIFT, s2Null);
		expect(s.tests.lr.stat).toBeCloseTo(lrTest(SIGMA2_HAT, s2Null, 10).stat, 8);
		expect(s.tests.wald.z).toBeCloseTo(waldTest(MU_HAT + SHIFT, 90 + SHIFT, SIGMA2_HAT, 10).z, 8);
		expect(s.tests.score.stat).toBeCloseTo(scoreTest(u, 10 / s2Null).stat, 8);
	});

	it('every test reads zero with the null at the MLE', () => {
		const s = new LikelihoodState();
		s.setMuNull(MU_HAT);
		expect(s.scoreAtNull).toBeCloseTo(0, 9);
		expect(s.tests.lr.stat).toBeCloseTo(0, 9);
		expect(s.tests.wald.z).toBeCloseTo(0, 9);
		expect(s.tests.score.stat).toBeCloseTo(0, 9);
	});

	it('new samples have a whole-number mean', () => {
		const s = new LikelihoodState();
		for (let i = 0; i < 20; i++) {
			s.newSample();
			expect(s.muHat).toBeCloseTo(Math.round(s.muHat), 9);
		}
	});
});

describe('gradient ascent step size', () => {
	it('a new step size restarts the run from its start', () => {
		const s = new LikelihoodState();
		s.step();
		s.step();
		s.setGamma(0.2);
		expect(s.path).toEqual([]);
		expect(s.p.mu).toBe(defaults.mu);
		expect(s.p.sigma2).toBe(defaults.sigma2);
		expect(s.p.gamma).toBe(0.2);
		s.setGamma(99);
		expect(s.p.gamma).toBe(1);
	});

	it('a step that overshoots the frame ends the run at the frame edge; undo clears it', () => {
		const s = new LikelihoodState();
		s.setGamma(0.4);
		s.start();
		while (s.running) s.step();
		expect(s.diverged).toBe(true);
		expect(s.converged).toBe(false);
		expect(s.p.sigma2).toBeLessThanOrEqual(SIGMA2_MAX);
		const n = s.count;
		s.step(); // no-op once diverged
		expect(s.count).toBe(n);
		s.stepBack();
		expect(s.diverged).toBe(false);
	});
});

describe('next-step preview', () => {
	it('previews exactly the step that step() takes, and hides when there is none', () => {
		const s = new LikelihoodState();
		const preview = s.nextStep!;
		s.step();
		expect(s.p.mu).toBe(preview.mu);
		expect(s.p.sigma2).toBe(preview.sigma2);
		s.setAlgo('none');
		expect(s.nextStep).toBeNull();
		s.setAlgo('fisherScoring');
		s.snapTo('mu');
		s.snapTo('sigma2');
		s.step();
		expect(s.converged).toBe(true);
		expect(s.nextStep).toBeNull();
	});
});

describe('fisher scoring', () => {
	it('lands on the ridge at the starting μ, then on the MLE, even via an off-frame σ²', () => {
		const s = new LikelihoodState();
		s.setAlgo('fisherScoring');
		s.setPoint({ mu: 60, sigma2: 50 }, false);
		s.step();
		// σ² jumps to σ̂²(μ₀) = σ̂² + (μ₀ − μ̂)², past the frame here — not an overshoot stop.
		expect(s.diverged).toBe(false);
		expect(s.p.mu).toBeCloseTo(MU_HAT, 10);
		expect(s.p.sigma2).toBeCloseTo(SIGMA2_HAT + (60 - MU_HAT) ** 2, 8);
		s.step();
		expect(s.converged).toBe(true);
		expect(s.p.sigma2).toBeCloseTo(SIGMA2_HAT, 8);
	});
});

describe('parameter setters', () => {
	it('clamps to the fixed frame', () => {
		const s = new LikelihoodState();
		s.setMu(1e9);
		expect(s.p.mu).toBe(MU_MAX);
		s.setMu(-1e9);
		expect(s.p.mu).toBe(MU_MIN);
		s.setSigma2(0);
		expect(s.p.sigma2).toBe(SIGMA2_MIN);
	});

	it('snapTo jumps a parameter to its MLE', () => {
		const s = new LikelihoodState();
		s.snapTo('mu');
		expect(s.p.mu).toBeCloseTo(MU_HAT, 10);
		s.snapTo('sigma2');
		expect(s.p.sigma2).toBeCloseTo(SIGMA2_HAT, 8);
	});

	it('n is clamped to an integer in [1, 100]', () => {
		const s = new LikelihoodState();
		s.setN(31.4);
		expect(s.p.n).toBe(31);
		s.setN(1e6);
		expect(s.p.n).toBe(100);
		s.setN(-3);
		expect(s.p.n).toBe(1);
	});
});

describe('optimizer bookkeeping', () => {
	it('first step seeds the path with the starting point', () => {
		const s = new LikelihoodState();
		s.step();
		expect(s.count).toBe(1);
		expect(s.path[0]).toEqual({ mu: defaults.mu, sigma2: defaults.sigma2 });
		expect(s.animating).toBe(false); // gradient ascent never tweens
	});

	it('gradient ascent run converges to the MLEs', () => {
		const s = new LikelihoodState();
		s.start();
		expect(s.running).toBe(true);
		while (s.running) s.step();
		expect(s.converged).toBe(true);
		expect(s.p.mu).toBeCloseTo(MU_HAT, 2);
		// GA tolerance 0.001 in z-space ≈ 0.03 in σ² units here.
		expect(s.p.sigma2).toBeCloseTo(SIGMA2_HAT, 1);
		expect(s.count).toBeGreaterThan(1);
		expect(s.count).toBeLessThan(1000);
	});

	it('fisher scoring steps tween and converge fast', () => {
		const s = new LikelihoodState();
		s.setAlgo('fisherScoring');
		s.step();
		expect(s.animating).toBe(true);
		s.start();
		while (s.running) s.step();
		expect(s.converged).toBe(true);
		expect(s.p.mu).toBeCloseTo(MU_HAT, 4);
		expect(s.p.sigma2).toBeCloseTo(SIGMA2_HAT, 4);
	});

	it('stepBack restores the previous point and its converged flag', () => {
		const s = new LikelihoodState();
		s.step();
		const afterOne = { mu: s.p.mu, sigma2: s.p.sigma2 };
		s.step();
		s.stepBack();
		expect(s.count).toBe(1);
		expect(s.p.mu).toBe(afterOne.mu);
		expect(s.p.sigma2).toBe(afterOne.sigma2);
		s.stepBack();
		expect(s.count).toBe(0);
		expect(s.p.mu).toBe(defaults.mu);
		expect(s.converged).toBe(false);
		s.stepBack(); // no-op at zero
		expect(s.count).toBe(0);
	});

	it('resetRun returns to the starting point and clears the trail', () => {
		const s = new LikelihoodState();
		s.setMu(60);
		s.step();
		s.step();
		s.resetRun();
		expect(s.count).toBe(0);
		expect(s.p.mu).toBe(60);
		expect(s.p.sigma2).toBe(defaults.sigma2);
		expect(s.converged).toBe(false);
	});

	it('a manual move stops a run and clears the trail', () => {
		const s = new LikelihoodState();
		s.start();
		s.step();
		s.setMu(90);
		expect(s.running).toBe(false);
		expect(s.count).toBe(0);
		expect(s.p.mu).toBe(90);
	});

	it('moving after convergence lets the next run start from the new point', () => {
		const s = new LikelihoodState();
		s.start();
		while (s.running) s.step();
		expect(s.converged).toBe(true);
		s.setPoint({ mu: 120, sigma2: 300 });
		expect(s.converged).toBe(false);
		expect(s.count).toBe(0);
		s.start();
		expect(s.running).toBe(true);
		s.step();
		expect(s.path[0]).toEqual({ mu: 120, sigma2: 300 });
	});

	it('every manual setter ends the run; inference controls do not', () => {
		const moves: ((s: LikelihoodState) => void)[] = [
			(s) => s.setMu(70),
			(s) => s.setSigma2(200),
			(s) => s.setPoint({ mu: 70, sigma2: 200 }),
			(s) => s.snapTo('mu')
		];
		for (const move of moves) {
			const s = new LikelihoodState();
			s.step();
			move(s);
			expect(s.count).toBe(0);
		}
		const s = new LikelihoodState();
		s.step();
		s.setMuNull(90);
		s.setN(40);
		expect(s.count).toBe(1);
	});

	it('setAlgo clears the trail', () => {
		const s = new LikelihoodState();
		s.step();
		s.setAlgo('fisherScoring');
		expect(s.count).toBe(0);
	});

	it('start is a no-op when converged or algo is none', () => {
		const s = new LikelihoodState();
		s.setAlgo('none');
		s.start();
		expect(s.running).toBe(false);
		s.step();
		expect(s.count).toBe(0);
	});

	it('newSample clears the optimizer state', () => {
		const s = new LikelihoodState();
		s.step();
		s.newSample();
		expect(s.count).toBe(0);
		expect(s.converged).toBe(false);
	});
});
