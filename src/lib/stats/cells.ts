// Escalation of the conditioning idea to several covariates. Adjusting for a
// covariate means comparing only within its levels; adjusting for several means
// comparing only within the cross-classification of all of them. Here the
// covariates are the psychiatric comorbidities -- distress, substance use, and
// social isolation -- that track both lower income and more gambling harm, so
// conditioning on more of them strips out the income gradient and the within-cell
// slope collapses toward zero -- while the cells multiply (2^k) and empty out,
// until "the disparity holding all of these fixed" rests on a handful of people.
//
// This is the SAME population as the specification curve: the sample is drawn
// from the `sigma` correlation structure in `scenarios.ts`, and the three
// covariates are then dichotomized at their medians to form binary strata.
// Income (x) and gambling harm (y) stay continuous. Binning the covariates is a
// deliberately looser adjustment than the continuous partial coefficient, so the
// within-cell slope shrinks toward zero but does not reach the continuous
// fully-adjusted value -- residual confounding survives inside each cell. That
// gap is itself part of the argument: how you operationalize "adjust" is a free
// choice that changes the number.

import { coefficientScenario, coefIndex } from "./scenarios";
import { choleskyLower } from "./linalg";
import { standardNormalMatrix } from "./sample";
import { sampleSlope } from "./regression";

export interface CellPoint {
  x: number;
  y: number;
  levels: number[]; // 0/1 for each covariate (1 = the higher-comorbidity level)
}

export interface CovariateMeta {
  key: string;
  label: string;
  /** labels for level 0 and level 1, e.g. ["employed", "unemployed"]. */
  levelLabels: [string, string];
  /** phrase used in the running question, e.g. "the same level of distress". */
  phrase: string;
}

export const cellCovariates: CovariateMeta[] = [
  {
    key: "distress",
    label: "Distress",
    levelLabels: ["low", "high"],
    phrase: "the same level of distress"
  },
  {
    key: "substance",
    label: "Substance use",
    levelLabels: ["none", "heavy"],
    phrase: "the same substance use"
  },
  {
    key: "isolation",
    label: "Isolation",
    levelLabels: ["connected", "isolated"],
    phrase: "the same social support"
  }
];

const N = 360;

export interface Cell {
  /** levels of the selected covariates that define this cell */
  combo: number[];
  points: CellPoint[];
}

export function makeCellsData(seed = 5): CellPoint[] {
  // Draw correlated standard normals with covariance `sigma` (column order
  // Y, X, Z1, Z2, Z3), then dichotomize each comorbidity at its median (0). The
  // income (x) and harm (y) stay continuous; only the covariates are binned.
  const sigma = coefficientScenario.sigma;
  const L = choleskyLower(sigma);
  const z = standardNormalMatrix(N, sigma.length, seed);
  return z.map((row) => {
    const v = L.map((Li) => Li.reduce((s, lij, j) => s + lij * row[j], 0));
    return {
      x: v[coefIndex.X],
      y: v[coefIndex.Y],
      levels: [
        v[coefIndex.Z1] > 0 ? 1 : 0,
        v[coefIndex.Z2] > 0 ? 1 : 0,
        v[coefIndex.Z3] > 0 ? 1 : 0
      ]
    };
  });
}

/** Group points into cells by the levels of the selected covariate indices. */
export function groupIntoCells(points: CellPoint[], selected: number[]): Cell[] {
  if (selected.length === 0) return [{ combo: [], points }];
  const map = new Map<string, Cell>();
  for (const p of points) {
    const combo = selected.map((i) => p.levels[i]);
    const key = combo.join("");
    let cell = map.get(key);
    if (!cell) {
      cell = { combo, points: [] };
      map.set(key, cell);
    }
    cell.points.push(p);
  }
  // Order by combo (ascending severity then lexicographic) for a stable grid.
  return [...map.values()].sort((a, b) => {
    const sa = a.combo.reduce((s, v) => s + v, 0);
    const sb = b.combo.reduce((s, v) => s + v, 0);
    return sa - sb || a.combo.join("").localeCompare(b.combo.join(""));
  });
}

/** Pooled (marginal) slope, ignoring all covariates. */
export function pooledSlope(points: CellPoint[]): number {
  return sampleSlope(points.map((p) => p.x), points.map((p) => p.y));
}

/** Common within-cell (fixed-effects) slope over the cross-classification. */
export function withinCellSlope(points: CellPoint[], selected: number[]): number {
  const cells = groupIntoCells(points, selected);
  let num = 0;
  let den = 0;
  for (const cell of cells) {
    const mx = cell.points.reduce((s, p) => s + p.x, 0) / cell.points.length;
    const my = cell.points.reduce((s, p) => s + p.y, 0) / cell.points.length;
    for (const p of cell.points) {
      num += (p.x - mx) * (p.y - my);
      den += (p.x - mx) ** 2;
    }
  }
  return num / den;
}
