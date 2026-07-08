// Normal-distribution primitives for the interactive viz apps. The old Gatsby
// tools leaned on jstat for these; we roll our own so the math is a tiny,
// unit-tested, dependency-free part of the stats tier (the migration plan's
// "no jstat" decision). The normal density (bell curves), CDF (overlap / U3 /
// probability of superiority), and quantile (number needed to treat) cover the
// earlier apps; the chi-square CDF backs the likelihood app's LRT/Score
// p-values.

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

// ln Γ(z) via Lanczos (g = 7, 9 terms); relative error < 1e-13 for z > 0,
// which is all the incomplete gamma below ever passes (z = df/2).
const LANCZOS = [
	0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
	-176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
	1.5056327351493116e-7
];

function lnGamma(z: number): number {
	z -= 1;
	let x = LANCZOS[0];
	for (let i = 1; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i);
	const t = z + 7.5;
	return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Regularized lower incomplete gamma P(a, x), Numerical Recipes §6.2: the
// series converges fast for x < a + 1, the continued fraction (modified Lentz)
// for x >= a + 1; each is used only on its own side of that split.
function lowerGammaP(a: number, x: number): number {
	if (x <= 0) return 0;
	const scale = Math.exp(-x + a * Math.log(x) - lnGamma(a));

	if (x < a + 1) {
		let ap = a;
		let term = 1 / a;
		let sum = term;
		for (let i = 0; i < 300; i++) {
			ap += 1;
			term *= x / ap;
			sum += term;
			if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
		}
		return sum * scale;
	}

	const FPMIN = 1e-300;
	let b = x + 1 - a;
	let c = 1 / FPMIN;
	let d = 1 / b;
	let h = d;
	for (let i = 1; i <= 300; i++) {
		const an = -i * (i - a);
		b += 2;
		d = an * d + b;
		if (Math.abs(d) < FPMIN) d = FPMIN;
		c = b + an / c;
		if (Math.abs(c) < FPMIN) c = FPMIN;
		d = 1 / d;
		const del = d * c;
		h *= del;
		if (Math.abs(del - 1) < 1e-15) break;
	}
	return 1 - scale * h;
}

/** Cumulative distribution function P(X <= x) for chi-square with k degrees of freedom. */
export function chiSquareCdf(x: number, k: number): number {
	return lowerGammaP(k / 2, x / 2);
}
