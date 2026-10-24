// The math behind the correlation visualization, ported from the old Gatsby
// app's vizReducer.js with jstat/d3-array swapped for our stats helpers.
//
// The core trick: one base sample is reused for every slider position. The
// standardized sample is first whitened with the inverse Cholesky factor of
// its *observed* 2x2 correlation matrix, then the target correlation is
// imposed with the Cholesky factor of [[1, rho], [rho, 1]]. Because
// standardizing with the sample moments makes the observed matrix exact
// (unit variances by construction), the transformed data's sample correlation
// equals rho exactly — and points move smoothly and deterministically as the
// slider moves.

import { covariance, mean, sampleSd } from '../../stats/descriptive';

export type Point = [number, number];

/** The base sample plus the frozen moments used to standardize it. */
export interface BaseSample {
	x: number[];
	y: number[];
	muHatX: number;
	muHatY: number;
	sigmaHatX: number;
	sigmaHatY: number;
}

export interface SampleStats {
	cor: number;
	slope: number;
	intercept: number;
	muHatNewX: number;
	muHatNewY: number;
	sigmaHatNewX: number;
	sigmaHatNewY: number;
}

export interface BivariateData extends SampleStats {
	data: Point[];
}

/** Descriptive stats + OLS fit for a set of points (old getSampleCorrelation). */
export function sampleStats(data: Point[]): SampleStats {
	const x = data.map((d) => d[0]);
	const y = data.map((d) => d[1]);
	const cov = covariance(x, y);
	const sigmaX = sampleSd(x);
	const sigmaY = sampleSd(y);
	const slope = cov / (sigmaX * sigmaX);
	const muX = mean(x);
	const muY = mean(y);
	// Clamp: collinear data (rho = ±1) can push the ratio past ±1 by float
	// error (~a third of samples), and downstream sqrt(1 ± cor) then goes NaN —
	// the SVG ellipse treats an invalid radius as `auto` (= the other radius)
	// and flashes as a full circle. Clamping also keeps the adopted slider rho
	// inside the input's min/max.
	return {
		cor: Math.max(-1, Math.min(1, cov / (sigmaY * sigmaX))),
		slope,
		intercept: muY - slope * muX,
		muHatNewX: muX,
		muHatNewY: muY,
		sigmaHatNewX: sigmaX,
		sigmaHatNewY: sigmaY
	};
}

/**
 * Transform the base sample to have sample correlation exactly `rho`, with
 * x moments (M0, SD0) and y moments (M1, SD1) as the population targets
 * (old createBivariateData + setCorrelation).
 */
export function recorrelate(
	sample: BaseSample,
	rho: number,
	M0: number,
	M1: number,
	SD0: number,
	SD1: number
): BivariateData {
	const { x, y, muHatX, muHatY, sigmaHatX, sigmaHatY } = sample;
	const xNorm = x.map((v) => (v - muHatX) / sigmaHatX);
	const yNorm = y.map((v) => (v - muHatY) / sigmaHatY);

	// Whiten: remove the observed correlation. The standardized sample has unit
	// variances, so the observed matrix is [[1, c], [c, 1]] and the inverse
	// Cholesky factor has the closed form below (old cholesky + solve).
	// Clamp c: a collinear base sample (a y = 2x CSV, or point edits landing on
	// a line) puts the observed covariance at ±1 (± float error), and 1/d then
	// blows up to Infinity/NaN — the old app destroyed the chart with no
	// recovery. Clamped, the transform stays finite; a truly collinear base has
	// no independent variation to re-introduce, so the output simply stays
	// (near-)collinear whatever rho asks, which is the honest outcome.
	const EPS = 1e-12;
	const c = Math.max(-1 + EPS, Math.min(1 - EPS, covariance(xNorm, yNorm)));
	const d = Math.sqrt(1 - c * c);
	const yIndep = yNorm.map((v, i) => xNorm[i] * (-c / d) + v / d);

	// Impose the target correlation, then rescale to the requested moments.
	const l22 = Math.sqrt(1 - rho * rho);
	const newX = xNorm.map((v) => v * SD0 + M0);
	const newY = yIndep.map((v, i) => (xNorm[i] * rho + v * l22) * SD1 + M1);

	const data: Point[] = newX.map((v, i) => [v, newY[i]]);
	return { data, ...sampleStats(data) };
}

export interface Bounds {
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
}

/** Axis bounds framing the sample at mean +/- 4 SD (old rescale). */
export function rescaleBounds(stats: SampleStats): Bounds {
	return {
		xMin: stats.muHatNewX - 4 * stats.sigmaHatNewX,
		xMax: stats.muHatNewX + 4 * stats.sigmaHatNewX,
		yMin: stats.muHatNewY - 4 * stats.sigmaHatNewY,
		yMax: stats.muHatNewY + 4 * stats.sigmaHatNewY
	};
}

/**
 * Chi-square quantile with 2 df: the closed form -2 ln(1-p) (replaces
 * jstat's chisquare.inv). Scales the probability ellipses.
 */
export function chi2Quantile2(p: number): number {
	return -2 * Math.log(1 - p);
}

/**
 * Distance term positioning the Venn circles so their intersection area is
 * rho^2 times one circle's area (shared variance). Solves the circular-segment
 * equation for theta by Newton iteration, from http://bl.ocks.org/mbostock/3422480.
 * Ported verbatim; the caller places centers 2r - 2*result apart.
 */
export function vennOverlapDistance(rho: number, r: number): number {
	// avoid NaN
	rho = Math.abs(rho) < 1e-5 ? 0 : rho;
	let k = (rho * rho) / 2;

	if (k > 0 && k < 1) {
		let t1 = Math.pow(12 * k * Math.PI, 1 / 3);
		for (let i = 0; i < 10; ++i) {
			const t0 = t1;
			t1 = (Math.sin(t0) - t0 * Math.cos(t0) + 2 * k * Math.PI) / (1 - Math.cos(t0));
		}
		k = (1 - Math.cos(t1 / 2)) / 2;
	}
	return 2 * r * k;
}

/** Serialize points to CSV with quoted header labels (old saveCsv.js). */
export function toCsv(data: Point[], xLabel: string, yLabel: string): string {
	return [[`"${xLabel}"`, `"${yLabel}"`] as (string | number)[], ...data]
		.map((row) => row.join(','))
		.join('\n');
}
