// Small, dependency-free linear algebra for the regression demonstrations.
// Everything here operates on plain number[][] (row-major) and number[].
// The matrices involved are tiny (at most ~6x6), so clarity beats cleverness.

export type Matrix = number[][];
export type Vector = number[];

/**
 * Solve the linear system `A x = b` by Gaussian elimination with partial
 * pivoting. `A` must be square and non-singular; throws otherwise.
 */
export function solveLinearSystem(A: Matrix, b: Vector): Vector {
  const n = A.length;
  if (n === 0) return [];
  if (A.some((row) => row.length !== n) || b.length !== n) {
    throw new Error("solveLinearSystem: dimensions do not match.");
  }

  // Work on an augmented copy so the inputs are not mutated.
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot: find the row with the largest magnitude in this column.
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) {
      throw new Error("solveLinearSystem: matrix is singular or ill-conditioned.");
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    // Eliminate below.
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= factor * M[col][k];
    }
  }

  // Back-substitution.
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = M[row][n];
    for (let k = row + 1; k < n; k++) sum -= M[row][k] * x[k];
    x[row] = sum / M[row][row];
  }
  return x;
}

/** Select the principal submatrix of `M` indexed by `idx` (rows and columns). */
export function submatrix(M: Matrix, rowIdx: number[], colIdx: number[]): Matrix {
  return rowIdx.map((r) => colIdx.map((c) => M[r][c]));
}

/** Select the entries of `v` indexed by `idx`. */
export function subvector(v: Vector, idx: number[]): Vector {
  return idx.map((i) => v[i]);
}

/**
 * Lower-triangular Cholesky factor `L` of a symmetric positive-definite matrix
 * `M`, such that `L L^T = M`. Throws if `M` is not positive definite.
 */
export function choleskyLower(M: Matrix): Matrix {
  const n = M.length;
  const L: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = M[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      if (i === j) {
        if (sum <= 1e-12) {
          throw new Error("choleskyLower: matrix is not positive definite.");
        }
        L[i][j] = Math.sqrt(sum);
      } else {
        L[i][j] = sum / L[j][j];
      }
    }
  }
  return L;
}

/** Returns true if `M` is symmetric positive definite. */
export function isPositiveDefinite(M: Matrix): boolean {
  try {
    choleskyLower(M);
    return true;
  } catch {
    return false;
  }
}
