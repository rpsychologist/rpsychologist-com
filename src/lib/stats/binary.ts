// Effect measures for a binary outcome: risk difference, risk ratio, odds ratio,
// and the logistic-model machinery behind the odds-ratio essay (marginalizing a
// conditional logistic model over a prognostic covariate, standardization,
// case-control sampling). Arm 0 is control, arm 1 is treated throughout.

/** Inverse logit, written per sign so neither branch overflows for large |x|. */
export function expit(x: number): number {
	if (x >= 0) return 1 / (1 + Math.exp(-x));
	const e = Math.exp(x);
	return e / (1 + e);
}

export function logit(p: number): number {
	return Math.log(p / (1 - p));
}

export function odds(p: number): number {
	return p / (1 - p);
}

export function probFromOdds(o: number): number {
	return o / (1 + o);
}

export interface Effects {
	rd: number;
	rr: number;
	or: number;
	/** Number needed to treat, 1 / RD (signed; infinite at RD = 0). */
	nnt: number;
}

export function effects(p0: number, p1: number): Effects {
	const rd = p1 - p0;
	return { rd, rr: p1 / p0, or: odds(p1) / odds(p0), nnt: 1 / rd };
}

/** Event counts and arm sizes: `e1` of `n1` treated, `e0` of `n0` control. */
export interface TwoByTwo {
	e1: number;
	n1: number;
	e0: number;
	n0: number;
}

export function effectsFromCounts(t: TwoByTwo): Effects {
	return effects(t.e0 / t.n0, t.e1 / t.n1);
}

/** Treated risk implied by a control risk and an effect held fixed on one scale. */
export const p1FromRd = (p0: number, rd: number) => p0 + rd;
export const p1FromRr = (p0: number, rr: number) => p0 * rr;
export const p1FromOr = (p0: number, or: number) => probFromOdds(odds(p0) * or);

// OR = RR (1 - p0) / (1 - p1). Substituting p1 = RR p0 (or p1 from the odds)
// gives the two closed forms; the first is Zhang & Yu's (1998) conversion.
export const rrFromOr = (or: number, p0: number) => or / (1 - p0 + p0 * or);
export const orFromRr = (rr: number, p0: number) => (rr * (1 - p0)) / (1 - rr * p0);

/** The largest RR a control risk admits, since p1 cannot exceed 1. */
export const rrUpperBound = (p0: number) => 1 / p0;

export interface Stratum {
	/** Share of the population in the stratum (normalized here). */
	w: number;
	p0: number;
	p1: number;
}

/**
 * Standardization (g-computation over discrete strata): the population risk if
 * everyone were untreated and if everyone were treated. With randomization these
 * are also the arms' marginal risks.
 */
export function standardize(strata: Stratum[]): { p0: number; p1: number } {
	let w = 0;
	let p0 = 0;
	let p1 = 0;
	for (const s of strata) {
		w += s.w;
		p0 += s.w * s.p0;
		p1 += s.w * s.p1;
	}
	return { p0: p0 / w, p1: p1 / w };
}

/**
 * Expected table after sampling by outcome: a fraction `fCase` of the events and
 * `fControl` of the non-events in each arm. Both arms' odds are multiplied by
 * fCase / fControl, which cancels in the OR (Cornfield, 1951); risks don't
 * scale that way, so the sample "RR" is biased whenever the fractions differ.
 */
export function caseControlSample(t: TwoByTwo, fCase: number, fControl: number): TwoByTwo {
	return {
		e1: t.e1 * fCase,
		n1: t.e1 * fCase + (t.n1 - t.e1) * fControl,
		e0: t.e0 * fCase,
		n0: t.e0 * fCase + (t.n0 - t.e0) * fControl
	};
}

// Trapezoid rule on z in [-8, 8]. The integrand is smooth and Gaussian-weighted,
// a case where the trapezoid rule converges geometrically, so a fixed grid is
// accurate to well beyond display precision without Gauss-Hermite nodes.
const Z_MAX = 8;
const Z_STEP = 0.02;
const Z_GRID: { z: number; w: number }[] = (() => {
	const n = Math.round((2 * Z_MAX) / Z_STEP);
	const out = [];
	for (let i = 0; i <= n; i++) {
		const z = -Z_MAX + i * Z_STEP;
		const edge = i === 0 || i === n ? 0.5 : 1;
		out.push({ z, w: (edge * Z_STEP * Math.exp(-0.5 * z * z)) / Math.sqrt(2 * Math.PI) });
	}
	return out;
})();

/** E[f(mu + sigma Z)] for Z ~ N(0, 1). */
export function gaussianAverage(f: (x: number) => number, mu: number, sigma: number): number {
	if (sigma === 0) return f(mu);
	let s = 0;
	for (const { z, w } of Z_GRID) s += w * f(mu + sigma * z);
	return s;
}

/**
 * Marginal risk under a conditional logistic model with linear predictor
 * `eta + sigma Z`, where Z is a standardized prognostic covariate. By Jensen's
 * inequality this is not expit(eta): averaging flattens the S-curve.
 */
export function marginalRisk(eta: number, sigma: number): number {
	return gaussianAverage(expit, eta, sigma);
}

/**
 * Marginal risks and OR for a randomized trial whose conditional model is
 * logit P(Y = 1 | T, Z) = beta0 + betaT T + sigma Z. Treatment is independent
 * of Z, so the attenuation of the OR is noncollapsibility, not confounding.
 */
export function marginalOr(
	beta0: number,
	betaT: number,
	sigma: number
): { p0: number; p1: number; or: number } {
	const p0 = marginalRisk(beta0, sigma);
	const p1 = marginalRisk(beta0 + betaT, sigma);
	return { p0, p1, or: odds(p1) / odds(p0) };
}

// Arm risks are strictly increasing in eta under both covariate models, so
// bisection on a wide bracket always converges.
function solveEta(p: number, risk: (eta: number) => number): number {
	let lo = -40;
	let hi = 40;
	for (let i = 0; i < 100; i++) {
		const mid = (lo + hi) / 2;
		if (risk(mid) < p) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
}

/**
 * The conditional coefficients that reproduce given marginal risks: hold the
 * observed trial fixed and ask what conditional OR a model adjusting for a
 * covariate of prognostic strength `sigma` would report.
 */
export function calibrateToMarginal(
	p0: number,
	p1: number,
	sigma: number
): { beta0: number; betaT: number } {
	const risk = (eta: number) => marginalRisk(eta, sigma);
	const beta0 = solveEta(p0, risk);
	return { beta0, betaT: solveEta(p1, risk) - beta0 };
}

/**
 * Arm risk with a balanced binary prognostic factor: half the arm (mild) has
 * log-odds eta + delta, half (severe) eta - delta. The arm's risk is the
 * average of the two strata's risks, not expit(eta).
 */
export function stratifiedRisk(eta: number, delta: number): number {
	return (expit(eta + delta) + expit(eta - delta)) / 2;
}

/**
 * calibrateToMarginal for the binary factor: the stratum log-odds that
 * reproduce the trial's arm risks. Each stratum's OR is exp(betaT); the
 * whole-trial OR stays odds(p1) / odds(p0) whatever delta is.
 */
export function calibrateToStrata(
	p0: number,
	p1: number,
	delta: number
): { beta0: number; betaT: number } {
	const risk = (eta: number) => stratifiedRisk(eta, delta);
	const beta0 = solveEta(p0, risk);
	return { beta0, betaT: solveEta(p1, risk) - beta0 };
}

/**
 * Approximate marginal/conditional log-OR ratio from the logistic-normal
 * approximation expit(x) ~ Phi(x / c) (Zeger, Liang & Albert, 1988). An
 * approximation only; the tests check it against the exact `marginalOr`.
 */
export function zlaAttenuation(sigma: number): number {
	const c = (16 * Math.sqrt(3)) / (15 * Math.PI);
	return 1 / Math.sqrt(1 + c * c * sigma * sigma);
}
