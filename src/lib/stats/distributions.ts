// Normal-distribution primitives for the interactive viz apps. The old Gatsby
// tools leaned on jstat for these; we roll our own so the math is a tiny,
// unit-tested, dependency-free part of the stats tier (the migration plan's
// "no jstat" decision). Three functions cover everything the viz apps need:
// the density (bell curves), the CDF (overlap / U3 / probability of
// superiority), and the quantile / inverse CDF (number needed to treat).

const SQRT_2 = Math.SQRT2;
const SQRT_2PI = Math.sqrt(2 * Math.PI);

/** Standard-normal density scaled to `mean`/`sd`. */
export function normalPdf(x: number, mean = 0, sd = 1): number {
	const z = (x - mean) / sd;
	return Math.exp(-0.5 * z * z) / (sd * SQRT_2PI);
}

// Error function via Abramowitz & Stegun 7.1.26 (max abs error ~1.5e-7). The
// CDF only ever feeds values formatted to a few significant figures, so this
// accuracy is far beyond what's displayed, while staying branch-light.
function erf(x: number): number {
	const sign = Math.sign(x);
	const t = 1 / (1 + 0.3275911 * Math.abs(x));
	const y =
		1 -
		((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
			t *
			Math.exp(-x * x);
	return sign * y;
}

/** Cumulative distribution function P(X <= x) for N(mean, sd^2). */
export function normalCdf(x: number, mean = 0, sd = 1): number {
	return 0.5 * (1 + erf((x - mean) / (sd * SQRT_2)));
}

// Inverse CDF (probit) via Acklam's rational approximation, then one Halley
// refinement step against `normalCdf` to reach full double precision. Acklam's
// raw approximation is ~1e-9 relative error; the refinement makes the residual
// vanish to machine epsilon, which matters because NNT divides by a difference
// of CDFs and is sensitive near d = 0.
const A = [
	-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
	-3.066479806614716e1, 2.506628277459239
];
const B = [
	-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
	-1.328068155288572e1
];
const C = [
	-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
	4.374664141464968, 2.938163982698783
];
const D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
const P_LOW = 0.02425;
const P_HIGH = 1 - P_LOW;

/** Quantile / inverse CDF: the x such that P(X <= x) = p, for N(mean, sd^2). */
export function normalQuantile(p: number, mean = 0, sd = 1): number {
	if (p <= 0) return -Infinity;
	if (p >= 1) return Infinity;

	let x: number;
	if (p < P_LOW) {
		const q = Math.sqrt(-2 * Math.log(p));
		x =
			(((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
			((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1);
	} else if (p <= P_HIGH) {
		const q = p - 0.5;
		const r = q * q;
		x =
			((((((A[0] * r + A[1]) * r + A[2]) * r + A[3]) * r + A[4]) * r + A[5]) * q) /
			(((((B[0] * r + B[1]) * r + B[2]) * r + B[3]) * r + B[4]) * r + 1);
	} else {
		const q = Math.sqrt(-2 * Math.log(1 - p));
		x =
			-(((((C[0] * q + C[1]) * q + C[2]) * q + C[3]) * q + C[4]) * q + C[5]) /
			((((D[0] * q + D[1]) * q + D[2]) * q + D[3]) * q + 1);
	}

	// One Halley step: u = (Φ(x) - p) / φ(x); x -= u / (1 + x·u/2).
	const e = normalCdf(x) - p;
	const u = e / normalPdf(x);
	x = x - u / (1 + (x * u) / 2);

	return mean + sd * x;
}
