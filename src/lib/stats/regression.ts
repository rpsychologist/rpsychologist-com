// Population-level ordinary least squares, computed directly from a covariance
// matrix. Because we work with a known population covariance (not a sample),
// every coefficient is exact: the swing in the partial coefficient as covariates
// are toggled is structural, not sampling noise.
//
// For a regression of Y on a predictor set P (with an intercept absorbed by the
// mean-zero convention), the OLS coefficient vector is
//
//     beta_P = Sigma[P, P]^{-1} Sigma[P, Y]
//
// where Sigma[P, P] is the covariance submatrix among the predictors and
// Sigma[P, Y] is the vector of predictor-outcome covariances. The partial
// coefficient on X is the entry of beta_P aligned with X.

import { solveLinearSystem, submatrix, type Matrix, type Vector } from './linalg';

/**
 * OLS coefficients for regressing the variable at `yIdx` on the predictors at
 * `predictorIdx`. The returned vector is aligned positionally with
 * `predictorIdx`.
 */
export function regressionCoefficients(
	sigma: Matrix,
	yIdx: number,
	predictorIdx: number[]
): Vector {
	if (predictorIdx.length === 0) return [];
	const sigmaPP = submatrix(sigma, predictorIdx, predictorIdx);
	const sigmaPY = predictorIdx.map((p) => sigma[p][yIdx]);
	return solveLinearSystem(sigmaPP, sigmaPY);
}

/**
 * The partial (mutually-adjusted) coefficient on `xIdx` from a regression of
 * `yIdx` on `xIdx` together with the adjustment set `adjustIdx`. With an empty
 * adjustment set this reduces to the marginal slope.
 */
export function partialCoefficient(
	sigma: Matrix,
	yIdx: number,
	xIdx: number,
	adjustIdx: number[]
): number {
	const predictors = [xIdx, ...adjustIdx];
	const beta = regressionCoefficients(sigma, yIdx, predictors);
	return beta[0];
}

/** The marginal slope of `yIdx` on `xIdx`: Cov(X, Y) / Var(X). */
export function marginalSlope(sigma: Matrix, yIdx: number, xIdx: number): number {
	return sigma[xIdx][yIdx] / sigma[xIdx][xIdx];
}

/** Ordinary least squares slope of `y` on `x` for paired sample arrays. */
export function sampleSlope(x: number[], y: number[]): number {
	const n = x.length;
	const mx = x.reduce((a, b) => a + b, 0) / n;
	const my = y.reduce((a, b) => a + b, 0) / n;
	let sxy = 0;
	let sxx = 0;
	for (let i = 0; i < n; i++) {
		sxy += (x[i] - mx) * (y[i] - my);
		sxx += (x[i] - mx) ** 2;
	}
	return sxy / sxx;
}
