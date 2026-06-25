// Deterministic generation of standard-normal draws. The seeded RNG keeps the
// figures reproducible across reloads and builds.

/** Mulberry32: a tiny, fast, deterministic PRNG seeded by a 32-bit integer. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draws via the Box-Muller transform, fed by `rand`. */
function standardNormals(rand: () => number, n: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const r = Math.sqrt(-2 * Math.log(u1));
    out[i] = r * Math.cos(2 * Math.PI * u2);
    if (i + 1 < n) out[i + 1] = r * Math.sin(2 * Math.PI * u2);
  }
  return out;
}

/**
 * A `rows x cols` matrix of independent standard-normal draws. Deterministic
 * given `seed`.
 */
export function standardNormalMatrix(rows: number, cols: number, seed = 1): number[][] {
  const rand = mulberry32(seed);
  const out: number[][] = [];
  for (let i = 0; i < rows; i++) out.push(standardNormals(rand, cols));
  return out;
}
