// Reactive state for the likelihood app (replaces the old useReducer+Context).
// No persistence, URL params, or share in this app — the old app had none
// (locked decision 2026-07-07); the params object is kept codec-ready in the
// cohend shape should share links ever be added. Unlike correlation, the
// default sample is a fixed dataset, so SSR prerenders real estimates and no
// onMount init is needed.

import {
	fisherScoringStep,
	GA_GAMMA,
	gradientAscentStep,
	infoMu,
	logLikGrid,
	logLikSum,
	lrTest,
	MU_MAX,
	MU_MIN,
	MU_THETA,
	outsideFrame,
	scoreMu,
	scoreTest,
	snapMean,
	SIGMA2_MAX,
	SIGMA2_MIN,
	SIGMA2_THETA,
	sumSquares,
	waldTest,
	type OptimPoint
} from './model';
import { drawGaussian } from '../../stats/random';
import { mean } from '../../stats/descriptive';

export type Algo = 'none' | 'gradientAscent' | 'fisherScoring';
export type TestKind = 'LRT' | 'wald' | 'score';

export interface LikelihoodParams {
	/** Current evaluation point — sliders, chart drags, and optimizer steps
	 * all move this one (μ, σ²). */
	mu: number;
	sigma2: number;
	/** Inference section: null value and the hypothetical sample size (the
	 * estimates stay fixed at the drawn sample's; see the section copy). */
	muNull: number;
	n: number;
	sample: number[];
	algo: Algo;
	/** Gradient-ascent step size (in the standardized space it iterates in). */
	gamma: number;
	test: TestKind;
}

// The old app's defaults, including its deterministic first-paint dataset
// (shifted by −0.38 to μ̂ = 104, like every sample; see snapMean).
export const defaults: LikelihoodParams = {
	mu: 80,
	sigma2: 100,
	muNull: 80,
	n: 10,
	sample: snapMean([78.0, 95.5, 100.3, 100.6, 102.8, 107.8, 109.1, 110.8, 113.9, 125.0]),
	algo: 'gradientAscent',
	gamma: GA_GAMMA,
	test: 'LRT'
};

export const MU_NULL_MIN = 70;
export const MU_NULL_MAX = 160;
export const N_MIN = 1;
export const N_MAX = 100;
/** γ slider range: from a visible crawl to a step that bounces or overshoots
 * out of the frame (σ² goes negative past ≈ 1.5). */
export const GAMMA_MIN = 0.002;
export const GAMMA_MAX = 1;

/** Guard on the auto-run loop; GA converges in far fewer steps from anywhere
 * in the frame, so this only stops a pathological loop, not a real run. */
export const RUN_CAP = 1000;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class LikelihoodState {
	p = $state<LikelihoodParams>({ ...defaults, sample: [...defaults.sample] });
	/** Set during drags so consumers skip their CSS transitions/tweens. */
	immediate = $state(false);
	/** True while a Fisher-scoring step should tween the charts (the old
	 * `animating`: gradient ascent runs a step per frame and must not tween). */
	animating = $state(false);

	/** Optimizer trail; path[0] is the run's starting point. */
	path = $state<OptimPoint[]>([]);
	running = $state(false);
	converged = $state(false);
	/** The last gradient-ascent step overshot out of the frame; the point is
	 * pinned to the frame edge and the run can't continue. */
	diverged = $state(false);
	/** Converged flag after each iterate, parallel to `path`, so stepping back
	 * restores it exactly (old convergedHistory). */
	#convergedHistory: boolean[] = [];

	// Sample statistics as invariants by construction — the old reducer
	// recomputed these by hand in every case that touched the sample.
	readonly muHat = $derived(mean(this.p.sample));
	readonly ss = $derived(sumSquares(this.p.sample, this.muHat));
	readonly sigma2Hat = $derived(this.ss / this.p.sample.length);
	readonly sampleZ = $derived.by(() => {
		const sd = Math.sqrt(this.sigma2Hat);
		return this.p.sample.map((y) => (y - this.muHat) / sd);
	});
	/** σ̂²(μ₀): the MLE of σ² with μ pinned to the null. */
	readonly sigma2Null = $derived(sumSquares(this.p.sample, this.p.muNull) / this.p.sample.length);

	readonly ll = $derived(logLikSum(this.p.sample, this.p.mu, this.p.sigma2));
	readonly llMax = $derived(logLikSum(this.p.sample, this.muHat, this.sigma2Hat));
	readonly count = $derived(Math.max(0, this.path.length - 1));
	/** 100×100 ℓ grid shared by the contour and the 3D surface; recomputes
	 * only when the sample changes. */
	readonly grid = $derived(logLikGrid(this.p.sample));

	/** Where the selected algorithm's next iteration would land from the
	 * current point (drawn as a faint ghost step on the joint views), or null
	 * when there is nothing to preview. */
	readonly nextStep = $derived.by((): OptimPoint | null => {
		if (this.p.algo === 'none' || this.converged || this.diverged) return null;
		const cur = { mu: this.p.mu, sigma2: this.p.sigma2 };
		return this.p.algo === 'gradientAscent'
			? gradientAscentStep(this.sampleZ, this.muHat, this.sigma2Hat, cur, this.p.gamma).next
			: fisherScoringStep(this.p.sample, this.muHat, this.sigma2Hat, cur).next;
	});

	// Inference-section quantities (all use the hypothetical slider n with the
	// fixed sample estimates — old derivMuNull/deriv2MuNull semantics).
	readonly scoreAtNull = $derived(scoreMu(this.p.n, this.p.muNull, this.muHat, this.sigma2Null));
	readonly infoAtNull = $derived(infoMu(this.p.n, this.sigma2Null));
	readonly tests = $derived({
		lr: lrTest(this.sigma2Hat, this.sigma2Null, this.p.n),
		wald: waldTest(this.muHat, this.p.muNull, this.sigma2Hat, this.p.n),
		score: scoreTest(this.scoreAtNull, this.infoAtNull)
	});

	/** Manual parameter edits interrupt a run but keep the path drawn (old
	 * behavior kept the trail; stopping the timer is the improvement). */
	#interrupt() {
		this.running = false;
		this.animating = false;
	}

	/** A manual move of (μ, σ²) ends the run: the new point is the next run's
	 * start. Keeping the trail would leave `converged` blocking play from the
	 * new point, and the next step would draw a jump the optimizer never made.
	 * (Departs from the old app, which kept both.) */
	#moveByHand() {
		this.#interrupt();
		this.path = [];
		this.#convergedHistory = [];
		this.converged = false;
		this.diverged = false;
	}

	setMu(v: number, immediate = false) {
		this.immediate = immediate;
		this.#moveByHand();
		this.p.mu = clamp(v, MU_MIN, MU_MAX);
	}

	setSigma2(v: number, immediate = false) {
		this.immediate = immediate;
		this.#moveByHand();
		this.p.sigma2 = clamp(v, SIGMA2_MIN, SIGMA2_MAX);
	}

	/** Chart drags move both parameters at once (old contourDrag). */
	setPoint(pt: OptimPoint, immediate = true) {
		this.immediate = immediate;
		this.#moveByHand();
		this.p.mu = clamp(pt.mu, MU_MIN, MU_MAX);
		this.p.sigma2 = clamp(pt.sigma2, SIGMA2_MIN, SIGMA2_MAX);
	}

	/** Jump a parameter to its MLE (old ButtonMLE). */
	snapTo(which: 'mu' | 'sigma2') {
		this.immediate = false;
		this.#moveByHand();
		if (which === 'mu') this.p.mu = clamp(this.muHat, MU_MIN, MU_MAX);
		else this.p.sigma2 = clamp(this.sigma2Hat, SIGMA2_MIN, SIGMA2_MAX);
	}

	setMuNull(v: number, immediate = false) {
		this.immediate = immediate;
		this.p.muNull = clamp(v, MU_NULL_MIN, MU_NULL_MAX);
	}

	setN(v: number, immediate = false) {
		this.immediate = immediate;
		this.p.n = clamp(Math.round(v), N_MIN, N_MAX);
	}

	setTest(t: TestKind) {
		this.p.test = t;
	}

	/** Switching algorithm resets the trail — the old app kept a mixed-
	 * algorithm path, which read as one optimizer's trajectory but wasn't. */
	setAlgo(a: Algo) {
		this.#interrupt();
		this.path = [];
		this.#convergedHistory = [];
		this.converged = false;
		this.diverged = false;
		this.p.algo = a;
	}

	/** Fresh sorted draws from the fixed population N(μ_θ, σ²_θ), mean snapped. */
	newSample() {
		this.immediate = false;
		this.#interrupt();
		this.path = [];
		this.#convergedHistory = [];
		this.converged = false;
		this.diverged = false;
		this.p.sample = snapMean(drawGaussian(10, MU_THETA, Math.sqrt(SIGMA2_THETA))).sort(
			(a, b) => a - b
		);
	}

	/** One optimizer iteration; always applies the step (old semantics —
	 * `converged` only stops the auto-run and disables the buttons). */
	step() {
		if (this.p.algo === 'none' || this.diverged) return;
		const cur = { mu: this.p.mu, sigma2: this.p.sigma2 };
		const r =
			this.p.algo === 'gradientAscent'
				? gradientAscentStep(this.sampleZ, this.muHat, this.sigma2Hat, cur, this.p.gamma)
				: fisherScoringStep(this.p.sample, this.muHat, this.sigma2Hat, cur);
		// Only gradient ascent can overshoot for good. A Fisher-scoring step may
		// leave the frame (σ² jumps to the best variance for the old μ) and
		// always lands on the MLE next step, so it runs on, as in the old app.
		const left = this.p.algo === 'gradientAscent' && outsideFrame(r.next);
		const next = left
			? {
					mu: clamp(Number.isFinite(r.next.mu) ? r.next.mu : cur.mu, MU_MIN, MU_MAX),
					sigma2: clamp(
						Number.isFinite(r.next.sigma2) ? r.next.sigma2 : cur.sigma2,
						SIGMA2_MIN,
						SIGMA2_MAX
					)
				}
			: r.next;
		if (this.path.length === 0) {
			this.path = [cur, next];
			this.#convergedHistory = [false, r.converged];
		} else {
			this.path = [...this.path, next];
			this.#convergedHistory.push(r.converged);
		}
		this.immediate = false;
		this.animating = this.p.algo === 'fisherScoring';
		this.p.mu = next.mu;
		this.p.sigma2 = next.sigma2;
		this.converged = r.converged;
		this.diverged = left;
		if (r.converged || left) this.running = false;
		if (this.count >= RUN_CAP) this.running = false;
	}

	/** Undo one iteration (old algoReverse). */
	stepBack() {
		if (this.count === 0) return;
		this.#interrupt();
		const path = this.path.slice(0, -1);
		this.#convergedHistory.pop();
		const prev = path[path.length - 1];
		this.path = path.length > 1 ? path : [];
		if (path.length <= 1) this.#convergedHistory = [];
		this.converged = this.#convergedHistory[this.#convergedHistory.length - 1] ?? false;
		// Only a run's last step can leave the frame, so undoing it clears this.
		this.diverged = false;
		this.immediate = false;
		this.animating = this.p.algo === 'fisherScoring';
		this.p.mu = prev.mu;
		this.p.sigma2 = prev.sigma2;
	}

	/** Back to the run's starting point, clearing the trail (old algoReset —
	 * which left the path as a bare object; deriving `count` from the array
	 * makes that state unrepresentable). */
	resetRun() {
		if (this.path.length === 0) return;
		const start = this.path[0];
		this.#interrupt();
		this.path = [];
		this.#convergedHistory = [];
		this.converged = false;
		this.diverged = false;
		this.immediate = false;
		this.p.mu = start.mu;
		this.p.sigma2 = start.sigma2;
	}

	/** A new step size restarts the run from its starting point, so step
	 * sizes compare from the same place. */
	setGamma(g: number) {
		if (this.path.length) this.resetRun();
		this.p.gamma = clamp(g, GAMMA_MIN, GAMMA_MAX);
	}

	start() {
		if (this.converged || this.diverged || this.p.algo === 'none') return;
		this.running = true;
	}

	stop() {
		this.running = false;
	}
}
