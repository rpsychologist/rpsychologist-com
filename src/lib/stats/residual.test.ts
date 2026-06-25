import { describe, expect, it } from "vitest";
import { partialCoefficient } from "./regression";
import { isPositiveDefinite } from "./linalg";
import {
  buildResidualSigma,
  makeResidualData,
  residualDefaults,
  residualRanges,
  residualSlope,
  residIndex,
  type ResidualParams
} from "./residual";

describe("residual scatter (Frisch-Waugh-Lovell)", () => {
  it("the marginal slope is the fixed income-harm correlation", () => {
    expect(makeResidualData(residualDefaults).marginalSlope).toBe(-0.48);
  });

  it("the default residual slope collapses partway, not past zero", () => {
    // (rXY - rXZ*rYZ) / (1 - rXZ^2) = (-0.48 - (-0.46)(0.52)) / (1 - 0.46^2).
    // One covariate flattens the -0.48 gradient only to about -0.31 -- it does
    // not yet flip, mirroring the under-adjustment story in cells.ts.
    expect(residualSlope(residualDefaults)).toBeCloseTo(-0.305, 3);
  });

  it("zeroing the income leg returns the slope to the marginal exactly", () => {
    expect(residualSlope({ rXY: -0.48, rXZ: 0, rYZ: 0.52 })).toBe(-0.48);
  });

  it("zeroing the harm leg steepens rather than returns the slope (suppression)", () => {
    // With rYZ = 0 but rXZ != 0 the residual covariance is unchanged but X's
    // residual variance shrinks, so |slope| EXCEEDS the marginal. Do not mistake
    // this for the slope returning to its marginal value.
    const s = residualSlope({ rXY: -0.48, rXZ: -0.46, rYZ: 0 });
    expect(s).toBeCloseTo(-0.609, 3);
    expect(Math.abs(s)).toBeGreaterThan(0.48);
  });

  it("strong-enough confounding flips the sign past zero", () => {
    const s = residualSlope({ rXY: -0.48, rXZ: -0.8, rYZ: 0.8 });
    expect(s).toBeGreaterThan(0);
    expect(s).toBeCloseTo(0.444, 3);
  });

  it("the closed form equals the population partial coefficient on a grid", () => {
    const grid: ResidualParams[] = [];
    for (const rXZ of [-0.8, -0.46, -0.2, 0.05]) {
      for (const rYZ of [-0.05, 0.2, 0.52, 0.8]) {
        grid.push({ rXY: -0.48, rXZ, rYZ });
      }
    }
    for (const p of grid) {
      const sigma = buildResidualSigma(p);
      const partial = partialCoefficient(sigma, residIndex.Y, residIndex.X, [residIndex.Z]);
      expect(residualSlope(p)).toBeCloseTo(partial, 10);
    }
  });

  it("the fitted residual line tracks the population partial slope", () => {
    const data = makeResidualData(residualDefaults);
    expect(data.residualSlopeSample).toBeCloseTo(data.residualSlopePop, 1);
  });

  it("the raw cloud is invariant to both sliders (Cholesky ordering)", () => {
    // X and Y are generated from the first two Cholesky factors using only the
    // fixed rXY, so dragging either slider must leave the raw (income, harm)
    // positions untouched -- only the residualized positions may move.
    const a = makeResidualData(residualDefaults);
    const b = makeResidualData({ rXY: -0.48, rXZ: -0.8, rYZ: 0.8 });
    for (let i = 0; i < a.points.length; i++) {
      expect(b.points[i].xRaw).toBeCloseTo(a.points[i].xRaw, 12);
      expect(b.points[i].yRaw).toBeCloseTo(a.points[i].yRaw, 12);
    }
    // ...while the residual positions genuinely respond to the sliders.
    const moved = a.points.some(
      (p, i) => Math.abs(p.xResid - b.points[i].xResid) > 0.1
    );
    expect(moved).toBe(true);
  });

  it("the population is positive definite across the slider box", () => {
    const [xMin, xMax] = residualRanges.rXZ;
    const [yMin, yMax] = residualRanges.rYZ;
    for (const rXZ of [xMin, xMax]) {
      for (const rYZ of [yMin, yMax]) {
        expect(isPositiveDefinite(buildResidualSigma({ rXY: -0.48, rXZ, rYZ }))).toBe(true);
      }
    }
  });
});
