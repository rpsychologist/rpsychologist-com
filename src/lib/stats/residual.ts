// The Frisch-Waugh-Lovell identity made manipulable. The mutually-adjusted slope
// of harm (Y) on income (X) equals the slope of Y on X *after each has been
// stripped of its linear dependence on the covariate* Z -- here a single
// comorbidity burden standing in for the cluster of psychiatric comorbidities the
// full model adjusts for. Residualize X on Z, residualize Y on Z, scatter the two
// residual sets, and the fitted line is exactly the partial coefficient.
//
// The reader controls Z's two confounding legs: how strongly it tracks income
// (rXZ) and how strongly it tracks harm (rYZ). The income-harm correlation rXY is
// fixed at the scenario's marginal value, so the marginal slope is a stable
// reference the residual slope rotates away from.
//
// Column order is (X, Y, Z). This ordering is deliberate: with `choleskyLower`,
// X = n0 and Y = rXY*n0 + sqrt(1 - rXY^2)*n1 depend only on the fixed rXY, so the
// raw (X, Y) cloud is invariant to both sliders. Only Z moves as the sliders
// change -- dragging a slider changes how the shadow Z relates to a fixed income
// and harm, which is exactly the mental model the figure wants to convey.

import { isPositiveDefinite, type Matrix } from "./linalg";
import { standardNormalMatrix } from "./sample";
import { sampleSlope } from "./regression";
import { coefficientScenario } from "./scenarios";

export interface ResidualParams {
  /** income-harm correlation; the fixed marginal reference. */
  rXY: number;
  /** comorbidity-income correlation (slider). */
  rXZ: number;
  /** comorbidity-harm correlation (slider). */
  rYZ: number;
}

export const residualDefaults: ResidualParams = {
  rXY: -0.48,
  rXZ: -0.46,
  rYZ: 0.52
};

export const residualRanges = {
  rXZ: [-0.8, 0.05] as [number, number],
  rYZ: [-0.05, 0.8] as [number, number]
};

// Column indices in the (X, Y, Z) covariance matrix.
export const residIndex = { X: 0, Y: 1, Z: 2 } as const;

/** Display metadata: income and harm reuse the running example; Z is collapsed to
 *  a single comorbidity-burden covariate for legibility. */
export const residualMeta = {
  exposure: coefficientScenario.exposure,
  outcome: coefficientScenario.outcome,
  covariate: {
    symbol: "Z",
    label: "Comorbidity burden",
    token: "comorbidity",
    gloss: "a single psychiatric-comorbidity index standing in for the covariate cluster"
  }
};

/** The standardized 3x3 correlation matrix over (X, Y, Z). */
export function buildResidualSigma({ rXY, rXZ, rYZ }: ResidualParams): Matrix {
  return [
    [1, rXY, rXZ],
    [rXY, 1, rYZ],
    [rXZ, rYZ, 1]
  ];
}

/**
 * Closed-form partial (residual) slope of Y on X adjusting for Z, for the
 * standardized system: (rXY - rXZ*rYZ) / (1 - rXZ^2). Equal to the population
 * partial coefficient from the regression of Y on (X, Z).
 */
export function residualSlope({ rXY, rXZ, rYZ }: ResidualParams): number {
  return (rXY - rXZ * rYZ) / (1 - rXZ * rXZ);
}

export interface ResidualPoint {
  xRaw: number;
  yRaw: number;
  z: number;
  xResid: number;
  yResid: number;
}

export interface ResidualData {
  points: ResidualPoint[];
  /** marginal slope of Y on X, equal to rXY. */
  marginalSlope: number;
  /** closed-form partial slope (exact population value). */
  residualSlopePop: number;
  /** slope fitted to the residual cloud -- passes through the drawn points. */
  residualSlopeSample: number;
  /** sample slopes used to residualize each variable on Z. */
  bX: number;
  bY: number;
}

const N = 320;

// Per-frame work is the hot path: the figure recomputes the cloud on every slider
// move. The Cholesky column order (X, Y, Z) makes X = n0 and Y = rXY*n0 +
// sqrt(1-rXY^2)*n1 depend only on the fixed rXY, so the standard normals and the
// raw (income, harm) coordinates are constant across slider moves. We draw them
// once and cache by (seed, N, rXY); each frame only recomputes the three Z-row
// Cholesky scalars and the residuals -- no Box-Muller, no full matvec, no resample.
interface ResidualBase {
  n0: Float64Array;
  n1: Float64Array;
  n2: Float64Array;
  xRaw: Float64Array;
  yRaw: Float64Array;
}

const baseCache = new Map<string, ResidualBase>();

function residualBase(rXY: number, seed: number, n: number): ResidualBase {
  const key = `${seed}:${n}:${rXY}`;
  const cached = baseCache.get(key);
  if (cached) return cached;

  const draws = standardNormalMatrix(n, 3, seed);
  const n0 = new Float64Array(n);
  const n1 = new Float64Array(n);
  const n2 = new Float64Array(n);
  const xRaw = new Float64Array(n);
  const yRaw = new Float64Array(n);
  const c = Math.sqrt(1 - rXY * rXY); // L[1][1]
  for (let i = 0; i < n; i++) {
    const row = draws[i];
    n0[i] = row[0];
    n1[i] = row[1];
    n2[i] = row[2];
    xRaw[i] = row[0]; // L[0] = [1, 0, 0]  ->  X = n0
    yRaw[i] = rXY * row[0] + c * row[1]; // L[1] = [rXY, sqrt(1-rXY^2), 0]
  }

  const base: ResidualBase = { n0, n1, n2, xRaw, yRaw };
  baseCache.set(key, base);
  return base;
}

export interface ResidualPositions {
  /** raw (slider-invariant) coordinates and the per-frame residual cloud. */
  xRaw: Float64Array;
  yRaw: Float64Array;
  z: Float64Array;
  xResid: Float64Array;
  yResid: Float64Array;
}

/**
 * The point cloud for the figure: raw (income, harm), the comorbidity Z, and the
 * residuals after stripping Z out of each. The lean per-frame path -- it reuses the
 * cached base and only recomputes Z and the residuals. Numerically identical to the
 * coordinates `makeResidualData` produces.
 */
export function residualPositions(params: ResidualParams, seed = 7): ResidualPositions {
  const { rXY, rXZ, rYZ } = params;
  const base = residualBase(rXY, seed, N);
  const { n0, n1, n2, xRaw, yRaw } = base;
  const n = n0.length;

  // Z-row of the Cholesky factor of [[1,rXY,rXZ],[rXY,1,rYZ],[rXZ,rYZ,1]].
  const c = Math.sqrt(1 - rXY * rXY);
  const L21 = (rYZ - rXY * rXZ) / c;
  const L22 = Math.sqrt(Math.max(0, 1 - rXZ * rXZ - L21 * L21));

  const z = new Float64Array(n);
  const xResid = new Float64Array(n);
  const yResid = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    // Residualize on Z with the population slopes (rXZ, rYZ): standardized, the
    // slope of each variable on Z is just its correlation, so this is exact.
    const zi = rXZ * n0[i] + L21 * n1[i] + L22 * n2[i];
    z[i] = zi;
    xResid[i] = xRaw[i] - rXZ * zi;
    yResid[i] = yRaw[i] - rYZ * zi;
  }
  return { xRaw, yRaw, z, xResid, yResid };
}

/**
 * Draw a seeded sample from the (X, Y, Z) population, residualize X and Y on Z, and
 * return both clouds plus the relevant slopes. Used by the tests; the figure renders
 * directly from the lighter `residualPositions`.
 */
export function makeResidualData(params: ResidualParams, seed = 7): ResidualData {
  const pos = residualPositions(params, seed);
  const n = pos.z.length;
  const points: ResidualPoint[] = new Array(n);
  for (let i = 0; i < n; i++) {
    points[i] = {
      xRaw: pos.xRaw[i],
      yRaw: pos.yRaw[i],
      z: pos.z[i],
      xResid: pos.xResid[i],
      yResid: pos.yResid[i]
    };
  }

  return {
    points,
    marginalSlope: params.rXY,
    residualSlopePop: residualSlope(params),
    residualSlopeSample: sampleSlope(
      points.map((p) => p.xResid),
      points.map((p) => p.yResid)
    ),
    bX: params.rXZ,
    bY: params.rYZ
  };
}

/** Whether the parameter set yields a valid (positive-definite) population. */
export function residualParamsValid(params: ResidualParams): boolean {
  return isPositiveDefinite(buildResidualSigma(params));
}
