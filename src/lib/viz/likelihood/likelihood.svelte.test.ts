import { describe, expect, it } from 'vitest';
import { defaults, LikelihoodState } from './likelihood.svelte';
import { MU_MAX, MU_MIN, SIGMA2_MIN } from './model';

// R-pinned statistics of the deterministic default sample (see model.test.ts).
const MU_HAT = 104.38;
const SIGMA2_HAT = 139.9196;

describe('derived sample statistics', () => {
	it('prerenders the real estimates from the fixed default sample', () => {
		const s = new LikelihoodState();
		expect(s.muHat).toBeCloseTo(MU_HAT, 10);
		expect(s.sigma2Hat).toBeCloseTo(SIGMA2_HAT, 8);
		expect(s.ll).toBeCloseTo(-68.93043626198718, 10); // ℓ(80, 100), R-pinned
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
		expect(s.tests.lr.stat).toBeCloseTo(9.074034180467834, 8);
		expect(s.tests.wald.z).toBeCloseTo(3.844320686455949, 8);
		expect(s.tests.score.stat).toBeCloseTo(5.964292306982323, 8);
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

	it('newton steps tween and converge fast', () => {
		const s = new LikelihoodState();
		s.setAlgo('newtonRaphson');
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

	it('manual edits stop a run but keep the trail; setAlgo clears it', () => {
		const s = new LikelihoodState();
		s.start();
		s.step();
		s.setMu(90);
		expect(s.running).toBe(false);
		expect(s.count).toBe(1); // trail stays drawn
		s.setAlgo('newtonRaphson');
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
