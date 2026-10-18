// Number formats for the inference readouts, shared by the test tabs and the
// 3D labels so one quantity never reads two ways.
import { format } from 'd3-format';

// A snapped mean is a whole number only up to float noise (104 ± 1e-14),
// which would print as a tiny nonzero statistic at μ₀ = μ̂.
const clean = (x: number) => (Math.abs(x) < 1e-9 ? 0 : x);
// p significant figures, but whole numbers in full: d3's own `n` type
// switches to exponents (7.2e+2) once the integer part outgrows p.
const sig = (p: number) => (x: number) => {
	x = clean(x);
	if (x === 0) return '0';
	const intDigits = Math.floor(Math.log10(Math.abs(x))) + 1;
	return format(`.${Math.max(0, p - intDigits)}~f`)(x);
};

/** Score and information: two significant figures (they span ~0.01–10). */
export const fScore = sig(2);
/** Test statistics and standard error: three significant figures. */
export const fStat = sig(3);
/** Data-scale values (μ̂, μ₀, σ̂₀²): up to two decimals, trailing zeros dropped. */
export const fData = format('.2~f');
