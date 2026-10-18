// Pure math for the likelihood app: the normal log-likelihood, its
// derivatives, the two optimizers, the three large-sample tests, and the
// contour/surface grid. Ported from the old app's utils.js with the hardcoded
// n = 10 generalized to the sample length (identical results — the sample is
// always 10) and one never-displayed formula corrected (see
// hessSigma2Observed).
//
// The optimizer constants (the DEFAULT gradient-ascent γ, the tolerances,
// expected-vs-observed information) are FROZEN: the on-screen path and
// iteration counts at the defaults are displayed results under the app's
// semver contract. Don't "tune" them. γ itself is reader-adjustable.

import { chiSquareCdf, normalCdf } from '../../stats/distributions';

export interface OptimPoint {
	mu: number;
	sigma2: number;
}

export interface StepResult {
	next: OptimPoint;
	converged: boolean;
}

// The fixed pedagogical frame (old app): data are drawn from N(100, 225) and
// every chart windows μ to μ_θ ± 5σ_θ and σ² to [1, 1500].
export const MU_THETA = 100;
export const SIGMA2_THETA = 225;
export const MU_MIN = MU_THETA - 5 * Math.sqrt(SIGMA2_THETA); // 25
export const MU_MAX = MU_THETA + 5 * Math.sqrt(SIGMA2_THETA); // 175
export const SIGMA2_MIN = 1;
export const SIGMA2_MAX = 1500;

/** Log-likelihood contribution of a single observation under N(mu, sigma2). */
export function logLikPoint(y: number, mu: number, sigma2: number): number {
	return -0.5 * Math.log(2 * Math.PI * sigma2) - (y - mu) ** 2 / (2 * sigma2);
}

// Σ(y − μ)² = Σ(y − ȳ)² + n(ȳ − μ)², so each call is O(1) given the sample's
// mean and centered sum of squares (the centered form avoids the cancellation
// of Σy² − 2μΣy + nμ²). The figures evaluate ℓ thousands of times per input,
// and walking the reactive sample proxy each time was a top profile cost.
// Cached per array: samples are replaced whole, never mutated in place.
const sampleStats = new WeakMap<number[], { n: number; mean: number; ss: number }>();
function statsOf(sample: number[]) {
	let s = sampleStats.get(sample);
	if (!s) {
		const n = sample.length;
		let sum = 0;
		for (const y of sample) sum += y;
		const mean = n ? sum / n : 0;
		let ss = 0;
		for (const y of sample) ss += (y - mean) ** 2;
		s = { n, mean, ss };
		sampleStats.set(sample, s);
	}
	return s;
}

export function sumSquares(sample: number[], mu: number): number {
	const { n, mean, ss } = statsOf(sample);
	return ss + n * (mean - mu) ** 2;
}

/**
 * Shift a sample by round(ȳ) − ȳ (at most ½) so its mean is a whole number.
 * Only the location moves: σ̂² and the shape are unchanged. The μ₀ slider
 * steps by 1, so this lets it land on μ̂, where every test reads zero.
 */
export function snapMean(sample: number[]): number[] {
	const { mean } = statsOf(sample);
	const d = Math.round(mean) - mean;
	return sample.map((y) => y + d);
}

/** Joint log-likelihood ℓ(mu, sigma2) of the sample. */
export function logLikSum(sample: number[], mu: number, sigma2: number): number {
	const n = sample.length;
	return (
		(-n / 2) * Math.log(2 * Math.PI) -
		n * Math.log(Math.sqrt(sigma2)) -
		sumSquares(sample, mu) / (2 * sigma2)
	);
}

/** Score for mu: ∂ℓ/∂μ = (n/σ²)(μ̂ − μ). */
export function scoreMu(n: number, mu: number, muHat: number, sigma2: number): number {
	return (n / sigma2) * (muHat - mu);
}

/** Fisher information for mu: I(μ) = n/σ² = −∂²ℓ/∂μ². */
export function infoMu(n: number, sigma2: number): number {
	return n / sigma2;
}

/** Score for sigma2: ∂ℓ/∂σ² = −n/(2σ²) + SS/(2σ⁴). */
export function scoreSigma2(sample: number[], mu: number, sigma2: number): number {
	const n = sample.length;
	return -n / (2 * sigma2) + sumSquares(sample, mu) / (2 * sigma2 * sigma2);
}

/** Observed ∂²ℓ/∂(σ²)² = n/(2σ⁴) − SS/σ⁶. The old app's version of this
 * formula was wrong (and unused/never displayed); this is the correct one,
 * pinned by a numerical-second-difference test. */
export function hessSigma2Observed(sample: number[], mu: number, sigma2: number): number {
	const n = sample.length;
	return n / (2 * sigma2 ** 2) - sumSquares(sample, mu) / sigma2 ** 3;
}

/** Expected ∂²ℓ/∂(σ²)² = −n/(2σ⁴) (what the Newton overlay/step uses:
 * Fisher scoring, exactly like the old app). */
export function hessSigma2Expected(n: number, sigma2: number): number {
	return -n / (2 * sigma2 ** 2);
}

/** Relative (estimated) log-likelihood −n(x − μ)²/(2σ²): the curvature-plot
 * curve, maximal at 0 when x = μ (old estimatedLogLik). */
export function relLogLik(n: number, mu: number, x: number, sigma2: number): number {
	return (-n / 2) * ((x - mu) ** 2 / sigma2);
}

/** Relative profile log-likelihood ℓₚ(x) − ℓ̂ = −(n/2)·ln(1 + (x − μ)²/σ²) at
 * the fixed estimates μ = μ̂, σ² = σ̂² (since σ̂²(x) = σ̂² + (x − μ̂)²). Its drop
 * at μ₀ is exactly ½·LR; relLogLik is its quadratic approximation at the
 * peak, whose drop is ½·Wald. Its slope at μ₀ is the score U(μ₀, σ̂₀²). */
export function relProfileMu(n: number, mu: number, x: number, sigma2: number): number {
	return (-n / 2) * Math.log1p((x - mu) ** 2 / sigma2);
}

/**
 * μ-profile ℓₚ(μ) = maxₛ₂ ℓ(μ, σ²), attained at σ̂²(μ) = SS(μ)/n. The ridge of
 * the surface projected onto the μ-axis, drawn as the μ-wall silhouette in the
 * 3D view. Peaks at ℓ̂ when μ = μ̂, and dominates every fixed-σ² slice — unlike
 * a slice it is the object the LRT / profile likelihood interval invert.
 *
 * There is no matching profileSigma2: because μ̂ maximizes ℓ for every σ²,
 * profiling μ out just fixes μ = μ̂, so the σ²-profile is logLikSum(·, μ̂, σ²)
 * (a slice at μ̂) and the σ²-wall reuses that directly.
 */
export function profileMu(sample: number[], mu: number): number {
	const sigma2 = sumSquares(sample, mu) / sample.length;
	return logLikSum(sample, mu, sigma2);
}

// γ halved from the old app's 0.1 (approved 0.2.0 change, in the changelog):
// at 0.1 the first step from the default start overshot the maximum in μ and
// tripled σ², which read as a bug rather than "steps proportional to the
// gradient". Still frozen — see the header note.
export const GA_GAMMA = 0.05;
const GA_TOL = 0.001;

/**
 * One gradient-ascent iteration. Iterates in standardized space — the sample
 * z-scores, μ mapped to (μ − μ̂)/σ̂ and σ² to σ²/σ̂² — because a fixed γ in
 * raw data units (σ² in the hundreds) would diverge; the old app did the same
 * and the info card tells the user so. Convergence is judged on the CURRENT
 * point's gradients (pre-step), like the old app.
 */
export function gradientAscentStep(
	sampleZ: number[],
	muHat: number,
	sigma2Hat: number,
	cur: OptimPoint,
	gamma = GA_GAMMA
): StepResult {
	const n = sampleZ.length;
	const sigmaHat = Math.sqrt(sigma2Hat);
	const muZ = (cur.mu - muHat) / sigmaHat;
	const s2Z = cur.sigma2 / sigma2Hat;
	const gradMu = scoreMu(n, muZ, 0, s2Z);
	const gradSigma2 = scoreSigma2(sampleZ, muZ, s2Z);
	const next = {
		mu: (muZ + gamma * gradMu) * sigmaHat + muHat,
		sigma2: (s2Z + gamma * gradSigma2) * sigma2Hat
	};
	const converged = Math.abs(gradSigma2) < GA_TOL && Math.abs(gradMu) < GA_TOL;
	return { next, converged };
}

const FISHER_TOL = 0.0001;

/**
 * One Fisher-scoring iteration: a Newton step with the EXPECTED information
 * I(μ) = n/σ², I(σ²) = n/(2σ⁴) in place of the observed Hessian. The old app
 * labeled it Newton-Raphson; the path is unchanged. For μ each step lands
 * exactly on μ̂; σ² takes a few steps. Converged when the UPDATED point is
 * within tolerance of the MLEs (old semantics).
 */
export function fisherScoringStep(
	sample: number[],
	muHat: number,
	sigma2Hat: number,
	cur: OptimPoint
): StepResult {
	const n = sample.length;
	const gradMu = scoreMu(n, cur.mu, muHat, cur.sigma2);
	const infMu = infoMu(n, cur.sigma2);
	const gradSigma2 = scoreSigma2(sample, cur.mu, cur.sigma2);
	const infSigma2 = -hessSigma2Expected(n, cur.sigma2);
	const next = {
		mu: cur.mu + gradMu / infMu,
		sigma2: cur.sigma2 + gradSigma2 / infSigma2
	};
	const converged =
		Math.abs(next.sigma2 - sigma2Hat) < FISHER_TOL && Math.abs(next.mu - muHat) < FISHER_TOL;
	return { next, converged };
}

/** A step that leaves the plotted frame (or σ² ≤ 0, where ℓ is undefined)
 * ends a run: the optimizer has overshot the hill. */
export function outsideFrame(p: OptimPoint): boolean {
	return (
		!Number.isFinite(p.mu) ||
		!Number.isFinite(p.sigma2) ||
		p.mu < MU_MIN ||
		p.mu > MU_MAX ||
		p.sigma2 < SIGMA2_MIN ||
		p.sigma2 > SIGMA2_MAX
	);
}

/** Likelihood-ratio test of H0: μ = μ0 (σ² profiled out under both):
 * LR = −2[ℓ(μ0, σ̂0²) − ℓ(μ̂, σ̂²)] = n·ln(σ̂0²/σ̂²), ~χ²(1). */
export function lrTest(
	sigma2Hat: number,
	sigma2Null: number,
	n: number
): { stat: number; pval: number } {
	const stat = n * Math.log(sigma2Null / sigma2Hat);
	return { stat, pval: 1 - chiSquareCdf(stat, 1) };
}

/** Wald test: Z = (μ̂ − μ0)/se, se = √(σ̂²/n) = I(μ̂, σ̂²)^{-1/2}. */
export function waldTest(
	muHat: number,
	muNull: number,
	sigma2Hat: number,
	n: number
): { z: number; se: number; pval: number } {
	const se = Math.sqrt(sigma2Hat / n);
	const z = (muHat - muNull) / se;
	return { z, se, pval: 2 * (1 - normalCdf(Math.abs(z))) };
}

/** Score test: S = U(μ0, σ̂0²)²/I(μ0, σ̂0²), ~χ²(1). */
export function scoreTest(u: number, info: number): { stat: number; pval: number } {
	const stat = (u * u) / info;
	return { stat, pval: 1 - chiSquareCdf(stat, 1) };
}

// χ²₁(0.95)/2: the log-likelihood drop that inverts the LRT into a 95%
// interval (R: qchisq(.95, 1)/2).
export const LL_DROP_95 = 1.920729410347063;

/** 95% profile likelihood interval for μ at the fixed estimates and sample
 * size n: where ℓₚ drops LL_DROP_95 below its peak (the LR test inverted).
 * From relProfileMu: μ̂ ± √(σ̂²·(e^{2·drop/n} − 1)). Wider than the Wald CI
 * at small n; the two converge as n grows. */
export function profileIntervalMu(
	muHat: number,
	sigma2Hat: number,
	n: number,
	drop = LL_DROP_95
): [number, number] {
	const half = Math.sqrt(sigma2Hat * Math.expm1((2 * drop) / n));
	return [muHat - half, muHat + half];
}

/** Wald 95% CI: μ̂ ± 1.96·√(σ̂²/n). */
export function waldIntervalMu(muHat: number, sigma2Hat: number, n: number): [number, number] {
	const half = 1.959963984540054 * Math.sqrt(sigma2Hat / n);
	return [muHat - half, muHat + half];
}

// ---------------------------------------------------------------------------
// Contour / surface grid

export interface LogLikGrid {
	/** Row-major ℓ values, rows = sigma2 index, cols = mu index (what
	 * d3-contour expects as its `values` with size [cols, rows]). */
	values: Float64Array;
	cols: number;
	rows: number;
	muMin: number;
	muStep: number;
	sigma2Min: number;
	sigma2Step: number;
	max: number;
}

/** ℓ evaluated on a cols×rows grid over the fixed frame (old createGrid,
 * 100×100). Shared by the 2D contour and the 3D surface. */
export function logLikGrid(sample: number[], cols = 100, rows = 100): LogLikGrid {
	const muStep = (MU_MAX - MU_MIN) / cols;
	const sigma2Step = (SIGMA2_MAX - SIGMA2_MIN) / rows;
	const values = new Float64Array(cols * rows);
	let max = -Infinity;
	for (let j = 0, k = 0; j < rows; ++j) {
		const sigma2 = SIGMA2_MIN + j * sigma2Step;
		for (let i = 0; i < cols; ++i, ++k) {
			const v = logLikSum(sample, MU_MIN + i * muStep, sigma2);
			values[k] = v;
			if (v > max) max = v;
		}
	}
	return { values, cols, rows, muMin: MU_MIN, muStep, sigma2Min: SIGMA2_MIN, sigma2Step, max };
}

/**
 * Serialize a d3-contour MultiPolygon (grid-index coordinates) to an SVG path,
 * mapping each vertex through the caller's grid→screen transforms. Replaces
 * the old app's d3-geo geoPath dependency (~10 lines vs a package).
 */
export function contourRingsToPath(
	coordinates: number[][][][],
	sx: (gx: number) => number,
	sy: (gy: number) => number
): string {
	let d = '';
	for (const polygon of coordinates) {
		for (const ring of polygon) {
			for (let i = 0; i < ring.length; i++) {
				d += `${i === 0 ? 'M' : 'L'}${sx(ring[i][0]).toFixed(2)},${sy(ring[i][1]).toFixed(2)}`;
			}
			d += 'Z';
		}
	}
	return d;
}
