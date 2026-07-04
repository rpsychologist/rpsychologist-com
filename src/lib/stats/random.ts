// Unseeded normal draws for the interactive viz apps (replaces d3-random).
// Deliberately NOT seeded: the old correlation app drew a fresh sample on
// every load, and "New Sample" must actually produce a new sample. For the
// deterministic draws used by the essay figures, see stats/sample.ts.

/** `n` independent draws from N(mean, sd) via the Box-Muller transform. */
export function drawGaussian(n: number, mean: number, sd: number): number[] {
	const out = new Array<number>(n);
	for (let i = 0; i < n; i += 2) {
		const u1 = Math.max(Math.random(), 1e-12);
		const u2 = Math.random();
		const r = Math.sqrt(-2 * Math.log(u1));
		out[i] = mean + sd * r * Math.cos(2 * Math.PI * u2);
		if (i + 1 < n) out[i + 1] = mean + sd * r * Math.sin(2 * Math.PI * u2);
	}
	return out;
}
